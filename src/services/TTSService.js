import api from '../api';
import { handleApiError, logError, createError } from '../utils/errorHandler';

// Constants
const ENDPOINTS = {
    TTS: '/tts',  // Updated endpoint
    VOICES: '/voices',
    HEALTH: '/health'  // Added health endpoint
};

const defaultVoiceConfig = {
    voiceName: 'en-US-Standard-A',
    languageCode: 'en-US',
    ssmlGender: 'FEMALE',
    profile: 'default',
    pitch: 0,
    speakingRate: 1.0
};

class TTSService {
    constructor() {
        this.audioCache = new Map();
        this.pendingRequests = new Map();
        this.isBrowserTTS = false;
        this.browserSynth = null;
        this.isInitialized = false;
        
        // Initialize asynchronously to avoid constructor issues
        if (typeof window !== 'undefined') {
            // Delay initialization to ensure proper binding
            setTimeout(() => this.initializeTTS(), 100);
        }
    }

    async initializeTTS() {
        if (this.isInitialized) return;
        
        try {
            // Try server TTS first - make health check optional
            try {
                const response = await api.get(ENDPOINTS.HEALTH, { timeout: 5000 });
                this.isBrowserTTS = !response.data?.tts_available;
                console.log('✅ TTS health check successful');
            } catch (healthError) {
                console.warn('⚠️ Health check failed, continuing anyway:', healthError.message);
                // Don't throw - just log and continue with browser TTS
                this.isBrowserTTS = true;
            }
        } catch (error) {
            logError(error, 'TTS Service Initialization');
            this.isBrowserTTS = true;
        }

        // Initialize browser TTS as fallback - with safety checks
        if (this.isBrowserTTS && typeof window !== 'undefined') {
            try {
                // Ensure browserSynth is properly initialized
                this.browserSynth = window.speechSynthesis;
                if (this.browserSynth) {
                    // Pre-load voices safely
                    this.browserSynth.getVoices();
                    
                    // Bind speak method - critical for proper operation
                    if (typeof this.browserSynth.speak === 'function') {
                        this.browserSynth.speak = this.browserSynth.speak.bind(this.browserSynth);
                    } else {
                        console.warn('⚠️ Speech synthesis speak method not available');
                        this.browserSynth = null;
                    }
                }
            } catch (voiceError) {
                console.warn('⚠️ Failed to initialize browser TTS:', voiceError.message);
                this.browserSynth = null;
            }
        }
        
        this.isInitialized = true;
    }

    async speak(text, options = {}) {
        if (!text?.trim()) return;
        
        try {
            if (this.isBrowserTTS) {
                await this.speakWithBrowser(text, options);
            } else {
                await this.speakWithServer(text, options);
            }
        } catch (error) {
            logError(error, 'TTS Speak Operation');
            // Fallback to browser TTS if server fails
            if (!this.isBrowserTTS) {
                this.isBrowserTTS = true;
                await this.speakWithBrowser(text, options);
            } else {
                throw createError('TTS_ERROR', 'Text-to-speech service is currently unavailable', error);
            }
        }
    }

    async speakWithServer(text, options) {
        try {
            const response = await api.post('/tts/synthesize', {
                text,
                ...options
            }, {
                responseType: 'blob'
            });

            const audioBlob = response.data;
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            await new Promise((resolve, reject) => {
                audio.onended = resolve;
                audio.onerror = reject;
                audio.play();
            });

            URL.revokeObjectURL(audioUrl);
        } catch (error) {
            logError(error, 'Server TTS Failed');
            throw createError('TTS_ERROR', 'Server text-to-speech failed', error);
        }
    }

