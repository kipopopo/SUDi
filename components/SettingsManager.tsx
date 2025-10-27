import React, { useState, useEffect, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import { AppSettings, SenderProfile } from '../types';
import axios from 'axios';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, LinkIcon, ListOrderedIcon, ListUnorderedIcon, QuoteIcon, CheckCircleIcon, ImageIcon, HorizontalRuleIcon, UserIcon, LockIcon, BellIcon, BrushIcon, DangerIcon, UploadIcon, MailIcon, HistoryIcon, LoadingIcon } from './common/Icons';

import { useAuth } from '../contexts/AuthContext';
import { validatePassword } from '../utils/validation';

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
            <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`${editor.isActive('bold') ? 'is-active' : ''} dark:text-white`}><b>B</b></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`${editor.isActive('italic') ? 'is-active' : ''} dark:text-white`}><i>I</i></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${editor.isActive('underline') ? 'is-active' : ''} dark:text-white`}><u>U</u></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={`${editor.isActive('strike') ? 'is-active' : ''} dark:text-white`}><s>S</s></button>
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
    const { globalSettings, setGlobalSettings } = useSettings();
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
                return <EmailSettingsContent globalSettings={globalSettings || {}} setGlobalSettings={setGlobalSettings} />;
            case 'sender':
                return <SenderSetup />;
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
                <h1 className="text-3xl sm:text-4xl font-bold font-title dark:text-white">Settings</h1>
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

import SenderSetup from './SenderSetup';


// --- Sections ---

const EmailSettingsContent: React.FC<{ globalSettings: AppSettings; setGlobalSettings: React.Dispatch<React.SetStateAction<AppSettings>> }> = ({ globalSettings, setGlobalSettings }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(globalSettings || {});
    const [showSuccess, setShowSuccess] = useState(false);

    const headerEditor = useEditor({
        extensions: [
            StarterKit, Underline, Link, Image, TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Enter your global email header HTML here...' })
        ],
        content: globalSettings?.globalHeader || '',
    });

    const footerEditor = useEditor({
        extensions: [
            StarterKit, Underline, Link, Image, TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Enter your global email footer HTML here...' })
        ],
        content: globalSettings?.globalFooter || '',
    });



    const handleSave = () => {
        if (!headerEditor || !footerEditor) return;

        setGlobalSettings(prev => ({
            ...prev,
            globalHeader: headerEditor.getHTML(),
            globalFooter: footerEditor.getHTML(),
        }));

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
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
            <h1 className="text-3xl font-bold font-title mb-2 dark:text-white">Email Settings</h1>
            <p className="text-light-text-secondary dark:text-brand-text-secondary mb-8">Define a consistent header and footer for all outgoing emails to maintain brand identity.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div>
                        <label className="block text-xl font-bold font-title mb-4 dark:text-white">Global Email Header</label>
                        <div className="tiptap-wrapper rounded-md border border-light-border dark:border-brand-light">
                            <MenuBar editor={headerEditor} />
                            <EditorContent editor={headerEditor} className="w-full h-48 bg-light-bg dark:bg-brand-light/50 text-sm overflow-y-auto" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xl font-bold font-title mb-4 dark:text-white">Global Email Footer</label>
                        <div className="tiptap-wrapper rounded-md border border-light-border dark:border-brand-light">
                            <MenuBar editor={footerEditor} />
                            <EditorContent editor={footerEditor} className="w-full h-48 bg-light-bg dark:bg-brand-light/50 text-sm overflow-y-auto" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-title dark:text-white">Live Preview</h2>
                    <div className="bg-light-surface dark:bg-brand-dark rounded-lg p-1 border border-light-border dark:border-brand-light/20">
                        <div className="bg-slate-100 dark:bg-brand-darker rounded-lg p-4 h-[420px] overflow-y-auto">
                           <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalHeader }}
                                className="text-light-text dark:text-brand-text"
                                style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.6' }}
                            />
                            <div className="my-4 p-4 border-2 border-dashed border-slate-300 dark:border-brand-light/40 rounded-md text-center text-slate-400 dark:text-brand-text-secondary">
                                <p className="font-semibold text-sm">Your unique email content will appear here.</p>
                                <p className="text-xs">Hello &#123;name&#125;, this is a sample body...</p>
                            </div>
                            <div
                                dangerouslySetInnerHTML={{ __html: localSettings.globalFooter }}
                                className="text-light-text dark:text-brand-text"
                                style={{ fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.6' }}
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
    const auth = useAuth();
    const [firstName, setFirstName] = useState(auth?.user?.firstName || '');
    const [lastName, setLastName] = useState(auth?.user?.lastName || '');
    const [email, setEmail] = useState(auth?.user?.email || '');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        // NOTE: In a real app, this would make an API call to update user data.
        console.log('Profile updated:', { firstName, lastName, email });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };


    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold font-title dark:text-white">Profile Settings</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary mt-2">Manage your personal information and account security.</p>
            </div>
            
            <div className="space-y-12">
                {/* Personal Information */}
                <div className="bg-light-surface dark:bg-brand-dark/50 p-8 rounded-xl border border-light-border dark:border-brand-light/20">
                    <h2 className="text-xl font-bold font-title mb-6 dark:text-white">Personal Information</h2>
                    <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder={auth?.user?.firstName || ''}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder={auth?.user?.lastName || ''}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                                                            <input
                                                                id="email"
                                                                type="email"
                                                                placeholder={auth?.user?.email || ''}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                                                            />                        </div>
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


            </div>
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
      const validation = validatePassword(password);
      let score = 0;
      if (validation.length) score++;
      if (validation.uppercase) score++;
      if (validation.lowercase) score++;
      if (validation.number) score++;
      if (validation.special) score++;
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
      const validation = validatePassword(newPassword);
      if (!validation.length || !validation.uppercase || !validation.lowercase || !validation.number || !validation.special) {
          setPasswordError("Password does not meet the requirements. Please choose a stronger one.");
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
        <h2 className="text-xl font-bold font-title mb-2 dark:text-white">Password & Security</h2>
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
              <h2 className="text-xl font-bold font-title mb-6 dark:text-white">Appearance</h2>
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
          <span className="font-semibold dark:text-white">{label}</span>
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
              <h2 className="text-xl font-bold font-title mb-6 dark:text-white">Notifications</h2>
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
              <h3 className="font-semibold dark:text-white">{label}</h3>
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
              <h2 className="text-2xl font-bold mb-4 text-center font-title text-red-500 dark:text-red-400">Confirm Deletion</h2>
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
