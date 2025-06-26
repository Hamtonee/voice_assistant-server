import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../assets/styles/ChatList.css';
import { MoreVertical, MessageSquare, Mic, BookOpen, Calendar, Clock, User } from 'lucide-react';

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
    // Defensive check: ensure sessions is always an array
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    
    // Filter sessions based on feature and scenario
    let filtered = safeSessions;
    
    if (selectedFeature === 'chat' && scenarioKey) {
      filtered = safeSessions.filter(s => s.scenarioKey === scenarioKey);
    } else if (selectedFeature !== 'chat') {
      filtered = safeSessions.filter(s => s.feature === selectedFeature);
    }
    
    // Sort sessions - active chat first, then by date
    const activeSession = filtered.find(s => s.id === activeChatId);
    const otherSessions = filtered
      .filter(s => s.id !== activeChatId)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA; // Most recent first
      });
    
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

  // Render session status indicator
  const renderSessionStatus = (session) => {
    if (session.resumed) {
      return (
        <span className="session-status resumed" title="Resumed empty session">
          🔄
        </span>
      );
    }
    
    if (session.metadata?.interactionLevel === 'meaningful') {
      return (
        <span className="session-status meaningful" title="Active session">
          ✅
        </span>
      );
    }
    
    if (session.metadata?.interactionLevel === 'engaged') {
      return (
        <span className="session-status engaged" title="In progress">
          ⚡
        </span>
      );
    }
    
    return null;
  };

  // Get feature-specific preview text for sessions
  const getSessionPreview = (session) => {
    if (!session) return '';
    
    switch (selectedFeature) {
      case 'tusome':
        // For articles, show category and difficulty or article excerpt
        if (session.metadata?.articleMetadata) {
          const meta = session.metadata.articleMetadata;
          const parts = [];
          if (meta.category) parts.push(meta.category);
          if (meta.difficulty) parts.push(meta.difficulty.charAt(0).toUpperCase() + meta.difficulty.slice(1));
          if (meta.ageGroup) parts.push(meta.ageGroup);
          return parts.join(' • ');
        }
        return 'Reading Article';
        
      case 'sema':
        // For speech sessions, show speech configuration or practice type
        if (session.metadata?.speechConfig) {
          return 'Speech Practice Session';
        }
        return 'Speech Coaching';
        
      default:
        // For chat, show scenario or last message
        if (session.scenarioKey) {
          return `${session.scenarioKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Roleplay`;
        }
        return 'Chat Conversation';
    }
  };

  // Get session status based on content and interaction
  const getSessionStatus = (session) => {
    // Enhanced status detection for articles
    if (selectedFeature === 'tusome') {
      if (session.metadata?.articleMetadata) {
        return {
          icon: '📚',
          text: 'Article Ready',
          level: 'meaningful'
        };
      } else {
        return {
          icon: '📝',
          text: 'In Progress',
          level: 'started'
        };
      }
    }
    
    // Default status logic for other features
    const messageCount = session.messageCount || 0;
    
    if (messageCount === 0) {
      return {
        icon: '🆕',
        text: 'New',
        level: 'none'
      };
    } else if (messageCount >= 5) {
      return {
        icon: '✅',
        text: 'Active',
        level: 'meaningful'
      };
    } else {
      return {
        icon: '⚡',
        text: 'Started',
        level: 'engaged'
      };
    }
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
        const title = session.title || 'Untitled Session';
        const timeStr = formatTime(session.updatedAt || session.createdAt);
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
                    {renderSessionStatus(session)}
                  </div>
                </div>
                
                <p className="chat-item-preview">
                  {getSessionPreview(session)}
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