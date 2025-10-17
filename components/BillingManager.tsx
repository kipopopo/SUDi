import React, { useState } from 'react';
import { PaymentMethod, Invoice } from '../types';
import { CreditCardIcon, PlusIcon, CloseIcon, DeleteIcon, DownloadIcon } from './common/Icons';
import { useSettings } from '../contexts/SettingsContext';

interface BillingManagerProps {}

const BillingManager: React.FC<BillingManagerProps> = () => {
    const { paymentMethods, setPaymentMethods, invoices } = useSettings();
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [newCard, setNewCard] = useState({ name: '', number: '', expiry: '', cvc: '' });

    const handleAddCard = () => {
        // NOTE: In a real app, this would use a payment provider's SDK (e.g., Stripe Elements)
        // to securely collect card details and get a token, then send the token to the backend.
        // This is a mock implementation.
        if (newCard.number.length < 16) {
            alert("Please enter a valid card number.");
            return;
        }
        const newMethod: PaymentMethod = {
            id: `pm_${Date.now()}`,
            type: newCard.number.startsWith('4') ? 'Visa' : 'Mastercard',
            last4: newCard.number.slice(-4),
            expiry: newCard.expiry,
        };
        setPaymentMethods([...paymentMethods, newMethod]);
        setIsAddCardModalOpen(false);
        setNewCard({ name: '', number: '', expiry: '', cvc: '' });
    };

    const handleDeleteCard = (id: string) => {
        if (window.confirm("Are you sure you want to remove this payment method?")) {
            setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
        }
    };
    
    const formatInvoiceDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <div className="animate-fade-in max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-title dark:text-white">Billing Information</h1>
                    <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Manage your payment methods and view your invoice history.</p>
                </div>
                
                <div className="space-y-12">
                    {/* Payment Methods */}
                    <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-title dark:text-white">Payment Methods</h2>
                            <button onClick={() => setIsAddCardModalOpen(true)} className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition text-sm">
                                <PlusIcon />
                                <span>Add New Card</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map(pm => (
                                    <div key={pm.id} className="flex justify-between items-center bg-light-bg dark:bg-brand-light/30 p-4 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <CreditCardIcon className="w-8 h-8 text-light-text-secondary dark:text-brand-text-secondary" />
                                            <div>
                                                <p className="font-semibold text-light-text dark:text-white">{pm.type} ending in {pm.last4}</p>
                                                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">Expires {pm.expiry}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteCard(pm.id)} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary py-4">No payment methods saved.</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Invoice History */}
                    <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                        <h2 className="text-xl font-bold font-title mb-6 dark:text-white">Invoice History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-light-border dark:border-brand-light/20">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase">Date</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase">Plan</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase text-right">Amount</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase text-center">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="border-b border-light-border dark:border-brand-light/20 last:border-b-0">
                                            <td className="p-3 font-medium text-light-text dark:text-white">{formatInvoiceDate(inv.date)}</td>
                                            <td className="p-3 text-light-text-secondary dark:text-brand-text-secondary">{inv.plan}</td>
                                            <td className="p-3 text-light-text dark:text-white text-right font-mono">${inv.amount.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => alert('Invoice download is not implemented in this demo.')} className="p-2 text-light-text-secondary hover:text-brand-accent-purple dark:text-brand-text-secondary dark:hover:text-brand-accent transition">
                                                    <DownloadIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isAddCardModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md p-8 relative">
                        <button onClick={() => setIsAddCardModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-light/50"><CloseIcon /></button>
                        <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">Add New Payment Method</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Cardholder Name</label>
                                <input type="text" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Card Number</label>
                                <input type="text" value={newCard.number} onChange={e => setNewCard({...newCard, number: e.target.value})} placeholder="•••• •••• •••• ••••" className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Expiry Date</label>
                                    <input type="text" value={newCard.expiry} onChange={e => setNewCard({...newCard, expiry: e.target.value})} placeholder="MM/YY" className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">CVC</label>
                                    <input type="text" value={newCard.cvc} onChange={e => setNewCard({...newCard, cvc: e.target.value})} placeholder="•••" className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                            <button onClick={() => setIsAddCardModalOpen(false)} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                            <button onClick={handleAddCard} className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Card</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BillingManager;
