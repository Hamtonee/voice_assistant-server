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
    
    console.log(`Switching to feature: ${featureId}`);
    setSelectedFeature(featureId);
    
    // Reset scenario when switching away from chat
    if (featureId !== 'chat') {
      setScenario(null);
    }
  }, [selectedFeature]);

  // Scenario selection handler
  const handleSelectScenario = useCallback((scenarioData) => {
    console.log('Selected scenario:', scenarioData);
    setScenario(scenarioData);
  }, []);

  // Clear scenario (go back to scenario picker)
  const clearScenario = useCallback(() => {
    setScenario(null);
  }, []);

  // Voice selection handler
  const handleVoiceSelect = useCallback((voice) => {
    console.log('Selected voice:', voice);
    setSelectedVoice(voice);
  }, []);

  // Get current feature configuration
  const getCurrentFeature = useCallback(() => {
    return features.find(f => f.id === selectedFeature);
  }, [selectedFeature, features]);

  // Check if current feature needs scenario selection
  const needsScenarioSelection = useCallback(() => {
    return selectedFeature === 'chat' && !scenario;
  }, [selectedFeature, scenario]);

  // Check if current feature is ready for interaction
  const isFeatureReady = useCallback(() => {
    switch (selectedFeature) {
      case 'chat':
        return !!scenario;
      case 'sema':
      case 'tusome':
        return true;
      default:
        return false;
    }
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