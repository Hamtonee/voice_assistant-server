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

  // Initialize sessions on component mount
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

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
    features,
    selectedFeature,
    onFeatureSelect: handleFeatureSelect,
    sessions: getSessionsByFeature(selectedFeature),
    activeSessionId: getCurrentActiveId(selectedFeature),
    onSelectSession: handleSelectSession,
    onNewSession: handleNewSession,
    onDeleteSession: handleDeleteSession,
    onRenameSession: handleRenameSession,
    onVoiceSelect: handleVoiceSelect,
    selectedVoice,
    user
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

    // Chat Feature
    if (selectedFeature === 'chat') {
      if (needsScenarioSelection()) {
        console.log('📋 Showing scenario picker');
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
        console.log('💬 Showing chat detail for:', scenario.label);
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
      return (
        <div className="feature-loading">
          <LottieLoader message="Initializing chat..." />
        </div>
      );
    }

    // Sema Feature
    if (selectedFeature === 'sema') {
      console.log('🎤 Showing speech coach');
      return (
        <div className="feature-container">
          <Suspense fallback={<LottieLoader message="Loading speech coach..." />}>
            <LazySpeechCoach 
              sessionId={getCurrentActiveId(selectedFeature)}
              selectedVoice={selectedVoice}
              sidebarOpen={sidebarOpen}
              viewport={viewport}
              onNewSession={handleNewSession}
            />
          </Suspense>
        </div>
      );
    }

    // Tusome Feature
    if (selectedFeature === 'tusome') {
      console.log('📚 Showing reading passage');
      return (
        <div className="feature-container">
          <Suspense fallback={<LottieLoader message="Loading reading practice..." />}>
            <LazyReadingPassage 
              sessionId={getCurrentActiveId(selectedFeature)}
              selectedVoice={selectedVoice}
              viewport={viewport}
              sidebarState={{ open: sidebarOpen, width: sidebarOpen ? 320 : 0 }}
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
          <h2>Welcome to SemaNami</h2>
          <p>Select a feature from the sidebar to get started</p>
          <div className="feature-info">
            <p><strong>Current Feature:</strong> {selectedFeature}</p>
            <p><strong>Available Features:</strong> {features.map(f => f.label).join(', ')}</p>
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