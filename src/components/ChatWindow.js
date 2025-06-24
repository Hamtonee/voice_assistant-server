// src/components/ChatWindow.js - FIXED VERSION
import React, { useEffect, useContext, Suspense, useState, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// CRITICAL FIX: Use proper ES6 imports with fallbacks
import { 
  useSessionManagement as useSessionManagementHook, 
  useResponsiveLayout as useResponsiveLayoutHook, 
  useFeatureNavigation as useFeatureNavigationHook 
} from '../hooks';

// Component imports with fallbacks
import FeatureHeader from './FeatureHeader';
import ChatSidebar from './ChatSidebar';
import LottieLoader from './LottieLoader';

// CRITICAL FIX: Use proper ES6 imports for lazy components
import { 
  LazyScenarioPicker,
  LazySpeechCoach,
  LazyReadingPassage,
  LazyChatDetail
} from './LazyComponents';

// Direct import for ScenarioPicker (if lazy loading fails)
import ScenarioPicker from './ScenarioPicker';

// Data imports - using proper ES6 imports
import { availableScenarios } from '../data/rolePlayScenarios';

// Styles
import '../assets/styles/ChatWindow.css';

// Fallback hooks in case of import failure
const fallbackSessionManagement = () => ({
  getSessionsByFeature: () => [],
  getCurrentActiveId: () => null,
  createNewSession: async () => {},
  selectSession: () => {},
  deleteSession: async () => {},
  renameSession: async () => {},
  fetchSessions: async () => {}
});

const fallbackResponsiveLayout = () => ({
  viewport: { isMobile: false, isTablet: false },
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebarOnMobile: () => {}
});

const fallbackFeatureNavigation = () => ({
  selectedFeature: 'chat',
  scenario: null,
  selectedVoice: null,
  features: ['chat', 'sema', 'tusome'],
  handleFeatureSelect: () => {},
  handleSelectScenario: () => {},
  handleVoiceSelect: () => {},
  clearScenario: () => {},
  needsScenarioSelection: () => false,
  isFeatureReady: () => true
});

// Error Boundary Component
class ChatWindowErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChatWindow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h3>Something went wrong</h3>
          <p>We're sorry, but there was an error loading the chat interface.</p>
          <button 
            className="retry-button" 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ChatWindow = React.memo(() => {
  // CRITICAL FIX: Add error boundary for AuthContext
  let user = null;
  try {
    const authContext = useContext(AuthContext);
    user = authContext?.user || null;
  } catch (error) {
    console.warn('AuthContext not available:', error);
  }

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // CRITICAL FIX: Always call hooks unconditionally at top level
  const sessionManagement = useSessionManagementHook || fallbackSessionManagement;
  const responsiveLayout = useResponsiveLayoutHook || fallbackResponsiveLayout;
  const featureNavigation = useFeatureNavigationHook || fallbackFeatureNavigation;
  
  // Call the hooks unconditionally
  const sessionResult = sessionManagement();
  const layoutResult = responsiveLayout();
  const navigationResult = featureNavigation();

  // Destructure with fallbacks
  const {
    getSessionsByFeature = () => [],
    getCurrentActiveId = () => null,
    createNewSession = async () => {},
    selectSession = () => {},
    deleteSession = async () => {},
    renameSession = async () => {},
    fetchSessions = async () => {}
  } = sessionResult;

  const {
    viewport = { isMobile: false, isTablet: false },
    sidebarOpen = false,
    toggleSidebar = () => {},
    closeSidebarOnMobile = () => {}
  } = layoutResult;

  const {
    selectedFeature = 'chat',
    scenario = null,
    selectedVoice = null,
    features = ['chat', 'sema', 'tusome'],
    handleFeatureSelect = () => {},
    handleSelectScenario = () => {},
    handleVoiceSelect = () => {},
    clearScenario = () => {},
    needsScenarioSelection = () => false,
    isFeatureReady = () => true
  } = navigationResult;

  // Initialize sessions on component mount with error handling
  useEffect(() => {
    const initializeSessions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        await fetchSessions();
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError('Failed to load sessions. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSessions();
  }, [user, fetchSessions]);

  // Session management handlers with error handling
  const handleNewSession = useCallback(async () => {
    try {
      await createNewSession(selectedFeature);
      closeSidebarOnMobile();
    } catch (err) {
      console.error('Failed to create new session:', err);
      setError('Failed to create new session. Please try again.');
    }
  }, [createNewSession, selectedFeature, closeSidebarOnMobile]);

  const handleSelectSession = useCallback((sessionId) => {
    try {
      selectSession(sessionId, selectedFeature);
      closeSidebarOnMobile();
    } catch (err) {
      console.error('Failed to select session:', err);
      setError('Failed to load session. Please try again.');
    }
  }, [selectSession, selectedFeature, closeSidebarOnMobile]);

  const handleDeleteSession = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId, selectedFeature);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session. Please try again.');
    }
  }, [deleteSession, selectedFeature]);

  const handleRenameSession = useCallback(async (sessionId, newTitle) => {
    try {
      await renameSession(sessionId, newTitle);
    } catch (err) {
      console.error('Failed to rename session:', err);
      setError('Failed to rename session. Please try again.');
    }
  }, [renameSession]);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoized props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    selectedFeature,
    onSelectFeature: handleFeatureSelect,
    chatInstances: getSessionsByFeature(selectedFeature),
    activeChatId: getCurrentActiveId(selectedFeature),
    onSelectChat: handleSelectSession,
    onNewChat: handleNewSession,
    onDeleteChat: handleDeleteSession,
    onRenameChat: handleRenameSession,
    currentScenarioKey: scenario?.key,
    hasCurrentChatContent: false, // This would need proper implementation
    usageSummary: null // This would need proper implementation
  }), [
    selectedFeature,
    handleFeatureSelect,
    getSessionsByFeature,
    getCurrentActiveId,
    handleSelectSession,
    handleNewSession,
    handleDeleteSession,
    handleRenameSession,
    scenario?.key
  ]);

  // Memoized header props
  const headerProps = useMemo(() => ({
    sidebarOpen,
    onToggleSidebar: toggleSidebar,
    selectedFeature,
    scenario,
    onClearScenario: clearScenario,
    user
  }), [
    sidebarOpen,
    toggleSidebar,
    selectedFeature,
    scenario,
    clearScenario,
    user
  ]);

  // Memoized scenarios
  const scenarios = useMemo(() => availableScenarios || [], []);

  // Memoized current session ID
  const currentSessionId = useMemo(() => 
    getCurrentActiveId(selectedFeature), 
    [getCurrentActiveId, selectedFeature]
  );

  // Memoized sidebar state
  const sidebarState = useMemo(() => ({
    open: sidebarOpen, 
    width: sidebarOpen ? 320 : 0
  }), [sidebarOpen]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="feature-loading">
          <LottieLoader />
          <p>Loading your sessions...</p>
        </div>
      </div>
    );
  }

  // Main content renderer - FIXED with better error handling
  const renderMainContent = () => {
    // CRITICAL FIX: Always render error banner above content, not instead of it
    const ErrorBanner = error ? (
      <div className="error-banner">
        <div className="error-content">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
        <button className="error-dismiss" onClick={clearError}>
          ✕
        </button>
      </div>
    ) : null;

    // CRITICAL FIX: Add fallback for missing selectedFeature
    const currentFeature = selectedFeature || 'chat';

    // Chat Feature
    if (currentFeature === 'chat') {
      // CRITICAL FIX: Add null check for needsScenarioSelection
      const needsScenario = needsScenarioSelection ? needsScenarioSelection() : false;
      
      if (needsScenario) {
        return (
          <div className="scenario-wrapper">
            {ErrorBanner}
            <Suspense fallback={<LottieLoader />}>
              {LazyScenarioPicker ? (
                <LazyScenarioPicker 
                  scenarios={scenarios}
                  onSelect={handleSelectScenario}
                />
              ) : (
                <ScenarioPicker 
                  scenarios={scenarios}
                  onSelect={handleSelectScenario}
                />
              )}
            </Suspense>
          </div>
        );
      }

      // CRITICAL FIX: Add null checks for scenario and isFeatureReady
      const featureReady = isFeatureReady ? isFeatureReady() : true;
      
      if (scenario && featureReady) {
        return (
          <div className="scenario-content">
            {ErrorBanner}
            <div className="scenario-header">
              <h1>{scenario.label || 'Chat Session'}</h1>
              <p>{scenario.description || 'Start your conversation'}</p>
            </div>
            <Suspense fallback={<LottieLoader />}>
              {LazyChatDetail ? (
                <LazyChatDetail 
                  sessionId={currentSessionId}
                  scenario={scenario}
                  selectedVoice={selectedVoice}
                  viewport={viewport}
                  sidebarState={sidebarState}
                  onNewSession={handleNewSession}
                />
              ) : (
                <div className="fallback-chat">
                  <h3>Chat component loading...</h3>
                  <p>Please wait while we load the chat interface.</p>
                </div>
              )}
            </Suspense>
          </div>
        );
      }

      // Chat fallback - if no scenario but in chat mode
      return (
        <div className="welcome-container">
          {ErrorBanner}
          <div className="welcome-content">
            <h2>💬 Chat Feature</h2>
            <p>Welcome to the voice assistant chat!</p>
            {scenarios.length === 0 ? (
              <div className="feature-info">
                <p>No scenarios available. Please check your configuration or try refreshing the page.</p>
                <button 
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            ) : (
              <div className="feature-info">
                <p>Select a scenario to get started.</p>
                <p>Available scenarios: {scenarios.length}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Sema Feature
    if (selectedFeature === 'sema') {
      return (
        <div className="feature-container">
          <Suspense fallback={<LottieLoader />}>
            <LazySpeechCoach 
              sessionId={currentSessionId}
              selectedVoice={selectedVoice}
              sidebarOpen={sidebarOpen}
              onNewSession={handleNewSession}
            />
          </Suspense>
        </div>
      );
    }

    // Tusome Feature
    if (selectedFeature === 'tusome') {
      return (
        <div className="feature-container">
          <Suspense fallback={<LottieLoader />}>
            <LazyReadingPassage 
              sessionId={currentSessionId}
              selectedVoice={selectedVoice}
              viewport={viewport}
              sidebarState={sidebarState}
              onNewSession={handleNewSession}
            />
          </Suspense>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="welcome-container">
        <div className="welcome-content">
          <h2>Welcome to Voice Assistant</h2>
          <p>Please select a feature to get started.</p>
          <div className="feature-info">
            <p>Selected Feature: {selectedFeature || 'None'}</p>
            <p>Available Features: {features?.length || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChatWindowErrorBoundary>
      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Feature Header */}
        <div style={{ gridArea: 'header' }}>
          <FeatureHeader {...headerProps} />
        </div>
        
        {/* Sidebar */}
        <div className="sidebar">
          <ChatSidebar {...sidebarProps} />
        </div>
        
        {/* Mobile Sidebar Backdrop */}
        {viewport.isMobile && sidebarOpen && (
          <div 
            className="mobile-backdrop"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Main Content Area */}
        <div className="chat-content">
          {renderMainContent()}
        </div>
      </div>
    </ChatWindowErrorBoundary>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;