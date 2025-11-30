import React from 'react';

/**
 * Props for the QuickCommandsPanel component.
 */
interface QuickCommandsPanelProps {
  /** Callback for "Riff on that" command. */
  onRiffOnThat: () => void;
  /** Callback for "One-liner only" command. */
  onOneLinerOnly: () => void;
  /** Callback for "Wrap in 10" command. */
  onWrapIn10: () => void;
  /** Callback for "Switch tone" command. */
  onSwitchTone: () => void;
}

/**
 * Panel providing quick access buttons for common AI commands.
 *
 * Each button triggers a specific action and displays its associated keyboard shortcut.
 *
 * @component
 * @param {QuickCommandsPanelProps} props - The component props.
 * @returns {JSX.Element} The quick commands panel.
 */
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
