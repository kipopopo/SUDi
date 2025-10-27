import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validation';

const RegistrationPage: React.FC = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Use a memoized result of validation for rendering password requirements
    const passwordValidationResults = React.useMemo(() => validatePassword(password), [password]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
    };

    const handleRegister = async () => {
        // Client-side validation
        if (!username || !password || !confirmPassword || !email || !firstName || !lastName) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const validation = validatePassword(password);
        // Password strength validation
        if (!validation.length || !validation.uppercase || !validation.lowercase || !validation.number || !validation.special) {
            setError('Password does not meet the requirements. Please ensure it has at least 8 characters, includes uppercase and lowercase letters, a number, and a special character.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Invalid email format');
            return;
        }

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, confirmPassword, email, firstName, lastName }),
        });

        if (response.ok) {
            navigate('/login');
        } else {
            const data = await response.json();
            setError(data.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-brand-darker flex items-center justify-center p-4">
            <div className="bg-light-surface dark:bg-brand-dark p-8 rounded-lg shadow-lg w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Registration Form */}
                <div>
                    <h2 className="text-2xl font-bold text-center text-light-text dark:text-white mb-6">{t('registrationPage.title')}</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.firstNameLabel')}</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.lastNameLabel')}</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.emailLabel')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.usernameLabel')}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.passwordLabel')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">{t('registrationPage.confirmPasswordLabel')}</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleRegister}
                        className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition mt-6"
                    >
                        {
                            t('registrationPage.registerButton')
                        }
                    </button>
                    <p className="text-center text-sm text-light-text-secondary dark:text-brand-text-secondary mt-4">
                        {t('registrationPage.loginPrompt')} <Link to="/login" className="text-brand-accent-purple dark:text-brand-accent">{t('registrationPage.loginLink')}</Link>
                    </p>
                </div>

                {/* Right Column: Additional Information */}
                <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-semibold text-light-text dark:text-white mb-4">{t('registrationPage.welcomeMessage')}</h3>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary mb-4">
                        {t('registrationPage.welcomeSubtitle')}
                    </p>
                    <ul className="space-y-2 text-sm text-light-text-secondary dark:text-brand-text-secondary">
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('registrationPage.feature1')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('registrationPage.feature2')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('registrationPage.feature3')}
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {t('registrationPage.feature4')}
                        </li>
                    </ul>
                    <div className="mt-6 p-4 bg-light-bg dark:bg-brand-light/20 rounded-md">
                        <h4 className="font-medium text-light-text dark:text-white mb-2">{t('registrationPage.passwordRequirementsTitle')}</h4>
                        <ul className="text-xs space-y-1">
                            <li className={`flex items-center ${passwordValidationResults.length ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidationResults.length ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                {t('registrationPage.passwordRequirement1')}
                            </li>
                            <li className={`flex items-center ${passwordValidationResults.uppercase ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidationResults.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                {t('registrationPage.passwordRequirement2')}
                            </li>
                            <li className={`flex items-center ${passwordValidationResults.lowercase ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidationResults.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                {t('registrationPage.passwordRequirement3')}
                            </li>
                            <li className={`flex items-center ${passwordValidationResults.number ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidationResults.number ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                {t('registrationPage.passwordRequirement4')}
                            </li>
                            <li className={`flex items-center ${passwordValidationResults.special ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidationResults.special ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                {t('registrationPage.passwordRequirement5')}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;