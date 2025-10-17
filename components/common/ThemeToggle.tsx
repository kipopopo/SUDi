
import React from 'react';
import { SunIcon, MoonIcon } from './Icons';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A button component that allows the user to toggle between light and dark themes.
 * It displays a moon icon for switching to dark mode and a sun icon for switching to light mode.
 * @returns {React.ReactElement} The rendered theme toggle button.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 p-2 rounded-full flex items-center justify-center text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text dark:hover:text-white hover:bg-light-bg dark:hover:bg-brand-light/50 transition-colors duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};