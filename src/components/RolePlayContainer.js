import React from 'react';
import ChatDetail from './ChatDetail';

export default function RolePlayContainer({ instances = [], activeId, scenarios = [], ...props }) {
  const active = Array.isArray(instances) ? instances.find(c => c.id === activeId) : null;
  
  if (!active) return <div>Select a scenario to start chatting</div>;

  return (
    <div className="roleplay-container">
      <h3>Scenario: {Array.isArray(scenarios) ? scenarios.find(s => s.key === active.scenarioKey)?.label : 'Unknown'}</h3>
      <ChatDetail 
        chatInstances={instances}
        activeChatId={activeId}
        {...props}
      />
    </div>
  );
}
