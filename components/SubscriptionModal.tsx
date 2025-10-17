import React from 'react';
import { CheckCircleIcon, CrownIcon, CloseIcon } from './common/Icons';

interface SubscriptionModalProps {
    onClose: () => void;
    onSubscribe: () => void;
    isSidebarCollapsed: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSubscribe, isSidebarCollapsed }) => {
    return (
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}
            onClick={onClose}
        >
            <div 
                className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg max-w-full p-8 text-center relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-light/50">
                    <CloseIcon />
                </button>
                
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 mb-4">
                    <CrownIcon className="w-10 h-10" />
                </div>
                
                <h2 className="text-2xl font-bold mb-4 font-title text-light-text dark:text-white">
                    You've Reached Your Daily AI Limit
                </h2>
                <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">
                    The free plan includes 10 AI actions per day. Upgrade to the Pro Plan to unlock unlimited AI power.
                </p>

                <div className="bg-light-bg dark:bg-brand-light/30 p-6 rounded-lg text-left space-y-3 mb-8">
                    <h3 className="text-lg font-semibold text-center text-light-text dark:text-white mb-3">SUDi Pro - $5/month</h3>
                    <p className="flex items-start space-x-3"><CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> <span><strong>Unlimited</strong> AI content generation</span></p>
                    <p className="flex items-start space-x-3"><CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> <span><strong>Unlimited</strong> AI subject line creation</span></p>
                    <p className="flex items-start space-x-3"><CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> <span><strong>Unlimited</strong> AI writing improvements</span></p>
                    <p className="flex items-start space-x-3"><CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> <span><strong>Unlimited</strong> AI participant scanning</span></p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button 
                        onClick={onClose} 
                        className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition py-2 px-6 rounded-lg hover:bg-slate-100 dark:hover:bg-brand-light/50"
                    >
                        Maybe Later
                    </button>
                    <button 
                        onClick={onSubscribe} 
                        className="bg-yellow-400 text-brand-darker font-bold py-3 px-8 rounded-lg hover:bg-yellow-500 transition shadow-lg shadow-yellow-500/20"
                    >
                        Upgrade to Pro Now
                    </button>
                </div>
            </div>
        </div>
    );
};