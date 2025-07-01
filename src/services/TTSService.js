import api from '../api';
import { handleApiError, logError, createError } from '../utils/errorHandler';

// Constants
const ENDPOINTS = {
    TTS: '/tts',
    VOICES: '/voices',
    HEALTH: '/health'
};

class TTSService {
    constructor() {
        this.audioCache = new Map();
        this.pendingRequests = new Map();
        this.isBrowserTTS = false;
        this.isInitialized = false;
        this.initPromise = null;
        
        // Don't initialize in constructor
        this.browserSynth = null;
    }

    static getInstance = () => {
        if (!TTSService.instance) {
            TTSService.instance = new TTSService();
        }
        return TTSService.instance;
    }

    initialize = async () => {
        if (this.isInitialized || this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                    // Store reference to speechSynthesis
                    const synth = window.speechSynthesis;
                    
                    // Wait for voices to load
                    await new Promise((resolve) => {
                        const voices = synth.getVoices();
                        if (voices.length > 0) {
                            resolve();
                        } else {
                            synth.onvoiceschanged = () => {
                                resolve();
                            };
                        }
                    });

                    // Only store the reference after successful initialization
                    this.browserSynth = synth;
                    console.log('✅ Browser TTS initialized successfully');
                }

                // Try server TTS
                try {
                    const response = await api.get(ENDPOINTS.HEALTH, { timeout: 5000 });
                    this.isBrowserTTS = !response.data?.tts_available;
                } catch (healthError) {
                    console.warn('⚠️ Health check failed, using browser TTS:', healthError.message);
                    this.isBrowserTTS = true;
                }

                this.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize TTS:', error);
                this.isBrowserTTS = true;
                this.isInitialized = true;
            }
        })();

        return this.initPromise;
    }

    speak = async (text, options = {}) => {
        await this.initialize();
        
        if (!text?.trim()) return;
        
        try {
            if (this.isBrowserTTS) {
                await this.speakWithBrowser(text, options);
            } else {
                await this.speakWithServer(text, options);
            }
        } catch (error) {
            console.error('TTS Speak Operation failed:', error);
            if (!this.isBrowserTTS) {
                this.isBrowserTTS = true;
                await this.speakWithBrowser(text, options);
            } else {
                throw error;
            }
        }
    }

    speakWithBrowser = async (text, options = {}) => {
        if (!this.browserSynth) {
            throw new Error('Browser TTS not available');
        }

        try {
            this.browserSynth.cancel();
        } catch (error) {
            console.warn('Failed to cancel speech:', error);
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                
                utterance.rate = options.rate || 1;
                utterance.pitch = options.pitch || 1;
                utterance.volume = options.volume || 1;
                
                if (options.voice) {
                    const voices = this.browserSynth.getVoices();
                    const voice = voices.find(v => 
                        v.name.toLowerCase().includes(options.voice.toLowerCase())
                    );
                    if (voice) utterance.voice = voice;
                }

                utterance.onend = () => resolve();
                utterance.onerror = (event) => reject(event);

                // Direct method call without binding
                this.browserSynth.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    speakWithServer = async (text, options = {}) => {
        try {
            const response = await api.post(ENDPOINTS.TTS, {
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
            throw error;
        }
    }

    stop = () => {
        if (this.browserSynth) {
            try {
                this.browserSynth.cancel();
            } catch (error) {
                console.warn('Failed to stop speech:', error);
            }
        }
    }

    synthesize = async (text, voiceConfig = null) => {
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
                speakingRate: voiceConfig?.speakingRate ?? defaultVoiceConfig.speakingRate
            };

            // Make the request
            const response = await api.post(ENDPOINTS.TTS, {
                text,
                voiceConfig: formattedVoiceConfig
            }, {
                responseType: 'blob',
                signal: controller.signal
            });

            // Cache the result
            const audioBlob = response.data;
            this.audioCache.set(cacheKey, audioBlob);

            return audioBlob;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('TTS request aborted');
            } else {
                console.error('TTS synthesis failed:', error);
            }
            throw error;
        } finally {
            this.currentRequest = null;
        }
    }

    useBrowserTTS = async (text) => {
        if (!window?.speechSynthesis) {
            throw new Error('Browser TTS not available');
        }

        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Direct method call (no binding)
            window.speechSynthesis.speak(utterance);
            
            return new Promise((resolve, reject) => {
                utterance.onend = resolve;
                utterance.onerror = reject;
            });
        } catch (error) {
            throw error;
        }
    }

    clearCache = () => {
        this.audioCache.clear();
        this.pendingRequests.clear();
    }

    cancelCurrentRequest = () => {
        if (this.currentRequest) {
            this.currentRequest.abort();
            this.currentRequest = null;
        }
    }

    checkStatus = async () => {
        try {
            const response = await api.get(ENDPOINTS.HEALTH);
            return response.data?.tts_available || false;
        } catch (error) {
            return false;
        }
    }

    isBrowserSupported = () => {
        return typeof window !== 'undefined' && !!window.speechSynthesis;
    }
}

export default TTSService;