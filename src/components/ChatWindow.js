// src/components/ChatWindow.js - CLEANED VERSION
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

// Lazy loaded components
import { 
  LazyScenarioPicker,
  LazySpeechCoach,
  LazyReadingPassage,
  LazyChatDetail
} from './LazyComponents';

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
    user
  };

  // Available scenarios for chat feature
  const scenarios = availableScenarios || [];

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Feature Header */}
      <FeatureHeader {...headerProps} />
      
      {/* Main Layout Container */}
      <div className="chat-layout">
        
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
    </div>
  );

  // Main content renderer
  function renderMainContent() {
    // Chat Feature
    if (selectedFeature === 'chat') {
      if (needsScenarioSelection()) {
        return (
          <div className="scenario-wrapper">
            <Suspense fallback={<LottieLoader />}>
              <LazyScenarioPicker 
                scenarios={scenarios} 
                onSelect={handleSelectScenario}
                onClose={null}
              />
            </Suspense>
          </div>
        );
      }

      if (scenario && isFeatureReady()) {
        return (
          <div className="scenario-content">
            <div className="scenario-header">
              <h1>{scenario.label}</h1>
              <p>{scenario.description}</p>
            </div>
            <Suspense fallback={<LottieLoader />}>
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
    }

    // Sema Feature
    if (selectedFeature === 'sema') {
      return (
        <div className="feature-container">
          <Suspense fallback={<LottieLoader />}>
            <LazySpeechCoach 
              sessionId={getCurrentActiveId(selectedFeature)}
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
        <h2>Welcome to Voice Assistant</h2>
        <p>Select a feature from the sidebar to get started.</p>
      </div>
    );
  }
};

export default ChatWindow;