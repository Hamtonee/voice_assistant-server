import { useState, useCallback } from 'react';
import api from '../api';

export const useSessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState({
    chat: null,
    sema: null,
    tusome: null
  });

  // Helper function to get sessions by feature
  const getSessionsByFeature = useCallback((feature) => {
    return Array.isArray(sessions) ? sessions.filter(s => s.feature === feature) : [];
  }, [sessions]);

  // Get current active session ID for selected feature
  const getCurrentActiveId = useCallback((selectedFeature) => {
    return activeSessionIds[selectedFeature];
  }, [activeSessionIds]);

  // Check if session has content
  const checkSessionContent = useCallback(async (sessionId, feature) => {
    if (!sessionId) return false;
    
    try {
      const { data } = await api.get(`/chats/${sessionId}`);
      return data.messages?.some(msg => msg.role === 'user') || false;
    } catch (error) {
      console.error('Error checking session content:', error);
      return false;
    }
  }, []);

  // Create new session for a feature
  const createNewSession = useCallback(async (feature, forceNew = true) => {
    try {
      const currentId = activeSessionIds[feature];
      
      // Check if current session has content before creating new one
      if (forceNew && currentId) {
        const hasContent = await checkSessionContent(currentId, feature);
        if (!hasContent) {
          console.log(`Current ${feature} session is empty, not creating new one`);
          return;
        }
      }

      const sessionConfig = {
        chat: {
          feature: 'chat',
          title: 'New Chat',
          scenarioKey: null
        },
        sema: {
          feature: 'sema',
          title: 'Sema Session',
          prompt: 'Welcome to Sema! How can I help you practice speaking?'
        },
        tusome: {
          feature: 'tusome',
          title: 'New Reading'
        }
      };

      const config = sessionConfig[feature];
      const { data } = await api.post('/chats', config);
      
      setSessions(prev => [data, ...prev]);
      setActiveSessionIds(prev => ({
        ...prev,
        [feature]: data.id
      }));
      
      console.log(`Created new ${feature} session:`, data.id);
      return data;
    } catch (error) {
      console.error(`Failed to create new ${feature} session:`, error);
    }
  }, [activeSessionIds, checkSessionContent]);

  // Select a session
  const selectSession = useCallback((sessionId, selectedFeature) => {
    setActiveSessionIds(prev => ({
      ...prev,
      [selectedFeature]: sessionId
    }));
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId, selectedFeature) => {
    try {
      await api.delete(`/chats/${sessionId}`);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Handle active session reassignment
      setActiveSessionIds(prev => {
        if (prev[selectedFeature] === sessionId) {
          const remainingSessions = Array.isArray(sessions) 
            ? sessions.filter(s => s.feature === selectedFeature && s.id !== sessionId)
            : [];
          
          if (remainingSessions.length > 0) {
            return {
              ...prev,
              [selectedFeature]: remainingSessions[0].id
            };
          } else {
            // Create new session when last one is deleted for sema/tusome
            if (selectedFeature !== 'chat') {
              createNewSession(selectedFeature, false);
            }
            return {
              ...prev,
              [selectedFeature]: null
            };
          }
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [sessions, createNewSession]);

  // Rename a session
  const renameSession = useCallback(async (sessionId, newTitle) => {
    try {
      await api.put(`/chats/${sessionId}`, { title: newTitle });
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
      );
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  }, []);

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/chats');
      const sessionsData = Array.isArray(data) ? data : [];
      setSessions(sessionsData);
      
      // Set initial active sessions
      const chatSessions = sessionsData.filter(c => c.feature === 'chat');
      const semaSessions = sessionsData.filter(c => c.feature === 'sema');
      const tusomeSessions = sessionsData.filter(c => c.feature === 'tusome');
      
      setActiveSessionIds({
        chat: chatSessions.length ? chatSessions[0].id : null,
        sema: semaSessions.length ? semaSessions[0].id : null,
        tusome: tusomeSessions.length ? tusomeSessions[0].id : null
      });
      
      return sessionsData;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
      return [];
    }
  }, []);

  return {
    // State
    sessions,
    activeSessionIds,
    
    // Actions
    setSessions,
    setActiveSessionIds,
    
    // Computed values
    getSessionsByFeature,
    getCurrentActiveId,
    
    // Operations
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    checkSessionContent,
    fetchSessions
  };
}; 