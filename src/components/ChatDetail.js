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

const ChatDetail = ({ session, onToggleChatList, isMobile }) => {
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
            src={session.scenario.image}
            alt={session.scenario.title}
            width={40}
            height={40}
          />
          <div className="chat-header__meta">
            <h2 className="chat-header__title">{session.scenario.title}</h2>
            <p className="chat-header__desc">{session.scenario.description}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {session.messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`chat-message${message.isUser ? ' user' : ' bot'}`}
          >
            <div className="chat-avatar">
              <img
                src={message.isUser ? '/assets/images/user-avatar.webp' : session.scenario.assistantAvatar}
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
        ))}
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
    id: PropTypes.string.isRequired,
    scenario: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      assistantAvatar: PropTypes.string.isRequired,
    }).isRequired,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        content: PropTypes.string.isRequired,
        isUser: PropTypes.bool.isRequired,
        audioUrl: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
  onToggleChatList: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default ChatDetail;