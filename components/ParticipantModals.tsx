import React, { useState, useEffect, useCallback } from 'react';
import { Participant } from '../types';
import { useData } from '../contexts/DataContext';
import { addParticipant, updateParticipant, deleteParticipant } from '../services/participantService';

interface AddParticipantModalProps {
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({ isSidebarCollapsed, onClose }) => {
    const { participants, setParticipants, departments } = useData();
    const [newParticipant, setNewParticipant] = useState<Omit<Participant, 'id'>>({ name: '', email: '', role: '', departmentId: departments[0]?.id || '', paEmail: '' });
    const [addError, setAddError] = useState<string | null>(null);

    const handleSaveParticipant = async () => {
        setAddError(null);
        const { name, email, departmentId, paEmail } = newParticipant;

        if (!name.trim() || !email.trim() || !departmentId) {
            setAddError('Name, email, and department are required.');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setAddError('Please enter a valid email address.');
            return;
        }

        if (paEmail && !/^\S+@\S+\.\S+$/.test(paEmail)) {
            setAddError('Please enter a valid PA email address or leave it empty.');
            return;
        }
        
        if (participants.some(p => p.email.toLowerCase() === email.trim().toLowerCase())) {
            setAddError('A participant with this email already exists.');
            return;
        }

        const participantToAdd: Omit<Participant, 'id'> = {
            name: name.trim(),
            email: email.trim(),
            role: newParticipant.role.trim() || 'N/A',
            departmentId: departmentId,
            paEmail: paEmail.trim() || undefined,
        };
        
        try {
          const createdParticipant = await addParticipant({ ...participantToAdd, id: `p${Date.now()}` });
          setParticipants(prev => [createdParticipant, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
          onClose();
        } catch (error) {
          setAddError('Failed to save participant.');
        }
    };

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg max-w-full p-8 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                    Add New Participant
                </h2>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
                        <input 
                            type="text" name="name" value={newParticipant.name} onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                        <input 
                            type="email" name="email" value={newParticipant.email} onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="john.doe@example.com"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role / Position</label>
                        <input 
                            type="text" name="role" value={newParticipant.role} onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="e.g., Software Engineer"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department</label>
                        <select
                          name="departmentId"
                          value={newParticipant.departmentId}
                          onChange={(e) => setNewParticipant(prev => ({ ...prev, departmentId: e.target.value }))}
                          disabled={departments.length === 0}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent disabled:opacity-50 text-sm text-light-text dark:text-brand-text"
                        >
                            {departments.length > 0 ? (
                              departments.map(dept => (
                                  <option key={dept.id} value={dept.id} className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">{dept.name}</option>
                              ))
                            ) : (
                              <option value="" className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">Please add a department first</option>
                            )}
                        </select>
                    </div>
                     <div>
                          <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">PA's Email (Optional)</label>
                          <input 
                              type="email" name="paEmail" value={newParticipant.paEmail} onChange={(e) => setNewParticipant(prev => ({ ...prev, paEmail: e.target.value }))}
                              className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                              placeholder="pa.assist@example.com"
                          />
                      </div>
                </div>

                {addError && <p className="text-red-500 text-sm mt-4 text-center">{addError}</p>}
                
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleSaveParticipant} disabled={departments.length === 0} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:cursor-not-allowed">Save Participant</button>
                </div>
            </div>
        </div>
    );
};

interface EditParticipantModalProps {
    participant: Participant;
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const EditParticipantModal: React.FC<EditParticipantModalProps> = ({ participant, isSidebarCollapsed, onClose }) => {
    const { participants, setParticipants, departments } = useData();
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (participant) {
            setEditingParticipant(participant);
        }
    }, [participant]);

