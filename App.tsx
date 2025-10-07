import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ParticipantsManager } from './components/ParticipantsManager';
import { DepartmentsManager } from './components/DepartmentsManager';
import { TemplatesManager } from './components/TemplatesManager';
import { BlastManager } from './components/BlastManager';
import HistoryManager from './components/HistoryManager';
import Analytics from './components/Analytics';
import { EmailSettings } from './components/SettingsManager';
import { SenderSetup } from './components/SenderSetup';
import { LoginPage } from './components/LoginPage';
import SubscriptionManager from './components/SubscriptionManager';
import BillingManager from './components/BillingManager';
import ProfileSettings from './components/ProfileSettings';
import { SubscriptionModal } from './components/SubscriptionModal';
import { View, Participant, Department, EmailTemplate, BlastHistoryItem, RecipientActivity, AppSettings, AiUsage, PaymentMethod, Invoice, SenderProfile } from './types';
import { getHistory, saveHistory } from './services/historyService';
import { getSettings, saveSettings } from './services/settingsService';
import { getSenderProfile, saveSenderProfile } from './services/senderService';
import { getAiUsage } from './services/usageService';
import { getPaymentMethods, savePaymentMethods, getInvoices, saveInvoices } from './services/billingService';

// ================================================================
// NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
// ================================================================
// The following `initial...` arrays are mock data for demonstration.
// In a production application, this data should not be hardcoded.
// You should:
// 1. Remove these constant arrays.
// 2. Implement a backend service with a database (e.g., PostgreSQL, MongoDB) 
//    to store and manage departments, participants, and templates.
// 3. In the `App` component, use a `useEffect` hook to fetch this data 
//    from your backend API when the component mounts.
//    Example:
//    useEffect(() => {
//      fetch('/api/departments').then(res => res.json()).then(setDepartments);
//      fetch('/api/participants').then(res => res.json()).then(setParticipants);
//      // etc.
//    }, []);
// ================================================================
const initialDepartments: Department[] = [
  { id: '1', name: 'Marketing' },
  { id: '2', name: 'Engineering' },
  { id: '3', name: 'Human Resources' },
  { id: '4', name: 'Sales' },
];

