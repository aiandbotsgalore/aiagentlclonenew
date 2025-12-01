import React, { useState, useCallback, useRef } from 'react';
import { useLiveAPI } from '../context/LiveAPIProvider';
import { useConversationStore } from '../stores/useConversation';

const InputBar: React.FC = () => {
  const [input, setInput] = useState('');
  const { client, isConnected } = useLiveAPI();
  const { addMessage } = useConversationStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !client || !isConnected) return;

    // Send to AI
    client.sendInitialText(trimmed);

    // Add to conversation history
    addMessage('user', trimmed, false);

    // Clear input
    setInput('');
    inputRef.current?.focus();
  }, [input, client, isConnected, addMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
          disabled={!isConnected}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isConnected}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition flex items-center gap-2"
          title="Send message (Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InputBar;
