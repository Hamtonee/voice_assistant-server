import api from '../api';

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

export class TTSService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.currentRequest = null;
        this.audioCache = new Map();
        this.pendingRequests = new Map();
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
}

export default new TTSService(); 