    const handleUpdateParticipant = async () => {
        if (!editingParticipant) return;
        setEditError(null);
        const { name, email, departmentId, paEmail } = editingParticipant;

        if (!name.trim() || !email.trim() || !departmentId) {
            setEditError('Name, email, and department are required.');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setEditError('Please enter a valid email address.');
            return;
        }
        
        if (paEmail && !/^\S+@\S+\.\S+$/.test(paEmail)) {
            setEditError('Please enter a valid PA email address or leave it empty.');
            return;
        }
        
        if (participants.some(p => p.id !== editingParticipant.id && p.email.toLowerCase() === email.trim().toLowerCase())) {
            setEditError('A participant with this email already exists.');
            return;
        }

        const participantToUpdate: Participant = {
            ...editingParticipant,
            name: name.trim(),
            email: email.trim(),
            role: editingParticipant.role.trim() || 'N/A',
            paEmail: paEmail?.trim() || undefined,
        };
        
        try {
          const updatedParticipant = await updateParticipant(participantToUpdate);
          setParticipants(prev => prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p));
          onClose();
        } catch (error) {
          setEditError('Failed to update participant.');
        }
    };

    if (!editingParticipant) return null;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg max-w-full p-8 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                    Edit Participant
                </h2>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
                        <input 
                            type="text" name="name" value={editingParticipant.name} onChange={(e) => setEditingParticipant(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                        <input 
                            type="email" name="email" value={editingParticipant.email} onChange={(e) => setEditingParticipant(prev => prev ? { ...prev, email: e.target.value } : null)}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role / Position</label>
                        <input 
                            type="text" name="role" value={editingParticipant.role} onChange={(e) => setEditingParticipant(prev => prev ? { ...prev, role: e.target.value } : null)}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department</label>
                        <select
                          name="departmentId"
                          value={editingParticipant.departmentId}
                          onChange={(e) => setEditingParticipant(prev => prev ? { ...prev, departmentId: e.target.value } : null)}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent text-sm text-light-text dark:text-brand-text"
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id} className="bg-light-surface dark:bg-brand-dark text-light-text dark:text-brand-text">{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">PA's Email (Optional)</label>
                          <input 
                              type="email" name="paEmail" value={editingParticipant.paEmail || ''} onChange={(e) => setEditingParticipant(prev => prev ? { ...prev, paEmail: e.target.value } : null)}
                              className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                              placeholder="pa.assist@example.com"
                          />
                      </div>
                </div>

                {editError && <p className="text-red-500 text-sm mt-4 text-center">{editError}</p>}
                
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleUpdateParticipant} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

interface DeleteParticipantModalProps {
    participant: Participant;
    isSidebarCollapsed: boolean;
    onClose: () => void;
}

export const DeleteParticipantModal: React.FC<DeleteParticipantModalProps> = ({ participant, isSidebarCollapsed, onClose }) => {
    const { setParticipants } = useData();
    const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

    useEffect(() => {
        if (participant) {
            setParticipantToDelete(participant);
        }
    }, [participant]);

    const confirmDeleteParticipant = useCallback(async () => {
        if (!participantToDelete) return;

        try {
          await deleteParticipant(participantToDelete.id);
          setParticipants(prev => prev.filter(p => p.id !== participantToDelete.id));
          onClose();
        } catch (error) {
          alert('Failed to delete participant.');
        }
    }, [participantToDelete, setParticipants, onClose]);

    if (!participantToDelete) return null;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in px-8 py-4 ${isSidebarCollapsed ? 'lg:pl-[calc(5rem+2rem)]' : 'lg:pl-[calc(16rem+2rem)]'}`}>
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md max-w-full p-8">
                <h2 className="text-2xl font-bold mb-4 text-center font-title text-light-text dark:text-white">
                    Confirm Deletion
                </h2>
                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">
                    Are you sure you want to delete the participant "<strong>{participantToDelete.name}</strong>"? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4 mt-8">
                    <button onClick={onClose} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition px-8 py-2 rounded-lg border border-light-border dark:border-brand-light/20">Cancel</button>
                    <button onClick={confirmDeleteParticipant} className="bg-red-600 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
            </div>
        </div>
    );
};