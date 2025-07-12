import { useState, useCallback, useRef } from 'react';
import api from '../api';

export const useSessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState({
    chat: null,
    sema: null,
    tusome: null
  });
  
  // Track session validation state to prevent redundant checks
  const validationCache = useRef(new Map());
  const [isValidating, setIsValidating] = useState(false);

  // Helper function to get sessions by feature
  const getSessionsByFeature = useCallback((feature) => {
    return Array.isArray(sessions) ? sessions.filter(s => s.feature === feature) : [];
  }, [sessions]);

  // Get current active session ID for selected feature
  const getCurrentActiveId = useCallback((selectedFeature) => {
    return activeSessionIds[selectedFeature];
  }, [activeSessionIds]);

  // ENHANCED: Comprehensive session content validation
  const checkSessionContent = useCallback(async (sessionId, feature) => {
    if (!sessionId) return { hasContent: false, isEmpty: true, details: 'No session ID' };
    
    // Check cache first to avoid redundant API calls
    const cacheKey = `${sessionId}-${feature}`;
    const cached = validationCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30s cache
      console.log(`📋 [Session Cache] Using cached validation for ${sessionId}`);
      return cached.result;
    }
    
    setIsValidating(true);
    
    try {
      let hasContent = false;
      let details = '';
      let interactionLevel = 'none';
      
      switch (feature) {
        case 'chat':
          try {
            const { data } = await api.get(`/chats/${sessionId}`);
            const userMessages = data.messages?.filter(msg => msg.role === 'user') || [];
            const totalMessages = data.messages?.length || 0;
            
            hasContent = userMessages.length > 0;
            details = `${userMessages.length} user messages, ${totalMessages} total messages`;
            
            if (userMessages.length >= 3) {
              interactionLevel = 'meaningful';
            } else if (userMessages.length >= 1) {
              interactionLevel = 'engaged';
            } else if (totalMessages > 0) {
              interactionLevel = 'started';
            }
          } catch (error) {
            console.log('📝 [Chat Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing chat';
          }
          break;
          
        case 'sema':
          try {
            const { data } = await api.fetchSpeechSession(sessionId);
            const userMessages = data.messages?.filter(msg => msg.role === 'user') || [];
            const totalMessages = data.messages?.length || 0;
            
            // For speech coaching, consider any recorded speech attempt as meaningful
            const hasRecordedSpeech = userMessages.some(msg => 
              msg.metadata?.speechAttempt || 
              msg.metadata?.audioFile || 
              (msg.text && msg.text.length > 10)
            );
            
            hasContent = userMessages.length > 0 || hasRecordedSpeech;
            details = `${userMessages.length} speech messages, ${totalMessages} total messages`;
            
            if (userMessages.length >= 2 || hasRecordedSpeech) {
              interactionLevel = 'meaningful';
            } else if (userMessages.length >= 1) {
              interactionLevel = 'engaged';
            } else if (totalMessages > 0) {
              interactionLevel = 'started';
            }
          } catch (error) {
            console.log('🎤 [Speech Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing speech session';
          }
          break;
          
        case 'tusome':
          try {
            const { data } = await api.fetchReadingSession(sessionId);
            const userMessages = data.messages?.filter(msg => msg.role === 'user') || [];
            const totalMessages = data.messages?.length || 0;
            
            // Enhanced article content detection
            const hasArticle = !!(data.articleData || data.topic);
            const hasWizardProgress = data.wizardProgress?.hasSubmittedParams;
            const hasReadingProgress = data.readingProgress > 0.1; // Read at least 10%
            const hasReadingAttempt = userMessages.some(msg => 
              msg.metadata?.readingAttempt || 
              msg.metadata?.comprehensionAnswer || 
              (msg.text && msg.text.length > 20)
            );
            
            // For reading, consider article generation or significant reading as meaningful
            hasContent = hasArticle || hasWizardProgress || hasReadingAttempt || userMessages.length > 0;
            details = `Article: ${hasArticle}, Wizard: ${hasWizardProgress}, Progress: ${hasReadingProgress}, Messages: ${userMessages.length}`;
            
            // Enhanced interaction levels for articles
            if (hasArticle && (hasReadingProgress || userMessages.length > 0)) {
              interactionLevel = 'meaningful'; // Article read or engaged with
            } else if (hasArticle || hasWizardProgress) {
              interactionLevel = 'engaged'; // Article generated or wizard completed
            } else if (userMessages.length >= 1) {
              interactionLevel = 'engaged';
            } else if (totalMessages > 0) {
              interactionLevel = 'started';
            }
          } catch (error) {
            console.log('📚 [Reading Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing reading session';
          }
          break;
          
        default:
          hasContent = false;
          details = `Unknown feature: ${feature}`;
      }
      
      const result = {
        hasContent,
        isEmpty: !hasContent,
        details,
        interactionLevel,
        feature,
        sessionId,
        timestamp: Date.now()
      };
      
      // Cache the result
      validationCache.current.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      console.log(`✅ [Session Validation] ${feature} session ${sessionId}:`, result);
      return result;
      
    } catch (error) {
      console.error('❌ [Session Validation] Error:', error);
      const errorResult = {
        hasContent: false,
        isEmpty: true,
        details: `Validation error: ${error.message}`,
        interactionLevel: 'error',
        feature,
        sessionId,
        timestamp: Date.now()
      };
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // ENHANCED: Smart session creation with comprehensive validation
  const createNewSession = useCallback(async (feature, forceNew = true, metadata = {}) => {
    try {
      const currentId = activeSessionIds[feature];
      
      console.log(`🆕 [Smart Session] Creating ${feature} session. Current: ${currentId}, Force: ${forceNew}`);
      
      // ARTICLE LIMIT CHECK: Enforce 3-article limit for tusome
      if (feature === 'tusome') {
        const tusomeSessions = sessions.filter(s => s.feature === 'tusome');
        
        // Check how many sessions have actual articles
        let articlesCount = 0;
        for (const session of tusomeSessions) {
          try {
            const validation = await checkSessionContent(session.id, 'tusome');
            if (validation.hasContent) {
              articlesCount++;
            }
          } catch (error) {
            // Assume session has content if we can't validate
            articlesCount++;
          }
        }
        
        if (articlesCount >= 3 && forceNew) {
          throw new Error('ARTICLE_LIMIT_REACHED');
        }
      }
      
      // Check if current session has content before creating new one
      if (forceNew && currentId) {
        const validation = await checkSessionContent(currentId, feature);
        
        if (!validation.hasContent) {
          console.log(`📝 [Smart Session] Current ${feature} session is empty, returning existing session`);
          
          // Return the existing session data instead of creating new
          const existingSession = sessions.find(s => s.id === currentId);
          if (existingSession) {
            return { 
              ...existingSession, 
              resumed: true,
              reason: 'empty_session_reuse',
              validationDetails: validation.details
            };
          }
        } else {
          console.log(`🔄 [Smart Session] Current ${feature} session has content (${validation.interactionLevel}), creating new session`);
        }
      }

      // Create new session configuration with enhanced metadata for articles
      const sessionConfig = {
        chat: {
          feature: 'chat',
          title: `Chat Session ${new Date().toLocaleTimeString()}`,
          scenarioKey: metadata.scenarioKey || null,
          metadata: {
            creationReason: metadata.reason || 'user_request',
            previousSessionId: currentId,
            ...metadata
          }
        },
        sema: {
          feature: 'sema',
          title: `Speech Session ${new Date().toLocaleTimeString()}`,
          prompt: 'Welcome to Sema! Let\'s practice your speaking skills.',
          metadata: {
            creationReason: metadata.reason || 'user_request',
            previousSessionId: currentId,
            speechConfig: metadata.speechConfig || {},
            ...metadata
          }
        },
        tusome: {
          feature: 'tusome',
          title: metadata.articleTitle || `Reading Article ${new Date().toLocaleTimeString()}`,
          prompt: 'Welcome to Tusome! Let\'s create your reading article.',
          metadata: {
            creationReason: metadata.reason || 'user_request',
            previousSessionId: currentId,
            readingConfig: metadata.readingConfig || {},
            articleMetadata: {
              category: metadata.category || null,
              difficulty: metadata.difficulty || 'medium',
              ageGroup: metadata.ageGroup || null,
              isArticleSession: true
            },
            ...metadata
          }
        }
      };

      const config = sessionConfig[feature];
      if (!config) {
        throw new Error(`Invalid feature: ${feature}`);
      }
      
      console.log(`🚀 [Session Creation] Creating new ${feature} session with config:`, config);
      
      const { data } = await api.post('/chats', config);
      
      // Update sessions list
      setSessions(prev => {
        const updated = [data, ...prev];
        console.log(`📝 [Session State] Updated ${feature} sessions:`, updated.filter(s => s.feature === feature).length);
        return updated;
      });
      
      // Set as active session
      setActiveSessionIds(prev => ({
        ...prev,
        [feature]: data.id
      }));
      
      // Clear validation cache for this feature
      const keysToDelete = Array.from(validationCache.current.keys()).filter(key => key.includes(feature));
      keysToDelete.forEach(key => validationCache.current.delete(key));
      
      console.log(`✅ [Session Management] Created new ${feature} session:`, data.id);
      return { ...data, created: true, reason: 'new_session_created' };
      
    } catch (error) {
      console.error(`❌ [Session Creation] Failed to create new ${feature} session:`, error);
      throw error; // Re-throw to allow parent components to handle
    }
  }, [activeSessionIds, checkSessionContent, sessions]);

  // ENHANCED: Intelligent session selection with state tracking
  const selectSession = useCallback((sessionId, selectedFeature) => {
    console.log(`🎯 [Session Selection] Selecting ${selectedFeature} session: ${sessionId}`);
    
    // Validate session exists
    const session = sessions.find(s => s.id === sessionId && s.feature === selectedFeature);
    if (!session) {
      console.warn(`⚠️ [Session Selection] Session ${sessionId} not found for feature ${selectedFeature}`);
      return false;
    }
    
    setActiveSessionIds(prev => ({
      ...prev,
      [selectedFeature]: sessionId
    }));
    
    // Clear validation cache for the selected session
    const cacheKey = `${sessionId}-${selectedFeature}`;
    validationCache.current.delete(cacheKey);
    
    console.log(`✅ [Session Selection] Successfully selected ${selectedFeature} session: ${sessionId}`);
    return true;
  }, [sessions]);

  // ENHANCED: Smart session deletion with automatic reassignment
  const deleteSession = useCallback(async (sessionId, selectedFeature) => {
    try {
      console.log(`🗑️ [Session Deletion] Deleting ${selectedFeature} session: ${sessionId}`);
      
      await api.delete(`/chats/${sessionId}`);
      
      // Remove from sessions list
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        console.log(`📝 [Session State] Remaining ${selectedFeature} sessions:`, updated.filter(s => s.feature === selectedFeature).length);
        return updated;
      });
      
      // Handle active session reassignment
      setActiveSessionIds(prev => {
        if (prev[selectedFeature] === sessionId) {
          const remainingSessions = sessions.filter(s => s.feature === selectedFeature && s.id !== sessionId);
          
          if (remainingSessions.length > 0) {
            const newActiveId = remainingSessions[0].id;
            console.log(`🔄 [Session Management] Reassigning ${selectedFeature} to session: ${newActiveId}`);
            return {
              ...prev,
              [selectedFeature]: newActiveId
            };
          } else {
            console.log(`📝 [Session Management] No remaining ${selectedFeature} sessions`);
            
            // For sema/tusome, create new session automatically
            if (selectedFeature !== 'chat') {
              setTimeout(() => {
                console.log(`🆕 [Auto Creation] Creating new ${selectedFeature} session after deletion`);
                createNewSession(selectedFeature, false, { reason: 'auto_creation_after_deletion' });
              }, 100);
            }
            
            return {
              ...prev,
              [selectedFeature]: null
            };
          }
        }
        return prev;
      });
      
      // Clear validation cache
      const keysToDelete = Array.from(validationCache.current.keys()).filter(key => key.startsWith(sessionId));
      keysToDelete.forEach(key => validationCache.current.delete(key));
      
      console.log(`✅ [Session Deletion] Successfully deleted session: ${sessionId}`);
      
    } catch (error) {
      console.error('❌ [Session Deletion] Failed to delete session:', error);
      throw error;
    }
  }, [sessions, createNewSession]);

  // Rename a session with validation
  const renameSession = useCallback(async (sessionId, newTitle) => {
    try {
      if (!newTitle || newTitle.trim().length === 0) {
        throw new Error('Session title cannot be empty');
      }
      
      console.log(`✏️ [Session Rename] Renaming session ${sessionId} to: ${newTitle}`);
      
      await api.put(`/chats/${sessionId}`, { title: newTitle.trim() });
      
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() } : s)
      );
      
      console.log(`✅ [Session Rename] Successfully renamed session: ${sessionId}`);
      
    } catch (error) {
      console.error('❌ [Session Rename] Failed to rename session:', error);
      throw error;
    }
  }, []);

  // ENHANCED: Ensure active session exists for feature (auto-create if needed)
  const ensureActiveSession = useCallback(async (feature, metadata = {}) => {
    try {
      const currentId = activeSessionIds[feature];
      
      // If we already have an active session, return it
      if (currentId) {
        const existingSession = sessions.find(s => s.id === currentId);
        if (existingSession) {
          console.log(`✅ [Session Ensure] Using existing ${feature} session: ${currentId}`);
          return existingSession;
        }
      }
      
      // Check if any sessions exist for this feature
      const featureSessions = sessions.filter(s => s.feature === feature);
      if (featureSessions.length > 0) {
        // Use the most recent session
        const recentSession = featureSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setActiveSessionIds(prev => ({
          ...prev,
          [feature]: recentSession.id
        }));
        console.log(`🔄 [Session Ensure] Activated existing ${feature} session: ${recentSession.id}`);
        return recentSession;
      }
      
      // No sessions exist, create one
      console.log(`🆕 [Session Ensure] No ${feature} sessions found, creating new one`);
      const newSession = await createNewSession(feature, false, {
        ...metadata,
        reason: 'auto_creation_on_feature_select'
      });
      
      return newSession;
    } catch (error) {
      console.error(`❌ [Session Ensure] Failed to ensure ${feature} session:`, error);
      throw error;
    }
  }, [activeSessionIds, sessions, createNewSession]);

  // ENHANCED: Fetch sessions with automatic session creation for new users
  const fetchSessions = useCallback(async () => {
    try {
      console.log('📥 [Session Fetch] Loading sessions from API...');
      
      const { data } = await api.get('/chats');
      const sessionsData = Array.isArray(data) ? data : [];
      
      console.log(`📊 [Session Fetch] Loaded ${sessionsData.length} total sessions`);
      
      setSessions(sessionsData);
      
      // Set initial active sessions (most recent per feature)
      const chatSessions = sessionsData.filter(c => c.feature === 'chat').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const semaSessions = sessionsData.filter(c => c.feature === 'sema').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const tusomeSessions = sessionsData.filter(c => c.feature === 'tusome').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setActiveSessionIds({
        chat: chatSessions.length ? chatSessions[0].id : null,
        sema: semaSessions.length ? semaSessions[0].id : null,
        tusome: tusomeSessions.length ? tusomeSessions[0].id : null
      });
      
      console.log('✅ [Session Fetch] Sessions loaded and active sessions set:', {
        chat: chatSessions.length ? chatSessions[0].id : 'none',
        sema: semaSessions.length ? semaSessions[0].id : 'none',
        tusome: tusomeSessions.length ? tusomeSessions[0].id : 'none'
      });
      
      // For new users with no sessions, create initial sessions for better UX
      if (sessionsData.length === 0) {
        console.log('🆕 [New User] Creating initial sessions for better UX...');
        
        try {
          // Create a chat session first (most commonly used)
          await createNewSession('chat', false, { 
            reason: 'initial_setup_for_new_user',
            isInitialSession: true 
          });
          console.log('✅ [New User] Created initial chat session');
        } catch (error) {
          console.warn('⚠️ [New User] Failed to create initial chat session:', error);
        }
      }
      
      return sessionsData;
    } catch (error) {
      console.error('❌ [Session Fetch] Failed to fetch sessions:', error);
      setSessions([]);
      return [];
    }
  }, [createNewSession]);

  // Clear validation cache
  const clearValidationCache = useCallback(() => {
    validationCache.current.clear();
    console.log('🧹 [Cache] Validation cache cleared');
  }, []);

  // ENHANCED: Article-specific helper functions
  const getArticleSessions = useCallback(() => {
    return Array.isArray(sessions) ? sessions.filter(s => s.feature === 'tusome') : [];
  }, [sessions]);

  const getArticleCount = useCallback(async () => {
    const tusomeSessions = getArticleSessions();
    let count = 0;
    
    for (const session of tusomeSessions) {
      try {
        const validation = await checkSessionContent(session.id, 'tusome');
        if (validation.hasContent) {
          count++;
        }
      } catch (error) {
        // Assume session has content if we can't validate
        count++;
      }
    }
    
    return count;
  }, [getArticleSessions, checkSessionContent]);

  const canCreateNewArticle = useCallback(async () => {
    const currentCount = await getArticleCount();
    return currentCount < 3;
  }, [getArticleCount]);

  const getArticleSessionById = useCallback((sessionId) => {
    return sessions.find(s => s.id === sessionId && s.feature === 'tusome');
  }, [sessions]);

  return {
    // State
    sessions,
    activeSessionIds,
    isValidating,
    
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
    fetchSessions,
    clearValidationCache,
    
    // Article-specific functions
    getArticleSessions,
    getArticleCount,
    canCreateNewArticle,
    getArticleSessionById,
    
    // New operations
    ensureActiveSession
  };
}; 