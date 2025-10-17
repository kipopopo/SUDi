import React, { useState, useContext } from 'react';
import { CheckCircleIcon } from './common/Icons';
import { useAuth } from '../contexts/AuthContext';

const ProfileSettings: React.FC = () => {
    const auth = useAuth();
    const [firstName, setFirstName] = useState(auth?.user?.firstName || '');
    const [lastName, setLastName] = useState(auth?.user?.lastName || '');
    const [email, setEmail] = useState(auth?.user?.email || '');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        // NOTE: In a real app, this would make an API call to update user data.
        console.log('Profile updated:', { firstName, lastName, email });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };


    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title dark:text-white">Profile Settings</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Manage your personal information and account security.</p>
            </div>
            
            <div className="space-y-12">
                {/* Personal Information */}
                <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                    <h2 className="text-xl font-bold font-title mb-6 dark:text-white">Personal Information</h2>
                    <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder={auth?.user?.firstName || ''}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder={auth?.user?.lastName || ''}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                                                            <input
                                                                id="email"
                                                                type="email"
                                                                placeholder={auth?.user?.email || ''}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                                            />                        </div>
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


            </div>
        </div>
    );
};

export default ProfileSettings;
