import React, { useState, useRef, useEffect } from 'react';
import { AppSettings } from '../types';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ButtonIcon, HorizontalRuleIcon, ImageIcon, LinkIcon, ListOrderedIcon, ListUnorderedIcon, QuoteIcon, CheckCircleIcon } from './common/Icons';

interface EmailSettingsProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

/**
 * Renders the email settings management view.
 * This component allows users to define a global header and footer for all emails.
 * @param {EmailSettingsProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered email settings component.
 */
export const EmailSettings: React.FC<EmailSettingsProps> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeEditor, setActiveEditor] = useState<'header' | 'footer' | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const headerTextareaRef = useRef<HTMLTextAreaElement>(null);
    const footerTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Ensure local state is updated if global props change (e.g., initial load)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setSettings(localSettings);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDiscard = () => {
        setLocalSettings(settings);
    };

    const wrapText = (openTag: string, closeTag: string, isBlock = false) => {
        if (!activeEditor) return;
        const textarea = activeEditor === 'header' ? headerTextareaRef.current : footerTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let newText;
        if (isBlock && selectedText) {
            newText = `${openTag}\n${selectedText}\n${closeTag}`;
        } else if (isBlock && !selectedText) {
            newText = `${openTag}\n\n${closeTag}`;
        } else {
            newText = openTag + selectedText + closeTag;
        }

        const updatedBody =
            textarea.value.substring(0, start) +
            newText +
            textarea.value.substring(end);

        setLocalSettings(prev => ({...prev, [activeEditor]: updatedBody }));

        requestAnimationFrame(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(start, end + openTag.length + closeTag.length + (isBlock ? 2 : 0));
            } else {
                textarea.setSelectionRange(start + openTag.length + (isBlock ? 1 : 0), start + openTag.length + (isBlock ? 1 : 0));
            }
        });
    };

    const insertText = (textToInsert: string) => {
        if (!activeEditor) return;
        const textarea = activeEditor === 'header' ? headerTextareaRef.current : footerTextareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + textToInsert + text.substring(end);
        
        setLocalSettings(prev => ({ ...prev, [activeEditor]: newText }));

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
        });
    };

    const handleInsertLink = () => {
        const url = window.prompt("Enter the URL:");
        if (url) {
            wrapText(`<a href="${url}" target="_blank">`, '</a>');
        }
    };
    
    const handleInsertImage = () => {
        const url = window.prompt("Enter image URL");
        if (url) {
          insertText(`<img src="${url}" alt="" style="max-width: 100%; height: auto;" />`);
        }
    };

    const renderEditor = (
        field: 'globalHeader' | 'globalFooter', 
        label: string, 
        ref: React.RefObject<HTMLTextAreaElement>
    ) => (
        <div>
            <label className="block text-xl font-bold font-title mb-4">{label}</label>
            <div className="bg-slate-100 dark:bg-brand-light/30 border border-light-border dark:border-brand-light rounded-t-md p-2 flex items-center space-x-1 flex-wrap gap-y-2 text-light-text dark:text-brand-text">
                <button title="Bold" onClick={() => wrapText('<strong>', '</strong>')} className="w-8 h-8 font-bold text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">B</button>
                <button title="Italic" onClick={() => wrapText('<em>', '</em>')} className="w-8 h-8 italic text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">I</button>
                <button title="Underline" onClick={() => wrapText('<u>', '</u>')} className="w-8 h-8 underline text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">U</button>
                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                <button title="Align Left" onClick={() => wrapText('<div style="text-align: left;">', '</div>', true)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><AlignLeftIcon /></button>
                <button title="Align Center" onClick={() => wrapText('<div style="text-align: center;">', '</div>', true)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><AlignCenterIcon /></button>
                <button title="Align Right" onClick={() => wrapText('<div style="text-align: right;">', '</div>', true)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><AlignRightIcon /></button>
                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                <button title="Insert Link" onClick={handleInsertLink} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><LinkIcon /></button>
                <button title="Insert Image" onClick={handleInsertImage} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><ImageIcon /></button>
                <button title="Insert Horizontal Rule" onClick={() => insertText('\n<hr />\n')} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><HorizontalRuleIcon /></button>
            </div>
            <textarea
                ref={ref}
                name={field}
                value={localSettings[field]}
                onChange={handleSettingsChange}
                onFocus={() => setActiveEditor(field === 'globalHeader' ? 'header' : 'footer')}
                className="w-full h-48 bg-light-bg dark:bg-brand-light/50 p-3 rounded-b-md border border-light-border dark:border-brand-light border-t-0 focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent font-mono text-sm"
                placeholder={`Enter your global email ${field === 'globalHeader' ? 'header' : 'footer'} HTML here...`}
            />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold font-title mb-2">Email Settings</h1>
            <p className="text-light-text-secondary dark:text-brand-text-secondary mb-8">Define a consistent header and footer for all outgoing emails to maintain brand identity.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Column */}
                <div className="space-y-8">
                    {renderEditor('globalHeader', 'Global Email Header', headerTextareaRef)}
                    {renderEditor('globalFooter', 'Global Email Footer', footerTextareaRef)}
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-title">Live Preview</h2>
                    <div className="bg-light-surface dark:bg-brand-dark rounded-lg p-1 border border-light-border dark:border-brand-light/20">
                        <div className="bg-slate-100 dark:bg-brand-darker rounded-lg p-4 h-[420px] overflow-y-auto">
                           <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalHeader }}
                                className="prose prose-sm dark:prose-invert max-w-none text-light-text dark:text-brand-text"
                            />
                            <div className="my-4 p-4 border-2 border-dashed border-slate-300 dark:border-brand-light/40 rounded-md text-center text-slate-400 dark:text-brand-text-secondary">
                                <p className="font-semibold text-sm">Your unique email content will appear here.</p>
                                <p className="text-xs">Hello &#123;name&#125;, this is a sample body...</p>
                            </div>
                            <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalFooter }}
                                className="prose prose-sm dark:prose-invert max-w-none text-light-text dark:text-brand-text"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-light-border dark:border-brand-light/20 flex items-center justify-end space-x-4">
                {showSuccess && (
                     <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
                        <CheckCircleIcon />
                        <span className="font-semibold">Settings saved!</span>
                    </div>
                )}
                <button 
                    onClick={handleDiscard}
                    className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"
                >
                    Discard Changes
                </button>
                <button
                    onClick={handleSave}
                    className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};
