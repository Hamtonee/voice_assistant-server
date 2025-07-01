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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#181c2a',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        background: '#1f2437',
        borderBottom: '1px solid #23263a',
        height: '64px',
      }}>
        {isMobile && (
          <button
            onClick={onToggleChatList}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              marginRight: '16px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '20px',
            }}
          >
            ☰
          </button>
        )}
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
        }}>
          <img
            src={session.scenario.image}
            alt={session.scenario.title}
            width={40}
            height={40}
            style={{
              borderRadius: '8px',
              marginRight: '12px',
            }}
          />
          
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0,
            }}>
              {session.scenario.title}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: '4px 0 0 0',
            }}>
              {session.scenario.description}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        {session.messages.map((message, index) => (
          <div
            key={message.id || index}
            style={{
              display: 'flex',
              flexDirection: message.isUser ? 'row-reverse' : 'row',
              marginBottom: '24px',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              marginLeft: message.isUser ? '12px' : 0,
              marginRight: message.isUser ? 0 : '12px',
            }}>
              <img
                src={message.isUser ? '/assets/images/user-avatar.webp' : session.scenario.assistantAvatar}
                alt={message.isUser ? 'User' : 'Assistant'}
                width={40}
                height={40}
              />
            </div>

            {/* Message Content */}
            <div style={{
              maxWidth: '70%',
              background: message.isUser ? '#2563eb' : '#1f2437',
              padding: '16px',
              borderRadius: '12px',
              color: '#fff',
            }}>
              <p style={{
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.5,
              }}>
                {message.content}
              </p>
              
              {message.audioUrl && (
                <div style={{
                  marginTop: '8px',
                }}>
                  <audio
                    controls
                    src={message.audioUrl}
                    style={{
                      width: '100%',
                      height: '40px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '24px',
        background: '#1f2437',
        borderTop: '1px solid #23263a',
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button
            style={{
              padding: '12px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            🎤
          </button>
          
          <input
            type="text"
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#181c2a',
              border: '1px solid #23263a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
            }}
          />
          
          <button
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
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