import { PaymentMethod, Invoice } from '../types';

const PAYMENT_METHODS_KEY = 'sudi_payment_methods';
const INVOICES_KEY = 'sudi_invoices';

const initialPaymentMethods: PaymentMethod[] = [
    { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '12/26' }
];

const initialInvoices: Invoice[] = [
    { id: 'inv_1', date: '2024-07-01T10:00:00.000Z', amount: 5.00, plan: 'Pro Plan Monthly', status: 'Paid' },
    { id: 'inv_2', date: '2024-06-01T10:00:00.000Z', amount: 5.00, plan: 'Pro Plan Monthly', status: 'Paid' },
    { id: 'inv_3', date: '2024-05-01T10:00:00.000Z', amount: 5.00, plan: 'Pro Plan Monthly', status: 'Paid' },
];


// === Payment Methods ===

export const getPaymentMethods = (): PaymentMethod[] => {
  try {
    const methodsJson = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (methodsJson) {
      return JSON.parse(methodsJson);
    }
    // Set initial data if none exists
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(initialPaymentMethods));
    return initialPaymentMethods;
  } catch (error) {
    console.error("Failed to parse payment methods:", error);
    return initialPaymentMethods;
  }
};

export const savePaymentMethods = (methods: PaymentMethod[]) => {
  try {
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(methods));
  } catch (error) {
    console.error("Failed to save payment methods:", error);
  }
};

// === Invoices ===

export const getInvoices = (): Invoice[] => {
  try {
    const invoicesJson = localStorage.getItem(INVOICES_KEY);
     if (invoicesJson) {
      return JSON.parse(invoicesJson);
    }
    // Set initial data if none exists
    localStorage.setItem(INVOICES_KEY, JSON.stringify(initialInvoices));
    return initialInvoices;
  } catch (error) {
    console.error("Failed to parse invoices:", error);
    return initialInvoices;
  }
};

export const saveInvoices = (invoices: Invoice[]) => {
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error("Failed to save invoices:", error);
  }
};
