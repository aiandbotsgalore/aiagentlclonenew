import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../../../shared/types';

interface LiveTranscriptPanelProps {
  messages: ConversationTurn[];
  recording: boolean;
}

export const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({
  messages,
  recording
}) => {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSpeakerName = (role: string) => {
    return role === 'user' ? 'Demo Host' : 'AI Cohost';
  };

  const getSpeakerInitials = (role: string) => {
    return role === 'user' ? 'DH' : 'AI';
  };

  return (
    <div className="panel live-transcript-panel">
      <div className="panel-header">
        <h2 className="panel-title">Live Transcript</h2>
        {recording && (
          <div className="recording-indicator">
            <span className="recording-dot" />
            <span>Recording</span>
          </div>
        )}
      </div>

      <div className="transcript-messages" ref={transcriptRef}>
        {messages.length === 0 ? (
          <div className="transcript-empty">
            <p>No messages yet. Start speaking to see the transcript appear here.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`transcript-message ${message.role}`}
            >
              <div className="message-avatar">
                {getSpeakerInitials(message.role)}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-speaker">
                    {getSpeakerName(message.role)}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.role === 'assistant' && (
                    <span className="message-badge">AI</span>
                  )}
                </div>
                <p className="message-text">{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
