import React from 'react';
import { ttsVoices, voiceProfiles, createVoiceConfig } from '../data/ttsVoices';

/**
 * Debug component to help identify voice selection issues
 * Add this temporarily to your main component to debug voice state
 */
const VoiceDebugComponent = ({ selectedVoice, className = '' }) => {
  const debugInfo = {
    selectedVoice,
    selectedVoiceType: typeof selectedVoice,
    selectedVoiceKeys: selectedVoice && typeof selectedVoice === 'object' ? Object.keys(selectedVoice) : 'N/A',
    ttsVoicesLength: ttsVoices.length,
    voiceProfilesLength: voiceProfiles.length,
    firstVoice: ttsVoices[0],
    firstProfile: voiceProfiles[0]
  };

  let currentConfig = null;
  let configError = null;

  try {
    if (!selectedVoice) {
      currentConfig = createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
    } else if (typeof selectedVoice === 'object' && selectedVoice.voiceName) {
      currentConfig = selectedVoice;
    } else if (typeof selectedVoice === 'string') {
      currentConfig = createVoiceConfig(selectedVoice, 'default');
    } else {
      const voiceName = selectedVoice.voiceName || selectedVoice.name || 'en-US-Chirp3-HD-Aoede';
      const profile = selectedVoice.profile || 'default';
      currentConfig = createVoiceConfig(voiceName, profile);
    }
  } catch (error) {
    configError = error.message;
    currentConfig = createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null; // Don't show in production
  }

  return (
    <div className={`voice-debug bg-yellow-50 border border-yellow-200 rounded p-4 mb-4 text-xs ${className}`}>
      <h4 className="font-bold text-yellow-800 mb-2">🐛 Voice Debug Info</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-semibold text-yellow-700 mb-1">Selected Voice Input:</h5>
          <pre className="bg-white p-2 rounded border text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div>
          <h5 className="font-semibold text-yellow-700 mb-1">Processed Config:</h5>
          <pre className="bg-white p-2 rounded border text-xs overflow-auto">
            {JSON.stringify(currentConfig, null, 2)}
          </pre>
          {configError && (
            <div className="text-red-600 mt-2">
              <strong>Error:</strong> {configError}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <h5 className="font-semibold text-yellow-700 mb-1">Available Voices Sample:</h5>
        <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-32">
          {JSON.stringify(ttsVoices.slice(0, 3), null, 2)}
        </pre>
      </div>
      
      <div className="mt-2 flex gap-4 text-yellow-700">
        <span>Total Voices: {ttsVoices.length}</span>
        <span>Total Profiles: {voiceProfiles.length}</span>
        <span>Config Valid: {currentConfig ? '✅' : '❌'}</span>
      </div>
    </div>
  );
};

export default VoiceDebugComponent;