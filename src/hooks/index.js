// src/hooks/index.js
import { useState, useEffect } from 'react';

export { useSessionManagement } from './useSessionManagement';
export { useResponsiveLayout } from './useResponsiveLayout';
export { useFeatureNavigation } from './useFeatureNavigation';
export { useSessionHeartbeat } from './useSessionHeartbeat';
export { useWebSocketSession } from './useWebSocketSession';
export { useMediaQuery } from './useMediaQuery';

// Hook to force components to re-render on theme change
export const useThemeChange = () => {
  const [themeCounter, setThemeCounter] = useState(0);

  useEffect(() => {
    const handleThemeChange = (event) => {
      console.log('🎨 Theme changed event received:', event.detail);
      setThemeCounter(prev => prev + 1);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  return themeCounter;
}; 