
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Find the root DOM element where the React application will be mounted.
const rootElement = document.getElementById('root');

// Ensure the root element exists before attempting to render the app.
// This is a safeguard against potential HTML misconfigurations.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * Creates a React root for the main application container and renders the App component.
 * This is the entry point for the React application. It sets up StrictMode
 * for highlighting potential problems in the application.
 */
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);