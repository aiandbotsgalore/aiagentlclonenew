import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../../../shared/types';

/**
 * Props for the LiveTranscriptPanel component.
 */
interface LiveTranscriptPanelProps {
  /**
   * The list of conversation turns to display.
   */
  messages: ConversationTurn[];
  /**
   * Whether audio recording is currently active.
   */
  recording: boolean;
}

/**
 * Panel displaying the live transcription of the conversation.
 *
 * Shows a scrollable list of messages from both the user (host) and the AI.
 * Automatically scrolls to the newest message.
 *
 * @component
 * @param {LiveTranscriptPanelProps} props - The component props.
 * @returns {JSX.Element} The transcript panel.
 */
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

  /**
   * Formats a timestamp into a readable time string.
   * @param {number} timestamp - The timestamp in milliseconds.
   * @returns {string} The formatted time string.
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Gets the display name for a speaker role.
   * @param {string} role - The role ('user' or 'assistant').
   * @returns {string} The display name.
   */
  const getSpeakerName = (role: string) => {
    return role === 'user' ? 'Demo Host' : 'AI Cohost';
  };

  /**
   * Gets the initials for a speaker role.
   * @param {string} role - The role.
   * @returns {string} The initials.
   */
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
