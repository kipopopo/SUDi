import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon } from './common/Icons';
import { useSettings } from '../contexts/SettingsContext';

const GlobalEmailSettings: React.FC = () => {
  const { t } = useTranslation();
  const { globalSettings, setGlobalSettings } = useSettings();
  const [globalHeader, setGlobalHeader] = useState(globalSettings.globalHeader);
  const [globalFooter, setGlobalFooter] = useState(globalSettings.globalFooter);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setGlobalHeader(globalSettings.globalHeader);
    setGlobalFooter(globalSettings.globalFooter);
  }, [globalSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalSettings(prev => ({ ...prev, globalHeader, globalFooter }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in-fast">
      <h2 className="text-xl font-bold font-title mb-6">{t('globalEmailSettings.title')}</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="globalHeader" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('globalEmailSettings.headerLabel')}</label>
          <textarea
            id="globalHeader"
            rows={6}
            value={globalHeader}
            onChange={(e) => setGlobalHeader(e.target.value)}
            className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent font-mono text-sm"
            placeholder={t('globalEmailSettings.headerPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="globalFooter" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('globalEmailSettings.footerLabel')}</label>
          <textarea
            id="globalFooter"
            rows={6}
            value={globalFooter}
            onChange={(e) => setGlobalFooter(e.target.value)}
            className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent font-mono text-sm"
            placeholder={t('globalEmailSettings.footerPlaceholder')}
          />
        </div>
        <div className="pt-2 flex items-center justify-end space-x-4">
          {showSuccess && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
              <CheckCircleIcon />
              <span className="font-semibold text-sm">{t('globalEmailSettings.saveSuccess')}</span>
            </div>
          )}
          <button type="submit" className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">{t('globalEmailSettings.saveButton')}</button>
        </div>
      </form>
    </div>
  );
};

export default GlobalEmailSettings;