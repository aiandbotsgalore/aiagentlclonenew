import React, { useEffect, useRef, useCallback } from 'react';
import { useConversationStore } from '../stores/useConversation';
import { useAgentStore } from '../stores/useAgent';
import MessageBubble from './MessageBubble';

const ChatView: React.FC = () => {
  const { messages, currentTranscript, isTranscribing, exportConversation, clearMessages } = useConversationStore();
  const { current: currentAgent } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const handleExport = useCallback(() => {
    const markdown = exportConversation();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportConversation]);

  const handleClear = useCallback(() => {
    if (messages.length > 0 && confirm('Clear all messages? This cannot be undone.')) {
      clearMessages();
    }
  }, [messages.length, clearMessages]);

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-300">Conversation</h2>
          <span className="text-xs text-gray-500">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Export button */}
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 rounded transition flex items-center gap-1.5"
                title="Export conversation as Markdown"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs bg-red-600/80 hover:bg-red-600 rounded transition"
                title="Clear all messages"
              >
                Clear
              </button>
            </>
          )}
        </div>
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
