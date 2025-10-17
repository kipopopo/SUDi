import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import { EmailTemplate, AiUsage } from '../types';
import { generateEmailContentStream, generateEmailSubject, improveWriting } from '../services/geminiService';
import { EditIcon, DeleteIcon, PlusIcon, AIIcon, LoadingIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, ImageIcon, DuplicateIcon, FolderIcon, LinkIcon, ListUnorderedIcon, ListOrderedIcon, QuoteIcon, HorizontalRuleIcon, ButtonIcon, SparklesIcon, BlastIcon } from './common/Icons';
import { addTemplate, updateTemplate, deleteTemplate } from '../services/templateService';
import { generateEcardPdf } from '../utils/ecardGenerator';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useModal } from '../contexts/ModalContext';
import { DeleteTemplateModal } from './TemplateModals';
import EcardBackdropExplorer from './EcardBackdropExplorer';
import Draggable from 'react-draggable';

const MenuBar = ({ editor, placeholders }: { editor: any, placeholders: string[] }) => {
    if (!editor) {
        return null;
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handlePlaceholder = (value: string) => {
        if (value) {
            editor.chain().focus().insertContent(value).run();
        }
    };

    return (
        <div className="tiptap-wrapper flex flex-wrap items-center gap-1 p-2 border border-light-border dark:border-brand-light/20 border-b-0 rounded-t-md bg-light-surface dark:bg-brand-dark">
            <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`${editor.isActive('bold') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><b>B</b></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`${editor.isActive('italic') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><i>I</i></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${editor.isActive('underline') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><u>U</u></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={`${editor.isActive('strike') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><s>S</s></button>
            <button onClick={() => {


                editor.chain().focus().undo().run();
            }} disabled={!editor.can().undo()} className="text-light-text-secondary dark:text-brand-text">Undo</button>
            <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="text-light-text-secondary dark:text-brand-text">Redo</button>
            <div className="divider"></div>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}>H1</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()} className={`${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}>H2</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()} className={`${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}>H3</button>
            <div className="divider"></div>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${editor.isActive('bulletList') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><ListUnorderedIcon /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${editor.isActive('orderedList') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><ListOrderedIcon /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${editor.isActive('blockquote') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><QuoteIcon /></button>
            <div className="divider"></div>
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><AlignLeftIcon /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><AlignCenterIcon /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><AlignRightIcon /></button>
            <div className="divider"></div>
            <button onClick={setLink} className={`${editor.isActive('link') ? 'is-active' : ''} text-light-text-secondary dark:text-brand-text`}><LinkIcon /></button>
            <button onClick={addImage} className="text-light-text-secondary dark:text-brand-text"><ImageIcon /></button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="text-light-text-secondary dark:text-brand-text"><HorizontalRuleIcon /></button>
            <div className="divider"></div>
            <select onChange={(e) => handlePlaceholder(e.target.value)} className="bg-light-bg dark:bg-brand-light/50 p-1 rounded-md border border-light-border dark:border-brand-light text-sm text-light-text dark:text-white">
                <option value="">Insert Placeholder</option>
                {placeholders.map(p => <option key={p} value={p} className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-white">{p}</option>)}
            </select>
        </div>
    );
};


interface TemplatesManagerProps {
  isSubscribed: boolean;
  aiUsage: AiUsage;
  refreshAiUsage: () => void;
  promptSubscription: () => void;
  isSidebarCollapsed: boolean;
}

const TemplatesManager: React.FC<TemplatesManagerProps> = ({ isSubscribed, aiUsage, refreshAiUsage, promptSubscription, isSidebarCollapsed }) => {
  const { templates, setTemplates } = useData();
  const { userSettings, globalSettings, senderProfile } = useSettings();
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<string>('Professional');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EmailTemplate>>({});
  const [livePreviewBody, setLivePreviewBody] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ecardBackdrop, setEcardBackdrop] = useState<File | null>(null);
  const [ecardBackdropPreview, setEcardBackdropPreview] = useState<string | null>(null);
  
  const [testEmail, setTestEmail] = useState('');
  const { openExplorer } = useModal();

  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const isAiDisabled = !isSubscribed && aiUsage.isExceeded;

  const placeholders = useMemo(() => ['{name}', '{email}', '{role}', '{paEmail}'], []);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, Link.configure({ openOnClick: false, autolink: true }), Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Enter your email body here...' })
    ],
    content: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEcardBackdrop(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEcardBackdropPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Listener for updating the live preview
  useEffect(() => {
    if (!editor) return;
    const updatePreview = () => setLivePreviewBody(editor.getHTML());
    editor.on('update', updatePreview);
    return () => { editor.off('update', updatePreview); };
  }, [editor]);

  // Load content into editor when a template is opened
  useEffect(() => {
    if (isEditorOpen && editor && !editor.isDestroyed) {
        editor.commands.clearContent();
        editor.commands.setContent(currentTemplate.body || '', false);
        setLivePreviewBody(currentTemplate.body || '');
    } else if (!isEditorOpen) {
        editor?.commands.clearContent();
    }
  }, [isEditorOpen, currentTemplate.id, currentTemplate.body, editor]);

  // Load e-card backdrop when editing an existing template
  useEffect(() => {

    const loadEcardBackdrop = async () => {
      if (isEditorOpen && currentTemplate.ecardBackdropPath) {
        try {
          const filename = currentTemplate.ecardBackdropPath.split('/').pop();
          const response = await fetch(`/api/ecard-backdrop/${filename}`);
          if (!response.ok) throw new Error('Failed to fetch backdrop image');
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            setEcardBackdropPreview(reader.result as string);
          };
        } catch (error) {
  
          setEcardBackdropPreview(null);
        }
      } else if (!isEditorOpen) {
        setEcardBackdropPreview(null);
      } else if (isEditorOpen && !currentTemplate.ecardBackdropPath) {
        setEcardBackdropPreview(null);
      }
    };
    loadEcardBackdrop();
  }, [isEditorOpen, currentTemplate.id, currentTemplate.ecardBackdropPath]);


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
      await generateEmailContentStream(prompt, tone, placeholders, (chunk) => {
        const c = chunk as any;
        if (c.thinking?.toolCode) {
          setThinkingText(c.thinking.toolCode);
        }
        if (c.text) {
          if (thinkingText) {
              setThinkingText(null);
          }
          setGeneratedBody((prev) => prev + c.text);
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

  const handleAddNewTemplate = () => {
    setCurrentTemplate({
      id: `t${Date.now()}`,
      name: '',
      subject: '',
      body: `<p>Hello {name},</p><p></p><p>Regards,</p><p><strong>Your Name</strong></p>`,
      category: '',
      nameX: 0,
      nameY: 0,
      nameFontSize: 48,
      nameColor: '#000000',
      roleX: 0,
      roleY: 0,
      roleFontSize: 36,
      roleColor: '#000000',
    });
    setEcardBackdrop(null);
    setEcardBackdropPreview(null);
    setIsEditorOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {

    setCurrentTemplate({
      ...template,
      nameX: template.nameX ?? 0,
      nameY: template.nameY ?? 0,
      nameFontSize: template.nameFontSize ?? 48,
      nameColor: template.nameColor ?? '#000000',
      roleX: template.roleX ?? 0,
      roleY: template.roleY ?? 0,
      roleFontSize: template.roleFontSize ?? 36,
      roleColor: template.roleColor ?? '#000000',
    });
    setIsEditorOpen(true);
  };

  const handleDuplicateTemplate = (templateToDuplicate: EmailTemplate) => {
    let newName = `${templateToDuplicate.name} - Copy`;
    let counter = 2;
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
    setEcardBackdrop(null);
    setIsEditorOpen(true);
  };

  const handleSaveGeneratedTemplate = () => {
    if (!generatedBody) return;
    setCurrentTemplate({
      id: `t${Date.now()}`,
      name: 'New AI Generated Template',
      subject: 'AI Generated Subject',
      body: generatedBody,
      category: 'AI Generated',
    });
    setEcardBackdrop(null);
    setIsEditorOpen(true);
    setGeneratedBody('');
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleGeneratePdfPreview = async () => {

    if (!ecardBackdrop) {
      setEditorError('Please upload an e-card backdrop image first.');
      return;
    }


    setEditorError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(ecardBackdrop);
      reader.onload = async () => {
        const backdropImageUrl = reader.result as string;
        const stage = stageRef.current;
        if (!stage) return;

        const pdfParams = {
            name: 'John Doe',
            role: 'Software Engineer',
            backdropImageUrl: backdropImageUrl,
            nameX: currentTemplate.nameX,
            nameY: stage.offsetHeight - (currentTemplate.nameY || 0) - (nameRef.current?.offsetHeight || 0),
            nameFontSize: currentTemplate.nameFontSize,
            nameColor: currentTemplate.nameColor,
            roleX: currentTemplate.roleX,
            roleY: stage.offsetHeight - (currentTemplate.roleY || 0) - (roleRef.current?.offsetHeight || 0),
            roleFontSize: currentTemplate.roleFontSize,
            roleColor: currentTemplate.roleColor,
        };

        const pdfDataUri = await generateEcardPdf(pdfParams);
        
        // Create a Blob from the data URI and then a URL for the iframe
        const byteCharacters = atob(pdfDataUri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        setGeneratedPdfPreview(blobUrl);
        alert('E-card PDF generated successfully!'); // Notification for PDF generation
      };
      reader.onerror = (error) => {
  
        setEditorError('Failed to read e-card backdrop file.');
      };
    } catch (error) {

      setEditorError('Failed to generate PDF preview.');
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name || !currentTemplate.subject || !editor) return;

    setEditorError(null);
    setSubjectError(null);

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

    let uploadedEcardBackdropPath: string | undefined;

    if (ecardBackdrop) {
      const formData = new FormData();
      formData.append('ecardBackdrop', ecardBackdrop);

      try {
        const response = await fetch('/api/upload-ecard-backdrop', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        uploadedEcardBackdropPath = data.filePath;

      } catch (error) {

        setEditorError('Failed to upload e-card backdrop.');
        return;
      }
    }
    
    const templateToSave: EmailTemplate = {
      id: currentTemplate.id || `t${Date.now()}`,
      name: currentTemplate.name.trim(),
      subject: currentTemplate.subject.trim(),
      body: editor.getHTML(),
      category: currentTemplate.category?.trim() ?? '',
      ecardBackdropPath: uploadedEcardBackdropPath || currentTemplate.ecardBackdropPath,
      nameX: currentTemplate.nameX,
      nameY: currentTemplate.nameY,
      nameFontSize: currentTemplate.nameFontSize,
      nameColor: currentTemplate.nameColor,
      roleX: currentTemplate.roleX,
      roleY: currentTemplate.roleY,
      roleFontSize: currentTemplate.roleFontSize,
      roleColor: currentTemplate.roleColor,
    }




    try {
      const exists = templates.some(t => t.id === templateToSave.id);
      if (exists) {
        const updatedTemplate = await updateTemplate(templateToSave);


        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        setCurrentTemplate(updatedTemplate); // Update currentTemplate with the latest data

      } else {
        const newTemplate = await addTemplate(templateToSave);


        setTemplates(prev => [...prev, newTemplate]);
        setCurrentTemplate(newTemplate); // Update currentTemplate with the latest data

      }
      setIsEditorOpen(false);
      setEditorError(null);
      setSubjectError(null);
      setTestEmail('');
      setEcardBackdrop(null);
      setEcardBackdropPreview(null);
      alert('Template saved successfully!'); // Notification for template saving
    } catch (error) {
      setEditorError('Failed to save template.');
    }
  };
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditorError(null);
    if (e.target.name === 'subject') {
      setSubjectError(null);
    }
    const { name, value } = e.target;
    const isNumeric = ['nameX', 'nameY', 'nameFontSize', 'roleX', 'roleY', 'roleFontSize'].includes(name);

    setCurrentTemplate(prev => ({...prev, [name]: isNumeric ? parseFloat(value) || 0 : value}));
  };

  const handleGenerateSubject = async () => {
    if (!editor || editor.isEmpty) return;

    if (isAiDisabled) {
        promptSubscription();
        return;
    }

    setIsGeneratingSubject(true);
    setEditorError(null);
    setSubjectError(null);
    try {
        const subject = await generateEmailSubject(currentTemplate.name || 'New Template', editor.getText(), placeholders);
        setCurrentTemplate(prev => ({...prev, subject: subject.trim().replace(/^"|"$/g, '')}));
        refreshAiUsage();
    } catch (err: any) {
        setSubjectError(err.message || 'Failed to generate subject.');
    }
  };

  const handleDeleteClick = (template: EmailTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTemplate = useCallback(async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete.id);
      setDeletingId(templateToDelete.id);
      setTimeout(() => {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        setDeletingId(null);
        setIsDeleteModalOpen(false);
        setTemplateToDelete(null);
      }, 300);
    } catch (error) {
      alert('Failed to delete template.');
    }
  }, [templateToDelete, setTemplates]);

  const renderPreviewBody = () => {
    if (!currentTemplate) return '';
    let body = livePreviewBody
        .replace(/{name}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">name</span>')
        .replace(/{email}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">email</span>')
        .replace(/{role}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">role</span>')
        .replace(/{paEmail}/g, '<span class="bg-yellow-200 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">paEmail</span>');
    
  const header = globalSettings?.globalHeader ?? '';
  const footer = globalSettings?.globalFooter ?? '';
  const fullContent = `${header} ${body} ${footer}`;

        return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: var(--preview-text-color);"> ${fullContent} </div>`;
  }

  const renderTemplates = () => {
    if (Object.keys(groupedTemplates).length > 0) {
      return (
        <>
          {Object.entries(groupedTemplates)
            .sort(([catA], [catB]) => catA.localeCompare(catB))
            .map(([category, templatesInCategory]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-light-border dark:border-brand-light/20 text-light-text-secondary dark:text-brand-text-secondary flex items-center space-x-2">
                  <FolderIcon />
                  <span>{category}</span>
                </h2>
                <div className="space-y-4">
                  {templatesInCategory.map((template) => (
                    <div
                      key={template.id}
                      className={`bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-4 rounded-lg transition-opacity duration-300 ${ 
                        deletingId === template.id ? 'opacity-0' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">{template.name}</h3>
                          <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary truncate max-w-[200px] sm:max-w-full">
                            {template.subject}
                          </p>
                        </div>
                        <div className="flex items-center space-x-0 sm:space-x-2 flex-shrink-0 ml-4">
                          <p className="text-xs text-light-text-secondary dark:text-brand-text-secondary flex items-center space-x-1">
                            <span>E-card:</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${template.ecardBackdropPath ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </p>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            title="Duplicate"
                            className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"
                          >
                            <DuplicateIcon />
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            title="Edit"
                            className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(template)}
                            title="Delete"
                            className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </>
      );
    }
    else {
      return (
        <div className="text-center p-12 text-light-text-secondary dark:text-brand-text-secondary bg-light-surface dark:bg-brand-dark/50 rounded-lg border border-light-border dark:border-brand-light/20">
          <p>
            {templates.length === 0
              ? 'No templates created yet. Click "New Template" to start.'
              : 'No templates found in this category.'}
          </p>
        </div>
      );
    }
  };

  return (
    <>
      <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col space-y-8">
          <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 dark:text-white"><AIIcon /> <span>Penjana Kandungan AI</span></h2>
            <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary mb-4">Terangkan emel yang ingin anda hantar, dan AI kami akan menulisnya dalam Bahasa Malaysia untuk anda.</p>
            
            <div className="mb-4">
                <label htmlFor="tone-select" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">
                    Tone
                </label>
                <select
                    id="tone-select"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-sm text-light-text dark:text-brand-text"
                >
                    <option className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">Professional</option>
                    <option className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">Formal</option>
                    <option className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">Casual</option>
                    <option className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">Friendly</option>
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
                <h3 className="font-bold mb-2 dark:text-white">Kandungan Dijana:</h3>
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

        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold font-title dark:text-white">Email Templates</h1>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-auto'>
              <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-light-surface dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-sm text-light-text dark:text-brand-text"
              >
                  {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">{cat === 'all' ? 'All Categories' : cat}</option>
                  ))}
              </select>
              <button onClick={handleAddNewTemplate} className="flex-shrink-0 bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                <PlusIcon />
                <span>New Template</span>
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {renderTemplates()}
          </div>
        </div>
      </div>

      {isDeleteModalOpen && templateToDelete && <DeleteTemplateModal template={templateToDelete} onClose={() => setIsDeleteModalOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}



      {isEditorOpen && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-6xl max-w-full h-[90vh] p-4 sm:p-6 lg:p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-6 font-title flex-shrink-0 text-light-text dark:text-white">
                {templates.some(t => t.id === currentTemplate.id) ? 'Edit Template' : 'Create New Template'}
            </h2>
            
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
                {/* Left Column: Controls */}
                <div className="flex flex-col h-full overflow-y-auto pr-0 lg:pr-4 space-y-6">
                    <>
                        {/* Basic Template Info */}
                        <div className="bg-light-bg dark:bg-brand-light/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 space-y-4">
                            <h3 className="text-lg font-bold text-light-text dark:text-white">Template Details</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Template Name</label>
                                    <input type="text" name="name" value={currentTemplate.name ?? ''} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" placeholder="e.g., Monthly Newsletter" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Category</label>
                                    <input type="text" name="category" value={currentTemplate.category ?? ''} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" placeholder="e.g., Marketing" list="category-suggestions" />
                                    <datalist id="category-suggestions">{categories.filter(c => c !== 'all' && c !== 'Uncategorized').map(c => <option key={c} value={c} />)}</datalist>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Email Subject</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" name="subject" value={currentTemplate.subject ?? ''} onChange={handleTemplateChange} className={`flex-grow bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border ${subjectError ? 'border-red-500' : 'border-light-border dark:border-brand-light'} focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white`} placeholder="Subject of the email" />
                                    <button type="button" onClick={handleGenerateSubject} disabled={isGeneratingSubject || !editor?.getText().trim() || isAiDisabled} title={isAiDisabled ? "Daily AI limit reached" : "Generate subject with AI"} className="flex-shrink-0 bg-brand-accent-purple text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 hover:bg-opacity-90 transition text-sm disabled:bg-slate-200 disabled:text-light-text-secondary dark:disabled:bg-brand-light dark:disabled:text-brand-text-secondary disabled:cursor-not-allowed">
                                        {isGeneratingSubject ? <LoadingIcon /> : <AIIcon />}
                                        <span className='hidden sm:inline'>{isGeneratingSubject ? '...' : 'AI'}</span>
                                    </button>
                                </div>
                                {subjectError && <p className="text-red-500 text-sm mt-1">{subjectError}</p>}
                            </div>
                        </div>

                        {/* E-Card Settings */}
                        <div className="bg-light-bg dark:bg-brand-light/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 space-y-4">
                            <h3 className="text-lg font-bold text-light-text dark:text-white">E-Card Settings</h3>
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">E-Card Backdrop</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" name="ecardBackdropPath" value={currentTemplate.ecardBackdropPath ?? ''} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" placeholder="/uploads/backdrop.png" />
                                    <button type="button" onClick={() => openExplorer((path) => setCurrentTemplate(prev => ({...prev, ecardBackdropPath: path})))} className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition">
                                        <FolderIcon />
                                        <span>Browse</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold mt-4 text-light-text dark:text-white">E-Card Text Positioning</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Name X Position</label>
                                        <input type="number" name="nameX" value={currentTemplate.nameX ?? 0} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Name Y Position</label>
                                        <input type="number" name="nameY" value={currentTemplate.nameY ?? 0} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Name Font Size</label>
                                        <input type="number" name="nameFontSize" value={currentTemplate.nameFontSize ?? 48} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Name Color</label>
                                        <input type="color" name="nameColor" value={currentTemplate.nameColor ?? '#000000'} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Role X Position</label>
                                        <input type="number" name="roleX" value={currentTemplate.roleX ?? 0} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Role Y Position</label>
                                        <input type="number" name="roleY" value={currentTemplate.roleY ?? 0} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Role Font Size</label>
                                        <input type="number" name="roleFontSize" value={currentTemplate.roleFontSize ?? 36} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-1">Role Color</label>
                                        <input type="color" name="roleColor" value={currentTemplate.roleColor ?? '#000000'} onChange={handleTemplateChange} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button onClick={handleGeneratePdfPreview} className="w-full mt-4 bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                                    <span>Generate E-card Preview</span>
                                </button>
                            </div>
                        </div>

                        {/* Email Body Editor */}
                        <div className="bg-light-bg dark:bg-brand-light/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 space-y-4">
                            <h3 className="text-lg font-bold text-light-text dark:text-white">Email Body</h3>
                            <div className="tiptap-wrapper rounded-md border border-light-border dark:border-brand-light">
                                <MenuBar editor={editor} placeholders={placeholders} />
                                <EditorContent editor={editor} className="w-full h-full min-h-[300px] bg-light-bg dark:bg-brand-light/50 text-sm overflow-y-auto" />
                            </div>
                        </div>

                        <div className="flex-shrink-0 mt-auto pt-4 border-t border-light-border dark:border-brand-light/20">
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-white mb-2">Send Test Email</label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="recipient@example.com" className="flex-grow bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-light-text dark:text-white" />
                                <button disabled title="This feature requires backend integration." className="bg-slate-300 text-slate-500 dark:bg-brand-light/50 dark:text-brand-text-secondary font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed">
                                    <BlastIcon />
                                    <span>Send Test</span>
                                </button>
                            </div>
                        </div>
                    </>
                </div>

                {/* Right Column: Previews */}
                <div className="flex flex-col h-full overflow-y-auto space-y-6">
                    {/* Email Preview */}
                    <div className="bg-light-bg dark:bg-brand-light/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold mb-2 text-light-text dark:text-white">Email Preview</h3>
                        <div className="flex-shrink-0 p-3 border-b border-light-border dark:border-brand-light/20">
                            <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">From: </span><strong className="text-light-text dark:text-white">{senderProfile?.name || '[Sender Name]'} &lt;{senderProfile?.email || '[sender.email@example.com]'}&gt;</strong></p>
                            <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">Subject: </span><strong className="text-light-text dark:text-white">{currentTemplate.subject ?? '[No Subject]'}</strong></p>
                            <p className="text-sm"><span className="text-light-text-secondary dark:text-brand-text-secondary">To: _</span><strong className="text-light-text dark:text-white">John Doe &lt;john.doe@example.com&gt;</strong></p>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                            <div dangerouslySetInnerHTML={{ __html: renderPreviewBody() }} />
                        </div>
                    </div>

                    {/* E-card Preview */}
                    <div className="bg-light-bg dark:bg-brand-light/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold mb-2 text-light-text dark:text-white">E-card Interactive Editor</h3>
                        <div ref={stageRef} className="relative w-full h-full min-h-[400px] border border-dashed border-light-border dark:border-brand-light/20 rounded-md overflow-hidden">
                            {ecardBackdropPreview ? (
                                <>
                                    <img src={ecardBackdropPreview} alt="E-card backdrop" className="w-full h-full object-contain" />
                                    <div className="absolute top-0 left-0 w-full h-full">
                                        <Draggable
                                            nodeRef={nameRef}
                                            position={{ x: currentTemplate.nameX || 0, y: currentTemplate.nameY || 0 }}
                                            onStop={(e, data) => {
                                                setCurrentTemplate(prev => ({ ...prev, nameX: data.x, nameY: data.y }));
                                            }}
                                        >
                                            <div ref={nameRef} style={{ color: currentTemplate.nameColor, fontSize: `${currentTemplate.nameFontSize}px`, position: 'absolute', cursor: 'move' }}>John Doe</div>
                                        </Draggable>
                                        <Draggable
                                            nodeRef={roleRef}
                                            position={{ x: currentTemplate.roleX || 0, y: currentTemplate.roleY || 0 }}
                                            onStop={(e, data) => {
                                                setCurrentTemplate(prev => ({ ...prev, roleX: data.x, roleY: data.y }));
                                            }}
                                        >
                                            <div ref={roleRef} style={{ color: currentTemplate.roleColor, fontSize: `${currentTemplate.roleFontSize}px`, position: 'absolute', cursor: 'move' }}>Software Engineer</div>
                                        </Draggable>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-light-text-secondary dark:text-white py-12">
                                    <p>Upload a backdrop to start the interactive editor</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editorError && <p className="text-red-500 text-sm mt-4 text-center">{editorError}</p>}
            
            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20 flex-shrink-0">
                <button onClick={handleCloseEditor} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Close</button>
                <button onClick={handleSaveTemplate} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesManager;
