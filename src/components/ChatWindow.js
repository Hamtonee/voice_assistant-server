// src/components/ChatWindow.js - ENHANCED VERSION WITH UPDATED FEATURE NAMES
import React, { useState, useEffect, useContext } from 'react';
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

export default function ChatWindow() {
  const { user, logout } = useContext(AuthContext);

  // ─── SIMPLIFIED Responsive State ─────────────────────
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768
  });

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Enhanced viewport tracking
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;

      setViewport({ width, height, isMobile });

      // Auto-close sidebar on mobile, auto-open on desktop
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!isMobile && !sidebarOpen && width > 1024) {
        setSidebarOpen(true);
      }
    };
    
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [sidebarOpen]);

  // ─── SIMPLIFIED Sidebar Management ──────────────────────
  useEffect(() => {
    // Apply single sidebar class to body for CSS targeting
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
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

  // ─── Feature State ─────────────────────
  const [selectedFeature, setSelectedFeature] = useState('chat');

  // ─── Chat sessions ──────────────────────────────────
  const [chatInstances, setChatInstances] = useState([]);
  const [activeChatId,   setActiveChatId]   = useState(null);
  const [scenario,       setScenario]       = useState(null);

  // ─── SpeechCoach ("sema") ───────────────────────────
  const [semaInstances,    setSemaInstances]    = useState([]);
  const [activeSemaChatId, setActiveSemaChatId] = useState(null);

  // ─── Reading ("tusome") ────────────────────────────
  const [tusomeInstances, setTusomeInstances] = useState([]);
  const [activeTusomeId,  setActiveTusomeId]  = useState(null);

  // ─── UI state ──────────────────────────────────
  const [titleGenQueue, setTitleGenQueue]   = useState(new Set());
  const [searchQuery,   setSearchQuery]     = useState('');
  const [alwaysListen,  setAlwaysListen]    = useState(false);

  // ─── NEW: Daily usage and session management state ─────
  const [usageSummary, setUsageSummary] = useState(null);

  // ─── Voice System ─────────────────────
  const [selectedVoice, setSelectedVoice] = useState(() => {
    const defaultVoiceName = 'en-US-Chirp3-HD-Aoede';
    return createVoiceConfig(defaultVoiceName, 'default');
  });

  const [voiceSystemReady, setVoiceSystemReady] = useState(false);

  // Voice initialization
  useEffect(() => {
    const initializeVoiceSystem = async () => {
      try {
        console.log('Initializing voice system...');
        
        if (!selectedVoice || !selectedVoice.voiceName) {
          const defaultConfig = createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
          setSelectedVoice(defaultConfig);
        }
        
        setVoiceSystemReady(true);
        console.log('Voice system ready');
      } catch (error) {
        console.error('Voice system initialization error:', error);
        const fallbackConfig = createVoiceConfig('en-US-Chirp3-HD-Aoede', 'default');
        setSelectedVoice(fallbackConfig);
        setVoiceSystemReady(true);
      }
    };

    initializeVoiceSystem();
  }, [selectedVoice]);

  // Voice change handler
  const handleVoiceChange = (newVoiceConfig) => {
    try {
      if (!newVoiceConfig || !newVoiceConfig.voiceName) {
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
  };

  // Load saved voice preference
  useEffect(() => {
    try {
      const savedVoice = localStorage.getItem('selectedVoice');
      if (savedVoice) {
        const parsedVoice = JSON.parse(savedVoice);
        const voiceExists = ttsVoices.find(v => v.name === parsedVoice.voiceName);
        if (voiceExists) {
          setSelectedVoice(parsedVoice);
          console.log('Restored saved voice:', parsedVoice.voiceName);
        }
      }
    } catch (error) {
      console.log('Could not load saved voice preference:', error);
    }
  }, []);

  // ─── NEW: Fetch usage summary on component mount and periodically ─────
  useEffect(() => {
    const fetchUsageSummary = async () => {
      try {
        const { data } = await api.get('/usage-summary');
        setUsageSummary(data.usage_summary);
      } catch (error) {
        console.error('Failed to fetch usage summary:', error);
      }
    };

    fetchUsageSummary();
    
    // Fetch usage summary every 30 minutes
    const intervalId = setInterval(fetchUsageSummary, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // ─── Load sessions whenever feature changes ─────
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res   = await api.get('/chats');
        const chats = res.data || [];

        if (selectedFeature === 'chat') {
          const filtered = chats.filter(c => c.feature === 'chat');
          setChatInstances(filtered);
          if (filtered.length) setActiveChatId(filtered[0].id);

        } else if (selectedFeature === 'sema') {
          const filtered = chats.filter(c => c.feature === 'sema');
          setSemaInstances(filtered);
          if (filtered.length) setActiveSemaChatId(filtered[0].id);

        } else {
          const filtered = chats.filter(c => c.feature === 'tusome');
          setTusomeInstances(filtered);
          if (filtered.length) setActiveTusomeId(filtered[0].id);
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
      }
    };

    fetchChats();
    if (selectedFeature !== 'chat') {
      setScenario(null);
    }
  }, [selectedFeature]);

  // ─── Auto-generate titles for new chats ────────────
  useEffect(() => {
    if (selectedFeature !== 'chat') return;

    chatInstances.forEach(chat => {
      if (!chat.title && !titleGenQueue.has(chat.id) && chat.messages.length >= 2) {
        setTitleGenQueue(prev => new Set([...prev, chat.id]));
        const msgs = chat.messages
          .filter(m => m.role === 'user')
          .slice(0,2)
          .map(m => m.text);

        generateTitleForChat('chat', scenario?.label, chat.id, msgs)
          .then(title => {
            setChatInstances(prev =>
              prev.map(c => c.id === chat.id ? { ...c, title } : c)
            );
            setTitleGenQueue(prev => {
              const next = new Set([...prev]);
              next.delete(chat.id);
              return next;
            });
          });
      }
    });
  }, [chatInstances, scenario, selectedFeature, titleGenQueue]);

  // ─── NEW: Enhanced session creation with validation ───────────────────────────
  
  // Check if current chat has meaningful content
  const checkCurrentChatContent = async (chatId, feature) => {
    if (!chatId) return false;
    
    try {
      const { data } = await api.get(`/chats/${chatId}`);
      // Check if chat has any user messages (meaningful content)
      const hasUserMessages = data.messages?.some(msg => msg.role === 'user');
      return hasUserMessages;
    } catch (error) {
      console.error('Error checking chat content:', error);
      return false;
    }
  };

  const handleNewSemaChat = async (forceNew = true) => {
    try {
      // Check if current session has content before creating new one
      if (forceNew && activeSemaChatId) {
        const hasContent = await checkCurrentChatContent(activeSemaChatId, 'sema');
        if (!hasContent) {
          console.log('Current sema session is empty, not creating new one');
          return;
        }
      }

      const { data } = await api.post('/chats/feature', {
        feature: 'sema',
        title:   'Sema Session',
        prompt:  'Welcome to Sema! How can I help you practice speaking?',
      });
      setSemaInstances(prev => [data, ...prev]);
      setActiveSemaChatId(data.id);
      
      if (viewport.isMobile) {
        setSidebarOpen(false);
      }

      console.log('Created new sema session:', data.id);
    } catch (err) {
      console.error('Failed to create new sema session', err);
    }
  };

  const handleNewTusomeChat = async (forceNew = true) => {
    try {
      // Check if current session has content before creating new one
      if (forceNew && activeTusomeId) {
        const hasContent = await checkCurrentChatContent(activeTusomeId, 'tusome');
        if (!hasContent) {
          console.log('Current tusome session is empty, not creating new one');
          return;
        }
      }

      const { data } = await api.post('/chats/feature', {
        feature: 'tusome',
        title:   'New Reading',
      });
      setTusomeInstances(prev => [data, ...prev]);
      setActiveTusomeId(data.id);
      
      if (viewport.isMobile) {
        setSidebarOpen(false);
      }

      console.log('Created new tusome session:', data.id);
    } catch (err) {
      console.error('Failed to create new tusome session', err);
    }
  };

  // ─── Enhanced scenario handlers with validation ──────────────────────
  const handleSelectScenario = async key => {
    console.log('Scenario selection started:', key);
    const scen = availableScenarios.find(s => s.key === key);
    if (!scen) return;
    
    try {
      // Check if current chat has content before creating new one
      let shouldCreateNew = true;
      if (activeChatId) {
        const hasContent = await checkCurrentChatContent(activeChatId, 'chat');
        if (!hasContent) {
          console.log('Current chat is empty, reusing for new scenario');
          shouldCreateNew = false;
          
          // Update existing empty chat with new scenario
          try {
            await api.put(`/chats/${activeChatId}`, {
              scenarioKey: key,
              title: scen.label
            });
            
            setScenario(scen);
            setChatInstances(prev => 
              prev.map(c => c.id === activeChatId ? { ...c, scenarioKey: key, title: scen.label } : c)
            );
            
            if (viewport.isMobile) {
              setSidebarOpen(false);
            }
            
            console.log('Updated existing empty chat with new scenario');
            return;
          } catch (updateError) {
            console.warn('Failed to update existing chat, creating new one:', updateError);
            shouldCreateNew = true;
          }
        }
      }

      if (shouldCreateNew) {
        setScenario({ ...scen, loading: true });
        
        const { data } = await api.post('/chats/scenario', {
          scenarioKey: key,
          title:       scen.label,
          prompt:      scen.prompt,
        });
        
        setScenario(scen);
        setChatInstances(prev => [data, ...prev]);
        setActiveChatId(data.id);
        
        if (viewport.isMobile) {
          setSidebarOpen(false);
        }
        
        console.log('Scenario selection completed - new chat created');
      }
    } catch (err) {
      console.error('Failed to create new scenario chat', err);
      setScenario(null);
    }
  };

  const handleChangeScenario = () => {
    setScenario(null);
    setActiveChatId(null);
    window.scrollTo(0, 0);
  };

  // ─── Loading existing chat ─────────────────────────
  const handleLoadChat = id => {
    setActiveChatId(id);
    const sess = chatInstances.find(c => c.id === id);
    setScenario(
      sess?.scenarioKey
        ? availableScenarios.find(s => s.key === sess.scenarioKey)
        : null
    );
    
    if (viewport.isMobile) {
      setSidebarOpen(false);
    }
  };

  // ─── Feature & chat selection ──────────────────────
  const handleSelectFeature = feat => {
    setSelectedFeature(feat);
    if (feat === 'sema') handleNewSemaChat(false); // Don't force new on feature switch
    else if (feat === 'tusome') handleNewTusomeChat(false); // Don't force new on feature switch
    else handleChangeScenario();
  };

  // ─── Enhanced new chat handler with validation parameter ──────────────────────
  const handleNewChat = (forceNew = true) => {
    if (selectedFeature === 'sema') handleNewSemaChat(forceNew);
    else if (selectedFeature === 'tusome') handleNewTusomeChat(forceNew);
    else if (forceNew) {
      // For chat feature, creating "new chat" means going to scenario picker
      handleChangeScenario();
    } else {
      // Don't create new, just reset to scenario picker
      handleChangeScenario();
    }
  };

  const handleSelectChat = id => {
    if (selectedFeature === 'sema')       setActiveSemaChatId(id);
    else if (selectedFeature === 'tusome') setActiveTusomeId(id);
    else handleLoadChat(id);
  };

  // ─── NEW: Handle new session creation from child components ─────
  const handleNewSpeechSession = (newSessionId) => {
    console.log('Creating new sema session from child:', newSessionId);
    handleNewSemaChat(true);
  };

  const handleNewReadingSession = (newSessionId) => {
    console.log('Creating new tusome session from child:', newSessionId);
    handleNewTusomeChat(true);
  };

  // Toggle sidebar
  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Handle delete and rename
  const handleRenameChat = async (id, newTitle) => {
    try {
      await api.put(`/chats/${id}`, { title: newTitle });
      
      if (selectedFeature === 'chat') {
        setChatInstances(prev => 
          prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        );
      } else if (selectedFeature === 'sema') {
        setSemaInstances(prev => 
          prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        );
      } else {
        setTusomeInstances(prev => 
          prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        );
      }
    } catch (err) {
      console.error('Failed to rename chat', err);
    }
  };

  const handleDeleteChat = async (id) => {
    try {
      await api.delete(`/chats/${id}`);
      
      if (selectedFeature === 'chat') {
        setChatInstances(prev => {
          const filtered = prev.filter(c => c.id !== id);
          if (activeChatId === id && filtered.length) {
            setActiveChatId(filtered[0].id);
            const firstChat = filtered[0];
            setScenario(
              firstChat?.scenarioKey
                ? availableScenarios.find(s => s.key === firstChat.scenarioKey)
                : null
            );
          } else if (activeChatId === id) {
            setActiveChatId(null);
            setScenario(null);
          }
          return filtered;
        });
      } else if (selectedFeature === 'sema') {
        setSemaInstances(prev => {
          const filtered = prev.filter(c => c.id !== id);
          if (activeSemaChatId === id && filtered.length) {
            setActiveSemaChatId(filtered[0].id);
          } else if (activeSemaChatId === id && filtered.length === 0) {
            handleNewSemaChat(false); // Create new session when last one is deleted
          }
          return filtered;
        });
      } else {
        setTusomeInstances(prev => {
          const filtered = prev.filter(c => c.id !== id);
          if (activeTusomeId === id && filtered.length) {
            setActiveTusomeId(filtered[0].id);
          } else if (activeTusomeId === id && filtered.length === 0) {
            handleNewTusomeChat(false); // Create new session when last one is deleted
          }
          return filtered;
        });
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  // ─── NEW: Check if current chat has content (for sidebar) ─────
  const hasCurrentChatContent = async () => {
    const currentId = selectedFeature === 'sema' 
      ? activeSemaChatId 
      : selectedFeature === 'tusome' 
        ? activeTusomeId 
        : activeChatId;
        
    if (!currentId) return false;
    
    return await checkCurrentChatContent(currentId, selectedFeature);
  };

  // ─── Render Logic ─────────────────────
  const displayedChatInstances = scenario
    ? chatInstances.filter(c => c.scenarioKey === scenario.key)
    : chatInstances;

  const currentInstances = selectedFeature === 'sema'
    ? semaInstances
    : selectedFeature === 'tusome'
      ? tusomeInstances
      : displayedChatInstances;

  const currentActiveId = selectedFeature === 'sema'
    ? activeSemaChatId
    : selectedFeature === 'tusome'
      ? activeTusomeId
      : activeChatId;

  const isPickerOpen = selectedFeature === 'chat' && !scenario;

  // FIXED: Updated header title logic with new feature names
  let headerTitle = '';
  if (selectedFeature === 'chat') {
    if (isPickerOpen) {
      // Scenario picker is open
      headerTitle = (!viewport.isMobile || !sidebarOpen) ? 'Select a Chat Scenario' : '';
    } else if (scenario) {
      // Scenario is selected - show scenario name only when sidebar is closed on mobile
      headerTitle = (!viewport.isMobile || !sidebarOpen) ? (scenario.label || 'Chat') : '';
    } else {
      // Fallback for chat feature
      headerTitle = (!viewport.isMobile || !sidebarOpen) ? 'Chat' : '';
    }
  } else if (selectedFeature === 'sema') {
    headerTitle = (!viewport.isMobile || !sidebarOpen) ? 'Sema' : '';
  } else {
    headerTitle = (!viewport.isMobile || !sidebarOpen) ? 'Tusome' : '';
  }

  // Header props
  const headerProps = {
    feature:          selectedFeature,
    sidebarOpen:      sidebarOpen,
    onToggleSidebar:  handleToggleSidebar,
    searchQuery,
    onSearchChange:   setSearchQuery,
    title:            headerTitle,
    scenario,
    selectedVoice:    selectedVoice,
    onVoiceChange:    handleVoiceChange,
    onChangeScenario: handleChangeScenario,
    userName:         user?.name,
    onLogout:         logout,
    usageSummary:     usageSummary // Pass usage summary to header
  };

  if (!user) return null;

  return (
    <>
      <FeatureHeader {...headerProps} />

      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside className="sidebar">
          <ChatSidebar
            selectedFeature={selectedFeature}
            onSelectFeature={handleSelectFeature}
            onNewChat={handleNewChat}
            chatInstances={currentInstances}
            activeChatId={currentActiveId}
            onSelectChat={handleSelectChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
            currentScenarioKey={scenario?.key}
            hasCurrentChatContent={hasCurrentChatContent}
            usageSummary={usageSummary}
          />
        </aside>

        {/* SIMPLIFIED Scenario picker */}
        {isPickerOpen && (
          <div className="scenario-wrapper">
            <ScenarioPicker
              scenarios={availableScenarios}
              onSelect={handleSelectScenario}
              onClose={handleChangeScenario}
              usageSummary={usageSummary} // Pass usage summary to scenario picker
            />
          </div>
        )}

        {/* Main content when not showing picker */}
        {(!isPickerOpen || selectedFeature !== 'chat') && voiceSystemReady && (
          <div className="chat-content">
            {selectedFeature === 'sema' && (
              <SpeechCoach
                sessionId={activeSemaChatId}
                selectedVoice={selectedVoice}
                sidebarOpen={sidebarOpen}
                onNewSession={handleNewSpeechSession}
              />
            )}

            {selectedFeature === 'tusome' && (
              <ReadingPassage 
                sessionId={activeTusomeId} 
                selectedVoice={selectedVoice}
                viewport={viewport}
                sidebarState={{ isOpen: sidebarOpen }}
                onNewSession={handleNewReadingSession}
              />
            )}

            {selectedFeature === 'chat' && scenario && (
              <ChatDetail
                chatInstances={chatInstances}
                setChatInstances={setChatInstances}
                activeChatId={activeChatId}
                scenario={scenario}
                alwaysListen={alwaysListen}
                selectedVoice={selectedVoice}
                onToggleListen={setAlwaysListen}
                viewport={viewport}
                sidebarOpen={sidebarOpen}
              />
            )}
          </div>
        )}
        
        {/* Loading state for voice system */}
        {!voiceSystemReady && (
          <div className="voice-system-loading">
            <div className="loading-spinner">🎙️</div>
            <p>Initializing voice system...</p>
          </div>
        )}
      </div>
    </>
  );
}