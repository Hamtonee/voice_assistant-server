import React from 'react';
import ChatDetail from './ChatDetail.js';
import SemaDetail from './SemaDetail.js';
import HomeScreen from './HomeScreen.js'; // Optional default view

const MainContent = ({ selectedFeature, chatInstances, setChatInstances, activeChatId }) => {
  switch (selectedFeature) {
    case 'chat':
      return <ChatDetail 
               chatInstances={chatInstances} 
               setChatInstances={setChatInstances} 
               activeChatId={activeChatId} 
             />;
    case 'sema':
      return <SemaDetail 
               chatInstances={chatInstances} 
               setChatInstances={setChatInstances} 
               activeChatId={activeChatId} 
             />;
    default:
      return <HomeScreen />;
  }
};

export default MainContent;
