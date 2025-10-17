
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './common/ThemeToggle';
import { UserIcon, LogoutIcon, MenuIcon } from './common/Icons';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  handleLogout: () => void;
  onMenuClick: () => void;
  isModalOpen: boolean;
  isSidebarCollapsed: boolean;
}

/**
 * Renders the header of the application.
 * This component displays the application title, a theme toggle button,
 * a welcome message, and a user avatar which can be updated by the user.
 * @param {HeaderProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered header component.
 */
export const Header: React.FC<HeaderProps> = ({ handleLogout, onMenuClick, isModalOpen, isSidebarCollapsed }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  // State to store the URL of the user's avatar image.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State to store the URL of the user's avatar image.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Ref to access the hidden file input element for avatar uploads.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  /**
   * Handles the click event on the avatar.
   * It programmatically triggers a click on the hidden file input to open the file selection dialog.
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles the file selection event from the file input.,
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

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };


  return (
    <header className={`bg-light-bg dark:bg-brand-darker p-4 flex justify-between items-center border-b border-light-text-secondary dark:border-brand-light transition-transform duration-300 ease-in-out ${isModalOpen ? 'header-hidden' : ''}`}>
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="lg:hidden text-light-text dark:text-brand-text p-1">
          <MenuIcon />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-light-text dark:text-brand-text tracking-wider font-title">{t('header.title')}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <ThemeToggle />
        



        
        {/* Avatar Section with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown} 
            className="w-10 h-10 rounded-full bg-brand-accent-purple/20 dark:bg-brand-light/50 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-brand-accent transition-all"
            title={t('header.userMenuTitle')}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-1.5 text-brand-accent-purple dark:text-brand-accent">
                <UserIcon />
              </div>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-light-surface dark:bg-brand-dark rounded-md shadow-lg py-1 z-50 border border-light-border dark:border-brand-light/20 animate-fade-in-up">
              <button 
                onClick={() => { toggleDropdown(); }}
                className="block px-4 py-2 text-sm text-light-text dark:text-brand-text hover:bg-light-hover dark:hover:bg-brand-light/10 w-full text-left"
              >
                {t('header.profileSummary')}
              </button>
              <button 
                onClick={() => { toggleDropdown(); }}
                className="block px-4 py-2 text-sm text-light-text dark:text-brand-text hover:bg-light-hover dark:hover:bg-brand-light/10 w-full text-left"
              >
                {t('header.activityLogs')}
              </button>
              <button 
                onClick={() => { handleAvatarClick(); toggleDropdown(); }}
                className="block px-4 py-2 text-sm text-light-text dark:text-brand-text hover:bg-light-hover dark:hover:bg-brand-light/10 w-full text-left"
              >
                {t('header.changeProfilePic')}
              </button>
              <div className="border-t border-light-border dark:border-brand-light/20 my-1"></div>
              <button 
                onClick={() => { handleLogout(); toggleDropdown(); }}
                className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-light-hover dark:hover:bg-brand-light/10 w-full text-left"
              >
                <LogoutIcon className="inline-block mr-2 w-5 h-5" /> {t('header.logout')}
              </button>
            </div>
          )}

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
