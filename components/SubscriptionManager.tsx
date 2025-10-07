import React from 'react';
import { CheckCircleIcon, CrownIcon } from './common/Icons';

interface SubscriptionManagerProps {
    isSubscribed: boolean;
    setIsSubscribed: (isSubscribed: boolean) => void;
}

const PlanFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start space-x-3">
        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <span>{children}</span>
    </li>
);

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ isSubscribed, setIsSubscribed }) => {

    const handleUpgrade = () => {
        // In a real app, this would trigger a payment flow (e.g., Stripe Checkout)
        // and on success, update the user's status in the backend.
        setIsSubscribed(true);
    };

    const handleDowngrade = () => {
        if (window.confirm("Are you sure you want to downgrade to the free plan? Your Pro benefits will be lost at the end of the current billing cycle.")) {
            // In a real app, this would make an API call to cancel the subscription.
            setIsSubscribed(false);
        }
    };
    
    return (
        <div className="animate-fade-in">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title">Choose Your Plan</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Unlock the full potential of AI for your email campaigns.</p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className={`relative bg-light-surface dark:bg-brand-dark/50 border ${isSubscribed ? 'border-light-border dark:border-brand-light/20' : 'border-brand-accent-purple dark:border-brand-accent'} rounded-xl p-8`}>
                    {!isSubscribed && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-accent-purple dark:bg-brand-accent text-white dark:text-brand-darker text-xs font-bold px-3 py-1 rounded-full uppercase">Current Plan</span>}
                    <h2 className="text-2xl font-bold font-title">Free Plan</h2>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">Perfect for getting started</p>
                    
                    <p className="text-4xl font-extrabold mb-6 font-title">$0<span className="text-lg font-medium text-light-text-secondary dark:text-brand-text-secondary">/month</span></p>

                    <ul className="space-y-3 mb-8 text-light-text-secondary dark:text-brand-text-secondary">
                        <PlanFeature><strong>10</strong> AI Actions per day</PlanFeature>
                        <PlanFeature>Unlimited Participants</PlanFeature>
                        <PlanFeature>Unlimited Email Blasts</PlanFeature>
                        <PlanFeature>Full Analytics Suite</PlanFeature>
                    </ul>
                    
                    {isSubscribed && (
                        <button onClick={handleDowngrade} className="w-full bg-light-bg dark:bg-brand-light/50 text-light-text dark:text-white font-bold py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-brand-light transition">
                           Downgrade to Free
                        </button>
                    )}
                </div>

                {/* Pro Plan */}
                 <div className={`relative bg-light-surface dark:bg-brand-dark/50 border ${isSubscribed ? 'border-brand-accent-purple dark:border-brand-accent' : 'border-light-border dark:border-brand-light/20'} rounded-xl p-8`}>
                    {isSubscribed && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-accent-purple dark:bg-brand-accent text-white dark:text-brand-darker text-xs font-bold px-3 py-1 rounded-full uppercase">Current Plan</span>}
                    <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold font-title">Pro Plan</h2>
                        <CrownIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">For power users and teams</p>
                    
                    <p className="text-4xl font-extrabold mb-6 font-title">$5<span className="text-lg font-medium text-light-text-secondary dark:text-brand-text-secondary">/month</span></p>

                    <ul className="space-y-3 mb-8 text-light-text dark:text-white">
                        <PlanFeature><strong>Unlimited</strong> AI Actions</PlanFeature>
                        <PlanFeature>Unlimited Participants</PlanFeature>
                        <PlanFeature>Unlimited Email Blasts</PlanFeature>
                        <PlanFeature>Full Analytics Suite</PlanFeature>
                    </ul>
                    
                    {!isSubscribed && (
                        <button onClick={handleUpgrade} className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-3 rounded-lg hover:bg-opacity-90 transition">
                           Upgrade to Pro
                        </button>
                    )}
                </div>

            </div>
            <p className="text-center text-xs text-light-text-secondary dark:text-brand-text-secondary mt-8">
                This is a demo. Clicking "Upgrade" or "Downgrade" will simulate the subscription status change without actual payment.
            </p>
        </div>
    );
};

export default SubscriptionManager;