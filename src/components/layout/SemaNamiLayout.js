import React, { useState, useEffect } from 'react';
import ChatSidebar from '../ChatSidebar';
import FeatureHeader from '../FeatureHeader';
import './SemaNamiLayout.css';

const SemaNamiLayout = ({
  sessions = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  currentScenarioKey,
  hasCurrentChatContent,
  platformName = "SemaNami",
  selectedFeature = 'chat',
  onSelectFeature,
  currentScenario = null,
  selectedVoice = null,
  onVoiceChange = () => {},
  onChangeScenario = () => {},
  onVoiceSettings = () => {},
  articleTitle = '',
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      setIsMobile(mobile);
      
      // Auto-manage sidebar state
      if (mobile) {
        // Mobile: start closed
        setSidebarOpen(false);
      } else if (width > 1312) {
        // Desktop: auto-open for better UX
        setSidebarOpen(true);
      }
      // Tablet (769-1312): keep current state
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div 
      className={`sema-layout ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      data-theme={document.documentElement.getAttribute('data-theme')}
    >
      {/* Sidebar */}
      <ChatSidebar
        chatInstances={sessions}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
        onRenameChat={onRenameChat}
        onDeleteChat={onDeleteChat}
        selectedFeature={selectedFeature}
        onSelectFeature={onSelectFeature}
        currentScenarioKey={currentScenarioKey}
        hasCurrentChatContent={hasCurrentChatContent}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      {/* Feature Header */}
      <FeatureHeader
        selectedFeature={selectedFeature}
        isMobile={isMobile}
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        currentScenario={currentScenario}
        selectedVoice={selectedVoice}
        onVoiceChange={onVoiceChange}
        onChangeScenario={onChangeScenario}
        onVoiceSettings={onVoiceSettings}
        articleTitle={articleTitle}
      />

      {/* Main Content Area */}
      <main className="sema-layout__main">
        {children}
      </main>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="sema-layout__overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SemaNamiLayout; 