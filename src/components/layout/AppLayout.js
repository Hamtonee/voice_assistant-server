import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useSessionManagement } from '../../hooks/useSessionManagement';
import SemaNamiLayout from './SemaNamiLayout';

const AppLayout = ({ children }) => {
  const location = useLocation();
  
  // Session management
  const {
    getSessionsByFeature,
    getCurrentActiveId,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    fetchSessions,
    checkSessionContent
  } = useSessionManagement();

  // Feature detection from current route
  const getSelectedFeature = useCallback(() => {
    const path = location.pathname;
    if (path.includes('/sema')) return 'sema';
    if (path.includes('/tusome')) return 'tusome';
    if (path.includes('/chat')) return 'chat';
    return 'chat'; // default
  }, [location.pathname]);

  const [selectedFeature, setSelectedFeature] = useState(getSelectedFeature());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update feature when route changes
  useEffect(() => {
    setSelectedFeature(getSelectedFeature());
  }, [getSelectedFeature]);

  // Initialize sessions on mount
  useEffect(() => {
    const initializeSessions = async () => {
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
  }, [fetchSessions]);

  // Get current active session ID
  const activeChatId = getCurrentActiveId(selectedFeature);
  
  // Get sessions for current feature
  const featureSessions = getSessionsByFeature(selectedFeature);

  // Session management handlers
  const handleNewChat = useCallback(async () => {
    try {
      const sessionData = await createNewSession(selectedFeature, false, {
        reason: 'user_request'
      });
      console.log(`✅ New ${selectedFeature} session created:`, sessionData.id);
    } catch (err) {
      console.error('Failed to create new session:', err);
      setError('Failed to create new session. Please try again.');
    }
  }, [createNewSession, selectedFeature]);

  const handleSelectChat = useCallback((sessionId) => {
    try {
      selectSession(sessionId, selectedFeature);
      console.log(`✅ Selected ${selectedFeature} session:`, sessionId);
    } catch (err) {
      console.error('Failed to select session:', err);
      setError('Failed to load session. Please try again.');
    }
  }, [selectSession, selectedFeature]);

  const handleDeleteChat = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId, selectedFeature);
      console.log(`✅ Deleted ${selectedFeature} session:`, sessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session. Please try again.');
    }
  }, [deleteSession, selectedFeature]);

  const handleRenameChat = useCallback(async (sessionId, newTitle) => {
    try {
      await renameSession(sessionId, newTitle);
      console.log(`✅ Renamed session ${sessionId} to:`, newTitle);
    } catch (err) {
      console.error('Failed to rename session:', err);
      setError('Failed to rename session. Please try again.');
    }
  }, [renameSession]);

  // Check if current session has content
  const [hasCurrentChatContent, setHasCurrentChatContent] = useState(false);

  useEffect(() => {
    const checkCurrentContent = async () => {
      if (activeChatId) {
        try {
          const validation = await checkSessionContent(activeChatId, selectedFeature);
          setHasCurrentChatContent(validation.hasContent);
        } catch (err) {
          console.warn('Failed to check session content:', err);
          setHasCurrentChatContent(false);
        }
      } else {
        setHasCurrentChatContent(false);
      }
    };

    checkCurrentContent();
  }, [activeChatId, selectedFeature, checkSessionContent]);

  // Get current scenario key (for chat feature)
  const getCurrentScenarioKey = useCallback(() => {
    if (selectedFeature === 'chat' && activeChatId) {
      const currentSession = featureSessions.find(s => s.id === activeChatId);
      return currentSession?.scenarioKey || null;
    }
    return null;
  }, [selectedFeature, activeChatId, featureSessions]);

  const currentScenarioKey = getCurrentScenarioKey();

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #181c2a)',
        color: 'var(--text-primary, #fff)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-primary, #333)',
          borderTop: '3px solid var(--accent-primary, #6366f1)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading your sessions...</p>
      </div>
    );
  }

  return (
    <>
      {/* Error Banner */}
      {error && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ef4444',
          color: '#fff',
          padding: '12px 24px',
          zIndex: 300,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Layout */}
      <SemaNamiLayout
        sessions={featureSessions}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        currentScenarioKey={currentScenarioKey}
        hasCurrentChatContent={hasCurrentChatContent}
        platformName="SemaNami"
      >
        {children}
      </SemaNamiLayout>

      {/* Loading animation CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppLayout; 