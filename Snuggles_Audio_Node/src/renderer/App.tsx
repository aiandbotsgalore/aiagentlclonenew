import React from 'react';
import ControlCenter from './components/ControlCenter';

/**
 * The main component for the Snuggles Audio Node renderer process.
 *
 * It serves as the container for the `ControlCenter` component, which provides
 * the primary user interface for controlling the audio node.
 *
 * @component
 * @returns {JSX.Element} The rendered application.
 */
const App: React.FC = () => {
  return (
    <div className="app">
      <ControlCenter />
    </div>
  );
};

export default App;