const initialParticipants: Participant[] = [
  { id: '101', name: 'John Doe', email: 'john.doe@example.com', role: 'Pembangun Frontend', departmentId: '2' },
  { id: '102', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Pengurus Pemasaran', departmentId: '1' },
  { id: '103', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Eksekutif Jualan', departmentId: '4' },
  { id: '104', name: 'Mary Johnson', email: 'mary.j@example.com', role: 'Pakar Sumber Manusia', departmentId: '3' },
  { id: '105', name: 'Sam Wilson', email: 'sam.w@example.com', role: 'Pembangun Backend', departmentId: '2' },
  { id: '106', name: 'Patricia Williams', email: 'pat.w@example.com', role: 'Pakar SEO', departmentId: '1' },
];

const initialTemplates: EmailTemplate[] = [
  { id: 't1', name: 'Tech Conference Invite', subject: 'Invitation: Annual Tech Conference 2024', body: 'Hello {name},\n\nYou are invited to our annual tech conference...', category: 'Event Invitations' },
  { id: 't2', name: 'Product Launch Announcement', subject: 'Introducing Our New Product!', body: 'Hi {name},\n\nWe are excited to announce the launch of our new product...', category: 'Marketing' },
  { id: 't3', name: 'Internal Q3 Update', subject: 'Q3 Company Performance Review', body: 'Hello Team,\n\nPlease join us for the quarterly review...', category: 'Internal Communication' }
];


type Theme = 'light' | 'dark';

/**
 * Generates detailed mock analytics for a completed email blast.
 * @param {string[]} recipientIds - Array of participant IDs who received the email.
 * @param {Participant[]} allParticipants - The complete list of all participants in the app.
 * @returns {object} An object containing detailed recipient activity and calculated performance rates.
 */
const generateMockAnalytics = (recipientIds: string[], allParticipants: Participant[]) => {
    const recipients = allParticipants.filter(p => recipientIds.includes(p.id));
    let opened = 0;
    let clicked = 0;
    let unsubscribed = 0;
    let bounced = 0;

    const detailedRecipientActivity: RecipientActivity[] = recipients.map(p => {
        const random = Math.random();
        let status: RecipientActivity['status'] = 'Sent';

        // Simulate engagement funnel (Bounce -> Open -> Click/Unsubscribe)
        if (random < 0.02) { // 2% bounce rate
            status = 'Bounced';
            bounced++;
        } else if (random < 0.5) { // 48% open rate (of delivered)
            status = 'Opened';
            opened++;
            if (random > 0.3) { // ~40% click rate (of opened)
                status = 'Clicked';
                clicked++;
            } else if (random < 0.32) { // ~2% unsubscribe rate (of opened)
                status = 'Unsubscribed';
                unsubscribed++;
            }
        }
        return { participantId: p.id, name: p.name, email: p.email, status };
    });
    
    const deliveredCount = recipients.length - bounced;
    const deliveryRate = recipients.length > 0 ? parseFloat(((deliveredCount / recipients.length) * 100).toFixed(2)) : 0;
    const openRate = deliveredCount > 0 ? parseFloat(((opened / deliveredCount) * 100).toFixed(2)) : 0;
    const clickRate = opened > 0 ? parseFloat(((clicked / opened) * 100).toFixed(2)) : 0;
    const unsubscribeRate = opened > 0 ? parseFloat(((unsubscribed / opened) * 100).toFixed(2)) : 0;

    return {
        detailedRecipientActivity,
        deliveryRate,
        openRate,
        clickRate,
        unsubscribeRate,
    };
};

const analytics1 = generateMockAnalytics(['102', '106'], initialParticipants);
const analytics2 = generateMockAnalytics(['103', '104'], initialParticipants);
const analytics3 = generateMockAnalytics(['101', '102', '103', '104', '105', '106'], initialParticipants);

const initialHistory: BlastHistoryItem[] = [
  {
    id: 'hist_1719900000000',
    templateName: 'Tech Conference Invite',
    subject: 'Invitation: Annual Tech Conference 2024',
    recipientGroup: 'Marketing',
    recipientCount: 2,
    sentDate: '2024-07-02T10:00:00.000Z',
    status: 'Completed',
    body: 'Hello {name},\n\nYou are invited to our annual tech conference...',
    recipientIds: ['102', '106'],
    ...analytics1,
  },
  {
    id: 'hist_1719986400000',
    templateName: 'Internal Q3 Update',
    subject: 'Q3 Company Performance Review',
    recipientGroup: 'Sales & HR',
    recipientCount: 2,
    sentDate: '2024-07-03T10:00:00.000Z',
    status: 'Completed',
    body: 'Hello Team,\n\nPlease join us for the quarterly review...',
    recipientIds: ['103', '104'],
    ...analytics2,
  },
   {
    id: 'hist_1720072800000',
    templateName: 'Product Launch Announcement',
    subject: 'Introducing Our New Product!',
    recipientGroup: 'All Departments',
    recipientCount: 6,
    sentDate: '2024-07-04T10:00:00.000Z',
    status: 'Completed',
    body: 'Hi {name},\n\nWe are excited to announce the launch of our new product...',
    recipientIds: ['101', '102', '103', '104', '105', '106'],
    ...analytics3,
  },
  {
    id: 'hist_1720162800000',
    templateName: 'Upcoming Holiday Schedule',
    subject: 'Office Closure for Public Holiday',
    recipientGroup: 'All Departments',
    recipientCount: 6,
    status: 'Scheduled',
    sentDate: '',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    body: 'Hi Team, quick reminder...',
    recipientIds: ['101', '102', '103', '104', '105', '106'],
    deliveryRate: 0, openRate: 0, clickRate: 0, unsubscribeRate: 0, detailedRecipientActivity: []
  }
];

/**
 * The main component of the application.
 * It manages the overall layout, theme, and navigation between different views.
 * It also holds the centralized state for participants, departments, and templates.
 * @returns {React.ReactElement} The rendered App component.
 */
const App: React.FC = () => {
  // ================================================================
  // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
  // ================================================================
  // This is a mock authentication state for demonstration purposes.
  // Using `sessionStorage` is not secure for a real application.
  // For production, you should implement a proper authentication system:
  // 1.  Set up a backend authentication service (e.g., using JWT, OAuth2).
  // 2.  The login page should send credentials to your backend.
  // 3.  The backend should validate credentials and return a token (e.g., JWT).
  // 4.  Store the token securely (e.g., in an HttpOnly cookie).
  // 5.  This `isAuthenticated` state should be derived from the presence of a
  //     valid token, possibly managed via a React Context or state management library.
  // ================================================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check session storage to see if the user is already logged in.
    return sessionStorage.getItem('sudi-auth') === 'true';
  });
  
  // State to manage the currently active view (e.g., 'dashboard', 'participants').
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Centralized state for the application's core data
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [history, setHistory] = useState<BlastHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [senderProfile, setSenderProfile] = useState<SenderProfile | null>(getSenderProfile());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // State to manage the current theme ('light' or 'dark').
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('sudi-theme');
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
  });
  
  // State for managing sidebar visibility on mobile devices
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for subscription status and AI usage limits
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => localStorage.getItem('sudi-subscribed') === 'true');
  const [aiUsage, setAiUsage] = useState<AiUsage>(getAiUsage());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Callback to update AI usage from anywhere in the app
  const refreshAiUsage = useCallback(() => {
    setAiUsage(getAiUsage());
  }, []);

  // Persist subscription status to localStorage
  useEffect(() => {
    localStorage.setItem('sudi-subscribed', String(isSubscribed));
  }, [isSubscribed]);

  // Load data from localStorage on initial mount
  useEffect(() => {
    if (isAuthenticated) {
      const storedHistory = getHistory();
      setHistory(storedHistory.length > 0 ? storedHistory : initialHistory);
      setSettings(getSettings());
      setPaymentMethods(getPaymentMethods());
      setInvoices(getInvoices());
      refreshAiUsage(); // Check usage on login
    }
  }, [isAuthenticated, refreshAiUsage]);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated) {
      saveHistory(history);
    }
  }, [history, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        saveSettings(settings);
    }
  }, [settings, isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
        saveSenderProfile(senderProfile);
    }
  }, [senderProfile, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        savePaymentMethods(paymentMethods);
    }
  }, [paymentMethods, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        saveInvoices(invoices);
    }
  }, [invoices, isAuthenticated]);

  // ================================================================
  // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
  // ================================================================
  // This `useEffect` hook simulates a scheduler for email blasts using `setInterval`.
  // This is NOT a reliable or scalable approach for a production application
  // because it only runs when a user has the application open in their browser.
  //
  // For a real application, this logic should be moved to a backend service:
  // 1.  When a user schedules an email, save the blast details and schedule time
  //     to your database.
  // 2.  Use a cron job or a dedicated task scheduler (like Celery for Python,
  //     node-cron for Node.js, or a cloud provider's scheduled function service)
  //     on your server.
  // 3.  The cron job will run periodically, check the database for due tasks,
  //     and execute the email blasts from the backend.
  // ================================================================
  useEffect(() => {
    if (!isAuthenticated) return;

    const schedulerInterval = setInterval(() => {
      const now = new Date();
      
      setHistory(currentHistory => {
        let historyUpdated = false;
        const updatedHistory = currentHistory.map(item => {
          if (item.status === 'Scheduled' && item.scheduledDate && new Date(item.scheduledDate) <= now) {
            historyUpdated = true;
            const analytics = generateMockAnalytics(item.recipientIds, participants);
            return { 
              ...item, 
              status: 'Completed' as 'Completed', 
              sentDate: new Date().toISOString(),
              ...analytics 
            };
          }
          return item;
        });
        
        return historyUpdated ? updatedHistory : currentHistory;
      });

    }, 30000); // Check every 30 seconds

    return () => clearInterval(schedulerInterval);
  }, [isAuthenticated, participants]); // Add participants as a dependency

  /**
   * A side effect that runs whenever the theme state changes.
   * It updates the class on the root HTML element to apply the correct theme styles
   * and saves the current theme to localStorage.
   */
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('sudi-theme', theme);
  }, [theme]);

  /**
   * Toggles the application theme between 'light' and 'dark'.
   * It updates the theme state, which in turn triggers the useEffect hook.
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  /**
   * ================================================================
   * NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
   * ================================================================
   * This is a mock login handler. In a real application, this function would
   * be called after a successful API call to your authentication backend.
   * See the note on `isAuthenticated` state for more details.
   * ================================================================
   */
  const handleLogin = () => {
    sessionStorage.setItem('sudi-auth', 'true');
    setIsAuthenticated(true);
  };
  
  /**
   * ================================================================
   * NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
   * ================================================================
   * This is a mock logout handler. In a real application, you would also
   * make an API call to your backend to invalidate the session/token and
   * clear any securely stored tokens (like HttpOnly cookies).
   * ================================================================
   */
  const handleLogout = () => {
    sessionStorage.removeItem('sudi-auth');
    setIsAuthenticated(false);
  };

  const handlePromptSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
    // Optional: Switch to subscription view after successful subscription
    setCurrentView('subscription');
  };

  /**
   * A memoized function that returns the component for the current view.
   * It uses a switch statement to determine which component to render based on the
   * `currentView` state. This helps prevent unnecessary re-renders of the view components.
   * It also passes down the centralized state and setters to the relevant components.
   * @returns {React.ReactElement} The component for the currently selected view.
   */
  const renderView = useCallback(() => {
    const commonAiProps = {
      isSubscribed,
      aiUsage,
      refreshAiUsage,
      promptSubscription: handlePromptSubscription,
    };

    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
                  setCurrentView={setCurrentView}
                  departments={departments}
                  participants={participants}
                  templates={templates}
                  history={history} 
                />;
      case 'participants':
        return <ParticipantsManager participants={participants} setParticipants={setParticipants} departments={departments} {...commonAiProps} />;
      case 'departments':
        return <DepartmentsManager departments={departments} setDepartments={setDepartments} participants={participants} />;
      case 'templates':
        return <TemplatesManager templates={templates} setTemplates={setTemplates} settings={settings} senderProfile={senderProfile} {...commonAiProps} />;
      case 'blast':
        return <BlastManager templates={templates} departments={departments} participants={participants} history={history} setHistory={setHistory} settings={settings} senderProfile={senderProfile} />;
      case 'history':
        return <HistoryManager history={history} />;
      case 'analytics':
        return <Analytics history={history} />;
      case 'subscription':
        return <SubscriptionManager isSubscribed={isSubscribed} setIsSubscribed={setIsSubscribed} />;
      case 'billing':
        return <BillingManager paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} invoices={invoices} />;
      case 'profile':
        return <ProfileSettings />;
      case 'emailSettings':
        return <EmailSettings settings={settings} setSettings={setSettings} />;
      case 'senderSetup':
        return <SenderSetup senderProfile={senderProfile} setSenderProfile={setSenderProfile} />;
      default:
        return <Dashboard 
                  setCurrentView={setCurrentView}
                  departments={departments}
                  participants={participants}
                  templates={templates}
                  history={history}
                />;
    }
  }, [currentView, participants, departments, templates, history, settings, senderProfile, isSubscribed, aiUsage, refreshAiUsage, paymentMethods, invoices]);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-brand-darker text-light-text dark:text-brand-text font-sans flex relative overflow-x-hidden">
      {/* Background decorative elements for a modern, fluid aesthetic */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-brand-accent-purple/10 dark:bg-brand-accent-purple/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-brand-accent/10 dark:bg-brand-accent/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-brand-accent/5 dark:bg-brand-accent/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      
      {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLogin} theme={theme} toggleTheme={toggleTheme}/>
      ) : (
        <>
          {/* Overlay for mobile when sidebar is open */}
          {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30"></div>}

          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen}
            aiUsage={aiUsage}
            isSubscribed={isSubscribed}
          />
          
          <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300 ease-in-out">
            <Header 
              theme={theme} 
              toggleTheme={toggleTheme} 
              handleLogout={handleLogout} 
              onMenuClick={() => setIsSidebarOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto z-10">
              {renderView()}
            </main>
          </div>
          {showSubscriptionModal && (
            <SubscriptionModal 
                onClose={() => setShowSubscriptionModal(false)}
                onSubscribe={handleSubscribe}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;