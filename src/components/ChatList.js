import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../assets/styles/ChatList.css';
import { MoreVertical, MessageSquare, Mic, BookOpen, Clock } from 'lucide-react';

export default function ChatList({
  sessions = [], // Updated prop name for consistency
  activeChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  selectedFeature = 'chat', // Updated prop name
  scenarioKey = null,
  isLoading = false,
  className = ''
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const menuRef = useRef(null);
  const renameInputRef = useRef(null);

  // Close dropdown if you click outside
  useEffect(() => {
    const onClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Filter and sort sessions intelligently
  const processedSessions = useMemo(() => {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    let filtered = [];

    if (selectedFeature === 'chat') {
      if (scenarioKey) {
        // Inside a scenario: show all sessions for that scenario type
        filtered = safeSessions.filter(s => s.scenarioKey === scenarioKey);
        // Sort by createdAt ascending for sequential naming
        filtered = filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        // Add sequential naming
        filtered = filtered.map((s, idx) => ({
          ...s,
          title: s.title || `${s.scenarioLabel || 'Session'} ${idx + 1}`
        }));
      } else {
        // Scenario picker: show only the most recent instance of each scenario type
        const latestByScenario = {};
        safeSessions.forEach(s => {
          if (!s.scenarioKey) return;
          if (!latestByScenario[s.scenarioKey] || new Date(s.createdAt) > new Date(latestByScenario[s.scenarioKey].createdAt)) {
            latestByScenario[s.scenarioKey] = s;
          }
        });
        filtered = Object.values(latestByScenario);
        // Sort by createdAt descending (most recent first)
        filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Add clean naming
        filtered = filtered.map(s => ({
          ...s,
          title: s.title || s.scenarioLabel || 'Session'
        }));
      }
    } else {
      // For other features (sema, tusome):
      // Show all sessions for the feature if in feature view, or only the most recent if in picker
      if (scenarioKey) {
        // Not used for non-chat, but keep logic consistent
        filtered = safeSessions.filter(s => s.feature === selectedFeature);
        filtered = filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        filtered = filtered.map((s, idx) => ({
          ...s,
          title: s.title || `${getFeatureName()} ${idx + 1}`
        }));
      } else {
        // Show only the most recent session for the feature
        const latest = safeSessions.filter(s => s.feature === selectedFeature)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        filtered = latest ? [{
          ...latest,
          title: latest.title || getFeatureName()
        }] : [];
      }
    }

    // Sort active session first if present
    const activeSession = filtered.find(s => s.id === activeChatId);
    const otherSessions = filtered.filter(s => s.id !== activeChatId);
    return activeSession ? [activeSession, ...otherSessions] : otherSessions;
  }, [sessions, selectedFeature, scenarioKey, activeChatId]);

  // Get feature-specific icon
  const getFeatureIcon = () => {
    switch (selectedFeature) {
      case 'sema':
        return Mic;
      case 'tusome':
        return BookOpen;
      default:
        return MessageSquare;
    }
  };

  // Get feature-specific emoji
  const getFeatureEmoji = () => {
    switch (selectedFeature) {
      case 'sema':
        return '🎤';
      case 'tusome':
        return '📚';
      default:
        return '💬';
    }
  };

  // Get feature-specific name
  const getFeatureName = () => {
    switch (selectedFeature) {
      case 'sema':
        return 'Speech';
      case 'tusome':
        return 'Reading';
      default:
        return 'Chat';
    }
  };

  // Get feature-specific color
  const getFeatureColor = () => {
    switch (selectedFeature) {
      case 'sema':
        return '#00bfa5';
      case 'tusome':
        return '#ff9800';
      default:
        return '#007bff';
    }
  };

  // Format timestamp for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.abs(now - date) / (1000 * 60);
      return diffInMinutes < 1 ? 'Just now' : `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Handle session rename
  const handleRename = (session) => {
    setRenamingId(session.id);
    setNewTitle(session.title || '');
    setOpenMenuId(null);
  };

  // Confirm rename
  const confirmRename = async () => {
    if (newTitle.trim() && newTitle.trim() !== sessions.find(s => s.id === renamingId)?.title) {
      try {
        await onRenameChat(renamingId, newTitle.trim());
      } catch (error) {
        console.error('Failed to rename session:', error);
      }
    }
    setRenamingId(null);
    setNewTitle('');
  };

  // Cancel rename
  const cancelRename = () => {
    setRenamingId(null);
    setNewTitle('');
  };

  // Handle delete
  const handleDelete = async (session) => {
    const sessionType = getFeatureName().toLowerCase();
    const label = session.title || `Untitled ${sessionType} session`;
    
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      try {
        await onDeleteChat(session.id);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
    setOpenMenuId(null);
  };

  // Handle session selection
  const handleChatSelect = (sessionId) => {
    if (renamingId) return; // Don't select while renaming
    
    onSelectChat(sessionId);
    setOpenMenuId(null);
  };

  // Handle rename input key events
  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  // Get feature-specific preview text for sessions
  const getSessionPreview = (session) => {
    return {
      preview: session.lastMessage || 'No messages yet',
      timestamp: formatTime(session.updatedAt || session.createdAt)
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`chat-list loading ${className}`}>
        <div className="loading-placeholder">
          <div className="loading-icon">{getFeatureEmoji()}</div>
          <p>Loading {getFeatureName().toLowerCase()} sessions...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (processedSessions.length === 0) {
    return (
      <div className={`chat-list-empty ${className}`}>
        <div className="empty-icon">
          {getFeatureEmoji()}
        </div>
        <p>No {getFeatureName().toLowerCase()} sessions yet</p>
        <span>Start a conversation to see your history</span>
      </div>
    );
  }

  return (
    <div className={`chat-list ${className}`}>
      {processedSessions.map(session => {
        const isActive = session.id === activeChatId;
        const isRenaming = renamingId === session.id;
        const FeatureIcon = getFeatureIcon();
        
        return (
          <div
            key={session.id}
            className={`chat-item ${isActive ? 'active' : ''} ${isRenaming ? 'renaming' : ''}`}
          >
            <div
              className="chat-item-main"
              onClick={() => handleChatSelect(session.id)}
            >
              <div className="chat-item-avatar">
                <FeatureIcon 
                  size={20} 
                  color={isActive ? '#ffffff' : getFeatureColor()} 
                />
              </div>
              
              <div className="chat-item-details">
                <div className="chat-item-header">
                  {renamingId === session.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={handleRenameKeyDown}
                      className="chat-item-rename-input"
                      placeholder="Enter session name..."
                    />
                  ) : (
                    <h3 className="chat-item-name">
                      {session.title || `${getFeatureName()} Session`}
                    </h3>
                  )}
                  <div className="chat-item-meta">
                    <span className="chat-item-time">
                      <Clock size={10} />
                      {formatTime(session.updatedAt || session.createdAt)}
                    </span>
                  </div>
                </div>
                
                <p className="chat-item-preview">
                  {getSessionPreview(session).preview}
                </p>
                
                {/* Enhanced metadata for articles */}
                {selectedFeature === 'tusome' && session.metadata?.articleMetadata && (
                  <div className="article-session-meta">
                    {session.metadata.articleMetadata.category && (
                      <span className="article-category-tag">
                        {session.metadata.articleMetadata.category}
                      </span>
                    )}
                    {session.metadata.articleMetadata.difficulty && (
                      <span className="article-difficulty-tag">
                        {session.metadata.articleMetadata.difficulty}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Session stats */}
                <div className="session-stats">
                  <span className="message-count">
                    <MessageSquare size={8} />
                    {session.messageCount || 0}
                  </span>
                  {selectedFeature === 'tusome' && (
                    <span className="reading-indicator">
                      <BookOpen size={8} />
                      Article
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!isRenaming && (
              <div className="chat-item-menu" ref={openMenuId === session.id ? menuRef : null}>
                <button
                  className="menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === session.id ? null : session.id);
                  }}
                  aria-label="Session actions"
                  title="More actions"
                >
                  <MoreVertical size={16} />
                </button>
                
                {openMenuId === session.id && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item rename-btn"
                      onClick={() => handleRename(session)}
                    >
                      ✏️ Rename
                    </button>
                    <button
                      className="dropdown-item delete-btn"
                      onClick={() => handleDelete(session)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}