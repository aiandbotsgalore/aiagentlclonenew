import React from 'react';
import { AICohostStatus } from '../../../shared/types';

interface AICohostPanelProps {
  status: AICohostStatus;
  onPlay: () => void;
  onSkip: () => void;
  connected: boolean;
}

export const AICohostPanel: React.FC<AICohostPanelProps> = ({
  status,
  onPlay,
  onSkip,
  connected
}) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'listening': return '#3b82f6';
      case 'thinking': return '#f59e0b';
      case 'speaking': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'listening': return 'Listening';
      case 'thinking': return 'Thinking';
      case 'speaking': return 'Speaking';
      default: return 'Idle';
    }
  };

  return (
    <div className="panel ai-cohost-panel">
      <h2 className="panel-title">AI Cohost</h2>

      <div className="cohost-status">
        <div className="status-indicator">
          <span className="status-label">Status</span>
          <div className="status-value">
            <div
              className="status-dot"
              style={{ backgroundColor: getStatusColor() }}
            />
            <span>{getStatusText()}</span>
          </div>
        </div>

        <div className="cohost-metrics">
          <div className="metric">
            <label>Response Time</label>
            <span className="metric-value">{status.responseTime.toFixed(1)}s</span>
          </div>
          <div className="metric">
            <label>Confidence</label>
            <span className="metric-value confidence-value">{status.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="cohost-controls">
        <button
          className={`btn btn-primary ${connected ? 'btn-active' : ''}`}
          onClick={onPlay}
        >
          {connected ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSkip}
          disabled={!connected}
        >
          ⏭ Skip
        </button>
      </div>
    </div>
  );
};
