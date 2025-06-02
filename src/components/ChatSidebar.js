import React, { useState, useEffect, useRef } from 'react';
import '../assets/styles/ChatSidebar.css';
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
  usageSummary
}) {
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

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }
  }, []);

  // ENHANCED: Comprehensive session content validation
  const checkCurrentSessionContent = async () => {
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
  };

  // ENHANCED: Smart new chat/session handler with comprehensive validation
  const handleNewChatWithValidation = async () => {
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
  };

  // Handle feature selection with keyboard blur and session context
  const handleFeatureSelect = (feature) => {
    console.log(`🔄 [Feature Selection] Switching from ${selectedFeature} to ${feature}`);
    
    // Blur any focused elements to prevent keyboard issues
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Reset validation state when switching features
    setLastValidationResult(null);
    
    onSelectFeature(feature);
  };

  // Get feature-specific sessions
  const sessions = selectedFeature === 'chat'
    ? chatInstances.filter(c => !currentScenarioKey || c.scenarioKey === currentScenarioKey)
    : chatInstances;

  // Pull the active session to the top, then sort the rest by createdAt desc
  const activeSession = sessions.find(c => c.id === activeChatId);
  const otherSessions = sessions
    .filter(c => c.id !== activeChatId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const orderedSessions = activeSession ? [activeSession, ...otherSessions] : otherSessions;

  // Get feature display names
  const getFeatureDisplayName = (feature) => {
    switch (feature) {
      case 'chat': return 'Chat';
      case 'sema': return 'Sema';
      case 'tusome': return 'Tusome';
      default: return feature.charAt(0).toUpperCase() + feature.slice(1);
    }
  };

  // Get new chat button text based on feature
  const getNewChatButtonText = () => {
    switch (selectedFeature) {
      case 'chat': return 'New Chat';
      case 'sema': return 'New Sema';
      case 'tusome': return 'New Tusome';
      default: return 'New Chat';
    }
  };

  // ENHANCED: Get smart button text based on session state
  const getSmartButtonText = () => {
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
  };

  // Usage info component
  const renderUsageInfo = () => {
    if (!usageSummary) return null;

    const getServiceKey = () => {
      switch (selectedFeature) {
        case 'chat': return 'chat_roleplay';
        case 'sema': return 'speech_coach';
        case 'tusome': return 'reading_article';
        default: return null;
      }
    };

    const serviceKey = getServiceKey();
    if (!serviceKey || !usageSummary[serviceKey]) return null;

    const usage = usageSummary[serviceKey];
    const isNearLimit = usage.remaining <= 3;

    const handleUsageToggle = () => {
      // Blur any focused elements before toggling
      if (document.activeElement) {
        document.activeElement.blur();
      }
      setShowUsageInfo(!showUsageInfo);
    };

    return (
      <div className={`usage-info ${isNearLimit ? 'warning' : ''}`}>
        <div 
          className="usage-header" 
          onClick={handleUsageToggle}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleUsageToggle();
            }
          }}
        >
          <span className="usage-icon">📊</span>
          <span className="usage-title">Daily Usage</span>
          <span className="usage-toggle">{showUsageInfo ? '▼' : '▶'}</span>
        </div>
        
        {showUsageInfo && (
          <div className="usage-details">
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ 
                  width: `${(usage.used / usage.daily_limit) * 100}%`,
                  background: isNearLimit ? '#f59e0b' : '#059669'
                }}
              />
            </div>
            <div className="usage-text">
              {usage.used}/{usage.daily_limit} used today
              {usage.remaining > 0 && (
                <span className={isNearLimit ? 'warning' : 'remaining'}>
                  {' '}({usage.remaining} remaining)
                </span>
              )}
            </div>
            {isNearLimit && (
              <div className="usage-warning">
                ⚠️ Approaching daily limit
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Auto-validate current session when feature or active chat changes
  useEffect(() => {
    if (activeChatId && (selectedFeature === 'sema' || selectedFeature === 'tusome')) {
      // Debounce validation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        checkCurrentSessionContent();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear validation result for chat feature or when no active session
      setLastValidationResult(null);
    }
  }, [activeChatId, selectedFeature]);

  return (
    <aside
      ref={sidebarRef}
      className="chat-sidebar"
    >
      {/* ─── New Chat Button ─── */}
      <div className="chat-sidebar__new-chat-row">
        <button
          className={`chat-sidebar__new-chat-btn ${isValidatingSession ? 'validating' : ''}`}
          onClick={handleNewChatWithValidation}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={isValidatingSession}
          title={
            lastValidationResult 
              ? (lastValidationResult.isEmpty 
                  ? `Continue current ${getFeatureDisplayName(selectedFeature).toLowerCase()} session`
                  : `Create new ${getFeatureDisplayName(selectedFeature).toLowerCase()} session`)
              : `Create new ${getFeatureDisplayName(selectedFeature).toLowerCase()}`
          }
        >
          <img
            src="https://img.icons8.com/material-rounded/24/000000/plus.png"
            alt="New Chat"
            style={{
              opacity: isValidatingSession ? 0.5 : 1,
              transform: isValidatingSession ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'all 0.3s ease'
            }}
          />
          <span>{getSmartButtonText()}</span>
        </button>
      </div>

      {/* ─── App Title with Logo ─── */}
      <div className="chat-sidebar__header">
        <img 
          src={logo} 
          alt="SemaNami Logo" 
          className="chat-sidebar__logo"
        />
        <h1>SemaNami</h1>
      </div>

      {/* ─── Feature Navigation Buttons ─── */}
      <nav className="chat-sidebar__nav">
        {['chat', 'sema', 'tusome'].map(feat => (
          <button
            key={feat}
            className={`chat-sidebar__nav-btn ${
              selectedFeature === feat ? 'active' : ''
            }`}
            onClick={() => handleFeatureSelect(feat)}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {getFeatureDisplayName(feat)}
          </button>
        ))}
      </nav>

      {/* ─── Usage Information ─── */}
      {renderUsageInfo()}

      {/* ─── Session List ─── */}
      <div className="chat-sidebar__list">
        <ChatList
          chatInstances={orderedSessions}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          onRenameChat={onRenameChat}
          onDeleteChat={onDeleteChat}
          feature={selectedFeature}
          scenarioKey={currentScenarioKey}
        />
        {orderedSessions.length === 0 && (
          <div className="chat-sidebar__no-sessions">
            <div className="no-sessions-icon">
              {selectedFeature === 'chat' ? '💬' : selectedFeature === 'sema' ? '🎤' : '📚'}
            </div>
            <div className="no-sessions-text">
              No {getFeatureDisplayName(selectedFeature).toLowerCase()} sessions found.
            </div>
            <div className="no-sessions-hint">
              Click "{getNewChatButtonText()}" to get started!
            </div>
          </div>
        )}
      </div>

      {/* ─── Enhanced CSS for new features ─── */}
      <style jsx>{`
        .chat-sidebar__new-chat-btn.validating {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .chat-sidebar__new-chat-btn.validating img {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Enhanced usage info styles */
        .usage-info.warning {
          border-left: 3px solid #f59e0b;
        }

        .usage-warning {
          font-size: 11px;
          color: #92400e;
          font-weight: 600;
          margin-top: 4px;
        }

        .usage-text .warning {
          color: #f59e0b;
          font-weight: 600;
        }

        .usage-text .remaining {
          color: #059669;
          font-weight: 500;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .usage-info {
            margin: 6px 12px;
            padding: 6px 10px;
          }

          .usage-text {
            font-size: 11px;
          }
        }
      `}</style>
    </aside>
  );
}