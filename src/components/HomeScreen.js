import React from 'react';
import '../src/assets/styles/HomeScreen.css';

const HomeScreen = () => {
  return (
    <div className="home-screen">
      <h1>Welcome to SemaNami</h1>
      <p>
        Get started by selecting a feature from the sidebar. Choose "New Chat" for a conversation or "Sema" to explore reading passages.
      </p>
      <p>
        Our platform is designed to provide seamless communication with our AI, whether you're engaging in a chat or analyzing text.
      </p>
    </div>
  );
};

export default HomeScreen;
