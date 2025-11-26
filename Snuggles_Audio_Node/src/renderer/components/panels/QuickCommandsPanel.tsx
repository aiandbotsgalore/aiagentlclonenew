import React from 'react';

interface QuickCommandsPanelProps {
  onRiffOnThat: () => void;
  onOneLinerOnly: () => void;
  onWrapIn10: () => void;
  onSwitchTone: () => void;
}

export const QuickCommandsPanel: React.FC<QuickCommandsPanelProps> = ({
  onRiffOnThat,
  onOneLinerOnly,
  onWrapIn10,
  onSwitchTone
}) => {
  return (
    <div className="panel quick-commands-panel">
      <h2 className="panel-title">Quick Commands</h2>

      <div className="quick-commands-list">
        <button className="quick-command-btn" onClick={onRiffOnThat}>
          <span className="command-label">Riff on that</span>
          <kbd className="command-shortcut">R</kbd>
        </button>

        <button className="quick-command-btn" onClick={onOneLinerOnly}>
          <span className="command-label">One-liner only</span>
          <kbd className="command-shortcut">1</kbd>
        </button>

        <button className="quick-command-btn" onClick={onWrapIn10}>
          <span className="command-label">Wrap in 10</span>
          <kbd className="command-shortcut">E</kbd>
        </button>

        <button className="quick-command-btn" onClick={onSwitchTone}>
          <span className="command-label">Switch tone</span>
          <kbd className="command-shortcut">T</kbd>
        </button>
      </div>
    </div>
  );
};
