import { useState, useEffect, useCallback } from 'react';

export const useResponsiveLayout = () => {
  // Viewport state
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

  // Sidebar state with intelligent defaults
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Responsive viewport management
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;

      setViewport({ width, height, isMobile });

      // Auto-manage sidebar based on screen size
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!isMobile && !sidebarOpen && width > 1024) {
        setSidebarOpen(true);
      }
    };
    
    // Debounced resize handler to prevent excessive updates
    const debouncedResize = (() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateViewport, 100);
      };
    })();
    
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [sidebarOpen]);

  // Sidebar body class management
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!viewport.isMobile || !sidebarOpen) return;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sidebar') && 
          !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [viewport.isMobile, sidebarOpen]);

  // Helper function to close sidebar on mobile after actions
  const closeSidebarOnMobile = useCallback(() => {
    if (viewport.isMobile) {
      setSidebarOpen(false);
    }
  }, [viewport.isMobile]);

  // Toggle sidebar state
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return {
    // State
    viewport,
    sidebarOpen,
    
    // Actions
    setSidebarOpen,
    toggleSidebar,
    closeSidebarOnMobile,
    
    // Computed values
    isMobile: viewport.isMobile,
    isTablet: viewport.width >= 768 && viewport.width <= 1024,
    isDesktop: viewport.width > 1024
  };
}; 