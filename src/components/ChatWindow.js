// src/components/ChatWindow.js - FIXED VERSION
import React, { useEffect, useContext, Suspense } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  useSessionManagement, 
  useResponsiveLayout, 
  useFeatureNavigation 
} from '../hooks';

// Component imports
import FeatureHeader from './FeatureHeader';
import ChatSidebar from './ChatSidebar';
import LottieLoader from './LottieLoader';
import DebugInfo from './DebugInfo';

// Lazy loaded components
import { 
  LazyScenarioPicker,
  LazySpeechCoach,
  LazyReadingPassage,
  LazyChatDetail
} from './LazyComponents';

// Direct import for ScenarioPicker (if lazy loading fails)
import ScenarioPicker from './ScenarioPicker';

// Data imports
import { availableScenarios } from '../data/rolePlayScenarios';

// Styles
import '../assets/styles/ChatWindow.css';

const ChatWindow = () => {
  const { user } = useContext(AuthContext);

  // Custom hooks for state management
  const {
    getSessionsByFeature,
    getCurrentActiveId,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    fetchSessions
  } = useSessionManagement();

  const {
    viewport,
    sidebarOpen,
    toggleSidebar,
    closeSidebarOnMobile
  } = useResponsiveLayout();

  const {
    selectedFeature,
    scenario,
    selectedVoice,
    features,
    handleFeatureSelect,
    handleSelectScenario,
    handleVoiceSelect,
    clearScenario,
    needsScenarioSelection,
    isFeatureReady
  } = useFeatureNavigation();

  // Initialize sessions on component mount with auto-creation for sema/tusome
  useEffect(() => {
    if (user) {
      const initializeSessions = async () => {
        const sessionsData = await fetchSessions();
        
        // Auto-create Sema and Tusome sessions if they don't exist
        const hasSemanSession = sessionsData.some(s => s.feature === 'sema');
        const hasTusomeSession = sessionsData.some(s => s.feature === 'tusome');
        
        if (!hasSemanSession) {
          console.log('🎤 Creating initial Sema session...');
          await createNewSession('sema', false);
        }
        
        if (!hasTusomeSession) {
          console.log('📚 Creating initial Tusome session...');
          await createNewSession('tusome', false);
        }
      };
      
      initializeSessions();
    }
  }, [user, fetchSessions, createNewSession]);

  // Session management handlers
  const handleNewSession = async () => {
    await createNewSession(selectedFeature);
    closeSidebarOnMobile();
  };

  const handleSelectSession = (sessionId) => {
    selectSession(sessionId, selectedFeature);
    closeSidebarOnMobile();
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId, selectedFeature);
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    await renameSession(sessionId, newTitle);
  };

  // Sidebar props
  const sidebarProps = {
    selectedFeature,
    onSelectFeature: handleFeatureSelect,
    onNewChat: handleNewSession,
    chatInstances: getSessionsByFeature(selectedFeature),
    activeChatId: getCurrentActiveId(selectedFeature),
    onSelectChat: handleSelectSession,
    onRenameChat: handleRenameSession,
    onDeleteChat: handleDeleteSession,
    currentScenarioKey: scenario?.key,
    hasCurrentChatContent: false, // TODO: implement this if needed
    usageSummary: null // TODO: implement this if needed
  };

  // Header props
  const headerProps = {
    sidebarOpen,
    onToggleSidebar: toggleSidebar,
    selectedFeature,
    scenario,
    onClearScenario: clearScenario,
    user,
    selectedVoice,
    onVoiceSelect: handleVoiceSelect
  };

  // Available scenarios for chat feature
  const scenarios = availableScenarios || [];

  // Main content renderer
  const renderMainContent = () => {
    console.log('🎯 Rendering main content:', { 
      selectedFeature, 
      scenario: scenario?.label || 'None', 
      needsScenario: needsScenarioSelection(),
      isReady: isFeatureReady(),
      scenariosCount: scenarios?.length || 0
    });

    // Add extensive debugging for feature switching
    console.log('🔍 DEBUG - Feature Analysis:', {
      selectedFeature,
      featureType: typeof selectedFeature,
      scenario,
      needsScenarioSelection: needsScenarioSelection(),
      isFeatureReady: isFeatureReady(),
      availableFeatures: features.map(f => f.id)
    });

    // Chat Feature
    if (selectedFeature === 'chat') {
      console.log('💬 CHAT: Entered chat feature branch');
      if (needsScenarioSelection()) {
        console.log('📋 CHAT: Showing scenario picker');
        return (
          <div className="scenario-wrapper">
            <Suspense fallback={<LottieLoader message="Loading scenarios..." />}>
              <ScenarioPicker 
                scenarios={scenarios}
                onSelect={handleSelectScenario}
              />
            </Suspense>
          </div>
        );
      }

      if (scenario && isFeatureReady()) {
        console.log('💬 CHAT: Showing chat detail for:', scenario.label);
        return (
          <div className="scenario-content">
            <Suspense fallback={<LottieLoader message="Loading conversation..." />}>
              <LazyChatDetail 
                sessionId={getCurrentActiveId(selectedFeature)}
                scenario={scenario}
                selectedVoice={selectedVoice}
                viewport={viewport}
                sidebarState={{ open: sidebarOpen, width: sidebarOpen ? 320 : 0 }}
                onNewSession={handleNewSession}
              />
            </Suspense>
          </div>
        );
      }

      // Chat fallback - show loading or empty state
      console.log('💬 CHAT: Showing fallback loading state');
      return (
        <div className="feature-loading">
          <LottieLoader message="Initializing chat..." />
        </div>
      );
    }

    // Sema Feature
    if (selectedFeature === 'sema') {
      console.log('🎤 SEMA: Entered sema feature branch - ATTEMPTING TO RENDER');
      const semaSessionId = getCurrentActiveId(selectedFeature);
      console.log('🎤 SEMA: Component props:', {
        sessionId: semaSessionId,
        selectedVoice,
        sidebarOpen,
        onNewSession: typeof handleNewSession
      });
      
      // Ensure session exists before rendering
      if (!semaSessionId) {
        console.log('🎤 SEMA: No session ID, creating new session...');
        createNewSession('sema', false);
        return (
          <div className="feature-loading">
            <LottieLoader message="Initializing Sema session..." />
          </div>
        );
      }
      
      try {
        return (
          <div className="main-content-area speech-coach-container">
            <Suspense fallback={<LottieLoader message="Loading Speech Coach..." />}>
              <LazySpeechCoach 
                sessionId={semaSessionId}
                selectedVoice={selectedVoice}
                sidebarOpen={sidebarOpen}
                onNewSession={handleNewSession}
              />
            </Suspense>
          </div>
        );
      } catch (error) {
        console.error('🎤 SEMA: Error rendering:', error);
        return (
          <div className="feature-error">
            <h3>Error loading Sema</h3>
            <p>{error.message}</p>
            <button onClick={() => createNewSession('sema', false)}>
              Retry
            </button>
          </div>
        );
      }
    }

    // Tusome Feature
    if (selectedFeature === 'tusome') {
      console.log('📚 TUSOME: Entered tusome feature branch - ATTEMPTING TO RENDER');
      const tusomeSessionId = getCurrentActiveId(selectedFeature);
      console.log('📚 TUSOME: Component props:', {
        sessionId: tusomeSessionId,
        selectedVoice,
        viewport,
        sidebarState: { open: sidebarOpen, width: sidebarOpen ? 320 : 0 },
        onNewSession: typeof handleNewSession
      });
      
      // Ensure session exists before rendering
      if (!tusomeSessionId) {
        console.log('📚 TUSOME: No session ID, creating new session...');
        createNewSession('tusome', false);
        return (
          <div className="feature-loading">
            <LottieLoader message="Initializing Tusome session..." />
          </div>
        );
      }
      
      try {
        return (
          <div className="main-content-area reading-practice-container">
            <Suspense fallback={<LottieLoader message="Loading Reading Practice..." />}>
              <LazyReadingPassage 
                sessionId={tusomeSessionId}
                selectedVoice={selectedVoice}
                viewport={viewport}
                sidebarState={{ open: sidebarOpen, width: sidebarOpen ? 320 : 0 }}
                onNewSession={handleNewSession}
              />
            </Suspense>
          </div>
        );
      } catch (error) {
        console.error('📚 TUSOME: Error rendering:', error);
        return (
          <div className="feature-error">
            <h3>Error loading Tusome</h3>
            <p>{error.message}</p>
            <button onClick={() => createNewSession('tusome', false)}>
              Retry
            </button>
          </div>
        );
      }
    }

    // Default fallback
    console.log('❓ DEFAULT: No feature matched, showing fallback');
    return (
      <div className="welcome-container">
        <div className="welcome-content">
          <h2>Welcome to SemaNami</h2>
          <p>Select a feature from the sidebar to get started</p>
          <div className="feature-info">
            <p><strong>Current Feature:</strong> {selectedFeature}</p>
            <p><strong>Available Features:</strong> {features.map(f => f.label).join(', ')}</p>
            <div className="debug-info">
              <strong>Debug Info:</strong>
              <br />Selected Feature: {selectedFeature}
              <br />Available: {features.map(f => f.label).join(', ')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Debug Info - Temporary */}
      {process.env.NODE_ENV === 'development' && (
        <DebugInfo 
          selectedFeature={selectedFeature}
          scenario={scenario}
          needsScenarioSelection={needsScenarioSelection()}
          isFeatureReady={isFeatureReady()}
          scenarios={scenarios}
          sidebarOpen={sidebarOpen}
        />
      )}

      {/* Feature Header */}
      <div className="app-header">
        <FeatureHeader {...headerProps} />
      </div>
      
      {/* Sidebar */}
      <div className="app-sidebar">
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
      <div className="app-main">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default ChatWindow;