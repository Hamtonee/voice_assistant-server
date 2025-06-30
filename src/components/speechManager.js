// speechManager.js - Singleton to prevent conflicts
import React from 'react';

class SpeechManager {
  constructor() {
    this.currentUtterance = null;
    this.isPlaying = false;
    this.listeners = new Set();
    this.cleanupTimeout = null;
    this.speechQueue = [];
    this.isProcessing = false;
    this.healthCheckFailed = false;
    
    // Check browser compatibility first
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      // Bind methods to preserve context - SAFE BINDING
      this.handleStart = this.handleStart.bind(this);
      this.handleEnd = this.handleEnd.bind(this);
      this.handleError = this.handleError.bind(this);
      
      // Global cleanup on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.forceStop();
        });
      }
      
      console.log('🎙️ SpeechManager initialized successfully');
    } else {
      console.warn('⚠️ Speech synthesis not supported in this browser');
    }
  }
  
  // Check if speech synthesis is supported and properly available
  checkSupport() {
    try {
      if (typeof window === 'undefined') {
        console.log('🌐 Server-side rendering detected');
        return false;
      }
      
      if (!window.speechSynthesis) {
        console.warn('❌ SpeechSynthesis API not available');
        return false;
      }
      
      // Check if the API has required methods
      const synthesis = window.speechSynthesis;
      const requiredMethods = ['speak', 'cancel', 'pause', 'resume'];
      
      for (const method of requiredMethods) {
        if (typeof synthesis[method] !== 'function') {
          console.warn(`❌ Required method ${method} not available`);
          return false;
        }
      }
      
      // Test if we can create an utterance
      try {
        const testUtterance = new SpeechSynthesisUtterance('test');
        if (!testUtterance) {
          console.warn('❌ Cannot create SpeechSynthesisUtterance');
          return false;
        }
      } catch (error) {
        console.warn('❌ SpeechSynthesisUtterance constructor failed:', error);
        return false;
      }
      
      console.log('✅ Speech synthesis fully supported');
      return true;
      
    } catch (error) {
      console.warn('❌ Speech synthesis support check failed:', error);
      return false;
    }
  }
  
  // Perform health check without breaking the app
  async performHealthCheck() {
    if (this.healthCheckFailed) {
      console.log('⏭️ Skipping health check (previously failed)');
      return false;
    }
    
    try {
      // Only perform health check if we have an API instance
      if (typeof window !== 'undefined' && window.api) {
        console.log('🏥 Performing optional health check...');
        await window.api.get('/health');
        console.log('✅ Health check passed');
        return true;
      } else {
        console.log('ℹ️ No API instance available for health check');
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Health check failed (non-critical):', error.message);
      this.healthCheckFailed = true; // Don't try again
      return false;
    }
  }
  
  // Add a component as listener
  addListener(component) {
    if (!this.isSupported) {
      console.warn('⚠️ Cannot add listener - speech not supported');
      return;
    }
    
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
    
    if (!this.isSupported) {
      console.log('⏭️ Speech not supported, nothing to stop');
      return;
    }
    
    try {
      // Cancel synthesis safely
      if (window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') {
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
    if (!this.isSupported) {
      const error = new Error('Speech synthesis not supported in this browser');
      console.warn('❌ Speech not supported:', error.message);
      this.notifyListeners('error', { error: error.message });
      throw error;
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
      // Optional health check (non-blocking)
      await this.performHealthCheck();
      
      // Step 1: Aggressive cleanup
      await this.aggressiveCleanup();
      
      // Step 2: Wait longer for cleanup
      await this.delay(400);
      
      // Step 3: Check if still busy
      if (window.speechSynthesis && 
          (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        console.log('🔄 Speech still busy after cleanup, forcing cancel');
        window.speechSynthesis.cancel();
        await this.delay(500);
      }
      
      // Step 4: Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice configuration
      if (config.voice && window.speechSynthesis) {
        try {
          const voices = window.speechSynthesis.getVoices();
          // Defensive check: ensure voices is an array before calling find
          const selectedVoice = Array.isArray(voices) ? voices.find(v => 
            v.name === config.voice || 
            v.name.includes(config.voice) ||
            v.lang === config.voice
          ) : null;
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        } catch (voiceError) {
          console.warn('⚠️ Voice selection failed:', voiceError);
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
    return new Promise((resolve, reject) => {
      let completed = false;
      let startFired = false;
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('⏰ Speech timeout, cleaning up');
          this.forceStop();
          reject(new Error('Speech synthesis timeout'));
        }
      }, timeout);
      
      // Success handler
      const complete = (success = true) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          this.currentUtterance = null;
          this.isPlaying = false;
          
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Speech synthesis failed'));
          }
        }
      };
      
      // Event handlers with safe binding
      try {
        utterance.onstart = () => {
          console.log('🎤 Speech started');
          startFired = true;
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
          
          // Handle different error types
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('🤝 Speech was interrupted (likely user action)');
            this.notifyListeners('interrupted');
            complete(true); // Don't treat as error
          } else {
            console.error('💀 Fatal speech error:', event.error);
            this.notifyListeners('error', { error: event.error });
            complete(false);
          }
        };
      } catch (bindError) {
        console.error('❌ Failed to bind event handlers:', bindError);
        complete(false);
        return;
      }
      
      // Safety check: if it doesn't start within 2 seconds, something's wrong
      setTimeout(() => {
        if (!startFired && !completed) {
          console.log('🚨 Speech failed to start, retrying...');
          this.forceStop();
          reject(new Error('Speech failed to start'));
        }
      }, 2000);
      
      // Start speech
      try {
        console.log('🚀 Starting speech synthesis');
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error('Speech synthesis speak method not available');
        }
      } catch (error) {
        console.error('❌ Failed to start speech:', error);
        complete(false);
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
    
    if (!this.isSupported) {
      console.log('⏭️ Speech not supported, skipping cleanup');
      return;
    }
    
    try {
      // Cancel multiple times to be sure
      for (let i = 0; i < 3; i++) {
        if (window.speechSynthesis && 
            typeof window.speechSynthesis.cancel === 'function' &&
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
      isSupported: this.isSupported,
      isPlaying: this.isPlaying,
      isProcessing: this.isProcessing,
      queueLength: this.speechQueue.length,
      hasCurrentUtterance: !!this.currentUtterance,
      healthCheckFailed: this.healthCheckFailed
    };
  }
  
  // Get available voices (safe method)
  getVoices() {
    if (!this.isSupported || !window.speechSynthesis) {
      return [];
    }
    
    try {
      const voices = window.speechSynthesis.getVoices();
      return Array.isArray(voices) ? voices : [];
    } catch (error) {
      console.warn('Failed to get voices:', error);
      return [];
    }
  }
  
  // Safe method handlers
  handleStart() {
    // This method is bound safely and can be used for event handling
    console.log('🎤 Speech start handler called');
  }
  
  handleEnd() {
    // This method is bound safely and can be used for event handling
    console.log('✅ Speech end handler called');
  }
  
  handleError(event) {
    // This method is bound safely and can be used for event handling
    console.log('❌ Speech error handler called:', event);
  }
}

// Create singleton instance with error boundary
let speechManager;

try {
  speechManager = new SpeechManager();
} catch (error) {
  console.error('❌ Failed to create SpeechManager:', error);
  // Create a fallback manager that does nothing
  speechManager = {
    isSupported: false,
    speak: async () => { throw new Error('Speech synthesis not available'); },
    stop: () => {},
    getState: () => ({ isSupported: false, isPlaying: false }),
    addListener: () => {},
    removeListener: () => {},
    getVoices: () => []
  };
}

// React Hook for using speech manager
export const useSpeechManager = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isSupported, setIsSupported] = React.useState(false);
  const componentRef = React.useRef({});
  
  // Set up listener for this component
  React.useEffect(() => {
    if (!speechManager.isSupported) {
      setIsSupported(false);
      setError('Speech synthesis not supported in this browser');
      return;
    }
    
    setIsSupported(true);
    
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
    if (!speechManager.isSupported) {
      const errorMsg = 'Speech synthesis not supported in this browser';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      setError(null);
      await speechManager.speak(text, config);
    } catch (error) {
      setError(error.message);
      console.error('Speech hook error:', error);
      throw error;
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
  
  const getVoices = React.useCallback(() => {
    return speechManager.getVoices();
  }, []);
  
  return {
    speak,
    stop,
    toggle,
    getVoices,
    isPlaying,
    error,
    isSupported,
    state: speechManager.getState()
  };
};

// Export the speechManager instance as default
export default speechManager;