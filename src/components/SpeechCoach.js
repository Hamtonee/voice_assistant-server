import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TTSService } from '../services/TTSService';
import api from '../api';
import '../assets/styles/SpeechCoach.css';

export default function SpeechCoach({ sessionId, selectedVoice, sidebarOpen, onNewSession }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [ttsAvailable, setTTSAvailable] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctedSentence, setCorrectedSentence] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);
  const ttsServiceRef = useRef(null);
  const isUnmountingRef = useRef(false);

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
          setError('Speech recognition is not supported in your browser.');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize speech services.');
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

  const handleStartRecording = useCallback(() => {
    if (!recognitionRef.current || isRecording) return;

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setError(null);

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (!isUnmountingRef.current) {
          setIsRecording(false);
        }
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording: ' + error.message);
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleStopRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError('Failed to stop recording: ' + error.message);
    }
  }, [isRecording]);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim()) {
      setError('Please say something before submitting.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data } = await api.post('/speech-coach', {
        session_id: sessionId,
        transcript: transcript.trim(),
        voice: selectedVoice
      });

      setFeedback(data.feedbackText);
      setCorrectedSentence(data.correctedSentence);
      setAnalysis(data.analysis);
      setSuggestions(data.suggestions || []);
      setVocabulary(data.vocabulary_introduced || []);

      if (data.feedbackAudio && ttsServiceRef.current) {
        const audio = new Audio(`data:audio/mp3;base64,${data.feedbackAudio}`);
        ttsRef.current = audio;
        
        audio.onended = () => {
          ttsRef.current = null;
        };

        await audio.play();
      }

      setTranscript('');
    } catch (error) {
      console.error('Failed to process speech:', error);
      setError('Failed to process speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, sessionId, selectedVoice]);

  const handleClear = useCallback(() => {
    setTranscript('');
    setFeedback('');
    setError(null);
    setCorrectedSentence(null);
    setAnalysis(null);
    setSuggestions([]);
    setVocabulary([]);
  }, []);

  return (
    <div className={`speech-coach ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="controls">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={!isSpeechSupported || isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!transcript.trim() || isProcessing}
        >
          Submit
        </button>
        <button
          onClick={handleClear}
          disabled={isProcessing || (!transcript && !feedback)}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="transcript">
        <h3>Your Speech</h3>
        <p>{transcript || 'Start speaking...'}</p>
      </div>

      {correctedSentence && (
        <div className="correction">
          <h3>Corrected Version</h3>
          <p>{correctedSentence}</p>
        </div>
      )}

      {feedback && (
        <div className="feedback">
          <h3>Feedback</h3>
          <p>{feedback}</p>
        </div>
      )}

      {analysis && (
        <div className="analysis">
          <h3>Detailed Analysis</h3>
          <ul>
            {Object.entries(analysis).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h3>Suggestions for Improvement</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {vocabulary.length > 0 && (
        <div className="vocabulary">
          <h3>New Vocabulary</h3>
          <ul>
            {vocabulary.map((word, index) => (
              <li key={index}>
                <strong>{word.word}</strong>: {word.definition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isSpeechSupported && (
        <div className="warning">
          Speech recognition is not supported in your browser.
          Please try using Chrome, Edge, or Safari.
        </div>
      )}

      {!ttsAvailable && (
        <div className="warning">
          Text-to-speech service is currently unavailable.
          You will not hear audio feedback.
        </div>
      )}
    </div>
  );
}