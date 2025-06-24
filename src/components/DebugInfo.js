import React from 'react';

const DebugInfo = ({ 
  selectedFeature, 
  scenario, 
  needsScenarioSelection, 
  isFeatureReady, 
  scenarios, 
  sidebarOpen 
}) => {
  const debugStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '12px',
    zIndex: 9999,
    maxWidth: '300px',
    fontFamily: 'monospace'
  };

  return (
    <div style={debugStyle}>
      <h4 style={{ margin: '0 0 8px 0' }}>🔍 Debug Info</h4>
      <div><strong>Feature:</strong> {selectedFeature}</div>
      <div><strong>Scenario:</strong> {scenario?.label || 'None'}</div>
      <div><strong>Needs Scenario:</strong> {needsScenarioSelection ? 'Yes' : 'No'}</div>
      <div><strong>Is Ready:</strong> {isFeatureReady ? 'Yes' : 'No'}</div>
      <div><strong>Scenarios Count:</strong> {scenarios?.length || 0}</div>
      <div><strong>Sidebar:</strong> {sidebarOpen ? 'Open' : 'Closed'}</div>
    </div>
  );
};

export default DebugInfo; 