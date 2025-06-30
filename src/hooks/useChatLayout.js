import { useState, useEffect, useCallback } from 'react';
import { useResponsiveLayout } from './useResponsiveLayout';

export const useChatLayout = (initialSession = null) => {
  const [activeSession, setActiveSession] = useState(initialSession);
  const [showRoleplayPicker, setShowRoleplayPicker] = useState(!initialSession);
  const [chatListVisible, setChatListVisible] = useState(true);
  const { isMobile, isTablet, layout } = useResponsiveLayout();

  // Auto-hide chat list on mobile when session is active
  useEffect(() => {
    if (isMobile && activeSession) {
      setChatListVisible(false);
    } else if (!isMobile) {
      setChatListVisible(true);
    }
  }, [isMobile, activeSession]);

  // Handle session selection
  const selectSession = useCallback((session) => {
    setActiveSession(session);
    setShowRoleplayPicker(false);
    if (isMobile) {
      setChatListVisible(false);
    }
  }, [isMobile]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveSession(null);
    setShowRoleplayPicker(true);
    if (!isMobile) {
      setChatListVisible(true);
    }
  }, [isMobile]);

  // Toggle chat list visibility
  const toggleChatList = useCallback(() => {
    setChatListVisible(prev => !prev);
  }, []);

  // Calculate layout dimensions
  const dimensions = {
    chatList: {
      width: chatListVisible ? layout.sidebarWidth : layout.sidebarCollapsedWidth,
      height: '100%',
      position: isMobile ? 'fixed' : 'relative',
      left: chatListVisible ? 0 : -layout.sidebarWidth,
      zIndex: 20,
    },
    mainContent: {
      marginLeft: isMobile ? 0 : (chatListVisible ? layout.sidebarWidth : layout.sidebarCollapsedWidth),
      width: isMobile ? '100%' : `calc(100% - ${chatListVisible ? layout.sidebarWidth : layout.sidebarCollapsedWidth}px)`,
      height: '100%',
      transition: 'margin-left 0.3s ease, width 0.3s ease',
    },
    overlay: {
      display: isMobile && chatListVisible ? 'block' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 15,
    },
  };

  return {
    // State
    activeSession,
    showRoleplayPicker,
    chatListVisible,
    
    // Actions
    selectSession,
    startNewChat,
    toggleChatList,
    
    // Layout
    dimensions,
    
    // Responsive helpers
    isMobile,
    isTablet,
  };
};

export default useChatLayout; 