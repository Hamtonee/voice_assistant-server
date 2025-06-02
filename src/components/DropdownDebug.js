// DropdownDebug.js - Simple test component to verify dropdown functionality
import React, { useState, useRef, useEffect } from 'react';

const DropdownDebug = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Debug dropdown clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={handleToggle}
          style={{
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Test Dropdown {isOpen ? '▲' : '▼'}
        </button>
        
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            backgroundColor: '#2E3440',
            border: '1px solid #667eea',
            borderRadius: '8px',
            minWidth: '200px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            marginTop: '8px'
          }}>
            <div style={{
              padding: '12px 16px',
              color: '#D8DEE9',
              borderBottom: '1px solid #434C5E',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Debug Menu
            </div>
            <div style={{
              padding: '8px 0'
            }}>
              <div style={{
                padding: '8px 16px',
                color: '#D8DEE9',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => console.log('Option 1 clicked')}>
                Option 1
              </div>
              <div style={{
                padding: '8px 16px',
                color: '#D8DEE9',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => console.log('Option 2 clicked')}>
                Option 2
              </div>
              <div style={{
                padding: '8px 16px',
                color: '#D8DEE9',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onClick={() => console.log('Option 3 clicked')}>
                Option 3
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '10px',
        fontSize: '12px',
        color: '#666',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '8px',
        borderRadius: '4px'
      }}>
        State: {isOpen ? 'OPEN' : 'CLOSED'}
      </div>
    </div>
  );
};

export default DropdownDebug;