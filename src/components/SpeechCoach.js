import React, { useState, useEffect, useRef, useCallback } from 'react';
import TTSService from '../services/TTSService';
import api from '../api';
import '../assets/styles/SpeechCoach.css';
import { FiMic, FiMicOff, FiSend, FiTrash2, FiBarChart, FiX, FiChevronDown } from 'react-icons/fi';
import { handleApiError, handleSpeechError } from '../utils/errorHandler';

// Debounce function to prevent rapid-fire state changes
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
  const [isRecording, setIsRecording] = useState(alwaysListen);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
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
  const [browserWarning, setBrowserWarning] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);
  const ttsServiceRef = useRef(null);
  const isUnmountingRef = useRef(false);
  const messagesRef = useRef(null);
  const audioRef = useRef(null);

  // Move cleanup function definition before useEffect
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
    if (ttsRef.current) {
      try {
        ttsRef.current.pause();
        ttsRef.current = null;
      } catch (e) {
        console.warn('Error cleaning up TTS:', e);
      }
    }
  }, []);

  // Move function definitions before useEffect
  const handleRecognitionResult = useCallback((event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    setInputText(prev => prev + finalTranscript);
  }, []);

  const handleRecognitionError = useCallback((event) => {
    console.error('Recognition error:', event.error);
    setError('Speech recognition error: ' + event.error);
  }, []);

  const handleRecognitionEnd = useCallback(() => {
    if (!isUnmountingRef.current) {
      recognitionRef.current = null;
    }
  }, []);

  // useEffect for recognition setup
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = handleRecognitionResult;
      recognitionRef.current.onerror = handleRecognitionError;
      recognitionRef.current.onend = handleRecognitionEnd;
      
      return cleanup;
    }
  }, [recognitionRef, handleRecognitionResult, handleRecognitionError, handleRecognitionEnd, cleanup]);

  // Initialize speech services
  useEffect(() => {
    isUnmountingRef.current = false;
    
    const initializeApp = async () => {
      try {
        // Initialize TTS service first
        if (!ttsServiceRef.current) {
          ttsServiceRef.current = TTSService.getInstance();
          // Initialize TTS
          await ttsServiceRef.current.initialize();
        }
        
        // Initialize speech recognition
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          
          // Bind recognition methods
          if (recognitionRef.current) {
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            setIsSpeechSupported(true);
          }
        } else {
          setIsSpeechSupported(false);
          setBrowserWarning('Speech recognition is not supported in this browser. Please use Chrome or Edge for the best experience.');
        }
      } catch (error) {
        const handledError = handleSpeechError(error, 'Speech Service Initialization');
        setError(handledError);
      }
    };

    initializeApp();

    return () => {
      isUnmountingRef.current = true;
      cleanup();
    };
  }, [cleanup, handleRecognitionResult, handleRecognitionError, handleRecognitionEnd]);

  // Handle scroll detection
  useEffect(() => {
    const messagesElement = messagesRef.current;
    
    const handleScroll = debounce(() => {
      if (messagesElement) {
        const { scrollTop, scrollHeight, clientHeight } = messagesElement;
        setShowScrollButton(scrollHeight - scrollTop > clientHeight + 50);
      }
    }, 100);

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
      setIsRecording(true);
      setError(null);

      recognitionRef.current.start();
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        // Already started, ignore.
      } else {
        console.error('Start Recording Failed:', err);
        setError('Could not start microphone. Please check permissions.');
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
    } catch (err) {
      console.error('Stop Recording Failed:', err);
    }
  }, [isRecording]);

  // Effect to control listening state based on `alwaysListen` prop
  useEffect(() => {
    if (alwaysListen) {
      handleStartRecording();
    } else {
      handleStopRecording();
    }
  }, [alwaysListen, handleStartRecording, handleStopRecording]);

  const handleMicClick = () => {
    if (alwaysListen) {
      onToggleListen(); // Allow parent to change `alwaysListen` state
    } else {
      isRecording ? handleStopRecording() : handleStartRecording();
    }
  };

  // Send message
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setError('Please say something or type a message before sending.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    handleStopRecording();

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: trimmedInput,
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

      setProgressStats(prev => ({
        ...prev,
        interactions: prev.interactions + 1,
        vocabulary: prev.vocabulary + (data.vocabulary_introduced?.length || 0)
      }));

      if (data.feedbackAudio) {
        const audioBlob = new Blob([Buffer.from(data.feedbackAudio, 'base64')], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
      }
    } catch (err) {
      const apiError = handleApiError(err);
      console.error('SendMessage error:', apiError);
      setError(apiError.message || 'Failed to get feedback from the coach.');
      // Restore user input on failure
      setInputText(trimmedInput);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
      // Resume listening if alwaysListen is on
      if (alwaysListen && !isUnmountingRef.current) {
        handleStartRecording();
      }
    }
  }, [inputText, sessionId, selectedVoice, handleStopRecording, alwaysListen, handleStartRecording]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle enter key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Clear conversation
  const handleClear = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire conversation?")) {
      setMessages([]);
      setInputText('');
      setError(null);
      setProgressStats({
        interactions: 0,
        vocabulary: 0,
        proverbs: 0,
        duration: '0m'
      });
      // Potentially call onNewSession to reset server-side state if needed
      if(onNewSession) onNewSession();
    }
  }, [onNewSession]);

  return (
    <div className={`speech-coach ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <audio ref={audioRef} />
      <div className={`conversation-area ${showProgressPanel ? 'progress-visible' : ''}`} ref={messagesRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Press the microphone and start speaking to practice with your AI speech coach.</p>
            <div className="voice-info">
              <p><strong>Coach&apos;s Voice:</strong> {selectedVoice?.name || 'Default'}</p>
              <p>The coach will provide feedback on your pronunciation, grammar, and fluency.</p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <p>{message.content}</p>
              {message.correctedSentence && (
                <div className="correction">
                  <small>Suggestion: <em>{message.correctedSentence}</em></small>
                </div>
              )}
              {message.suggestions?.length > 0 && (
                <div className="coach-controls">
                  {message.suggestions.slice(0, 3).map((suggestion, index) => (
                    <button key={index} className="suggestion-btn" onClick={() => setInputText(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showScrollButton && (
        <button 
          className={`scroll-to-bottom-btn ${showProgressPanel ? 'progress-visible' : ''}`}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <FiChevronDown size={24} />
        </button>
      )}

      {showProgressPanel && (
        <div className="progress-panel">
          <div className="progress-panel-header">
            <h3><FiBarChart /> Session Progress</h3>
            <button className="progress-panel-close" onClick={() => setShowProgressPanel(false)} aria-label="Close progress panel">
              <FiX />
            </button>
          </div>
          <div className="progress-stats">
            {Object.entries(progressStats).map(([key, value]) => (
              <div className="progress-stat" key={key}>
                <div className={`progress-stat-value ${key}`}>{value}</div>
                <div className="progress-stat-label">{key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="speech-controls-wrapper">
        <div className="controls-input-container">
            <div className="enhanced-controls-bar">
                <div className="controls-group left">
                    <button
                        className="action-button clear"
                        onClick={handleClear}
                        disabled={isProcessing || messages.length === 0}
                        aria-label="Clear conversation"
                    >
                        <FiTrash2 size={14} />
                        <span>Clear</span>
                    </button>
                </div>
                <div className="controls-group right">
                     <button
                        className={`action-button progress ${showProgressPanel ? 'active' : ''}`}
                        onClick={() => setShowProgressPanel(prev => !prev)}
                        aria-label="Toggle progress panel"
                    >
                        <FiBarChart size={14} />
                        <span>Progress</span>
                    </button>
                </div>
            </div>
            <div className="enhanced-input-container">
                 <textarea
                    className="enhanced-input-field"
                    placeholder="Type or speak your message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isProcessing}
                    rows={1}
                />
                <button
                    className={`enhanced-mic-button ${isRecording ? 'listening' : ''}`}
                    onClick={handleMicClick}
                    disabled={!isSpeechSupported || isProcessing}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    {isRecording ? <FiMicOff size={18} /> : <FiMic size={18} />}
                    {isRecording && <div className="listening-pulse"><div className="pulse-ring"></div><div className="pulse-ring"></div><div className="pulse-ring"></div></div>}
                </button>
                <button
                    className="enhanced-send-button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isProcessing}
                    aria-label="Send message"
                >
                    {isProcessing ? <span>...</span> : <FiSend size={18} />}
                </button>
            </div>
        </div>
      </div>
      
      {error && (
        <div className="error-display">
          <p>{error}</p>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <FiX size={16} />
          </button>
        </div>
      )}
      
      {browserWarning && (
        <div className="browser-warning">
          <p>{browserWarning}</p>
          <button onClick={() => setBrowserWarning(null)} aria-label="Dismiss warning">
            <FiX size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
