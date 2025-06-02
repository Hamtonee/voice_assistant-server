import React from 'react';

export default function RolePlayContainer({
  instances,
  setInstances,
  activeId,
  scenarios
}) {
  // Find the active conversation
  const active = instances.find(c => c.id === activeId);

  return (
    <div className="roleplay-container">
      {/* You can import and use your ChatDetail here */}
      <h3>Scenario: {scenarios.find(s => s.key === active.scenarioKey)?.label}</h3>
      {/* …render the chat bubbles and input just like ChatDetail… */}
    </div>
  );
}
