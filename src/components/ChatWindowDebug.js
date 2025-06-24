// ChatWindowDebug.js - Simplified debug version
import React, { useState } from 'react';

const ChatWindowDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    cssVariablesLoaded: false,
    hooksLoaded: false,
    componentsLoaded: false,
    authLoaded: false
  });

  React.useEffect(() => {
    // Check if CSS variables are loaded
    const testElement = document.createElement('div');
    testElement.style.display = 'none';
    document.body.appendChild(testElement);
    
    const computedStyle = getComputedStyle(testElement);
    const headerHeight = computedStyle.getPropertyValue('--header-height');
    const sidebarWidth = computedStyle.getPropertyValue('--sidebar-width');
    
    document.body.removeChild(testElement);
    
    // Check what's actually available
    const checks = {
      cssVariablesLoaded: !!(headerHeight || sidebarWidth),
      hooksLoaded: false,
      componentsLoaded: false,
      authLoaded: false
    };

    // Check hooks
    try {
      require('../hooks');
      checks.hooksLoaded = true;
    } catch (e) {
      console.warn('Hooks not available:', e);
    }

    // Check components
    try {
      require('./LazyComponents');
      checks.componentsLoaded = true;
    } catch (e) {
      console.warn('LazyComponents not available:', e);
    }

    // Check auth context
    try {
      require('../contexts/AuthContext');
      checks.authLoaded = true;
    } catch (e) {
      console.warn('AuthContext not available:', e);
    }

    setDebugInfo(checks);
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1>ChatWindow Debug Information</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>System Checks:</h2>
        <ul>
          <li style={{ color: debugInfo.cssVariablesLoaded ? 'green' : 'red' }}>
            CSS Variables: {debugInfo.cssVariablesLoaded ? '✓ Loaded' : '✗ Failed'}
          </li>
          <li style={{ color: debugInfo.hooksLoaded ? 'green' : 'red' }}>
            Custom Hooks: {debugInfo.hooksLoaded ? '✓ Loaded' : '✗ Failed'}
          </li>
          <li style={{ color: debugInfo.componentsLoaded ? 'green' : 'red' }}>
            Lazy Components: {debugInfo.componentsLoaded ? '✓ Loaded' : '✗ Failed'}
          </li>
          <li style={{ color: debugInfo.authLoaded ? 'green' : 'red' }}>
            Auth Context: {debugInfo.authLoaded ? '✓ Loaded' : '✗ Failed'}
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>CSS Variables Test:</h2>
        <div style={{
          background: 'var(--bg-primary, red)',
          color: 'var(--text-primary, blue)',
          padding: '10px',
          borderRadius: 'var(--border-radius, 0px)',
          border: '1px solid var(--border-color, purple)'
        }}>
          This should be styled with CSS variables if they're working properly.
          <br />
          Background should not be red, text should not be blue, border should not be purple.
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Grid Layout Test:</h2>
        <div style={{
          display: 'grid',
          gridTemplateAreas: '"header header" "sidebar main"',
          gridTemplateColumns: '300px 1fr',
          gridTemplateRows: '60px 200px',
          gap: '10px',
          background: '#ddd'
        }}>
          <div style={{ gridArea: 'header', background: 'lightblue', padding: '10px' }}>
            Header Area
          </div>
          <div style={{ gridArea: 'sidebar', background: 'lightgreen', padding: '10px' }}>
            Sidebar Area
          </div>
          <div style={{ gridArea: 'main', background: 'lightyellow', padding: '10px' }}>
            Main Content Area
          </div>
        </div>
      </div>

      <div>
        <h2>Next Steps:</h2>
        <ol>
          <li>If CSS Variables are failing, check if CSSVariables.css is properly imported</li>
          <li>If Custom Hooks are failing, check the hooks/index.js file</li>
          <li>If Lazy Components are failing, check LazyComponents.js</li>
          <li>If Auth Context is failing, check contexts/AuthContext.js</li>
          <li>Try refreshing the page and check browser console for errors</li>
        </ol>
      </div>
    </div>
  );
};

export default ChatWindowDebug; 