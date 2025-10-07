import React, { useState, useRef, useCallback, useMemo } from 'react';
import { EmailTemplate, AppSettings, AiUsage, SenderProfile } from '../types';
import { generateEmailContentStream, generateEmailSubject, improveWriting } from '../services/geminiService';
import { EditIcon, DeleteIcon, PlusIcon, AIIcon, LoadingIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, ImageIcon, DuplicateIcon, FolderIcon, LinkIcon, ListUnorderedIcon, ListOrderedIcon, QuoteIcon, HorizontalRuleIcon, ButtonIcon, SparklesIcon, BlastIcon } from './common/Icons';

interface TemplatesManagerProps {
  templates: EmailTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  settings: AppSettings;
  senderProfile: SenderProfile | null;
  isSubscribed: boolean;
  aiUsage: AiUsage;
  refreshAiUsage: () => void;
  promptSubscription: () => void;
}

/**
 * Renders the email templates management view.
 * This component allows users to create, view, edit, and delete email templates.
 * It also features an AI content generator to help write email bodies and subjects.
 * It receives template data and update functions via props to interact with the centralized state.
 * @param {TemplatesManagerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered templates manager component.
 */
export const TemplatesManager: React.FC<TemplatesManagerProps> = ({ templates, setTemplates, settings, senderProfile, isSubscribed, aiUsage, refreshAiUsage, promptSubscription }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<string>('Professional');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New state for advanced editor features
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const isAiDisabled = !isSubscribed && aiUsage.isExceeded;

  const categories = useMemo<string[]>(() => {
    const uniqueCategories = new Set(templates.map(t => t.category || 'Uncategorized'));
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [templates]);

  const groupedTemplates = useMemo(() => {
    const filtered = templates.filter(template => 
        selectedCategory === 'all' || (template.category || 'Uncategorized') === selectedCategory
    );

    return filtered.reduce((acc, template) => {
        const category = template.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(template);
        return acc;
    }, {} as Record<string, EmailTemplate[]>);

  }, [templates, selectedCategory]);


  /**
   * Handles the AI content generation request.
   * It calls the `generateEmailContent` service with the user's prompt and updates the state
   * with the generated body, loading status, and any errors.
   */
  const handleGenerate = async () => {
    if (!prompt) return;

    if (isAiDisabled) {
        promptSubscription();
        return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedBody('');
    setThinkingText(null);

    try {
      // The `thinking` property on a streamed chunk contains progress information.
      // We can display this to the user for a better experience.
      await generateEmailContentStream(prompt, tone, (chunk) => {
        // @ts-ignore - The `thinking` property exists on the stream response but may not be in all type versions.
        if (chunk.thinking?.toolCode) {
          // @ts-ignore
          setThinkingText(chunk.thinking.toolCode);
        }
        if (chunk.text) {
          if (thinkingText) {
              setThinkingText(null); // Clear thinking text when content arrives
          }
          setGeneratedBody((prev) => prev + chunk.text);
        }
      });
      refreshAiUsage();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setThinkingText(null);
    }
  };

  /**
   * Opens the template editor modal to create a new template.
   * It initializes a new, empty template object and sets it as the current template.
   */
  const handleAddNewTemplate = () => {
    setCurrentTemplate({
      id: `t${Date.now()}`,
      name: '',
      subject: '',
      body: 'Hello {name},\n\n',
      category: ''
    });
    setIsEditorOpen(true);
  };

  /**
   * Opens the template editor modal to edit an existing template.
   * @param {EmailTemplate} template - The template object to be edited.
   */
  const handleEditTemplate = (template: EmailTemplate) => {
    setCurrentTemplate({ ...template });
    setIsEditorOpen(true);
  };

  /**
   * Creates a copy of an existing template and opens it in the editor.
   * It generates a new unique name for the copied template.
   * @param {EmailTemplate} templateToDuplicate - The template to be duplicated.
   */
  const handleDuplicateTemplate = (templateToDuplicate: EmailTemplate) => {
    let newName = `${templateToDuplicate.name} - Copy`;
    let counter = 2;
    // Ensure the new name is unique
    while (templates.some(t => t.name.toLowerCase() === newName.toLowerCase())) {
        newName = `${templateToDuplicate.name} - Copy (${counter})`;
        counter++;
    }

    const newTemplate: EmailTemplate = {
        ...templateToDuplicate,
        id: `t${Date.now()}`,
        name: newName,
    };

    setCurrentTemplate(newTemplate);
    setIsEditorOpen(true);
  };

  /**
   * Saves the AI-generated email body as a new template.
   * It opens the template editor modal with the generated content pre-filled.
   */
  const handleSaveGeneratedTemplate = () => {
    if (!generatedBody) return;
    setCurrentTemplate({
      id: `t${Date.now()}`,
      name: 'New AI Generated Template',
      subject: 'AI Generated Subject',
      body: generatedBody,
      category: 'AI Generated',
    });
    setIsEditorOpen(true);
    setGeneratedBody('');
  };

  /**
   * Closes the template editor modal and resets its state.
   */
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setCurrentTemplate(null);
    setEditorError(null);
    setSubjectError(null);
    setTestEmail('');
  };

  /**
   * Saves the current template (either new or edited) to the main templates list
   * by calling the `setTemplates` function from props.
   * It performs validation to ensure the name and subject are not empty and the name is unique.
   */
  const handleSaveTemplate = () => {
    if (!currentTemplate) return;

    setEditorError(null);
    setSubjectError(null);

    // Validation
    if (!currentTemplate.name.trim() || !currentTemplate.subject.trim()) {
      setEditorError('Template Name and Subject cannot be empty.');
      return;
    }
    
    const isNameDuplicate = templates.some(t => 
        t.id !== currentTemplate.id && t.name.trim().toLowerCase() === currentTemplate.name.trim().toLowerCase()
    );

    if (isNameDuplicate) {
        setEditorError('A template with this name already exists. Please choose a unique name.');
        return;
    }
    
    const templateToSave = {
      ...currentTemplate,
      category: currentTemplate.category?.trim() ?? ''
    }

    // ================================================================
    // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
    // ================================================================
    // This `setTemplates` call directly manipulates client-side state.
    // In a real application, this logic would be replaced with API calls
    // to your backend to either create or update a template in the database.
    // ================================================================
    setTemplates(prev => {
      const exists = prev.some(t => t.id === templateToSave.id);
      if (exists) {
        // Update existing template
        return prev.map(t => t.id === templateToSave.id ? templateToSave : t);
      } else {
        // Add new template
        return [...prev, templateToSave];
      }
    });
    handleCloseEditor();
  };
  
  /**
   * Handles changes to the input fields within the template editor modal.
   * It updates the `currentTemplate` state with the new values.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - The input change event.
   */
  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentTemplate) return;
    setEditorError(null);
    if (e.target.name === 'subject') {
      setSubjectError(null);
    }
    setCurrentTemplate({
      ...currentTemplate,
      [e.target.name]: e.target.value
    });
  };

  /**
   * A helper function to wrap selected text in the textarea with tags.
   * @param {string} openTag - The opening tag (e.g., '<strong>').
   * @param {string} closeTag - The closing tag (e.g., '</strong>').
   * @param {boolean} isBlock - Whether the tag is a block-level element.
   */
  const wrapText = (openTag: string, closeTag: string, isBlock = false) => {
    if (!currentTemplate || !bodyTextareaRef.current) return;
    const textarea = bodyTextareaRef.current;
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

    setCurrentTemplate(prev => (prev ? { ...prev, body: updatedBody } : null));

    requestAnimationFrame(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, end + openTag.length + closeTag.length + (isBlock ? 2 : 0));
      } else {
        textarea.setSelectionRange(start + openTag.length + (isBlock ? 1 : 0), start + openTag.length + (isBlock ? 1 : 0));
      }
    });
  };
  
  /**
   * A helper function to insert text at the current cursor position.
   * @param {string} textToInsert - The text to insert.
   */
  const insertText = (textToInsert: string) => {
    if (!currentTemplate || !bodyTextareaRef.current) return;
    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);
    
    setCurrentTemplate(prev => prev ? { ...prev, body: newText } : null);

    requestAnimationFrame(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    });
  };


  const handleInsertPlaceholder = (placeholder: string) => {
    if (placeholder) {
      insertText(placeholder);
    }
  };
  
  const handleInsertLink = () => {
    const url = window.prompt("Enter the URL:");
    if (url) {
        wrapText(`<a href="${url}" target="_blank">`, '</a>');
    }
  };

  const handleInsertList = (type: 'ul' | 'ol') => {
    if (!bodyTextareaRef.current) return;
    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
        const listItems = selectedText.split('\n').map(line => `  <li>${line}</li>`).join('\n');
        const list = `\n<${type}>\n${listItems}\n</${type}>\n`;
        insertText(list);
    } else {
        const placeholderList = `\n<${type}>\n  <li>First item</li>\n  <li>Second item</li>\n</${type}>\n`;
        insertText(placeholderList);
    }
  };
  
  // FIX: The `prompt` state variable was shadowing `window.prompt`.
  // This function correctly uses `window.prompt` and checks for a valid URL.
  const handleInsertImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      insertText(`<img src="${url}" alt="" style="max-width: 100%; height: auto;" />`);
    }
  };

  const handleInsertButton = () => {
    const url = window.prompt("Enter the button's destination URL:");
    if (!url) return;
    const buttonText = window.prompt("Enter the button text:", "Click Here");
    if (!buttonText) return;

    const buttonHtml = `
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
  <tr>
    <td align="center" bgcolor="#f97316" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#f97316;" valign="middle">
      <a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:normal;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;" target="_blank">
        ${buttonText}
      </a>
    </td>
  </tr>
</table>`;
    insertText(buttonHtml);
  };

  /**
   * Handles the AI subject generation request.
   * It calls the `generateEmailSubject` service with the current template's name and body,
   * then updates the subject field with the AI's response.
   */
  const handleGenerateSubject = async () => {
    if (!currentTemplate || !currentTemplate.body.trim()) return;

    if (isAiDisabled) {
        promptSubscription();
        return;
    }

    setIsGeneratingSubject(true);
    setEditorError(null);
    setSubjectError(null);
    try {
        const subject = await generateEmailSubject(currentTemplate.name, currentTemplate.body);
        setCurrentTemplate({
            ...currentTemplate,
            subject: subject.trim().replace(/^"|"$/g, '') // Remove quotes from response
        });
        refreshAiUsage();
    } catch (err: any) {
        setSubjectError(err.message || 'Failed to generate subject.');
    } finally {
        setIsGeneratingSubject(false);
    }
  };

  /**
   * Uses AI to improve the selected text in the email body.
   */
  const handleImproveText = async () => {
    if (!currentTemplate || !bodyTextareaRef.current) return;

    if (isAiDisabled) {
        promptSubscription();
        return;
    }

    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) {
        alert('Please select the text you want to improve.');
        return;
    }

    setIsImprovingText(true);
    setEditorError(null);
    try {
        const improvedText = await improveWriting(selectedText);
        const updatedBody = textarea.value.substring(0, start) + improvedText + textarea.value.substring(end);
        setCurrentTemplate(prev => prev ? { ...prev, body: updatedBody } : null);

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + improvedText.length);
        });
        refreshAiUsage();
    } catch (err: any) {
        setEditorError(err.message || 'Failed to improve text.');
    } finally {
        setIsImprovingText(false);
    }
  };


  /**
   * Handles the deletion of a template.
   * It shows a confirmation dialog, then sets the deleting state to trigger a fade-out animation,
   * and finally removes the template from the state after the animation completes.
   * @param {string} id - The ID of the template to delete.
   */
  const handleDeleteTemplate = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
        setDeletingId(id);
        setTimeout(() => {
            setTemplates(prev => prev.filter(t => t.id !== id));
            setDeletingId(null);
        }, 300);
    }
  }, [setTemplates]);

  const placeholders = ['{name}', '{email}', '{role}', '{paEmail}'];

  const renderPreviewBody = () => {
    if (!currentTemplate) return '';
    let body = currentTemplate.body
        .replace(/{name}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">name</span>')
        .replace(/{email}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">email</span>')
        .replace(/{role}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">role</span>')
        .replace(/{paEmail}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">paEmail</span>');
    
    const fullContent = `${settings.globalHeader} ${body} ${settings.globalFooter}`;

    return `<div class="prose prose-sm dark:prose-invert max-w-none text-light-text dark:text-brand-text">${fullContent}</div>`;
  }

  return (
    <>
      <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Content Generator Panel */}
        <div className="lg:col-span-1 flex flex-col space-y-8">
          <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2"><AIIcon /> <span>Penjana Kandungan AI</span></h2>
            <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary mb-4">Terangkan emel yang ingin anda hantar, dan AI kami akan menulisnya dalam Bahasa Malaysia untuk anda.</p>
            
            <div className="mb-4">
                <label htmlFor="tone-select" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">
                    Tone
                </label>
                <select
                    id="tone-select"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                >
                    <option>Professional</option>
                    <option>Formal</option>
                    <option>Casual</option>
                    <option>Friendly</option>
                </select>
            </div>
            
            <textarea
              className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
              rows={4}
              placeholder="Cth: Jemputan mesra ke webinar mengenai AI moden."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || isAiDisabled}
              className="w-full mt-4 bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:cursor-not-allowed"
              title={isAiDisabled ? 'Daily AI limit reached. Upgrade to Pro for unlimited use.' : 'Generate email content'}
            >
              {isGenerating ? <LoadingIcon /> : <AIIcon />}
              <span>{isGenerating ? 'Menjana...' : 'Jana dengan AI'}</span>
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {isAiDisabled && <p className="text-yellow-500 text-xs text-center mt-2">Daily limit reached. <strong>Upgrade to Pro</strong> for unlimited generations.</p>}
          </div>

          {isGenerating && (
            <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-6 rounded-lg animate-fade-in">
                <h3 className="font-bold mb-3 text-brand-accent-purple dark:text-brand-accent flex items-center space-x-2">
                    <LoadingIcon />
                    <span>{thinkingText ? `Thinking: ${thinkingText}` : 'Gemini is thinking...'}</span>
                </h3>
            </div>
          )}

          {generatedBody && (
            <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-brand-accent-purple/30 dark:border-brand-accent/30 p-4 rounded-lg animate-fade-in">
                <h3 className="font-bold mb-2">Kandungan Dijana:</h3>
                <textarea
                  readOnly
                  className="w-full h-48 bg-transparent text-light-text-secondary dark:text-brand-text-secondary text-sm p-2 rounded"
                  value={generatedBody}
                />
                <button 
                  onClick={handleSaveGeneratedTemplate}
                  className="w-full mt-2 bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                  <span>Simpan sebagai Templat Baharu</span>
                </button>
            </div>
          )}
        </div>

        {/* Templates List Panel */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold font-title">Email Templates</h1>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-auto'>
              <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-light-surface dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-sm"
              >
                  {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                  ))}
              </select>
              <button onClick={handleAddNewTemplate} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                <PlusIcon />
                <span>New Template</span>
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {Object.keys(groupedTemplates).length > 0 ? (
                Object.entries(groupedTemplates).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, templatesInCategory]) => (
                  <div key={category}>
                    <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-light-border dark:border-brand-light/20 text-light-text-secondary dark:text-brand-text-secondary flex items-center space-x-2">
                        <FolderIcon /> 
                        <span>{category}</span>
                    </h2>
                    <div className="space-y-4">
                        {templatesInCategory.map((template) => (
                        <div key={template.id} className={`bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-4 rounded-lg transition-opacity duration-300 ${deletingId === template.id ? 'opacity-0' : ''}`}>
                            <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{template.name}</h3>
                                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary truncate max-w-[200px] sm:max-w-full">{template.subject}</p>
                            </div>
                            <div className="flex items-center space-x-0 sm:space-x-2 flex-shrink-0 ml-4">
                                <button onClick={() => handleDuplicateTemplate(template)} title="Duplicate" className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><DuplicateIcon /></button>
                                <button onClick={() => handleEditTemplate(template)} title="Edit" className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                                <button onClick={() => handleDeleteTemplate(template.id)} title="Delete" className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                  </div>
                ))
            ) : (
                <div className="text-center p-12 text-light-text-secondary dark:text-brand-text-secondary bg-light-surface dark:bg-brand-dark/50 rounded-lg border border-light-border dark:border-brand-light/20">
                    <p>{templates.length === 0 ? 'No templates created yet. Click "New Template" to start.' : 'No templates found in this category.'}</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      {isEditorOpen && currentTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-2 sm:p-4">
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] lg:h-[90vh] p-4 sm:p-6 lg:p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-6 font-title flex-shrink-0">
                {templates.some(t => t.id === currentTemplate.id) ? 'Edit Template' : 'Create New Template'}
            </h2>
            
            <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 flex-grow overflow-hidden">
                {/* === EDITOR COLUMN === */}
                <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <div className="flex-grow overflow-y-auto pr-0 lg:pr-4 space-y-4">
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Template Name</label>
                                <input type="text" name="name" value={currentTemplate.name} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" placeholder="e.g., Monthly Newsletter" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Category</label>
                                <input type="text" name="category" value={currentTemplate.category ?? ''} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" placeholder="e.g., Marketing" list="category-suggestions" />
                                <datalist id="category-suggestions">{categories.filter(c => c !== 'all' && c !== 'Uncategorized').map(c => <option key={c} value={c} />)}</datalist>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Subject</label>
                            <div className="flex items-center space-x-2">
                                <input type="text" name="subject" value={currentTemplate.subject} onChange={handleTemplateChange} className={`flex-grow bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border ${subjectError ? 'border-red-500' : 'border-light-border dark:border-brand-light'} focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent`} placeholder="Subject of the email" />
                                <button type="button" onClick={handleGenerateSubject} disabled={isGeneratingSubject || !currentTemplate.body.trim() || isAiDisabled} title={isAiDisabled ? "Daily AI limit reached" : "Generate subject with AI"} className="flex-shrink-0 bg-brand-accent-purple text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 hover:bg-opacity-90 transition text-sm disabled:bg-slate-200 disabled:text-light-text-secondary dark:disabled:bg-brand-light dark:disabled:text-brand-text-secondary disabled:cursor-not-allowed">
                                    {isGeneratingSubject ? <LoadingIcon /> : <AIIcon />}
                                    <span className='hidden sm:inline'>{isGeneratingSubject ? '...' : 'AI'}</span>
                                </button>
                            </div>
                            {subjectError && <p className="text-red-500 text-sm mt-1">{subjectError}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Body</label>
                            <div className="bg-slate-100 dark:bg-brand-light/30 border border-light-border dark:border-brand-light rounded-t-md p-2 flex items-center space-x-1 flex-wrap gap-y-2 text-light-text dark:text-brand-text">
                                {/* Toolbar */}
                                <button title={isAiDisabled ? "Daily AI limit reached" : "Improve with AI"} onClick={handleImproveText} disabled={isImprovingText || isAiDisabled} className="flex items-center space-x-1.5 text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed">{isImprovingText ? <LoadingIcon/> : <SparklesIcon />}<span>Improve</span></button>
                                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                                <button title="Heading 1" onClick={() => wrapText('<h1>', '</h1>', true)} className="w-8 h-8 font-extrabold text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">H1</button>
                                <button title="Heading 2" onClick={() => wrapText('<h2>', '</h2>', true)} className="w-8 h-8 font-bold text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">H2</button>
                                <button title="Heading 3" onClick={() => wrapText('<h3>', '</h3>', true)} className="w-8 h-8 font-semibold text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">H3</button>
                                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                                <button title="Bold" onClick={() => wrapText('<strong>', '</strong>')} className="w-8 h-8 font-bold text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">B</button>
                                <button title="Italic" onClick={() => wrapText('<em>', '</em>')} className="w-8 h-8 italic text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">I</button>
                                <button title="Underline" onClick={() => wrapText('<u>', '</u>')} className="w-8 h-8 underline text-sm bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded">U</button>
                                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                                <button title="Blockquote" onClick={() => wrapText('<blockquote>', '</blockquote>', true)} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><QuoteIcon /></button>
                                <button title="Unordered List" onClick={() => handleInsertList('ul')} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><ListUnorderedIcon /></button>
                                <button title="Ordered List" onClick={() => handleInsertList('ol')} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><ListOrderedIcon /></button>
                                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                                <button title="Insert Link" onClick={handleInsertLink} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><LinkIcon /></button>
                                <button title="Insert Image" onClick={handleInsertImage} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><ImageIcon /></button>
                                <button title="Insert Button" onClick={handleInsertButton} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><ButtonIcon /></button>
                                <button title="Insert Horizontal Rule" onClick={() => insertText('\n<hr />\n')} className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-200 dark:bg-brand-light dark:hover:bg-brand-accent/20 rounded"><HorizontalRuleIcon /></button>
                                <div className="h-6 border-l border-light-border dark:border-brand-light/50 mx-1"></div>
                                <select onChange={(e) => { handleInsertPlaceholder(e.target.value); e.target.value = ''; }} className="text-xs bg-white text-brand-accent-purple dark:bg-brand-light px-2 py-1 rounded border-none focus:ring-0">
                                    <option value="">Placeholders</option>
                                    {placeholders.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <textarea ref={bodyTextareaRef} name="body" value={currentTemplate.body} onChange={handleTemplateChange} className="w-full h-full min-h-[300px] bg-light-bg dark:bg-brand-light/50 p-3 rounded-b-md border border-light-border dark:border-brand-light border-t-0 focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent font-mono text-sm" placeholder="Write your email content here..." />
                        </div>
                    </div>
                    {/* Test Email Section */}
                    <div className="flex-shrink-0 mt-auto pt-4 border-t border-light-border dark:border-brand-light/20">
                         <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-2">Send Test Email</label>
                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="recipient@example.com" className="flex-grow bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                            <button disabled title="This feature requires backend integration." className="bg-slate-300 text-slate-500 dark:bg-brand-light/50 dark:text-brand-text-secondary font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed">
                                <BlastIcon />
                                <span>Send Test</span>
                            </button>
                         </div>
                    </div>
                </div>

                {/* === PREVIEW COLUMN === */}
                <div className="lg:col-span-2 bg-slate-100 dark:bg-brand-darker rounded-lg p-1 flex flex-col h-full overflow-hidden mt-6 lg:mt-0">
                    <div className="flex-shrink-0 p-3 border-b border-light-border dark:border-brand-light/20">
                        <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">From: </span><strong className="text-light-text dark:text-white">{senderProfile?.name || '[Sender Name]'} &lt;{senderProfile?.email || '[sender.email@example.com]'}&gt;</strong></p>
                        <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">Subject: </span><strong className="text-light-text dark:text-white">{currentTemplate.subject || '[No Subject]'}</strong></p>
                        <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">To: </span><strong className="text-light-text dark:text-white">John Doe &lt;john.doe@example.com&gt;</strong></p>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        <div dangerouslySetInnerHTML={{ __html: renderPreviewBody() }} />
                    </div>
                </div>
            </div>

            {editorError && <p className="text-red-500 text-sm mt-4 text-center">{editorError}</p>}
            
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20 flex-shrink-0">
                <button onClick={handleCloseEditor} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                <button onClick={handleSaveTemplate} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};