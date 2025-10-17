import React from 'react';

interface TutorialModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  isSidebarCollapsed: boolean;
}

/**
 * A reusable modal component for displaying tutorial or help content.
 * It provides a consistent layout with a title, scrollable content area, and a close button.
 * @param {TutorialModalProps} props - The props for the component.
 * @param {string} props.title - The title to be displayed at the top of the modal.
 * @param {() => void} props.onClose - The function to call when the modal should be closed.
 * @param {React.ReactNode} props.children - The content to be displayed within the modal.
 * @returns {React.ReactElement} The rendered tutorial modal component.
 */
export const TutorialModal: React.FC<TutorialModalProps> = ({ title, onClose, children, isSidebarCollapsed }) => {
  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}
      onClick={onClose} // Allows closing the modal by clicking the background overlay.
    >
      <div 
        className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-2xl max-w-full p-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal from closing it.
      >
        <h2 className="text-2xl font-bold mb-6 text-brand-accent-purple dark:text-brand-accent font-title">
          {title}
        </h2>
        
        <div className="flex-grow overflow-y-auto pr-4 space-y-6 text-light-text-secondary dark:text-brand-text-secondary leading-relaxed">
          {children}
        </div>
        
        <div className="flex justify-end mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
          <button onClick={onClose} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};