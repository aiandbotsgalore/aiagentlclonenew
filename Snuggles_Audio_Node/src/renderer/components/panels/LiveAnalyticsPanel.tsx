import React from 'react';
import { LiveAnalytics } from '../../../shared/types';

interface LiveAnalyticsPanelProps {
  analytics: LiveAnalytics;
  sessionTime: string;
}

export const LiveAnalyticsPanel: React.FC<LiveAnalyticsPanelProps> = ({
  analytics,
  sessionTime
}) => {
  return (
    <div className="panel live-analytics-panel">
      <h2 className="panel-title">Live Analytics</h2>

      {/* Speaking Time Chart */}
      <div className="analytics-section">
        <div className="speaking-time-chart">
          <div className="chart-center">
            <div className="chart-percentage">{analytics.speakingTime.ai}%</div>
            <div className="chart-label">AI Speaking Time</div>
          </div>
          <svg className="donut-chart" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={`${analytics.speakingTime.ai * 2.51} 251`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>

        <div className="speaking-time-stats">
          <div className="stat-item">
            <span className="stat-label">Total Responses</span>
            <span className="stat-value">{analytics.totalResponses}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="analytics-metrics">
        <div className="metric-card">
          <label>Avg Response Time</label>
          <span className="metric-value-large">{analytics.avgResponseTime.toFixed(1)}s</span>
        </div>

        <div className="metric-card">
          <label>Interrupts</label>
          <span className="metric-value-large">{analytics.interrupts}</span>
        </div>

        <div className="metric-card">
          <label>Joke Success Rate</label>
          <span className="metric-value-large success-rate">{analytics.jokeSuccessRate}%</span>
        </div>
      </div>

      {/* Clip-Worthy Moments */}
      <div className="analytics-section">
        <h3 className="section-title">Clip-Worthy Moments</h3>
        <div className="clip-moments-list">
          {analytics.clipWorthyMoments.length === 0 ? (
            <>
              <div className="clip-moment-item">
                <span className="clip-title">AI Technology</span>
                <span className="clip-time">00:15:23</span>
              </div>
              <div className="clip-moment-item">
                <span className="clip-title">Future of Voice</span>
                <span className="clip-time">00:32:45</span>
              </div>
            </>
          ) : (
            analytics.clipWorthyMoments.map((moment) => (
              <div key={moment.id} className="clip-moment-item">
                <span className="clip-title">{moment.title}</span>
                <span className="clip-time">{moment.timeInSession}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analytics-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-list">
          <button className="action-btn action-primary">Generate Cold Open</button>
          <button className="action-btn action-secondary">Create Segment Bumper</button>
          <button className="action-btn action-success">Generate Summary</button>
          <button className="action-btn action-neutral">Export Transcript</button>
        </div>
      </div>
    </div>
  );
};