    async speakWithBrowser(text, options = {}) {
        if (!this.browserSynth) {
            throw new Error('Browser TTS not available');
        }

        // Safely cancel any ongoing speech
        try {
            this.browserSynth.cancel();
        } catch (error) {
            console.warn('Failed to cancel speech:', error.message);
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configure utterance
                utterance.rate = options.rate || 1;
                utterance.pitch = options.pitch || 1;
                utterance.volume = options.volume || 1;
                
                // Try to match requested voice - with safety checks
                if (options.voice && this.browserSynth) {
                    try {
                        const voices = this.browserSynth.getVoices();
                        if (voices && voices.length > 0) {
                            const voice = voices.find(v => 
                                v.name.toLowerCase().includes(options.voice.toLowerCase())
                            );
                            if (voice) utterance.voice = voice;
                        }
                    } catch (voiceError) {
                        console.warn('Failed to set voice:', voiceError.message);
                    }
                }

                utterance.onend = resolve;
                utterance.onerror = (event) => {
                    console.error('Browser TTS error:', event);
                    reject(new Error('Speech synthesis failed'));
                };
                
                // Use the bound speak method
                this.browserSynth.speak(utterance);
            } catch (error) {
                console.error('Failed to initialize speech:', error);
                reject(error);
            }
        });
    }

    stop() {
        if (this.isBrowserTTS && this.browserSynth) {
            try {
                this.browserSynth.cancel();
            } catch (error) {
                console.warn('Failed to stop speech:', error.message);
            }
        }
        // Implement server-side stop if needed
    }

    async synthesize(text, voiceConfig = null) {
        try {
            // Check cache first
            const cacheKey = `${text}-${JSON.stringify(voiceConfig)}`;
            if (this.audioCache.has(cacheKey)) {
                console.log('🎵 Using cached TTS audio');
                return this.audioCache.get(cacheKey);
            }

            // Cancel any existing request
            if (this.currentRequest) {
                this.currentRequest.abort();
                this.currentRequest = null;
            }

            // Check if there's a pending request for this text
            if (this.pendingRequests.has(cacheKey)) {
                console.log('🎵 Using pending TTS request');
                return this.pendingRequests.get(cacheKey);
            }

            const controller = new AbortController();
            this.currentRequest = controller;

            // Format voice config to match Google Cloud TTS expectations
            const formattedVoiceConfig = {
                voiceName: voiceConfig?.voiceName || defaultVoiceConfig.voiceName,
                languageCode: voiceConfig?.languageCode || defaultVoiceConfig.languageCode,
                ssmlGender: voiceConfig?.ssmlGender || defaultVoiceConfig.ssmlGender,
                profile: voiceConfig?.profile || defaultVoiceConfig.profile,
                pitch: voiceConfig?.pitch ?? defaultVoiceConfig.pitch,
                speakingRate: voiceConfig?.speakingRate ?? defaultVoiceConfig.speakingRate
            };

            const requestPromise = api.post(ENDPOINTS.TTS, {
                text,
                voice: formattedVoiceConfig
            }, {
                signal: controller.signal,
                timeout: 30000
            });

            // Store the pending request
            this.pendingRequests.set(cacheKey, requestPromise);

            const response = await requestPromise;
            this.currentRequest = null;

            // Extract audio data from response
            const audioData = response.data.audio || response.data.feedbackAudio || response.data.audioContent;
            if (!audioData) {
                throw new Error('No audio data in response');
            }

            // Create audio blob
            const audioBlob = new Blob([
                Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
            ], { type: 'audio/mp3' });

            const audioUrl = URL.createObjectURL(audioBlob);

            // Cache the result
            this.audioCache.set(cacheKey, { audioUrl, blob: audioBlob });
            this.pendingRequests.delete(cacheKey);

            return { audioUrl, blob: audioBlob };
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('🎵 TTS request aborted');
                return null;
            }

            // Handle specific error cases
            if (error.response) {
                const status = error.response.status;
                if (status === 404) {
                    console.error('❌ TTS endpoint not found. Using fallback.');
                    return this.useBrowserTTS(text);
                } else if (status === 429) {
                    console.error('❌ TTS rate limit exceeded');
                    throw new Error('TTS rate limit exceeded. Please try again later.');
                }
            }

            // Network or other errors
            console.error('❌ TTS request failed:', error);
            return this.useBrowserTTS(text);
        }
    }

    async useBrowserTTS(text) {
        return new Promise((resolve, reject) => {
            // Safety check for browser TTS
            if (!window?.speechSynthesis) {
                console.error('Browser TTS not available');
                reject(new Error('Browser TTS not available'));
                return;
            }

            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.onend = () => resolve({ success: true, source: 'browser' });
                utterance.onerror = (event) => reject(new Error(`Browser TTS failed: ${event.error || 'Unknown error'}`));

                // Direct method call (no binding)
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('Browser TTS failed:', error);
                reject(error);
            }
        });
    }

    clearCache() {
        this.audioCache.clear();
        this.pendingRequests.clear();
    }

    cancelCurrentRequest() {
        if (this.currentRequest) {
            this.currentRequest.abort();
            this.currentRequest = null;
        }
    }

    async checkStatus() {
        try {
            // Make health check optional
            try {
                const testResponse = await api.get('/api/health', { timeout: 5000 });
                return testResponse.data;
            } catch (healthError) {
                console.warn('⚠️ TTS health check failed, checking browser fallback:', healthError.message);
            }
            
            // Check if browser TTS is available as fallback
            return typeof window !== 'undefined' && !!window.speechSynthesis;
        } catch (error) {
            console.warn('TTS status check completely failed:', error);
            return false;
        }
    }
}

const ttsServiceInstance = new TTSService();
export default ttsServiceInstance; 