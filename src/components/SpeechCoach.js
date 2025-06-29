import React, { useState, useEffect, useRef, useCallback } from 'react';
import TTSService from '../services/TTSService';
import api from '../api';
import '../assets/styles/SpeechCoach.css';
import { FiMic, FiMicOff, FiSend, FiTrash2, FiBarChart, FiX, FiChevronDown } from 'react-icons/fi';
import { handleApiError, handleSpeechError, logError } from '../utils/errorHandler';
import ErrorDisplay from './ui/ErrorDisplay';
import { LoadingButton, InlineLoader } from './ui/LoadingStates';

export default function SpeechCoach({ 
  sessionId, 
  selectedVoice, 
  sidebarOpen, 
  onNewSession,
  chatInstances = [],
  setChatInstances = () => {},
  activeChatId = null,
  scenario = null,
  alwaysListen = false,
  onToggleListen = () => {}
}) {
  // Speech recognition and TTS state
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [ttsAvailable, setTTSAvailable] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Chat-style conversation state
  const [messages, setMessages] = useState([]);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [progressStats, setProgressStats] = useState({
    interactions: 0,
    vocabulary: 0,
    proverbs: 0,
    duration: '0m'
  });
  
  // UI state
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);
  const ttsServiceRef = useRef(null);
  const isUnmountingRef = useRef(false);
  const messagesRef = useRef(null);

  // Initialize speech services
  useEffect(() => {
    isUnmountingRef.current = false;
    ttsServiceRef.current = new TTSService();
    
    const initializeApp = async () => {
      try {
        // Check TTS availability
        const ttsAvailable = await ttsServiceRef.current.checkStatus();
        setTTSAvailable(ttsAvailable);
        
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          setIsSpeechSupported(true);
        } else {
          setIsSpeechSupported(false);
          const speechError = { 
            type: 'SPEECH_RECOGNITION_ERROR', 
            message: 'Speech recognition is not supported in your browser.' 
          };
          setError(speechError);
        }
      } catch (error) {
        const handledError = handleSpeechError(error, 'Speech Service Initialization');
        setError(handledError);
      }
    };

    initializeApp();

    return () => {
      isUnmountingRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (ttsRef.current) {
        ttsRef.current.pause();
        ttsRef.current = null;
      }
    };
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const messagesElement = messagesRef.current;
    
    const handleScroll = () => {
      if (messagesElement) {
        const { scrollTop, scrollHeight, clientHeight } = messagesElement;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    if (messagesElement) {
      messagesElement.addEventListener('scroll', handleScroll);
      return () => {
        // Store ref value in closure to avoid stale ref in cleanup
        messagesElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!recognitionRef.current || isRecording) return;

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setError(null);

      recognitionRef.current.onresult = (event) => {
        if (event.results && Array.isArray(event.results)) {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setInputText(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        const speechError = handleSpeechError(
          { type: 'SPEECH_RECOGNITION_ERROR', message: event.error }, 
          'Speech Recognition'
        );
        setError(speechError);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (!isUnmountingRef.current) {
          setIsRecording(false);
        }
      };
    } catch (error) {
      const speechError = handleSpeechError(error, 'Start Recording');
      setError(speechError);
      setIsRecording(false);
    }
  }, [isRecording]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
    } catch (error) {
      const speechError = handleSpeechError(error, 'Stop Recording');
      setError(speechError);
    }
  }, [isRecording]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) {
      const validationError = {
        type: 'VALIDATION_ERROR',
        message: 'Please say something before submitting.'
      };
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      const { data } = await api.post('/speech-coach', {
        session_id: sessionId,
        transcript: userMessage.content,
        voice: selectedVoice
      });

      // Add coach response to chat
      const coachMessage = {
        id: Date.now() + 1,
        type: 'coach',
        content: data.feedbackText,
        correctedSentence: data.correctedSentence,
        analysis: data.analysis,
        suggestions: data.suggestions || [],
        vocabulary: data.vocabulary_introduced || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, coachMessage]);

      // Update progress stats
      setProgressStats(prev => ({
        ...prev,
        interactions: prev.interactions + 1,
        vocabulary: prev.vocabulary + (data.vocabulary_introduced?.length || 0)
      }));

      // Play TTS feedback
      if (data.feedbackAudio && ttsServiceRef.current) {
        const audio = new Audio(`data:audio/mp3;base64,${data.feedbackAudio}`);
        ttsRef.current = audio;
        
        audio.onended = () => {
          ttsRef.current = null;
        };

        await audio.play();
      }

      // Auto-scroll to bottom
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error('Failed to process speech:', error);
      setError('Failed to process speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, sessionId, selectedVoice, scrollToBottom]);

  // Handle enter key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Clear conversation
  const handleClear = useCallback(() => {
    setMessages([]);
    setInputText('');
    setError(null);
    setProgressStats({
      interactions: 0,
      vocabulary: 0,
      proverbs: 0,
      duration: '0m'
    });
  }, []);

  return (
    <div className={`speech-coach ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Conversation Area */}
      <div className={`conversation-area ${showProgressPanel ? 'progress-visible' : ''}`} ref={messagesRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Start speaking to practice with your AI speech coach!</p>
            <div className="voice-info">
              <p><strong>Voice:</strong> {selectedVoice?.name || 'Default'}</p>
              <p>The coach will provide feedback on pronunciation, grammar, and fluency.</p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <p>{message.content}</p>
              
              {message.correctedSentence && (
                <div className="correction">
                  <small>Corrected: {message.correctedSentence}</small>
                </div>
              )}
              
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="coach-controls">
                  {message.suggestions.slice(0, 3).map((suggestion, index) => (
                    <button key={index} className="suggestion-btn" disabled>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button 
          className={`scroll-to-bottom-btn ${showProgressPanel ? 'progress-visible' : ''}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <FiChevronDown size={24} />
        </button>
      )}

      {/* Progress Panel */}
      {showProgressPanel && (
        <div className="progress-panel">
          <div className="progress-panel-header">
            <h3>
              <FiBarChart size={16} />
              Session Progress
            </h3>
            <button 
              className="progress-panel-close"
              onClick={() => setShowProgressPanel(false)}
              aria-label="Close progress panel"
            >
              <FiX size={16} />
            </button>
          </div>
          
          <div className="progress-stats">
            <div className="progress-stat">
              <div className="progress-stat-value interactions">{progressStats.interactions}</div>
              <div className="progress-stat-label">Interactions</div>
            </div>
            <div className="progress-stat">
              <div className="progress-stat-value vocabulary">{progressStats.vocabulary}</div>
              <div className="progress-stat-label">New Words</div>
            </div>
            <div className="progress-stat">
              <div className="progress-stat-value proverbs">{progressStats.proverbs}</div>
              <div className="progress-stat-label">Proverbs</div>
            </div>
            <div className="progress-stat">
              <div className="progress-stat-value duration">{progressStats.duration}</div>
              <div className="progress-stat-label">Duration</div>
            </div>
          </div>
        </div>
      )}

      {/* Speech Input Container with Integrated Mic */}
      <div className={`speech-input-container ${showProgressPanel ? 'progress-visible' : ''}`}>
        <div className="input-wrapper">
          <textarea
            className="chat-text-field"
            placeholder="Type or speak your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isProcessing}
            rows={1}
          />
          <button
            className={`integrated-mic-btn ${isRecording ? 'listening' : ''} ${!isSpeechSupported ? 'disabled' : ''}`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!isSpeechSupported || isProcessing}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <>
                <FiMicOff size={16} />
                <div className="listening-pulse">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring"></div>
                </div>
              </>
            ) : (
              <FiMic size={16} />
            )}
          </button>
        </div>
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isProcessing}
          aria-label="Send message"
        >
          <FiSend size={18} />
        </button>
      </div>

      {/* Controls Container */}
      <div className={`controls-container ${showProgressPanel ? 'progress-visible' : ''}`}>
        <div className="coach-controls-bar">
          <div className="controls-left">
            <button
              className="control-btn clear-btn"
              onClick={handleClear}
              disabled={isProcessing || messages.length === 0}
            >
              <FiTrash2 size={16} />
              Clear
            </button>
          </div>
          
          <div className="controls-right">
            <button
              className={`control-btn progress-toggle-btn ${showProgressPanel ? 'active' : ''}`}
              onClick={() => setShowProgressPanel(!showProgressPanel)}
            >
              <FiBarChart size={16} />
              Progress
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Close error">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Browser Warning */}
      {!isSpeechSupported && (
        <div className="browser-warning">
          <p>
            Speech recognition is not supported in your browser.
            Please try using Chrome, Edge, or Safari.
          </p>
        </div>
      )}

      {!ttsAvailable && (
        <div className="browser-warning">
          <p>
            Text-to-speech service is currently unavailable.
            You will not hear audio feedback.
          </p>
        </div>
      )}
    </div>
  );
}