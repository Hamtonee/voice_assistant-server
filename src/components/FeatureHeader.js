// src/components/FeatureHeader.js - Optimized Version
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiMenu, FiX, FiSearch, FiMoreVertical, FiVolume2, FiMoon, FiSun } from 'react-icons/fi';
import Avatar from './Avatar';
import VoiceSelector from './VoiceSelector';
import '../assets/styles/FeatureHeader.css';

// Custom hook for dark mode management
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const userPreference = localStorage.getItem('darkMode');
    if (userPreference !== null) {
      return JSON.parse(userPreference);
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-theme', darkMode);
    document.body.classList.toggle('light-theme', !darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  }, [darkMode]);

  return { darkMode, toggleDarkMode };
};

// Custom hook for dropdown management
const useDropdownManager = () => {
  const [openDropdowns, setOpenDropdowns] = useState({
    avatar: false,
    overflow: false,
    voiceSelector: false
  });

  const toggleDropdown = useCallback((name) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setOpenDropdowns({
      avatar: false,
      overflow: false,
      voiceSelector: false
    });
  }, []);

  const closeDropdown = useCallback((name) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: false
    }));
  }, []);

  return {
    openDropdowns,
    toggleDropdown,
    closeAllDropdowns,
    closeDropdown
  };
};

export default function FeatureHeader({
  sidebarOpen,
  onToggleSidebar,
  selectedFeature,
  scenario,
  onClearScenario,
  user,
  selectedVoice,
  onVoiceSelect
}) {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { openDropdowns, toggleDropdown, closeAllDropdowns, closeDropdown } = useDropdownManager();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const avatarRef = useRef(null);
  const overflowRef = useRef(null);
  const voiceSelectorRef = useRef(null);

  // Get feature display information
  const getFeatureInfo = () => {
    const featureMap = {
      chat: { 
        title: scenario ? scenario.label : 'Chat', 
        subtitle: scenario ? 'Role-play Conversation' : 'Select a Scenario',
        showBackButton: !!scenario
      },
      sema: { 
        title: 'Sema', 
        subtitle: 'Speech Coaching',
        showBackButton: false
      },
      tusome: { 
        title: 'Tusome', 
        subtitle: 'Reading Practice',
        showBackButton: false
      }
    };
    
    return featureMap[selectedFeature] || { title: 'Voice Assistant', subtitle: '', showBackButton: false };
  };

  const featureInfo = getFeatureInfo();

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = [
        { ref: avatarRef, dropdown: 'avatar' },
        { ref: overflowRef, dropdown: 'overflow' },
        { ref: voiceSelectorRef, dropdown: 'voiceSelector' }
      ];

      refs.forEach(({ ref, dropdown }) => {
        if (openDropdowns[dropdown] && ref.current && !ref.current.contains(event.target)) {
          closeDropdown(dropdown);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdowns, closeDropdown]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAllDropdowns]);

  // Handle voice selection
  const handleVoiceSelect = (voice) => {
    onVoiceSelect?.(voice);
    closeDropdown('voiceSelector');
  };

  // Handle logout
  const handleLogout = () => {
    // Implementation depends on your auth system
    console.log('Logout clicked');
    closeDropdown('avatar');
  };

  return (
    <header className="feature-header">
      <div className="header-content">
        
        {/* Left Section */}
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          
          <div className="header-title">
            {featureInfo.showBackButton && (
              <button 
                className="back-button"
                onClick={onClearScenario}
                aria-label="Go back to scenario selection"
              >
                ←
              </button>
            )}
            <div>
              <h1>{featureInfo.title}</h1>
              <p className="subtitle">{featureInfo.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="header-center">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="header-right">
          
          {/* Voice Selector */}
          <div className="voice-selector-container" ref={voiceSelectorRef}>
            <button
              className="voice-button"
              onClick={() => toggleDropdown('voiceSelector')}
              aria-label="Select voice"
            >
              <FiVolume2 size={18} />
              {selectedVoice && <span className="voice-name">{selectedVoice.name}</span>}
            </button>
            
            {openDropdowns.voiceSelector && (
              <div className="voice-selector-dropdown">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceSelect={handleVoiceSelect}
                />
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {/* User Avatar */}
          <div className="avatar-container" ref={avatarRef}>
            <button
              className="avatar-button"
              onClick={() => toggleDropdown('avatar')}
              aria-label="User menu"
            >
              <Avatar user={user} size="sm" />
            </button>
            
            {openDropdowns.avatar && (
              <div className="avatar-dropdown">
                <div className="dropdown-header">
                  <Avatar user={user} size="md" />
                  <div className="user-info">
                    <p className="user-name">{user?.name || 'User'}</p>
                    <p className="user-email">{user?.email}</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Overflow Menu (Mobile) */}
          <div className="overflow-menu" ref={overflowRef}>
            <button
              className="overflow-toggle"
              onClick={() => toggleDropdown('overflow')}
              aria-label="More options"
            >
              <FiMoreVertical size={18} />
            </button>
            
            {openDropdowns.overflow && (
              <div className="overflow-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={() => toggleDropdown('voiceSelector')}
                >
                  <FiVolume2 size={16} />
                  Voice Settings
                </button>
                <button 
                  className="dropdown-item"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 