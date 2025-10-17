import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegistrationPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });
    const navigate = useNavigate();

    const validatePassword = (password: string) => {
        setPasswordValidations({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        validatePassword(newPassword);
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

        // Password strength validation
        if (!passwordValidations.length || !passwordValidations.uppercase || !passwordValidations.lowercase || !passwordValidations.number || !passwordValidations.special) {
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
                    <h2 className="text-2xl font-bold text-center text-light-text dark:text-white mb-6">Register</h2>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
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
                                onChange={handlePasswordChange}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Confirm Password</label>
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
                        Register
                    </button>
                    <p className="text-center text-sm text-light-text-secondary dark:text-brand-text-secondary mt-4">
                        Already have an account? <Link to="/login" className="text-brand-accent-purple dark:text-brand-accent">Login</Link>
                    </p>
                </div>

                {/* Right Column: Additional Information */}
                <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-semibold text-light-text dark:text-white mb-4">Welcome to SUDi</h3>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary mb-4">
                        Sistem Undangan Digital (SUDi) helps you create and manage beautiful digital invitations for your events.
                    </p>
                    <ul className="space-y-2 text-sm text-light-text-secondary dark:text-brand-text-secondary">
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Create stunning e-cards with customizable templates
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Send bulk invitations to multiple recipients
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Track delivery and engagement metrics
                        </li>
                        <li className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Manage departments and participants easily
                        </li>
                    </ul>
                    <div className="mt-6 p-4 bg-light-bg dark:bg-brand-light/20 rounded-md">
                        <h4 className="font-medium text-light-text dark:text-white mb-2">Password Requirements</h4>
                        <ul className="text-xs space-y-1">
                            <li className={`flex items-center ${passwordValidations.length ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidations.length ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                At least 8 characters long
                            </li>
                            <li className={`flex items-center ${passwordValidations.uppercase ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidations.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                Include uppercase letter
                            </li>
                            <li className={`flex items-center ${passwordValidations.lowercase ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidations.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                Include lowercase letter
                            </li>
                            <li className={`flex items-center ${passwordValidations.number ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidations.number ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                Include at least one number
                            </li>
                            <li className={`flex items-center ${passwordValidations.special ? 'text-green-600 dark:text-green-400' : 'text-light-text-secondary dark:text-brand-text-secondary'}`}>
                                <span className={`mr-2 ${passwordValidations.special ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>✓</span>
                                Include at least one special character
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
};