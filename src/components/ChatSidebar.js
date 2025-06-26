import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../assets/styles/ChatSidebar.css';
import { useTheme } from '../contexts/ThemeContext';
import ChatList from './ChatList';
import api from '../api';
import logo from '../assets/images/logo.png';

export default function ChatSidebar({
  selectedFeature,
  onSelectFeature,
  onNewChat,
  chatInstances = [],
  activeChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  currentScenarioKey,
  hasCurrentChatContent,
  usageSummary,
  platformName = "Voice Assistant"
}) {
  const { isDark } = useTheme();
  // State for usage tracking
  const [showUsageInfo, setShowUsageInfo] = useState(false);
  
  // ENHANCED: Session validation state
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState(null);
  
  const sidebarRef = useRef(null);

  // Prevent keyboard popup and handle mobile interactions
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Prevent focus on input elements when not intended
      if (e.target.tagName === 'INPUT' && e.target.classList.contains('chat-sidebar__search-input')) {
        e.preventDefault();
        e.target.blur();
      }
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('touchstart', handleTouchStart, { passive: false });
      
      return () => {
        sidebar.removeEventListener('touchstart', handleTouchStart);
      };
    }
  }, []);

  /*
    REMOVED: This useEffect was causing body scroll issues and contributing
    to the blurriness on mobile devices. Body scrolling should be handled
    by the parent layout's CSS, not by direct DOM manipulation here.
  */

  // ENHANCED: Comprehensive session content validation - wrapped in useCallback
  const checkCurrentSessionContent = useCallback(async () => {
    if (!activeChatId) {
      console.log('🔍 [Session Validation] No active chat ID');
      return { hasContent: false, isEmpty: true, details: 'No active session' };
    }
    
    setIsValidatingSession(true);
    
    try {
      console.log(`🔍 [Session Validation] Checking content for ${selectedFeature} session:`, activeChatId);
      
      let hasContent = false;
      let details = '';
      let interactionLevel = 'none';
      
      // Feature-specific validation logic
      switch (selectedFeature) {
        case 'chat':
          try {
            const { data } = await api.fetchChat(activeChatId);
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
            
            console.log(`💬 [Chat Validation] Result:`, {
              hasContent,
              userMessages: userMessages.length,
              totalMessages,
              interactionLevel
            });
          } catch (error) {
            console.log('📝 [Chat Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing chat';
          }
          break;
          
        case 'sema':
          try {
            const { data } = await api.fetchSpeechSession(activeChatId);
            const userMessages = data.messages?.filter(msg => msg.role === 'user') || [];
            const totalMessages = data.messages?.length || 0;
            
            // For speech coaching, we consider any recorded speech attempt as meaningful
            const hasRecordedSpeech = userMessages.some(msg => 
              msg.metadata?.speechAttempt || msg.text?.length > 10
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
            
            console.log(`🎤 [Speech Validation] Result:`, {
              hasContent,
              userMessages: userMessages.length,
              totalMessages,
              hasRecordedSpeech,
              interactionLevel
            });
          } catch (error) {
            console.log('📝 [Speech Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing speech session';
          }
          break;
          
        case 'tusome':
          try {
            const { data } = await api.fetchReadingSession(activeChatId);
            const userMessages = data.messages?.filter(msg => msg.role === 'user') || [];
            const totalMessages = data.messages?.length || 0;
            const hasArticle = !!data.articleData;
            const hasWizardProgress = data.wizardProgress?.hasSubmittedParams;
            const hasReadingProgress = data.readingProgress > 0.1; // Read at least 10%
            
            // For reading, consider wizard completion or article generation as meaningful
            hasContent = userMessages.length > 0 || hasArticle || hasWizardProgress || hasReadingProgress;
            details = `${userMessages.length} messages, article: ${hasArticle}, wizard: ${hasWizardProgress}`;
            
            if (hasArticle && (hasReadingProgress || userMessages.length > 0)) {
              interactionLevel = 'meaningful';
            } else if (hasArticle || hasWizardProgress) {
              interactionLevel = 'engaged';
            } else if (totalMessages > 0) {
              interactionLevel = 'started';
            }
            
            console.log(`📚 [Reading Validation] Result:`, {
              hasContent,
              userMessages: userMessages.length,
              totalMessages,
              hasArticle,
              hasWizardProgress,
              hasReadingProgress,
              interactionLevel
            });
          } catch (error) {
            console.log('📝 [Reading Validation] Session not found or error:', error.message);
            hasContent = false;
            details = 'Session not found or error accessing reading session';
          }
          break;
          
        default:
          console.log(`❓ [Session Validation] Unknown feature: ${selectedFeature}`);
          hasContent = false;
          details = `Unknown feature: ${selectedFeature}`;
      }
      
      const result = {
        hasContent,
        isEmpty: !hasContent,
        details,
        interactionLevel,
        feature: selectedFeature,
        sessionId: activeChatId,
        timestamp: Date.now()
      };
      
      setLastValidationResult(result);
      
      console.log(`✅ [Session Validation] Final result for ${selectedFeature}:`, result);
      
      return result;
    } catch (error) {
      console.error('❌ [Session Validation] Error during validation:', error);
      const errorResult = {
        hasContent: false,
        isEmpty: true,
        details: `Validation error: ${error.message}`,
        interactionLevel: 'error',
        feature: selectedFeature,
        sessionId: activeChatId,
        timestamp: Date.now()
      };
      
      setLastValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidatingSession(false);
    }
  }, [activeChatId, selectedFeature]);

  // ENHANCED: Smart new chat/session handler with comprehensive validation
  const handleNewChatWithValidation = useCallback(async () => {
    console.log(`🆕 [New Session Request] Feature: ${selectedFeature}, Active ID: ${activeChatId}`);
    
    // For speech coach and reading, always validate current session first
    if ((selectedFeature === 'sema' || selectedFeature === 'tusome') && activeChatId) {
      const validation = await checkCurrentSessionContent();
      
      console.log(`🔍 [New Session Logic] Current session validation:`, validation);
      
      if (!validation.hasContent) {
        // Current session is unused, don't create new one
        console.log('📝 [Session Management] Current session unused - not creating new session');
        
        // Just notify parent to refresh/reset current session instead of creating new
        if (typeof onNewChat === 'function') {
          onNewChat(false, { 
            reason: 'unused_session', 
            feature: selectedFeature,
            sessionId: activeChatId,
            details: validation.details
          });
        }
        return;
      } else {
        // Current session has meaningful content, create new one
        console.log(`🆕 [Session Management] Current ${selectedFeature} session has content - creating new session`);
        
        if (typeof onNewChat === 'function') {
          onNewChat(true, {
            reason: 'meaningful_content',
            feature: selectedFeature,
            previousSessionId: activeChatId,
            interactionLevel: validation.interactionLevel,
            details: validation.details
          });
        }
        return;
      }
    }
    
    // For chat feature, check if current chat has content
    if (selectedFeature === 'chat' && activeChatId) {
      const validation = await checkCurrentSessionContent();
      
      console.log(`🔍 [New Chat Logic] Current chat validation:`, validation);
      
      if (!validation.hasContent) {
        // Current chat is empty, don't create new one
        console.log('📝 [Chat Management] Current chat is empty, not creating new chat instance');
        
        // Just navigate to scenario picker instead
        if (typeof onNewChat === 'function') {
          onNewChat(false, {
            reason: 'empty_chat',
            feature: selectedFeature,
            sessionId: activeChatId,
            details: validation.details
          });
        }
        return;
      }
    }

    // Current session/chat has content or no active session, create new one
    console.log(`🆕 [Session Management] Creating new ${selectedFeature} instance`);
    
    if (typeof onNewChat === 'function') {
      onNewChat(true, {
        reason: 'standard_new_session',
        feature: selectedFeature,
        previousSessionId: activeChatId || null
      });
    }
  }, [selectedFeature, activeChatId, checkCurrentSessionContent, onNewChat]);

  // Handle feature selection with keyboard blur and session context
  const handleFeatureSelect = useCallback((feature) => {
    console.log(`🚀 [SIDEBAR] Feature button clicked! From ${selectedFeature} to ${feature}`);
    console.log(`🚀 [SIDEBAR] onSelectFeature type:`, typeof onSelectFeature);
    console.log(`🚀 [SIDEBAR] onSelectFeature function:`, onSelectFeature);
    console.log(`🚀 [SIDEBAR] onSelectFeature.toString():`, onSelectFeature.toString());
    
    // Blur any focused elements to prevent keyboard issues
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Reset validation state when switching features
    setLastValidationResult(null);
    
    // CRITICAL FIX: Add safety check for function
    if (typeof onSelectFeature !== 'function') {
      console.error(`❌ [SIDEBAR] onSelectFeature is not a function! Type: ${typeof onSelectFeature}`);
      return;
    }
    
    console.log(`🚀 [SIDEBAR] About to call onSelectFeature("${feature}")`);
    try {
      onSelectFeature(feature);
      console.log(`🚀 [SIDEBAR] onSelectFeature("${feature}") called successfully`);
    } catch (error) {
      console.error(`❌ [SIDEBAR] Error calling onSelectFeature:`, error);
    }
  }, [selectedFeature, onSelectFeature]);

  // Get feature-specific sessions
  const sessions = selectedFeature === 'chat'
    ? (Array.isArray(chatInstances) ? chatInstances.filter(c => !currentScenarioKey || c.scenarioKey === currentScenarioKey) : [])
    : (Array.isArray(chatInstances) ? chatInstances : []);

  // Pull the active session to the top, then sort the rest by createdAt desc
  const activeSession = Array.isArray(sessions) ? sessions.find(c => c.id === activeChatId) : null;
  const otherSessions = Array.isArray(sessions) 
    ? sessions
        .filter(c => c.id !== activeChatId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];
  const orderedSessions = activeSession ? [activeSession, ...otherSessions] : otherSessions;

  // Get feature display names
  const getFeatureDisplayName = useCallback((feature) => {
    switch (feature) {
      case 'chat': return 'Chat';
      case 'sema': return 'Sema';
      case 'tusome': return 'Tusome';
      default: return feature.charAt(0).toUpperCase() + feature.slice(1);
    }
  }, []);

  // Get new chat button text based on feature
  const getNewChatButtonText = useCallback(() => {
    switch (selectedFeature) {
      case 'chat': return 'New Chat';
      case 'sema': return 'New Sema';
      case 'tusome': return 'New Tusome';
      default: return 'New Chat';
    }
  }, [selectedFeature]);

  // ENHANCED: Get smart button text based on session state
  const getSmartButtonText = useCallback(() => {
    const baseText = getNewChatButtonText();
    
    if (isValidatingSession) {
      return 'Checking...';
    }
    
    if (lastValidationResult && activeChatId) {
      if (lastValidationResult.isEmpty) {
        return `Continue ${getFeatureDisplayName(selectedFeature)}`;
      } else {
        return `${baseText} (New Session)`;
      }
    }
    
    return baseText;
  }, [isValidatingSession, lastValidationResult, activeChatId, getNewChatButtonText, getFeatureDisplayName, selectedFeature]);

  // Usage info component
  const renderUsageInfo = useCallback(() => {
    // Implementation of renderUsageInfo
  }, []);

  return (
    <div className={`chat-sidebar ${isDark ? 'dark-theme' : 'light-theme'}`} ref={sidebarRef}>
      {/* Platform header with logo */}
      <div className="chat-sidebar__header">
        <img src={logo} alt={platformName} className="chat-sidebar__logo" />
        <h1>{platformName}</h1>
      </div>

      {/* Navigation buttons */}
      <div className="chat-sidebar__nav">
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'chat' ? 'active' : ''}`}
          onClick={() => handleFeatureSelect('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'sema' ? 'active' : ''}`}
          onClick={() => handleFeatureSelect('sema')}
        >
          🎤 Sema
        </button>
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'tusome' ? 'active' : ''}`}
          onClick={() => handleFeatureSelect('tusome')}
        >
          📚 Tusome
        </button>
      </div>

      {/* Usage info section */}
      {usageSummary && (
        <div className={`usage-info ${usageSummary.isNearLimit ? 'warning' : ''}`}>
          <div className="usage-header" onClick={() => setShowUsageInfo(!showUsageInfo)}>
            <span className="usage-icon">📊</span>
            <span className="usage-title">Usage</span>
            <span className="usage-toggle">{showUsageInfo ? '▼' : '▶'}</span>
          </div>
          {showUsageInfo && (
            <div className="usage-details">
              <div className="usage-bar">
                <div 
                  className="usage-fill" 
                  style={{ 
                    width: `${(usageSummary.used / usageSummary.limit) * 100}%`,
                    backgroundColor: usageSummary.isNearLimit ? '#f59e0b' : '#059669'
                  }}
                />
              </div>
              <div className="usage-text">
                <span className={usageSummary.isNearLimit ? 'warning' : 'remaining'}>
                  {usageSummary.used} / {usageSummary.limit} used
                </span>
              </div>
              {usageSummary.isNearLimit && (
                <div className="usage-warning">
                  Approaching usage limit
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New chat button */}
      <div className="chat-sidebar__new-chat-row">
        <button 
          className="chat-sidebar__new-chat-btn"
          onClick={handleNewChatWithValidation}
          disabled={isValidatingSession}
        >
          {getSmartButtonText()}
        </button>
      </div>

      {/* Chat list */}
      <div className="chat-sidebar__list">
        <ChatList
          sessions={orderedSessions}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          onRenameChat={onRenameChat}
          onDeleteChat={onDeleteChat}
          selectedFeature={selectedFeature}
          scenarioKey={currentScenarioKey}
          isLoading={isValidatingSession}
          className="sidebar-chat-list"
        />
      </div>
    </div>
  );
}