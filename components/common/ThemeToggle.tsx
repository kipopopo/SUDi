
import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * A button component that allows the user to toggle between light and dark themes.
 * It displays a moon icon for switching to dark mode and a sun icon for switching to light mode.
 * @param {ThemeToggleProps} props - The props for the component.
 * @param {'light' | 'dark'} props.theme - The current theme.
 * @param {() => void} props.toggleTheme - The function to call to toggle the theme.
 * @returns {React.ReactElement} The rendered theme toggle button.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text dark:hover:text-white hover:bg-light-bg dark:hover:bg-brand-light/50 transition-colors duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};