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
  platformName = "Voice Assistant"
}) {
  const { isDark } = useTheme();
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

  return (
    <div className={`chat-sidebar ${isDark ? 'dark' : ''}`} ref={sidebarRef}>
      <div className="chat-sidebar__header">
        <img src={logo} alt={platformName} className="chat-sidebar__logo" />
        <h1 className="chat-sidebar__title">{platformName}</h1>
      </div>

      <div className="chat-sidebar__content">
        <ChatList
          sessions={chatInstances}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
          onRenameChat={onRenameChat}
          onDeleteChat={onDeleteChat}
          selectedFeature={selectedFeature}
          scenarioKey={currentScenarioKey}
        />
      </div>

      <div className="chat-sidebar__footer">
        <button
          className="chat-sidebar__new-chat-btn"
          onClick={onNewChat}
        >
          + New {selectedFeature === 'sema' ? 'Speech' : selectedFeature === 'tusome' ? 'Reading' : 'Chat'} Session
        </button>
      </div>
    </div>
  );
}