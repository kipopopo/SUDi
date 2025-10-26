import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { BlastIcon, CheckCircleIcon, LoadingIcon } from './common/Icons';
import { EmailTemplate, Department, Participant } from '../types';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateEcardPdf } from '../utils/ecardGenerator';

export const BlastManager: React.FC = () => {
    const { templates, departments, participants, refreshHistory } = useData();
    const { globalSettings, senderProfile } = useSettings();
    const [status, setStatus] = useState<'idle' | 'blasting' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
    const [isConfirming, setIsConfirming] = useState(false);
    const [generatedPdfPreview, setGeneratedPdfPreview] = useState<string | null>(null);



    const isSenderVerified = senderProfile?.verified === true;

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

    useEffect(() => {
        const generatePreview = async () => {
            if (selectedTemplate && selectedTemplate.ecardBackdropPath) {
                try {
                    const filename = selectedTemplate.ecardBackdropPath.split('/').pop();
                    const response = await fetch(`/api/ecard-backdrop/${filename}`);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = async () => {
                        const backdropImageUrl = reader.result as string;
                        const pdfDataUri = await generateEcardPdf({
                            name: 'John Doe',
                            role: 'Software Engineer',
                            backdropImageUrl: backdropImageUrl,
                            nameX: selectedTemplate.nameX,
                            nameY: selectedTemplate.nameY,
                            nameFontSize: selectedTemplate.nameFontSize,
                            nameColor: selectedTemplate.nameColor,
                            roleX: selectedTemplate.roleX,
                            roleY: selectedTemplate.roleY,
                            roleFontSize: selectedTemplate.roleFontSize,
                            roleColor: selectedTemplate.roleColor,
                        });
                        setGeneratedPdfPreview(pdfDataUri);
                    };
                } catch (error) {
                    console.error('Error generating E-card preview:', error);
                    setGeneratedPdfPreview(null);
                }
            } else {
                setGeneratedPdfPreview(null);
            }
        };
        generatePreview();
    }, [selectedTemplate]);
    
    const recipientCount = recipients.length;

    const handleConfirmBlast = async () => {
        if (!selectedTemplate || !senderProfile) return;

        setStatus('blasting');
        setIsConfirming(false);
        setErrorMessage('');

        try {
            await axios.post('/api/blast', {
                templateId: selectedTemplate.id,
                recipientIds: recipients.map(r => r.id),
                senderProfile,
                blastDetails,
                globalHeader: globalSettings?.globalHeader || '',
                globalFooter: globalSettings?.globalFooter || '',
            });

            setStatus('success');
            refreshHistory();
        } catch (error: any) {
            setStatus('idle');
            setErrorMessage(error.response?.data?.error || 'An unknown error occurred while sending the blast.');
        }
    };
    
    const reset = () => {
      setStatus('idle');
      setIsConfirming(false);
      setErrorMessage('');
      setSelectedTemplateId('');
      setSelectedDepartmentId('all');
    }

    const renderPreviewBody = () => {
        if (!selectedTemplate) return '<div class="text-center p-8 text-light-text-secondary dark:text-brand-text-secondary">Please select a template to see the preview.</div>';
        
        const bodyWithPlaceholders = selectedTemplate.body
            .replace(/{name}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">name</span>')
            .replace(/{email}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">email</span>')
            .replace(/{role}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">role</span>')
            .replace(/{paEmail}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">paEmail</span>');
        
        const fullContent = `${globalSettings?.globalHeader || ''}${bodyWithPlaceholders}${globalSettings?.globalFooter || ''}`;
        return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #333;"> ${fullContent} </div>`;
    }

    if (status === 'success') {
        return (
            <div className="text-center animate-fade-in bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-green-500/30 p-8 rounded-lg flex flex-col justify-center items-center h-full max-w-2xl mx-auto">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-500 dark:text-green-400 mb-4">Success!</h2>
                <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">Your email blast to {blastDetails.count} recipients has been successfully queued.</p>
                <button onClick={reset} className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-full hover:bg-opacity-90 transition-all">
                    Create Another Blast
                </button>
            </div>
        )
    }

    if (status === 'blasting') {
        return (
            <div className="text-center bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-8 rounded-lg flex flex-col justify-center items-center h-full max-w-2xl mx-auto">
                <LoadingIcon className="w-16 h-16 text-brand-accent-purple mb-4" />
                <h2 className="text-2xl font-bold text-brand-accent-purple dark:text-brand-accent mb-4">Email Campaign in Progress...</h2>
                <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">Sending {blastDetails.count} emails. You can safely navigate away from this page.</p>
            </div>
        )
    }

    return (
        <>
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-8 text-center font-title dark:text-white">Create New Email Blast</h1>

                {!isSenderVerified && (
                    <div className="max-w-4xl mx-auto mb-8 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30">
                        <p className="font-bold text-center">⚠️ Sender Email Not Verified</p>
                        <p className="text-sm text-center">Please configure and verify a sender email in the <strong>Sender Setup</strong> page before sending a campaign.</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="max-w-4xl mx-auto mb-8 p-4 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                        <p className="font-bold text-center">An Error Occurred</p>
                        <p className="text-sm text-center">{errorMessage}</p>
                    </div>
                )}

                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-6 rounded-lg h-full flex flex-col space-y-6">
                            <div>
                                <label className="block text-light-text-secondary dark:text-brand-text-secondary mb-2 font-semibold">1. Select Email Template</label>
                                <select 
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent dark:text-white"
                                >
                                    <option value="" disabled>-- Choose a template --</option>
                                    {templates.slice().sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).map(t => <option key={t.id} value={t.id}>{t.name}</option>)} 
                                </select>
                            </div>
                            <div>
                                <label className="block text-light-text-secondary dark:text-brand-text-secondary mb-2 font-semibold">2. Select Recipients</label>
                                <select 
                                    value={selectedDepartmentId}
                                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent dark:text-white"
                                >
                                    <option value="all">All Departments ({participants.length} recipients)</option>
                                    {departments.slice().sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).map(d => {
                                        const count = participants.filter(p => p.departmentId === d.id).length;
                                        return <option key={d.id} value={d.id}>{d.name} ({count} recipients)</option>
                                    })}
                                </select>
                            </div>
                            <div className="border-t border-light-border dark:border-brand-light/20 pt-6 mt-auto">
                                <button 
                                    onClick={() => setIsConfirming(true)} 
                                    disabled={!selectedTemplateId || recipientCount === 0 || !isSenderVerified}
                                    title={!isSenderVerified ? 'Please verify a sender email first' : (recipientCount === 0 ? 'No recipients selected' : '' )}
                                    className="w-full bg-brand-accent-purple text-white font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-brand-accent-purple/20 disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:text-light-text-secondary dark:disabled:text-brand-text-secondary disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <BlastIcon />
                                    <span>Review & Send ({recipientCount} Emails)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-3">
                       <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 rounded-lg h-full">
                            <div className="p-4 border-b border-light-border dark:border-brand-light/20">
                                <h2 className="text-lg font-bold dark:text-white">Email Preview</h2>
                            </div>
                            <div className="p-4 bg-light-bg dark:bg-brand-light/30">
                                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">From: <strong className="text-light-text dark:text-white">{senderProfile?.name || '[Sender Name]'} &lt;{senderProfile?.email || '[sender@example.com]'}&gt;</strong></p>
                                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">Subject: <strong className="text-light-text dark:text-white">{selectedTemplate?.subject || '[Template Subject]'}</strong></p>
                            </div>
                            <div className="p-6 overflow-y-auto" style={{maxHeight: '60vh'}}>
                                <div dangerouslySetInnerHTML={{ __html: renderPreviewBody() }} />
                                {selectedTemplate?.ecardBackdropPath && generatedPdfPreview && (
                                    <div className="mt-6 pt-6 border-t border-light-border dark:border-brand-light/20">
                                        <h3 className="text-md font-bold mb-2 dark:text-white">E-card Attachment Preview</h3>
                                        <iframe src={generatedPdfPreview} width="100%" height="500px" title="E-card Attachment Preview" className="border border-light-border dark:border-brand-light/20 rounded-md"></iframe>
                                    </div>
                                )}
                            </div>
                       </div>
                    </div>
                </div>
            </div>

            {isConfirming && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
                    <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg p-8">
                        <h2 className="text-2xl font-bold text-brand-accent-purple dark:text-brand-accent mb-4 text-center font-title">Confirm Your Email Blast</h2>
                        <div className="text-left bg-light-bg dark:bg-brand-light/30 p-4 rounded-lg space-y-2 mb-6">
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Template:</span> <strong className="text-light-text dark:text-white">{blastDetails.templateName}</strong></p>
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Recipients:</span> <strong className="text-light-text dark:text-white">{blastDetails.departmentName}</strong></p>
                            <p><span className="text-light-text-secondary dark:text-brand-text-secondary">Total Emails:</span> <strong className="text-light-text dark:text-white">{blastDetails.count}</strong></p>
                        </div>
                        <p className="text-light-text-secondary dark:text-brand-text-secondary mb-8 text-center">Are you sure you want to proceed?</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setIsConfirming(false)} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition py-2 px-6 rounded-lg border border-light-border dark:border-brand-light/20">Cancel</button>
                            <button onClick={handleConfirmBlast} className="bg-green-500 text-white font-bold py-2 px-8 rounded-lg hover:bg-green-600 transition">
                                {'Confirm & Send Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BlastManager;
