import React, { useState, useEffect, useCallback } from 'react';
import { EmailTemplate } from '../types';
import { useData } from '../contexts/DataContext';
import { deleteTemplate } from '../services/templateService';

interface DeleteTemplateModalProps {
    template: EmailTemplate;
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({ template, isSidebarCollapsed, onClose }) => {
    const { setTemplates } = useData();
    const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

    useEffect(() => {
        if (template) {
            setTemplateToDelete(template);
        }
    }, [template]);

    const confirmDeleteTemplate = useCallback(async () => {
        if (!templateToDelete) return;

        try {
            await deleteTemplate(templateToDelete.id);
            setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            onClose();
        } catch (error) {
            alert('Failed to delete template.');
        }
    }, [templateToDelete, setTemplates, onClose]);

    if (!templateToDelete) return null;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-4 text-center font-title text-light-text dark:text-white">
                    Confirm Deletion
                </h2>
                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">
                    Are you sure you want to delete the template "<strong>{templateToDelete.name}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 mt-8">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition px-8 py-2 rounded-lg border border-light-border dark:border-brand-light/20">Cancel</button>
                    <button onClick={confirmDeleteTemplate} className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
            </div>
        </div>
    );
};