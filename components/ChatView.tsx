import React, { useEffect, useRef } from 'react';
import { useConversationStore } from '../stores/useConversation';
import { useAgentStore } from '../stores/useAgent';
import MessageBubble from './MessageBubble';

const ChatView: React.FC = () => {
  const { messages, currentTranscript, isTranscribing } = useConversationStore();
  const { current: currentAgent } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Conversation</h2>
        <span className="text-xs text-gray-500">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4 text-center">
            <div>
              <p className="mb-2">No messages yet</p>
              <p className="text-xs">Start a conversation by clicking Connect</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                agentName={currentAgent.name}
                agentColor={currentAgent.bodyColor}
              />
            ))}

            {/* Real-time transcription indicator */}
            {isTranscribing && currentTranscript && (
              <div className="px-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 opacity-70">
                    <span className="text-white text-xs font-bold">You</span>
                  </div>
                  <div className="bg-blue-600/30 px-4 py-2.5 rounded-2xl rounded-tr-sm animate-pulse">
                    <p className="text-sm text-blue-200 italic">{currentTranscript}...</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatView;
