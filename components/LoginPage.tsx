import React, { useState } from 'react';
import { LogoIcon, LoadingIcon, GoogleIcon } from './common/Icons';
import { ThemeToggle } from './common/ThemeToggle';

interface LoginPageProps {
  onLoginSuccess: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * Renders the login page for the application.
 * It handles user input for credentials, validates them, and calls a success handler on correct login.
 * It now includes an option for social login.
 * @param {LoginPageProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered login page component.
 */
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, theme, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the form submission for logging in.
   * It simulates an asynchronous login process and validates the credentials.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // ================================================================
      // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
      // ================================================================
      // This is a hardcoded username and password check for demonstration.
      // This is INSECURE and must be replaced in a production application.
      //
      // You should:
      // 1.  Remove this `if` condition.
      // 2.  Make an API call to your backend authentication endpoint.
      //     Example:
      //     fetch('/api/login', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ username, password })
      //     })
      //     .then(response => {
      //       if (response.ok) {
      //         onLoginSuccess();
      //       } else {
      //         // Handle failed login
      //         setError('Invalid username or password.');
      //       }
      //     })
      //     .catch(err => setError('An error occurred.'))
      //     .finally(() => setIsLoading(false));
      // ================================================================
      if (username === 'admin' && password === 'password') {
        onLoginSuccess();
      } else {
        setError('Invalid username or password.');
      }
      setIsLoading(false);
    }, 1000);
  };
  
  /**
   * Simulates a social login process.
   */
  const handleSocialLogin = () => {
    setError(null);
    setIsLoading(true);
    // ================================================================
    // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
    // ================================================================
    // This `setTimeout` simulates a social login flow.
    // In a real application, you would integrate a third-party authentication
    // provider like Firebase Authentication, Auth0, or implement an OAuth 2.0 flow
    // with Google Sign-In.
    //
    // The typical flow would involve:
    // 1.  Using a client-side library from the provider (e.g., Google Identity Services).
    // 2.  Redirecting the user to the provider's login page or showing a pop-up.
    // 3.  After successful authentication, the provider returns a token.
    // 4.  You would then use this token to authenticate the user with your
    //     own backend and then call `onLoginSuccess`.
    // ================================================================
    setTimeout(() => {
        onLoginSuccess();
        // No need to set isLoading to false as the component will unmount
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center z-10 p-4">
      <div className="absolute top-4 right-4">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
      </div>
      <div className="w-full max-w-md bg-light-surface/80 dark:bg-brand-dark/50 backdrop-blur-lg border border-light-border dark:border-brand-light/20 rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center items-center space-x-3 mb-4">
          <LogoIcon />
          <h1 className="text-3xl font-bold font-title">SUDi</h1>
        </div>
        <h2 className="text-xl text-light-text-secondary dark:text-brand-text-secondary mb-8">Login to Your Account</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent placeholder-light-text-secondary dark:placeholder-brand-text-secondary"
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent placeholder-light-text-secondary dark:placeholder-brand-text-secondary"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center mx-auto space-x-2 shadow-lg shadow-brand-accent-purple/20 dark:shadow-brand-accent/20 disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingIcon />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-light-border dark:border-brand-light/50"></div>
            <span className="flex-shrink mx-4 text-xs text-light-text-secondary dark:text-brand-text-secondary">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-light-border dark:border-brand-light/50"></div>
        </div>
        
        <div className="flex flex-col space-y-4">
            <button
                type="button"
                onClick={handleSocialLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-brand-light/50 border border-light-border dark:border-brand-light/50 rounded-lg py-2.5 px-4 hover:bg-slate-50 dark:hover:bg-brand-light transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <GoogleIcon />
                <span className="font-semibold text-sm text-light-text dark:text-brand-text">Sign in with Google</span>
            </button>
        </div>

         <p className="text-xs text-light-text-secondary dark:text-brand-text-secondary mt-6">
            Hint: Use `admin` and `password` to login.
        </p>
      </div>
    </div>
  );
};