import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiSend, FiVolume2, FiMoreVertical } from 'react-icons/fi';
import '../assets/styles/ChatDetail.css';
// import { Mic, Send, ChevronDown, AlertCircle, Loader, Volume2, X, MicOff, Headphones } from 'lucide-react';
// import { createVoiceConfig } from '../data/ttsVoices';
import PropTypes from 'prop-types';
// import OptimizedImage from './ui/OptimizedImage';
import api from '../api';

const _AUTO_SEND_DELAY = 3000;
const _ALWAYS_IDLE_TIMEOUT = 5000;
const _HISTORY_WINDOW = 10;
const _MAX_API_RETRIES = 3;
const _AUDIO_TIMEOUT = 30000;
const _CHAT_ROLEPLAY_ENDPOINT = '/api/chat/roleplay';

// Safe environment variable access
const getChatRoleplayEndpoint = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CHAT_ROLEPLAY_ENDPOINT) || '/chat/roleplay';
  } catch (error) {
    console.warn('Failed to access REACT_APP_CHAT_ROLEPLAY_ENDPOINT, using fallback');
    return '/chat/roleplay';
  }
};

const _chatRoleplayEndpoint = getChatRoleplayEndpoint();

const ChatDetail = ({ 
  session, 
  sessionId, 
  scenario, 
  selectedVoice, 
  viewport, 
  sidebarState, 
  onNewSession, 
  onToggleChatList, 
  isMobile 
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle both session object and individual props
  const currentSession = session || {
    id: sessionId,
    scenario: scenario || {},
    messages: []
  };
  
  const currentScenario = session?.scenario || scenario || {};
  
  // Fallback values for scenario properties
  const scenarioTitle = currentScenario.title || currentScenario.label || 'Chat Session';
  const scenarioDescription = currentScenario.description || 'Start your conversation';
  const scenarioImage = currentScenario.image || '/assets/images/default-scenario.webp';
  const assistantAvatar = currentScenario.assistantAvatar || '/assets/images/assistant-avatar.webp';
  const scenarioPrompt = currentScenario.prompt || '';
  const aiRole = currentScenario.aiRole || 'Assistant';
  const userRole = currentScenario.userRole || 'User';

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(prev => prev + transcript);
          setIsRecording(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError('Speech recognition failed. Please try again.');
          setIsRecording(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add initial instruction message when scenario is set
  useEffect(() => {
    if (currentScenario.key && messages.length === 0) {
      const instructionMessage = {
        id: 'instruction-' + Date.now(),
        content: `${scenarioPrompt}\n\nYou are the ${userRole}, and I'll be the ${aiRole}. Start the conversation whenever you're ready!`,
        isUser: false,
        isInstruction: true,
        timestamp: new Date()
      };
      setMessages([instructionMessage]);
    }
  }, [currentScenario.key, scenarioPrompt, userRole, aiRole, messages.length]);

  // Handle voice recording
  const handleVoiceToggle = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setError(null);
      setIsRecording(true);
      recognitionRef.current.start();
    }
  }, [isRecording]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = inputText.trim();
    if (!trimmedMessage || isProcessing) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      content: trimmedMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.post('/chat/roleplay', {
        message: trimmedMessage,
        scenario: currentScenario.key,
        sessionId: currentSession.id || sessionId,
        voice: selectedVoice?.name || 'en-US-Standard-A'
      });

      const aiMessage = {
        id: 'ai-' + Date.now(),
        content: response.data.message,
        isUser: false,
        audioUrl: response.data.audioUrl,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      setInputText(trimmedMessage); // Restore the input
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, currentScenario.key, currentSession.id, sessionId, selectedVoice]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle audio playback
  const handlePlayAudio = useCallback((audioUrl, messageId) => {
    if (isPlaying === messageId) {
      audioRef.current?.pause();
      setIsPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(messageId);
      
      audioRef.current.onended = () => setIsPlaying(null);
      audioRef.current.onerror = () => {
        setIsPlaying(null);
        setError('Failed to play audio');
      };
    }
  }, [isPlaying]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  return (
    <div className="chat-detail">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="chat-header">
        {isMobile && (
          <button
            className="chat-header__toggle"
            onClick={onToggleChatList}
            aria-label="Back to chat list"
          >
            ←
          </button>
        )}
        <div className="chat-header__info">
          <img
            className="chat-header__avatar"
            src={scenarioImage}
            alt={scenarioTitle}
            width={40}
            height={40}
          />
          <div className="chat-header__meta">
            <h2 className="chat-header__title">{scenarioTitle}</h2>
            <p className="chat-header__desc">
              {aiRole} • {messages.filter(m => !m.isInstruction).length} messages
            </p>
          </div>
        </div>
        <button className="chat-header__options" aria-label="Chat options">
          <FiMoreVertical size={20} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.isUser ? 'user' : 'bot'} ${message.isInstruction ? 'instruction' : ''}`}
          >
            {!message.isUser && (
              <div className="chat-avatar">
                <img
                  src={assistantAvatar}
                  alt={aiRole}
                  width={32}
                  height={32}
                />
              </div>
            )}
            
            <div className="chat-bubble">
              <div className="chat-bubble__content">
                {message.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              
              {message.audioUrl && (
                <button
                  className={`audio-play-btn ${isPlaying === message.id ? 'playing' : ''}`}
                  onClick={() => handlePlayAudio(message.audioUrl, message.id)}
                  aria-label={isPlaying === message.id ? 'Pause audio' : 'Play audio'}
                >
                  <FiVolume2 size={16} />
                  {isPlaying === message.id ? 'Playing...' : 'Play'}
                </button>
              )}
              
              <div className="chat-bubble__time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.isUser && (
              <div className="chat-avatar user">
                <img
                  src="/assets/images/user-avatar.webp"
                  alt={userRole}
                  width={32}
                  height={32}
                />
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="chat-message bot">
            <div className="chat-avatar">
              <img
                src={assistantAvatar}
                alt={aiRole}
                width={32}
                height={32}
              />
            </div>
            <div className="chat-bubble typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <button
            className={`voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleVoiceToggle}
            disabled={isProcessing}
            aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {isRecording ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
          
          <div className="text-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-text-field"
              placeholder={`Message ${aiRole}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              rows={1}
            />
          </div>
          
          <button
            className={`send-btn ${inputText.trim() ? 'active' : ''}`}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            aria-label="Send message"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

ChatDetail.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string,
    scenario: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      image: PropTypes.string,
      assistantAvatar: PropTypes.string,
    }),
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        content: PropTypes.string.isRequired,
        isUser: PropTypes.bool.isRequired,
        audioUrl: PropTypes.string,
      })
    ),
  }),
  sessionId: PropTypes.string,
  scenario: PropTypes.shape({
    key: PropTypes.string,
    title: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    assistantAvatar: PropTypes.string,
    prompt: PropTypes.string,
    aiRole: PropTypes.string,
    userRole: PropTypes.string,
  }),
  selectedVoice: PropTypes.object,
  viewport: PropTypes.object,
  sidebarState: PropTypes.object,
  onNewSession: PropTypes.func,
  onToggleChatList: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default ChatDetail;