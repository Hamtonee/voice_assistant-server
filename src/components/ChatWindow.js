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
      console.log('🎤 SEMA: Component props:', {
        sessionId: getCurrentActiveId(selectedFeature),
        selectedVoice,
        sidebarOpen,
        viewport,
        onNewSession: typeof handleNewSession
      });
      
      try {
        return (
          <div className="feature-container">
            <div style={{ padding: '20px', background: 'yellow', border: '3px solid red' }}>
              <h2>🎤 SEMA FEATURE LOADING...</h2>
              <p>If you see this, Sema is working!</p>
            </div>
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
      } catch (error) {
        console.error('🎤 SEMA: Error rendering:', error);
        return (
          <div className="feature-error">
            <h3>Error loading Sema</h3>
            <p>{error.message}</p>
          </div>
        );
      }
    }

    // Tusome Feature
    if (selectedFeature === 'tusome') {
      console.log('📚 TUSOME: Entered tusome feature branch - ATTEMPTING TO RENDER');
      console.log('📚 TUSOME: Component props:', {
        sessionId: getCurrentActiveId(selectedFeature),
        selectedVoice,
        viewport,
        sidebarState: { open: sidebarOpen, width: sidebarOpen ? 320 : 0 },
        onNewSession: typeof handleNewSession
      });
      
      try {
        return (
          <div className="feature-container">
            <div style={{ padding: '20px', background: 'lightblue', border: '3px solid blue' }}>
              <h2>📚 TUSOME FEATURE LOADING...</h2>
              <p>If you see this, Tusome is working!</p>
            </div>
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
      } catch (error) {
        console.error('📚 TUSOME: Error rendering:', error);
        return (
          <div className="feature-error">
            <h3>Error loading Tusome</h3>
            <p>{error.message}</p>
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
            <div style={{ background: 'orange', padding: '10px', margin: '10px 0' }}>
              <strong>DEBUG INFO:</strong>
              <br />Selected: "{selectedFeature}"
              <br />Type: {typeof selectedFeature}
              <br />Features: {JSON.stringify(features.map(f => f.id))}
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