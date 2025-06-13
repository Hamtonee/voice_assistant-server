import { defaultVoiceConfig } from '../config/voices';

export class TTSService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.currentRequest = null;
        this.lastStatusCheck = 0;
        this.statusCheckInterval = 5000; // 5 seconds between status checks
    }

    async makeTextToSpeechRequest(text, voiceConfig, retryCount = 0) {
        try {
            // Cancel any existing request
            if (this.currentRequest) {
                this.currentRequest.abort();
                this.currentRequest = null;
            }

            // Create abort controller for this request
            const controller = new AbortController();
            this.currentRequest = controller;

            // Set up request timeout
            const timeoutId = setTimeout(() => {
                controller.abort();
                this.currentRequest = null;
            }, 30000);

            const requestBody = {
                text,
                voice: voiceConfig || defaultVoiceConfig,
                voice_profile: 'default'
            };

            console.log('🎵 Sending TTS request:', {
                textLength: text.length,
                voice: requestBody.voice.voiceName,
                profile: requestBody.voice.profile,
                attempt: retryCount + 1
            });

            // Make the request to the correct endpoint
            const response = await fetch(`${this.baseUrl}/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                keepalive: true
            });

            // Clear timeout and current request reference
            clearTimeout(timeoutId);
            this.currentRequest = null;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(`TTS request failed: ${response.status} - ${errorData.detail || 'Unknown error'}`);
            }

            const result = await response.json();
            
            if (result.warning) {
                console.warn('⚠️ TTS Warning:', result.warning);
            }
            
            console.log('✅ TTS request successful:', {
                voiceUsed: result.voice_used,
                profileUsed: result.profile_used,
                audioDataSize: result.audio?.length || 0
            });
            
            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('TTS request aborted');
                return null;
            }
            throw error;
        }
    }

    async checkStatus() {
        const now = Date.now();
        if (now - this.lastStatusCheck < this.statusCheckInterval) {
            return true; // Return cached status if checked recently
        }
        this.lastStatusCheck = now;

        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET'
            });
            return response.ok;
        } catch (error) {
            console.warn('TTS status check failed:', error);
            return false;
        }
    }
}

export default TTSService; 