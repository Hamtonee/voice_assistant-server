import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../assets/styles/ReadingPassage.css';
import api from '../api';

// SECURE: Get individual API endpoints from environment variables
const getApiEndpoints = () => {
  const endpoints = {
    READING_TOPIC: process.env.REACT_APP_READING_TOPIC_ENDPOINT,
    USAGE_SUMMARY: process.env.REACT_APP_USAGE_ENDPOINT
  };

  // Validate that all required endpoints are set
  const missingEndpoints = Object.entries(endpoints)
    .filter(([key, value]) => !value)
    .map(([key]) => `REACT_APP_${key}_ENDPOINT`);

  if (missingEndpoints.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEndpoints.join(', ')}. ` +
      'Please check your .env file and ensure all API endpoints are configured.'
    );
  }

  return endpoints;
};

// Initialize endpoints with validation
let API_ENDPOINTS;
try {
  API_ENDPOINTS = getApiEndpoints();
} catch (error) {
  console.error('❌ [API Configuration Error]:', error.message);
  throw error;
}

const READING_TOPIC_ENDPOINT = API_ENDPOINTS.READING_TOPIC;
const USAGE_ENDPOINT = API_ENDPOINTS.USAGE_SUMMARY;

// Log successful configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ [Reading Passage API Configuration] All endpoints configured successfully');
}

const ReadingPassage = ({ sessionId, selectedVoice, viewport, sidebarState, onNewSession }) => {
  const availableCategories = [
    "Business", "Technology", "Finance", "Marketing",
    "Education", "Science", "Health", "Sports", "Culture",
    "Law", "History", "Politics", "Literature", "Philosophy",
    "Engineering", "Arts", "Psychology", "Social Sciences",
    "International Relations", "Journalism", "Architecture",
    "Culinary Arts", "Music", "Fashion", "Travel", "Environment"
  ];

  const customizationOptions = [
    "Include real-world examples",
    "Use a conversational tone",
    "Add statistics and data",
    "Focus on recent developments",
    "Define key terms"
  ];

  const ageGroups = [
    { value: "child", label: "Child (6-12 years)" },
    { value: "teen", label: "Teen (13-17 years)" },
    { value: "adult", label: "Adult (18-64 years)" },
    { value: "senior", label: "Senior (65+ years)" }
  ];

  const difficultyLevels = [
    { value: "easy", label: "Easy", description: "Simple vocabulary, short sentences" },
    { value: "medium", label: "Medium", description: "Moderate complexity, varied sentence structure" },
    { value: "hard", label: "Hard", description: "Advanced vocabulary, complex concepts" }
  ];

  // Enhanced state management with improved interaction tracking
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readWords, setReadWords] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [customStep, setCustomStep] = useState(1);
  const [params, setParams] = useState({
    category: '',
    paragraphCount: 3,
    difficulty: 'medium',
    ageGroup: '',
    additionalInstruction: '',
    fineTuning: ''
  });
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Enhanced session management with better unused instance detection
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return sessionId || `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  // ENHANCED: Better interaction tracking - tracks meaningful user actions
  const [sessionInteractionLevel, setSessionInteractionLevel] = useState('none'); // 'none', 'wizard_started', 'article_generated', 'fully_engaged'
  const [wizardProgress, setWizardProgress] = useState({
    hasStartedWizard: false,
    hasCompletedStep: false,
    hasSubmittedParams: false
  });

  // Session state tracking for duplicate prevention - removed unused sessionState variable
  const [, setSessionState] = useState({
    isNew: true,
    hasContent: false,
    lastInteractionTime: null,
    isUnused: true
  });

  // Daily limit and usage state
  const [dailyLimitStatus, setDailyLimitStatus] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);

  // Sidebar transition state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const wizardRef = useRef(null);

  // Enhanced viewport detection with debouncing
  const [currentViewport, setCurrentViewport] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      return {
        isMobile: width <= 767,
        isTablet: width >= 768 && width <= 1023,
        isDesktop: width >= 1024,
        width: width,
        height: height
      };
    }
    return { isMobile: false, isTablet: false, isDesktop: true, width: 1024, height: 768 };
  });

  // ENHANCED: Comprehensive interaction tracking
  const markUserInteraction = useCallback((interactionType, details = {}) => {
    const timestamp = Date.now();
    
    console.log(`📊 [Interaction Tracking] ${interactionType}:`, details);
    
    // Update interaction level based on action type
    switch (interactionType) {
      case 'wizard_navigation':
        if (!wizardProgress.hasStartedWizard) {
          setWizardProgress(prev => ({ ...prev, hasStartedWizard: true }));
          setSessionInteractionLevel('wizard_started');
        }
        if (details.completedStep) {
          setWizardProgress(prev => ({ ...prev, hasCompletedStep: true }));
        }
        break;
        
      case 'wizard_submission':
        setWizardProgress(prev => ({ ...prev, hasSubmittedParams: true }));
        setSessionInteractionLevel('article_generated');
        break;
        
      case 'article_interaction':
        setSessionInteractionLevel('fully_engaged');
        break;
        
      case 'chat_message':
        setSessionInteractionLevel('fully_engaged');
        break;
        
      default:
        // Any interaction marks the session as started
        if (sessionInteractionLevel === 'none') {
          setSessionInteractionLevel('wizard_started');
        }
    }
    
    // Update session state
    setSessionState(prev => ({
      ...prev,
      isNew: false,
      hasContent: interactionType !== 'wizard_navigation' || details.hasContent,
      lastInteractionTime: timestamp,
      isUnused: false
    }));
  }, [sessionInteractionLevel, wizardProgress]);

  // ENHANCED: Smart session validation - determines if session is "used"
  const isSessionMeaningfullyUsed = useCallback(() => {
    const hasGeneratedArticle = topic !== null;
    const hasWizardProgress = wizardProgress.hasSubmittedParams;
    const hasChatInteraction = chatMessages.length > 0;
    const hasAdvancedWizardProgress = customStep > 3; // User has gone past basic steps
    const hasConfiguredParams = params.category && params.ageGroup;
    
    // Consider session "meaningfully used" if:
    const isMeaningfullyUsed = 
      hasGeneratedArticle ||           // User generated an article
      hasWizardProgress ||             // User completed wizard submission
      hasChatInteraction ||            // User engaged in chat
      hasAdvancedWizardProgress ||     // User progressed significantly in wizard
      (hasConfiguredParams && customStep >= 4); // User configured params and is near completion
    
    console.log(`🔍 [Session Validation] Checking if session is meaningfully used:`, {
      sessionId: currentSessionId,
      hasGeneratedArticle,
      hasWizardProgress,
      hasChatInteraction,
      hasAdvancedWizardProgress,
      hasConfiguredParams,
      currentStep: customStep,
      interactionLevel: sessionInteractionLevel,
      result: isMeaningfullyUsed
    });
    
    return isMeaningfullyUsed;
  }, [topic, wizardProgress.hasSubmittedParams, chatMessages.length, customStep, params.category, params.ageGroup, sessionInteractionLevel, currentSessionId]);

  // Handle viewport changes with debouncing
  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setCurrentViewport({
          isMobile: width <= 767,
          isTablet: width >= 768 && width <= 1023,
          isDesktop: width >= 1024,
          width: width,
          height: height
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle sidebar state transitions smoothly
  useEffect(() => {
    if (sidebarState?.isTransitioning !== undefined) {
      setIsTransitioning(sidebarState.isTransitioning);
    }
  }, [sidebarState?.isTransitioning]);

  // Reset reading progress when topic changes
  useEffect(() => {
    setReadWords(0);
    setReadingProgress(0);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [topic]);

  // Enhanced smooth scroll behavior and viewport adjustments
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.scrollBehavior = 'smooth';
    }
    
    // Ensure proper viewport setup for full coverage
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Load existing chat history from API on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data } = await api.fetchReadingSession(currentSessionId);
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
          markUserInteraction('session_restored', { messageCount: data.messages.length });
        }
        
        // Restore article content if exists
        if (data.articleData) {
          setTopic(data.articleData);
          markUserInteraction('session_restored', { hasArticle: true });
        }
      } catch (error) {
        // Session doesn't exist yet, that's okay
        console.log('No existing reading session found, starting fresh');
      }
    };

    if (currentSessionId) {
      loadChatHistory();
    }
  }, [currentSessionId, markUserInteraction]);

  // Save chat messages to API whenever they change
  useEffect(() => {
    const saveChatHistory = async () => {
      if (chatMessages.length === 0) return;
      
      try {
        // Create session if it doesn't exist
        try {
          await api.fetchReadingSession(currentSessionId);
        } catch (error) {
          if (error.response?.status === 404) {
            await api.createReadingSession({
              title: topic?.title || 'Reading Session',
              category: params.category,
              difficulty: params.difficulty,
              articleData: topic
            });
          }
        }

        // Save the latest message
        const lastMessage = chatMessages[chatMessages.length - 1];
        if (lastMessage && !lastMessage.saved) {
          await api.addReadingMessage(currentSessionId, {
            role: lastMessage.sender === 'user' ? 'user' : 'assistant',
            text: lastMessage.text,
            timestamp: lastMessage.timestamp
          });
          
          // Mark message as saved
          setChatMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, saved: true } : msg
          ));
        }
      } catch (error) {
        console.error('Failed to save chat message:', error);
      }
    };

    saveChatHistory();
  }, [chatMessages, currentSessionId, topic, params]);

  // Fetch usage summary on component mount and periodically
  useEffect(() => {
    const fetchUsageSummary = async () => {
      try {
        const response = await fetch(USAGE_ENDPOINT);
        if (response.ok) {
          const data = await response.json();
          setUsageSummary(data.usage_summary);
          
          // Check if user is close to reading article limit
          const readingUsage = data.usage_summary.reading_article;
          if (readingUsage && readingUsage.remaining <= 1 && readingUsage.remaining > 0) {
            setShowUsageWarning(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch usage summary:', error);
      }
    };

    fetchUsageSummary();
    
    // Fetch usage summary every 30 minutes
    const intervalId = setInterval(fetchUsageSummary, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Enhanced fetch article with daily limit handling and improved error handling
  const fetchTopic = useCallback(async (endpoint) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from:', endpoint); // For debugging
      
      const response = await fetch(endpoint);
      
      // Handle daily limit exceeded (429 status)
      if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.error === "Daily limit exceeded") {
          setDailyLimitStatus(errorData);
          setShowLimitModal(true);
          throw new Error(`Daily limit exceeded for reading articles`);
        }
        throw new Error('Too many requests. Please try again later.');
      }
      
      if (!response.ok) {
        let detail = `Error fetching reading article (${response.status}).`;
        try {
          const errorBody = await response.json();
          if (errorBody.detail) detail = errorBody.detail;
        } catch {}
        
        // Add specific error messages for common network issues
        if (response.status === 0 || !response.status) {
          detail = 'Network error: Cannot connect to server. Check if the backend is running and accessible.';
        } else if (response.status === 404) {
          detail = 'API endpoint not found. Check if the backend server is running correctly.';
        } else if (response.status >= 500) {
          detail = 'Server error. Please try again later.';
        }
        
        throw new Error(detail);
      }
      
      const data = await response.json();
      
      if (!data.content) {
        throw new Error('Invalid article payload - no content received.');
      }
      
      // Handle both title field and content-based title generation
      const articleTitle = data.title || `${params.category} Article`;
      
      setTopic({
        ...data,
        title: articleTitle
      });
      
      // Mark as meaningful interaction - article generated
      markUserInteraction('wizard_submission', { 
        articleGenerated: true, 
        category: params.category,
        difficulty: params.difficulty 
      });
      
      setChatMessages(prev => [
        ...prev,
        { sender: 'system', text: 'Great choice! Your Reading Article is ready.', timestamp: Date.now(), saved: false }
      ]);

      // Update usage summary after successful article generation
      if (data.usage_info) {
        setUsageSummary(prev => ({
          ...prev,
          reading_article: data.usage_info
        }));
      }
      
    } catch (err) {
      console.error('Fetch error:', err); // For debugging
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.category, params.difficulty, markUserInteraction]);

  // Enhanced scroll tracking for reading progress with mobile optimization
  const handleScroll = useCallback(() => {
    const content = topic?.content;
    if (!content || !contentRef.current) return;
    
    const { scrollTop, clientHeight, scrollHeight } = contentRef.current;
    const maxScroll = scrollHeight - clientHeight;
    
    if (maxScroll > 0) {
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      setReadingProgress(progress);
      
      // Calculate words read more accurately
      const totalWords = content.split(/\s+/).filter(w => w.trim()).length;
      setReadWords(Math.floor(totalWords * progress));
      
      // Mark reading interaction if user has scrolled significantly
      if (progress > 0.1) {
        markUserInteraction('article_interaction', { readingProgress: progress });
      }
    } else {
      // If content fits in viewport, consider it fully read
      setReadingProgress(1);
      const totalWords = content.split(/\s+/).filter(w => w.trim()).length;
      setReadWords(totalWords);
      
      // Mark as read if content is short
      markUserInteraction('article_interaction', { readingProgress: 1, shortContent: true });
    }
  }, [topic?.content, markUserInteraction]);

  // Navigation functions with improved mobile scrolling and interaction tracking
  const nextStep = useCallback(() => {
    const newStep = Math.min(customStep + 1, 6);
    
    // Mark wizard navigation interaction
    markUserInteraction('wizard_navigation', { 
      fromStep: customStep, 
      toStep: newStep,
      completedStep: true 
    });
    
    if (customStep === 5) {
      setParams(prev => ({
        ...prev,
        additionalInstruction: selectedOptions.join(', ')
      }));
    }
    
    setCustomStep(newStep);
    
    // Improved scroll behavior for mobile
    setTimeout(() => {
      if (wizardRef.current) {
        wizardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }, [customStep, selectedOptions, markUserInteraction]);

  const prevStep = useCallback(() => {
    const newStep = Math.max(customStep - 1, 1);
    
    // Mark wizard navigation interaction
    markUserInteraction('wizard_navigation', { 
      fromStep: customStep, 
      toStep: newStep,
      direction: 'back' 
    });
    
    setCustomStep(newStep);
    
    // Improved scroll behavior for mobile
    setTimeout(() => {
      if (wizardRef.current) {
        wizardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }, [customStep, markUserInteraction]);

  // SECURE: Submit final parameters and fetch article using environment variable endpoint
  const submitAll = useCallback(() => {
    // Check if current session is meaningfully used
    const isCurrentSessionUsed = isSessionMeaningfullyUsed();
    
    if (isCurrentSessionUsed) {
      // Current session has meaningful content, create new session
      const newSessionId = `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(newSessionId);
      
      // Reset all state for new session
      setTopic(null);
      setChatMessages([]);
      setReadWords(0);
      setReadingProgress(0);
      setError(null);
      setDailyLimitStatus(null);
      setShowLimitModal(false);
      setShowUsageWarning(false);
      
      // Reset interaction tracking
      setSessionInteractionLevel('none');
      setWizardProgress({
        hasStartedWizard: false,
        hasCompletedStep: false,
        hasSubmittedParams: false
      });
      setSessionState({
        isNew: true,
        hasContent: false,
        lastInteractionTime: null,
        isUnused: true
      });
      
      console.log('🆕 [Session Management] Creating new session for new article:', newSessionId);
      
      // Notify parent component about new session
      if (onNewSession) {
        onNewSession(newSessionId);
      }
    } else {
      console.log('🔄 [Session Management] Using existing session - no meaningful interaction detected');
    }
    
    const queryParams = new URLSearchParams({
      category: params.category,
      paragraph_count: params.paragraphCount.toString(),
      difficulty: params.difficulty,
      age_group: params.ageGroup,
      customization: params.additionalInstruction,
      finetuning: params.fineTuning
    });
    
    // SECURE: Use environment variable endpoint instead of constructing URL
    console.log('Using configured reading topic endpoint:', READING_TOPIC_ENDPOINT);
    
    const endpoint = `${READING_TOPIC_ENDPOINT}?${queryParams.toString()}`;
    fetchTopic(endpoint);
    
    // Reset wizard
    setCustomStep(1);
    setSelectedOptions([]);
    setParams({
      category: '',
      paragraphCount: 3,
      difficulty: 'medium',
      ageGroup: '',
      additionalInstruction: '',
      fineTuning: ''
    });
  }, [params, fetchTopic, isSessionMeaningfullyUsed, onNewSession]);

  // Enhanced chat submission with interaction tracking
  const handleChatSubmit = useCallback((e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    markUserInteraction('chat_message', { messageLength: chatInput.length });
    
    setChatMessages(prev => [
      ...prev, 
      { sender: 'user', text: chatInput, timestamp: Date.now(), saved: false }
    ]);
    setChatInput('');
    
    // Simulate system response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'system', text: "Understood – we'll apply that feedback.", timestamp: Date.now(), saved: false }
      ]);
    }, 500);
  }, [chatInput, markUserInteraction]);

  // Reset to wizard when error occurs
  const resetToWizard = useCallback(() => {
    setError(null);
    setTopic(null);
    setCustomStep(1);
    setSelectedOptions([]);
    setParams({
      category: '',
      paragraphCount: 3,
      difficulty: 'medium',
      ageGroup: '',
      additionalInstruction: '',
      fineTuning: ''
    });
    setReadWords(0);
    setReadingProgress(0);
    setDailyLimitStatus(null);
    setShowLimitModal(false);
    
    // Reset interaction tracking
    setSessionInteractionLevel('none');
    setWizardProgress({
      hasStartedWizard: false,
      hasCompletedStep: false,
      hasSubmittedParams: false
    });
  }, []);

  // ENHANCED: Handle creating a new reading session with comprehensive validation
  const handleNewSession = useCallback(() => {
    const isMeaningfullyUsed = isSessionMeaningfullyUsed();
    
    console.log('🔄 [New Session Request] Evaluating current session:', {
      sessionId: currentSessionId,
      isMeaningfullyUsed,
      interactionLevel: sessionInteractionLevel,
      wizardProgress,
      hasContent: topic !== null || chatMessages.length > 0
    });
    
    if (!isMeaningfullyUsed) {
      // Current session is not meaningfully used, don't create new one
      console.log('📝 [Session Management] Current session unused - staying in same session');
      
      // Reset to clean state but keep session ID
      setTopic(null);
      setChatMessages([]);
      setReadWords(0);
      setReadingProgress(0);
      setCustomStep(1);
      setSelectedOptions([]);
      setParams({
        category: '',
        paragraphCount: 3,
        difficulty: 'medium',
        ageGroup: '',
        additionalInstruction: '',
        fineTuning: ''
      });
      setError(null);
      setDailyLimitStatus(null);
      setShowLimitModal(false);
      setShowUsageWarning(false);
      
      // Reset interaction tracking but keep session
      setSessionInteractionLevel('none');
      setWizardProgress({
        hasStartedWizard: false,
        hasCompletedStep: false,
        hasSubmittedParams: false
      });
      
      return;
    }
    
    // Current session has meaningful content, create new session
    const newSessionId = `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newSessionId);
    
    // Reset all state
    setTopic(null);
    setChatMessages([]);
    setReadWords(0);
    setReadingProgress(0);
    setCustomStep(1);
    setSelectedOptions([]);
    setParams({
      category: '',
      paragraphCount: 3,
      difficulty: 'medium',
      ageGroup: '',
      additionalInstruction: '',
      fineTuning: ''
    });
    setError(null);
    setDailyLimitStatus(null);
    setShowLimitModal(false);
    setShowUsageWarning(false);
    
    // Reset interaction tracking
    setSessionInteractionLevel('none');
    setWizardProgress({
      hasStartedWizard: false,
      hasCompletedStep: false,
      hasSubmittedParams: false
    });
    setSessionState({
      isNew: true,
      hasContent: false,
      lastInteractionTime: null,
      isUnused: true
    });
    
    console.log('🆕 [Session Management] Created new reading session:', newSessionId);
    
    // Notify parent component
    if (onNewSession) {
      onNewSession(newSessionId);
    }
  }, [isSessionMeaningfullyUsed, currentSessionId, sessionInteractionLevel, wizardProgress, topic, chatMessages, onNewSession]);

  // Handle customization option toggle with interaction tracking
  const handleOptionToggle = useCallback((option) => {
    markUserInteraction('wizard_navigation', { 
      action: 'option_toggle', 
      option,
      step: customStep 
    });
    
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  }, [markUserInteraction, customStep]);

  // Enhanced parameter setting with interaction tracking
  const handleParamChange = useCallback((paramName, value) => {
    markUserInteraction('wizard_navigation', { 
      action: 'param_change', 
      param: paramName, 
      value,
      step: customStep 
    });
    
    setParams(prev => ({ ...prev, [paramName]: value }));
  }, [markUserInteraction, customStep]);

  // Daily limit modal renderer
  const renderDailyLimitModal = () => {
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
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>Daily Limit Reached</h3>
          </div>
          
          <div style={{ marginBottom: '20px', color: '#666' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              You've reached your daily limit of <strong>{dailyLimitStatus.usage_info?.daily_limit}</strong>
              {' '}reading article requests.
            </p>
            
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>🕒</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Reset Information</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Your daily limits will reset in approximately <strong>{hoursUntilReset} hours</strong> at midnight UTC.
              </p>
            </div>
            
            {usageSummary && (
              <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📊</span>
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
  };

  // Usage warning banner renderer
  const renderUsageWarning = () => {
    if (!showUsageWarning || !usageSummary || !usageSummary.reading_article) return null;

    const readingUsage = usageSummary.reading_article;
    if (!readingUsage || typeof readingUsage.remaining === 'undefined') return null;

    return (
      <div className="usage-warning-banner">
        <span className="warning-icon">⚠️</span>
        <div className="warning-content">
          <div className="warning-title">Usage Warning</div>
          <div className="warning-text">
            You have {readingUsage.remaining} reading article request{readingUsage.remaining !== 1 ? 's' : ''} remaining today.
            {readingUsage.remaining === 1 && ' Use it wisely!'}
          </div>
        </div>
        <button
          onClick={() => setShowUsageWarning(false)}
          className="warning-close"
        >
          ×
        </button>
      </div>
    );
  };

  // ENHANCED: New session button renderer with smart logic
  const renderNewSessionButton = () => {
    const isMeaningfullyUsed = isSessionMeaningfullyUsed();
    
    // Only show button if session has meaningful content
    if (!isMeaningfullyUsed) return null;
    
    return (
      <button
        onClick={handleNewSession}
        className="new-session-btn"
        title="Start a new reading session"
      >
        <span className="btn-icon">✨</span>
        New Session
      </button>
    );
  };

  // Enhanced wizard step renderer with improved interaction tracking
  const renderWizardStep = () => {
    const stepConfig = {
      1: {
        title: "Select Your Interest",
        description: "Choose a topic that sparks your curiosity",
        content: (
          <div className="wizard-step-content">
            <label htmlFor="category-select" className="form-label">
              Choose a category that interests you:
            </label>
            <select
              id="category-select"
              value={params.category}
              onChange={e => handleParamChange('category', e.target.value)}
              className="wizard-select"
            >
              <option value="">— Choose Category —</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="wizard-actions">
              <button 
                onClick={nextStep} 
                disabled={!params.category}
                className="btn btn-primary btn-wide"
              >
                Continue
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        )
      },
      2: {
        title: "Article Length",
        description: "How much would you like to read?",
        content: (
          <div className="wizard-step-content">
            <label htmlFor="paragraph-select" className="form-label">
              How many paragraphs would you like?
            </label>
            <select
              id="paragraph-select"
              value={params.paragraphCount}
              onChange={e => handleParamChange('paragraphCount', Number(e.target.value))}
              className="wizard-select"
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} paragraph{num > 1 ? 's' : ''} 
                  {num <= 3 ? ' (Quick read)' : num <= 6 ? ' (Medium read)' : ' (Long read)'}
                </option>
              ))}
            </select>
            <div className="wizard-actions">
              <button onClick={prevStep} className="btn btn-secondary">
                <span className="btn-icon">←</span>
                Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Continue
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        )
      },
      3: {
        title: "Difficulty Level",
        description: "Match your reading skill level",
        content: (
          <div className="wizard-step-content">
            <label className="form-label">Select the difficulty level:</label>
            <div className="difficulty-options">
              {difficultyLevels.map(level => (
                <label key={level.value} className="difficulty-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.value}
                    checked={params.difficulty === level.value}
                    onChange={e => handleParamChange('difficulty', e.target.value)}
                  />
                  <div className="difficulty-content">
                    <span className="difficulty-label">{level.label}</span>
                    <span className="difficulty-description">{level.description}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="wizard-actions">
              <button onClick={prevStep} className="btn btn-secondary">
                <span className="btn-icon">←</span>
                Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Continue
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        )
      },
      4: {
        title: "Age Group",
        description: "Help us tailor the content for you",
        content: (
          <div className="wizard-step-content">
            <label className="form-label">Select your age group:</label>
            <div className="age-options">
              {ageGroups.map(group => (
                <label key={group.value} className="age-option">
                  <input
                    type="radio"
                    name="ageGroup"
                    value={group.value}
                    checked={params.ageGroup === group.value}
                    onChange={e => handleParamChange('ageGroup', e.target.value)}
                  />
                  <span className="age-label">{group.label}</span>
                </label>
              ))}
            </div>
            <div className="wizard-actions">
              <button onClick={prevStep} className="btn btn-secondary">
                <span className="btn-icon">←</span>
                Back
              </button>
              <button 
                onClick={nextStep} 
                disabled={!params.ageGroup}
                className="btn btn-primary"
              >
                Continue
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        )
      },
      5: {
        title: "Customization Options",
        description: "Optional features to enhance your article",
        content: (
          <div className="wizard-step-content">
            <label className="form-label">Choose additional customizations (optional):</label>
            <div className="options-grid">
              {customizationOptions.map(option => (
                <label key={option} className="option-item">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionToggle(option)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
            <div className="wizard-actions">
              <button onClick={prevStep} className="btn btn-secondary">
                <span className="btn-icon">←</span>
                Back
              </button>
              <button onClick={nextStep} className="btn btn-primary">
                Continue
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        )
      },
      6: {
        title: "Final Touches",
        description: "Any special requests or preferences?",
        content: (
          <div className="wizard-step-content">
            <label htmlFor="fine-tuning" className="form-label">
              Any additional instructions? (optional)
            </label>
            <textarea
              id="fine-tuning"
              placeholder="E.g., 'Focus on practical applications' or 'Include historical context'..."
              value={params.fineTuning}
              onChange={e => handleParamChange('fineTuning', e.target.value)}
              className="wizard-textarea"
              rows={4}
            />
            <div className="wizard-actions">
              <button onClick={prevStep} className="btn btn-secondary">
                <span className="btn-icon">←</span>
                Back
              </button>
              <button onClick={submitAll} className="btn btn-success">
                <span className="btn-icon">✨</span>
                {isSessionMeaningfullyUsed() ? 'Generate New Article (New Session)' : 'Generate Article'}
              </button>
            </div>
          </div>
        )
      }
    };

    const currentStep = stepConfig[customStep];
    if (!currentStep) return null;

    return (
      <div className="wizard-step">
        <div className="wizard-step-header">
          <h3 className="wizard-step-title">{currentStep.title}</h3>
          {currentStep.description && (
            <p className="wizard-step-description">{currentStep.description}</p>
          )}
        </div>
        {currentStep.content}
      </div>
    );
  };

  // Get container classes based on state - enhanced with transition handling
  const getContainerClasses = () => {
    const classes = ['reading-passage-container'];
    
    // Viewport classes (use internal state for better responsiveness)
    if (currentViewport.isMobile) classes.push('mobile');
    if (currentViewport.isTablet) classes.push('tablet');
    if (currentViewport.isDesktop) classes.push('desktop');
    
    // Sidebar state classes with transition handling
    if (sidebarState?.isOpen) {
      classes.push('sidebar-open');
    } else {
      classes.push('sidebar-closed');
    }
    
    // Transition state
    if (isTransitioning) {
      classes.push('sidebar-transitioning');
    }
    
    // Content state
    if (topic) classes.push('has-content');
    
    // Session state classes
    if (sessionInteractionLevel !== 'none') classes.push('has-interaction');
    if (isSessionMeaningfullyUsed()) classes.push('session-used');
    
    return classes.join(' ');
  };

  // Split content into paragraphs
  const paragraphs = topic?.content?.split('\n\n').filter(p => p.trim()) || [];

  // Enhanced loading state with modern design
  if (loading) {
    return (
      <div className={getContainerClasses()}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">Creating Your Article</h2>
          <p className="loading-subtitle">Generating your personalized reading article...</p>
          <div className="loading-progress">
            <div className="loading-bar">
              <div className="loading-fill"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with modern design and navigation options
  if (error) {
    return (
      <div className={getContainerClasses()}>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Unable to Load Article</h2>
          <p className="error-message">{error}</p>
          <p className="error-help">
            {error.includes('Daily limit exceeded') 
              ? 'You have reached your daily limit for reading articles. Please try again tomorrow or upgrade your plan for more requests.'
              : 'You can try generating the article again with the same settings, or go back to modify your preferences.'
            }
          </p>
          <div className="error-actions">
            <button 
              onClick={resetToWizard} 
              className="btn btn-secondary error-back-btn"
            >
              <span className="btn-icon">←</span>
              Back to Setup
            </button>
            {!error.includes('Daily limit exceeded') && (
              <button 
                onClick={() => setError(null)} 
                className="btn btn-primary error-retry-btn"
              >
                <span className="btn-icon">↻</span>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()} ref={containerRef}>
      {renderDailyLimitModal()}
      {renderUsageWarning()}
      
      <div className="rp-body">
        {/* Reading Article Content - Full Width */}
        {topic && (
          <main className="article-content">
            {renderNewSessionButton()}
            
            {/* Article Header with Title */}
            <header className="article-header">
              <h1 className="article-title">{topic.title}</h1>
            </header>
            
            <div
              className="topic-content"
              ref={contentRef}
              onScroll={handleScroll}
            >
              {/* Reading Progress */}
              <div className="reading-progress">
                <div className="progress-stats">
                  <span className="progress-text">
                    Words read: <strong>{readWords}</strong>
                  </span>
                  <span className="progress-percentage">
                    {Math.round(readingProgress * 100)}% complete
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${readingProgress * 100}%` }}
                    aria-label={`Reading progress: ${Math.round(readingProgress * 100)}%`}
                  />
                </div>
              </div>
              
              {/* Article Paragraphs with Better Spacing */}
              <div className="article-body">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="article-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* Customization Wizard - Below Article or Centered */}
        <aside className="unified-container" ref={wizardRef}>
          {/* Header Section - Only subtitle for setup */}
          {!topic && (
            <header className="integrated-header">
              <p className="rp-subtitle">
                Customize and generate a reading article tailored to your interests and level.
              </p>
            </header>
          )}

          {/* Usage info display */}
          {usageSummary?.reading_article && (
            <div className="usage-info-display">
              <div className="usage-info-header">
                <span className="usage-icon">📊</span>
                <span className="usage-title">Daily Usage</span>
              </div>
              <div className="usage-info-content">
                Reading Articles: {usageSummary.reading_article.used}/{usageSummary.reading_article.daily_limit} used today
                {usageSummary.reading_article.remaining > 0 && (
                  <span className="usage-remaining">
                    {' '}({usageSummary.reading_article.remaining} remaining)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Customization Wizard */}
          <div className="wizard-section">
            <div className="wizard-header">
              <h2 className="wizard-title">
                {isSessionMeaningfullyUsed() ? 'Generate New Article (New Session)' : 'Customize Your Reading'}
              </h2>
              {isSessionMeaningfullyUsed() && (
                <p className="wizard-subtitle">
                  Generating a new article will start a fresh session
                </p>
              )}
            </div>
            
            <div className="wizard-content">
              <div className="wizard-progress">
                <div className="progress-steps">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i + 1}
                      className={`progress-step ${i + 1 <= customStep ? 'active' : ''} ${i + 1 < customStep ? 'completed' : ''}`}
                      aria-label={`Step ${i + 1} ${i + 1 < customStep ? 'completed' : i + 1 === customStep ? 'current' : 'upcoming'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span className="progress-label">
                  Step {customStep} of 6
                </span>
              </div>
              
              {renderWizardStep()}
            </div>
          </div>
        </aside>
      </div>

      {/* Chat/Feedback Section */}
      {chatMessages.length > 0 && (
        <section className="chat-container">
          <div className="chat-header">
            <h3>Feedback & Discussion</h3>
          </div>
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div 
                key={`${message.timestamp}-${index}`} 
                className={`chat-message ${message.sender}`}
              >
                <div className="message-content">
                  {message.text}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Share your thoughts or ask questions..."
                className="chat-input-field"
              />
              <button 
                type="submit" 
                className="chat-send-btn"
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default ReadingPassage;