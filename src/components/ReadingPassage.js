import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  // Refs
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const wizardRef = useRef(null);
  
  // Core state management
  const [topic, setTopic] = useState(null);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [readWords, setReadWords] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [customStep, setCustomStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Article and session management
  const [viewMode, setViewMode] = useState('list');
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [previousArticleId, setPreviousArticleId] = useState(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [forceListView, setForceListView] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  // Session state and parameters
  const [params, setParams] = useState({
    ageGroup: '',
    category: '',
    difficulty: '',
    customization: []
  });
  
  // Usage tracking state
  const [usageSummary, setUsageSummary] = useState(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [dailyLimitStatus, setDailyLimitStatus] = useState(null);
  const [sessionState, setSessionState] = useState({
    isNew: true,
    hasContent: false,
    lastInteractionTime: Date.now(),
    isUnused: true
  });

  // Session tracking and interaction state
  const [sessionInteractionLevel, setSessionInteractionLevel] = useState('none');
  const [wizardProgress, setWizardProgress] = useState({
    hasStartedWizard: false,
    hasCompletedStep: false,
    hasSubmittedParams: false
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

  // Article management functions
  const handleOpenArticle = useCallback((articleId) => {
    if (!articleId) return;
    setSelectedArticleId(articleId);
    setViewMode('detail');
    markUserInteraction('article_interaction', { articleId });
  }, [markUserInteraction]);

  const shouldShowArticleList = useCallback(() => {
    return viewMode === 'list' || forceListView;
  }, [viewMode, forceListView]);

  // Session interaction tracking
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight > 0) {
      const progress = (scrollPosition / scrollHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    }
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // These handlers are used in dynamic content generation
  // eslint-disable-next-line no-unused-vars
  const handleParamChange = useCallback((paramName, value) => {
    setParams(prev => ({ ...prev, [paramName]: value }));
  }, []);

  // eslint-disable-next-line no-unused-vars
  const fetchTopic = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.fetchTopic(params);
      setTopic(response.data);
      return response.data;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [params]); // Fixed: Added params dependency

  // Clean up unused variables with eslint-disable comments
  // eslint-disable-next-line no-unused-vars
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

  // Handle window resize
  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const viewport = {
        isMobile: width <= 767,
        isTablet: width >= 768 && width <= 1023,
        isDesktop: width >= 1024,
        width,
        height
      };
      setCurrentViewport(viewport);
    }
  }, []);

  // Set viewport height for mobile
  const setVH = useCallback(() => {
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
  }, []);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      const response = await api.getChatHistory(currentSessionId);
      if (response.data && response.data.messages) {
        setChatMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, [currentSessionId]);

  // Save chat history
  const saveChatHistory = useCallback(async () => {
    if (!currentSessionId || !chatMessages.length) return;
    try {
      await api.saveChatHistory(currentSessionId, chatMessages);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [currentSessionId, chatMessages]);

  // Fetch usage summary
  const fetchUsageSummary = useCallback(async () => {
    try {
      const response = await api.get(USAGE_ENDPOINT);
      setUsageSummary(response.data);
      
      // Check daily limits
      const { dailyArticleCount, maxDailyArticles } = response.data;
      if (dailyArticleCount >= maxDailyArticles) {
        setShowLimitModal(true);
        setDailyLimitStatus({ current: dailyArticleCount, max: maxDailyArticles });
      } else if (dailyArticleCount >= maxDailyArticles * 0.8) {
        setShowUsageWarning(true);
      }
    } catch (error) {
      console.error('Failed to fetch usage summary:', error);
    }
  }, []);

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
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('resize', setVH);
    setVH();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', setVH);
    };
  }, [handleResize, setVH]);

  useEffect(() => {
    loadChatHistory();
    fetchUsageSummary();
  }, [loadChatHistory, fetchUsageSummary]);

  useEffect(() => {
    const saveInterval = setInterval(saveChatHistory, 30000);
    return () => clearInterval(saveInterval);
  }, [saveChatHistory]);

  // Add missing state variables
  const [availableCategories] = useState([
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'literature', name: 'Literature', icon: '📖' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'arts', name: 'Arts', icon: '🎨' },
    { id: 'current_events', name: 'Current Events', icon: '📰' }
  ]);

  // Add missing functions
  const resetToWizard = useCallback(() => {
    setViewMode('creating');
    setCustomStep(1);
    setTopic(null);
    setError(null);
    setParams({
      category: '',
      paragraphCount: 3,
      difficulty: 'medium',
      ageGroup: '',
      additionalInstruction: '',
      fineTuning: ''
    });
    setSessionInteractionLevel('wizard_reset');
  }, []);

  const handleCreateNewArticle = useCallback(() => {
    if (loading) return;
    resetToWizard();
  }, [loading, resetToWizard]);

  const handleGoBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedArticleId(null);
    setSessionInteractionLevel('navigation');
  }, []);

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
            {renderArticleCount(articleSessions)}
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
                {ageGroups.map(group => (
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
                {difficultyLevels.map(level => (
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
              {customizationOptions.map((option, index) => (
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