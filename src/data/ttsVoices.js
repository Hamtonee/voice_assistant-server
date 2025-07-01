// src/data/ttsVoices.js
// Complete catalog of Google Cloud TTS voices with integrated TTS management
// Enhanced with error handling and request management for voice assistant applications

// ─── Complete Google Cloud TTS Voice Catalog ────────────────────────────────────────────
export const ttsVoices = [
    // ─── Chirp 3 HD Voices (Latest Google AI Voices) ────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Aoede',     label: 'Chirp3 HD Aoede (F)',      gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Puck',      label: 'Chirp3 HD Puck (M)',       gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Charon',    label: 'Chirp3 HD Charon (M)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Kore',      label: 'Chirp3 HD Kore (F)',       gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Fenrir',    label: 'Chirp3 HD Fenrir (M)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Leda',      label: 'Chirp3 HD Leda (F)',       gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Orus',      label: 'Chirp3 HD Orus (M)',       gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Betelgeuse', label: 'Chirp3 HD Betelgeuse (M)', gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Achernar',  label: 'Chirp3 HD Achernar (F)',   gender: 'FEMALE' },
  
    // ─── US Standard Voices ───────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Standard-A',           label: 'Standard A (US Male)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-B',           label: 'Standard B (US Male)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-C',           label: 'Standard C (US Female)',   gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-D',           label: 'Standard D (US Male)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-E',           label: 'Standard E (US Female)',   gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-F',           label: 'Standard F (US Female)',   gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-G',           label: 'Standard G (US Female)',   gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-H',           label: 'Standard H (US Female)',   gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-I',           label: 'Standard I (US Male)',     gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Standard-J',           label: 'Standard J (US Male)',     gender: 'MALE' },

    // ─── US WaveNet Voices (High Quality Neural Voices) ────────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Wavenet-A',            label: 'WaveNet A (US Male)',      gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-B',            label: 'WaveNet B (US Male)',      gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-C',            label: 'WaveNet C (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-D',            label: 'WaveNet D (US Male)',      gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-E',            label: 'WaveNet E (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-F',            label: 'WaveNet F (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-G',            label: 'WaveNet G (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-H',            label: 'WaveNet H (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-I',            label: 'WaveNet I (US Male)',      gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Wavenet-J',            label: 'WaveNet J (US Male)',      gender: 'MALE' },

    // ─── US Journey Voices (Expressive) ────────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Journey-D',            label: 'Journey D (US Male)',      gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-Journey-F',            label: 'Journey F (US Female)',    gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Journey-O',            label: 'Journey O (US Female)',    gender: 'FEMALE' },

    // ─── US News Voices (Optimized for News Reading) ───────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-News-K',               label: 'News K (US Female)',       gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-News-L',               label: 'News L (US Female)',       gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-News-M',               label: 'News M (US Male)',         gender: 'MALE' },
    { languageCode: 'en-US', name: 'en-US-News-N',               label: 'News N (US Male)',         gender: 'MALE' },

    // ─── US Studio Voices ─────────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Studio-O',             label: 'Studio O (US Female)',     gender: 'FEMALE' },
    { languageCode: 'en-US', name: 'en-US-Studio-Q',             label: 'Studio Q (US Male)',       gender: 'MALE' },

    // ─── US Polyglot Voices ───────────────────────────────────────────────
    { languageCode: 'en-US', name: 'en-US-Polyglot-1',           label: 'Polyglot 1 (US Male)',     gender: 'MALE' },
  
    // ─── UK Standard Voices (British English) ───────────────────────────────────────────────
    { languageCode: 'en-GB', name: 'en-GB-Standard-A',           label: 'Standard A (UK Female)',   gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-Standard-B',           label: 'Standard B (UK Male)',     gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-Standard-C',           label: 'Standard C (UK Female)',   gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-Standard-D',           label: 'Standard D (UK Male)',     gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-Standard-F',           label: 'Standard F (UK Female)',   gender: 'FEMALE' },

    // ─── UK WaveNet Voices (British English) ────────────────────────────────────────────────
    { languageCode: 'en-GB', name: 'en-GB-Wavenet-A',            label: 'WaveNet A (UK Female)',    gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-Wavenet-B',            label: 'WaveNet B (UK Male)',      gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-Wavenet-C',            label: 'WaveNet C (UK Female)',    gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-Wavenet-D',            label: 'WaveNet D (UK Male)',      gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-Wavenet-F',            label: 'WaveNet F (UK Female)',    gender: 'FEMALE' },

    // ─── UK News Voices ───────────────────────────────────────────────────
    { languageCode: 'en-GB', name: 'en-GB-News-G',               label: 'News G (UK Female)',       gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-News-H',               label: 'News H (UK Female)',       gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-News-I',               label: 'News I (UK Female)',       gender: 'FEMALE' },
    { languageCode: 'en-GB', name: 'en-GB-News-J',               label: 'News J (UK Male)',         gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-News-K',               label: 'News K (UK Male)',         gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-News-L',               label: 'News L (UK Male)',         gender: 'MALE' },

    // ─── UK Studio Voices ─────────────────────────────────────────────────
    { languageCode: 'en-GB', name: 'en-GB-Studio-B',             label: 'Studio B (UK Male)',       gender: 'MALE' },
    { languageCode: 'en-GB', name: 'en-GB-Studio-C',             label: 'Studio C (UK Female)',     gender: 'FEMALE' },

    // ─── Australian Voices ────────────────────────────────────────────────
    { languageCode: 'en-AU', name: 'en-AU-Standard-A',           label: 'Standard A (AU Female)',   gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-Standard-B',           label: 'Standard B (AU Male)',     gender: 'MALE' },
    { languageCode: 'en-AU', name: 'en-AU-Standard-C',           label: 'Standard C (AU Female)',   gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-Standard-D',           label: 'Standard D (AU Male)',     gender: 'MALE' },
    { languageCode: 'en-AU', name: 'en-AU-Wavenet-A',            label: 'WaveNet A (AU Female)',    gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-Wavenet-B',            label: 'WaveNet B (AU Male)',      gender: 'MALE' },
    { languageCode: 'en-AU', name: 'en-AU-Wavenet-C',            label: 'WaveNet C (AU Female)',    gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-Wavenet-D',            label: 'WaveNet D (AU Male)',      gender: 'MALE' },
    { languageCode: 'en-AU', name: 'en-AU-News-E',               label: 'News E (AU Female)',       gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-News-F',               label: 'News F (AU Female)',       gender: 'FEMALE' },
    { languageCode: 'en-AU', name: 'en-AU-News-G',               label: 'News G (AU Male)',         gender: 'MALE' }
];

// ─── Enhanced Voice Profiles with Compatibility Information ────────────────────────────────────────────
export const voiceProfiles = [
    {
        id: 'default',
        pitch: 0,
        speakingRate: 1.0
    },
    {
        id: 'slow',
        pitch: 0,
        speakingRate: 0.85
    },
    {
        id: 'fast',
        pitch: 0,
        speakingRate: 1.25
    },
    {
        id: 'high',
        pitch: 4,
        speakingRate: 1.0
    },
    {
        id: 'low',
        pitch: -4,
        speakingRate: 1.0
    }
];

// ─── Voice Capability Information ────────────────────────────────────────────
export const voiceCapabilities = {
    'chirp3_hd': {
        supports_pitch: false,
        supports_rate: true,
        supports_volume: false,
        recommended_profiles: ['default', 'slow'],
        description: 'Latest AI voices with natural sound but limited parameter support'
    },
    'standard': {
        supports_pitch: true,
        supports_rate: true,
        supports_volume: true,
        recommended_profiles: ['default', 'casual', 'formal', 'slow'],
        description: 'Basic voices with good parameter support'
    },
    'wavenet': {
        supports_pitch: true,
        supports_rate: true,
        supports_volume: true,
        recommended_profiles: ['default', 'casual', 'formal', 'expressive', 'slow', 'calm', 'energetic'],
        description: 'High-quality neural voices with full parameter support'
    },
    'news': {
        supports_pitch: false,
        supports_rate: true,
        supports_volume: false,
        recommended_profiles: ['default', 'slow'],
        description: 'News-optimized voices with limited parameter support'
    },
    'journey': {
        supports_pitch: true,
        supports_rate: true,
        supports_volume: true,
        recommended_profiles: ['default', 'casual', 'formal', 'expressive', 'slow'],
        description: 'Expressive voices with good parameter support'
    },
    'studio': {
        supports_pitch: true,
        supports_rate: true,
        supports_volume: true,
        recommended_profiles: ['default', 'formal', 'slow'],
        description: 'High-end studio quality voices'
    }
};

// ─── Voice Categories for Better Organization ────────────────────────────────────────────
export const voiceCategories = {
    "chirp3_hd": {
        "label": "Chirp3 HD (Latest AI)",
        "description": "Google's latest AI-generated voices with the most natural sound",
        "voices": ttsVoices.filter(voice => voice.name.includes('Chirp3-HD'))
    },
    "wavenet_us": {
        "label": "WaveNet US English",
        "description": "High-quality neural voices for American English",
        "voices": ttsVoices.filter(voice => voice.name.includes('en-US-Wavenet'))
    },
    "wavenet_uk": {
        "label": "WaveNet British English", 
        "description": "High-quality neural voices for British English",
        "voices": ttsVoices.filter(voice => voice.name.includes('en-GB-Wavenet'))
    },
    "specialized": {
        "label": "Specialized Voices",
        "description": "Voices optimized for specific use cases like news reading",
        "voices": ttsVoices.filter(voice => 
            voice.name.includes('Journey') || 
            voice.name.includes('News') || 
            voice.name.includes('Studio') || 
            voice.name.includes('Polyglot')
        )
    },
    "standard": {
        "label": "Standard Voices",
        "description": "Basic quality voices for general use",
        "voices": ttsVoices.filter(voice => voice.name.includes('Standard'))
    },
    "international": {
        "label": "International English",
        "description": "English voices with regional accents",
        "voices": ttsVoices.filter(voice => voice.languageCode === 'en-AU')
    }
};

// ─── Recommended Voice Configurations ────────────────────────────────────────────
export const recommendedVoices = {
    "conversational": "en-US-Chirp3-HD-Aoede",    // Natural conversational female voice
    "professional": "en-US-Wavenet-D",            // Professional male voice
    "friendly": "en-US-Chirp3-HD-Kore",          // Friendly female voice
    "authoritative": "en-US-Wavenet-A",          // Authoritative male voice
    "news_reading": "en-US-News-K",              // Optimized for news
    "british_accent": "en-GB-Wavenet-A",         // British accent
    "expressive": "en-US-Chirp3-HD-Betelgeuse",  // New expressive voice
    "natural_female": "en-US-Chirp3-HD-Achernar" // New natural female voice
};

// ─── Voice Compatibility Helper Functions ────────────────────────────────────────────

export const getVoiceType = (voiceName) => {
    if (voiceName.includes('Chirp3-HD')) return 'chirp3_hd';
    if (voiceName.includes('Wavenet')) return 'wavenet';
    if (voiceName.includes('Standard')) return 'standard';
    if (voiceName.includes('News')) return 'news';
    if (voiceName.includes('Journey')) return 'journey';
    if (voiceName.includes('Studio')) return 'studio';
    return 'unknown';
};

export const getVoiceCapabilities = (voiceName) => {
    const voiceType = getVoiceType(voiceName);
    return voiceCapabilities[voiceType] || {
        supports_pitch: false,
        supports_rate: true,
        supports_volume: false,
        recommended_profiles: ['default', 'slow'],
        description: 'Unknown voice type with basic support'
    };
};

export const getCompatibleProfiles = (voiceName) => {
    const capabilities = getVoiceCapabilities(voiceName);
    return voiceProfiles.filter(profile => {
        if (profile.compatibility === 'universal') return true;
        if (profile.compatibility === 'advanced') return capabilities.supports_pitch;
        if (profile.compatibility === 'full') return capabilities.supports_pitch && capabilities.supports_volume;
        return true;
    });
};

export const isProfileCompatible = (voiceName, profileId) => {
    const profile = getProfileById(profileId);
    const capabilities = getVoiceCapabilities(voiceName);
    
    if (!profile) return false;
    
    if (profile.compatibility === 'universal') return true;
    if (profile.compatibility === 'advanced') return capabilities.supports_pitch;
    if (profile.compatibility === 'full') return capabilities.supports_pitch && capabilities.supports_volume;
    
    return true;
};

// ─── Default Voice Configuration ────────────────────────────────────────────
export const defaultVoiceConfig = {
    "name": "en-US-Chirp3-HD-Aoede",
    "languageCode": "en-US",
    "profile": "default"
};

// ─── TTS Manager Class for Enhanced Error Handling ────────────────────────────────────────────
export class TTSManager {
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
                textLength: (text || '').length,
                voice: requestBody.voice.voiceName,
                profile: requestBody.voice.profile,
                voiceType: getVoiceType(requestBody.voice.voiceName),
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
                audioDataSize: result.audio_data?.length || 0
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
            return; // Skip if checked recently
        }
        this.lastStatusCheck = now;

        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.warn('TTS status check failed:', error);
            return false;
        }
    }
}

// ─── Helper Functions for Voice Management ────────────────────────────────────────────

// Helper function to get voice by name
export const getVoiceByName = (voiceName) => {
    return ttsVoices.find(voice => voice.name === voiceName);
};

// Helper function to get profile by id
export const getProfileById = (profileId) => {
    return voiceProfiles.find(profile => profile.id === profileId);
};

// Helper function to group voices by type
export const getVoicesByType = () => {
    return {
        chirp3: ttsVoices.filter(v => v.name.includes('Chirp3-HD')),
        standard: ttsVoices.filter(v => v.name.includes('Standard')),
        wavenet: ttsVoices.filter(v => v.name.includes('Wavenet')),
        journey: ttsVoices.filter(v => v.name.includes('Journey')),
        news: ttsVoices.filter(v => v.name.includes('News')),
        studio: ttsVoices.filter(v => v.name.includes('Studio')),
        polyglot: ttsVoices.filter(v => v.name.includes('Polyglot'))
    };
};

// Helper function to get voices by language
export const getVoicesByLanguage = (languageCode) => {
    return ttsVoices.filter(voice => voice.languageCode === languageCode);
};

// Helper function to get voices by gender
export const getVoicesByGender = (gender, languageCode = null) => {
    let voices = ttsVoices;
    if (languageCode) {
        voices = voices.filter(voice => voice.languageCode === languageCode);
    }
    return voices.filter(voice => voice.gender && voice.gender.toUpperCase() === gender.toUpperCase());
};

// Helper function to create voice config with validation
export const createVoiceConfig = (voiceName, profileId = 'default') => {
    const voice = getVoiceByName(voiceName);
    const profile = getProfileById(profileId);
    
    if (!voice) {
        console.warn(`Voice not found: ${voiceName}, using default`);
        // Return default voice config
        return {
            voiceName: 'en-US-Chirp3-HD-Aoede',
            languageCode: 'en-US',
            profile: 'default',
            label: 'Chirp3 HD Aoede (F)',
            profileConfig: voiceProfiles[0]
        };
    }
    
    // Return simplified structure that matches backend expectations
    return {
        voiceName: voice.name,
        languageCode: voice.languageCode,
        profile: profileId,
        // Additional UI fields for display purposes
        label: voice.label,
        gender: voice.gender,
        profileConfig: profile || voiceProfiles[0],
        // Legacy compatibility fields
        name: voice.name,
        voiceConfig: {
            name: voice.name,
            languageCode: voice.languageCode
        }
    };
};

// Helper function to convert any voice config to backend-compatible format
export const toBackendVoiceConfig = (voiceConfig) => {
    if (!voiceConfig) {
        return {
            voiceName: 'en-US-Chirp3-HD-Aoede',
            languageCode: 'en-US',
            profile: 'default'
        };
    }
    
    if (typeof voiceConfig === 'string') {
        return {
            voiceName: voiceConfig,
            languageCode: 'en-US',
            profile: 'default'
        };
    }
    
    return {
        voiceName: voiceConfig.voiceName || voiceConfig.name || 'en-US-Chirp3-HD-Aoede',
        languageCode: voiceConfig.languageCode || 'en-US',
        profile: voiceConfig.profile || 'default'
    };
};

// Helper function to get all available voice names
export const getAllVoiceNames = () => {
    return ttsVoices.map(voice => voice.name);
};

// Helper function to search voices by label or name
export const searchVoices = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    return ttsVoices.filter(voice => 
        voice.name.toLowerCase().includes(term) || 
        voice.label.toLowerCase().includes(term)
    );
};

// Helper function to validate voice configuration
export const validateVoiceConfig = (voiceConfig) => {
    const voice = getVoiceByName(voiceConfig?.voiceName);
    const profile = getProfileById(voiceConfig?.profile);
    
    return {
        isValid: !!voice && !!profile,
        voice,
        profile,
        errors: [
            !voice ? `Voice not found: ${voiceConfig?.voiceName}` : null,
            !profile ? `Profile not found: ${voiceConfig?.profile}` : null
        ].filter(Boolean)
    };
};

// ─── Global Error Handler ────────────────────────────────────────────
window.addEventListener('unhandledrejection', event => {
    if (event.reason?.message?.includes('TTS') || event.reason?.message?.includes('audio')) {
        console.error('🎵 Unhandled TTS promise rejection:', event.reason);
        event.preventDefault();
    }
});

// ─── Export Everything ────────────────────────────────────────────
export {
    // Legacy exports for backward compatibility
    ttsVoices as default
};