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
    user
  };

  // Available scenarios for chat feature
  const scenarios = availableScenarios || [];

  return (
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
  );

  // Main content renderer
  function renderMainContent() {
    console.log('🎯 Rendering main content:', { 
      selectedFeature, 
      scenario, 
      needsScenarioSelection: needsScenarioSelection(),
      isFeatureReady: isFeatureReady(),
      scenariosLength: scenarios?.length || 0
    });

    // Add emergency debug component that's guaranteed to be visible
    const DebugComponent = () => (
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '310px',
        right: '10px',
        bottom: '10px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontSize: '18px',
        zIndex: 9999,
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '2px solid #fff'
      }}>
        <h1 style={{ margin: '0 0 2rem 0', fontSize: '2rem', textAlign: 'center' }}>
          🚀 EMERGENCY DEBUG MODE
        </h1>
        <div style={{ textAlign: 'center', lineHeight: '1.8' }}>
          <p><strong>Selected Feature:</strong> {selectedFeature}</p>
          <p><strong>Scenario:</strong> {scenario ? scenario.label : 'None'}</p>
          <p><strong>Needs Scenario Selection:</strong> {needsScenarioSelection() ? 'YES' : 'NO'}</p>
          <p><strong>Is Feature Ready:</strong> {isFeatureReady() ? 'YES' : 'NO'}</p>
          <p><strong>Available Scenarios:</strong> {scenarios?.length || 0}</p>
          <p><strong>Sidebar Open:</strong> {sidebarOpen ? 'YES' : 'NO'}</p>
        </div>
        <button 
          onClick={() => {
            console.log('🔥 Test button clicked');
            if (selectedFeature === 'chat') {
              handleSelectScenario({ key: 'test', label: 'Test Scenario', description: 'Test' });
            }
          }}
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            fontSize: '18px',
            background: '#fff',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🎯 Test Chat Selection
        </button>
      </div>
    );

    // Show debug component only if needed for debugging
    // return <DebugComponent />;

    // Chat Feature
    if (selectedFeature === 'chat') {
      if (needsScenarioSelection()) {
        console.log('📋 Showing scenario picker');
        return (
          <div className="scenario-wrapper">
            <Suspense fallback={<LottieLoader />}>
              <ScenarioPicker 
                scenarios={scenarios}
                onSelect={handleSelectScenario}
              />
            </Suspense>
          </div>
        );
      }

      if (scenario && isFeatureReady()) {
        console.log('💬 Showing chat detail');
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

      // Chat fallback - if no scenario but in chat mode
      console.log('💬 Chat fallback - showing welcome');
      return (
        <div className="welcome-container">
          <h2>💬 Chat Feature</h2>
          <p>Loading scenarios...</p>
          <p>Available scenarios: {scenarios?.length || 0}</p>
        </div>
      );
    }

    // Sema Feature
    if (selectedFeature === 'sema') {
      console.log('🎤 Showing speech coach');
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
      console.log('📚 Showing reading passage');
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
        <h2>🎯 Debug Info</h2>
        <p>Selected Feature: {selectedFeature}</p>
        <p>Scenario: {scenario ? 'Yes' : 'No'}</p>
        <p>Needs Scenario Selection: {needsScenarioSelection() ? 'Yes' : 'No'}</p>
        <p>Is Feature Ready: {isFeatureReady() ? 'Yes' : 'No'}</p>
        <p>Available Scenarios: {scenarios?.length || 0}</p>
      </div>
    );
  }
};

export default ChatWindow;