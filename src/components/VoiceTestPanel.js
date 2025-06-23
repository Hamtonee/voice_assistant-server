// src/components/VoiceTestPanel.jsx
// Testing component to verify voice assistant fixes

import React, { useState, useRef } from 'react';
import { availableScenarios } from '../data/rolePlayScenarios';

const VoiceTestPanel = ({ isVisible, onClose }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('en-US-Chirp3-HD-Aoede');
  const [selectedScenario, setSelectedScenario] = useState('hiring_interview');
  const audioRef = useRef(null);

  const availableVoices = [
    'en-US-Chirp3-HD-Aoede',
    'en-US-Chirp3-HD-Puck',
    'en-US-Chirp3-HD-Charon',
    'en-US-Chirp3-HD-Kore',
    'en-US-Wavenet-A',
    'en-US-Wavenet-B',
    'en-GB-Wavenet-A',
    'en-GB-Wavenet-D'
  ];

  const addResult = (test, status, message, details = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testVoiceSelection = async () => {
    addResult('Voice Selection', 'running', 'Testing voice selection...');
    
    try {
      const response = await fetch('/api/speech-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test_voice_' + Date.now(),
          transcript: 'Testing voice selection functionality',
          voice: {
            voiceName: selectedVoice,
            languageCode: selectedVoice.startsWith('en-US') ? 'en-US' : 'en-GB'
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.feedbackAudio) {
        addResult('Voice Selection', 'success', `Voice ${selectedVoice} working`, {
          audioLength: data.feedbackAudio.length,
          voiceUsed: data.voice_used,
          responseText: data.feedbackText
        });
        
        // Play the audio to verify voice
        if (audioRef.current && data.feedbackAudio) {
          audioRef.current.src = `data:audio/mp3;base64,${data.feedbackAudio}`;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
      } else {
        addResult('Voice Selection', 'error', 'Voice selection failed', data);
      }
    } catch (error) {
      addResult('Voice Selection', 'error', error.message);
    }
  };

  const testRoleplayScenario = async () => {
    // Defensive check: ensure availableScenarios is an array before calling find
    const scenario = Array.isArray(availableScenarios) 
      ? availableScenarios.find(s => s.key === selectedScenario)
      : null;
    if (!scenario) return;

    addResult('Roleplay', 'running', `Testing ${scenario.label}...`);
    
    try {
      const response = await fetch('/api/chat-roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test_roleplay_' + Date.now(),
          message: 'Hello, I am ready to start our roleplay scenario.',
          scenario_key: selectedScenario,
          voice: {
            voiceName: selectedVoice
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Check for meta-commentary in response
        const hasMetaCommentary = /\([^)]*(?:This|this|It|keeps|model|invit|warm|conversational|natural)[^)]*\)/.test(data.reply);
        
        addResult('Roleplay', hasMetaCommentary ? 'warning' : 'success', 
          hasMetaCommentary ? 'Meta-commentary detected!' : `${scenario.label} working correctly`,
          {
            scenario: scenario.label,
            userRole: scenario.userRole,
            aiRole: scenario.aiRole,
            response: data.reply,
            hasMetaCommentary,
            audioLength: data.replyAudio?.length || 0
          });
          
        // Play the audio
        if (audioRef.current && data.replyAudio) {
          audioRef.current.src = `data:audio/mp3;base64,${data.replyAudio}`;
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
      } else {
        addResult('Roleplay', 'error', 'Roleplay test failed', data);
      }
    } catch (error) {
      addResult('Roleplay', 'error', error.message);
    }
  };

  const testMetaCommentaryRemoval = async () => {
    addResult('Meta-commentary', 'running', 'Testing response cleaning...');
    
    const testMessages = [
      'Tell me something interesting about your work.',
      'What do you think makes a good conversation?',
      'How do you approach problem-solving?'
    ];

    for (const message of testMessages) {
      try {
        const response = await fetch('/api/chat-roleplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'test_meta_' + Date.now(),
            message,
            voice: { voiceName: selectedVoice }
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          const hasMetaCommentary = /\([^)]*(?:This|this|It|keeps|model|invit|warm|conversational|natural)[^)]*\)/.test(data.reply);
          const hasBrackets = /\[[^\]]*\]/.test(data.reply);
          const hasAsterisks = /\*[^*]*\*/.test(data.reply);
          
          const isClean = !hasMetaCommentary && !hasBrackets && !hasAsterisks;
          
          addResult('Meta-commentary', isClean ? 'success' : 'warning',
            isClean ? 'Response is clean' : 'Meta-commentary found',
            {
              message,
              response: data.reply,
              hasMetaCommentary,
              hasBrackets,
              hasAsterisks
            });
        }
      } catch (error) {
        addResult('Meta-commentary', 'error', error.message);
      }
    }
  };

  const testErrorHandling = async () => {
    addResult('Error Handling', 'running', 'Testing error scenarios...');
    
    // Test invalid voice
    try {
      const response = await fetch('/api/speech-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test_error_voice',
          transcript: 'Testing error handling',
          voice: {
            voiceName: 'invalid-voice-name',
            rate: 'not-a-number',
            pitch: 'also-not-a-number'
          }
        })
      });

      if (response.ok) {
        addResult('Error Handling', 'success', 'Invalid voice handled gracefully');
      } else {
        addResult('Error Handling', 'warning', `Invalid voice returned ${response.status}`);
      }
    } catch (error) {
      addResult('Error Handling', 'error', `Invalid voice test failed: ${error.message}`);
    }

    // Test empty message
    try {
      const response = await fetch('/api/speech-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test_error_empty',
          transcript: '',
          voice: { voiceName: selectedVoice }
        })
      });

      if (response.status === 400) {
        addResult('Error Handling', 'success', 'Empty message properly rejected');
      } else {
        addResult('Error Handling', 'warning', `Empty message returned ${response.status}`);
      }
    } catch (error) {
      addResult('Error Handling', 'error', `Empty message test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('Test Suite', 'running', 'Starting comprehensive test suite...');
    
    await testVoiceSelection();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    
    await testRoleplayScenario();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMetaCommentaryRemoval();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testErrorHandling();
    
    addResult('Test Suite', 'success', 'All tests completed!');
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'running': return '🔄';
      default: return '•';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Voice Assistant Test Panel</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Test Configuration */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium mb-1">Test Voice:</label>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {availableVoices.map(voice => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Scenario:</label>
            <select 
              value={selectedScenario} 
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {availableScenarios.map(scenario => (
                <option key={scenario.key} value={scenario.key}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={testVoiceSelection}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Voice Selection
          </button>
          <button 
            onClick={testRoleplayScenario}
            disabled={isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Roleplay
          </button>
          <button 
            onClick={testMetaCommentaryRemoval}
            disabled={isRunning}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Test Response Cleaning
          </button>
          <button 
            onClick={testErrorHandling}
            disabled={isRunning}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Test Error Handling
          </button>
          <button 
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
          <button 
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Test Results ({testResults.length})</h3>
          <div className="space-y-2">
            {testResults.map(result => (
              <div key={result.id} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.test}</span>
                    <span className={`text-sm ${getStatusColor(result.status)}`}>
                      {result.message}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                {result.details && (
                  <div className="mt-2 text-sm">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hidden audio element for testing */}
        <audio ref={audioRef} className="hidden" controls />
        
        {/* Quick Stats */}
        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <strong>Summary:</strong> {' '}
            <span className="text-green-600">
              ✅ {testResults.filter(r => r.status === 'success').length} passed
            </span> {' '}
            <span className="text-yellow-600">
              ⚠️ {testResults.filter(r => r.status === 'warning').length} warnings
            </span> {' '}
            <span className="text-red-600">
              ❌ {testResults.filter(r => r.status === 'error').length} failed
            </span> {' '}
            <span className="text-blue-600">
              🔄 {testResults.filter(r => r.status === 'running').length} running
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTestPanel;