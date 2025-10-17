import React, { useState, useEffect, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import { AppSettings } from '../types';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, LinkIcon, ListOrderedIcon, ListUnorderedIcon, QuoteIcon, CheckCircleIcon, ImageIcon, HorizontalRuleIcon, UserIcon, LockIcon, BellIcon, BrushIcon, DangerIcon, UploadIcon, MailIcon, HistoryIcon, LoadingIcon } from './common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-brand-accent-purple/10 text-brand-accent-purple dark:bg-brand-accent/20 dark:text-brand-accent font-semibold'
        : 'text-light-text-secondary hover:bg-light-hover dark:text-brand-text-secondary dark:hover:bg-brand-light/10'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

// --- Tiptap Editor Components (Self-contained for this file) ---

const MenuBar = ({ editor }: { editor: any }) => {
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

    return (
        <div className="tiptap-wrapper flex flex-wrap items-center gap-1 p-2 border border-light-border dark:border-brand-light/20 border-b-0 rounded-t-md bg-light-surface dark:bg-brand-dark">
            <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><b>B</b></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><i>I</i></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><u>U</u></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><s>S</s></button>
            <div className="divider"></div>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}><ListUnorderedIcon /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}><ListOrderedIcon /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}><QuoteIcon /></button>
            <div className="divider"></div>
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><AlignLeftIcon /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><AlignCenterIcon /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><AlignRightIcon /></button>
            <div className="divider"></div>
            <button onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}><LinkIcon /></button>
            <button onClick={addImage}><ImageIcon /></button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()}><HorizontalRuleIcon /></button>
        </div>
    );
};

// --- Main Component ---

interface SettingsManagerProps {}

