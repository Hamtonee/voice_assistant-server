import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../../hooks';
import ChatSidebar from '../ChatSidebar';
import FeatureHeader from '../FeatureHeader';
import './SemaNamiLayout.css';

const SemaNamiLayout = ({ 
  children, 
  sessions = [], 
  activeChatId = null,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  currentScenarioKey,
  hasCurrentChatContent,
  platformName = "SemaNami"
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px) and (min-width: 769px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always start open, then adjust based on screen size
  const [sidebarMode, setSidebarMode] = useState('normal'); // 'normal', 'collapsed', 'overlay'
  
  // Feature detection from current route
  const getSelectedFeature = useCallback(() => {
    const path = location.pathname;
    if (path.includes('/sema')) return 'sema';
    if (path.includes('/tusome')) return 'tusome';
    if (path.includes('/chat')) return 'chat';
    return 'chat'; // default
  }, [location.pathname]);
  
  const [selectedFeature, setSelectedFeature] = useState(getSelectedFeature());
  
  // Update feature when route changes
  useEffect(() => {
    setSelectedFeature(getSelectedFeature());
  }, [getSelectedFeature]);
  
  // Handle responsive sidebar behavior
  useEffect(() => {
    if (isMobile) {
      setSidebarMode('overlay');
      setSidebarOpen(false);
    } else if (isTablet) {
      setSidebarMode('normal');
      setSidebarOpen(true);
    } else {
      // Desktop should always have sidebar open
      setSidebarMode('normal');
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet, isDesktop]);
  
  // Sidebar actions
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar on route change in mobile
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [location.pathname, isMobile, closeSidebar]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isMobile, sidebarOpen, closeSidebar]);
  
  // Feature navigation
  const handleFeatureSelect = useCallback((feature) => {
    let path = '/chats';
    switch (feature) {
      case 'sema':
        path = '/chats/sema';
        break;
      case 'tusome':
        path = '/chats/tusome';
        break;
      case 'chat':
      default:
        path = '/chats';
        break;
    }
    navigate(path);
    
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [navigate, isMobile]);
  
  // Chat session management
  const handleNewChat = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    }
    
    // Close sidebar on mobile after action
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [onNewChat, isMobile]);
  
  const handleSelectChat = useCallback((chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    }
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [onSelectChat, isMobile]);
  
  // Get feature title and subtitle
  const getFeatureInfo = useCallback(() => {
    switch (selectedFeature) {
      case 'sema':
        return {
          title: 'Sema Speech Coach',
          subtitle: 'AI-powered speech analysis and coaching',
          icon: '🎤'
        };
      case 'tusome':
        return {
          title: 'Tusome Reading',
          subtitle: 'Interactive reading comprehension practice',
          icon: '📚'
        };
      case 'chat':
      default:
        return {
          title: 'Chat Roleplay',
          subtitle: currentScenarioKey ? 'Practice conversations with AI scenarios' : 'Select a scenario to start',
          icon: '💬'
        };
    }
  }, [selectedFeature, currentScenarioKey]);
  
  const featureInfo = getFeatureInfo();
  
  // Layout classes
  const layoutClasses = [
    'semanami-layout',
    `semanami-layout--${sidebarMode}`,
    sidebarOpen ? 'semanami-layout--sidebar-open' : 'semanami-layout--sidebar-closed',
    `semanami-layout--${selectedFeature}`,
    isMobile ? 'semanami-layout--mobile' : '',
    isTablet ? 'semanami-layout--tablet' : '',
    isDesktop ? 'semanami-layout--desktop' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div className={layoutClasses}>
      {/* Sidebar */}
      <aside className={`semanami-layout__sidebar ${sidebarOpen ? 'open' : ''}`}>
        <ChatSidebar
          selectedFeature={selectedFeature}
          onSelectFeature={handleFeatureSelect}
          onNewChat={handleNewChat}
          chatInstances={sessions}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onRenameChat={onRenameChat}
          onDeleteChat={onDeleteChat}
          currentScenarioKey={currentScenarioKey}
          hasCurrentChatContent={hasCurrentChatContent}
          platformName={platformName}
        />
      </aside>
      
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="semanami-layout__backdrop"
          onClick={closeSidebar}
          role="presentation"
        />
      )}
      
      {/* Main content area */}
      <main className="semanami-layout__main">
        {/* Feature header */}
        <header className="semanami-layout__header">
          <FeatureHeader
            title={featureInfo.title}
            subtitle={featureInfo.subtitle}
            icon={featureInfo.icon}
            selectedFeature={selectedFeature}
            showMenuButton={isMobile}
            onMenuClick={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        </header>
        
        {/* Feature content */}
        <div className="semanami-layout__content">
          {children}
        </div>
      </main>
    </div>
  );
};

SemaNamiLayout.propTypes = {
  children: PropTypes.node.isRequired,
  sessions: PropTypes.array,
  activeChatId: PropTypes.string,
  onSelectChat: PropTypes.func,
  onNewChat: PropTypes.func,
  onRenameChat: PropTypes.func,
  onDeleteChat: PropTypes.func,
  currentScenarioKey: PropTypes.string,
  hasCurrentChatContent: PropTypes.bool,
  platformName: PropTypes.string
};

export default SemaNamiLayout; 