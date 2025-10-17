import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ParticipantsManager = lazy(() => import('./components/ParticipantsManager'));
const DepartmentsManager = lazy(() => import('./components/DepartmentsManager'));
const TemplatesManager = lazy(() => import('./components/TemplatesManager'));
const BlastManager = lazy(() => import('./components/BlastManager'));
const HistoryManager = lazy(() => import('./components/HistoryManager'));
const Analytics = lazy(() => import('./components/Analytics'));
const SettingsManager = lazy(() => import('./components/SettingsManager'));
const SenderSetup = lazy(() => import('./components/SenderSetup'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const SubscriptionManager = lazy(() => import('./components/SubscriptionManager'));
const BillingManager = lazy(() => import('./components/BillingManager'));
const RegistrationPage = lazy(() => import('./components/RegistrationPage'));
const UserManager = lazy(() => import('./components/UserManager'));

import { SubscriptionModal } from './components/SubscriptionModal';
import { AiUsage } from './types';
import { getAiUsage } from './services/usageService';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { isAuthenticated, login, logout, user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => localStorage.getItem('sudi-subscribed') === 'true');
  const [aiUsage, setAiUsage] = useState<AiUsage>(getAiUsage());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  
  const refreshAiUsage = useCallback(() => {
    setAiUsage(getAiUsage());
  }, []);

  // Effect to update timeUntilReset every second
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const resetTimestamp = aiUsage.resetTimestamp;
      const difference = resetTimestamp - now;

      if (difference <= 0) {
        setTimeUntilReset('00:00:00');
        // Optionally, refresh AI usage immediately if reset time has passed
        refreshAiUsage(); 
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const formatUnit = (unit: number) => unit < 10 ? `0${unit}` : `${unit}`;

      setTimeUntilReset(`${formatUnit(hours)}:${formatUnit(minutes)}:${formatUnit(seconds)}`);
    };

    calculateTimeRemaining(); // Initial calculation
    const intervalId = setInterval(calculateTimeRemaining, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [aiUsage.resetTimestamp, refreshAiUsage]);

  useEffect(() => {
    localStorage.setItem('sudi-subscribed', String(isSubscribed));
  }, [isSubscribed]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAiUsage(); 
    }
  }, [isAuthenticated, refreshAiUsage]);

  const handlePromptSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
    // You might want to navigate to the subscription page here
  };

  const commonAiProps = {
    isSubscribed,
    aiUsage,
    refreshAiUsage,
    promptSubscription: handlePromptSubscription,
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-brand-darker text-light-text dark:text-brand-text font-sans flex relative overflow-x-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-brand-accent-purple/10 dark:bg-brand-accent-purple/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-brand-accent/10 dark:bg-brand-accent/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-brand-accent/5 dark:bg-brand-accent/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      
      <Suspense fallback={<div>Loading...</div>}>
        {!isAuthenticated ? (
          <div className="w-full h-screen flex items-center justify-center">
            <Routes>
              <Route path="/login" element={<LoginPage onLoginSuccess={(token, remember) => login(token, remember)} />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        ) : (
          <>
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30"></div>}

            <Sidebar 
              isOpen={isSidebarOpen} 
              setIsOpen={setIsSidebarOpen}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              aiUsage={aiUsage}
              isSubscribed={isSubscribed}
              timeUntilReset={timeUntilReset}
              user={user}
            />
            
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
              <Header 
                handleLogout={logout} 
                onMenuClick={() => setIsSidebarOpen(true)}
                isModalOpen={showSubscriptionModal}
                isSidebarCollapsed={isSidebarCollapsed}
              />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto z-10">
                <Routes>
                  <Route path="/login" element={<Navigate to="/dashboard" />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/participants" element={<ParticipantsManager {...commonAiProps} isSidebarCollapsed={isSidebarCollapsed} />} />
                  <Route path="/departments" element={<DepartmentsManager isSidebarCollapsed={isSidebarCollapsed} />} />
                  <Route path="/templates" element={<TemplatesManager {...commonAiProps} isSidebarCollapsed={isSidebarCollapsed} />} />
                  <Route path="/blast" element={<BlastManager />} />
                  <Route path="/history" element={<HistoryManager />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/subscription" element={<SubscriptionManager isSubscribed={isSubscribed} setIsSubscribed={setIsSubscribed} />} />
                  <Route path="/billing" element={<BillingManager />} />
          
                  <Route path="/settings" element={<SettingsManager />} />
                  <Route path="/settings/sender" element={<SenderSetup />} />
                  <Route path="/users" element={<UserManager isSidebarCollapsed={isSidebarCollapsed} />} />
                </Routes>
              </main>
            </div>
            {showSubscriptionModal && (
              <SubscriptionModal 
                  onClose={() => setShowSubscriptionModal(false)}
                  onSubscribe={handleSubscribe}
                  isSidebarCollapsed={isSidebarCollapsed}
              />
            )}
          </>
        )}
      </Suspense>
    </div>
  );
};

export default App;