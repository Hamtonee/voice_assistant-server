import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ChatList from './ChatList';
import logo from '../assets/images/logo.png';
import '../assets/styles/ChatSidebar.css';

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
  platformName = "SemaNami"
}) {
  const { isDark } = useTheme();
  const sidebarRef = useRef(null);

  // Prevent keyboard popup and handle mobile interactions
  useEffect(() => {
    const handleTouchStart = (e) => {
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

  return (
    <div className={`chat-sidebar ${isDark ? 'dark' : ''}`} ref={sidebarRef}>
      {/* Header */}
      <div className="chat-sidebar__header">
        <img src={logo} alt={platformName} className="chat-sidebar__logo" />
        <h1 className="chat-sidebar__title">{platformName}</h1>
      </div>

      {/* Navigation Section */}
      <div className="chat-sidebar__nav-section">
        {/* Navigation Buttons - Horizontal */}
        <div className="chat-sidebar__nav">
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'chat' ? 'active' : ''}`}
            onClick={() => onSelectFeature('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'sema' ? 'active' : ''}`}
            onClick={() => onSelectFeature('sema')}
          >
            🎤 Sema
          </button>
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'tusome' ? 'active' : ''}`}
            onClick={() => onSelectFeature('tusome')}
          >
            📚 Tusome
          </button>
        </div>

        {/* New Chat Button - Right below navigation */}
        <button
          className="chat-sidebar__new-chat-btn"
          onClick={onNewChat}
        >
          + New {selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'} Session
        </button>
      </div>

      {/* Chat List */}
      <div className="chat-sidebar__content">
        {chatInstances.length > 0 ? (
          <ChatList
            sessions={chatInstances}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
            onRenameChat={onRenameChat}
            onDeleteChat={onDeleteChat}
            selectedFeature={selectedFeature}
            scenarioKey={currentScenarioKey}
          />
        ) : (
          <div className="chat-list-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h8m-4-4v8m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No {selectedFeature === 'sema' ? 'speech' : selectedFeature === 'tusome' ? 'reading' : 'chat'} sessions yet</p>
            <span>Click the button above to start a new session</span>
          </div>
        )}
      </div>
    </div>
  );
}