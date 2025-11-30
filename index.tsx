
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * The entry point of the React application.
 *
 * It finds the root element in the DOM and renders the `App` component within `React.StrictMode`.
 * Throws an error if the root element is not found.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
