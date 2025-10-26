import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, remember: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const response = await api.post('/login', { username, password });
      onLoginSuccess(response.data.token, rememberMe);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-brand-darker flex items-center justify-center">
      <div className="bg-light-surface dark:bg-brand-dark p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/assets/logo-sudi-light-mode.png"
            alt="SUDi Logo"
            className="h-16 dark:hidden"
          />
          <img
            src="/assets/logo-sudi-dark-mode.png"
            alt="SUDi Logo"
            className="h-16 hidden dark:block"
          />
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('loginPage.usernameLabel')}</label>
                      <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('loginPage.passwordLabel')}</label>
                      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                    </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-brand-accent-purple dark:text-brand-accent focus:ring-brand-accent-purple dark:focus:ring-brand-accent border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-light-text-secondary dark:text-brand-text-secondary">
                {t('loginPage.rememberMeLabel')}
              </label>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition mt-6"
        >
          {
            t('loginPage.loginButton')
          }
        </button>
        <p className="text-center text-sm text-light-text-secondary dark:text-brand-text-secondary mt-4">
          {t('loginPage.registerPrompt')} <Link to="/register" className="text-brand-accent-purple dark:text-brand-accent">{t('loginPage.registerLink')}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;