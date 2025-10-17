import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SenderProfile } from '../types';
import { CheckCircleIcon, HistoryIcon, LoadingIcon, MailIcon } from './common/Icons';
import { useSettings } from '../contexts/SettingsContext';

interface SenderSetupProps {}

type VerificationStatus = 'unverified' | 'pending' | 'verified';

const SenderSetup: React.FC<SenderSetupProps> = () => {
    const { senderProfile, setSenderProfile } = useSettings();
    const [name, setName] = useState(senderProfile?.name || '');
    const [email, setEmail] = useState(senderProfile?.email || '');
    const [originalEmail, setOriginalEmail] = useState(senderProfile?.email || '');
    const [verificationCode, setVerificationCode] = useState('');
    
    const [status, setStatus] = useState<VerificationStatus>(senderProfile?.verified ? 'verified' : 'unverified');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setName(senderProfile?.name || '');
        setEmail(senderProfile?.email || '');
        setOriginalEmail(senderProfile?.email || '');
        setStatus(senderProfile?.verified ? 'verified' : 'unverified');
    }, [senderProfile]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (e.target.value.toLowerCase() !== originalEmail.toLowerCase()) {
            setStatus('unverified');
            setVerificationCode('');
            setError('');
        } else if (senderProfile?.verified) {
            setStatus('verified');
        }
    };

    const handleSendCode = async () => {
        setError('');
        if (!name.trim() || !email.trim()) {
            setError('Sender Name and Email cannot be empty.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.post('/api/send-verification-code', { email });
            setStatus('pending');
        } catch (err) {
            setError('Failed to send verification code. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setError('');
        if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
             setError('Please enter a valid 6-digit verification code.');
             return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/verify-code', { email, code: verificationCode });
            const newProfile: SenderProfile = { name: name.trim(), email: email.trim(), verified: true };
            setSenderProfile(newProfile);
            setOriginalEmail(email);
            setStatus('verified');
        } catch (err) {
            setError('Invalid verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = name !== (senderProfile?.name || '') || email !== (senderProfile?.email || '');
    
    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title">Sender Setup</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Configure and verify the email address used to send campaigns.</p>
            </div>

            <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sender-name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Sender Name</label>
                        <input
                            id="sender-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., The SUDi Team"
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                     <div>
                        <label htmlFor="sender-email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Sender Email</label>
                        <input
                            id="sender-email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="e.g., noreply@sudi.app"
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-light-border dark:border-brand-light/20">
                    <h3 className="text-lg font-semibold mb-4">Verification Status</h3>

                    {status === 'unverified' && (
                        <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg flex flex-col items-center text-center">
                            <HistoryIcon className="w-8 h-8 mb-2" />
                            <p className="font-semibold">Your sender email is unverified.</p>
                            <p className="text-sm mb-4">You must verify your email address before you can send campaigns.</p>
                            <button 
                                onClick={handleSendCode}
                                disabled={isLoading}
                                className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2">
                                {isLoading ? <LoadingIcon /> : <MailIcon />}
                                <span>{isLoading ? 'Sending...' : 'Send Verification Code'}</span>
                            </button>
                        </div>
                    )}
                    
                    {status === 'pending' && (
                        <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex flex-col items-center text-center">
                             <MailIcon className="w-8 h-8 mb-2" />
                             <p className="font-semibold">A verification code has been sent to {email}.</p>
                             <p className="text-sm mb-4">Please enter the 6-digit code below to complete verification.</p>
                             <div className="flex flex-col sm:flex-row items-center gap-2">
                                 <input 
                                     type="text"
                                     value={verificationCode}
                                     onChange={(e) => setVerificationCode(e.target.value)}
                                     maxLength={6}
                                     placeholder="_ _ _ _ _ _"
                                     className="w-40 bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light text-center font-mono tracking-[0.5em] text-lg"
                                 />
                                 <button
                                     onClick={handleVerifyCode}
                                     disabled={isLoading}
                                     className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                                 >
                                    {isLoading ? <LoadingIcon /> : <CheckCircleIcon />}
                                     <span>{isLoading ? 'Verifying...' : 'Verify'}</span>
                                 </button>
                             </div>
                        </div>
                    )}

                    {status === 'verified' && (
                        <div className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center space-x-4">
                            <CheckCircleIcon className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Your sender email is verified!</p>
                                <p className="text-sm">You can now send campaigns from <span className="font-mono">{email}</span>.</p>
                                {isDirty && (
                                     <p className="text-sm mt-2 text-yellow-800 dark:text-yellow-300">You have unsaved changes. A new verification will be required.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>

            </div>
        </div>
};
