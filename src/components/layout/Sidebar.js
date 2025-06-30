import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import OptimizedImage from '../ui/OptimizedImage';

const Sidebar = ({ isCollapsed, onNewChat }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const NavButton = ({ label, path, icon }) => (
    <button
      onClick={() => navigate(path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        width: '100%',
        background: location.pathname === path ? '#23263a' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        marginBottom: '8px',
      }}
    >
      <span style={{ 
        marginRight: isCollapsed ? '0' : '12px',
        fontSize: '20px' 
      }}>
        {icon}
      </span>
      {!isCollapsed && (
        <span style={{ fontSize: '14px' }}>{label}</span>
      )}
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '24px 16px',
      boxSizing: 'border-box',
    }}>
      {/* Logo/Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <OptimizedImage
          src="/assets/images/logo.png"
          alt="SemaNami"
          width={isCollapsed ? 40 : 120}
          height={40}
          priority={true}
        />
        {!isCollapsed && (
          <span style={{
            marginLeft: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fff',
          }}>
            SemaNami
          </span>
        )}
      </div>

      {/* Navigation */}
      <div style={{ flex: 1 }}>
        <NavButton
          label="Chat"
          path="/chat"
          icon="💬"
        />
        <NavButton
          label="Sema"
          path="/sema"
          icon="🎙️"
        />
        <NavButton
          label="Tusome"
          path="/tusome"
          icon="📚"
        />
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: '12px 16px',
          background: '#2563eb',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          width: '100%',
        }}
      >
        <span style={{ 
          marginRight: isCollapsed ? '0' : '12px',
          fontSize: '20px' 
        }}>
          ➕
        </span>
        {!isCollapsed && (
          <span style={{ fontSize: '14px' }}>New Chat</span>
        )}
      </button>
    </div>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool,
  onNewChat: PropTypes.func.isRequired,
};

export default Sidebar; 