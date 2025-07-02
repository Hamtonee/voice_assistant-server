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
  isOpen = true,
  onToggle,
  isMobile = false
}) => {
  const { isDark } = useTheme();
  const sidebarRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMiniSidebar, setIsMiniSidebar] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width <= 768) {
        // Mobile: No mini sidebar, just show/hide
        setIsMiniSidebar(false);
        setIsCollapsed(!isOpen);
      } else if (width <= 1312) {
        // Tablet: Always mini sidebar
        setIsMiniSidebar(true);
        setIsCollapsed(false);
      } else {
        // Desktop: Full or mini based on isOpen
        setIsMiniSidebar(!isOpen);
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Toggle sidebar
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const sidebarClass = `chat-sidebar ${isDark ? 'dark' : ''} 
    ${isCollapsed ? 'collapsed' : ''} 
    ${isMobile ? 'mobile' : ''} 
    ${isMiniSidebar ? 'mini' : ''}`.trim();

  // Only show floating hamburger on mobile when collapsed
  const showFloatingHamburger = isMobile && isCollapsed;

  return (
    <>
      {/* Sidebar */}
      <div 
        className={sidebarClass}
        ref={sidebarRef}
        data-theme={isDark ? 'dark' : 'light'}
      >
        {/* Header */}
        <div className="chat-sidebar__header">
          {/* Logo Container */}
          {!isMiniSidebar && !isCollapsed && (
            <div className="chat-sidebar__logo-container">
              <img src={logo} alt="SemaNami" className="chat-sidebar__logo" />
              <h1 className="chat-sidebar__title">SemaNami</h1>
              {/* Hamburger Menu - Show in mobile when sidebar is open */}
              {isMobile && (
                <button 
                  className="chat-sidebar__hamburger"
                  onClick={handleToggle}
                  aria-label="Close sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Hamburger Menu - Show in desktop/tablet when sidebar is open */}
          {!isMobile && isOpen && (
            <button 
              className="chat-sidebar__hamburger"
              onClick={handleToggle}
              aria-label="Close sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="chat-sidebar__nav">
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'chat' ? 'active' : ''}`}
            onClick={() => onSelectFeature('chat')}
            title="Chat"
          >
            <span role="img" aria-label="chat" className="nav-icon">💬</span>
            {!isMiniSidebar && <span className="nav-btn-text">Chat</span>}
          </button>
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'sema' ? 'active' : ''}`}
            onClick={() => onSelectFeature('sema')}
            title="Sema"
          >
            <span role="img" aria-label="microphone" className="nav-icon">🎤</span>
            {!isMiniSidebar && <span className="nav-btn-text">Sema</span>}
          </button>
          <button
            className={`chat-sidebar__nav-btn ${selectedFeature === 'tusome' ? 'active' : ''}`}
            onClick={() => onSelectFeature('tusome')}
            title="Tusome"
          >
            <span role="img" aria-label="book" className="nav-icon">📚</span>
            {!isMiniSidebar && <span className="nav-btn-text">Tusome</span>}
          </button>

          {/* New Chat Button */}
          <button
            className="chat-sidebar__new-chat-btn"
            onClick={onNewChat}
            title={`New ${selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'} Session`}
          >
            <span className="nav-icon">+</span>
            {!isMiniSidebar && (
              <span className="new-chat-btn-text">
                New {selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'}
              </span>
            )}
          </button>
        </div>

        {/* Chat List */}
        {!isMiniSidebar && !isCollapsed && (
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
    </>
  );
};

export default ChatSidebar;