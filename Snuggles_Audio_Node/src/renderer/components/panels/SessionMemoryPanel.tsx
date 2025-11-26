import React from 'react';
import { SessionMemory } from '../../../shared/types';

interface SessionMemoryPanelProps {
  memory: SessionMemory;
}

export const SessionMemoryPanel: React.FC<SessionMemoryPanelProps> = ({ memory }) => {
  return (
    <div className="panel session-memory-panel">
      <h2 className="panel-title">Session Memory</h2>

      {/* Key Topics */}
      <div className="memory-section">
        <h3 className="memory-section-title">Key Topics</h3>
        <div className="key-topics-list">
          {memory.keyTopics.length === 0 ? (
            <p className="empty-state">No topics detected yet</p>
          ) : (
            memory.keyTopics.map((topic, index) => (
              <div key={index} className="topic-item">
                <span className="topic-name">{topic.topic}</span>
                <span className="topic-count">{topic.mentions}x</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Speaker Notes */}
      <div className="memory-section">
        <h3 className="memory-section-title">Speaker Notes</h3>
        <div className="speaker-notes-list">
          {memory.speakerNotes.length === 0 ? (
            <div className="note-item">
              <span className="note-speaker">Demo Host:</span>
              <span className="note-text">Interested in AI applications</span>
            </div>
          ) : (
            memory.speakerNotes.map((note, index) => (
              <div key={index} className="note-item">
                <span className="note-speaker">{note.speaker}:</span>
                <span className="note-text">{note.note}</span>
              </div>
            ))
          )}
          <div className="note-item">
            <span className="note-speaker">AI Cohost:</span>
            <span className="note-text">AI cohost personality active</span>
          </div>
        </div>
      </div>

      {/* Running Jokes & Callbacks */}
      <div className="memory-section">
        <h3 className="memory-section-title">Running Jokes & Callbacks</h3>
        <div className="jokes-list">
          {memory.runningJokes.length === 0 ? (
            <>
              <div className="joke-item">• This AI that never runs out of coffee</div>
              <div className="joke-item">• Better response time than humans</div>
            </>
          ) : (
            memory.runningJokes.map((joke, index) => (
              <div key={index} className="joke-item">• {joke}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
