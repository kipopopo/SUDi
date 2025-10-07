import React from 'react';
import { View, AiUsage } from '../types';
import { DashboardIcon, ParticipantsIcon, DepartmentsIcon, TemplatesIcon, BlastIcon, HistoryIcon, SettingsIcon, LogoIcon, CloseIcon, ReportIcon, CrownIcon, CreditCardIcon, UserCircleIcon, MailIcon } from './common/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  aiUsage: AiUsage;
  isSubscribed: boolean;
}

/**
 * Renders the main sidebar navigation for the application.
 * It displays the application logo and a list of navigation items.
 * On mobile, it's a togglable overlay. On desktop, it's a fixed panel.
 * @param {SidebarProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered sidebar component.
 */
export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen, aiUsage, isSubscribed }) => {
  // Defines the navigation items with their ID, label, and corresponding icon, organized by group.
  const navGroups = {
    'Overview': [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { id: 'analytics', label: 'Analytics', icon: <ReportIcon /> },
    ],
    'Management': [
      { id: 'departments', label: 'Departments', icon: <DepartmentsIcon /> },
      { id: 'participants', label: 'Participants', icon: <ParticipantsIcon /> },
      { id: 'templates', label: 'Templates', icon: <TemplatesIcon /> },
    ],
    'Campaigns': [
      { id: 'blast', label: 'Email Blast', icon: <BlastIcon /> },
      { id: 'history', label: 'History', icon: <HistoryIcon /> },
    ],
    'Account': [
      { id: 'subscription', label: 'Subscription', icon: <CrownIcon /> },
      { id: 'billing', label: 'Billing', icon: <CreditCardIcon /> },
      { id: 'profile', label: 'Profile', icon: <UserCircleIcon /> },
    ],
    'Configuration': [
      { id: 'senderSetup', label: 'Sender Setup', icon: <MailIcon /> },
      { id: 'emailSettings', label: 'Email Settings', icon: <SettingsIcon /> },
    ]
  };

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    // Close sidebar on navigation in mobile view
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside className={`w-64 bg-light-surface/90 dark:bg-brand-dark/60 backdrop-blur-lg fixed top-0 left-0 h-full p-4 flex flex-col z-40 border-r border-light-border dark:border-brand-light/20 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center justify-between p-4 mb-4">
        <div className="flex items-center space-x-3">
            <LogoIcon />
            <span className="text-2xl font-bold text-light-text dark:text-white font-title">SUDi</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-light-text-secondary dark:text-brand-text-secondary">
          <CloseIcon />
        </button>
      </div>
      <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto -mr-2 pr-2">
        {Object.entries(navGroups).map(([groupName, items]) => (
          <div key={groupName}>
            <h3 className="px-3 pt-4 pb-2 text-xs font-semibold uppercase text-light-text-secondary/70 dark:text-brand-text-secondary/60 tracking-wider">
              {groupName}
            </h3>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as View)}
                  // Dynamically applies classes for active and hover states
                  className={`w-full flex items-center space-x-4 p-3 rounded-lg text-left transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-brand-accent-purple/10 text-brand-accent-purple dark:bg-brand-accent/10 dark:text-brand-accent shadow-lg'
                      : 'text-light-text-secondary dark:text-brand-text-secondary hover:bg-light-bg dark:hover:bg-brand-light/50 hover:text-light-text dark:hover:text-white'
                  }`}
                >
                  <div className="w-6 flex items-center justify-center">
                      {item.icon}
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="mt-auto flex-shrink-0">
        <div className="bg-light-bg dark:bg-brand-light/30 p-3 rounded-lg text-center">
            {isSubscribed ? (
                <div className="text-sm font-semibold text-yellow-500 flex items-center justify-center space-x-2">
                    <CrownIcon className="w-5 h-5" />
                    <span>Pro Plan Active</span>
                </div>
            ) : (
                <div>
                    <p className="text-sm font-semibold text-light-text dark:text-white">AI Usage</p>
                    <div className="w-full bg-light-border dark:bg-brand-light/50 rounded-full h-2 my-1.5">
                        <div 
                          className={`h-2 rounded-full ${aiUsage.isExceeded ? 'bg-red-500' : 'bg-brand-accent-purple'}`} 
                          style={{ width: `${(aiUsage.count / aiUsage.limit) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-brand-text-secondary">
                        {aiUsage.limit - aiUsage.count} actions remaining today
                    </p>
                </div>
            )}
        </div>
        <div className="p-4 text-center text-xs text-light-text-secondary/80 dark:text-brand-text-secondary">
          <p>&copy; 2025 FELDA</p>
          <p>AI-Powered Invitations</p>
        </div>
      </div>
    </aside>
  );
};