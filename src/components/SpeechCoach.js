import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Volume2, AlertCircle, Loader, RefreshCw, BookOpen, TrendingUp, Lightbulb, Clock, AlertTriangle, Info, X, ChevronDown, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { TTSService } from '../services/TTSService';
import api from '../api';

// Enhanced configs for better coaching experience
const AUTO_SEND_DELAY = 2500;
const HISTORY_WINDOW = 15;
const API_RETRY_COUNT = 3;

// Activity detection settings
const USER_IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const PROGRESS_FETCH_COOLDOWN = 30 * 1000; // 30 seconds minimum between fetches
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce for API calls
const CACHE_DURATION = 60 * 1000; // 1 minute cache duration

// ENHANCED Sidebar spawning constants (simplified)
const SIDEBAR_WIDTH = 300;
const SIDEBAR_TRANSITION_DURATION = 300; // milliseconds

// SECURE: Validate required API endpoints and use individual endpoint variables
const validateAndGetApiEndpoints = () => {
  const speechCoachEndpoint = process.env.REACT_APP_SPEECH_COACH_ENDPOINT;
  const deepSpeakEndpoint = process.env.REACT_APP_DEEPSPEAK_ENDPOINT;
  const usageEndpoint = process.env.REACT_APP_USAGE_ENDPOINT;
  const healthEndpoint = process.env.REACT_APP_HEALTH_ENDPOINT;
  const learningProgressEndpoint = process.env.REACT_APP_LEARNING_PROGRESS_ENDPOINT;
  
  // Check for missing endpoints
  const missingEndpoints = [];
  if (!speechCoachEndpoint) missingEndpoints.push('REACT_APP_SPEECH_COACH_ENDPOINT');
  if (!deepSpeakEndpoint) missingEndpoints.push('REACT_APP_DEEPSPEAK_ENDPOINT');
  if (!usageEndpoint) missingEndpoints.push('REACT_APP_USAGE_ENDPOINT');
  if (!healthEndpoint) missingEndpoints.push('REACT_APP_HEALTH_ENDPOINT');
  if (!learningProgressEndpoint) missingEndpoints.push('REACT_APP_LEARNING_PROGRESS_ENDPOINT');
  
  if (missingEndpoints.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEndpoints.join(', ')}. ` +
      'Please check your .env file and ensure all API endpoints are configured.'
    );
  }

  return {
    API_ENDPOINT: speechCoachEndpoint,
    DEEPSPEAK_ENDPOINT: deepSpeakEndpoint,
    USAGE_ENDPOINT: usageEndpoint,
    HEALTH_ENDPOINT: healthEndpoint,
    LEARNING_PROGRESS_ENDPOINT: learningProgressEndpoint
  };
};

// Initialize endpoints with validation
let ENDPOINTS;
try {
  ENDPOINTS = validateAndGetApiEndpoints();
} catch (error) {
  console.error('❌ [API Configuration Error]:', error.message);
  ENDPOINTS = {
    API_ENDPOINT: '/api/speech-coach',
    USAGE_ENDPOINT: '/api/usage',
    HEALTH_ENDPOINT: '/api/health',
    LEARNING_PROGRESS_ENDPOINT: '/api/learning-progress'
  };
}

const API_ENDPOINT = ENDPOINTS.API_ENDPOINT;
const USAGE_ENDPOINT = ENDPOINTS.USAGE_ENDPOINT;
const HEALTH_ENDPOINT = ENDPOINTS.HEALTH_ENDPOINT;
const LEARNING_PROGRESS_ENDPOINT = ENDPOINTS.LEARNING_PROGRESS_ENDPOINT;

// Log successful configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ [API Configuration] All endpoints configured successfully');
}

export default function EnhancedSpeechCoach({
  sessionId,
  selectedVoice,
  sidebarOpen,
  onNewSession
}) {
  // Existing state
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState(() => {
    try {
      const saved = localStorage.getItem(`speech_coach_${sessionId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  const [activeCoachIndex, setActiveCoachIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [deepSpeakAvailable, setDeepSpeakAvailable] = useState(false);
  const [useDeepSpeak, setUseDeepSpeak] = useState(false);

  // SIMPLIFIED: Streamlined session interaction tracking
  const [sessionInteractionLevel, setSessionInteractionLevel] = useState('none');
  const [interactionMetrics, setInteractionMetrics] = useState({
    messageCount: 0,
    speechAttempts: 0,
    totalSessionTime: 0,
    lastInteractionTime: null,
    hasRecordedSpeech: false,
    hasReceivedFeedback: false
  });

  // FIXED: Simplified sidebar and layout state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Learning progress state with caching
  const [learningProgress, setLearningProgress] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [vocabularyHighlight, setVocabularyHighlight] = useState(null);
  const [proverbHighlight, setProverbHighlight] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    interactions: 0,
    vocabularyLearned: 0,
    proverbsShared: 0,
    sessionDuration: 0
  });

  // Daily limit and activity tracking state
  const [dailyLimitStatus, setDailyLimitStatus] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(true);
  const [showUsageWarning, setShowUsageWarning] = useState(false);

  // Enhanced scrolling state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Enhanced user-friendly status state
  const [systemStatus, setSystemStatus] = useState({
    microphone: 'checking',
    speechRecognition: 'checking',
    connection: 'checking',
    overallStatus: 'initializing'
  });
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [permissionHelp, setPermissionHelp] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalSegments = useRef([]);
  const ttsRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isUnmountingRef = useRef(false);
  const lastResponseRef = useRef(null);
  
  // FIXED: Simplified activity and caching refs
  const lastProgressFetch = useRef(0);
  const lastUsageFetch = useRef(0);
  const activityCheckInterval = useRef(null);
  const conversationSaveTimeout = useRef(null);
  const progressCache = useRef({ data: null, timestamp: 0 });
  const usageCache = useRef({ data: null, timestamp: 0 });

  // Enhanced scrolling refs
  const conversationAreaRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const autoScrollEnabled = useRef(true);

  // SIMPLIFIED: Basic sidebar transition refs
  const sidebarTransitionTimeout = useRef(null);

  // Session timing ref
  const sessionStartTime = useRef(Date.now());

  // Mobile detection helper
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // FIXED: Debounced API call helper
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // FIXED: Cache helper
  const isCacheValid = useCallback((cache, duration = CACHE_DURATION) => {
    return cache.data && (Date.now() - cache.timestamp) < duration;
  }, []);

  // ENHANCED: Simplified interaction tracking
  const markUserInteraction = useCallback((interactionType, details = {}) => {
    const timestamp = Date.now();
    
    setInteractionMetrics(prev => {
      const updated = {
        ...prev,
        lastInteractionTime: timestamp,
        totalSessionTime: timestamp - sessionStartTime.current
      };
      
      switch (interactionType) {
        case 'speech_started':
          updated.speechAttempts += 1;
          updated.hasRecordedSpeech = true;
          break;
        case 'message_sent':
          updated.messageCount += 1;
          break;
        case 'feedback_received':
          updated.hasReceivedFeedback = true;
          break;
        default:
          break;
      }
      
      return updated;
    });
    
    // Update interaction level
    const newLevel = (() => {
      if (interactionMetrics.messageCount >= 3 && interactionMetrics.hasReceivedFeedback) {
        return 'meaningful';
      } else if (interactionMetrics.messageCount >= 1 || interactionMetrics.hasRecordedSpeech) {
        return 'engaged';
      } else if (interactionType !== 'session_opened') {
        return 'started';
      }
      return sessionInteractionLevel;
    })();
    
    if (newLevel !== sessionInteractionLevel) {
      setSessionInteractionLevel(newLevel);
    }
    
    // Reset user activity tracking
    setLastUserActivity(timestamp);
    setIsUserActive(true);
  }, [sessionInteractionLevel, interactionMetrics]);

  // ENHANCED: Smart session validation
  const isSessionMeaningfullyUsed = useCallback(() => {
    const hasConversation = conversation.length > 0;
    const hasMeaningfulInteraction = sessionInteractionLevel === 'meaningful' || sessionInteractionLevel === 'engaged';
    const hasMinimumActivity = interactionMetrics.messageCount >= 1;
    const hasRecordedSpeech = interactionMetrics.hasRecordedSpeech;
    
    return hasConversation || hasMeaningfulInteraction || hasMinimumActivity || hasRecordedSpeech;
  }, [conversation.length, sessionInteractionLevel, interactionMetrics]);

  // Helper to get current voice configuration
  const getCurrentVoiceConfig = useCallback(() => {
    if (!selectedVoice) {
      return { voiceName: 'en-US-Chirp3-HD-Aoede', languageCode: 'en-US', profile: 'default' };
    }
    
    if (typeof selectedVoice === 'object' && selectedVoice.voiceName) {
      return selectedVoice;
    }
    
    if (typeof selectedVoice === 'string') {
      return { voiceName: selectedVoice, languageCode: 'en-US', profile: 'default' };
    }
    
    return {
      voiceName: selectedVoice.voiceName || selectedVoice.name || 'en-US-Chirp3-HD-Aoede',
      languageCode: selectedVoice.languageCode || 'en-US',
      profile: selectedVoice.profile || 'default'
    };
  }, [selectedVoice]);

  // TTS functions
  const speakWithBrowserTTS = useCallback((text, voiceConfig, onEndCallback) => {
    const utterance = new window.SpeechSynthesisUtterance(text);
    
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.name === voiceConfig.voiceName) ||
                  voices.find(v => v.lang === voiceConfig.languageCode) ||
                  voices.find(v => v.default) ||
                  voices[0];
      
      if (voice) utterance.voice = voice;
    }
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      ttsRef.current = null;
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      ttsRef.current = null;
      if (onEndCallback) onEndCallback();
    };
    
    ttsRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, []);

  // Initialize TTS service
  const ttsService = useMemo(() => new TTSService(process.env.REACT_APP_API_URL || ''), []);
  
  const speakWithDeepSpeak = useCallback(async (text, voiceConfig, onEndCallback) => {
    try {
      setIsPlaying(true);
      
      const result = await ttsService.makeTextToSpeechRequest(text, voiceConfig);
      
      if (result?.success && result.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${result.audio}`);
        ttsRef.current = audio;
        
        audio.onended = () => {
          setIsPlaying(false);
          ttsRef.current = null;
          if (onEndCallback) onEndCallback();
        };
        
        audio.onerror = () => {
          console.warn('TTS audio playback failed, falling back to browser TTS');
          speakWithBrowserTTS(text, voiceConfig, onEndCallback);
        };
        
        await audio.play();
      } else {
        throw new Error('No audio received from TTS service');
      }
    } catch (error) {
      console.warn('TTS failed, falling back to browser TTS:', error);
      speakWithBrowserTTS(text, voiceConfig, onEndCallback);
    }
  }, [speakWithBrowserTTS, ttsService]);

  const cancelSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      try { 
        window.speechSynthesis.cancel(); 
      } catch (error) {
        // Ignore speech synthesis errors
      }
    }
    if (ttsRef.current) {
      if (typeof ttsRef.current.pause === 'function') {
        try { 
          ttsRef.current.pause(); 
        } catch (error) {
          // Ignore audio pause errors
        }
      }
      ttsRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const speakText = useCallback((text, onEndCallback, useServerTTS = false) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    const currentVoice = getCurrentVoiceConfig();
    
    if (useServerTTS && useDeepSpeak && deepSpeakAvailable) {
      speakWithDeepSpeak(text, currentVoice, onEndCallback);
    } else {
      speakWithBrowserTTS(text, currentVoice, onEndCallback);
    }
  }, [getCurrentVoiceConfig, useDeepSpeak, deepSpeakAvailable, speakWithDeepSpeak, speakWithBrowserTTS]);

  const stopMicrophone = useCallback(() => {
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.abort(); 
      } catch (error) {
        console.warn('Recognition cleanup error:', error);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    clearTimeout(timerRef.current);
  }, []);

  // FIXED: Simplified sidebar state management
  const handleSidebarStateChange = useCallback((newSidebarState) => {
    setIsTransitioning(true);
    
    if (sidebarTransitionTimeout.current) {
      clearTimeout(sidebarTransitionTimeout.current);
    }
    
    sidebarTransitionTimeout.current = setTimeout(() => {
      setIsTransitioning(false);
    }, SIDEBAR_TRANSITION_DURATION);
  }, []);

  // Monitor sidebar prop changes
  useEffect(() => {
    handleSidebarStateChange(sidebarOpen);
  }, [sidebarOpen, handleSidebarStateChange]);

  // Enhanced system status checker
  const checkSystemStatus = useCallback(async () => {
    console.log('🔍 Checking system status...');
    
    const newStatus = {
      microphone: 'checking',
      speechRecognition: 'checking',
      connection: 'checking',
      overallStatus: 'initializing'
    };

    // Check Speech Recognition
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      newStatus.speechRecognition = 'unsupported';
    } else {
      newStatus.speechRecognition = 'ready';
    }

    // Check microphone permissions
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        if (permission.state === 'granted') {
          newStatus.microphone = 'ready';
        } else if (permission.state === 'denied') {
          newStatus.microphone = 'denied';
        } else {
          newStatus.microphone = 'needs_permission';
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          newStatus.microphone = 'ready';
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            newStatus.microphone = 'denied';
          } else {
            newStatus.microphone = 'unavailable';
          }
        }
      }
    } catch (error) {
      newStatus.microphone = 'unavailable';
    }

    // Check connection
    try {
      const testResponse = await fetch(HEALTH_ENDPOINT, { 
        method: 'HEAD',
        timeout: 5000 
      });
      newStatus.connection = testResponse.ok ? 'connected' : 'disconnected';
    } catch (error) {
      newStatus.connection = 'disconnected';
    }

    // Determine overall status
    if (newStatus.speechRecognition === 'unsupported') {
      newStatus.overallStatus = 'error';
    } else if (newStatus.microphone === 'denied' || newStatus.microphone === 'unavailable') {
      newStatus.overallStatus = 'issues';
    } else if (newStatus.microphone === 'ready' && newStatus.speechRecognition === 'ready') {
      newStatus.overallStatus = 'ready';
    } else {
      newStatus.overallStatus = 'issues';
    }

    setSystemStatus(newStatus);
    return newStatus;
  }, []);

  // User-friendly error message generator
  const generateUserFriendlyError = useCallback((error, context = '') => {
    if (error.includes('denied') || error.includes('not-allowed')) {
      return {
        title: "Microphone Access Needed",
        message: "I need permission to use your microphone for speech practice.",
        action: "Please click the microphone icon in your browser's address bar and select 'Allow'",
        type: "permission"
      };
    }
    
    if (error.includes('no-speech')) {
      return {
        title: "No Speech Detected",
        message: "I didn't hear anything. Let's try again!",
        action: "Make sure you're speaking clearly and your microphone is working",
        type: "speech"
      };
    }
    
    if (error.includes('network')) {
      return {
        title: "Connection Issue",
        message: "There seems to be a problem with your internet connection.",
        action: "Please check your connection and try again",
        type: "network"
      };
    }
    
    if (error.includes('not supported')) {
      return {
        title: "Browser Not Supported",
        message: "Your browser doesn't support speech recognition.",
        action: "Please try using Chrome, Edge, or Safari for the best experience",
        type: "browser"
      };
    }
    
    return {
      title: "Something Went Wrong",
      message: "Don't worry, let's try again!",
      action: "Click the microphone button to restart",
      type: "generic"
    };
  }, []);

  // Enhanced permission helper
  const showPermissionHelp = useCallback((type) => {
    const helpInfo = {
      microphone: {
        title: "Enable Microphone Access",
        steps: isMobile() ? [
          "Tap the microphone icon in your browser's address bar",
          "Select 'Allow' when prompted",
          "If you don't see a prompt, check your browser settings",
          "Refresh the page after allowing access"
        ] : [
          "Click the microphone icon in your browser's address bar",
          "Select 'Always allow' for this site",
          "If blocked, click the lock icon next to the URL",
          "Change microphone permission to 'Allow'"
        ]
      },
      speech: {
        title: "Improve Speech Recognition",
        steps: [
          "Speak clearly and at a normal pace",
          "Make sure you're in a quiet environment",
          "Check that your microphone is working properly",
          "Try moving closer to your microphone"
        ]
      }
    };
    
    setPermissionHelp(helpInfo[type] || helpInfo.microphone);
  }, [isMobile]);

  // FIXED: Consolidated and debounced learning progress fetcher
  const fetchLearningProgress = useCallback(
    debounce(async (userInitiated = false) => {
      // Check cache first
      if (!userInitiated && isCacheValid(progressCache.current)) {
        return progressCache.current.data;
      }

      // Don't fetch if user is idle and this isn't user-initiated
      if (!userInitiated && !isUserActive) {
        return;
      }

      // Prevent excessive fetching
      const now = Date.now();
      if (now - lastProgressFetch.current < PROGRESS_FETCH_COOLDOWN) {
        return;
      }

      try {
        const url = new URL(`${LEARNING_PROGRESS_ENDPOINT}/${sessionId}`);
        if (userInitiated) {
          url.searchParams.set('user_initiated', 'true');
        }

        const response = await fetch(url.toString());
        
        if (response.ok) {
          const data = await response.json();
          
          // Update cache
          progressCache.current = {
            data: data.progress,
            timestamp: now
          };
          
          setLearningProgress(data.progress);
          setSessionStats({
            interactions: data.progress.total_interactions,
            vocabularyLearned: data.progress.vocabulary_learned,
            proverbsShared: data.progress.proverbs_shared,
            sessionDuration: data.progress.session_duration_minutes
          });
          lastProgressFetch.current = now;
          
          return data.progress;
        }
      } catch (error) {
        console.warn('Failed to fetch learning progress:', error);
      }
    }, DEBOUNCE_DELAY),
    [sessionId, isUserActive, isCacheValid]
  );

  // FIXED: Simplified user activity tracking
  const markUserActivity = useCallback(() => {
    const now = Date.now();
    setLastUserActivity(now);
    setIsUserActive(true);
    markUserInteraction('user_activity', { timestamp: now });
  }, [markUserInteraction]);

  // Check if user is currently active
  const checkUserActivity = useCallback(() => {
    const now = Date.now();
    const isActive = (now - lastUserActivity) < USER_IDLE_THRESHOLD;
    
    if (isActive !== isUserActive) {
      setIsUserActive(isActive);
    }
  }, [lastUserActivity, isUserActive]);

  // FIXED: Consolidated and cached usage summary fetcher
  const fetchUsageSummary = useCallback(
    debounce(async () => {
      // Check cache first
      if (isCacheValid(usageCache.current)) {
        return usageCache.current.data;
      }

      try {
        const response = await fetch(USAGE_ENDPOINT);
        if (response.ok) {
          const data = await response.json();
          
          // Update cache
          usageCache.current = {
            data: data.usage_summary,
            timestamp: Date.now()
          };
          
          setUsageSummary(data.usage_summary);
          
          // Check if user is close to speech coach limit
          const speechCoachUsage = data.usage_summary.speech_coach;
          if (speechCoachUsage && speechCoachUsage.remaining <= 3 && speechCoachUsage.remaining > 0) {
            setShowUsageWarning(true);
          }
          
          return data.usage_summary;
        }
      } catch (error) {
        console.error('Failed to fetch usage summary:', error);
      }
    }, DEBOUNCE_DELAY),
    [isCacheValid]
  );

  // Handle daily limit exceeded
  const handleDailyLimitExceeded = useCallback((limitInfo) => {
    setDailyLimitStatus(limitInfo);
    setShowLimitModal(true);
    fetchUsageSummary();
  }, [fetchUsageSummary]);

  // Extract educational highlights from response
  const extractEducationalHighlights = useCallback((responseText) => {
    const vocabMatch = responseText.match(/here's a powerful word: ['"]([^'"]+)['"] means ([^.]+)/i);
    if (vocabMatch) {
      setVocabularyHighlight({
        word: vocabMatch[1],
        meaning: vocabMatch[2],
        timestamp: Date.now()
      });
      setTimeout(() => setVocabularyHighlight(null), 8000);
    }

    const proverbMatch = responseText.match(/reminds me of the wisdom: ['"]([^'"]+)['"] - ([^.]+)/i);
    if (proverbMatch) {
      setProverbHighlight({
        proverb: proverbMatch[1],
        meaning: proverbMatch[2],
        timestamp: Date.now()
      });
      setTimeout(() => setProverbHighlight(null), 10000);
    }
  }, []);

  // ENHANCED: Smart conversation clearing
  const clearConversation = useCallback(() => {
    const isMeaningfullyUsed = isSessionMeaningfullyUsed();
    
    if (!isMeaningfullyUsed) {
      return;
    }
    
    markUserActivity();
    setConversation([]);
    setActiveCoachIndex(null);
    lastResponseRef.current = null;
    autoScrollEnabled.current = true;
    
    // Reset interaction tracking
    setSessionInteractionLevel('none');
    setInteractionMetrics({
      messageCount: 0,
      speechAttempts: 0,
      totalSessionTime: 0,
      lastInteractionTime: null,
      hasRecordedSpeech: false,
      hasReceivedFeedback: false
    });
    sessionStartTime.current = Date.now();
    
    try { 
      localStorage.removeItem(`speech_coach_${sessionId}`); 
    } catch (error) {
      // Ignore localStorage errors
    }
  }, [isSessionMeaningfullyUsed, markUserActivity]);

  // FIXED: Simplified positioning functions
  const getBottomOffset = useCallback((baseOffset) => {
    return showProgress ? baseOffset + 200 : baseOffset;
  }, [showProgress]);

  const getSidebarOffset = useCallback((isDesktop) => {
    return sidebarOpen && isDesktop ? SIDEBAR_WIDTH : 0;
  }, [sidebarOpen]);

  // FIXED: Debounced conversation saving
  const saveConversationDebounced = useCallback(
    debounce(async (conversationData) => {
      if (conversationData.length === 0) return;
      
      try {
        // Create session if it doesn't exist
        try {
          await api.fetchSpeechSession(sessionId);
        } catch (error) {
          if (error.response?.status === 404) {
            await api.createSpeechSession({
              title: `Speech Session ${new Date().toLocaleDateString()}`,
              voiceConfig: getCurrentVoiceConfig()
            });
          }
        }

        // Save the latest message if it's not already saved
        const lastMessage = conversationData[conversationData.length - 1];
        if (lastMessage && !lastMessage.saved && !lastMessage.loading) {
          await api.addSpeechMessage(sessionId, {
            role: lastMessage.sender === 'user' ? 'user' : 'assistant',
            text: lastMessage.text,
            voiceUsed: lastMessage.voiceUsed,
            corrected: lastMessage.corrected,
            learningProgress: lastMessage.learningProgress
          });
          
          // Mark as saved
          setConversation(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, saved: true } : msg
          ));
        }
      } catch (error) {
        console.error('Failed to save to API:', error);
      }
    }, DEBOUNCE_DELAY),
    [sessionId, getCurrentVoiceConfig]
  );

  // Enhanced send message function
  const sendMessage = useCallback(async (text) => {
    const final = text.trim();
    if (!final || final.length < 2) return;
    
    markUserActivity();
    markUserInteraction('message_sent', { messageLength: final.length });
    
    setIsProcessing(true);
    setTranscript('');
    finalSegments.current = [];
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const newConversation = [
      ...conversation,
      { sender: 'user', text: final, timestamp: Date.now(), saved: false },
      { sender: 'coach', text: '...', loading: true }
    ];
    
    setConversation(newConversation);
    setActiveCoachIndex(newConversation.length - 1);

    stopMicrophone();

    const history = [...conversation.slice(-HISTORY_WINDOW), { sender: 'user', text: final }]
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }));

    const currentVoiceConfig = getCurrentVoiceConfig();

    const makeApiRequest = async (retryCount = 0) => {
      try {
        const body = {
          session_id: sessionId,
          transcript: final,
          history,
          voice: currentVoiceConfig
        };
        
        const controller = abortControllerRef.current;
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.status === 429) {
          const errorData = await res.json();
          if (errorData.error === "Daily limit exceeded") {
            handleDailyLimitExceeded(errorData);
            throw new Error(`Daily limit exceeded for ${errorData.service}`);
          }
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Server error: ${res.status}`);
        }
        
        const data = await res.json();
        
        markUserInteraction('feedback_received', { hasLearningProgress: !!data.learning_progress });
        
        // Update cached data
        if (data.learning_progress) {
          progressCache.current = {
            data: data.learning_progress,
            timestamp: Date.now()
          };
          
          setLearningProgress(data.learning_progress);
          setSessionStats({
            interactions: data.learning_progress.total_interactions,
            vocabularyLearned: data.learning_progress.vocabulary_learned,
            proverbsShared: data.learning_progress.proverbs_shared,
            sessionDuration: data.learning_progress.session_duration_minutes
          });
        }
        
        if (data.usage_info) {
          usageCache.current = {
            data: { ...usageSummary, speech_coach: data.usage_info },
            timestamp: Date.now()
          };
          
          setUsageSummary(prev => ({
            ...prev,
            speech_coach: data.usage_info
          }));
        }
        
        if (data.deepspeak_available !== undefined) {
          setDeepSpeakAvailable(data.deepspeak_available);
        }
        
        return {
          text: data.feedbackText || "Great! Tell me more about that.",
          audio: data.feedbackAudio,
          corrected: data.correctedSentence,
          voiceUsed: data.voice_used,
          learningProgress: data.learning_progress
        };
      } catch (err) {
        console.error('API request error:', err);
        
        if (retryCount < API_RETRY_COUNT) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return makeApiRequest(retryCount + 1);
        }
        
        return { 
          text: "I'm having trouble right now. Could you try saying that again?", 
          audio: null,
          corrected: null
        };
      }
    };

    try {
      const result = await makeApiRequest();
      lastResponseRef.current = result;
      
      extractEducationalHighlights(result.text);
      
      setConversation(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.loading);
        if (idx !== -1) {
          updated[idx] = { 
            sender: 'coach', 
            text: result.text, 
            timestamp: Date.now(),
            corrected: result.corrected,
            voiceUsed: result.voiceUsed,
            learningProgress: result.learningProgress,
            saved: false
          };
        }
        return updated;
      });
      
      setIsProcessing(false);
      setIsPlaying(true);

      if (result.audio) {
        try {
          const audio = new Audio(`data:audio/wav;base64,${result.audio}`);
          ttsRef.current = audio;
          
          audio.onended = () => {
            setIsPlaying(false);
            ttsRef.current = null;
          };
          
          audio.onerror = () => {
            console.warn('Server audio failed, using browser TTS');
            setIsPlaying(false);
            speakText(result.text, () => {}, false);
          };
          
          await audio.play();
        } catch (error) {
          console.warn('Audio playback failed, using browser TTS:', error);
          speakText(result.text, () => {}, false);
        }
      } else {
        speakText(result.text, () => {}, false);
      }
    } catch (error) {
      console.error('Send message error:', error);
      setConversation(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.loading);
        if (idx !== -1) {
          updated[idx] = { 
            sender: 'coach', 
            text: "I couldn't process that. Let's try again!", 
            timestamp: Date.now(),
            saved: false
          };
        }
        return updated;
      });
      setIsProcessing(false);
    }
  }, [conversation, markUserActivity, markUserInteraction, getCurrentVoiceConfig, sessionId, handleDailyLimitExceeded, extractEducationalHighlights, speakText, stopMicrophone, usageSummary]);

  // Enhanced microphone functions
  const startMicrophone = useCallback(() => {
    if (!isSpeechSupported || isProcessing) return;
    
    markUserActivity();
    markUserInteraction('speech_started');
    
    cancelSpeech();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSpeechSupported(false);
      const friendlyError = generateUserFriendlyError('not supported', 'speech recognition');
      setErrorMessage(friendlyError);
      return;
    }
    
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.abort(); 
      } catch (error) {
        console.warn('Recognition cleanup error:', error);
      }
      recognitionRef.current = null;
    }

    const recognition = new SR();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    if (isIOS()) {
      recognition.continuous = false;
      recognition.interimResults = false;
    }

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
      finalSegments.current = [];
      setTranscript('');
    };

    recognition.onresult = (event) => {
      markUserActivity();
      
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalSegments.current.push(result[0].transcript.trim());
        } else {
          interim += result[0].transcript;
        }
      }
      
      const combined = [...finalSegments.current, interim].join(' ').trim();
      setTranscript(combined);

      clearTimeout(timerRef.current);
      if (combined && combined.length > 3) {
        timerRef.current = setTimeout(() => sendMessage(combined), AUTO_SEND_DELAY);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      const friendlyError = generateUserFriendlyError(event.error, 'speech recognition');
      setErrorMessage(friendlyError);
      
      if (event.error === 'not-allowed') {
        showPermissionHelp('microphone');
      } else if (event.error === 'no-speech') {
        showPermissionHelp('speech');
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      const friendlyError = generateUserFriendlyError(error.message, 'start recognition');
      setErrorMessage(friendlyError);
      setIsListening(false);
    }
  }, [isProcessing, isSpeechSupported, markUserActivity, markUserInteraction, sendMessage, isIOS, generateUserFriendlyError, showPermissionHelp, cancelSpeech]);

  const replayMessage = useCallback((messageText, useServer = false) => {
    if (isPlaying) return;
    
    markUserActivity();
    markUserInteraction('message_replay', { useServer });
    
    cancelSpeech();
    setIsPlaying(true);
    
    speakText(messageText, () => {
      setIsPlaying(false);
    }, useServer);
  }, [isPlaying, markUserActivity, markUserInteraction, speakText, cancelSpeech]);

  // ENHANCED: Handle creating a new speech session
  const handleNewSession = useCallback(() => {
    const isMeaningfullyUsed = isSessionMeaningfullyUsed();
    
    if (!isMeaningfullyUsed) {
      clearConversation();
      return;
    }
    
    clearConversation();
    
    if (onNewSession) {
      const newSessionId = `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onNewSession(newSessionId);
    }
  }, [isSessionMeaningfullyUsed, onNewSession, clearConversation]);

  const toggleMicrophone = useCallback(() => {
    markUserActivity();
    
    if (isPlaying) { 
      cancelSpeech(); 
      setTimeout(() => startMicrophone(), 100);
      return; 
    }
    
    if (isListening) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }, [isListening, isPlaying, markUserActivity, startMicrophone, stopMicrophone, cancelSpeech]);

  // Load existing conversation from API on component mount
  useEffect(() => {
    const loadConversationFromAPI = async () => {
      try {
        const { data } = await api.fetchSpeechSession(sessionId);
        if (data.messages && data.messages.length > 0) {
          const normalized = data.messages.map(msg => ({
            sender: msg.role === 'user' ? 'user' : 'coach',
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
            corrected: msg.corrected,
            voiceUsed: msg.voiceUsed,
            learningProgress: msg.learningProgress,
            saved: true
          }));
          setConversation(normalized);
          markUserInteraction('session_restored', { messageCount: normalized.length });
        }
      } catch (error) {
        if (conversation.length > 0) {
          markUserInteraction('session_restored', { source: 'localStorage', messageCount: conversation.length });
        }
      }
    };

    if (sessionId) {
      loadConversationFromAPI();
    }
  }, [sessionId, markUserInteraction, conversation.length]);

  // FIXED: Debounced conversation saving
  useEffect(() => {
    if (conversation.length > 0) {
      // Save to localStorage immediately
      try { 
        const toSave = conversation.slice(-50).map(msg => ({
          ...msg,
          voiceUsed: msg.voiceUsed || getCurrentVoiceConfig()
        }));
        localStorage.setItem(`speech_coach_${sessionId}`, JSON.stringify(toSave));
      } catch (error) {
        console.warn('Failed to save conversation to localStorage:', error);
      }
      
      // Debounced API save
      saveConversationDebounced(conversation);
    }
  }, [conversation, sessionId, getCurrentVoiceConfig, saveConversationDebounced]);

  // FIXED: Simplified fetch usage summary on mount
  useEffect(() => {
    fetchUsageSummary();
    
    // Fetch usage summary every 30 minutes
    const intervalId = setInterval(fetchUsageSummary, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchUsageSummary]);

  // Enhanced scrolling functions
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (conversationAreaRef.current) {
      conversationAreaRef.current.scrollTo({
        top: conversationAreaRef.current.scrollHeight,
        behavior: behavior
      });
    }
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (!conversationAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = conversationAreaRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    const shouldShowButton = scrollHeight > clientHeight + 50 && !isNearBottom;
    
    setShowScrollToBottom(shouldShowButton);
    
    if (!isNearBottom && scrollTop > 0) {
      autoScrollEnabled.current = false;
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        autoScrollEnabled.current = true;
      }, 3000);
    }
  }, []);

  const handleScroll = useCallback(() => {
    checkScrollPosition();
  }, [checkScrollPosition]);

  const forceScrollToBottom = useCallback(() => {
    autoScrollEnabled.current = true;
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  // User activity monitoring
  useEffect(() => {
    activityCheckInterval.current = setInterval(checkUserActivity, 30000);
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      markUserActivity();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    return () => {
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current);
      }
      if (conversationSaveTimeout.current) {
        clearTimeout(conversationSaveTimeout.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (sidebarTransitionTimeout.current) {
        clearTimeout(sidebarTransitionTimeout.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [checkUserActivity, markUserActivity]);

  // Enhanced initial support checks
  useEffect(() => {
    if (isUnmountingRef.current) return;
    
    const initializeApp = async () => {
      try {
        // Check TTS availability
        const ttsAvailable = await ttsService.checkStatus();
        setDeepSpeakAvailable(ttsAvailable);
        
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          setIsSpeechSupported(true);
        } else {
          setIsSpeechSupported(false);
          setErrorMessage('Speech recognition is not supported in your browser.');
        }
        
        // Load conversation history
        await loadConversationFromAPI();
        
        // Start activity monitoring
        startActivityMonitoring();
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setErrorMessage('Failed to initialize the application. Please try refreshing the page.');
      }
    };

    initializeApp();
    
    return () => {
      isUnmountingRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore stop errors
        }
      }
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current);
      }
    };
  }, [ttsService]);

  // Auto-scroll on conversation updates
  useEffect(() => {
    if (autoScrollEnabled.current && conversation.length > 0) {
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
    }
  }, [conversation, scrollToBottom]);

  // Setup scroll monitoring
  useEffect(() => {
    const conversationArea = conversationAreaRef.current;
    if (conversationArea) {
      conversationArea.addEventListener('scroll', handleScroll);
      checkScrollPosition();
      
      return () => {
        conversationArea.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll, checkScrollPosition]);

  // Cleanup
  useEffect(() => () => {
    isUnmountingRef.current = true;
    stopMicrophone();
    cancelSpeech();
    clearTimeout(timerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (activityCheckInterval.current) clearInterval(activityCheckInterval.current);
    if (conversationSaveTimeout.current) clearTimeout(conversationSaveTimeout.current);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (sidebarTransitionTimeout.current) clearTimeout(sidebarTransitionTimeout.current);
  }, [stopMicrophone, cancelSpeech]);

  // FIXED: Simplified style calculation functions
  const getMicWrapperStyle = () => {
    const isDesktop = window.innerWidth > 768;
    const bottomOffset = getBottomOffset(90);
    const leftOffset = getSidebarOffset(isDesktop);
    
    return {
      position: 'fixed',
      bottom: `${bottomOffset}px`,
      left: `${leftOffset}px`,
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 930,
      pointerEvents: 'none',
      transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
    };
  };

  const getSpeechInputStyle = () => {
    const isDesktop = window.innerWidth > 768;
    const bottomOffset = getBottomOffset(80);
    const leftOffset = getSidebarOffset(isDesktop);
    const chatPadding = 16;
    
    return {
      position: 'fixed',
      bottom: `${bottomOffset}px`,
      left: `${leftOffset + chatPadding}px`,
      right: `${chatPadding}px`,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 1rem',
      background: 'white',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      borderRadius: '12px',
      zIndex: 950,
      border: '1px solid #ddd',
      pointerEvents: 'auto',
      boxSizing: 'border-box',
      transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
    };
  };

  const getControlsStyle = () => {
    const isDesktop = window.innerWidth > 768;
    const leftOffset = getSidebarOffset(isDesktop);
    const controlsHeight = showProgress ? 270 : 140;
    
    return {
      position: 'fixed',
      bottom: '0',
      left: `${leftOffset}px`,
      right: '0',
      height: `${controlsHeight}px`,
      background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.8) 15%, rgba(250,250,250,0.95) 30%, rgba(250,250,250,1) 60%)',
      zIndex: 900,
      pointerEvents: 'none',
      transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
    };
  };

  const getControlsBarStyle = () => {
    const isDesktop = window.innerWidth > 768;
    const leftOffset = getSidebarOffset(isDesktop);
    const chatPadding = isDesktop ? 16 : 0;
    
    return {
      position: 'fixed',
      bottom: showProgress ? '200px' : '0',
      left: `${leftOffset + chatPadding}px`,
      right: `${chatPadding}px`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      zIndex: 960,
      padding: isDesktop ? '0' : '16px',
      transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
    };
  };

  const getProgressPanelStyle = () => {
    const isDesktop = window.innerWidth > 768;
    const leftOffset = getSidebarOffset(isDesktop);
    const chatPadding = 16;
    
    return {
      position: 'fixed',
      bottom: '140px',
      left: `${leftOffset + chatPadding}px`,
      right: `${chatPadding}px`,
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: '1px solid #e0e0e0',
      zIndex: 920,
      maxWidth: '100%',
      transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
    };
  };

  // Component renderers (simplified for brevity - keeping the same render functions but removing complex spawning logic)
  
  // [All the render functions remain the same, just simplified positioning]
  const renderStatusPanel = () => {
    if (!showStatusPanel) return null;

    const getStatusIcon = (status) => {
      switch (status) {
        case 'ready': return <CheckCircle size={16} color="#22c55e" />;
        case 'checking': return <Loader size={16} color="#6b7280" className="animate-spin" />;
        case 'denied': return <AlertCircle size={16} color="#ef4444" />;
        case 'unavailable': return <X size={16} color="#ef4444" />;
        case 'connected': return <Wifi size={16} color="#22c55e" />;
        case 'disconnected': return <WifiOff size={16} color="#ef4444" />;
        case 'unsupported': return <AlertTriangle size={16} color="#f59e0b" />;
        default: return <AlertCircle size={16} color="#6b7280" />;
      }
    };

    const getStatusText = (type, status) => {
      const statusTexts = {
        microphone: {
          ready: 'Microphone ready',
          checking: 'Checking microphone...',
          denied: 'Microphone access denied',
          unavailable: 'Microphone not available',
          needs_permission: 'Microphone permission needed'
        },
        speechRecognition: {
          ready: 'Speech recognition ready',
          checking: 'Checking speech support...',
          unsupported: 'Speech not supported in this browser'
        },
        connection: {
          connected: 'Connected to server',
          checking: 'Checking connection...',
          disconnected: 'Connection issues'
        }
      };
      
      return statusTexts[type]?.[status] || `${type}: ${status}`;
    };

    const getOverallStatusMessage = () => {
      switch (systemStatus.overallStatus) {
        case 'ready':
          return {
            title: "All Systems Ready! 🎉",
            message: "You're all set to start practicing your speech.",
            color: "#22c55e"
          };
        case 'issues':
          return {
            title: "Setup Needed 🔧",
            message: "Please fix the issues below to get started.",
            color: "#f59e0b"
          };
        case 'error':
          return {
            title: "Compatibility Issue ⚠️",
            message: "Your browser doesn't support all required features.",
            color: "#ef4444"
          };
        default:
          return {
            title: "Getting Ready... ⏳",
            message: "Checking your device capabilities...",
            color: "#6b7280"
          };
      }
    };

    const overallStatus = getOverallStatusMessage();

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
        maxWidth: '350px',
        zIndex: 1200
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '18px', 
              fontWeight: '600',
              color: overallStatus.color
            }}>
              {overallStatus.title}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {overallStatus.message}
            </p>
          </div>
          <button
            onClick={() => setShowStatusPanel(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#9ca3af',
              padding: '0',
              marginLeft: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getStatusIcon(systemStatus.microphone)}
            <span style={{ fontSize: '14px', flex: 1 }}>
              {getStatusText('microphone', systemStatus.microphone)}
            </span>
            {systemStatus.microphone === 'denied' && (
              <button
                onClick={() => showPermissionHelp('microphone')}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Help
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getStatusIcon(systemStatus.speechRecognition)}
            <span style={{ fontSize: '14px', flex: 1 }}>
              {getStatusText('speechRecognition', systemStatus.speechRecognition)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getStatusIcon(systemStatus.connection)}
            <span style={{ fontSize: '14px', flex: 1 }}>
              {getStatusText('connection', systemStatus.connection)}
            </span>
          </div>
        </div>

        {systemStatus.overallStatus === 'ready' && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #0ea5e9'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0369a1', textAlign: 'center' }}>
              🎤 Tap the microphone to start practicing!
            </p>
          </div>
        )}

        <button
          onClick={checkSystemStatus}
          style={{
            width: '100%',
            marginTop: '12px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} />
          Refresh Status
        </button>
      </div>
    );
  };

  // Permission Help Modal
  const renderPermissionHelp = () => {
    if (!permissionHelp) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '450px',
          margin: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              {permissionHelp.title}
            </h3>
            <button
              onClick={() => setPermissionHelp(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#9ca3af'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            {permissionHelp.steps.map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={checkSystemStatus}
              style={{
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Check Again
            </button>
            <button
              onClick={() => setPermissionHelp(null)}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced error message component
  function renderUserFriendlyErrorMessage() {
    if (!errorMessage) return null;
    
    const getErrorIcon = (type) => {
      switch (type) {
        case 'permission': return '🎤';
        case 'speech': return '👂';
        case 'network': return '🌐';
        case 'browser': return '🌐';
        default: return '⚠️';
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        border: `2px solid ${errorMessage.type === 'permission' ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1150,
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '4px' }}>
          {getErrorIcon(errorMessage.type)}
        </div>
        
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            {errorMessage.title}
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
            {errorMessage.message}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            {errorMessage.action}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {errorMessage.type === 'permission' && (
            <button
              onClick={() => showPermissionHelp('microphone')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Show Help
            </button>
          )}
          <button
            onClick={() => setErrorMessage(null)}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Daily limit modal
  function renderDailyLimitModal() {
    if (!showLimitModal || !dailyLimitStatus) return null;

    const resetTime = new Date(dailyLimitStatus.usage_info?.reset_time * 1000);
    const timeUntilReset = resetTime.getTime() - Date.now();
    const hoursUntilReset = Math.max(0, Math.ceil(timeUntilReset / (1000 * 60 * 60)));

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          margin: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertTriangle size={24} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Daily Limit Reached</h3>
          </div>
          
          <div style={{ marginBottom: '20px', color: '#666' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              You've reached your daily limit of <strong>{dailyLimitStatus.usage_info?.daily_limit}</strong> requests 
              for speech coaching.
            </p>
            
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={16} color="#6b7280" />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Reset Information</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Your daily limits will reset in approximately <strong>{hoursUntilReset} hours</strong> at midnight UTC.
              </p>
            </div>
            
            {usageSummary && (
              <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Info size={16} color="#0369a1" />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Today's Usage</span>
                </div>
                <div style={{ fontSize: '13px', color: '#0369a1' }}>
                  {Object.entries(usageSummary).map(([service, info]) => (
                    <div key={service} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>{service.replace('_', ' ').toUpperCase()}:</span>
                      <span>{info.used}/{info.daily_limit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => fetchUsageSummary()}
              style={{
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Refresh Usage
            </button>
            <button
              onClick={() => {
                setShowLimitModal(false);
                setDailyLimitStatus(null);
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usage warning banner renderer
  const renderUsageWarning = () => {
    if (!showUsageWarning || !usageSummary?.speech_coach) return null;

    const speechCoachUsage = usageSummary.speech_coach;

    return (
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1100,
        maxWidth: '90%'
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
            Usage Warning
          </div>
          <div style={{ fontSize: '14px', color: '#92400e' }}>
            You have {speechCoachUsage.remaining} speech coaching request{speechCoachUsage.remaining !== 1 ? 's' : ''} remaining today.
            {speechCoachUsage.remaining === 1 && ' Use it wisely!'}
          </div>
        </div>
        <button
          onClick={() => setShowUsageWarning(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#92400e'
          }}
        >
          ×
        </button>
      </div>
    );
  };

  function renderDeepSpeakToggle() {
    if (!deepSpeakAvailable) return null;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useDeepSpeak}
            onChange={(e) => setUseDeepSpeak(e.target.checked)}
            style={{ margin: 0 }}
          />
          Use high-quality voice
        </label>
      </div>
    );
  }

  // FIXED: Stable progress panel component
  function renderProgressPanel() {
    if (!showProgress || !learningProgress) return null;

    return (
      <div style={getProgressPanelStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>📊 Learning Progress</h3>
          <button 
            onClick={() => setShowProgress(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >×</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{sessionStats.interactions}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Interactions</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{sessionStats.vocabularyLearned}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>New Words</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>{sessionStats.proverbsShared}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Proverbs</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14' }}>{Math.round(sessionStats.sessionDuration)}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Minutes</div>
          </div>
        </div>

        {learningProgress.recent_vocabulary && learningProgress.recent_vocabulary.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Recent Vocabulary:</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {learningProgress.recent_vocabulary.join(', ')}
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: isUserActive ? '#dcfce7' : '#fef3c7', 
          borderRadius: '6px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: isUserActive ? '#22c55e' : '#f59e0b' 
          }} />
          {isUserActive ? 'Active learning session' : 'Session idle - reduced tracking'}
        </div>
      </div>
    );
  }

  // Educational highlight components
  function renderVocabularyHighlight() {
    if (!vocabularyHighlight) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        maxWidth: '300px',
        zIndex: 1100,
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <BookOpen size={16} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>New Vocabulary</span>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
          {vocabularyHighlight.word}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          {vocabularyHighlight.meaning}
        </div>
      </div>
    );
  }

  function renderProverbHighlight() {
    if (!proverbHighlight) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        maxWidth: '300px',
        zIndex: 1100,
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Lightbulb size={16} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Wisdom</span>
        </div>
        <div style={{ fontSize: '14px', fontStyle: 'italic', marginBottom: '4px' }}>
          "{proverbHighlight.proverb}"
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {proverbHighlight.meaning}
        </div>
      </div>
    );
  }

  // Scroll to bottom button
  function renderScrollToBottomButton() {
    if (!showScrollToBottom) return null;

    return (
      <button
        onClick={forceScrollToBottom}
        style={{
          position: 'fixed',
          bottom: showProgress ? '360px' : '160px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#007bff',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,123,255,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 940,
          transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
        }}
        title="Scroll to bottom"
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0,123,255,0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 16px rgba(0,123,255,0.3)';
        }}
      >
        <ChevronDown size={24} />
      </button>
    );
  }

  // ENHANCED: New session button renderer
  const renderNewSessionButton = () => {
    const isMeaningfullyUsed = isSessionMeaningfullyUsed();
    
    if (!isMeaningfullyUsed) return null;
    
    return (
      <button
        onClick={handleNewSession}
        style={{
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px'
        }}
        title="Start a new speech coaching session"
      >
        New Session
      </button>
    );
  };

  // Main render
  return (
    <>
      <style jsx>{`
        .speech-coach {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background: #fafafa;
          position: relative;
          overflow: hidden;
          transition: all ${SIDEBAR_TRANSITION_DURATION}ms ease;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }

        .conversation-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1rem 16px;
          width: 100%;
          height: calc(100vh - 140px);
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
          scroll-behavior: smooth;
          background: #fafafa;
          transition: all ${SIDEBAR_TRANSITION_DURATION}ms ease;
        }

        .conversation-area::-webkit-scrollbar {
          width: 8px;
        }

        .conversation-area::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .conversation-area::-webkit-scrollbar-thumb {
          background: #007bff;
          border-radius: 4px;
        }

        .conversation-area::-webkit-scrollbar-thumb:hover {
          background: #0056b3;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .listening-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        
        .pulse-ring {
          position: absolute;
          border: 2px solid #007bff;
          border-radius: 50%;
          animation: pulse 2s infinite;
          width: 100%;
          height: 100%;
        }
        
        .pulse-ring:nth-child(2) {
          animation-delay: 0.7s;
        }
        
        .pulse-ring:nth-child(3) {
          animation-delay: 1.4s;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .mic-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(0, 123, 255, 0.3);
          position: relative;
          overflow: hidden;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mic-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 123, 255, 0.4);
        }
        
        .mic-btn:active {
          transform: scale(0.95);
        }
        
        .mic-btn.listening {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          animation: breathe 2s infinite;
        }
        
        .mic-btn.disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @media (max-width: 768px) {
          .mic-btn {
            width: 70px !important;
            height: 70px !important;
          }
          
          .mic-btn:active {
            transform: scale(0.95);
          }
          
          .speech-coach * {
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
      
      <div className={`speech-coach ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isTransitioning ? 'transitioning' : ''}`}>
        {renderStatusPanel()}
        {renderPermissionHelp()}
        {renderUserFriendlyErrorMessage()}
        {renderDailyLimitModal()}
        {renderUsageWarning()}
        {renderVocabularyHighlight()}
        {renderProverbHighlight()}
        {renderProgressPanel()}
        {renderScrollToBottomButton()}
        
        {!isSpeechSupported && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '16px',
            margin: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={18} color="#856404" />
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#856404', fontWeight: '600' }}>
                Browser Not Supported
              </p>
              <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                Please use Chrome, Edge, or Safari for the best speech recognition experience.
              </p>
            </div>
          </div>
        )}
        
        <div 
          ref={conversationAreaRef}
          className="conversation-area"
          style={{
            paddingLeft: sidebarOpen && window.innerWidth > 768 ? '16px' : '32px',
            paddingRight: '32px',
            maxWidth: sidebarOpen && window.innerWidth > 768 ? '100%' : '1200px',
            margin: sidebarOpen && window.innerWidth > 768 ? '0' : '0 auto',
            transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`
          }}
        >
          {conversation.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '400px'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>🎯 Ready to practice? Tap the microphone to begin!</p>
              {getCurrentVoiceConfig() && (
                <div style={{ 
                  background: '#f8f9fa', 
                  borderRadius: '8px', 
                  padding: '16px',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                    Voice: <strong>{getCurrentVoiceConfig().label || getCurrentVoiceConfig().voiceName}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    Profile: <strong>{getCurrentVoiceConfig().profileConfig?.name || 'Default'}</strong>
                  </p>
                </div>
              )}
              
              {usageSummary?.speech_coach && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  padding: '12px',
                  margin: '16px auto 0',
                  fontSize: '14px',
                  maxWidth: '400px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    <span style={{ fontWeight: '600', color: '#0369a1' }}>Daily Usage</span>
                  </div>
                  <div style={{ color: '#0369a1' }}>
                    Speech Coaching: {usageSummary.speech_coach.used}/{usageSummary.speech_coach.daily_limit} used today
                    {usageSummary.speech_coach.remaining > 0 && (
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        {' '}({usageSummary.speech_coach.remaining} remaining)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {systemStatus.overallStatus !== 'ready' && (
                <button
                  onClick={() => setShowStatusPanel(true)}
                  style={{
                    background: systemStatus.overallStatus === 'error' ? '#fee2e2' : '#fef3c7',
                    border: `1px solid ${systemStatus.overallStatus === 'error' ? '#fecaca' : '#fbbf24'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '16px auto 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: systemStatus.overallStatus === 'error' ? '#991b1b' : '#92400e',
                    maxWidth: '400px'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>
                    {systemStatus.overallStatus === 'error' 
                      ? 'Setup required - Click to view details'
                      : 'System check needed - Click to view status'
                    }
                  </span>
                </button>
              )}
            </div>
          ) : (
            conversation.map((msg, i) => (
              <div
                key={i}
                style={{
                  margin: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: msg.sender === 'user' ? '#007bff' : '#ffffff',
                  border: msg.sender === 'coach' && activeCoachIndex === i ? '2px solid #007bff' : '1px solid #e0e0e0',
                  cursor: msg.sender === 'coach' && !msg.loading ? 'pointer' : 'default',
                  transition: `all ${SIDEBAR_TRANSITION_DURATION}ms ease`,
                  opacity: msg.loading ? 0.7 : 1,
                  maxWidth: sidebarOpen && window.innerWidth > 768 ? '70%' : '75%',
                  minWidth: '200px',
                  marginLeft: msg.sender === 'user' ? 'auto' : '16px',
                  marginRight: msg.sender === 'user' ? '16px' : 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transform: msg.sender === 'coach' && activeCoachIndex === i ? 'translateY(-2px)' : 'translateY(0)'
                }}
                onClick={() => {
                  if (msg.sender === 'coach' && !msg.loading) {
                    markUserActivity();
                    setActiveCoachIndex(i);
                  }
                }}
              >
                {msg.loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#333333', fontWeight: '500' }}>Getting feedback...</span>
                  </div>
                ) : (
                  <>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      color: msg.sender === 'user' ? '#ffffff' : '#1a1a1a',
                      fontSize: '15px',
                      fontWeight: '400',
                      lineHeight: '1.5',
                      opacity: '1'
                    }}>{msg.text}</p>
                    {msg.corrected && (
                      <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '14px',
                        marginTop: '8px'
                      }}>
                        <small style={{ color: '#856404', fontWeight: '600' }}>💡 Suggestion: "{msg.corrected}"</small>
                      </div>
                    )}
                    {msg.sender === 'coach' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            replayMessage(msg.text, false);
                          }}
                          disabled={isPlaying}
                          style={{
                            background: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: isPlaying ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#495057',
                            fontWeight: '500'
                          }}
                          title="Replay with browser voice"
                        >
                          <Volume2 size={14} />
                          Replay
                        </button>
                        {deepSpeakAvailable && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              replayMessage(msg.text, true);
                            }}
                            disabled={isPlaying}
                            style={{
                              background: '#f8f9fa',
                              border: '1px solid #dee2e6',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: isPlaying ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: '#495057',
                              fontWeight: '500'
                            }}
                            title="Replay with high-quality voice"
                          >
                            <RefreshCw size={14} />
                            HD
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
        
        {conversation.length > 0 && (
          <div style={getControlsBarStyle()}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={clearConversation}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear conversation
              </button>
              
              {renderNewSessionButton()}
              
              <button
                onClick={() => {
                  markUserActivity();
                  setShowProgress(!showProgress);
                }}
                style={{
                  background: showProgress ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px'
                }}
              >
                <TrendingUp size={14} />
                Progress
              </button>
              
              <button
                onClick={() => {
                  markUserActivity();
                  fetchUsageSummary();
                }}
                style={{
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px'
                }}
                title="Check daily usage limits"
              >
                <Info size={14} />
                Usage
              </button>
            </div>
            
            {renderDeepSpeakToggle()}
          </div>
        )}
        
        {isListening && (
          <div style={getSpeechInputStyle()}>
            <textarea
              value={transcript}
              onChange={e => {
                markUserActivity();
                setTranscript(e.target.value);
              }}
              placeholder="Listening for your voice..."
              rows={2}
              style={{
                flex: 1,
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px',
                background: 'transparent',
                resize: 'none',
                outline: 'none',
                maxHeight: '56px',
                overflowY: 'auto',
                fontSize: '16px',
                color: '#333'
              }}
            />
            <button
              onClick={() => sendMessage(transcript)}
              disabled={!transcript.trim() || transcript.length < 2}
              style={{
                background: 'none',
                border: 'none',
                color: transcript.trim().length >= 2 ? '#007bff' : '#ccc',
                fontSize: '18px',
                cursor: transcript.trim().length >= 2 ? 'pointer' : 'not-allowed',
                transition: 'color 0.2s',
                padding: '8px',
                borderRadius: '4px'
              }}
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        )}
        
        <div style={getMicWrapperStyle()}>
          <button
            className={[
              'mic-btn',
              isListening && 'listening',
              isPlaying && 'always-available',
              !isSpeechSupported && 'disabled'
            ].filter(Boolean).join(' ')}
            onClick={toggleMicrophone}
            onTouchStart={(e) => {
              e.preventDefault();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (isSpeechSupported) {
                setTimeout(() => toggleMicrophone(), 50);
              }
            }}
            disabled={!isSpeechSupported && !(isPlaying && isSpeechSupported)}
            style={{ 
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              opacity: !isSpeechSupported ? 0.5 : 1
            }}
            title={`Voice: ${getCurrentVoiceConfig()?.label || 'Default'}`}
          >
            <Mic size={32} />
            {isListening && (
              <div className="listening-pulse">
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring"></div>
              </div>
            )}
          </button>
        </div>
        
        <div style={getControlsStyle()}></div>
      </div>
    </>
  );
}