import React, { useState, useEffect } from 'react';
import ChatSidebar from '../ChatSidebar';
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
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize - YouTube behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      setIsMobile(mobile);
      
      // Initialize sidebar state based on screen size
      if (mobile) {
        // Mobile: start closed to show mini sidebar
        if (sidebarOpen) {
          // Keep overlay open if user opened it
        }
      } else if (width > 1312) {
        // Desktop: auto-open for better UX
        if (!sidebarOpen) {
          setSidebarOpen(true);
        }
      }
      // Tablet (769-1312): keep current state, always shows mini
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`sema-layout ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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