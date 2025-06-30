import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../assets/styles/ReadingPassage.css';
import CompactArticleBubble from './CompactArticleBubble';
import api from '../api';

// Constants
const ageGroups = ['child', 'teen', 'adult', 'senior'];
const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
const customizationOptions = ['vocabulary', 'grammar', 'pronunciation', 'culture'];
const ARTICLE_LIMIT = 5;

// SECURE: Get individual API endpoints from environment variables
const getApiEndpoints = () => {
  // Safely access process.env with fallbacks
  const getEnvVar = (name, fallback) => {
    try {
      return (typeof process !== 'undefined' && process.env && process.env[name]) || fallback;
    } catch (error) {
      console.warn(`Failed to access ${name}, using fallback:`, fallback);
      return fallback;
    }
  };

  const endpoints = {
    READING_TOPIC: getEnvVar('REACT_APP_READING_TOPIC_ENDPOINT', '/reading/generate'),
    USAGE_SUMMARY: getEnvVar('REACT_APP_USAGE_ENDPOINT', '/usage/summary')
  };

  console.log('✅ [Reading Passage API Configuration] Endpoints configured:', endpoints);
  return endpoints;
};

// Initialize endpoints with validation
let API_ENDPOINTS;
try {
  API_ENDPOINTS = getApiEndpoints();
} catch (error) {
  console.error('❌ [API Configuration Error]:', error.message);
  // Use fallback endpoints
  API_ENDPOINTS = {
    READING_TOPIC: '/reading/generate',
    USAGE_SUMMARY: '/usage/summary'
  };
}

const USAGE_ENDPOINT = API_ENDPOINTS.USAGE_SUMMARY;

// Log successful configuration (development only)
const isDevelopment = () => {
  try {
    return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
  } catch (error) {
    return false;
  }
};

if (isDevelopment()) {
  console.log('✅ [Reading Passage API Configuration] All endpoints configured successfully');
}

