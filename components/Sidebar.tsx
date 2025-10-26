import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, ParticipantsIcon, DepartmentsIcon, TemplatesIcon, BlastIcon, HistoryIcon, AnalyticsIcon, SettingsIcon, SubscriptionIcon, BillingIcon, UserIcon, LogoutIcon, ChevronLeftIcon, ChevronRightIcon, LightIcon, DarkIcon, UsersIcon } from './common/Icons';
import { AiUsage, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  aiUsage: AiUsage;
  isSubscribed: boolean;
  timeUntilReset: string;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed, aiUsage, isSubscribed, timeUntilReset, user }) => {
  const linkClasses = (isActive: boolean) =>
    `flex items-center p-2 rounded-lg transition-colors duration-200 ${
      isCollapsed ? 'w-10 h-10 justify-center mx-auto' : 'w-full justify-start space-x-3'
    } ${
      isActive
        ? 'bg-brand-accent-purple text-white'
        : 'text-light-text-secondary dark:text-brand-text-secondary hover:bg-light-bg dark:hover:bg-brand-light/50'
    } [&>svg]:w-5 [&>svg]:h-5`;

  const spanClasses = isCollapsed ? 'hidden' : '';

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <aside className={`bg-light-surface/90 dark:bg-brand-dark/60 backdrop-blur-lg fixed top-0 left-0 h-full py-4 flex flex-col z-40 border-r border-light-border dark:border-brand-light/20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <img
              src="/assets/logo-sudi-light-mode.png"
              alt="SUDi Logo"
              className="h-8 dark:hidden"
            />
            <img
              src="/assets/logo-sudi-dark-mode.png"
              alt="SUDi Logo"
              className="h-8 hidden dark:block"
            />
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full hover:bg-light-bg dark:hover:bg-brand-light/50 text-light-text-secondary dark:text-brand-text-secondary transition">
          {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-light-text-secondary dark:text-brand-text-secondary">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-8">
        <nav className="flex-1 flex flex-col space-y-2 px-2">
          <NavLink to="/dashboard" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Dashboard">
            <DashboardIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Dashboard</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Analytics">
            <AnalyticsIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Analytics</span>
          </NavLink>
          
          <p className={`px-2 pt-4 pb-2 text-xs font-semibold uppercase text-light-text-secondary/70 dark:text-brand-text-secondary/60 tracking-wider ${spanClasses}`}>Management</p>
          <NavLink to="/departments" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Departments">
            <DepartmentsIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Departments</span>
          </NavLink>
          <NavLink to="/participants" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Participants">
            <ParticipantsIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Participants</span>
          </NavLink>
          <NavLink to="/templates" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Templates">
            <TemplatesIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Templates</span>
          </NavLink>

          <p className={`px-2 pt-4 pb-2 text-xs font-semibold uppercase text-light-text-secondary/70 dark:text-brand-text-secondary/60 tracking-wider ${spanClasses}`}>Campaigns</p>
          <NavLink to="/blast" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Email Blast">
            <BlastIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Email Blast</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="History">
            <HistoryIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>History</span>
          </NavLink>

          <p className={`px-2 pt-4 pb-2 text-xs font-semibold uppercase text-light-text-secondary/70 dark:text-brand-text-secondary/60 tracking-wider ${spanClasses}`}>Account</p>
          <NavLink to="/subscription" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Subscription">
            <SubscriptionIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Subscription</span>
          </NavLink>
          <NavLink to="/billing" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Billing">
            <BillingIcon className="w-5 h-5" />
            <span className={`text-sm ${spanClasses}`}>Billing</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Settings">
                <SettingsIcon className="w-5 h-5" />
                <span className={`text-sm ${spanClasses}`}>Settings</span>
          </NavLink>

          {user?.role === 'SuperAdmin' && (
            <>
              <p className={`px-2 pt-4 pb-2 text-xs font-semibold uppercase text-light-text-secondary/70 dark:text-brand-text-secondary/60 tracking-wider ${spanClasses}`}>Super Admin</p>
              <NavLink to="/users" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Users">
                <UsersIcon className="w-5 h-5" />
                <span className={`text-sm ${spanClasses}`}>Users</span>
              </NavLink>
              <NavLink to="/activity-log" className={({ isActive }) => linkClasses(isActive)} onClick={handleNavClick} title="Activity Log">
                <HistoryIcon className="w-5 h-5" />
                <span className={`text-sm ${spanClasses}`}>Activity Log</span>
              </NavLink>
            </>
          )}


        </nav>
      </div>
      
      <div className="mt-auto flex-shrink-0 p-2">
        <div className={`bg-light-bg dark:bg-brand-light/30 p-3 rounded-lg ${isCollapsed ? 'hidden' : ''}`}>
            {isSubscribed ? (
                <div className="text-sm font-semibold text-yellow-500 flex items-center justify-center space-x-2">
                    <SubscriptionIcon className="w-5 h-5" />
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
                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">
                        {aiUsage.limit - aiUsage.count} actions remaining
                    </p>
                    {aiUsage.count > 0 && (
                        <p className="text-xs text-light-text-secondary dark:text-brand-text-secondary mt-1">
                            Resets in {timeUntilReset}
                        </p>
                    )}
                </div>
            )}
        </div>
      </div>
    </aside>
  );
};