import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Volume2, VolumeX, RefreshCw, Check, AlertCircle, Wifi, WifiOff, Zap, Sparkles } from 'lucide-react';
import { ttsVoices, voiceProfiles, createVoiceConfig } from '../data/ttsVoices';
import '../assets/styles/VoiceSelector.css';

/**
 * Enhanced Voice Studio with improved mobile experience and modal integration
 * Fixed mobile preview functionality and responsive design
 */
const VoiceSelector = ({ 
  onVoiceChange, 
  apiUrl = 'http://localhost:8000',
  defaultVoice = 'en-US-Chirp3-HD-Aoede',
  defaultProfile = 'default',
  className = '',
  showPreview = true,
  showProfiles = true,
  compact = false
}) => {
  // Core state
  const [voices, setVoices] = useState(ttsVoices);
  const [profiles] = useState(voiceProfiles);
  const [selectedVoice, setSelectedVoice] = useState(defaultVoice);
  const [selectedProfile, setSelectedProfile] = useState(defaultProfile);
  
  // UI state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Preview state
  const [previewText, setPreviewText] = useState('Hello! This is how I sound when I speak. How do you like my voice?');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  
  // Connection state
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiTesting, setApiTesting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastSuccessfulVoice, setLastSuccessfulVoice] = useState(null);
  
  // Refs
  const currentUtteranceRef = useRef(null);
  const isGeneratingRef = useRef(false);
  const connectionTestInterval = useRef(null);
  const voiceDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const ttsServiceRef = useRef(null);

  // Enhanced mobile detection with debouncing
  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Enhanced click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check voice dropdown
      if (dropdownOpen && voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      
      // Check profile dropdown
      if (profileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    // Use capture phase to ensure we catch events before they bubble up
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, { passive: true, capture: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, { passive: true, capture: true });
    };
  }, [dropdownOpen, profileDropdownOpen, isMobile]);

  // NUCLEAR OPTION: Force all dropdowns to position upwards
  useEffect(() => {
    const forceUpwardDropdowns = () => {
      // Find all dropdown menus in the component
      const allDropdowns = document.querySelectorAll('.dropdown-menu');
      allDropdowns.forEach(menu => {
        menu.style.position = 'absolute';
        menu.style.bottom = 'calc(100% + 0.5rem)';
        menu.style.top = 'auto';
        menu.style.left = '0';
        menu.style.right = '0';
        menu.style.zIndex = '9999';
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.pointerEvents = 'auto';
        menu.style.filter = 'none';
        menu.style.transform = 'none';
        menu.style.maxWidth = '100%';
        menu.style.boxSizing = 'border-box';
        menu.style.width = '100%';
        menu.style.margin = '0';
      });

      // Specifically target voice selector dropdowns
      const activeContainer = dropdownOpen ? voiceDropdownRef.current : 
                             profileDropdownOpen ? profileDropdownRef.current : null;
      
      if (activeContainer) {
        activeContainer.style.zIndex = '100';
        const menu = activeContainer.querySelector('.dropdown-menu');
        if (menu) {
          menu.style.position = 'absolute';
          menu.style.bottom = 'calc(100% + 0.5rem)';
          menu.style.top = 'auto';
          menu.style.left = '0';
          menu.style.right = '0';
          menu.style.zIndex = '9999';
          menu.style.opacity = '1';
          menu.style.visibility = 'visible';
          menu.style.pointerEvents = 'auto';
          menu.style.filter = 'none';
          menu.style.transform = 'none';
          menu.style.maxWidth = '100%';
          menu.style.boxSizing = 'border-box';
          menu.style.width = '100%';
          menu.style.margin = '0';
        }
      }
    };

    // Run immediately and on any state change
    forceUpwardDropdowns();
    
    // Also run after a brief delay to override any other scripts
    const timeoutId = setTimeout(forceUpwardDropdowns, 100);
    
    return () => clearTimeout(timeoutId);
  }, [dropdownOpen, profileDropdownOpen]);

  // ADDITIONAL: Force upward positioning on mount
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const allDropdowns = document.querySelectorAll('.dropdown-menu');
      allDropdowns.forEach(menu => {
        if (menu.style.top !== 'auto') {
          menu.style.position = 'absolute';
          menu.style.bottom = 'calc(100% + 0.5rem)';
          menu.style.top = 'auto';
          menu.style.zIndex = '9999';
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => observer.disconnect();
  }, []);

  // Handle escape key to close dropdowns
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (dropdownOpen) {
          setDropdownOpen(false);
          event.preventDefault();
        }
        if (profileDropdownOpen) {
          setProfileDropdownOpen(false);
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen, profileDropdownOpen]);

  // Modern user-friendly status messages
  const getConnectionMessage = useCallback(() => {
    switch (connectionStatus) {
      case 'connecting': return 'Establishing voice connection...';
      case 'premium': return 'Premium Voice Studio Active • Crystal clear quality available';
      case 'standard': return 'Standard Voice Mode • Using device voices for natural speech';
      case 'unavailable': return 'Voice Service Unavailable • Please check your connection';
      default: return 'Voice system initializing...';
    }
  }, [connectionStatus]);

  // Enhanced connection status
  const getConnectionBadge = useCallback(() => {
    switch (connectionStatus) {
      case 'connecting': return { text: 'Connecting...', type: 'connecting' };
      case 'premium': return { text: 'Premium Active', type: 'premium' };
      case 'standard': return { text: 'Standard Mode', type: 'standard' };
      case 'unavailable': return { text: 'Service Offline', type: 'offline' };
      default: return { text: 'Initializing', type: 'connecting' };
    }
  }, [connectionStatus]);

  // Simple speech cancellation
  const cancelCurrentSpeech = useCallback(() => {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      currentUtteranceRef.current = null;
      setPlaying(false);
    } catch (error) {
      console.warn('Cancel speech warning:', error);
    }
  }, []);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Periodic connection monitoring  
  useEffect(() => {
    // Enhanced API connection test with modern terminology
    const testApiConnection = async () => {
      console.log('🔍 Checking Premium Voice Studio connection...');
      setApiTesting(true);
      
      try {
        console.log('📋 Testing voice library endpoint...');
        const voicesResponse = await fetch(`${apiUrl}/voices`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (voicesResponse.ok) {
          console.log('✅ Voice library accessible');
          
          try {
            const apiVoices = await voicesResponse.json();
            if (Array.isArray(apiVoices?.voices) && apiVoices.voices.length > 0) {
              setVoices(apiVoices.voices);
              console.log(`📋 Loaded ${apiVoices.voices.length} premium voices`);
            }
          } catch (e) {
            console.log('📋 Using local voice catalog');
          }
          
          console.log('🎤 Testing voice synthesis capability...');
          try {
            const testVoiceConfig = createVoiceConfig(defaultVoice, 'default');
            const testResponse = await ttsServiceRef.current.synthesize('Test', testVoiceConfig);
            
            if (testResponse?.audioUrl) {
              console.log('✅ Premium Voice Studio ready');
              setApiAvailable(true);
              setConnectionStatus('premium');
              setLastSuccessfulVoice(defaultVoice);
            } else {
              console.log(`⚠️ Voice service partially available`);
              setApiAvailable(true);
              setConnectionStatus('premium');
            }
          } catch (ttsError) {
            console.log('⚠️ Premium synthesis unavailable, voice library accessible');
            setApiAvailable(true);
            setConnectionStatus('premium');
          }
          
        } else {
          throw new Error(`Voice service returned ${voicesResponse.status}`);
        }
        
      } catch (error) {
        console.log('❌ Premium Voice Studio unavailable:', error.message);
        setApiAvailable(false);
        setConnectionStatus('standard');
      } finally {
        setApiTesting(false);
      }
    };

    testApiConnection();
    
    connectionTestInterval.current = setInterval(() => {
      if (!isGeneratingRef.current) {
        testApiConnection();
      }
    }, 30000);
    
    return () => {
      if (connectionTestInterval.current) {
        clearInterval(connectionTestInterval.current);
      }
    };
  }, [apiUrl, defaultVoice]);

  // Notify parent of voice changes
  useEffect(() => {
    if (onVoiceChange) {
      const voiceConfig = createVoiceConfig(selectedVoice, selectedProfile);
      if (voiceConfig) {
        onVoiceChange(voiceConfig);
      }
    }
  }, [selectedVoice, selectedProfile, onVoiceChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelCurrentSpeech();
      if (connectionTestInterval.current) {
        clearInterval(connectionTestInterval.current);
      }
    };
  }, [cancelCurrentSpeech]);

  // Enhanced Premium synthesis with better error handling
  const generatePremiumPreview = useCallback(async (voiceConfig) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌟 Generating Premium Voice preview with:', voiceConfig.voiceName);
      
      const requestBody = {
        text: previewText.trim(),
        voice: {
          voiceName: voiceConfig.voiceName,
          languageCode: voiceConfig.languageCode,
          profile: voiceConfig.profile
        }
      };
      
      console.log('📤 Premium synthesis request:', requestBody);

      const response = await fetch(`${apiUrl}/tts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      });

      console.log('📡 Premium service response:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Premium Service Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Premium audio generated, keys:', Object.keys(data));
      
      const audioData = data.audio || data.feedbackAudio || data.audioContent;

      if (!audioData) {
        throw new Error('No audio generated by Premium Service');
      }

      console.log('✅ Premium audio ready, length:', audioData.length);

      const audioBlob = new Blob([
        Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setPlaying(true);
      setLastSuccessfulVoice(voiceConfig.voiceName);
      
      return new Promise((resolve, reject) => {
        audio.onloadeddata = () => {
          console.log('🎵 Premium audio loaded successfully');
        };
        
        audio.onended = () => {
          console.log('✅ Premium audio playback completed');
          setPlaying(false);
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };
        
        audio.onerror = (e) => {
          console.error('❌ Premium audio playback error:', e);
          setPlaying(false);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play()
          .then(() => {
            console.log('🎵 Premium audio playback started');
          })
          .catch((e) => {
            console.error('❌ Failed to start Premium audio:', e);
            setPlaying(false);
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Failed to start audio playback'));
          });
      });

    } catch (error) {
      console.error('❌ Premium preview failed:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setConnectionStatus('standard');
        setApiAvailable(false);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [previewText, apiUrl]);

  // Enhanced device voice synthesis with better descriptions
  const generateDevicePreview = useCallback(async (voiceConfig) => {
    if (isGeneratingRef.current) {
      console.log('⏳ Voice synthesis in progress, please wait...');
      return false;
    }
    
    isGeneratingRef.current = true;
    
    try {
      console.log('🎤 Using device voice synthesis...');
      
      cancelCurrentSpeech();
      await delay(300);
      
      const utterance = new SpeechSynthesisUtterance(previewText.trim());
      
      let voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        console.log('⏳ Loading device voices...');
        await new Promise((resolve) => {
          const loadVoices = () => {
            voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) resolve();
          };
          
          if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
          }
          setTimeout(resolve, 1000);
        });
        voices = window.speechSynthesis.getVoices();
      }
      
      console.log(`🎙️ Found ${voices.length} device voices`);
      
      let selectedDeviceVoice = null;
      
      if (voiceConfig?.voiceName && voices.length > 0) {
        const voiceName = voiceConfig.voiceName.toLowerCase();
        
        // Defensive check: ensure voices is an array before calling find
        selectedDeviceVoice = Array.isArray(voices) ? voices.find(v => v.name.toLowerCase() === voiceName) : null;
        
        if (!selectedDeviceVoice && Array.isArray(voices)) {
          selectedDeviceVoice = voices.find(v => 
            voiceName.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(voiceName)
          );
        }
        
        if (!selectedDeviceVoice && voiceConfig.languageCode && Array.isArray(voices)) {
          selectedDeviceVoice = voices.find(v => v.lang === voiceConfig.languageCode);
        }
        
        if (!selectedDeviceVoice && Array.isArray(voices)) {
          const isFemale = voiceName.includes('female') || voiceName.includes('(f)') || 
                          ['aoede', 'kore', 'leda'].some(name => voiceName.includes(name));
          const isMale = voiceName.includes('male') || voiceName.includes('(m)') || 
                        ['puck', 'charon', 'fenrir', 'orus'].some(name => voiceName.includes(name));
          
          if (isFemale) {
            selectedDeviceVoice = voices.find(v => v.name.toLowerCase().includes('female'));
          } else if (isMale) {
            selectedDeviceVoice = voices.find(v => v.name.toLowerCase().includes('male'));
          }
        }
        
        if (!selectedDeviceVoice && Array.isArray(voices)) {
          selectedDeviceVoice = voices.find(v => v.default) || voices[0];
        }
        
        if (selectedDeviceVoice) {
          utterance.voice = selectedDeviceVoice;
          console.log('🎙️ Matched device voice:', selectedDeviceVoice.name);
        }
      }
      
      if (voiceConfig?.profileConfig?.settings) {
        const settings = voiceConfig.profileConfig.settings;
        if (settings.rate) {
          utterance.rate = Math.max(0.1, Math.min(10, parseFloat(settings.rate.replace('%', '')) / 100));
        }
        if (settings.pitch) {
          const pitchMatch = settings.pitch.match(/([+-]?\d*\.?\d+)/);
          if (pitchMatch) {
            utterance.pitch = Math.max(0, Math.min(2, 1 + parseFloat(pitchMatch[1]) / 12));
          }
        }
      }
      
      return new Promise((resolve) => {
        let hasResolved = false;
        
        const resolveOnce = (success = true) => {
          if (!hasResolved) {
            hasResolved = true;
            currentUtteranceRef.current = null;
            setPlaying(false);
            resolve(success);
          }
        };
        
        utterance.onstart = () => {
          console.log('🎤 Device voice synthesis started');
          setPlaying(true);
          currentUtteranceRef.current = utterance;
        };
        
        utterance.onend = () => {
          console.log('✅ Device voice synthesis completed');
          resolveOnce(true);
        };
        
        utterance.onerror = (event) => {
          console.log('⚠️ Device voice error:', event.error);
          
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('🤝 Device voice interrupted (user action)');
            resolveOnce(true);
          } else {
            console.error('💀 Device voice failed:', event.error);
            resolveOnce(false);
          }
        };
        
        setTimeout(() => {
          if (!hasResolved) {
            console.log('⏰ Device voice timeout');
            resolveOnce(false);
          }
        }, 30000);
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('💥 Device voice exception:', error);
          resolveOnce(false);
        }
      });
      
    } catch (error) {
      console.error('💥 Device voice synthesis failed:', error);
      return false;
    } finally {
      isGeneratingRef.current = false;
    }
  }, [previewText, cancelCurrentSpeech]);

  // Main preview function with intelligent fallback
  const handlePreview = useCallback(async () => {
    if (!previewText.trim()) {
      setError('Please enter some text to hear your voice');
      return;
    }

    if (loading || isGeneratingRef.current) {
      console.log('Voice synthesis already in progress');
      return;
    }

    try {
      setError(null);
      const voiceConfig = createVoiceConfig(selectedVoice, selectedProfile);
      console.log('🎯 Starting voice preview:', {
        voice: voiceConfig.voiceName,
        profile: voiceConfig.profile,
        mode: apiAvailable ? 'Premium' : 'Standard'
      });
      
      if (apiAvailable && connectionStatus === 'premium') {
        console.log('🌟 Using Premium Voice Studio...');
        try {
          await generatePremiumPreview(voiceConfig);
          console.log('✅ Premium voice preview succeeded');
          return;
        } catch (premiumError) {
          console.log('❌ Premium voice preview failed:', premiumError.message);
          setError(`Premium Service: ${premiumError.message}`);
          
          if (premiumError.message.includes('Failed to fetch')) {
            setConnectionStatus('standard');
            setApiAvailable(false);
          }
          
          setTimeout(() => {
            if (window.confirm('Premium Voice Studio is temporarily unavailable. Would you like to try Standard Mode instead?')) {
              setError(null);
              generateDevicePreview(voiceConfig);
            }
          }, 1000);
          return;
        }
      }
      
      console.log('🎤 Using Standard Voice Mode...');
      const success = await generateDevicePreview(voiceConfig);
      
      if (!success) {
        throw new Error('Voice synthesis unavailable. Please check your device audio settings.');
      }
      
      console.log('✅ Standard voice preview succeeded');
      
    } catch (error) {
      console.error('❌ All voice synthesis methods failed:', error);
      setError(error.message);
      setPlaying(false);
    }
  }, [previewText, loading, selectedVoice, selectedProfile, apiAvailable, connectionStatus, generatePremiumPreview, generateDevicePreview]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (playing || loading) {
      cancelCurrentSpeech();
    } else {
      handlePreview();
    }
  }, [playing, loading, cancelCurrentSpeech, handlePreview]);

  // Manual connection retry
  const retryConnection = useCallback(() => {
    setConnectionStatus('connecting');
    setApiTesting(true);
    
    // Run connection test immediately
    (async () => {
      console.log('🔍 Retrying Premium Voice Studio connection...');
      
      try {
        console.log('📋 Testing voice library endpoint...');
        const voicesResponse = await fetch(`${apiUrl}/voices`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (voicesResponse.ok) {
          console.log('✅ Voice library accessible');
          
          try {
            const apiVoices = await voicesResponse.json();
            if (Array.isArray(apiVoices?.voices) && apiVoices.voices.length > 0) {
              setVoices(apiVoices.voices);
              console.log(`📋 Loaded ${apiVoices.voices.length} premium voices`);
            }
          } catch (e) {
            console.log('📋 Using local voice catalog');
          }
          
          console.log('🎤 Testing voice synthesis capability...');
          try {
            const testVoiceConfig = createVoiceConfig(defaultVoice, 'default');
            const testResponse = await ttsServiceRef.current.synthesize('Test', testVoiceConfig);
            
            if (testResponse?.audioUrl) {
              console.log('✅ Premium Voice Studio ready');
              setApiAvailable(true);
              setConnectionStatus('premium');
              setLastSuccessfulVoice(defaultVoice);
            } else {
              console.log(`⚠️ Voice service partially available`);
              setApiAvailable(true);
              setConnectionStatus('premium');
            }
          } catch (ttsError) {
            console.log('⚠️ Premium synthesis unavailable, voice library accessible');
            setApiAvailable(true);
            setConnectionStatus('premium');
          }
          
        } else {
          throw new Error(`Voice service returned ${voicesResponse.status}`);
        }
        
      } catch (error) {
        console.log('❌ Premium Voice Studio unavailable:', error.message);
        setApiAvailable(false);
        setConnectionStatus('standard');
      } finally {
        setApiTesting(false);
      }
    })();
  }, [apiUrl, defaultVoice]);

  // Voice selection handlers with improved dropdown management
  const handleVoiceSelection = useCallback((voiceName) => {
    setSelectedVoice(voiceName);
    setDropdownOpen(false);
    setProfileDropdownOpen(false); // Close other dropdown
    setError(null);
  }, []);

  const handleProfileSelection = useCallback((profileId) => {
    setSelectedProfile(profileId);
    setProfileDropdownOpen(false);
    setDropdownOpen(false); // Close other dropdown
    setError(null);
  }, []);

  // Get display info with defensive checks
  const selectedVoiceObj = Array.isArray(voices) ? voices.find(v => v.name === selectedVoice) : null;
  const selectedVoiceLabel = selectedVoiceObj?.label || selectedVoice;
  const selectedProfileObj = Array.isArray(profiles) ? profiles.find(p => p.id === selectedProfile) : null;
  const selectedProfileLabel = selectedProfileObj?.name || 'Default';

  // Modern connection status icon
  const ConnectionIcon = () => {
    if (apiTesting) return <RefreshCw size={14} className="connection-icon connecting" />;
    if (connectionStatus === 'premium') return <Sparkles size={14} className="connection-icon premium" />;
    if (connectionStatus === 'standard') return <Wifi size={14} className="connection-icon standard" />;
    if (connectionStatus === 'unavailable') return <WifiOff size={14} className="connection-icon offline" />;
    return <AlertCircle size={14} className="connection-icon connecting" />;
  };

  // Compact version
  if (compact) {
    return (
      <div className={`voice-selector-compact ${className}`}>
        <div className="voice-display">
          <span className="current-voice">{selectedVoiceLabel}</span>
          <span className="current-profile">({selectedProfileLabel})</span>
        </div>
        {showPreview && (
          <button
            className="preview-btn-compact"
            onClick={togglePlayback}
            disabled={loading}
            title="Preview voice"
            type="button"
          >
            {loading ? (
              <RefreshCw size={14} className="loading-icon" />
            ) : playing ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>
        )}
      </div>
    );
  }

  const badge = getConnectionBadge();

  // Full component with mobile optimizations
  return (
    <div className={`voice-selector ${className} ${isMobile ? 'mobile-optimized' : ''} ${className.includes('mobile-voice-selector') ? 'mobile-voice-selector' : ''}`}>
      {/* NEW REARRANGED HEADER with connection status */}
      <div className="voice-selector-header">
        {/* Top row: Title (left) and Connection Icon (right) */}
        <div className="header-top-row">
          <h3 className="header-title">
            {isMobile ? (
              <>
                <span style={{fontSize: '0.75rem', marginRight: '0.25rem'}}>🎙️</span>
                Voice Studio
              </>
            ) : (
              <>🎙️ Voice Studio</>
            )}
          </h3>
          <div className="connection-icon-container">
            <ConnectionIcon />
          </div>
        </div>
        
        {/* Connection Status Message - New Line */}
        <div className={`status-message ${connectionStatus}`}>
          <span>{getConnectionMessage()}</span>
          {connectionStatus === 'unavailable' && !apiTesting && (
            <button
              onClick={retryConnection}
              className="retry-button"
              type="button"
            >
              Reconnect
            </button>
          )}
        </div>
        
        {/* Connection Badge - New Line */}
        <div className="badge-container">
          <span className={`connection-badge ${badge.type}`}>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-display">
          <div className="error-content">
            <AlertCircle size={16} className="error-icon" />
            <div className="error-text">
              <div className="error-title">Voice Preview Issue</div>
              <div className="error-message">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {lastSuccessfulVoice === selectedVoice && !error && (
        <div className="success-display">
          <div className="success-content">
            <Zap size={16} className="success-icon" />
            <div className="success-text">
              This voice has been tested and sounds amazing!
            </div>
          </div>
        </div>
      )}

      {/* Voice Selection */}
      <div className="form-group">
        <label className="form-label">
          Choose Your Voice ({voices.length} available)
        </label>
        <div className="dropdown-container" ref={voiceDropdownRef}>
          <button
            type="button"
            className={`dropdown-button ${dropdownOpen ? 'dropdown-open' : ''}`}
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setProfileDropdownOpen(false);
            }}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Select voice, currently ${selectedVoiceLabel}`}
          >
            <span className="dropdown-text">{selectedVoiceLabel}</span>
            <ChevronDown className="dropdown-icon" />
          </button>
          
          {dropdownOpen && (
            <div className="dropdown-menu" role="listbox">
              <div className="dropdown-content">
                {voices.map((voice) => (
                  <button
                    key={voice.name}
                    className={`dropdown-item ${voice.name === selectedVoice ? 'selected' : ''}`}
                    onClick={() => handleVoiceSelection(voice.name)}
                    type="button"
                    role="option"
                    aria-selected={voice.name === selectedVoice}
                  >
                    <div className="dropdown-item-content">
                      <span>{voice.label}</span>
                      {lastSuccessfulVoice === voice.name && (
                        <Zap size={12} className="tested-icon" title="Sounds perfect!" />
                      )}
                    </div>
                    {voice.name === selectedVoice && (
                      <Check size={16} className="selected-icon" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Selection */}
      {showProfiles && (
        <div className="form-group">
          <label className="form-label">
            Speaking Style
          </label>
          <div className="dropdown-container" ref={profileDropdownRef}>
            <button
              type="button"
              className={`dropdown-button ${profileDropdownOpen ? 'dropdown-open' : ''}`}
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setDropdownOpen(false);
              }}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Select speaking style, currently ${selectedProfileLabel}`}
            >
              <span className="dropdown-text">{selectedProfileLabel}</span>
              <ChevronDown className="dropdown-icon" />
            </button>
            
            {profileDropdownOpen && (
              <div className="dropdown-menu" role="listbox">
                <div className="dropdown-content">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      className={`dropdown-item profile-item ${profile.id === selectedProfile ? 'selected' : ''}`}
                      onClick={() => handleProfileSelection(profile.id)}
                      type="button"
                      role="option"
                      aria-selected={profile.id === selectedProfile}
                    >
                      <div className="profile-info">
                        <div className="profile-name">{profile.name}</div>
                        <div className="profile-description">{profile.description}</div>
                      </div>
                      {profile.id === selectedProfile && (
                        <Check size={16} className="selected-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Section - Enhanced for Mobile */}
      {showPreview && (
        <>
          {/* Preview Text */}
          <div className="form-group">
            <label className="form-label">
              Try Your Voice
            </label>
            <textarea
              className="preview-textarea"
              rows={isMobile ? "3" : "2"}
              value={previewText}
              onChange={(e) => {
                setPreviewText(e.target.value);
                setError(null);
              }}
              placeholder="Type something to hear how your voice sounds..."
              maxLength={200}
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
            <div className="character-count">
              {previewText.length}/200 characters
            </div>
          </div>

          {/* Preview Controls - Mobile Optimized */}
          <div className={`preview-controls ${isMobile ? 'mobile-preview-controls' : ''}`}>
            <button
              className={`preview-button ${loading ? 'loading' : ''} ${playing ? 'playing' : ''} ${isMobile ? 'mobile-preview-button' : ''}`}
              onClick={togglePlayback}
              disabled={loading || !previewText.trim()}
              type="button"
            >
              {loading ? (
                <RefreshCw className="button-icon loading-icon" />
              ) : playing ? (
                <VolumeX className="button-icon" />
              ) : (
                <Volume2 className="button-icon" />
              )}
              <span className="button-text">
                {loading ? 'Creating Voice...' : playing ? 'Stop Playback' : 'Listen to Voice'}
              </span>
            </button>
            
            <div className={`quality-indicator ${isMobile ? 'mobile-quality-indicator' : ''}`}>
              {connectionStatus === 'premium' ? 'Premium Quality' : 'Standard Quality'}
            </div>
          </div>
        </>
      )}

      {/* Current Selection Summary - Mobile Optimized */}
      <div className={`selection-summary ${isMobile ? 'mobile-selection-summary' : ''}`}>
        <div className="summary-content">
          <div className="summary-title">Your Voice Configuration:</div>
          <div className="summary-details">
            <div>Voice: {selectedVoiceLabel}</div>
            <div>Language: {selectedVoiceObj?.languageCode || 'en-US'}</div>
            <div>Style: {selectedProfileLabel}</div>
            <div className="status-badges">
              <span className={`status-badge ${connectionStatus === 'premium' ? 'premium-ready' : 'standard-mode'}`}>
                {connectionStatus === 'premium' ? '✨ Premium Ready' : '🎤 Standard Mode'}
              </span>
              {lastSuccessfulVoice === selectedVoice && (
                <span className="status-badge tested">
                  ✅ Tested
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;