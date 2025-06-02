// src/components/TopicSelector.js
import React from 'react';
import '../src/assets/styles/TopicSelector.css'; // Optional: if you want to add styles

const TopicSelector = ({ topics, onSelectTopic }) => {
  return (
    <div className="topic-selector">
      <h3>Select a Topic</h3>
      <ul>
        {topics.map((topic, index) => (
          <li key={index} onClick={() => onSelectTopic(topic)}>
            {topic}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopicSelector;
