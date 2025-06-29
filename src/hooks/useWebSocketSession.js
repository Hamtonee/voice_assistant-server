// Create this as: src/hooks/useWebSocketSession.js
// This is an optional enhancement for instant session termination

import { useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useWebSocketSession = () => {
  const { token, user, logout } = useContext(AuthContext);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!token || !user) return;

    const connectWebSocket = () => {
      try {
        // Safe environment variable access
        const getWsUrl = () => {
          try {
            return (typeof process !== 'undefined' && process.env && process.env.REACT_APP_WS_URL) || 'ws://localhost:3001';
          } catch (error) {
            console.warn('Failed to access REACT_APP_WS_URL, using fallback');
            return 'ws://localhost:3001';
          }
        };

        const wsUrl = `${getWsUrl()}/ws/session?token=${token}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('🔗 WebSocket session connected');
          reconnectAttempts.current = 0;
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 WebSocket message:', message);

            if (message.type === 'SESSION_TERMINATED') {
              console.log('🚨 Session terminated via WebSocket');
              
              // Show immediate notification
              showSessionTerminatedNotification();
              
              // Logout user
              logout();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          
          if (reconnectAttempts.current < maxReconnectAttempts) {
            setTimeout(() => {
              reconnectAttempts.current++;
              connectWebSocket();
            }, 1000 * Math.pow(2, reconnectAttempts.current));
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    // Connect WebSocket
    connectWebSocket();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [token, user, logout]);

  const showSessionTerminatedNotification = () => {
    // Create full-screen notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: fadeIn 0.3s ease-in-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    notification.innerHTML = `
      <div style="
        text-align: center;
        max-width: 500px;
        margin: 2rem;
        padding: 3rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2rem;
        backdrop-filter: blur(10px);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        <div style="font-size: 4rem; margin-bottom: 1.5rem; animation: pulse 2s infinite;">🔐</div>
        <h1 style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 600;">Session Terminated</h1>
        <p style="margin: 0; font-size: 1.1rem; opacity: 0.9; line-height: 1.6;">
          You have been logged out because you logged in from another device.
          <br><br>
          Redirecting to login page...
        </p>
        <div style="
          margin-top: 2rem;
          width: 200px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          overflow: hidden;
          margin-left: auto;
          margin-right: auto;
        ">
          <div style="
            width: 0%;
            height: 100%;
            background: white;
            animation: progress 3s ease-in-out forwards;
          "></div>
        </div>
      </div>
    `;

    // Add progress animation
    style.textContent += `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes progress {
        from { width: 0%; }
        to { width: 100%; }
      }
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  };

  return wsRef.current;
};

export default useWebSocketSession;