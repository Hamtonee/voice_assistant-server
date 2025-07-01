// speechManager.js - Singleton to prevent conflicts
import React from 'react';
import TTSService from '../services/TTSService';

class SpeechManager {
  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize properties
      this.currentUtterance = null;
      this.isPlaying = false;
      this.listeners = new Set();
      this.cleanupTimeout = null;
      this.speechQueue = [];
      this.isProcessing = false;
      this.ttsService = null;
      
      // Initialize TTS service
      this.initializeTTS();
      
      // Global cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.forceStop();
      });
      
      console.log('🎙️ SpeechManager initialized');
    } else {
      console.warn('⚠️ SpeechManager initialized in non-browser environment');
    }
  }

  initializeTTS = async () => {
    try {
      this.ttsService = TTSService.getInstance();
      await this.ttsService.initialize();
      console.log('✅ TTS Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TTS Service:', error);
    }
  }
  
  // Add a component as listener
  addListener = (component) => {
    this.listeners.add(component);
    console.log(`📝 Added listener, total: ${this.listeners.size}`);
  }
  
  // Remove a component listener
  removeListener = (component) => {
    this.listeners.delete(component);
    console.log(`🗑️ Removed listener, total: ${this.listeners.size}`);
  }
  
  // Notify all listeners of state changes
  notifyListeners = (event, data = {}) => {
    this.listeners.forEach(listener => {
      if (listener.onSpeechEvent) {
        try {
          listener.onSpeechEvent(event, data);
        } catch (error) {
          console.warn('Listener error:', error);
        }
      }
    });
  }
  
  // Force stop everything - nuclear option
  forceStop = () => {
    console.log('💥 Force stopping all speech synthesis');
    
    try {
      // Stop TTS service
      if (this.ttsService) {
        this.ttsService.stop();
      }
      
      // Clear current utterance
      this.currentUtterance = null;
      this.isPlaying = false;
      this.isProcessing = false;
      this.speechQueue = [];
      
      // Clear any pending timeouts
      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
      }
      
      // Notify listeners
      this.notifyListeners('stopped', { forced: true });
      
    } catch (error) {
      console.error('Force stop error:', error);
    }
  }
  
  // Safe speech synthesis with retry logic
  speak = async (text, config = {}) => {
    if (!this.ttsService) {
      console.warn('⚠️ TTS Service not available');
      return Promise.reject(new Error('TTS Service not available'));
    }

    console.log('🎯 Speech request:', { text: text.substring(0, 50), config });
    
    // Prevent multiple simultaneous requests
    if (this.isProcessing) {
      console.log('⏳ Speech already processing, queuing request');
      return new Promise((resolve) => {
        this.speechQueue.push({ text, config, resolve });
      });
    }
    
    this.isProcessing = true;
    
    try {
      // Step 1: Aggressive cleanup
      await this.aggressiveCleanup();
      
      // Step 2: Wait longer for cleanup
      await this.delay(400);
      
      // Step 3: Speak using TTS service
      this.notifyListeners('start', { text });
      await this.ttsService.speak(text, config);
      this.notifyListeners('end', { text });
      
      return true;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      this.notifyListeners('error', { error: error.message });
      throw error;
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
  
  // Process queued speech requests
  processQueue = async () => {
    if (this.speechQueue.length > 0 && !this.isProcessing) {
      const { text, config, resolve } = this.speechQueue.shift();
      try {
        await this.speak(text, config);
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    }
  }
  
  // Aggressive cleanup of speech synthesis
  aggressiveCleanup = async () => {
    try {
      // Stop current speech
      if (this.ttsService) {
        this.ttsService.stop();
      }
      
      // Clear any pending timeouts
      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
      }
      
      // Wait for cleanup
      await this.delay(200);
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }
  
  // Utility delay function
  delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Stop current speech
  stop = () => {
    if (this.ttsService) {
      this.ttsService.stop();
    }
  }
  
  // Get current state
  getState = () => {
    return {
      isPlaying: this.isPlaying,
      isProcessing: this.isProcessing,
      queueLength: this.speechQueue.length
    };
  }
}

// Create singleton instance
const speechManagerInstance = new SpeechManager();

// React hook for easy access
export const useSpeechManager = () => {
  const handleStateChange = (event, data) => {
    // Handle state changes if needed
  };

  React.useEffect(() => {
    speechManagerInstance.addListener({ onSpeechEvent: handleStateChange });
    return () => {
      speechManagerInstance.removeListener({ onSpeechEvent: handleStateChange });
    };
  }, []);

  return {
    speak: speechManagerInstance.speak,
    stop: speechManagerInstance.stop,
    forceStop: speechManagerInstance.forceStop,
    getState: speechManagerInstance.getState
  };
};

export default speechManagerInstance;