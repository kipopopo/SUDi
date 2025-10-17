import EcardBackdropExplorer from '../components/EcardBackdropExplorer';
import { createPortal } from 'react-dom';
import React, { createContext, useState, useContext } from 'react';

interface ModalContextType {
    isExplorerOpen: boolean;
    openExplorer: (onSelect: (path: string) => void) => void;
    closeExplorer: () => void;
    onSelect?: (path: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [onSelect, setOnSelect] = useState<(path: string) => void>(() => () => {});

    const openExplorer = (onSelect: (path: string) => void) => {
        setOnSelect(() => onSelect);
        setIsExplorerOpen(true);
    };

    const closeExplorer = () => {
        setIsExplorerOpen(false);
    };

    return (
        <ModalContext.Provider value={{ isExplorerOpen, openExplorer, closeExplorer, onSelect }}>
            {children}
            {isExplorerOpen && createPortal(
                <EcardBackdropExplorer onClose={closeExplorer} onSelect={onSelect} />,
                document.getElementById('modal-root')!
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
