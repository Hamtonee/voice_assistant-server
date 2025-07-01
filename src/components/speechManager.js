// speechManager.js - Singleton to prevent conflicts
import React from 'react';

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
      
      // Bind all methods that need 'this' context
      this.speak = this.speak.bind(this);
      this.stop = this.stop.bind(this);
      this.forceStop = this.forceStop.bind(this);
      this.handleStart = this.handleStart.bind(this);
      this.handleEnd = this.handleEnd.bind(this);
      this.handleError = this.handleError.bind(this);
      this.addListener = this.addListener.bind(this);
      this.removeListener = this.removeListener.bind(this);
      this.notifyListeners = this.notifyListeners.bind(this);
      this.processQueue = this.processQueue.bind(this);
      this.aggressiveCleanup = this.aggressiveCleanup.bind(this);
      
      // Global cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.forceStop();
      });
      
      console.log('🎙️ SpeechManager initialized');
    } else {
      console.warn('⚠️ SpeechManager initialized in non-browser environment');
    }
  }
  
  // Add a component as listener
  addListener(component) {
    this.listeners.add(component);
    console.log(`📝 Added listener, total: ${this.listeners.size}`);
  }
  
  // Remove a component listener
  removeListener(component) {
    this.listeners.delete(component);
    console.log(`🗑️ Removed listener, total: ${this.listeners.size}`);
  }
  
  // Notify all listeners of state changes
  notifyListeners(event, data = {}) {
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
  forceStop() {
    console.log('💥 Force stopping all speech synthesis');
    
    try {
      // Cancel synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
  async speak(text, config = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('⚠️ Speech synthesis not available');
      return Promise.reject(new Error('Speech synthesis not available'));
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
      
      // Step 3: Check if still busy
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log('🔄 Speech still busy after cleanup, forcing cancel');
        window.speechSynthesis.cancel();
        await this.delay(500);
      }
      
      // Step 4: Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice configuration
      if (config.voice) {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (Array.isArray(voices) && voices.length > 0) {
            const selectedVoice = voices.find(v => 
              v.name === config.voice || 
              v.name.includes(config.voice) ||
              v.lang === config.voice
            );
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            } else {
              console.warn(`⚠️ Voice "${config.voice}" not found, using default`);
            }
          } else {
            console.warn('⚠️ No voices available, using default');
          }
        } catch (voiceError) {
          console.warn('⚠️ Error setting voice:', voiceError);
        }
      }
      
      // Apply settings with safe bounds
      if (config.rate) utterance.rate = Math.max(0.1, Math.min(10, config.rate));
      if (config.pitch) utterance.pitch = Math.max(0, Math.min(2, config.pitch));
      if (config.volume) utterance.volume = Math.max(0, Math.min(1, config.volume));
      
      // Step 5: Set up event handlers with timeout protection
      const result = await this.executeWithTimeout(utterance, 30000);
      
      return result;
      
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      this.notifyListeners('error', { error: error.message });
      throw error;
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
  
  // Execute speech with timeout and proper event handling
  executeWithTimeout(utterance, timeout = 30000) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return Promise.reject(new Error('Speech synthesis not available'));
    }

    return new Promise((resolve, reject) => {
      let completed = false;
      let startFired = false;
      let timeoutId = null;
      
      // Safety timeout to prevent hanging
      const safetyTimeout = setTimeout(() => {
        if (!startFired) {
          console.warn('⚠️ Speech synthesis never started, cleaning up');
          cleanup();
          reject(new Error('Speech synthesis failed to start'));
        }
      }, 5000);

      // Main timeout handler
      timeoutId = setTimeout(() => {
        if (!completed) {
          console.log('⏰ Speech timeout, cleaning up');
          cleanup();
          reject(new Error('Speech synthesis timeout'));
        }
      }, timeout);
      
      // Cleanup function
      const cleanup = () => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          clearTimeout(safetyTimeout);
          
          try {
            window.speechSynthesis.cancel();
          } catch (error) {
            console.warn('⚠️ Error during cleanup:', error);
          }
          
          this.currentUtterance = null;
          this.isPlaying = false;
        }
      };
      
      // Success handler
      const complete = (success = true) => {
        if (!completed) {
          cleanup();
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Speech synthesis failed'));
          }
        }
      };
      
      // Event handlers with error protection
      try {
        utterance.onstart = () => {
          console.log('🎤 Speech started');
          startFired = true;
          clearTimeout(safetyTimeout);
          this.isPlaying = true;
          this.currentUtterance = utterance;
          this.notifyListeners('started');
        };
        
        utterance.onend = () => {
          console.log('✅ Speech ended normally');
          this.notifyListeners('ended');
          complete(true);
        };
        
        utterance.onerror = (event) => {
          console.log('❌ Speech error:', event.error);
          this.notifyListeners('error', { error: event.error });
          complete(false);
        };
        
        // Start speech synthesis with retry
        const startSpeech = () => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (error) {
            console.error('Failed to start speech:', error);
            cleanup();
            reject(error);
          }
        };
        
        startSpeech();
        
      } catch (error) {
        console.error('Error setting up speech:', error);
        cleanup();
        reject(error);
      }
    });
  }
  
  // Process queued speech requests
  processQueue() {
    if (this.speechQueue.length > 0 && !this.isProcessing) {
      const { text, config, resolve } = this.speechQueue.shift();
      console.log(`📋 Processing queued speech (${this.speechQueue.length} remaining)`);
      this.speak(text, config).then(resolve).catch(resolve);
    }
  }
  
  // Aggressive cleanup before speech
  async aggressiveCleanup() {
    console.log('🧹 Starting aggressive cleanup');
    
    try {
      // Cancel multiple times to be sure
      for (let i = 0; i < 3; i++) {
        if (typeof window !== 'undefined' && window.speechSynthesis && 
            (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
          window.speechSynthesis.cancel();
          await this.delay(100);
        }
      }
      
      // Clear our tracking
      this.currentUtterance = null;
      this.isPlaying = false;
      
      console.log('✨ Cleanup completed');
      
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }
  
  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Stop current speech
  stop() {
    console.log('🛑 Stop requested');
    this.forceStop();
  }
  
  // Get current state
  getState() {
    return {
      isPlaying: this.isPlaying,
      isProcessing: this.isProcessing,
      queueLength: this.speechQueue.length,
      hasCurrentUtterance: !!this.currentUtterance
    };
  }
}

// Create singleton instance
const speechManager = new SpeechManager();

// React Hook for using speech manager
export const useSpeechManager = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [error, setError] = React.useState(null);
  const componentRef = React.useRef({});
  
  // Set up listener for this component
  React.useEffect(() => {
    const component = {
      onSpeechEvent: (event, data) => {
        console.log('🔔 Speech event:', event, data);
        
        switch (event) {
          case 'started':
            setIsPlaying(true);
            setError(null);
            break;
          case 'ended':
          case 'interrupted':
            setIsPlaying(false);
            break;
          case 'stopped':
            setIsPlaying(false);
            if (data.forced) {
              console.log('Speech was force stopped');
            }
            break;
          case 'error':
            setIsPlaying(false);
            setError(data.error);
            break;
        }
      }
    };
    
    componentRef.current = component;
    speechManager.addListener(component);
    
    return () => {
      speechManager.removeListener(component);
    };
  }, []);
  
  const speak = React.useCallback(async (text, config = {}) => {
    try {
      setError(null);
      await speechManager.speak(text, config);
    } catch (error) {
      setError(error.message);
      console.error('Speech hook error:', error);
    }
  }, []);
  
  const stop = React.useCallback(() => {
    speechManager.stop();
  }, []);
  
  const toggle = React.useCallback((text, config = {}) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text, config);
    }
  }, [isPlaying, speak, stop]);
  
  return {
    speak,
    stop,
    toggle,
    isPlaying,
    error,
    state: speechManager.getState()
  };
};

// Export the speechManager instance as default
export default speechManager;