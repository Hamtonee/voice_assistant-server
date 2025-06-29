import api from '../api';
import { handleApiError, logError, createError } from '../utils/errorHandler';

// Constants
const ENDPOINTS = {
    TTS: '/tts',  // Updated endpoint
    VOICES: '/voices'
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
        this.browserSynth = window.speechSynthesis;
        this.initializeTTS();
    }

    async initializeTTS() {
        try {
            // Try server TTS first
            const response = await api.get('/health', { timeout: 5000 });
            this.isBrowserTTS = !response.data?.tts_available;
        } catch (error) {
            logError(error, 'TTS Service Initialization');
            this.isBrowserTTS = true;
        }

        // Initialize browser TTS as fallback
        if (this.isBrowserTTS && this.browserSynth) {
            // Pre-load voices
            this.browserSynth.getVoices();
        }
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
            console.error('Browser TTS not available');
            return;
        }

        // Cancel any ongoing speech
        this.browserSynth.cancel();

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configure utterance
                utterance.rate = options.rate || 1;
                utterance.pitch = options.pitch || 1;
                utterance.volume = options.volume || 1;
                
                // Try to match requested voice
                if (options.voice) {
                    const voices = this.browserSynth.getVoices();
                    const voice = voices.find(v => 
                        v.name.toLowerCase().includes(options.voice.toLowerCase())
                    );
                    if (voice) utterance.voice = voice;
                }

                utterance.onend = resolve;
                utterance.onerror = reject;
                
                this.browserSynth.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    stop() {
        if (this.isBrowserTTS && this.browserSynth) {
            this.browserSynth.cancel();
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
            if (!window.speechSynthesis) {
                reject(new Error('Browser TTS not available'));
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => resolve({ success: true, source: 'browser' });
            utterance.onerror = (event) => reject(new Error(`Browser TTS failed: ${event.error}`));

            window.speechSynthesis.speak(utterance);
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
            // Simple test to check if TTS service is available
            // Try to make a basic request to the API to test connectivity
            const testResponse = await api.get('/health', { timeout: 5000 });
            return testResponse.status === 200;
        } catch (error) {
            console.warn('TTS status check failed, falling back to browser TTS:', error);
            // Check if browser TTS is available as fallback
            return !!window.speechSynthesis;
        }
    }
}

const ttsServiceInstance = new TTSService();
export default ttsServiceInstance; 