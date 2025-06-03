// src/components/FeatureHeader.js - FIXED Desktop Voice Selector Modal with Proper Positioning and Scrolling
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMenu, FiX, FiSearch, FiMoreVertical, FiVolume2, FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import Avatar from './Avatar';
import VoiceSelector from './VoiceSelector';
import '../assets/styles/FeatureHeader.css';
import { ttsVoices, createVoiceConfig, getVoicesByType } from '../data/ttsVoices';

export default function FeatureHeader({
  feature,
  sidebarOpen,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  title = '',
  scenario,
  selectedVoice,
  onVoiceChange,
  onChangeScenario,
  userName = '',
  onLogout,
}) {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [voiceSelectorOpen, setVoiceSelectorOpen] = useState(false);
  
  // ENHANCED: Comprehensive dark mode state management
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has an explicit preference stored
    const userPreference = localStorage.getItem('darkMode');
    
    if (userPreference !== null) {
      // User has explicitly chosen a theme - use their choice
      return JSON.parse(userPreference);
    }
    
    // No user preference - follow system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true; // System is in dark mode
    }
    
    // System is in light mode or doesn't support dark mode detection
    return false;
  });
  
  // ENHANCED: Listen for system theme changes (when user hasn't set explicit preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Only follow system changes if user hasn't set explicit preference
      const userPreference = localStorage.getItem('darkMode');
      if (userPreference === null) {
        setDarkMode(e.matches);
        // Apply to document immediately
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // ENHANCED: Apply dark mode to document root with better integration
  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // ENHANCED: Also update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', darkMode ? '#2E3440' : '#FFFFFF');
    } else {
      // Create meta theme-color if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = darkMode ? '#2E3440' : '#FFFFFF';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    
    // ENHANCED: Update body class for additional styling hooks
    document.body.classList.toggle('dark-theme', darkMode);
    document.body.classList.toggle('light-theme', !darkMode);
    
    console.log(`Theme switched to: ${theme}`);
  }, [darkMode]);
  
  const avatarRef = useRef(null);
  const overflowRef = useRef(null);
  const voiceSelectorRef = useRef(null);

  // ENHANCED: Toggle dark mode function with better feedback
  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Store user's explicit preference
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    // ENHANCED: Visual feedback for theme change
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = `Switched to ${newMode ? 'dark' : 'light'} mode`;
    feedbackElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${newMode ? '#4a5568' : '#f7fafc'};
      color: ${newMode ? '#f7fafc' : '#1a202c'};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    
    document.body.appendChild(feedbackElement);
    
    // Animate in
    requestAnimationFrame(() => {
      feedbackElement.style.opacity = '1';
      feedbackElement.style.transform = 'translateY(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
      feedbackElement.style.opacity = '0';
      feedbackElement.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (document.body.contains(feedbackElement)) {
          document.body.removeChild(feedbackElement);
        }
      }, 300);
    }, 2000);
    
    console.log(`Dark mode ${newMode ? 'enabled' : 'disabled'} by user`);
  }, [darkMode]);

  // ENHANCED: Reset to system preference function
  const resetToSystemTheme = useCallback(() => {
    // Remove user preference
    localStorage.removeItem('darkMode');
    
    // Set to current system preference
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(systemPrefersDark);
    
    // Visual feedback
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = `Following system theme (${systemPrefersDark ? 'dark' : 'light'})`;
    feedbackElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${systemPrefersDark ? '#4a5568' : '#f7fafc'};
      color: ${systemPrefersDark ? '#f7fafc' : '#1a202c'};
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    
    document.body.appendChild(feedbackElement);
    
    requestAnimationFrame(() => {
      feedbackElement.style.opacity = '1';
      feedbackElement.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
      feedbackElement.style.opacity = '0';
      feedbackElement.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (document.body.contains(feedbackElement)) {
          document.body.removeChild(feedbackElement);
        }
      }, 300);
    }, 2500);
    
    console.log('Reset to system theme preference');
  }, []);

  // ENHANCED: Improved mobile detection with debouncing
  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Close voice selector when switching viewport sizes
        if (voiceSelectorOpen) {
          setVoiceSelectorOpen(false);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [voiceSelectorOpen]);

  // ENHANCED: Better click outside handler with improved event handling
  useEffect(() => {
    function handleClickOutside(event) {
      let shouldClose = false;
      
      // Check avatar menu
      if (avatarMenuOpen && avatarRef.current && !avatarRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
        shouldClose = true;
      }
      
      // Check overflow menu
      if (overflowOpen && overflowRef.current && !overflowRef.current.contains(event.target)) {
        setOverflowOpen(false);
        shouldClose = true;
      }
      
      // Prevent event propagation if we closed something
      if (shouldClose) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [avatarMenuOpen, overflowOpen]);

  // Handle escape key for voice selector and menus
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (voiceSelectorOpen) {
          setVoiceSelectorOpen(false);
          event.preventDefault();
        } else if (overflowOpen) {
          setOverflowOpen(false);
          event.preventDefault();
        } else if (avatarMenuOpen) {
          setAvatarMenuOpen(false);
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [voiceSelectorOpen, overflowOpen, avatarMenuOpen]);

  // FIXED: Prevent body scroll when voice selector is open (both mobile and desktop)
  useEffect(() => {
    if (voiceSelectorOpen) {
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      // Get current scroll position before fixing
      const scrollY = window.scrollY;
      
      // Apply fixed positioning to prevent scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        
        // Restore scroll position
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      };
    }
  }, [voiceSelectorOpen]);

  const showVoiceControls =
    (feature === 'chat' && Boolean(scenario)) || feature === 'sema' || feature === 'speech-coach';

  // Helper to get current voice configuration
  const getCurrentVoiceConfig = useCallback(() => {
    if (!selectedVoice) {
      return createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
    }
    
    if (typeof selectedVoice === 'object' && selectedVoice.voiceName) {
      return {
        ...selectedVoice,
        voiceName: selectedVoice.voiceName,
        languageCode: selectedVoice.languageCode || 'en-US',
        profile: selectedVoice.profile || 'default',
        label: selectedVoice.label || selectedVoice.voiceName
      };
    }
    
    if (typeof selectedVoice === 'string') {
      return createVoiceConfig(selectedVoice, 'default');
    }
    
    const voiceName = selectedVoice.voiceName || selectedVoice.name || 'en-US-Chirp3-HD-Aoede';
    const profile = selectedVoice.profile || 'default';
    return createVoiceConfig(voiceName, profile);
  }, [selectedVoice]);

  // ENHANCED: Event handlers with better error handling
  const handleAvatarClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Close other menus first
    setOverflowOpen(false);
    setVoiceSelectorOpen(false);
    
    setAvatarMenuOpen(prev => !prev);
  }, []);

  const handleOverflowClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Close other menus first
    setAvatarMenuOpen(false);
    setVoiceSelectorOpen(false);
    
    setOverflowOpen(prev => !prev);
  }, []);

  const handleVoiceSelectorClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Close other menus first
    setAvatarMenuOpen(false);
    setOverflowOpen(false);
    
    setVoiceSelectorOpen(prev => !prev);
  }, []);

  // Handle voice selection change from dropdown
  const handleVoiceDropdownChange = useCallback((voiceName) => {
    try {
      const currentConfig = getCurrentVoiceConfig();
      const newConfig = createVoiceConfig(voiceName, currentConfig.profile);
      
      if (newConfig && onVoiceChange) {
        onVoiceChange(newConfig);
      }
    } catch (error) {
      console.error('Error updating voice:', error);
    }
  }, [getCurrentVoiceConfig, onVoiceChange]);

  // Handle voice change from full selector
  const handleVoiceSelectorChange = useCallback((voiceConfig) => {
    try {
      if (onVoiceChange) {
        const normalizedConfig = typeof voiceConfig === 'string' 
          ? createVoiceConfig(voiceConfig, 'default')
          : voiceConfig;
        
        onVoiceChange(normalizedConfig);
      }
    } catch (error) {
      console.error('Error updating voice from selector:', error);
    }
  }, [onVoiceChange]);

  // Close voice selector
  const handleVoiceSelectorClose = useCallback(() => {
    setVoiceSelectorOpen(false);
  }, []);

  // Handle mobile voice settings click
  const handleMobileVoiceSettingsClick = useCallback(() => {
    setOverflowOpen(false);
    // Small delay to ensure overflow menu closes smoothly
    setTimeout(() => {
      setVoiceSelectorOpen(true);
    }, 100);
  }, []);

  // Get display information
  const currentVoiceConfig = getCurrentVoiceConfig();
  const currentVoiceName = currentVoiceConfig?.voiceName || 'en-US-Chirp3-HD-Aoede';
  const currentVoiceObj = ttsVoices.find(v => v.name === currentVoiceName);
  const currentVoiceLabel = currentVoiceObj?.label || currentVoiceName;
  const currentProfileLabel = currentVoiceConfig?.profileConfig?.name || 'Default';

  // Get grouped voices for better organization
  const voiceGroups = getVoicesByType();

  return (
    <>
      <header className="feature-header">
        {/* Sidebar toggle + search or mobile title */}
        <div className="feature-header__side-controls">
          <button
            className="feature-header__toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            type="button"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>

          {sidebarOpen ? (
            <div className="feature-header__search">
              <FiSearch className="feature-header__search-icon" />
              <input
                className="feature-header__search-input"
                type="search"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          ) : (
            <h1 className="feature-header__mobile-title">{title}</h1>
          )}
        </div>

        {/* Main title + controls */}
        <div className="feature-header__main">
          {sidebarOpen && (
            <h1 className="feature-header__title">{title}</h1>
          )}

          {showVoiceControls && (
            <>
              {/* Desktop-only inline controls */}
              <div className="feature-header__controls">
                {/* Voice Selection Dropdown with proper grouping */}
                <div className="feature-header__voice-control">
                  <select
                    className="feature-header__control-item voice-select"
                    value={currentVoiceName}
                    onChange={e => handleVoiceDropdownChange(e.target.value)}
                    title={`Current: ${currentVoiceLabel} (${currentProfileLabel})`}
                  >
                    {/* Chirp 3 HD Voices */}
                    {voiceGroups.chirp3.length > 0 && (
                      <optgroup label="Chirp 3 HD Voices (Premium)">
                        {voiceGroups.chirp3.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* WaveNet Voices */}
                    {voiceGroups.wavenet.length > 0 && (
                      <optgroup label="WaveNet Voices (High Quality)">
                        {voiceGroups.wavenet.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Journey Voices */}
                    {voiceGroups.journey.length > 0 && (
                      <optgroup label="Journey Voices">
                        {voiceGroups.journey.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* News Voices */}
                    {voiceGroups.news.length > 0 && (
                      <optgroup label="News Voices">
                        {voiceGroups.news.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Studio Voices */}
                    {voiceGroups.studio.length > 0 && (
                      <optgroup label="Studio Voices">
                        {voiceGroups.studio.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Standard Voices */}
                    {voiceGroups.standard.length > 0 && (
                      <optgroup label="Standard Voices">
                        {voiceGroups.standard.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Polyglot Voices */}
                    {voiceGroups.polyglot.length > 0 && (
                      <optgroup label="Polyglot Voices">
                        {voiceGroups.polyglot.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  
                  {/* Enhanced Voice Selector Button */}
                  <div className="voice-selector-container" ref={voiceSelectorRef}>
                    <button
                      className="feature-header__control-item voice-settings-btn"
                      onClick={handleVoiceSelectorClick}
                      title="Advanced voice settings"
                      aria-label="Open voice studio"
                      type="button"
                    >
                      <FiSettings />
                    </button>
                  </div>
                </div>

                {/* Scenario Change Button */}
                {feature === 'chat' && onChangeScenario && (
                  <button
                    className="feature-header__control-item scenario-btn"
                    onClick={onChangeScenario}
                    type="button"
                  >
                    Change Scenario
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ENHANCED: Right corner container - Groups overflow menu + avatar together */}
        <div className="feature-header__right-corner">
          {showVoiceControls && (
            <div className="feature-header__overflow" ref={overflowRef}>
              <button
                className="feature-header__overflow-btn"
                onClick={handleOverflowClick}
                aria-label="More options"
                type="button"
              >
                <FiMoreVertical />
              </button>
              {overflowOpen && (
                <ul className="feature-header__overflow-menu">
                  <li className="feature-header__overflow-item">
                    <div className="mobile-voice-control">
                      <label>Voice:</label>
                      <select
                        value={currentVoiceName}
                        onChange={e => handleVoiceDropdownChange(e.target.value)}
                        className="mobile-voice-select"
                      >
                        {ttsVoices.map(v => (
                          <option key={v.name} value={v.name}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                  
                  <li className="feature-header__overflow-item">
                    <button 
                      onClick={handleMobileVoiceSettingsClick}
                      className="mobile-voice-settings"
                      type="button"
                    >
                      <FiSettings />
                      Voice Studio
                    </button>
                  </li>
                  
                  <li className="feature-header__overflow-item voice-info">
                    <div className="current-voice-info">
                      <div className="voice-name">{currentVoiceLabel}</div>
                      <div className="voice-profile">{currentProfileLabel} style</div>
                    </div>
                  </li>
                  
                  {feature === 'chat' && onChangeScenario && (
                    <li className="feature-header__overflow-item">
                      <button onClick={onChangeScenario} type="button">
                        Change Scenario
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Avatar + dropdown - NOW INSIDE RIGHT CORNER CONTAINER */}
          <div className="feature-header__avatar-container" ref={avatarRef}>
            <button
              className="feature-header__avatar-btn"
              onClick={handleAvatarClick}
              aria-label="User menu"
              type="button"
            >
              <Avatar userName={userName} />
            </button>
            {avatarMenuOpen && (
              <ul className="feature-header__menu">
                <li className="feature-header__menu-item user-info">
                  <strong>{userName}</strong>
                  {currentVoiceConfig && (
                    <div className="user-voice-info">
                      <small>Voice: {currentVoiceLabel}</small>
                      <small>Style: {currentProfileLabel}</small>
                    </div>
                  )}
                </li>
                
                {/* ENHANCED DARK MODE TOGGLE */}
                <li className="feature-header__menu-item">
                  <button
                    className="feature-header__dark-mode-btn"
                    onClick={toggleDarkMode}
                    type="button"
                  >
                    <span className="dark-mode-icon">
                      {darkMode ? <FiSun /> : <FiMoon />}
                    </span>
                    <span className="dark-mode-text">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                      {!localStorage.getItem('darkMode') && (
                        <small style={{display: 'block', fontSize: '0.7rem', opacity: 0.7, marginTop: '2px'}}>
                          (Following system)
                        </small>
                      )}
                    </span>
                  </button>
                </li>
                
                {/* ENHANCED: RESET TO SYSTEM THEME - Only show if user has overridden */}
                {localStorage.getItem('darkMode') && (
                  <li className="feature-header__menu-item">
                    <button
                      className="feature-header__dark-mode-btn"
                      onClick={resetToSystemTheme}
                      type="button"
                      style={{fontSize: '0.85rem', opacity: 0.8}}
                    >
                      <span className="dark-mode-icon">
                        🔄
                      </span>
                      <span className="dark-mode-text">
                        Use System Theme
                      </span>
                    </button>
                  </li>
                )}
                
                <li className="feature-header__menu-item">
                  <button
                    className="feature-header__logout-btn"
                    onClick={onLogout}
                    type="button"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>
      
      {/* FIXED: Full-Screen Voice Studio Modal - No Overlay, Full Dimensions */}
      {voiceSelectorOpen && (
        <div 
          className="voice-studio-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-studio-title"
        >
          {/* FIXED: Close button positioned at top-right corner */}
          <button
            className="voice-studio-close-btn"
            onClick={handleVoiceSelectorClose}
            aria-label="Close voice studio"
            type="button"
          >
            <FiX />
          </button>
          
          {/* Header */}
          <div className="voice-studio-header">
            <div className="voice-studio-header-title">
              <FiVolume2 className="voice-studio-header-icon" />
              <h3 id="voice-studio-title">Voice Studio</h3>
            </div>
          </div>
          
          {/* Current Voice Preview */}
          <div className="voice-studio-current-preview">
            <div className="voice-studio-preview-label">Current Selection</div>
            <div className="voice-studio-preview-info">
              <div className="voice-studio-preview-name">{currentVoiceLabel}</div>
              <div className="voice-studio-preview-style">{currentProfileLabel} style</div>
            </div>
          </div>
          
          {/* FIXED: Fully Scrollable Voice Selector Content */}
          <div className="voice-studio-content-wrapper">
            <VoiceSelector
              onVoiceChange={handleVoiceSelectorChange}
              defaultVoice={currentVoiceName}
              defaultProfile={currentVoiceConfig?.profile || 'default'}
              className="voice-studio-selector"
              showPreview={true}
              compact={false}
            />
          </div>
        </div>
      )}
    </>
  );
}