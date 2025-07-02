// src/components/FeatureHeader.js
import React, { useRef, useState } from 'react';
import { FiMoreVertical, FiVolume2, FiMoon, FiSun, FiMenu } from 'react-icons/fi';
import Avatar from './Avatar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/FeatureHeader.css';

const useDropdownManager = () => {
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const closeDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: false
    }));
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  return {
    openDropdowns,
    toggleDropdown,
    closeDropdown,
    closeAllDropdowns
  };
};

const FeatureHeader = ({
  selectedFeature = 'chat',
  isSidebarOpen = false,
  onToggleSidebar = () => {},
  isMobile = false,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { 
    openDropdowns, 
    toggleDropdown, 
    closeAllDropdowns 
  } = useDropdownManager();
  
  const headerRef = useRef(null);
  const avatarRef = useRef(null);
  const overflowRef = useRef(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      closeAllDropdowns();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get feature display information
  const getFeatureInfo = () => {
    const featureMap = {
      chat: { 
        title: 'Select Roleplay',
        subtitle: null
      },
      sema: { 
        title: 'Select Speech Practice',
        subtitle: null
      },
      tusome: { 
        title: 'Select Reading',
        subtitle: null
      }
    };
    
    return featureMap[selectedFeature] || { title: 'Select Feature', subtitle: null };
  };

  const featureInfo = getFeatureInfo();

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        overflowRef.current && 
        !overflowRef.current.contains(event.target) &&
        avatarRef.current && 
        !avatarRef.current.contains(event.target)
      ) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllDropdowns]);

  // Show hamburger in header ONLY when:
  // 1. On mobile AND sidebar is closed
  // 2. On desktop/tablet AND sidebar is closed
  const showHamburgerInHeader = (isMobile && !isSidebarOpen) || (!isMobile && !isSidebarOpen);

  return (
    <header 
      ref={headerRef}
      className={`feature-header ${isDark ? 'dark' : ''} ${isSidebarOpen ? 'sidebar-open' : ''} ${isMobile ? 'mobile' : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
    >
      {showHamburgerInHeader && (
        <button 
          className="feature-header__hamburger"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <FiMenu size={24} />
        </button>
      )}
      
      <div className="feature-header__content">
        <h1 className="feature-header__title">{featureInfo.title}</h1>
        {featureInfo.subtitle && (
          <p className="feature-header__subtitle">{featureInfo.subtitle}</p>
        )}
      </div>

      {/* Right Section */}
      <div className="header-right">
        {/* Overflow Menu (Three Dots) */}
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
                onClick={toggleTheme}
              >
                {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
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
        )}
      </div>
    </header>
  );
};

export default FeatureHeader;