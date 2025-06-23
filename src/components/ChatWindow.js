// src/components/ChatWindow.js - CLEANED VERSION
import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import '../assets/styles/ChatWindow.css';

import ChatSidebar    from './ChatSidebar';
import FeatureHeader  from './FeatureHeader';
import ScenarioPicker from './ScenarioPicker';
import ChatDetail     from './ChatDetail';
import SpeechCoach    from './SpeechCoach';
import ReadingPassage from './ReadingPassage';

import { availableScenarios }   from '../data/rolePlayScenarios';
import { ttsVoices, createVoiceConfig } from '../data/ttsVoices';
import generateTitleForChat     from '../utils/generateTitle';
import { AuthContext }          from '../contexts/AuthContext';

// Temporary debugging
console.log('🔍 Available scenarios loaded:', availableScenarios?.length || 'UNDEFINED', availableScenarios?.slice(0, 3)?.map(s => s.key) || 'NO SCENARIOS');

export default function ChatWindow() {
  const { user, logout } = useContext(AuthContext);

  // ─── Consolidated Responsive State ─────────────────────
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // ─── Consolidated Session State ─────────────────────────
  const [sessions, setSessions] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState({
    chat: null,
    sema: null,
    tusome: null
  });
  const [selectedFeature, setSelectedFeature] = useState('chat');
  const [scenario, setScenario] = useState(null);

  // ─── UI State ─────────────────────────────────────────
  const [titleGenQueue, setTitleGenQueue] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [alwaysListen, setAlwaysListen] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);

  // ─── Voice System State ─────────────────────────────────
  const [selectedVoice, setSelectedVoice] = useState(() => 
    createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default')
  );
  const [voiceSystemReady, setVoiceSystemReady] = useState(false);

  // ─── Responsive Management ─────────────────────────────
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;

      setViewport({ width, height, isMobile });

      // Auto-manage sidebar based on screen size
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!isMobile && !sidebarOpen && width > 1024) {
        setSidebarOpen(true);
      }
    };
    
    const debouncedResize = (() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateViewport, 100);
      };
    })();
    
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [sidebarOpen]);

  // ─── Sidebar Management ─────────────────────────────────
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!viewport.isMobile || !sidebarOpen) return;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sidebar') && 
          !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [viewport.isMobile, sidebarOpen]);

  // ─── Voice System Initialization ─────────────────────────
  useEffect(() => {
    const initializeVoiceSystem = async () => {
      try {
        // Load saved voice preference
        const savedVoice = localStorage.getItem('selectedVoice');
        if (savedVoice) {
          const parsedVoice = JSON.parse(savedVoice);
          const voiceExists = ttsVoices.find(v => v.name === parsedVoice.voiceName);
          if (voiceExists) {
            setSelectedVoice(parsedVoice);
            console.log('Restored saved voice:', parsedVoice.voiceName);
          }
        }
        
        setVoiceSystemReady(true);
        console.log('Voice system ready');
      } catch (error) {
        console.error('Voice system initialization error:', error);
        setVoiceSystemReady(true);
      }
    };

    initializeVoiceSystem();
  }, []);

  // ─── Data Fetching ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sessions and usage summary in parallel
        const [sessionsRes, usageRes] = await Promise.all([
          api.get('/chats'),
          api.get('/usage-summary')
        ]);
        
        // Defensive check: ensure we always have an array
        const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        setSessions(sessionsData);
        setUsageSummary(usageRes.data.usage_summary);
        
        // Set initial active sessions
        const chats = sessionsData; // Already guaranteed to be an array
        const chatSessions = chats.filter(c => c.feature === 'chat');
        const semaSessions = chats.filter(c => c.feature === 'sema');
        const tusomeSessions = chats.filter(c => c.feature === 'tusome');
        
        setActiveSessionIds({
          chat: chatSessions.length ? chatSessions[0].id : null,
          sema: semaSessions.length ? semaSessions[0].id : null,
          tusome: tusomeSessions.length ? tusomeSessions[0].id : null
        });
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Ensure sessions is always an array even on error
        setSessions([]);
      }
    };

    fetchData();
    
    // Periodic usage summary updates
    const intervalId = setInterval(async () => {
      try {
        const { data } = await api.get('/usage-summary');
        setUsageSummary(data.usage_summary);
      } catch (error) {
        console.error('Failed to fetch usage summary:', error);
      }
    }, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // ─── Title Generation ─────────────────────────────────
  useEffect(() => {
    if (selectedFeature !== 'chat') return;

    // Defensive check: ensure sessions is an array before filtering
    const chatSessions = Array.isArray(sessions) 
      ? sessions.filter(s => s.feature === 'chat')
      : [];
    chatSessions.forEach(chat => {
      if (!chat.title && !titleGenQueue.has(chat.id) && chat.messages?.length >= 2) {
        setTitleGenQueue(prev => new Set([...prev, chat.id]));
        const msgs = chat.messages
          .filter(m => m.role === 'user')
          .slice(0, 2)
          .map(m => m.text);

        generateTitleForChat('chat', scenario?.label, chat.id, msgs)
          .then(title => {
            setSessions(prev =>
              Array.isArray(prev) 
                ? prev.map(s => s.id === chat.id ? { ...s, title } : s)
                : []
            );
            setTitleGenQueue(prev => {
              const next = new Set([...prev]);
              next.delete(chat.id);
              return next;
            });
          });
      }
    });
  }, [sessions, scenario, selectedFeature, titleGenQueue]);

  // ─── Utility Functions ─────────────────────────────────
  const getSessionsByFeature = useCallback((feature) => {
    // Defensive check: ensure sessions is always an array
    return Array.isArray(sessions) ? sessions.filter(s => s.feature === feature) : [];
  }, [sessions]);

  const getCurrentActiveId = useCallback(() => {
    return activeSessionIds[selectedFeature];
  }, [activeSessionIds, selectedFeature]);

  const checkSessionContent = useCallback(async (sessionId, feature) => {
    if (!sessionId) return false;
    
    try {
      const { data } = await api.get(`/chats/${sessionId}`);
      return data.messages?.some(msg => msg.role === 'user') || false;
    } catch (error) {
      console.error('Error checking session content:', error);
      return false;
    }
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (viewport.isMobile) {
      setSidebarOpen(false);
    }
  }, [viewport.isMobile]);

  // ─── Session Management ─────────────────────────────────
  const createNewSession = useCallback(async (feature, forceNew = true) => {
    try {
      const currentId = activeSessionIds[feature];
      
      // Check if current session has content before creating new one
      if (forceNew && currentId) {
        const hasContent = await checkSessionContent(currentId, feature);
        if (!hasContent) {
          console.log(`Current ${feature} session is empty, not creating new one`);
          return;
        }
      }

      const sessionConfig = {
        chat: {
          feature: 'chat',
          title: 'New Chat',
          scenarioKey: null
        },
        sema: {
          feature: 'sema',
          title: 'Sema Session',
          prompt: 'Welcome to Sema! How can I help you practice speaking?'
        },
        tusome: {
          feature: 'tusome',
          title: 'New Reading'
        }
      };

      const config = sessionConfig[feature];
      const { data } = await api.post('/chats', config);
      
      setSessions(prev => [data, ...prev]);
      setActiveSessionIds(prev => ({
        ...prev,
        [feature]: data.id
      }));
      
      closeSidebarOnMobile();
      console.log(`Created new ${feature} session:`, data.id);
      
      return data;
    } catch (error) {
      console.error(`Failed to create new ${feature} session:`, error);
    }
  }, [activeSessionIds, checkSessionContent, closeSidebarOnMobile]);

  const selectSession = useCallback((sessionId) => {
    setActiveSessionIds(prev => ({
      ...prev,
      [selectedFeature]: sessionId
    }));
    
    // Handle chat-specific logic
    if (selectedFeature === 'chat') {
      // Defensive check: ensure sessions is an array before calling find
      const session = Array.isArray(sessions) 
        ? sessions.find(s => s.id === sessionId)
        : null;
      setScenario(
        session?.scenarioKey
          ? availableScenarios.find(s => s.key === session.scenarioKey)
          : null
      );
    }
    
    closeSidebarOnMobile();
  }, [selectedFeature, sessions, closeSidebarOnMobile]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.delete(`/chats/${sessionId}`);
      
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        return filtered;
      });
      
      // Handle active session reassignment
      setActiveSessionIds(prev => {
        if (prev[selectedFeature] === sessionId) {
          // Defensive check: ensure sessions is an array before filtering
          const remainingSessions = Array.isArray(sessions) 
            ? sessions.filter(s => s.feature === selectedFeature && s.id !== sessionId)
            : [];
          
          if (remainingSessions.length > 0) {
            return {
              ...prev,
              [selectedFeature]: remainingSessions[0].id
            };
          } else {
            // Create new session when last one is deleted for sema/tusome
            if (selectedFeature !== 'chat') {
              createNewSession(selectedFeature, false);
            }
            return {
              ...prev,
              [selectedFeature]: null
            };
          }
        }
        return prev;
      });
      
      // Handle chat-specific scenario reset
      if (selectedFeature === 'chat' && activeSessionIds.chat === sessionId) {
        setScenario(null);
      }
      
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [selectedFeature, sessions, activeSessionIds, createNewSession]);

  const renameSession = useCallback(async (sessionId, newTitle) => {
    try {
      await api.put(`/chats/${sessionId}`, { title: newTitle });
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
      );
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  }, []);

  // ─── Feature and Scenario Handlers ─────────────────────
  const handleSelectFeature = useCallback((feature) => {
    setSelectedFeature(feature);
    
    // Auto-create session if none exists for the feature
    // Defensive check: ensure sessions is an array before filtering
    const featureSessions = Array.isArray(sessions) 
      ? sessions.filter(s => s.feature === feature)
      : [];
    if (featureSessions.length === 0) {
      createNewSession(feature, false);
    }
    
    // Reset scenario for non-chat features
    if (feature !== 'chat') {
      setScenario(null);
    }
  }, [sessions, createNewSession]);

  const handleSelectScenario = useCallback(async (key) => {
    const scen = availableScenarios.find(s => s.key === key);
    if (!scen) return;
    
    try {
      const currentChatId = activeSessionIds.chat;
      
      // Check if current chat has content before creating new one
      let shouldCreateNew = true;
      if (currentChatId) {
        const hasContent = await checkSessionContent(currentChatId, 'chat');
        if (!hasContent) {
          // Update existing empty chat with new scenario
          try {
            await api.put(`/chats/${currentChatId}`, {
              scenarioKey: key,
              title: scen.label
            });
            
            setScenario(scen);
            setSessions(prev => 
              prev.map(s => s.id === currentChatId ? 
                { ...s, scenarioKey: key, title: scen.label } : s
              )
            );
            
            closeSidebarOnMobile();
            console.log('Updated existing empty chat with new scenario');
            return;
          } catch (updateError) {
            console.warn('Failed to update existing chat, creating new one:', updateError);
          }
        }
      }

      if (shouldCreateNew) {
        setScenario({ ...scen, loading: true });
        
        const { data } = await api.post('/chats', {
          scenarioKey: key,
          title: scen.label,
          prompt: scen.prompt,
          feature: 'chat'
        });
        
        setScenario(scen);
        setSessions(prev => [data, ...prev]);
        setActiveSessionIds(prev => ({
          ...prev,
          chat: data.id
        }));
        
        closeSidebarOnMobile();
        console.log('Created new scenario chat');
      }
    } catch (error) {
      console.error('Failed to create scenario chat:', error);
      setScenario(null);
    }
  }, [activeSessionIds.chat, checkSessionContent, closeSidebarOnMobile]);

  const handleChangeScenario = useCallback(() => {
    setScenario(null);
    setActiveSessionIds(prev => ({ ...prev, chat: null }));
    window.scrollTo(0, 0);
  }, []);

  // ─── Voice Handler ─────────────────────────────────────
  const handleVoiceChange = useCallback((newVoiceConfig) => {
    try {
      if (!newVoiceConfig?.voiceName) {
        console.warn('Invalid voice configuration received');
        return;
      }
      
      const validatedConfig = {
        ...newVoiceConfig,
        voiceName: newVoiceConfig.voiceName || newVoiceConfig.name,
        name: newVoiceConfig.voiceName || newVoiceConfig.name,
        languageCode: newVoiceConfig.languageCode || 'en-US',
        profile: newVoiceConfig.profile || 'default'
      };
      
      setSelectedVoice(validatedConfig);
      console.log('Voice changed to:', validatedConfig.voiceName);
      
      try {
        localStorage.setItem('selectedVoice', JSON.stringify(validatedConfig));
      } catch (error) {
        console.warn('Could not save voice preference:', error);
      }
    } catch (error) {
      console.error('Error handling voice change:', error);
    }
  }, []);

  // ─── Computed Values ─────────────────────────────────
  const currentSessions = getSessionsByFeature(selectedFeature);
  const displayedSessions = scenario 
    ? currentSessions.filter(s => s.scenarioKey === scenario.key)
    : currentSessions;
  const currentActiveId = getCurrentActiveId();
  const isPickerOpen = selectedFeature === 'chat' && !scenario;

  // Header title logic
  const getHeaderTitle = () => {
    if (viewport.isMobile && sidebarOpen) return '';
    
    if (selectedFeature === 'chat') {
      if (isPickerOpen) return 'Select a Chat Scenario';
      if (scenario) return scenario.label || 'Chat';
      return 'Chat';
    }
    
    return selectedFeature === 'sema' ? 'Sema' : 'Tusome';
  };

  // ─── Event Handlers ─────────────────────────────────────
  const handleNewChat = (forceNew = true) => createNewSession(selectedFeature, forceNew);
  const handleNewSession = () => createNewSession(selectedFeature, true);
  const handleToggleSidebar = () => setSidebarOpen(prev => !prev);

  // ─── Component Props ─────────────────────────────────────
  const headerProps = {
    feature: selectedFeature,
    sidebarOpen,
    onToggleSidebar: handleToggleSidebar,
    searchQuery,
    onSearchChange: setSearchQuery,
    title: getHeaderTitle(),
    scenario,
    selectedVoice,
    onVoiceChange: handleVoiceChange,
    onChangeScenario: handleChangeScenario,
    userName: user?.name,
    onLogout: logout,
    usageSummary
  };

  const sidebarProps = {
    selectedFeature,
    onSelectFeature: handleSelectFeature,
    onNewChat: handleNewChat,
    chatInstances: displayedSessions,
    activeChatId: currentActiveId,
    onSelectChat: selectSession,
    onRenameChat: renameSession,
    onDeleteChat: deleteSession,
    currentScenarioKey: scenario?.key,
    hasCurrentChatContent: () => checkSessionContent(currentActiveId, selectedFeature),
    usageSummary
  };

  // ─── Render ─────────────────────────────────────────────
  if (!user) return <div>Loading user...</div>;

  return (
    <div className="app-container flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar - Mobile overlay on small screens */}
      {sidebarOpen && (
        <div className={`flex-shrink-0 ${viewport.isMobile ? 'absolute inset-y-0 left-0 z-50 w-80' : ''}`}>
          <ChatSidebar {...sidebarProps} />
        </div>
      )}
      
      {/* Mobile backdrop */}
      {viewport.isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Feature Header */}
        <div className="flex-shrink-0">
          <FeatureHeader {...headerProps} />
        </div>
        
        {/* Main Content - properly positioned below header with consistent spacing */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {/* Chat Feature - Scenario Picker */}
          {selectedFeature === 'chat' && !scenario && (
            <div className="h-full min-h-0">
              <ScenarioPicker 
                scenarios={availableScenarios} 
                onSelect={handleSelectScenario}
                onClose={null}
              />
            </div>
          )}
          
          {/* Chat Feature - Selected Scenario Interface */}
          {selectedFeature === 'chat' && scenario && (
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {scenario.label}
                        </h2>
                        {scenario.subtitle && (
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                            {scenario.subtitle}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleChangeScenario}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Change Scenario
                      </button>
                    </div>
                    <div className="flex items-center justify-center py-8 md:py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                          Loading chat interface...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sema Feature */}
          {selectedFeature === 'sema' && (
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
                    {/* Cache buster indicator */}
                    <div className="bg-green-200 dark:bg-green-800 p-2 mb-4 rounded text-center text-sm">
                      🚀 SEMA INTERFACE - Updated v1.2.3
                    </div>
                    <div className="flex items-center mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          Sema - Speech Enhancement
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                          Advanced speech therapy and pronunciation practice
                        </p>
                      </div>
                    </div>
                    
                    {/* Sema Interface Content */}
                    <div className="space-y-4 md:space-y-6">
                      {/* Quick Start Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pronunciation Practice</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Work on specific sounds and words</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fluency Training</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Improve speech flow and rhythm</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Voice Analysis</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Get detailed feedback on your speech</p>
                        </div>
                      </div>

                      <div className="text-center py-8">
                        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                          Start Speech Session
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tusome Feature */}
          {selectedFeature === 'tusome' && (
            <div className="h-full min-h-0 flex flex-col">
              <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
                    {/* Cache buster indicator */}
                    <div className="bg-orange-200 dark:bg-orange-800 p-2 mb-4 rounded text-center text-sm">
                      📚 TUSOME INTERFACE - Updated v1.2.3
                    </div>
                    <div className="flex items-center mb-4 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          Tusome - Reading Practice
                        </h2>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                          Interactive reading exercises and comprehension training
                        </p>
                      </div>
                    </div>
                    
                    {/* Tusome Interface Content */}
                    <div className="space-y-4 md:space-y-6">
                      {/* Reading Levels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Beginner</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Simple words and sentences</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Intermediate</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Short paragraphs and stories</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Advanced</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Complex texts and articles</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Comprehension</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Reading with questions</p>
                        </div>
                      </div>

                      <div className="text-center py-8">
                        <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                          Start Reading Session
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}