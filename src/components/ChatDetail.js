import React from 'react';
import '../assets/styles/ChatDetail.css';
// import { Mic, Send, ChevronDown, AlertCircle, Loader, Volume2, X, MicOff, Headphones } from 'lucide-react';
// import { createVoiceConfig } from '../data/ttsVoices';
import PropTypes from 'prop-types';
// import OptimizedImage from './ui/OptimizedImage';

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
  // Handle both session object and individual props
  const currentSession = session || {
    id: sessionId,
    scenario: scenario || {},
    messages: []
  };
  
  const currentScenario = session?.scenario || scenario || {};
  const messages = session?.messages || [];
  
  // Fallback values for scenario properties
  const scenarioTitle = currentScenario.title || currentScenario.label || 'Chat Session';
  const scenarioDescription = currentScenario.description || 'Start your conversation';
  const scenarioImage = currentScenario.image || '/assets/images/default-scenario.webp';
  const assistantAvatar = currentScenario.assistantAvatar || '/assets/images/assistant-avatar.webp';

  return (
    <div className="chat-detail">
      {/* Header */}
      <div className="chat-header">
        {isMobile && (
          <button
            className="chat-header__toggle"
            onClick={onToggleChatList}
            aria-label="Back to chat list"
          >
            &#9776;
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
            <p className="chat-header__desc">{scenarioDescription}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>Start your conversation with {scenarioTitle}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`chat-message${message.isUser ? ' user' : ' bot'}`}
            >
              <div className="chat-avatar">
                <img
                  src={message.isUser ? '/assets/images/user-avatar.webp' : assistantAvatar}
                  alt={message.isUser ? 'User' : 'Assistant'}
                  width={40}
                  height={40}
                />
              </div>
              <div className="chat-bubble">
                <p>{message.content}</p>
                {message.audioUrl && (
                  <div className="chat-audio">
                    <audio controls src={message.audioUrl} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <button className="mic-btn" aria-label="Record audio">
          🎤
        </button>
        <input
          type="text"
          className="chat-text-field"
          placeholder="Type your message..."
        />
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
    title: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    assistantAvatar: PropTypes.string,
  }),
  selectedVoice: PropTypes.object,
  viewport: PropTypes.object,
  sidebarState: PropTypes.object,
  onNewSession: PropTypes.func,
  onToggleChatList: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default ChatDetail;