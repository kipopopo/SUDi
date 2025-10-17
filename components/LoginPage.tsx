import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, remember: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
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
        <h1 className="text-3xl font-bold text-center text-light-text dark:text-white mb-2">Sistem Undangan Digital (SUDi)</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
            />
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
                Remember me
              </label>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition mt-6"
        >
          Login
        </button>
        <p className="text-center text-sm text-light-text-secondary dark:text-brand-text-secondary mt-4">
          Don't have an account? <Link to="/register" className="text-brand-accent-purple dark:text-brand-accent">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;