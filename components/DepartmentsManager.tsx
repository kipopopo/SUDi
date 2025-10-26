import React, { useMemo, useState } from 'react';
import { Department } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { AddDepartmentModal, EditDepartmentModal, DeleteDepartmentModal } from './DepartmentModals';

interface DepartmentsManagerProps {
  isSidebarCollapsed: boolean;
}

const DepartmentsManager: React.FC<DepartmentsManagerProps> = ({ isSidebarCollapsed }) => {
  const { departments, participants } = useData();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const departmentsWithCounts = useMemo(() => {
    if (!Array.isArray(departments)) {
      return [];
    }
    return departments.map(dept => ({
      ...dept,
      participantCount: participants.filter(p => p.departmentId === dept.id).length
    })).sort((a,b) => a.name.localeCompare(b.name));
  }, [departments, participants]);

  return (
    <>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold font-title dark:text-white">Manage Departments</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition self-end md:self-auto">
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
                    <button onClick={() => { setSelectedDepartment(dept); setIsEditModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                    <button onClick={() => { setSelectedDepartment(dept); setIsDeleteModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
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
                  <button onClick={() => { setSelectedDepartment(dept); setIsEditModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                  <button onClick={() => { setSelectedDepartment(dept); setIsDeleteModalOpen(true); }} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {isAddModalOpen && <AddDepartmentModal onClose={() => setIsAddModalOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}
      {isEditModalOpen && selectedDepartment && <EditDepartmentModal department={selectedDepartment} onClose={() => setIsEditModalOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}
      {isDeleteModalOpen && selectedDepartment && <DeleteDepartmentModal department={selectedDepartment} onClose={() => setIsDeleteModalOpen(false)} isSidebarCollapsed={isSidebarCollapsed} />}
    </>
  );
};

export default DepartmentsManager;