const ReadingPassage = ({ sessionId, selectedVoice, viewport, sidebarState, onNewSession }) => {

  const customizationOptionsExtended = [
    "Include real-world examples",
    "Use a conversational tone",
    "Add statistics and data",
    "Focus on recent developments",
    "Define key terms"
  ];

  const ageGroupsExtended = [
    { value: "child", label: "Child (6-12 years)" },
    { value: "teen", label: "Teen (13-17 years)" },
    { value: "adult", label: "Adult (18-64 years)" },
    { value: "senior", label: "Senior (65+ years)" }
  ];

  const difficultyLevelsExtended = [
    { value: "easy", label: "Easy", description: "Simple vocabulary, short sentences" },
    { value: "medium", label: "Medium", description: "Moderate complexity, varied sentence structure" },
    { value: "hard", label: "Hard", description: "Advanced vocabulary, complex concepts" }
  ];

  // Refs
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const wizardRef = useRef(null);
  
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

  // ENHANCED: Article navigation and management state
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'reading' | 'creating'
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [previousArticleId, setPreviousArticleId] = useState(null); // Track previous article
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  // ENHANCED: Smart view mode determination - only show list when 2+ articles exist
  const [forceListView, setForceListView] = useState(false);

  // Enhanced session management with better unused instance detection
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  // ENHANCED: Better interaction tracking - tracks meaningful user actions
  const [sessionInteractionLevel, setSessionInteractionLevel] = useState('none'); // 'none', 'wizard_started', 'article_generated', 'fully_engaged'

  // Daily limit and usage state
  const [dailyLimitStatus, setDailyLimitStatus] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);

  // Session state management
  const [sessionState, setSessionState] = useState({
    isNew: true,
    hasContent: false,
    lastInteractionTime: Date.now(),
    isUnused: true
  });

  // Sidebar transition state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Enhanced viewport detection with debouncing
  const currentViewport = useMemo(() => ({
    isMobile: viewport?.isMobile || false,
    isTablet: viewport?.isTablet || false,
    isDesktop: viewport?.isDesktop || true,
    width: viewport?.width || window.innerWidth,
    height: viewport?.height || window.innerHeight
  }), [viewport]);

  // ENHANCED: Comprehensive interaction tracking
  const handleUserInteraction = useCallback((interactionType, details = {}) => {
    switch (interactionType) {
      case 'wizard_submission':
        setSessionInteractionLevel('article_generated');
        break;
        
      case 'article_interaction':
        setSessionInteractionLevel('fully_engaged');
        break;
        
      case 'chat_message':
        setSessionInteractionLevel('fully_engaged');
        break;
        
      default:
        if (sessionInteractionLevel === 'none') {
          setSessionInteractionLevel('wizard_started');
        }
    }
  }, [sessionInteractionLevel]);

  // Handle creating new article
  const handleCreateNewArticle = useCallback(() => {
    const articleSessions = onNewSession?.getArticleSessions?.() || [];
    if (articleSessions.length >= ARTICLE_LIMIT) {
      setShowLimitAlert(true);
      return;
    }
    setViewMode('creating');
    setSelectedArticleId(null);
  }, [onNewSession, setViewMode, setSelectedArticleId]);

  // Article management functions are handled by the enhanced handleOpenArticle function below

  const shouldShowArticleList = useCallback(() => {
    return viewMode === 'list' || forceListView;
  }, [viewMode, forceListView]);

  // Handle going back to article list
  const handleGoBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedArticleId(null);
  }, []);

  // Session interaction tracking is handled by the enhanced handleScroll function below

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // These handlers are used in dynamic content generation - handled by the enhanced handleParamChange function below

  // Load existing chat history from API on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data } = await api.fetchReadingSession(currentSessionId);
        if (data.messages && data.messages.length > 0) {
          setChatMessages(data.messages);
          handleUserInteraction('session_restored', { messageCount: data.messages.length });
        }
        
        // Restore article content if exists
        if (data.articleData) {
          setTopic(data.articleData);
          handleUserInteraction('session_restored', { hasArticle: true });
        }
      } catch (error) {
        // Session doesn't exist yet, that's okay
        console.log('No existing reading session found, starting fresh');
      }
    };

    if (currentSessionId) {
      loadChatHistory();
    }
  }, [currentSessionId, handleUserInteraction]);

  // Save chat messages to API whenever they change
  useEffect(() => {
    const saveChatHistory = async () => {
      if (!Array.isArray(chatMessages) || chatMessages.length === 0) return;
      
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
        const lastMessage = Array.isArray(chatMessages) && chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
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
      handleUserInteraction('wizard_submission', { 
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
  }, [params.category, params.difficulty, handleUserInteraction]);

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
        handleUserInteraction('article_interaction', { readingProgress: progress });
      }
    } else {
      // If content fits in viewport, consider it fully read
      setReadingProgress(1);
      const totalWords = content.split(/\s+/).filter(w => w.trim()).length;
      setReadWords(totalWords);
      
      // Mark as read if content is short
      handleUserInteraction('article_interaction', { readingProgress: 1, shortContent: true });
    }
  }, [topic?.content, handleUserInteraction]);

  // Navigation functions with improved mobile scrolling and interaction tracking
  const nextStep = useCallback(() => {
    const newStep = Math.min(customStep + 1, 6);
    
    // Mark wizard navigation interaction
    handleUserInteraction('wizard_navigation', { 
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
  }, [customStep, selectedOptions, handleUserInteraction]);

  const prevStep = useCallback(() => {
    const newStep = Math.max(customStep - 1, 1);
    
    // Mark wizard navigation interaction
    handleUserInteraction('wizard_navigation', { 
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
  }, [customStep, handleUserInteraction]);

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
  }, []);

  // ENHANCED: Article management functions
  const handleOpenArticle = useCallback(async (articleId) => {
    try {
      console.log('📖 [Article Open] Opening article:', articleId);
      
      // Track previous article for navigation
      if (selectedArticleId && selectedArticleId !== articleId) {
        setPreviousArticleId(selectedArticleId);
      }
      
      // Set selected article and switch to reading view
      setSelectedArticleId(articleId);
      setViewMode('reading');
      
      // Load article data
      const { data } = await api.fetchReadingSession(articleId);
      
      if (data.articleData || data.topic) {
        setTopic(data.articleData || data.topic);
        handleUserInteraction('article_opened', { articleId });
      }
      
      if (data.messages && data.messages.length > 0) {
        setChatMessages(data.messages);
      }
      
    } catch (error) {
      console.error('Failed to open article:', error);
    }
  }, [selectedArticleId, setSelectedArticleId, setViewMode, handleUserInteraction]);

  // Track meaningful session usage
  // eslint-disable-next-line no-unused-vars
  const isSessionMeaningfullyUsed = useCallback(() => {
    return (
      sessionState.hasContent &&
      !sessionState.isUnused &&
      Date.now() - sessionState.lastInteractionTime < 300000 // 5 minutes
    );
  }, [sessionState]);

  // Effect hooks

  // These functions are already called within their respective useEffect hooks above

  // Add missing state variables
  const [availableCategories] = useState([
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'literature', name: 'Literature', icon: '📖' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'arts', name: 'Arts', icon: '🎨' },
    { id: 'current_events', name: 'Current Events', icon: '📰' }
  ]);

  // Additional functions are handled by the enhanced resetToWizard function above

  // Handle customization option toggle with interaction tracking
  const handleOptionToggle = useCallback((option) => {
    handleUserInteraction('wizard_navigation', { 
      action: 'option_toggle', 
      option,
      step: customStep 
    });
    
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  }, [handleUserInteraction, customStep]);

  // Enhanced parameter setting with interaction tracking
  const handleParamChange = useCallback((paramName, value) => {
    handleUserInteraction('wizard_navigation', { 
      action: 'param_change', 
      param: paramName, 
      value,
      step: customStep 
    });
    
    setParams(prev => ({ ...prev, [paramName]: value }));
  }, [handleUserInteraction, customStep]);

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

  // ENHANCED: Article List View Renderer
  const renderArticleListView = () => {
    const articleSessions = onNewSession?.getArticleSessions?.() || [];
    
    return (
      <div className="article-list-container">
        <header className="article-list-header">
          <h2 className="article-list-title">📚 Your Reading Articles</h2>
          <p className="article-list-subtitle">
            {articleSessions.length === 0 
              ? 'Create your first reading article to get started'
              : `You have ${articleSessions.length} of ${ARTICLE_LIMIT} articles`
            }
          </p>
        </header>

        {articleSessions.length === 0 ? (
          <div className="empty-articles-state">
            <div className="empty-icon">📖</div>
            <h3>No Articles Yet</h3>
            <p>Create your first personalized reading article to begin your reading journey.</p>
            <button 
              onClick={handleCreateNewArticle}
              className="btn btn-primary btn-large"
            >
              <span className="btn-icon">✨</span>
              Create Your First Article
            </button>
          </div>
        ) : (
          <div className="articles-grid">
            {articleSessions.map((session, index) => (
              <div 
                key={session.id} 
                className="article-card"
                onClick={() => handleOpenArticle(session.id)}
              >
                <div className="article-card-header">
                  <div className="article-number">Article #{index + 1}</div>
                  <div className="article-date">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="article-title">
                  {session.title || 'Untitled Article'}
                </h3>
                <div className="article-meta">
                  {session.metadata?.articleMetadata && (
                    <>
                      <span className="article-category">
                        {session.metadata.articleMetadata.category}
                      </span>
                      <span className="article-difficulty">
                        {session.metadata.articleMetadata.difficulty}
                      </span>
                    </>
                  )}
                </div>
                <div className="article-progress">
                  <div className="progress-info">
                    <span>Reading Progress</span>
                    <span>Click to continue</span>
                  </div>
                </div>
              </div>
            ))}
            
            {articleSessions.length < ARTICLE_LIMIT && (
              <div 
                className="article-card create-new-card"
                onClick={handleCreateNewArticle}
              >
                <div className="create-new-content">
                  <div className="create-icon">+</div>
                  <h3>Create New Article</h3>
                  <p>Generate another personalized reading article</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ENHANCED: Article Limit Alert Modal
  const renderArticleLimitAlert = () => {
    if (!showLimitAlert) return null;
    
    return (
      <div className="modal-backdrop">
        <div className="modal article-limit-modal">
          <div className="modal-header">
            <h3 className="modal-title">Article Limit Reached</h3>
            <button 
              className="modal-close"
              onClick={() => setShowLimitAlert(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="limit-alert-content">
              <div className="limit-icon">📚</div>
              <p className="limit-message">
                You've reached your maximum of <strong>{ARTICLE_LIMIT} articles</strong>.
              </p>
              <p className="limit-description">
                To continue practicing with new articles, please complete or remove some existing ones.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="modal-btn secondary"
              onClick={() => setShowLimitAlert(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Get container classes based on current state
  const getContainerClasses = () => {
    const classes = ['reading-passage'];
    
    if (sidebarState?.open) {
      classes.push('sidebar-open');
    }
    
    if (isTransitioning) {
      classes.push('transitioning');
    }
    
    if (viewport?.isMobile) {
      classes.push('mobile');
    }
    
    if (viewMode === 'list') {
      classes.push('list-view');
    } else if (viewMode === 'reading') {
      classes.push('reading-view');
    } else {
      classes.push('creating-view');
    }
    
    return classes.join(' ');
  };

  // Render wizard step based on current state
  const renderWizardStep = () => {
    switch (customStep) {
      case 1:
        return (
          <div className="wizard-step category-selection">
            <h3>Select a Category</h3>
            <div className="category-grid">
              {availableCategories.map(category => (
                <button
                  key={category.id}
                  className={`category-button ${params.category === category.id ? 'selected' : ''}`}
                  onClick={() => setParams(prev => ({ ...prev, category: category.id }))}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="wizard-step age-difficulty">
            <h3>Select Age Group & Difficulty</h3>
            <div className="option-grid">
              <div className="age-group-selection">
                <label>Age Group</label>
                {ageGroupsExtended.map(group => (
                  <button
                    key={group.value}
                    className={`age-button ${params.ageGroup === group.value ? 'selected' : ''}`}
                    onClick={() => setParams(prev => ({ ...prev, ageGroup: group.value }))}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
              <div className="difficulty-selection">
                <label>Difficulty Level</label>
                {difficultyLevelsExtended.map(level => (
                  <button
                    key={level.value}
                    className={`difficulty-button ${params.difficulty === level.value ? 'selected' : ''}`}
                    onClick={() => setParams(prev => ({ ...prev, difficulty: level.value }))}
                  >
                    <span className="level-name">{level.label}</span>
                    <span className="level-desc">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="wizard-step customization">
            <h3>Customize Your Reading</h3>
            <div className="customization-options">
              {customizationOptionsExtended.map((option, index) => (
                <label key={index} className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => {
                      setSelectedOptions(prev =>
                        prev.includes(option)
                          ? prev.filter(o => o !== option)
                          : [...prev, option]
                      );
                    }}
                  />
                  <span className="checkbox-label">{option}</span>
                </label>
              ))}
            </div>
            <div className="additional-instructions">
              <label>Additional Instructions (Optional)</label>
              <textarea
                value={params.additionalInstruction}
                onChange={e => setParams(prev => ({ ...prev, additionalInstruction: e.target.value }))}
                placeholder="Any specific topics or aspects you'd like to focus on?"
                maxLength={500}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render new session button with appropriate text
  const renderNewSessionButton = () => {
    const buttonText = viewMode === 'list'
      ? '+ Create New Reading'
      : viewMode === 'reading'
      ? 'Start New Reading'
      : 'Cancel';

    return (
      <button
        className={`new-session-button ${viewMode}`}
        onClick={() => {
          if (viewMode === 'creating') {
            setViewMode('list');
          } else {
            setViewMode('creating');
            setCustomStep(1);
            setParams({
              category: '',
              paragraphCount: 3,
              difficulty: 'medium',
              ageGroup: '',
              additionalInstruction: '',
              fineTuning: ''
            });
            setSelectedOptions([]);
          }
        }}
      >
        {buttonText}
      </button>
    );
  };

  // Split topic into paragraphs for rendering
  const paragraphs = topic ? topic.split('\n\n').filter(Boolean) : [];

  // Render article count
  const renderArticleCount = (articleSessions) => {
    return articleSessions.length === 0
      ? "No articles yet"
      : `You have ${articleSessions.length} of ${ARTICLE_LIMIT} articles`;
  };

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
      {renderArticleLimitAlert()}
      
      {/* Conditional View Rendering Based on Article Count */}
      
      {/* Article List View - Only show when 2+ articles OR forced */}
      {viewMode === 'list' && shouldShowArticleList() && renderArticleListView()}
      
      {/* Single Article Direct View - When only 1 article exists and not forced to list */}
      {viewMode === 'list' && !shouldShowArticleList() && (
        <div className="single-article-container">
          <header className="single-article-header">
            <h2 className="single-article-title">📖 Your Reading Article</h2>
            <p className="single-article-subtitle">
              Create more articles to see them organized in a list view
            </p>
            <button 
              onClick={handleCreateNewArticle}
              className="btn btn-primary"
            >
              <span className="btn-icon">✨</span>
              Create Second Article
            </button>
          </header>
        </div>
      )}
      
      {/* Article Creation View */}
      {viewMode === 'creating' && (
        <div className="rp-body">
          {/* Header Section - Only subtitle for setup */}
          <header className="integrated-header">
            <div className="navigation-header">
              {shouldShowArticleList() && (
                <button 
                  onClick={handleGoBackToList}
                  className="back-button"
                >
                  <span className="back-icon">←</span>
                  Back to Articles
                </button>
              )}
              <h2 className="creation-title">Create New Article</h2>
            </div>
            <p className="rp-subtitle">
              Customize and generate a reading article tailored to your interests and level.
            </p>
          </header>

          {/* Usage info display */}
          {usageSummary?.reading_article && (
            <div className="usage-info-display">
              <div className="usage-info-header">
                <span className="usage-icon">📊</span>
                <span className="usage-title">Daily Usage</span>
              </div>
              <div className="usage-info-content">
                Reading Articles: {usageSummary.reading_article.used || 0}/{usageSummary.reading_article.daily_limit || 0} used today
                {(usageSummary.reading_article.remaining || 0) > 0 && (
                  <span className="usage-remaining">
                    {' '}({usageSummary.reading_article.remaining || 0} remaining)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Customization Wizard */}
          <aside className="unified-container" ref={wizardRef}>
            {!topic && !error && (
              <div className="wizard-container">
                <div className="wizard-header">
                  <div className="wizard-progress">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i + 1}
                        className={`progress-step ${customStep >= i + 1 ? 'active' : ''} ${customStep > i + 1 ? 'completed' : ''}`}
                      >
                        {customStep > i + 1 ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="wizard-info">
                    <span className="step-indicator">Step {customStep} of 6</span>
                    <span className="step-subtitle">Article Generation Wizard</span>
                  </div>
                </div>
                <div className="wizard-content">
                  {renderWizardStep()}
                </div>
              </div>
            )}

            {/* Error state with modern design */}
            {error && (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">Oops! Something went wrong</h3>
                <p className="error-message">{error}</p>
                <div className="error-actions">
                  <button onClick={resetToWizard} className="btn btn-primary">
                    <span className="btn-icon">🔄</span>
                    Try Again
                  </button>
                  {shouldShowArticleList() && (
                    <button onClick={handleGoBackToList} className="btn btn-secondary">
                      <span className="btn-icon">←</span>
                      Back to Articles
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Article Reading View */}
      {viewMode === 'reading' && (
        <div className="rp-body">
          {/* Article Bubbles Container - Show when multiple articles exist */}
          {(() => {
            const articleSessions = onNewSession?.getArticleSessions?.() || [];
            const otherArticles = articleSessions.filter(session => session.id !== selectedArticleId);
            
            return otherArticles.length > 0 && (
              <div className="article-bubbles-container">
                <div className="bubbles-header">
                  <h4 className="bubbles-title">📚 Other Articles</h4>
                  <span className="bubble-count">
                    {otherArticles.length} article{otherArticles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="article-bubbles-grid">
                  {otherArticles.map((article) => (
                    <CompactArticleBubble
                      key={article.id}
                      article={article}
                      onClick={() => handleOpenArticle(article.id)}
                      isActive={false}
                      className="reading-bubble"
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Reading Article Content - Full Width */}
          {topic && (
            <main className="article-content">
              <div className="article-navigation">
                <div className="nav-left">
                  {shouldShowArticleList() ? (
                    <button 
                      onClick={handleGoBackToList}
                      className="back-button"
                    >
                      <span className="back-icon">←</span>
                      Back to Articles
                    </button>
                  ) : (
                    <button 
                      onClick={handleCreateNewArticle}
                      className="back-button"
                    >
                      <span className="back-icon">+</span>
                      Create Another Article
                    </button>
                  )}
                  
                  {/* Previous Article Button */}
                  {previousArticleId && (
                    <button 
                      onClick={() => handleOpenArticle(previousArticleId)}
                      className="back-button previous-article-btn"
                      title="Go back to previous article"
                    >
                      <span className="back-icon">↶</span>
                      Previous Article
                    </button>
                  )}
                </div>
                
                <div className="nav-right">
                  {renderNewSessionButton()}
                </div>
              </div>
              
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
        </div>
      )}
    </div>
  );
};

export default ReadingPassage;