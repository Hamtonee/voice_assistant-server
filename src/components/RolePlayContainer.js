import React from 'react';
import ChatDetail from './ChatDetail';

export default function RolePlayContainer({ instances = [], activeId, scenarios = [], ...props }) {
  const active = Array.isArray(instances) ? instances.find(c => c.id === activeId) : null;
  
  if (!active) {
    // Return a placeholder or empty state if no active chat is found.
    // This prevents the component from crashing.
    return (
      <div className="roleplay-container-empty">
        <h2>Select a conversation or start a new one.</h2>
        <p>Your chat sessions will appear here.</p>
      </div>
    );
  }

  // Find the scenario details safely ONLY if 'active' is not null.
  const scenario = Array.isArray(scenarios) ? scenarios.find(s => s.key === active.scenarioKey) : null;

  return (
    <div className="roleplay-container">
      <h3>Scenario: {scenario?.label || 'Unknown Scenario'}</h3>
      <ChatDetail
        chatInstances={instances}
        activeChatId={activeId}
        scenario={scenario} // Pass the found scenario down
        {...props}
      />
    </div>
  );
}
