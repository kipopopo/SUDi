export type View = 'dashboard' | 'participants' | 'departments' | 'templates' | 'blast' | 'history' | 'analytics' | 'subscription' | 'profile' | 'billing' | 'emailSettings' | 'senderSetup';

export interface Department {
  id: string;
  name: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
  paEmail?: string;
}

export interface EmailTemplate {
  id: string;
  name:string;
  subject: string;
  body: string;
  category?: string;
}

export interface RecipientActivity {
  participantId: string;
  name: string;
  email: string;
  status: 'Sent' | 'Opened' | 'Clicked' | 'Bounced' | 'Unsubscribed';
}


export interface BlastHistoryItem {
  id: string;
  templateName: string;
  subject: string;
  recipientGroup: string;
  recipientCount: number;
  sentDate: string; // ISO string
  status: 'Completed' | 'Failed' | 'Scheduled';
  scheduledDate?: string; // Optional ISO string for scheduled blasts
  
  // Detailed Analytics
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  
  // Data for reporting
  body: string; // The full HTML body of the email that was sent
  recipientIds: string[]; // IDs of participants targeted
  detailedRecipientActivity: RecipientActivity[];
}

export interface AppSettings {
  globalHeader: string;
  globalFooter: string;
}

// Added for sender setup
export interface SenderProfile {
  name: string;
  email: string;
  verified: boolean;
}

// Added for usage tracking
export interface AiUsage {
    count: number;
    limit: number;
    isExceeded: boolean;
}

// Added for billing
export interface PaymentMethod {
  id: string;
  type: 'Visa' | 'Mastercard';
  last4: string;
  expiry: string; // MM/YY
}

export interface Invoice {
  id: string;
  date: string; // ISO String
  amount: number;
  plan: 'Pro Plan Monthly';
  status: 'Paid';
}