const SettingsManager: React.FC<SettingsManagerProps> = () => {
    const { settings, setSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');

    const navigationItems = [
        { id: 'profile', label: 'Personal Info', icon: <UserIcon className="w-5 h-5" /> },
        { id: 'password', label: 'Password & Security', icon: <LockIcon /> },
        { id: 'email', label: 'Global Email Settings', icon: <MailIcon /> },
        { id: 'sender', label: 'Sender Setup', icon: <MailIcon /> },
        { id: 'theme', label: 'Appearance', icon: <BrushIcon /> },
        { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
        { id: 'delete', label: 'Danger Zone', icon: <DangerIcon /> },
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSection />;
            case 'password':
                return <PasswordSection />;
            case 'email':
                return <EmailSettingsContent settings={settings || {}} setSettings={setSettings} />;
            case 'sender':
                return <SenderSetupContent settings={settings || {}} setSettings={setSettings} />;
            case 'theme':
                return <ThemeSection />;
            case 'notifications':
                return <NotificationsSection />;
            case 'delete':
                return <DeleteSection />;
            default:
                return <ProfileSection />;
        }
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="text-left mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title">Settings</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">
                    Manage your account settings, preferences, and security.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1">
                    <nav className="space-y-2 p-4 bg-light-surface dark:bg-brand-dark/50 rounded-xl border border-light-border dark:border-brand-light/20">
                        {navigationItems.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activeSection === item.id}
                                onClick={() => setActiveSection(item.id)}
                            />
                        ))}
                    </nav>
                </aside>

                <main className="lg:col-span-3">
                    <div className="bg-light-surface dark:bg-brand-dark/50 p-6 sm:p-8 rounded-xl border border-light-border dark:border-brand-light/20 min-h-[400px]">
                        {renderSection()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsManager;

const SenderSetupContent: React.FC = () => {
    const { senderProfile, setSenderProfile } = useSettings();
    const [name, setName] = useState(senderProfile?.name || '');
    const [email, setEmail] = useState(senderProfile?.email || '');
    const [originalEmail, setOriginalEmail] = useState(senderProfile?.email || '');
    const [verificationCode, setVerificationCode] = useState('');
    
    const [status, setStatus] = useState<VerificationStatus>(senderProfile?.verified ? 'verified' : 'unverified');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setName(senderProfile?.name || '');
        setEmail(senderProfile?.email || '');
        setOriginalEmail(senderProfile?.email || '');
        setStatus(senderProfile?.verified ? 'verified' : 'unverified');
    }, [senderProfile]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (e.target.value.toLowerCase() !== originalEmail.toLowerCase()) {
            setStatus('unverified');
            setVerificationCode('');
            setError('');
        } else if (senderProfile?.verified) {
            setStatus('verified');
        }
    };

    const handleSendCode = async () => {
        setError('');
        if (!name.trim() || !email.trim()) {
            setError('Sender Name and Email cannot be empty.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        
        setIsLoading(true);
        try {
            // await axios.post('/api/send-verification-code', { email }); // Re-enable when backend is ready
            setStatus('pending');
        } catch (err) {
            setError('Failed to send verification code. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setError('');
        if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
             setError('Please enter a valid 6-digit verification code.');
             return;
        }

        setIsLoading(true);
        try {
            // await axios.post('/api/verify-code', { email, code: verificationCode }); // Re-enable when backend is ready
            const newProfile: SenderProfile = { name: name.trim(), email: email.trim(), verified: true };
            setSenderProfile(newProfile);
            setOriginalEmail(email);
            setStatus('verified');
        } catch (err) {
            setError('Invalid verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = name !== (senderProfile?.name || '') || email !== (senderProfile?.email || '');
    
    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title">Sender Setup</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Configure and verify the email address used to send campaigns.</p>
            </div>

            <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sender-name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Sender Name</label>
                        <input
                            id="sender-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., The SUDi Team"
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                     <div>
                        <label htmlFor="sender-email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Sender Email</label>
                        <input
                            id="sender-email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="e.g., noreply@sudi.app"
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-light-border dark:border-brand-light/20">
                    <h3 className="text-lg font-semibold mb-4">Verification Status</h3>

                    {status === 'unverified' && (
                        <div className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg flex flex-col items-center text-center">
                            <HistoryIcon className="w-8 h-8 mb-2" />
                            <p className="font-semibold">Your sender email is unverified.</p>
                            <p className="text-sm mb-4">You must verify your email address before you can send campaigns.</p>
                            <button 
                                onClick={handleSendCode}
                                disabled={isLoading}
                                className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2">
                                {isLoading ? <LoadingIcon /> : <MailIcon />}
                                <span>{isLoading ? 'Sending...' : 'Send Verification Code'}</span>
                            </button>
                        </div>
                    )}
                    
                    {status === 'pending' && (
                        <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg flex flex-col items-center text-center">
                             <MailIcon className="w-8 h-8 mb-2" />
                             <p className="font-semibold">A verification code has been sent to {email}.</p>
                             <p className="text-sm mb-4">Please enter the 6-digit code below to complete verification.</p>
                             <div className="flex flex-col sm:flex-row items-center gap-2">
                                 <input 
                                     type="text"
                                     value={verificationCode}
                                     onChange={(e) => setVerificationCode(e.target.value)}
                                     maxLength={6}
                                     placeholder="_ _ _ _ _ _"
                                     className="w-40 bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light text-center font-mono tracking-[0.5em] text-lg"
                                 />
                                 <button
                                     onClick={handleVerifyCode}
                                     disabled={isLoading}
                                     className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                                 >
                                    {isLoading ? <LoadingIcon /> : <CheckCircleIcon />}
                                     <span>{isLoading ? 'Verifying...' : 'Verify'}</span>
                                 </button>
                             </div>
                        </div>
                    )}

                    {status === 'verified' && (
                        <div className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center space-x-4">
                            <CheckCircleIcon className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Your sender email is verified!</p>
                                <p className="text-sm">You can now send campaigns from <span className="font-mono">{email}</span>.</p>
                                {isDirty && (
                                     <p className="text-sm mt-2 text-yellow-800 dark:text-yellow-300">You have unsaved changes. A new verification will be required.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>

            </div>
        </div>
    );
};

// --- Sections ---

const EmailSettingsContent: React.FC<{ settings: AppSettings; setSettings: React.Dispatch<React.SetStateAction<AppSettings>> }> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings || {});
    const [showSuccess, setShowSuccess] = useState(false);

    const headerEditor = useEditor({
        extensions: [
            StarterKit, Underline, Link, Image, TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Enter your global email header HTML here...' })
        ],
        content: settings?.globalHeader || '',
    });

    const footerEditor = useEditor({
        extensions: [
            StarterKit, Underline, Link, Image, TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Enter your global email footer HTML here...' })
        ],
        content: settings?.globalFooter || '',
    });

    useEffect(() => {
        // When the main settings prop changes (e.g., initial load or discard), reset editors
        if (headerEditor && !headerEditor.isDestroyed) headerEditor.commands.setContent(settings.globalHeader, false);
        if (footerEditor && !footerEditor.isDestroyed) footerEditor.commands.setContent(settings.globalFooter, false);
        setLocalSettings(settings); // Also reset the local state for preview
    }, [settings, headerEditor, footerEditor]);

    const handleSave = () => {
        if (!headerEditor || !footerEditor) return;

        setSettings(prev => ({
            ...prev,
            globalHeader: headerEditor.getHTML(),
            globalFooter: footerEditor.getHTML(),
        }));

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDiscard = () => {
        // The useEffect hook will handle resetting the state and editors
        setSettings({ ...settings }); 
    };
    
    // Live preview for header/footer as user types
    useEffect(() => {
        if (!headerEditor) return;
        const updateHeaderPreview = () => setLocalSettings(prev => ({ ...prev, globalHeader: headerEditor.getHTML() }));
        headerEditor.on('update', updateHeaderPreview);
        return () => headerEditor.off('update', updateHeaderPreview);
    }, [headerEditor]);

    useEffect(() => {
        if (!footerEditor) return;
        const updateFooterPreview = () => setLocalSettings(prev => ({ ...prev, globalFooter: footerEditor.getHTML() }));
        footerEditor.on('update', updateFooterPreview);
        return () => footerEditor.off('update', updateFooterPreview);
    }, [footerEditor]);


    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold font-title mb-2">Email Settings</h1>
            <p className="text-light-text-secondary dark:text-brand-text-secondary mb-8">Define a consistent header and footer for all outgoing emails to maintain brand identity.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div>
                        <label className="block text-xl font-bold font-title mb-4">Global Email Header</label>
                        <div className="tiptap-wrapper rounded-md border border-light-border dark:border-brand-light">
                            <MenuBar editor={headerEditor} />
                            <EditorContent editor={headerEditor} className="w-full h-48 bg-light-bg dark:bg-brand-light/50 text-sm overflow-y-auto" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xl font-bold font-title mb-4">Global Email Footer</label>
                        <div className="tiptap-wrapper rounded-md border border-light-border dark:border-brand-light">
                            <MenuBar editor={footerEditor} />
                            <EditorContent editor={footerEditor} className="w-full h-48 bg-light-bg dark:bg-brand-light/50 text-sm overflow-y-auto" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-title">Live Preview</h2>
                    <div className="bg-light-surface dark:bg-brand-dark rounded-lg p-1 border border-light-border dark:border-brand-light/20">
                        <div className="bg-slate-100 dark:bg-brand-darker rounded-lg p-4 h-[420px] overflow-y-auto">
                           <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalHeader }}
                                style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#333' }}
                            />
                            <div className="my-4 p-4 border-2 border-dashed border-slate-300 dark:border-brand-light/40 rounded-md text-center text-slate-400 dark:text-brand-text-secondary">
                                <p className="font-semibold text-sm">Your unique email content will appear here.</p>
                                <p className="text-xs">Hello &#123;name&#125;, this is a sample body...</p>
                            </div>
                            <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalFooter }}
                                style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#333' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

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

const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null); // URL or base64
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username);
      setEmail(user.email || '');
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in-fast">
      <h2 className="text-xl font-bold font-title mb-6">Personal Information</h2>
      <form onSubmit={handleProfileSave} className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={profileImage || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-light-border dark:border-brand-light/20"
            />
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 bg-brand-accent-purple text-white rounded-full p-1.5 cursor-pointer hover:bg-opacity-90 transition"
              title="Upload new picture"
            >
              <UploadIcon className="w-4 h-4" />
            </label>
            <input id="profile-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className='flex-grow'>
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{email}</p>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            title="Changing email address is not supported yet."
            className="w-full bg-light-bg dark:bg-brand-light/20 p-2.5 rounded-md border border-light-border dark:border-brand-light/20 cursor-not-allowed"
          />
        </div>
        <div className="pt-2 flex items-center justify-end space-x-4">
          {showSuccess && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
              <CheckCircleIcon />
              <span className="font-semibold text-sm">Saved!</span>
            </div>
          )}
          <button type="submit" className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
        </div>
      </form>
    </div>
  );
};
  
  const PasswordSection: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
  
    const getPasswordStrength = (password: string) => {
      let score = 0;
      if (!password) return 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      return Math.min(score, 5);
    };
  
    const strength = getPasswordStrength(newPassword);
    const strengthText = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][strength];
  
  
    const handlePasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError('');
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }
      if (strength < 3) {
          setPasswordError("Password is too weak. Please choose a stronger one.");
          return;
      }
  
      setShowSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowSuccess(false), 3000);
    };
  
    return (
      <div className="animate-fade-in-fast">
        <h2 className="text-xl font-bold font-title mb-2">Password & Security</h2>
        <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">
          Update your password for enhanced security.
        </p>
        <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Current Password</label>
            <div className="relative">
              <input id="currentPassword" type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">New Password</label>
            <div className="relative">
              <input id="newPassword" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
            </div>
            {newPassword && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex-grow h-2 bg-light-border dark:bg-brand-light/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}></div>
                </div>
                <span className="text-xs font-medium text-light-text-secondary dark:text-brand-text-secondary w-16 text-right">{strengthText}</span>
              </div>
            )}
          </div>
  
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Confirm New Password</label>
            <div className="relative">
              <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
            </div>
          </div>
  
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          
          <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center">
                  <input type="checkbox" id="show-password" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="h-4 w-4 text-brand-accent-purple rounded border-light-border dark:border-brand-light focus:ring-brand-accent-purple" />
                  <label htmlFor="show-password" className="ml-2 block text-sm text-light-text-secondary dark:text-brand-text-secondary">Show password</label>
              </div>
              <a href="#" className="text-sm text-brand-accent-purple hover:underline">Forgot Password?</a>
          </div>
  
          <div className="pt-2 flex items-center justify-end space-x-4">
             {showSuccess && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 animate-fade-in">
                    <CheckCircleIcon />
                    <span className="font-semibold">Password Updated!</span>
                </div>
            )}
            <button type="submit" className="bg-brand-accent-purple text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Update Password</button>
          </div>
        </form>
      </div>
    );
  };
  
  const ThemeSection: React.FC = () => {
      const [theme, setTheme] = useState('system'); // system, light, dark
  
      const handleThemeChange = (selectedTheme: string) => {
          setTheme(selectedTheme);
          // In a real app, you'd also apply the theme to the body class
          // and save the preference to localStorage or a backend.
  
      };
  
      return (
          <div className="animate-fade-in-fast">
              <h2 className="text-xl font-bold font-title mb-6">Appearance</h2>
              <p className="text-light-text-secondary dark:text-brand-text-secondary mb-4">
                  Choose how Sudi looks and feels.
              </p>
              <div className="space-y-2">
                  <ThemeOption
                      label="Light"
                      value="light"
                      currentTheme={theme}
                      onChange={handleThemeChange}
                  />
                  <ThemeOption
                      label="Dark"
                      value="dark"
                      currentTheme={theme}
                      onChange={handleThemeChange}
                  />
                  <ThemeOption
                      label="System"
                      value="system"
                      currentTheme={theme}
                      onChange={handleThemeChange}
                  />
              </div>
          </div>
      );
  };
  
  type ThemeOptionProps = {
      label: string;
      value: string;
      currentTheme: string;
      onChange: (value: string) => void;
  };
  
  const ThemeOption: React.FC<ThemeOptionProps> = ({ label, value, currentTheme, onChange }) => (
      <label className="flex items-center justify-between p-4 rounded-lg border border-light-border dark:border-brand-light/20 cursor-pointer transition-all hover:bg-light-hover dark:hover:bg-brand-light/10">
          <span className="font-semibold">{label}</span>
          <input
              type="radio"
              name="theme"
              value={value}
              checked={currentTheme === value}
              onChange={() => onChange(value)}
              className="form-radio h-5 w-5 text-brand-accent-purple bg-light-bg dark:bg-brand-dark border-light-border dark:border-brand-light focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
          />
      </label>
  );
  
  
  const NotificationsSection: React.FC = () => {
      const [emailNotifications, setEmailNotifications] = useState({
          blasts: true,
          updates: true,
          security: true,
      });
  
      const handleToggle = (key: keyof typeof emailNotifications) => {
          setEmailNotifications(prev => ({ ...prev, [key]: !prev[key] }));
          // API call to save preferences would go here
      };
  
      return (
          <div className="animate-fade-in-fast">
              <h2 className="text-xl font-bold font-title mb-6">Notifications</h2>
              <p className="text-light-text-secondary dark:text-brand-text-secondary mb-6">
                  Manage how we contact you.
              </p>
              <div className="space-y-4 max-w-lg">
                  <NotificationToggle
                      label="Successful Blasts"
                      description="Receive an email summary after a blast is successfully sent."
                      isEnabled={emailNotifications.blasts}
                      onToggle={() => handleToggle('blasts')}
                  />
                  <NotificationToggle
                      label="Product Updates"
                      description="Get notified about new features, tutorials, and updates."
                      isEnabled={emailNotifications.updates}
                      onToggle={() => handleToggle('updates')}
                  />
                  <NotificationToggle
                      label="Security Alerts"
                      description="Receive alerts for suspicious activity or important account changes."
                      isEnabled={emailNotifications.security}
                      onToggle={() => handleToggle('security')}
                  />
              </div>
          </div>
      );
  };
  
  type NotificationToggleProps = {
      label: string;
      description: string;
      isEnabled: boolean;
      onToggle: () => void;
  };
  
  const NotificationToggle: React.FC<NotificationToggleProps> = ({ label, description, isEnabled, onToggle }) => (
      <div className="flex items-start justify-between p-4 rounded-lg border border-transparent hover:bg-light-hover dark:hover:bg-brand-light/10">
          <div className="pr-4">
              <h3 className="font-semibold">{label}</h3>
              <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{description}</p>
          </div>
          <button
              onClick={onToggle}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent-purple dark:focus:ring-offset-brand-dark ${
                  isEnabled ? 'bg-brand-accent-purple' : 'bg-light-border dark:bg-brand-light/20'
              }`}
          >
              <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
          </button>
      </div>
  );
  
  
  const DeleteSection: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
  
    const handleDelete = () => {
      if (confirmText === 'DELETE') {
  
        // Close modal and maybe redirect or show a final message
        setIsModalOpen(false);
      }
    };
  
    return (
      <div className="animate-fade-in-fast">
        <h2 className="text-xl font-bold font-title text-red-600 dark:text-red-500 mb-4">Danger Zone</h2>
        <div className="p-6 border border-red-500/30 bg-red-500/5 rounded-lg">
          <h3 className="font-bold text-light-text dark:text-white">Delete Your Account</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700 transition text-sm"
          >
            Delete Account
          </button>
        </div>
  
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md p-8">
              <h2 className="text-2xl font-bold mb-4 text-center font-title text-red-500">Confirm Deletion</h2>
              <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">
                This is a permanent action. All your data, including templates, history, and settings, will be lost forever.
              </p>
              <p className="text-center text-sm text-light-text-secondary dark:text-brand-text-secondary mb-4">
                To confirm, please type "<strong>DELETE</strong>" in the box below.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full text-center bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-center space-x-4 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition px-8 py-2 rounded-lg border border-light-border dark:border-brand-light/20">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE'}
                  className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition disabled:bg-slate-400 dark:disabled:bg-brand-light/20 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
