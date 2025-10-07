import React, { useState } from 'react';
import { CheckCircleIcon } from './common/Icons';

const ProfileSettings: React.FC = () => {
    const [name, setName] = useState('Admin User');
    const [email, setEmail] = useState('admin@sudi.app');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        // NOTE: In a real app, this would make an API call to update user data.
        console.log('Profile updated:', { name, email });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            return;
        }
        // NOTE: In a real app, this would make an API call to change the password.
        console.log('Password change requested.');
        setShowSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title">Profile Settings</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Manage your personal information and account security.</p>
            </div>
            
            <div className="space-y-12">
                {/* Personal Information */}
                <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                    <h2 className="text-xl font-bold font-title mb-6">Personal Information</h2>
                    <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        <div className="pt-2 flex items-center justify-end space-x-4">
                             {showSuccess && (
                                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
                                    <CheckCircleIcon />
                                    <span className="font-semibold text-sm">Saved!</span>
                                </div>
                            )}
                            <button type="submit" className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                    <h2 className="text-xl font-bold font-title mb-6">Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Current Password</label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                         <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                         <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                        <div className="pt-2 flex justify-end">
                            <button type="submit" className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
