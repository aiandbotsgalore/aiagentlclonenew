import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  agentName?: string;
  agentColor?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  agentName = 'AI',
  agentColor = '#10b981'
}) => {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          style={{
            backgroundColor: isUser ? '#3b82f6' : agentColor,
            opacity: 0.9
          }}
        >
          <span className="text-white text-xs font-bold">
            {isUser ? 'You' : agentName.charAt(0)}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-700 text-gray-100 rounded-tl-sm'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>

          {/* Timestamp and audio indicator */}
          <div className={`flex items-center gap-2 text-xs text-gray-500 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span>{time}</span>
            {message.isAudio && (
              <span className="flex items-center gap-1" title="Voice message">
                <¤
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
