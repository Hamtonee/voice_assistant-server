import React, { useState, useEffect, useRef } from 'react';
import '../assets/styles/ChatList.css';
import { MoreVertical, MessageSquare, Mic, BookOpen, Calendar } from 'lucide-react';

export default function ChatList({
  chatInstances,
  activeChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  feature,
  scenarioKey,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

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

  // Filter items based on feature and scenario
  const items = React.useMemo(() => {
    // Defensive check: ensure chatInstances is always an array
    const safeInstances = Array.isArray(chatInstances) ? chatInstances : [];
    
    if (feature === 'chat' && scenarioKey) {
      return safeInstances.filter(c => c.scenarioKey === scenarioKey);
    }
    return safeInstances;
  }, [chatInstances, feature, scenarioKey]);

  // Sort items - active chat first, then by date
  const sortedItems = React.useMemo(() => {
    const activeChat = Array.isArray(items) ? items.find(c => c.id === activeChatId) : null;
    const otherChats = Array.isArray(items) 
      ? items
          .filter(c => c.id !== activeChatId)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.updatedAt || 0);
            const dateB = new Date(b.createdAt || b.updatedAt || 0);
            return dateB - dateA; // Most recent first
          })
      : [];
    
    return activeChat ? [activeChat, ...otherChats] : otherChats;
  }, [items, activeChatId]);

  const getFeatureIcon = () => {
    switch (feature) {
      case 'sema':
        return Mic;
      case 'tusome':
        return BookOpen;
      default:
        return MessageSquare;
    }
  };

  const getFeatureColor = () => {
    switch (feature) {
      case 'sema':
        return '#00bfa5';
      case 'tusome':
        return '#ff9800';
      default:
        return '#007bff';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], {
        weekday: 'short',
      });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleRename = chat => {
    const newName = window.prompt('Enter new chat name:', chat.title || '');
    if (newName != null && newName.trim() && newName !== chat.title) {
      onRenameChat(chat.id, newName.trim());
    }
    setOpenMenuId(null);
  };

  const handleDelete = chat => {
    const label = chat.title || 'Untitled Session';
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      onDeleteChat(chat.id);
    }
    setOpenMenuId(null);
  };

  const handleChatSelect = (chatId) => {
    onSelectChat(chatId);
    // Auto-close menu if it's open
    setOpenMenuId(null);
  };

  if (sortedItems.length === 0) {
    return (
      <div className="chat-list-empty">
        <div className="empty-icon">
          {React.createElement(getFeatureIcon(), { 
            size: 32, 
            color: getFeatureColor() 
          })}
        </div>
        <p>No sessions yet</p>
        <span>Start a conversation to see your history</span>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {sortedItems.map(chat => {
        const isActive = chat.id === activeChatId;
        const title = chat.title || 'Untitled Session';
        const timeStr = formatTime(chat.createdAt || chat.updatedAt);
        const FeatureIcon = getFeatureIcon();
        
        return (
          <div
            key={chat.id}
            className={`chat-item ${isActive ? 'active' : ''}`}
          >
            <div
              className="chat-item-main"
              onClick={() => handleChatSelect(chat.id)}
            >
              <div className="chat-item-avatar">
                <FeatureIcon 
                  size={20} 
                  color={isActive ? '#ffffff' : getFeatureColor()} 
                />
              </div>
              
              <div className="chat-item-details">
                <div className="chat-item-header">
                  <span className="chat-item-name">{title}</span>
                  {timeStr && (
                    <span className="chat-item-time">
                      <Calendar size={12} />
                      {timeStr}
                    </span>
                  )}
                </div>
                
                {chat.lastMessage && (
                  <p className="chat-item-preview">
                    {chat.lastMessage.length > 60 
                      ? `${chat.lastMessage.substring(0, 60)}...`
                      : chat.lastMessage
                    }
                  </p>
                )}
                
                {scenarioKey && chat.scenarioLabel && (
                  <span className="scenario-badge">
                    {chat.scenarioLabel}
                  </span>
                )}
              </div>
            </div>
            
            <div className="chat-item-menu" ref={openMenuId === chat.id ? menuRef : null}>
              <button
                className="menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                }}
                aria-label="More actions"
              >
                <MoreVertical size={16} />
              </button>
              
              {openMenuId === chat.id && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => handleRename(chat)}
                  >
                    Rename
                  </button>
                  <button
                    className="dropdown-item delete-item"
                    onClick={() => handleDelete(chat)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}