import React, { useState, useMemo } from 'react';
import { BlastIcon } from './common/Icons';
import { EmailTemplate, Department, Participant, BlastHistoryItem, RecipientActivity, AppSettings, SenderProfile } from '../types';

interface BlastManagerProps {
  templates: EmailTemplate[];
  departments: Department[];
  participants: Participant[];
  history: BlastHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<BlastHistoryItem[]>>;
  settings: AppSettings;
  senderProfile: SenderProfile | null;
}


/**
 * Generates detailed mock analytics for a completed email blast.
 * @param {Participant[]} recipients - Array of participants who received the email.
 * @returns {object} An object containing detailed recipient activity and calculated performance rates.
 */
const generateMockAnalytics = (recipients: Participant[]) => {
    let opened = 0;
    let clicked = 0;
    let unsubscribed = 0;
    let bounced = 0;

    const detailedRecipientActivity: RecipientActivity[] = recipients.map(p => {
        const random = Math.random();
        let status: RecipientActivity['status'] = 'Sent';

        // Simulate engagement funnel (Bounce -> Open -> Click/Unsubscribe)
        if (random < 0.02) { // 2% bounce rate
            status = 'Bounced';
            bounced++;
        } else if (random < 0.5) { // 48% open rate (of delivered)
            status = 'Opened';
            opened++;
            if (random > 0.3) { // ~40% click rate (of opened)
                status = 'Clicked';
                clicked++;
            } else if (random < 0.32) { // ~2% unsubscribe rate (of opened)
                status = 'Unsubscribed';
                unsubscribed++;
            }
        }
        return { participantId: p.id, name: p.name, email: p.email, status };
    });
    
    const deliveredCount = recipients.length - bounced;
    const deliveryRate = recipients.length > 0 ? parseFloat(((deliveredCount / recipients.length) * 100).toFixed(2)) : 0;
    const openRate = deliveredCount > 0 ? parseFloat(((opened / deliveredCount) * 100).toFixed(2)) : 0;
    const clickRate = opened > 0 ? parseFloat(((clicked / opened) * 100).toFixed(2)) : 0;
    const unsubscribeRate = opened > 0 ? parseFloat(((unsubscribed / opened) * 100).toFixed(2)) : 0;

    return {
        detailedRecipientActivity,
        deliveryRate,
        openRate,
        clickRate,
        unsubscribeRate,
    };
};

/**
 * Renders the email blast creation and execution view.
 * This component allows users to configure and send an email campaign by selecting a template and recipient group.
 * It provides a preview, a confirmation step, and progress feedback during the blast.
 * It uses shared state passed via props for templates, departments, and participants.
 * @param {BlastManagerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered blast manager component.
 */
