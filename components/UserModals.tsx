import React, { useState } from 'react';
import { User } from '../types';
import { CloseIcon } from './common/Icons';

interface AddUserModalProps {
    onClose: () => void;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    isSidebarCollapsed: boolean;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, setUsers, isSidebarCollapsed }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User');
    const [error, setError] = useState<string | null>(null);

    const handleAddUser = async () => {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role }),
        });

        if (response.ok) {
            const newUser = await response.json();
            setUsers(prev => [...prev, newUser]);
            onClose();
        } else {
            const data = await response.json();
            setError(data.error || 'Failed to add user');
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">Add New User</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-sm text-light-text dark:text-brand-text">
                            <option value="User">User</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleAddUser} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save</button>
                </div>
            </div>
        </div>
    );
};

interface DeleteUserModalProps {
    user: User;
    onClose: () => void;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    isSidebarCollapsed: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, setUsers, isSidebarCollapsed }) => {
    const confirmDelete = async () => {
        const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
        if (response.ok) {
            setUsers(prev => prev.filter(u => u.id !== user.id));
            onClose();
        } else {
            alert('Failed to delete user.');
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-4 text-center font-title text-light-text dark:text-white">Confirm Deletion</h2>
                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">
                    Are you sure you want to delete the user "<strong>{user.username}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 mt-8">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition px-8 py-2 rounded-lg border border-light-border dark:border-brand-light/20">Cancel</button>
                    <button onClick={confirmDelete} className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
            </div>
        </div>
    );
};

interface ViewUserModalProps {
    user: User;
    onClose: () => void;
    isSidebarCollapsed: boolean;
}

export const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose, isSidebarCollapsed }) => {
    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-title text-light-text dark:text-white">User Details</h2>
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">
                        <CloseIcon />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">ID</label>
                        <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.id}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Username</label>
                        <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.username}</p>
                    </div>
                    {user.email && (
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email</label>
                            <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.email}</p>
                        </div>
                    )}
                    {user.firstName && (
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">First Name</label>
                            <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.firstName}</p>
                        </div>
                    )}
                    {user.lastName && (
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Last Name</label>
                            <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.lastName}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role</label>
                        <p className="text-light-text dark:text-white bg-light-bg dark:bg-brand-light/50 p-2 rounded-md">{user.role}</p>
                    </div>
                </div>
                <div className="flex justify-end mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Close</button>
                </div>
            </div>
        </div>
    );
};
