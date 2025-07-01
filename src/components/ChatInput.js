// client/src/components/ChatInput.jsx

import React, { useState, useRef } from 'react';
import api from '../api';
import '../assets/styles/ChatInput.css';

const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [_transcript, setTranscript] = useState('');
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [stutterHandled, setStutterHandled] = useState(false);

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const microphoneIconUrl =
    'https://img.icons8.com/material-outlined/24/000000/microphone.png';
  const sendIconUrl =
    'https://img.icons8.com/material-outlined/24/000000/send.png';

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  // --------------------------------------------------------------------
  // STUTTER DETECTION
  const detectStutter = (text) => {
    const words = text.trim().split(/\s+/);
    if (words.length < 3) return false;
    const [thirdLast, secondLast, last] = words.slice(-3).map(w => w.toLowerCase());
    return last === secondLast && secondLast === thirdLast;
  };

  // --------------------------------------------------------------------
  // SEND text message
  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessage('');
    onSend(trimmed);
  };

  // --------------------------------------------------------------------
  // START voice recording & live transcription
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstart = () => {
        setRecording(true);
        timerRef.current = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);
      };

      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        setRecordTime(0);
        setRecording(false);

        if (!stutterHandled) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const base64 = await blobToBase64(blob);
          onSend(null, base64);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interim = '';
          if (event.results && Array.isArray(event.results)) {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscript(interim);

          if (detectStutter(interim) && !stutterHandled) {
            setStutterHandled(true);
            handleStutterDetected(interim);
          }
        };

        recognition.onerror = (e) => console.error('Speech recognition error', e);
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  // --------------------------------------------------------------------
  // STOP recording
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  // --------------------------------------------------------------------
  // Convert Blob → Base64
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // --------------------------------------------------------------------
  // HANDLE stutter: ask backend for suggestion
  const handleStutterDetected = async (currentTranscript) => {
    handleStopRecording();
    try {
      const { data } = await api.post('/special-suggestions', {
        transcript: currentTranscript,
      });
      setSuggestionMessage(data.suggestion);
      setSuggestionModalVisible(true);
    } catch (err) {
      console.error('Error fetching suggestion:', err);
    }
  };

  // --------------------------------------------------------------------
  // RESUME after suggestion
  const handleResumeRecording = () => {
    setSuggestionModalVisible(false);
    setTranscript('');
    setStutterHandled(false);
    handleStartRecording();
  };

  return (
    <div className="chat-input">
      <div className="input-wrapper">
        <textarea
          className="input-field"
          placeholder="Type your message..."
          value={message}
          onChange={handleInputChange}
          rows={2}
        />
        <div className="left-icons">
          {recording && (
            <div className="recording-indicator">
              <div className="dot" />
              <span className="timer">{recordTime}s</span>
            </div>
          )}
          <button
            className="icon-button microphone-button"
            onClick={recording ? handleStopRecording : handleStartRecording}
          >
            <img src={microphoneIconUrl} alt="Microphone" />
          </button>
        </div>
        <button
          className="icon-button send-button"
          onClick={handleSendMessage}
        >
          <img src={sendIconUrl} alt="Send" />
        </button>
      </div>

      {suggestionModalVisible && (
        <div className="suggestion-modal">
          <div className="modal-content">
            <h3>Stutter Detected</h3>
            <p>Here&apos;s a suggestion to continue your thought:</p>
            <blockquote>{suggestionMessage}</blockquote>
            <button onClick={handleResumeRecording}>
              Continue Recording
            </button>
          </div>
        </div>
      )}

      <div className="error-message">Couldn&apos;t process audio</div>
    </div>
  );
};

export default ChatInput;
