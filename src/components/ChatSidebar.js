import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ChatList from './ChatList';
import logo from '../assets/images/logo.png';
import '../assets/styles/ChatSidebar.css';

const ChatSidebar = ({
  chatInstances,
  onSelectChat,
  onNewChat,
  selectedFeature,
  onSelectFeature,
  currentScenarioKey,
  hasCurrentChatContent,
  isMobile = window.innerWidth <= 768
}) => {
  const { isDark } = useTheme();
  const sidebarRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      if (isMobileView && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Prevent keyboard popup and handle mobile interactions
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.target.tagName === 'INPUT') {
        e.preventDefault();
      }
    };

    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('touchstart', handleTouchStart);
    }

    return () => {
      if (sidebarElement) {
        sidebarElement.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, []);

  return (
    <div 
      className={`chat-sidebar ${isDark ? 'dark' : ''} ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`} 
      ref={sidebarRef}
      data-theme={isDark ? 'dark' : 'light'}
    >
      {/* Toggle Button - Only show on desktop */}
      {!isMobile && (
        <button 
          className="chat-sidebar__toggle" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          )}
        </button>
      )}

      {/* Header */}
      <div className="chat-sidebar__header">
        <img src={logo} alt="SemaNami" className="chat-sidebar__logo" />
        {!isCollapsed && <h1 className="chat-sidebar__title">SemaNami</h1>}
      </div>

      {/* Navigation Buttons - Vertical */}
      <div className="chat-sidebar__nav">
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectFeature('chat')}
          title="Chat"
        >
          <span role="img" aria-label="chat">💬</span>
          {!isCollapsed && <span className="nav-btn-text">Chat</span>}
        </button>
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'sema' ? 'active' : ''}`}
          onClick={() => onSelectFeature('sema')}
          title="Sema"
        >
          <span role="img" aria-label="microphone">🎤</span>
          {!isCollapsed && <span className="nav-btn-text">Sema</span>}
        </button>
        <button
          className={`chat-sidebar__nav-btn ${selectedFeature === 'tusome' ? 'active' : ''}`}
          onClick={() => onSelectFeature('tusome')}
          title="Tusome"
        >
          <span role="img" aria-label="book">📚</span>
          {!isCollapsed && <span className="nav-btn-text">Tusome</span>}
        </button>

        {/* New Chat Button */}
        <button
          className="chat-sidebar__new-chat-btn"
          onClick={onNewChat}
          title={`New ${selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'} Session`}
        >
          <span>+</span>
          {!isCollapsed && (
            <span className="new-chat-btn-text">
              New {selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'} Session
            </span>
          )}
        </button>
      </div>

      {/* Chat List - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="chat-sidebar__content">
          {chatInstances.length > 0 ? (
            <ChatList
              sessions={chatInstances}
              onSelectChat={onSelectChat}
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
      )}
    </div>
  );
};

export default ChatSidebar;