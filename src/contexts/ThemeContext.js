import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document with forced recalculation
  useEffect(() => {
    const applyTheme = (newTheme) => {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove existing theme classes and attributes
      root.removeAttribute('data-theme');
      body.classList.remove('light-theme', 'dark-theme');
      
      // Force a style recalculation by accessing a computed style
      window.getComputedStyle(root).getPropertyValue('--picker-bg');
      
      // Apply new theme
      root.setAttribute('data-theme', newTheme);
      body.className = `${newTheme}-theme`;
      
      // Store in localStorage
      localStorage.setItem('theme', newTheme);
      
      // Force another style recalculation to ensure CSS variables are updated
      requestAnimationFrame(() => {
        window.getComputedStyle(root).getPropertyValue('--picker-bg');
        
        // Dispatch a custom event to notify components of theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: newTheme } 
        }));
      });
    };

    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🎨 Theme toggle:', theme, '->', newTheme);
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 