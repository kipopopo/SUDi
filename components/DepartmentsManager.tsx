
import React, { useMemo, useState, useCallback } from 'react';
import { Department, Participant } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icons';

interface DepartmentsManagerProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  participants: Participant[];
}

/**
 * Renders the department management view.
 * This component displays a list of departments in a table, allowing for
 * viewing, adding, editing, and deleting departments. The participant count
 * is calculated dynamically based on the shared participants state.
 * @param {DepartmentsManagerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered departments manager component.
 */
export const DepartmentsManager: React.FC<DepartmentsManagerProps> = ({ departments, setDepartments, participants }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // State for adding a new department
  const [isAdding, setIsAdding] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // State for editing an existing department
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editError, setEditError] = useState<string | null>(null);


  /**
   * Memoized calculation to pair each department with its dynamic participant count.
   * This ensures the count is always up-to-date and avoids recalculation on every render
   * unless the underlying departments or participants data changes.
   * @returns {{id: string, name: string, participantCount: number}[]} An array of department objects with their calculated counts.
   */
  const departmentsWithCounts = useMemo(() => {
    return departments.map(dept => ({
      ...dept,
      participantCount: participants.filter(p => p.departmentId === dept.id).length
    })).sort((a,b) => a.name.localeCompare(b.name));
  }, [departments, participants]);

  /**
   * Closes the 'Add Department' modal and resets its form state.
   */
  const handleCloseAddModal = () => {
    setIsAdding(false);
    setNewDepartmentName('');
    setAddError(null);
  };
  
  /**
   * Handles saving a new department.
   * Performs validation and updates the application's state if successful.
   */
  const handleSaveNewDepartment = () => {
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

    // ================================================================
    // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
    // ================================================================
    // This `setDepartments` call directly manipulates the client-side state.
    // In a production application, you would replace this with an API call
    // to your backend to create a new department in the database.
    //
    // Example:
    // createDepartmentAPI(newDepartment).then(createdDept => {
    //   setDepartments(prev => [...prev, createdDept].sort((a, b) => a.name.localeCompare(b.name)));
    // });
    //
    // Similarly, update and delete operations should also be API calls.
    // ================================================================
    setDepartments(prev => [...prev, newDepartment]);
    handleCloseAddModal();
  };

  /**
   * Opens the edit modal and sets the current department to be edited.
   * @param {Department} department - The department to edit.
   */
  const handleEditClick = (department: Department) => {
    setEditingDepartment({ ...department });
    setEditError(null);
  };

  /**
   * Closes the edit modal and resets its state.
   */
  const handleCloseEditModal = () => {
    setEditingDepartment(null);
    setEditError(null);
  };

  /**
   * Handles updating an existing department's details.
   */
  const handleUpdateDepartment = () => {
    if (!editingDepartment) return;
    setEditError(null);
    const trimmedName = editingDepartment.name.trim();

    if (!trimmedName) {
      setEditError('Department name cannot be empty.');
      return;
    }
    
    // Check for duplicates, excluding the current department being edited
    if (departments.some(d => d.id !== editingDepartment.id && d.name.toLowerCase() === trimmedName.toLowerCase())) {
      setEditError('A department with this name already exists.');
      return;
    }

    setDepartments(prev => 
      prev.map(d => d.id === editingDepartment.id ? { ...d, name: trimmedName } : d)
    );
    handleCloseEditModal();
  };


  /**
   * Handles the deletion of a department.
   * It shows a confirmation dialog, then sets the deleting state to trigger a fade-out animation,
   * and finally removes the department from the state after the animation completes.
   * @param {string} id - The ID of the department to delete.
   */
  const handleDeleteDepartment = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
        // ================================================================
        // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
        // ================================================================
        // This `setTimeout` and `setDepartments` is for client-side state
        // management and animation. In production, you would first make an
        // API call to delete the item from the database.
        //
        // Example:
        // deleteDepartmentAPI(id).then(() => {
        //   setDeletingId(id);
        //   setTimeout(() => {
        //     setDepartments(prev => prev.filter(d => d.id !== id));
        //     setDeletingId(null);
        //   }, 300);
        // });
        // ================================================================
        setDeletingId(id);
        setTimeout(() => {
            setDepartments(prev => prev.filter(d => d.id !== id));
            // Note: In a real app, you would also need to handle participants associated with this department.
            // For now, we'll leave them, but they'll be unassigned.
            setDeletingId(null);
        }, 300); // Corresponds to animation duration
    }
  }, [setDepartments]);


  return (
    <>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold font-title">Manage Departments</h1>
          <button onClick={() => setIsAdding(true)} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition self-end md:self-auto">
            <PlusIcon />
            <span>Add Department</span>
          </button>
        </div>
        
        {/* Table for larger screens */}
        <div className="hidden lg:block bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-light-bg dark:bg-brand-light/30">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Department Name</th>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Participants</th>
                <th className="p-4 text-right text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departmentsWithCounts.map((dept) => (
                <tr key={dept.id} className={`border-t border-light-border dark:border-brand-light/20 hover:bg-light-bg/70 dark:hover:bg-brand-light/20 transition-opacity duration-300 ${deletingId === dept.id ? 'opacity-0' : ''}`}>
                  <td className="p-4 font-semibold text-light-text dark:text-white">{dept.name}</td>
                  <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{dept.participantCount}</td>
                  <td className="p-4 flex justify-end space-x-2">
                    <button onClick={() => handleEditClick(dept)} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                    <button onClick={() => handleDeleteDepartment(dept.id)} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards for smaller screens */}
        <div className="lg:hidden space-y-4">
          {departmentsWithCounts.map((dept) => (
            <div key={dept.id} className={`bg-light-surface dark:bg-brand-dark/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 transition-opacity duration-300 ${deletingId === dept.id ? 'opacity-0' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-light-text dark:text-white">{dept.name}</h3>
                  <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{dept.participantCount} Participants</p>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <button onClick={() => handleEditClick(dept)} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                  <button onClick={() => handleDeleteDepartment(dept.id)} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {/* Add Department Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md p-8">
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
                <button onClick={handleCloseAddModal} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                <button onClick={handleSaveNewDepartment} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDepartment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-md p-8">
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
                <button onClick={handleCloseEditModal} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                <button onClick={handleUpdateDepartment} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
