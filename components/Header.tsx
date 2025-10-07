
import React, { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './common/ThemeToggle';
import { UserIcon, LogoutIcon, MenuIcon } from './common/Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  handleLogout: () => void;
  onMenuClick: () => void;
}

/**
 * Renders the header of the application.
 * This component displays the application title, a theme toggle button,
 * a welcome message, and a user avatar which can be updated by the user.
 * @param {HeaderProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered header component.
 */
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, handleLogout, onMenuClick }) => {
  // State to store the URL of the user's avatar image.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Ref to access the hidden file input element for avatar uploads.
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * A side effect that runs once when the component mounts.
   * It retrieves the saved avatar URL from localStorage and updates the state.
   */
  useEffect(() => {
    const savedAvatar = localStorage.getItem('sudi-avatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  /**
   * Handles the click event on the avatar.
   * It programmatically triggers a click on the hidden file input to open the file selection dialog.
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles the file selection event from the file input.
   * It reads the selected image file, converts it to a base64 Data URL,
   * saves it to localStorage, and updates the component's state to display the new avatar.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        localStorage.setItem('sudi-avatar', result);
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <header className="bg-light-surface/80 dark:bg-brand-dark/50 backdrop-blur-sm p-4 border-b border-light-border dark:border-brand-light/20 flex items-center justify-between z-20">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="lg:hidden text-light-text dark:text-brand-text p-1">
          <MenuIcon />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-light-text dark:text-brand-text tracking-wider font-title">Sistem Undangan Digital</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        
        <button 
            onClick={handleLogout} 
            className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-brand-text-secondary hover:text-red-500 dark:hover:text-red-400 transition"
            title="Logout"
        >
            <LogoutIcon />
            <span className="hidden sm:inline">Logout</span>
        </button>

        <span className="text-light-text-secondary dark:text-brand-text-secondary hidden sm:inline">|</span>

        <span className="text-sm text-light-text-secondary dark:text-brand-text-secondary hidden md:block">Welcome, Admin</span>
        
        {/* Avatar Section */}
        <div className="relative">
          <button 
            onClick={handleAvatarClick} 
            className="w-10 h-10 rounded-full bg-brand-accent-purple/20 dark:bg-brand-light/50 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-brand-accent transition-all"
            title="Change profile picture"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-1.5 text-brand-accent-purple dark:text-brand-accent">
                <UserIcon />
              </div>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
};
