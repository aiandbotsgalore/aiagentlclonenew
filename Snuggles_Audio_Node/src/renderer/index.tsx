import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * The entry point for the Snuggles Audio Node renderer application.
 *
 * Finds the root element in the DOM and mounts the `App` component within
 * `React.StrictMode`.
 */
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
