import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from 'react';
import { AppSettings, SenderProfile, PaymentMethod, Invoice } from '../types';
import { getUserSettings, saveUserSettings, getGlobalSettings, saveGlobalSettings } from '../services/settingsService';
import { getSenderProfile, saveSenderProfile } from '../services/senderService';
import { getPaymentMethods, savePaymentMethods, getInvoices, saveInvoices } from '../services/billingService';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  userSettings: AppSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  globalSettings: AppSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  senderProfile: SenderProfile | null;
  setSenderProfile: React.Dispatch<React.SetStateAction<SenderProfile | null>>;
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultAppSettings: AppSettings = {
  globalHeader: '',
  globalFooter: '',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [userSettings, setUserSettings] = useState<AppSettings>(defaultAppSettings);
  const [globalSettings, setGlobalSettings] = useState<AppSettings>(defaultAppSettings);
  const [senderProfile, setSenderProfile] = useState<SenderProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  // refs to avoid saving immediately after a fetch
  const initialUserSettingsLoaded = useRef(false);
  const initialGlobalSettingsLoaded = useRef(false);

  // Fetch user and global settings from backend when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchAllSettings = async () => {
        try {
          const fetchedUserSettings = await getUserSettings();
          setUserSettings(fetchedUserSettings);
          const fetchedGlobalSettings = await getGlobalSettings();
          setGlobalSettings(fetchedGlobalSettings);
        } catch (error) {
          console.error("Failed to fetch settings:", error);
          setUserSettings(defaultAppSettings);
          setGlobalSettings(defaultAppSettings);
        }
      };
      fetchAllSettings();
    } else {
      // Clear settings when not authenticated
      setUserSettings(defaultAppSettings);
      setGlobalSettings(defaultAppSettings);
      setSenderProfile(null);
      setPaymentMethods([]);
      setInvoices([]);
    }
  }, [isAuthenticated, user]);

  // Save user settings to backend when userSettings state changes
  useEffect(() => {
    if (!isAuthenticated) return;
    // Skip saving until initial user settings have been loaded from backend
    if (!initialUserSettingsLoaded.current) {
      initialUserSettingsLoaded.current = true;
      return;
    }
    if (userSettings !== defaultAppSettings) {
      const saveUserSetting = async () => {
        try {
          await saveUserSettings(userSettings);
        } catch (error) {
          console.error("Failed to save user settings:", error);
        }
      };
      saveUserSetting();
    }
  }, [userSettings, isAuthenticated]);

  // Save global settings to backend when globalSettings state changes
  useEffect(() => {
    if (!isAuthenticated) return;
    // Skip saving until initial global settings have been loaded from backend
    if (!initialGlobalSettingsLoaded.current) {
      initialGlobalSettingsLoaded.current = true;
      return;
    }
    if (globalSettings !== defaultAppSettings) {
      const saveGlobalSetting = async () => {
        try {
          await saveGlobalSettings(globalSettings);
        } catch (error) {
          console.error("Failed to save global settings:", error);
        }
      };
      saveGlobalSetting();
    }
  }, [globalSettings, isAuthenticated]);

  // The following useEffects are for other data types still using localStorage
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

  const value = useMemo(() => ({
    userSettings,
    setUserSettings,
    globalSettings,
    setGlobalSettings,
    senderProfile,
    setSenderProfile,
    paymentMethods,
    setPaymentMethods,
    invoices,
    setInvoices
  }), [userSettings, globalSettings, senderProfile, paymentMethods, invoices]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
