import './src/i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

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
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <SettingsProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </SettingsProvider>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  </React.StrictMode>
);