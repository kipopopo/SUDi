import React, { useState, useEffect, useCallback } from 'react';
import { Department } from '../types';
import { useData } from '../contexts/DataContext';
import { addDepartment, updateDepartment, deleteDepartment } from '../services/departmentService';

interface AddDepartmentModalProps {
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({ isSidebarCollapsed, onClose }) => {
    const { departments, setDepartments } = useData();
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [addError, setAddError] = useState<string | null>(null);

    const handleSaveNewDepartment = async () => {
        setAddError(null);
        const trimmedName = newDepartmentName.trim();

        if (!trimmedName) {
            setAddError('Department name cannot be empty.');
            return;
        }

        if (departments.some(d => d.name.toLowerCase() === trimmedName.toLowerCase())) {
            setAddError('A department with this name already exists.');
            return;
        }
        
        const newDepartment: Department = {
            id: `d${Date.now()}`,
            name: trimmedName,
        };

        try {
            const createdDept = await addDepartment(newDepartment);
            setDepartments(prev => [...prev, createdDept].sort((a, b) => a.name.localeCompare(b.name)));
            onClose();
        } catch (error) {
            setAddError('Failed to save department.');
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                    Add New Department
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="dept-name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department Name</label>
                        <input 
                            id="dept-name"
                            type="text" 
                            value={newDepartmentName} 
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="e.g., Finance"
                        />
                    </div>
                </div>

                {addError && <p className="text-red-500 text-sm mt-4 text-center">{addError}</p>}
                
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleSaveNewDepartment} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save</button>
                </div>
            </div>
        </div>
    );
};

interface EditDepartmentModalProps {
    department: Department;
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({ department, isSidebarCollapsed, onClose }) => {
    const { departments, setDepartments } = useData();
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (department) {
            setEditingDepartment(department);
        }
    }, [department]);

    const handleUpdateDepartment = async () => {
        if (!editingDepartment) return;
        setEditError(null);
        const trimmedName = editingDepartment.name.trim();

        if (!trimmedName) {
            setEditError('Department name cannot be empty.');
            return;
        }
        
        if (departments.some(d => d.id !== editingDepartment.id && d.name.toLowerCase() === trimmedName.toLowerCase())) {
            setEditError('A department with this name already exists.');
            return;
        }

        try {
            const updatedDept = await updateDepartment({ ...editingDepartment, name: trimmedName });
            setDepartments(prev => 
                prev.map(d => d.id === updatedDept.id ? updatedDept : d)
            );
            onClose();
        } catch (error) {
            setEditError('Failed to update department.');
        }
    };

    if (!editingDepartment) return null;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                    Edit Department
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-dept-name" className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department Name</label>
                        <input 
                            id="edit-dept-name"
                            type="text" 
                            value={editingDepartment.name} 
                            onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                </div>

                {editError && <p className="text-red-500 text-sm mt-4 text-center">{editError}</p>}
                
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleUpdateDepartment} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

interface DeleteDepartmentModalProps {
    department: Department;
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const DeleteDepartmentModal: React.FC<DeleteDepartmentModalProps> = ({ department, isSidebarCollapsed, onClose }) => {
    const { setDepartments } = useData();
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

    useEffect(() => {
        if (department) {
            setDepartmentToDelete(department);
        }
    }, [department]);

    const confirmDeleteDepartment = useCallback(async () => {
        if (!departmentToDelete) return;

        try {
            await deleteDepartment(departmentToDelete.id);
            setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
            onClose();
        } catch (error) {
            alert('Failed to delete department.');
        }
    }, [departmentToDelete, setDepartments, onClose]);

    if (!departmentToDelete) return null;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-4 text-center font-title text-light-text dark:text-white">
                    Confirm Deletion
                </h2>
                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">
                    Are you sure you want to delete the department "<strong>{departmentToDelete.name}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 mt-8">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition px-8 py-2 rounded-lg border border-light-border dark:border-brand-light/20">Cancel</button>
                    <button onClick={confirmDeleteDepartment} className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
            </div>
        </div>
    );
};