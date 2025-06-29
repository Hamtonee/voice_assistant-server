import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../api';
import '../assets/styles/ChatDetail.css';
import { Mic, Send, ChevronDown, AlertCircle, Loader, Volume2, X, MicOff, Headphones } from 'lucide-react';
import { createVoiceConfig } from '../data/ttsVoices';

const AUTO_SEND_DELAY = 2500;
const ALWAYS_IDLE_TIMEOUT = 120000; // 2min idle for always-listen
const HISTORY_WINDOW = 10;
const MAX_API_RETRIES = 3;
const AUDIO_TIMEOUT = 10000; // 10 second timeout for audio loading

// Safe environment variable access
const getChatRoleplayEndpoint = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CHAT_ROLEPLAY_ENDPOINT) || '/chat/roleplay';
  } catch (error) {
    console.warn('Failed to access REACT_APP_CHAT_ROLEPLAY_ENDPOINT, using fallback');
    return '/chat/roleplay';
  }
};

const chatRoleplayEndpoint = getChatRoleplayEndpoint();

export default function ChatDetail({
  chatInstances,
  setChatInstances,
  activeChatId,
  scenario,
  alwaysListen,
  selectedVoice,
  onToggleListen,
}) {
  // Core State
  const [conversation, setConversation] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enhanced State for better UX
  const [isSending, setIsSending] = useState(false);
  const [micStatus, setMicStatus] = useState('available'); // available, denied, error, unavailable
  const [audioStatus, setAudioStatus] = useState('ready'); // ready, loading, playing, error
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, connecting, error
  const [userFriendlyError, setUserFriendlyError] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const recognizerRunning = useRef(false);
  const manualMicTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const inputFocusRef = useRef(null);
  const historyRef = useRef(null);
  const lastSentRef = useRef('');
  const lastHeardRef = useRef(Date.now());
  const finalRef = useRef([]);
  const pageActiveRef = useRef(true);
  const sendingLock = useRef(false);
  const abortControllerRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const layoutUpdateTimeoutRef = useRef(null);
  const handleSendRef = useRef(null);

  // User-friendly error messages - wrapped in useMemo to prevent recreation
  const USER_FRIENDLY_ERRORS = useMemo(() => ({
    'microphone_denied': 'Please allow microphone access to use voice features. Click the microphone icon in your browser\'s address bar.',
    'microphone_unavailable': 'Your microphone is not available. Please check if another app is using it.',
    'speech_not_supported': 'Voice features aren\'t supported in this browser. Please try Chrome, Edge, or Safari.',
    'network_error': 'Connection issue. Please check your internet and try again.',
    'server_error': 'Our servers are having trouble. Please try again in a moment.',
    'audio_failed': 'Couldn\'t play the response audio. The text response is still available above.',
    'timeout_error': 'The request took too long. Please try again.',
    'api_error': 'Something went wrong with the voice assistant. Please try again.'
  }), []);

  // Helper to set user-friendly errors
  const setUserFriendlyErrorMessage = useCallback((errorKey, customMessage = null, timeout = 8000) => {
    const message = customMessage || USER_FRIENDLY_ERRORS[errorKey] || errorKey;
    setUserFriendlyError(message);
    
    clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setUserFriendlyError(null);
    }, timeout);
  }, [USER_FRIENDLY_ERRORS]);

  // Clear error messages
  const clearErrorMessage = useCallback(() => {
    setUserFriendlyError(null);
    clearTimeout(errorTimeoutRef.current);
  }, []);

  // Get current voice configuration with better error handling
  const getCurrentVoiceConfig = useCallback(() => {
    try {
      if (!selectedVoice) {
        return createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
      }
      
      if (typeof selectedVoice === 'object' && selectedVoice.voiceName) {
        return selectedVoice;
      }
      
      if (typeof selectedVoice === 'string') {
        return createVoiceConfig(selectedVoice, 'default');
      }
      
      const voiceName = selectedVoice.voiceName || selectedVoice.name || 'en-US-Chirp3-HD-Aoede';
      const profile = selectedVoice.profile || 'default';
      return createVoiceConfig(voiceName, profile);
    } catch (error) {
      console.warn('Error getting voice config, using default:', error);
      return createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
    }
  }, [selectedVoice]);

  // Detect sidebar state
  const detectSidebarState = useCallback(() => {
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');
    
    if (!appContainer || !sidebar) return false;
    
    const isSidebarOpen = 
      appContainer.classList.contains('sidebar-open') ||
      document.body.classList.contains('sidebar-open') ||
      window.getComputedStyle(sidebar).display !== 'none';
    
    return isSidebarOpen;
  }, []);

  // Load conversation data
  const normalize = msgs =>
    msgs.map((m, i) => ({
      id: m.id || `${m.role}-${i}-${Date.now()}`,
      sender: m.role === 'user' ? 'user' : 'bot',
      text: m.text,
    }));

  // SIMPLIFIED: Audio playback with better error handling
  const playAudio = useCallback(async (audioB64, fallbackText, voiceConfig) => {
    console.log('🎵 [playAudio] Starting audio playback');
    setAudioStatus('loading');
    setIsPlaying(true);

    return new Promise((resolve) => {
      const onComplete = () => {
        setIsPlaying(false);
        setAudioStatus('ready');
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        clearTimeout(audioTimeoutRef.current);
        resolve();
      };

      const fallbackToBrowserTTS = (reason) => {
        console.log('🔄 [playAudio] Falling back to browser TTS:', reason);
        
        if (!window.speechSynthesis) {
          console.warn('Browser TTS not available');
          setUserFriendlyErrorMessage('audio_failed');
          onComplete();
          return;
        }

        try {
          // Check if speech synthesis is available
          if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn('Speech synthesis not available');
            setUserFriendlyErrorMessage('audio_failed');
            onComplete();
            return;
          }
          
          // Cancel any existing speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(fallbackText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Try to find a good voice
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) ||
                       voices.find(v => v.lang === 'en-US') ||
                       voices[0];
          
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onstart = () => {
            console.log('✅ Browser TTS started');
            setAudioStatus('playing');
          };

          utterance.onend = () => {
            console.log('✅ Browser TTS completed');
            onComplete();
          };

          utterance.onerror = (err) => {
            console.warn('Browser TTS error:', err);
            setUserFriendlyErrorMessage('audio_failed');
            onComplete();
          };

          window.speechSynthesis.speak(utterance);
          audioRef.current = { pause: () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          } };
          
        } catch (error) {
          console.error('Browser TTS failed:', error);
          setUserFriendlyErrorMessage('audio_failed');
          onComplete();
        }
      };

      // If no server audio, use browser TTS immediately
      if (!audioB64) {
        fallbackToBrowserTTS('No server audio provided');
        return;
      }

      try {
        const audio = new Audio();
        audioRef.current = audio;

        // Set up timeout
        audioTimeoutRef.current = setTimeout(() => {
          console.warn('Audio loading timeout');
          fallbackToBrowserTTS('Loading timeout');
        }, AUDIO_TIMEOUT);

        audio.oncanplaythrough = () => {
          clearTimeout(audioTimeoutRef.current);
          console.log('✅ Server audio ready, starting playback');
          
          audio.play()
            .then(() => {
              console.log('✅ Server audio playback started');
              setAudioStatus('playing');
            })
            .catch(err => {
              console.warn('Server audio play failed:', err);
              fallbackToBrowserTTS('Server audio play failed');
            });
        };

        audio.onended = () => {
          console.log('✅ Server audio completed');
          onComplete();
        };

        audio.onerror = (err) => {
          console.warn('Server audio error:', err);
          clearTimeout(audioTimeoutRef.current);
          fallbackToBrowserTTS('Server audio error');
        };

        // Set source and start loading
        audio.src = `data:audio/mp3;base64,${audioB64}`;
        audio.load();

      } catch (error) {
        console.error('Audio setup failed:', error);
        clearTimeout(audioTimeoutRef.current);
        fallbackToBrowserTTS('Audio setup failed');
      }
    });
  }, [setUserFriendlyErrorMessage]);

  // Cancel any playing audio
  const cancelAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {
        console.warn('Error pausing audio:', e);
      }
      audioRef.current = null;
    }
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error canceling speech synthesis:', e);
      }
    }
    
    clearTimeout(audioTimeoutRef.current);
    setIsPlaying(false);
    setAudioStatus('ready');
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.abort();
      recognizerRunning.current = false;
      setIsListening(false);
      clearTimeout(manualMicTimeoutRef.current);
    } catch (err) {
      console.warn('Failed to stop microphone:', err);
    }
  }, []);

  // IMPROVED: Speech recognition with better error handling
  const createRecognition = useCallback(() => {
    if (typeof window === 'undefined') {
      setMicStatus('unavailable');
      return null;
    }
    
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicStatus('unavailable');
      return null;
    }
    
    try {
      const recog = new SR();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onstart = () => {
        console.log('🎤 Speech recognition started');
        recognizerRunning.current = true;
        setIsListening(true);
        setMicStatus('available');
        finalRef.current = [];
        clearErrorMessage();
      };

      recog.onresult = evt => {
        // Stop any playing audio when user speaks
        if (isPlaying) {
          cancelAudio();
        }
        
        let interim = '';
        if (evt.results && Array.isArray(evt.results)) {
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const r = evt.results[i];
            if (r.isFinal) {
              finalRef.current.push(r[0].transcript.trim());
            } else {
              interim += r[0].transcript;
            }
          }
        }
        
        const combined = [...finalRef.current, interim].join(' ').trim();
        setInputText(combined);
        lastHeardRef.current = Date.now();

        clearTimeout(manualMicTimeoutRef.current);
        if (combined && !sendingLock.current) {
          manualMicTimeoutRef.current = setTimeout(
            () => {
              // Use the ref to call handleSend to avoid circular dependency
              if (handleSendRef.current) {
                handleSendRef.current(combined, true);
              }
            },
            AUTO_SEND_DELAY
          );
        }
      };

      recog.onend = () => {
        console.log('🎤 Speech recognition ended');
        recognizerRunning.current = false;
        setIsListening(false);
        clearTimeout(manualMicTimeoutRef.current);
        
        if (alwaysListen && !isPlaying && !sendingLock.current && pageActiveRef.current) {
          setTimeout(() => {
            if (recog && recognizerRunning.current === false) {
              try { 
                recog.start(); 
              } catch (err) {
                console.warn('Failed to restart recognition:', err);
                setMicStatus('error');
              }
            }
          }, 350);
        }
      };

      recog.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        recognizerRunning.current = false;
        setIsListening(false);
        
        switch (event.error) {
          case 'not-allowed':
            setMicStatus('denied');
            setUserFriendlyErrorMessage('microphone_denied');
            break;
          case 'network':
            setMicStatus('error');
            setUserFriendlyErrorMessage('network_error');
            break;
          case 'no-speech':
            // Don't show error for no speech
            break;
          case 'aborted':
            // Don't show error for intentional abort
            break;
          default:
            setMicStatus('error');
            setUserFriendlyErrorMessage('microphone_unavailable');
        }
        
        try {
          recog.abort();
        } catch (e) {
          console.warn('Error aborting recognition:', e);
        }
      };

      return recog;
    } catch (err) {
      console.error('Failed to create speech recognition:', err);
      setMicStatus('unavailable');
      setUserFriendlyErrorMessage('speech_not_supported');
      return null;
    }
  }, [alwaysListen, isPlaying, cancelAudio, clearErrorMessage, setUserFriendlyErrorMessage]);

  // Start listening with permission check
  const startListening = useCallback(async () => {
    if (!isSpeechSupported) {
      setUserFriendlyErrorMessage('speech_not_supported');
      return;
    }

    // Check permissions first
    if (micStatus === 'denied') {
      setUserFriendlyErrorMessage('microphone_denied');
      return;
    }

    try {
      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      setMicStatus('available');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setMicStatus('denied');
        setUserFriendlyErrorMessage('microphone_denied');
        return;
      } else {
        setMicStatus('error');
        setUserFriendlyErrorMessage('microphone_unavailable');
        return;
      }
    }
    
    cancelAudio();
    
    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
      if (!recognitionRef.current) return;
    }
    
    try { 
      recognitionRef.current.start();
      setIsListening(true);
    } catch(err) {
      console.warn('Failed to start microphone:', err);
      setIsListening(false);
      setMicStatus('error');
      setUserFriendlyErrorMessage('microphone_unavailable');
    }
  }, [isSpeechSupported, micStatus, cancelAudio, createRecognition, setUserFriendlyErrorMessage]);

  // ENHANCED: Send message with better error handling and retry logic
  const handleSend = useCallback(
    async (rawText, fromMic = false) => {
      if (sendingLock.current || isSending) return;
      
      const txt = rawText.trim();
      if (!txt || txt === lastSentRef.current) return;
      
      sendingLock.current = true;
      setIsSending(true);
      lastSentRef.current = txt;
      
      // Cancel any ongoing requests
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      stopListening();
      clearErrorMessage();

      // Update UI immediately
      const userMsgId = `u-${Date.now()}`;
      const botMsgId = `b-${Date.now()}`;
      setConversation(c => [
        ...c,
        { id: userMsgId, sender: 'user', text: txt },
        { id: botMsgId, sender: 'bot', text: '', loading: true }
      ]);
      setInputText('');
      finalRef.current = [];

      try {
        // Store user message
        await api.post(`/chats/${activeChatId}/messages`, { role: 'user', text: txt });

        // Prepare conversation history
        const full = conversation.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text
        }));
        full.push({ role: 'user', text: txt });
        const history = full.slice(-HISTORY_WINDOW);

        // Get voice configuration
        const currentVoiceConfig = getCurrentVoiceConfig();
        console.log('📤 Sending voice config:', currentVoiceConfig);

        // API request with retries
        const makeRequest = async (retryCount = 0) => {
          try {
            setConnectionStatus('connecting');
            
            const requestBody = {
              session_id: activeChatId,
              message: txt,
              scenario_key: scenario?.key,
              history,
              voice: {
                voiceName: currentVoiceConfig.voiceName,
                languageCode: currentVoiceConfig.languageCode,
                profile: currentVoiceConfig.profile || 'default'
              }
            };
            
            console.log('📤 Sending request to:', chatRoleplayEndpoint);
            
            const controller = abortControllerRef.current;
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const res = await fetch(chatRoleplayEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            setConnectionStatus('connected');
            
            if (!res.ok) {
              const errorText = await res.text();
              console.error('Server error:', res.status, errorText);
              throw new Error(`Server error: ${res.status}`);
            }
            
            const responseData = await res.json();
            console.log('📥 Received response:', {
              hasText: !!(responseData.reply || responseData.response || responseData.text),
              hasAudio: !!(responseData.audio || responseData.replyAudio),
              voiceUsed: responseData.voice_used
            });
            
            return responseData;
            
          } catch (err) {
            console.error('API request failed:', err);
            
            if (retryCount < MAX_API_RETRIES && err.name !== 'AbortError') {
              console.log(`🔄 Retrying request (${retryCount + 1}/${MAX_API_RETRIES})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return makeRequest(retryCount + 1);
            }
            
            throw err;
          }
        };

        const responseData = await makeRequest();
        
        // Extract response text and audio
        const responseText = responseData.reply || responseData.response || responseData.text || "I'm here to help! Could you try asking that again?";
        const responseAudio = responseData.audio || responseData.replyAudio;
        
        console.log('✅ Processing response:', {
          textLength: (responseText || '').length,
          hasAudio: !!responseAudio
        });

        // Store bot response
        await api.post(`/chats/${activeChatId}/messages`, { role: 'bot', text: responseText });
        
        // Update UI with response
        setConversation(c => c.map(m => 
          m.id === botMsgId ? { ...m, loading: false, text: responseText } : m
        ));
        
        // Update chat instances
        setChatInstances(instances => 
          instances.map(inst => 
            inst.id === activeChatId 
              ? { 
                  ...inst, 
                  messages: [
                    ...inst.messages.filter(m => m.role === 'user' || m.text !== ''), 
                    { role: 'user', text: txt },
                    { role: 'bot', text: responseText }
                  ]
                }
              : inst
          )
        );

        // Auto-scroll to bottom
        setTimeout(() => {
          if (historyRef.current) {
            historyRef.current.scrollTo({
              top: historyRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);

        // Play audio response
        console.log('🎵 Starting audio playback...');
        await playAudio(responseAudio, responseText, currentVoiceConfig);

      } catch (err) {
        console.error("Error in message workflow:", err);
        setConnectionStatus('error');
        
        let errorText = "I'm having trouble right now. Could you try again?";
        let errorKey = 'api_error';
        
        if (err.name === 'AbortError') {
          errorText = "Request timed out. Please try again.";
          errorKey = 'timeout_error';
        } else if (err.message.includes('Server error: 5')) {
          errorKey = 'server_error';
        } else if (err.message.includes('Failed to fetch')) {
          errorKey = 'network_error';
        }
        
        setConversation(c => c.map(m => 
          m.id === botMsgId ? { ...m, loading: false, text: errorText } : m
        ));
        
        setUserFriendlyErrorMessage(errorKey);
      } finally {
        sendingLock.current = false;
        setIsSending(false);
        
        // Resume listening if in always-listen mode
        if (alwaysListen && pageActiveRef.current && micStatus === 'available') {
          setTimeout(() => startListening(), 500);
        }
      }
    },
    [
      isSending, activeChatId, scenario?.key, conversation, 
      stopListening, clearErrorMessage, getCurrentVoiceConfig,
      setChatInstances, playAudio, alwaysListen, micStatus, 
      startListening, setUserFriendlyErrorMessage
    ]
  );

  // Store handleSend in ref for use in createRecognition
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // Replay message functionality
  const replayMessage = useCallback(async (text) => {
    if (isPlaying || isSending) return;
    
    console.log('🔄 Replaying message:', text.substring(0, 50) + '...');
    const voiceConfig = getCurrentVoiceConfig();
    await playAudio(null, text, voiceConfig); // Use browser TTS for replay
  }, [isPlaying, isSending, getCurrentVoiceConfig, playAudio]);

  // Manual mic toggle
  const onMicClick = useCallback(async () => {
    if (alwaysListen) return; // Always-listen mode handles this differently
    
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [alwaysListen, isListening, stopListening, startListening]);

  // Send typed message
  const onSendClick = useCallback(() => {
    if (inputText.trim() && !isSending) {
      handleSend(inputText, false);
      setInputText('');
    }
  }, [inputText, isSending, handleSend]);

  // Check browser support and permissions
  useEffect(() => {
    const checkSupport = async () => {
      // Check speech recognition support
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setIsSpeechSupported(false);
        setMicStatus('unavailable');
        setUserFriendlyErrorMessage('speech_not_supported');
        return;
      }

      // Check microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Clean up
        setMicStatus('available');
        console.log('✅ Microphone access granted');
      } catch (error) {
        console.warn('Microphone permission check failed:', error);
        if (error.name === 'NotAllowedError') {
          setMicStatus('denied');
          setUserFriendlyErrorMessage('microphone_denied');
        } else {
          setMicStatus('error');
          setUserFriendlyErrorMessage('microphone_unavailable');
        }
      }
    };

    checkSupport();
  }, [setUserFriendlyErrorMessage]);

  // Load chat when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;
    const inst = Array.isArray(chatInstances) 
      ? chatInstances.find(c => c.id === activeChatId)
      : null;
    if (inst?.messages) {
      setConversation(normalize(inst.messages));
    } else {
      setConversation([]);
    }
  }, [activeChatId, chatInstances]);

  // Initialize recognition
  useEffect(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = createRecognition();
    return () => {
      recognitionRef.current?.abort();
      clearTimeout(manualMicTimeoutRef.current);
    };
  }, [createRecognition]);

  // Handle always-listen mode
  useEffect(() => {
    if (alwaysListen && micStatus === 'available' && !isSending) {
      startListening();
    } else if (!alwaysListen) {
      stopListening();
    }
  }, [alwaysListen, micStatus, isSending, startListening, stopListening]);

  // Idle timeout for always-listen
  useEffect(() => {
    if (!alwaysListen) return;
    const intervalId = setInterval(() => {
      if (Date.now() - lastHeardRef.current > ALWAYS_IDLE_TIMEOUT) {
        onToggleListen(false);
        setUserFriendlyErrorMessage('microphone_unavailable', 'Voice mode turned off due to inactivity. Click the microphone to start again.', 5000);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [alwaysListen, onToggleListen, setUserFriendlyErrorMessage]);

  // Scroll detection
  useEffect(() => {
    const el = historyRef.current;
    if (!el) return;
    
    const checkScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScroll(!isNearBottom);
    };
    
    el.addEventListener('scroll', checkScroll);
    
    if (conversation.length > 0) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        checkScroll();
      }, 100);
    }
    
    return () => el.removeEventListener('scroll', checkScroll);
  }, [conversation]);

  // Enhanced sidebar state management and app container class updates
  useEffect(() => {
    const updateSidebarState = () => {
      const newSidebarState = detectSidebarState();
      if (newSidebarState !== sidebarOpen) {
        setSidebarOpen(newSidebarState);
        
        // Update app container class for CSS targeting
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          if (newSidebarState) {
            appContainer.classList.add('sidebar-open');
          } else {
            appContainer.classList.remove('sidebar-open');
          }
        }
      }
    };

    // Initial check
    updateSidebarState();

    // Set up observers for sidebar changes
    const checkInterval = setInterval(updateSidebarState, 100);
    
    // Listen for click events that might toggle the sidebar
    const handleClick = (e) => {
      if (e.target.closest('.sidebar-toggle') || 
          e.target.closest('[data-toggle="sidebar"]') ||
          e.target.closest('.menu-toggle') ||
          e.target.closest('.hamburger')) {
        clearTimeout(layoutUpdateTimeoutRef.current);
        layoutUpdateTimeoutRef.current = setTimeout(updateSidebarState, 50);
      }
    };
    
    document.addEventListener('click', handleClick);
    window.addEventListener('resize', updateSidebarState);
    
    // Observer for DOM changes that might affect sidebar
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          const target = mutation.target;
          if (target.classList?.contains('sidebar') || 
              target.classList?.contains('app-container') ||
              target.classList?.contains('sidebar-toggle')) {
            clearTimeout(layoutUpdateTimeoutRef.current);
            layoutUpdateTimeoutRef.current = setTimeout(updateSidebarState, 50);
          }
        }
      });
    });
    
    // Observe the document for changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true
    });
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(layoutUpdateTimeoutRef.current);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('resize', updateSidebarState);
      observer.disconnect();
    };
  }, [sidebarOpen, detectSidebarState]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pageActiveRef.current = false;
        stopListening();
        cancelAudio();
      } else {
        pageActiveRef.current = true;
        if (alwaysListen && micStatus === 'available') {
          setTimeout(() => startListening(), 100);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => {
      pageActiveRef.current = false;
      stopListening();
      cancelAudio();
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [alwaysListen, micStatus, stopListening, startListening, cancelAudio]);

  // Focus input when appropriate
  useEffect(() => {
    const focusInput = () => {
      if (inputFocusRef.current && !isListening && !isPlaying && !isSending) {
        try {
          inputFocusRef.current.focus();
        } catch (e) {
          console.warn('Failed to focus input:', e);
        }
      }
    };
    
    const timeoutId = setTimeout(focusInput, 300);
    return () => clearTimeout(timeoutId);
  }, [conversation, isListening, isPlaying, isSending]);

  // Render methods
  const renderErrorBanner = () => {
    if (!userFriendlyError) return null;
    
    return (
      <div className="error-banner user-friendly">
        <div className="error-content">
          <AlertCircle size={16} />
          <span>{userFriendlyError}</span>
        </div>
        <button 
          onClick={clearErrorMessage}
          className="error-dismiss"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const renderStatusIndicators = () => {
    const currentVoice = getCurrentVoiceConfig();
    
    return (
      <div className="status-indicators">
        {/* Microphone Status */}
        <div>
          {micStatus === 'available' ? <Mic size={14} color="#22c55e" /> : <MicOff size={14} color="#ef4444" />}
          <span>
            {micStatus === 'available' && 'Mic Ready'}
            {micStatus === 'denied' && 'Mic Blocked'}
            {micStatus === 'error' && 'Mic Error'}
            {micStatus === 'unavailable' && 'Mic Unavailable'}
          </span>
        </div>

        {/* Audio Status */}
        <div>
          <Headphones size={14} color={audioStatus === 'ready' ? '#22c55e' : '#f59e0b'} />
          <span>
            {audioStatus === 'ready' && 'Audio Ready'}
            {audioStatus === 'loading' && 'Loading Audio...'}
            {audioStatus === 'playing' && 'Playing...'}
            {audioStatus === 'error' && 'Audio Error'}
          </span>
        </div>

        {/* Voice Info */}
        <div>
          <Volume2 size={14} />
          <span>Voice: {currentVoice?.label || currentVoice?.voiceName || 'Default'}</span>
        </div>

        {/* Connection Status */}
        <div style={{
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: connectionStatus === 'connected' ? '#dcfce7' : 
                           connectionStatus === 'connecting' ? '#fef3c7' : '#fef2f2',
          color: connectionStatus === 'connected' ? '#166534' : 
                 connectionStatus === 'connecting' ? '#92400e' : '#dc2626'
        }}>
          {connectionStatus === 'connected' && '● Connected'}
          {connectionStatus === 'connecting' && '○ Connecting...'}
          {connectionStatus === 'error' && '● Connection Error'}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="chat-wrapper">
      {renderErrorBanner()}
      
      <div className="chat-content">
        {renderStatusIndicators()}
        
        <div className="chat-detail">
          <div className="chat-history" ref={historyRef}>
            {conversation.length === 0 ? (
              <div className="empty-state">
                <div style={{ marginBottom: '16px' }}>
                  {micStatus === 'available' ? 
                    <Mic size={32} color="#22c55e" /> : 
                    <MicOff size={32} color="#ef4444" />
                  }
                </div>
                <h3>Ready to Chat</h3>
                <p>Start by typing a message or clicking the microphone to speak.</p>
                {micStatus !== 'available' && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'var(--chat-surface)', 
                    borderRadius: '8px',
                    color: 'var(--chat-error)',
                    border: '1px solid var(--chat-border)'
                  }}>
                    {micStatus === 'denied' && 'Please allow microphone access to use voice features.'}
                    {micStatus === 'error' && 'Microphone not working. Please check your settings.'}
                    {micStatus === 'unavailable' && 'Voice features not supported in this browser.'}
                  </div>
                )}
              </div>
            ) : (
              conversation.map(m => (
                <div
                  key={m.id}
                  className={`chat-bubble ${m.sender}${m.loading ? ' loading' : ''}${activeMessageId === m.id ? ' active' : ''}`}
                  onClick={() => {
                    if (m.sender === 'bot' && !m.loading) {
                      setActiveMessageId(m.id);
                    }
                  }}
                >
                  {m.loading ? (
                    <div className="loading-indicator">
                      <Loader size={16} className="spin" />
                      <span>
                        {isSending && 'Thinking...'}
                        {audioStatus === 'loading' && 'Preparing response...'}
                        {!isSending && audioStatus !== 'loading' && 'Getting response...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p>{m.text}</p>
                      {m.sender === 'bot' && (
                        <button 
                          className="play-again-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            replayMessage(m.text);
                          }}
                          disabled={isPlaying || isSending}
                          aria-label="Play message again"
                          title="Play this message again"
                        >
                          <Volume2 size={16} />
                          {isPlaying && 'Playing...'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          {showScroll && (
            <button
              className="scroll-to-bottom visible"
              onClick={() =>
                historyRef.current.scrollTo({
                  top: historyRef.current.scrollHeight,
                  behavior: 'smooth'
                })
              }
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </button>
          )}
          
          {(isListening || alwaysListen) && (
            <div className="transcript-bar">
              {inputText || <em style={{ opacity: 0.8 }}>Listening for your voice...</em>}
            </div>
          )}
          
          <div className="chat-input-container">
            <div className="input-wrapper">
              <button
                className={`mic-btn ${isListening ? 'listening' : ''} ${micStatus !== 'available' ? 'disabled' : ''}`}
                onClick={onMicClick}
                aria-label={isListening ? "Stop recording" : "Start recording"}
                disabled={micStatus !== 'available' || isSending}
              >
                {micStatus === 'available' ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              
              <input
                ref={inputFocusRef}
                type="text"
                placeholder={
                  micStatus === 'available' ? "Type or speak your message..." : 
                  "Type your message..."
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    onSendClick(); 
                  } 
                }}
                disabled={isSending}
              />
              
              <button
                className="send-btn"
                disabled={!inputText.trim() || isSending}
                onClick={onSendClick}
                aria-label="Send message"
              >
                {isSending ? <Loader size={18} className="spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}