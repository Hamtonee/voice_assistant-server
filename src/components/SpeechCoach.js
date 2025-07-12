import React, { useState, useEffect, useRef, useCallback } from 'react';
import TTSService from '../services/TTSService';
import api from '../api';
import '../assets/styles/SpeechCoach.css';
import { FiMic, FiMicOff, FiSend, FiTrash2, FiBarChart, FiX, FiChevronDown, FiMessageSquare, FiBookOpen } from 'react-icons/fi';
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
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [speechEndTimer, setSpeechEndTimer] = useState(null);

  // Add new state for feedback categories
  const [feedbackCategories, setFeedbackCategories] = useState({
    vocabulary: true,
    communication: true,
    suggestions: true
  });

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

  // Enhanced send message with wait time logic - moved before handleRecognitionResult
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setError('Please say something or type a message before sending.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    handleStopRecording();
    
    // Clear any pending timers
    if (speechEndTimer) {
      clearTimeout(speechEndTimer);
      setSpeechEndTimer(null);
    }

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
  }, [inputText, sessionId, selectedVoice, speechEndTimer, alwaysListen]);

  // Move function definitions before useEffect
  const handleRecognitionResult = useCallback((event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    if (finalTranscript) {
      const newText = inputText + finalTranscript;
      setInputText(newText);
      
      // Clear existing timer
      if (speechEndTimer) {
        clearTimeout(speechEndTimer);
        setSpeechEndTimer(null);
      }
      
      // Start timer for direct auto-send after speech ends
      const timer = setTimeout(() => {
        if (newText.trim()) {
          // Auto-send directly if no manual editing
          setInputText(currentText => {
            if (currentText === newText) {
              console.log('✅ Auto-sending SpeechCoach message - no manual edits detected');
              handleSendMessage();
            } else {
              console.log('❌ Auto-send canceled - manual editing detected in SpeechCoach');
            }
            return currentText;
          });
        }
      }, 2000); // 2 second wait for auto-send
      setSpeechEndTimer(timer);
    }
    
    // Show interim results
    if (interimTranscript) {
      setTranscriptPreview(interimTranscript);
    } else {
      setTranscriptPreview('');
    }
  }, [inputText, speechEndTimer, handleSendMessage]);

  const handleRecognitionError = useCallback((event) => {
    console.error('Recognition error:', event.error);
    let errorMessage = 'Speech recognition failed. Please try again.';
    
    switch (event.error) {
      case 'network':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
        break;
      case 'no-speech':
        errorMessage = 'No speech detected. Please try speaking again.';
        break;
      case 'audio-capture':
        errorMessage = 'Audio capture failed. Please check your microphone.';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service not available.';
        break;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }
    
    setError(errorMessage);
    setIsRecording(false);
    setTranscriptPreview('');
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
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;
            
            // Add event handlers
            recognitionRef.current.onstart = () => {
              setIsRecording(true);
              setError(null);
              setTranscriptPreview('');
            };
            
            recognitionRef.current.onend = () => {
              setIsRecording(false);
              setTranscriptPreview('');
            };
            
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
      setError(null);
      setTranscriptPreview('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Start Recording Failed:', err);
      if (err.name === 'InvalidStateError') {
        setError('Speech recognition is already running. Please wait a moment and try again.');
      } else if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else {
        setError('Could not start microphone. Please check permissions.');
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Stop Recording Failed:', err);
    }
    setIsRecording(false);
    setTranscriptPreview('');
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

  // Handle manual editing to cancel auto-send
  const handleManualEdit = useCallback((newText) => {
    // If user manually edits during timer, cancel auto-send
    if (speechEndTimer) {
      console.log('🔄 Manual editing detected in SpeechCoach - canceling auto-send');
      clearTimeout(speechEndTimer);
      setSpeechEndTimer(null);
    }
    setInputText(newText);
  }, [speechEndTimer]);

  const renderFeedback = (feedback) => {
    if (!feedback) return null;

    return (
      <div className="feedback-container">
        {/* Summary Section */}
        {feedback.summary && (
          <div className="feedback-summary">
            <h4>Summary</h4>
            <p>{feedback.summary}</p>
          </div>
        )}

        {/* Vocabulary Section */}
        {feedbackCategories.vocabulary && feedback.vocabulary && (
          <div className="feedback-section vocabulary-feedback">
            <div className="section-header" onClick={() => setFeedbackCategories(prev => ({ ...prev, vocabulary: !prev.vocabulary }))}>
              <FiBookOpen />
              <h4>Vocabulary Suggestions</h4>
            </div>
            <div className="section-content">
              {Object.entries(feedback.vocabulary.static).map(([original, suggestion], idx) => (
                <div key={`static-${idx}`} className="suggestion-item">
                  <span className="original">{original}</span>
                  <span className="arrow">→</span>
                  <span className="suggestion">{suggestion}</span>
                </div>
              ))}
              {Object.entries(feedback.vocabulary.dynamic).map(([original, suggestion], idx) => (
                <div key={`dynamic-${idx}`} className="suggestion-item">
                  <span className="original">{original}</span>
                  <span className="arrow">→</span>
                  <span className="suggestion">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication Concepts Section */}
        {feedbackCategories.communication && feedback.communication_concepts && feedback.communication_concepts.length > 0 && (
          <div className="feedback-section concepts-feedback">
            <div className="section-header" onClick={() => setFeedbackCategories(prev => ({ ...prev, communication: !prev.communication }))}>
              <FiMessageSquare />
              <h4>Communication Patterns</h4>
            </div>
            <div className="section-content">
              {feedback.communication_concepts.map((concept, idx) => (
                <div key={`concept-${idx}`} className="concept-item">
                  <div className="concept-type">{concept.type}</div>
                  <div className="concept-example">
                    <div className="example-scenario">{concept.example.scenario}</div>
                    <div className="example-better">{concept.example.better_approach}</div>
                  </div>
                  <div className="concept-suggestion">{concept.suggestion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Feedback Section */}
        {feedbackCategories.suggestions && feedback.detailed && (
          <div className="feedback-section detailed-feedback">
            <div className="section-header" onClick={() => setFeedbackCategories(prev => ({ ...prev, suggestions: !prev.suggestions }))}>
              <FiBarChart />
              <h4>Detailed Feedback</h4>
            </div>
            <div className="section-content">
              <p>{feedback.detailed}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the message display to use the new feedback renderer
  const renderMessage = (message) => {
    return (
      <div className={`message ${message.role}`} key={message.id}>
        <div className="message-content">
          <p>{message.content}</p>
          {message.feedback && renderFeedback(message.feedback)}
        </div>
      </div>
    );
  };

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
          messages.map(renderMessage)
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

      {/* Transcript Preview */}
      {transcriptPreview && (
        <div className="transcript-preview">
          <div className="transcript-preview-content">
            <span className="transcript-preview-label">Listening...</span>
            <span className="transcript-preview-text">{transcriptPreview}</span>
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
                    onChange={(e) => handleManualEdit(e.target.value)}
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
