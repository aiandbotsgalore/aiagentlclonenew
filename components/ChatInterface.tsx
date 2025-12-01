import React from 'react';
import ChatView from './ChatView';
import InputBar from './InputBar';

const ChatInterface: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full">
      <ChatView />
      <InputBar />
    </div>
  );
};

export default ChatInterface;
