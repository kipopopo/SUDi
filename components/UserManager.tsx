import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AddUserModal, DeleteUserModal, ViewUserModal } from './UserModals';
import { PlusIcon, DeleteIcon, ViewIcon } from './common/Icons';
import { useAuth } from '../contexts/AuthContext';

const UserManager: React.FC<{ isSidebarCollapsed: boolean }> = ({ isSidebarCollapsed }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
        };
        fetchUsers();
    }, []);

    return (
        <>
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-title dark:text-white">Manage Users</h1>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition">
                        <PlusIcon />
                        <span>Add User</span>
                    </button>
                </div>
                <div className="bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-light-bg dark:bg-brand-light/30">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">ID</th>
                                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Username</th>
                                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Role</th>
                                <th className="p-4 text-right text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t border-light-border dark:border-brand-light/20 hover:bg-light-bg/70 dark:hover:bg-brand-light/20 transition">
                                    <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{user.id}</td>
                                    <td className="p-4 font-semibold text-light-text dark:text-white">{user.username}</td>
                                    <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{user.role}</td>
                                    <td className="p-4 flex justify-end space-x-2">
                                        {currentUser?.role === 'SuperAdmin' && (
                                            <button onClick={() => { setSelectedUser(user); setIsViewModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-blue-500 dark:text-brand-text-secondary dark:hover:text-blue-500 transition">
                                                <ViewIcon />
                                            </button>
                                        )}
                                        <button onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition">
                                            <DeleteIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isAddModalOpen && <AddUserModal onClose={() => setIsAddModalOpen(false)} setUsers={setUsers} isSidebarCollapsed={isSidebarCollapsed} />}
            {isDeleteModalOpen && selectedUser && <DeleteUserModal user={selectedUser} onClose={() => setIsDeleteModalOpen(false)} setUsers={setUsers} isSidebarCollapsed={isSidebarCollapsed} />}
            {isViewModalOpen && selectedUser && <ViewUserModal user={selectedUser} onClose={() => setIsViewModalOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}
        </>
    );
};

export default UserManager;