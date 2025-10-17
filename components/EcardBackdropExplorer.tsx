import React, { useState, useEffect } from 'react';
import { CloseIcon, FolderIcon, UploadIcon } from './common/Icons';

interface EcardBackdropExplorerProps {
    onClose: () => void;
    onSelect: (path: string) => void;
}

const EcardBackdropExplorer: React.FC<EcardBackdropExplorerProps> = ({ onClose, onSelect }) => {
    const [files, setFiles] = useState<string[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState('/');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('ecardBackdrop', file);
            fetch(`/api/upload-ecard-backdrop?path=${currentPath}`, {
                method: 'POST',
                body: formData
            }).then(() => {
                // Refetch files and folders
                fetch(`/api/ecard-backdrops?path=${currentPath}`)
                    .then(res => res.json())
                    .then(data => {
                        setFiles(data.files);
                        setFolders(data.folders);
                    });
            });
        }
    };

    useEffect(() => {
        fetch(`/api/ecard-backdrops?path=${currentPath}`)
            .then(res => res.json())
            .then(data => {
                setFiles(data.files);
                setFolders(data.folders);
            });
    }, [currentPath]);

    const handleFolderClick = (folder: string) => {
        setCurrentPath(currentPath === '/' ? `/${folder}` : `${currentPath}/${folder}`);
    };

    const handleBackClick = () => {
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        setCurrentPath(parentPath === '' ? '/' : parentPath);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-title dark:text-white">E-card Backdrop Explorer</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-light/50"><CloseIcon /></button>
                </div>
                <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentPath !== '/' && (
                        <div onClick={handleBackClick} className="flex flex-col items-center justify-center p-4 border border-light-border dark:border-brand-light/20 rounded-lg hover:bg-light-hover dark:hover:bg-brand-light/10 cursor-pointer">
                            <FolderIcon className="w-16 h-16 text-light-text-secondary dark:text-brand-text-secondary" />
                            <span className="mt-2 text-sm font-medium text-center">..</span>
                        </div>
                    )}
                    {folders.map(folder => (
                        <div key={folder} onClick={() => handleFolderClick(folder)} className="flex flex-col items-center justify-center p-4 border border-light-border dark:border-brand-light/20 rounded-lg hover:bg-light-hover dark:hover:bg-brand-light/10 cursor-pointer">
                            <FolderIcon className="w-16 h-16 text-light-text-secondary dark:text-brand-text-secondary" />
                            <span className="mt-2 text-sm font-medium text-center">{folder}</span>
                        </div>
                    ))}
                    {files.map(file => (
                        <div key={file} onClick={() => onSelect(`/uploads${currentPath === '/' ? '/' : currentPath + '/'}${file}`)} className="border border-light-border dark:border-brand-light/20 rounded-lg overflow-hidden hover:border-brand-accent-purple dark:hover:border-brand-accent cursor-pointer">
                            <img src={`/api/ecard-backdrop${currentPath === '/' ? '/' : currentPath + '/'}${file}`} alt={file} className="w-full h-32 object-cover" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-4 mt-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition">
                        <UploadIcon />
                        <span>Upload</span>
                    </button>
                    <button onClick={() => {
                        const folderName = prompt('Enter folder name:');
                        if (folderName) {
                            fetch(`/api/ecard-backdrops/folders?path=${currentPath}`,
                             {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ folderName })
                            }).then(() => {
                                // Refetch files and folders
                                fetch(`/api/ecard-backdrops?path=${currentPath}`)
                                    .then(res => res.json())
                                    .then(data => {
                                        setFiles(data.files);
                                        setFolders(data.folders);
                                    });
                            });
                        }
                    }} className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition">
                        <FolderIcon />
                        <span>Create Folder</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EcardBackdropExplorer;
