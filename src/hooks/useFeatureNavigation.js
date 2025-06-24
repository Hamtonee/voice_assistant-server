import { useState, useCallback, useMemo } from 'react';

export const useFeatureNavigation = () => {
  // Feature navigation state
  const [selectedFeature, setSelectedFeature] = useState('chat');
  const [scenario, setScenario] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Available features configuration - memoized to prevent re-renders
  const features = useMemo(() => [
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: '💬',
      description: 'Role-play conversations with AI scenarios'
    },
    { 
      id: 'sema', 
      label: 'Sema', 
      icon: '🎤',
      description: 'Speech coaching with real-time feedback'
    },
    { 
      id: 'tusome', 
      label: 'Tusome', 
      icon: '📚',
      description: 'Reading comprehension with AI discussions'
    }
  ], []);

  // Feature selection handler
  const handleFeatureSelect = useCallback((featureId) => {
    if (featureId === selectedFeature) return;
    
    console.log(`🔄 Switching to feature: ${featureId}`);
    setSelectedFeature(featureId);
    
    // Reset scenario when switching away from chat
    if (featureId !== 'chat') {
      setScenario(null);
    }
  }, [selectedFeature]);

  // FIXED: Scenario selection handler
  const handleSelectScenario = useCallback((scenarioData) => {
    console.log('🎯 useFeatureNavigation: Scenario selection received:', scenarioData);
    
    // Ensure we're setting the full scenario object
    if (scenarioData) {
      // Handle both scenario object and just key cases
      const fullScenario = typeof scenarioData === 'string' 
        ? { key: scenarioData, label: scenarioData } 
        : scenarioData;
      
      console.log('🎯 useFeatureNavigation: Setting scenario:', fullScenario);
      setScenario(fullScenario);
      
      // Make sure we're in chat mode when selecting a scenario
      if (selectedFeature !== 'chat') {
        console.log('🔄 useFeatureNavigation: Switching to chat feature for scenario');
        setSelectedFeature('chat');
      }
    }
  }, [selectedFeature]);

  // Clear scenario (go back to scenario picker)
  const clearScenario = useCallback(() => {
    console.log('🔄 useFeatureNavigation: Clearing scenario');
    setScenario(null);
  }, []);

  // Voice selection handler
  const handleVoiceSelect = useCallback((voice) => {
    console.log('🎤 useFeatureNavigation: Voice selected:', voice);
    setSelectedVoice(voice);
  }, []);

  // Get current feature configuration
  const getCurrentFeature = useCallback(() => {
    return features.find(f => f.id === selectedFeature);
  }, [selectedFeature, features]);

  // Check if current feature needs scenario selection
  const needsScenarioSelection = useCallback(() => {
    const needs = selectedFeature === 'chat' && !scenario;
    console.log('🔍 useFeatureNavigation: Needs scenario selection?', { 
      selectedFeature, 
      hasScenario: !!scenario, 
      needs 
    });
    return needs;
  }, [selectedFeature, scenario]);

  // Check if current feature is ready for interaction
  const isFeatureReady = useCallback(() => {
    let ready = false;
    switch (selectedFeature) {
      case 'chat':
        ready = !!scenario;
        break;
      case 'sema':
      case 'tusome':
        ready = true;
        break;
      default:
        ready = false;
    }
    
    console.log('🔍 useFeatureNavigation: Is feature ready?', { 
      selectedFeature, 
      hasScenario: !!scenario, 
      ready 
    });
    return ready;
  }, [selectedFeature, scenario]);

  return {
    // State
    selectedFeature,
    scenario,
    selectedVoice,
    features,
    
    // Actions
    setSelectedFeature,
    setScenario,
    setSelectedVoice,
    
    // Handlers
    handleFeatureSelect,
    handleSelectScenario,
    handleVoiceSelect,
    clearScenario,
    
    // Computed values
    getCurrentFeature,
    needsScenarioSelection,
    isFeatureReady
  };
}; 