export const BlastManager: React.FC<BlastManagerProps> = ({ templates, departments, participants, history, setHistory, settings, senderProfile }) => {
    // State to track the current stage of the email blast process.
    const [status, setStatus] = useState<'idle' | 'blasting' | 'success'>('idle');
    const [successMessage, setSuccessMessage] = useState('');
    // State to track the progress of the email blast simulation.
    const [progress, setProgress] = useState(0);
    // State for the selected email template ID.
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
    // State for the selected recipient department ID.
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
    // State to control the visibility of the confirmation modal.
    const [isConfirming, setIsConfirming] = useState(false);
    // State for scheduling
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    const isSenderVerified = senderProfile?.verified === true;

    /**
     * Memoized calculation of blast details based on selected template and department from props.
     * It determines the selected template object, recipient count, and details for the confirmation modal.
     * `useMemo` prevents recalculating this on every render.
     * @returns {object} An object containing the selected template, recipient count, and blast details.
     */
    const { selectedTemplate, recipients, blastDetails } = useMemo(() => {
        const template = templates.find(t => t.id === selectedTemplateId);
        let recipientList: Participant[];
        if (selectedDepartmentId === 'all') {
            recipientList = participants;
        } else {
            recipientList = participants.filter(p => p.departmentId === selectedDepartmentId);
        }
        
        const departmentName = departments.find(d => d.id === selectedDepartmentId)?.name || 'All Departments';

        return {
            selectedTemplate: template,
            recipients: recipientList,
            blastDetails: {
                templateName: template?.name || 'N/A',
                subject: template?.subject || 'N/A',
                departmentName: departmentName,
                count: recipientList.length,
            }
        };
    }, [selectedTemplateId, selectedDepartmentId, templates, departments, participants]);
    
    const recipientCount = recipients.length;

    const handleConfirmBlast = () => {
        setScheduleError(null);
        if (!selectedTemplate) return;

        const fullEmailBody = `${settings.globalHeader}\n${selectedTemplate.body}\n${settings.globalFooter}`;

        if (isScheduling) {
            if (!scheduleDate) {
                setScheduleError('Please select a valid date and time for scheduling.');
                return;
            }
            if (new Date(scheduleDate) <= new Date()) {
                setScheduleError('Scheduled time must be in the future.');
                return;
            }
            // Handle scheduling
            const newHistoryItem: BlastHistoryItem = {
                id: `hist_${Date.now()}`,
                templateName: blastDetails.templateName,
                subject: blastDetails.subject,
                recipientGroup: blastDetails.departmentName,
                recipientCount: blastDetails.count,
                status: 'Scheduled',
                sentDate: '',
                scheduledDate: new Date(scheduleDate).toISOString(),
                // Add required analytics fields with default values
                body: fullEmailBody,
                recipientIds: recipients.map(p => p.id),
                deliveryRate: 0,
                openRate: 0,
                clickRate: 0,
                unsubscribeRate: 0,
                detailedRecipientActivity: [],
            };
            setHistory([newHistoryItem, ...history]);
            setSuccessMessage(`${blastDetails.count} emails have been scheduled successfully.`);
            setStatus('success');
            setIsConfirming(false);
        } else {
            // Handle immediate blast
            startBlast(fullEmailBody);
        }
    };

    /**
     * Simulates the process of sending an email blast.
     * It sets the status to 'blasting', updates a progress bar over time,
     * and finally sets the status to 'success'. It also logs the completed
     * blast to the history service.
     */
    const startBlast = (fullEmailBody: string) => {
        if (!selectedTemplate) return;
        setIsConfirming(false);
        setStatus('blasting');
        setProgress(0);
        
        // ================================================================
        // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
        // ================================================================
        // This `setInterval` function ONLY SIMULATES an email blast for the UI.
        // No actual emails are being sent.
        //
        // In a real application, this entire logic should be replaced with an
        // API call to your backend server. The backend would be responsible for:
        // 1.  Receiving the blast configuration (template ID, recipient group).
        // 2.  Fetching the recipient list from the database.
        // 3.  Using an email service provider (ESP) like SendGrid, Mailgun, or
        //     Amazon SES to send the emails in batches.
        // 4.  Handling failures, retries, and logging the results.
        //
        // The frontend could then poll a status endpoint or use WebSockets to
        // get real-time progress updates from the backend.
        // ================================================================
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + 10;
                if (next >= 100) {
                    clearInterval(interval);
                    setStatus('success');
                    setSuccessMessage(`${blastDetails.count} emails have been successfully sent.`);
                    
                    const analytics = generateMockAnalytics(recipients);
                    
                    const newHistoryItem: BlastHistoryItem = {
                        id: `hist_${Date.now()}`,
                        templateName: blastDetails.templateName,
                        subject: blastDetails.subject,
                        recipientGroup: blastDetails.departmentName,
                        recipientCount: blastDetails.count,
                        status: 'Completed',
                        sentDate: new Date().toISOString(),
                        body: fullEmailBody,
                        recipientIds: recipients.map(p => p.id),
                        ...analytics,
                    };
                    setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
                    return 100;
                }
                return next;
            });
        }, 300);
    };
    
    /**
     * Resets the component state to its initial 'idle' state,
     * allowing the user to start a new blast.
     */
    const reset = () => {
      setStatus('idle');
      setProgress(0);
      setIsConfirming(false);
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleError(null);
      setSuccessMessage('');
    }

    /**
     * Renders a preview of the email body by replacing placeholders with generic labels.
     * This function also uses `dangerouslySetInnerHTML` to render basic HTML formatting from the template.
     * @returns {string} The HTML string for the email body preview.
     */
    const renderPreviewBody = () => {
        if (!selectedTemplate) return '';
        const bodyWithPlaceholders = selectedTemplate.body
            .replace(/{name}/g, '<strong>[Participant Name]</strong>')
            .replace(/{email}/g, '<strong>[participant.email@example.com]</strong>')
            .replace(/{role}/g, '<strong>[Participant Role]</strong>')
            .replace(/{paEmail}/g, '<strong>[PA\'s Email]</strong>');
        
        return `${settings.globalHeader}${bodyWithPlaceholders}${settings.globalFooter}`;
    }

    return (
        <>
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-8 text-center font-title">Create New Email Blast</h1>

                {!isSenderVerified && (
                    <div className="max-w-7xl mx-auto mb-8 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30">
                        <p className="font-bold text-center">
                            ⚠️ Sender Email Not Verified
                        </p>
                        <p className="text-sm text-center">
                            Please configure and verify a sender email in the <strong>Sender Setup</strong> page before sending a campaign.
                        </p>
                    </div>
                )}

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Blast Configuration Panel */}
                    <div className={`lg:col-span-1 transition-opacity duration-500 ${status !== 'idle' ? 'opacity-25 pointer-events-none' : ''}`}>
                        <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-8 rounded-lg h-full flex flex-col">
                            <div className="space-y-6 flex-grow">
                                <div>
                                    <label className="block text-light-text-secondary dark:text-brand-text-secondary mb-2">1. Select Email Template</label>
                                    <select 
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                    >
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-light-text-secondary dark:text-brand-text-secondary mb-2">2. Select Recipient Department(s)</label>
                                    <select 
                                        value={selectedDepartmentId}
                                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                        className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="border-t border-light-border dark:border-brand-light/20 pt-6 mt-6">
                                <button 
                                    onClick={() => setIsConfirming(true)} 
                                    disabled={!selectedTemplateId || recipientCount === 0 || !isSenderVerified}
                                    title={!isSenderVerified ? 'Please verify a sender email first' : ''}
                                    className="w-full bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center mx-auto space-x-2 shadow-lg shadow-brand-accent-purple/20 dark:shadow-brand-accent/20 disabled:bg-slate-200 dark:disabled:bg-brand-light disabled:text-light-text-secondary dark:disabled:text-brand-text-secondary disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <BlastIcon />
                                    <span>Review & Send ({recipientCount} Emails)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Status / Preview Panel */}
                    <div className="lg:col-span-1">
                        {status === 'idle' && selectedTemplate && (
                           <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-6 rounded-lg animate-fade-in h-full">
                                <h2 className="text-xl font-bold mb-4 text-brand-accent-purple dark:text-brand-accent">Email Preview</h2>
                                <div className="bg-light-bg dark:bg-brand-light/30 p-4 rounded-lg">
                                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">From:</p>
                                    <h3 className="font-semibold mb-2">{senderProfile?.name || '[Sender Name]'} &lt;{senderProfile?.email || '[sender.email@example.com]'}&gt;</h3>
                                    
                                    <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">Subject:</p>
                                    <h3 className="font-semibold mb-4">{selectedTemplate.subject}</h3>
                                    <div className="border-t border-light-border dark:border-brand-light/20 pt-4">
                                        <div 
                                            className="prose prose-sm prose-invert dark:prose-invert text-light-text-secondary dark:text-brand-text-secondary max-w-none"
                                            dangerouslySetInnerHTML={{ __html: renderPreviewBody() }}
                                        />
                                    </div>
                                </div>
                           </div>
                        )}
                         {status === 'blasting' && (
                            <div className="text-center bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-8 rounded-lg flex flex-col justify-center items-center h-full">
                                <h2 className="text-2xl font-bold text-brand-accent-purple dark:text-brand-accent mb-4">Email Campaign in Progress...</h2>
                                <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">Please do not close this window.</p>
                                <div className="w-full bg-light-bg dark:bg-brand-light rounded-full h-4">
                                    <div className="bg-brand-accent-purple dark:bg-brand-accent h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="mt-4 text-xl font-bold">{progress}% Complete</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center animate-fade-in bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-8 rounded-lg flex flex-col justify-center items-center h-full">
                                <h2 className="text-2xl font-bold text-green-500 dark:text-green-400 mb-4">Success!</h2>
                                <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">{successMessage}</p>
                                <button onClick={reset} className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-full hover:bg-opacity-90 transition-all">
                                    Create Another Blast
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isConfirming && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg p-8">
                        <h2 className="text-2xl font-bold text-brand-accent-purple dark:text-brand-accent mb-4 text-center font-title">
                            Confirm Your Email Blast
                        </h2>
                        <div className="text-left bg-light-bg dark:bg-brand-light/30 p-4 rounded-lg space-y-2 mb-6">
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Template:</span> <strong className="text-light-text dark:text-white">{blastDetails.templateName}</strong></p>
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Recipients:</span> <strong className="text-light-text dark:text-white">{blastDetails.departmentName}</strong></p>
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Total Emails:</span> <strong className="text-light-text dark:text-white">{blastDetails.count}</strong></p>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center">
                                <input
                                    id="schedule-checkbox"
                                    type="checkbox"
                                    checked={isScheduling}
                                    onChange={(e) => setIsScheduling(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-accent-purple focus:ring-brand-accent-purple"
                                />
                                <label htmlFor="schedule-checkbox" className="ml-3 block text-sm font-medium text-light-text dark:text-brand-text">
                                    Schedule for later
                                </label>
                            </div>
                             {isScheduling && (
                                <div className="animate-fade-in pl-7">
                                    <input
                                        type="datetime-local"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                    />
                                </div>
                            )}
                        </div>
                        
                        {scheduleError && <p className="text-red-500 text-center text-sm mb-4">{scheduleError}</p>}

                        <p className="text-light-text-secondary dark:text-brand-text-secondary mb-8 text-center">Are you sure you want to proceed?</p>
                        
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setIsConfirming(false)} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition py-2 px-6">Cancel</button>
                            <button onClick={handleConfirmBlast} className="bg-green-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-green-600 transition">
                                {isScheduling ? 'Confirm & Schedule' : 'Confirm & Send Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};