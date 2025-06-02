// Create this as: src/hooks/useSessionHeartbeat.js

import { useEffect, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api';

export const useSessionHeartbeat = () => {
  const { token, user, logout } = useContext(AuthContext);
  const heartbeatRef = useRef(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!token || !user) return;

    // Track user activity
    const trackActivity = () => {
      isActiveRef.current = true;
    };

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Heartbeat function
    const sendHeartbeat = async () => {
      // Only send heartbeat if user has been active
      if (!isActiveRef.current) {
        console.log('🫀 Skipping heartbeat - user inactive');
        return;
      }

      try {
        console.log('🫀 Sending session heartbeat');
        await api.get('/auth/session-check');
        console.log('✅ Heartbeat successful');
        isActiveRef.current = false; // Reset activity flag
      } catch (error) {
        if (error.response?.status === 401) {
          const errorCode = error.response?.data?.code;
          if (errorCode === 'SESSION_CONFLICT' || errorCode === 'SESSION_UPGRADE_REQUIRED') {
            console.log('💔 Heartbeat failed - session conflict');
            
            // Show immediate notification
            showSessionExpiredNotification();
            
            // Logout user
            logout();
          }
        }
      }
    };

    // Start heartbeat every 15 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, 15000);

    // Send initial heartbeat
    sendHeartbeat();

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [token, user, logout]);

  // Show notification function
  const showSessionExpiredNotification = () => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Expired', {
        body: 'You have been logged out from another device.',
        icon: '/favicon.ico',
        tag: 'session-expired'
      });
    }

    // Visual notification overlay
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    notification.innerHTML = `
      <div style="
        background: #1f2937;
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        margin: 1rem;
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2 style="margin: 0 0 1rem 0; color: #f9fafb;">Session Expired</h2>
        <p style="margin: 0; color: #d1d5db; line-height: 1.5;">
          You have been logged out because you logged in from another device.
          You will be redirected to the login page.
        </p>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
};

export default useSessionHeartbeat;