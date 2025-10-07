import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Participant, Department, AiUsage } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, UploadIcon, HelpIcon, AIIcon, LoadingIcon, SortUpIcon, SortDownIcon } from './common/Icons';
import { TutorialModal } from './common/TutorialModal';
import { suggestPaEmailsForParticipants } from '../services/geminiService';

interface ParticipantsManagerProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  departments: Department[];
  isSubscribed: boolean;
  aiUsage: AiUsage;
  refreshAiUsage: () => void;
  promptSubscription: () => void;
}

type SortKey = keyof Omit<Participant, 'departmentId'> | 'departmentName';
interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

/**
 * Renders the participant management view.
 * This component handles displaying, filtering, sorting, and importing participants.
 * It receives participant data and update functions via props to interact with the centralized state.
 * @param {ParticipantsManagerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered participants manager component.
 */
export const ParticipantsManager: React.FC<ParticipantsManagerProps> = ({ participants, setParticipants, departments, isSubscribed, aiUsage, refreshAiUsage, promptSubscription }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isScanningForPAs, setIsScanningForPAs] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  
  // State for adding participant
  const [isAdding, setIsAdding] = useState(false);
  const getInitialNewParticipantState = useCallback(() => ({
      name: '',
      email: '',
      role: '',
      departmentId: departments[0]?.id || '',
      paEmail: '',
  }), [departments]);
  const [newParticipant, setNewParticipant] = useState<Omit<Participant, 'id'>>(getInitialNewParticipantState());
  const [addError, setAddError] = useState<string | null>(null);
  
  // State for editing participant
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // State for AI PA email assignment modal
  const [isPaModalOpen, setIsPaModalOpen] = useState(false);
  const [participantsForPaUpdate, setParticipantsForPaUpdate] = useState<Participant[]>([]);
  const [paEmailInputs, setPaEmailInputs] = useState<Record<string, string>>({});

  const isAiDisabled = !isSubscribed && aiUsage.isExceeded;

  const departmentMap = useMemo(() => 
    new Map(departments.map(d => [d.id, d.name])),
  [departments]);


  /**
   * Memoized calculation of participants to display based on current filters and sorting.
   * This filters and then sorts the main `participants` list.
   * `useMemo` prevents recalculation on every render unless dependencies change.
   * @returns {Participant[]} The array of participants that match the filter and sort criteria.
   */
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(p => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const matchesDepartment = selectedDepartment === 'all' || p.departmentId === selectedDepartment;
        const matchesSearch = searchTerm.trim() === '' ||
            p.name.toLowerCase().includes(lowercasedTerm) ||
            p.email.toLowerCase().includes(lowercasedTerm) ||
            p.role.toLowerCase().includes(lowercasedTerm);
        return matchesDepartment && matchesSearch;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        if (sortConfig.key === 'departmentName') {
          const aDept = departmentMap.get(a.departmentId) || '';
          const bDept = departmentMap.get(b.departmentId) || '';
          comparison = aDept.localeCompare(bDept, undefined, { sensitivity: 'base' });
        } else {
          // handles 'name', 'email', 'role', 'paEmail'
          const key = sortConfig.key as keyof Participant;
          const valA = a[key] ?? '';
          const valB = b[key] ?? '';
          comparison = String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' });
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [participants, searchTerm, selectedDepartment, sortConfig, departmentMap]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="w-4 h-4 opacity-0 group-hover:opacity-50"></span>
    }
    return sortConfig.direction === 'ascending' ? <SortUpIcon /> : <SortDownIcon />;
  };

  /**
   * Handles the click event for the "Import CSV" button.
   * It programmatically triggers a click on the hidden file input element.
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles the file selection event from the file input.
   * It reads the selected CSV file, parses its content, validates the data,
   * and adds new participants to the central state. It also provides user feedback
   * on the import status (success or error).
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setImportMessage({ type: 'error', text: 'File is empty or could not be read.' });
        return;
      }
      
      try {
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error("CSV must contain a header and at least one data row.");
        }

        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const nameIndex = header.indexOf('name');
        const emailIndex = header.indexOf('email');
        const roleIndex = header.indexOf('role');
        const departmentNameIndex = header.indexOf('departmentname');
        const paEmailIndex = header.indexOf('paemail');

        if ([nameIndex, emailIndex, departmentNameIndex].includes(-1)) {
            throw new Error("CSV header is invalid. It must contain columns named: name, email, departmentName.");
        }

        let importedCount = 0;
        let skippedCount = 0;
        const newParticipants: Participant[] = [];

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          const name = data[nameIndex]?.trim();
          const email = data[emailIndex]?.trim();
          const role = data[roleIndex]?.trim();
          const departmentName = data[departmentNameIndex]?.trim();
          const paEmail = paEmailIndex !== -1 ? data[paEmailIndex]?.trim() : undefined;
          
          if (!name || !email || !departmentName) {
            skippedCount++;
            continue;
          }
          
          const department = departments.find(d => d.name.toLowerCase() === departmentName.toLowerCase());

          if (!department) {
            skippedCount++;
            continue;
          }
          
          newParticipants.push({
            id: `p_${Date.now()}_${i}`,
            name,
            email,
            role: role || 'N/A',
            departmentId: department.id,
            paEmail: paEmail || undefined,
          });
          importedCount++;
        }
        
        setParticipants(prev => [...prev, ...newParticipants]);
        let message = `Successfully imported ${importedCount} participants.`;
        if (skippedCount > 0) {
            message += ` ${skippedCount} rows were skipped due to missing data or invalid department.`;
        }
        setImportMessage({ type: 'success', text: message });

      } catch (error: any) {
        setImportMessage({ type: 'error', text: error.message || "Failed to parse CSV file." });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        setImportMessage({ type: 'error', text: 'Error reading file.' });
    };
    reader.readAsText(file);
  };
  
  /**
   * Handles the deletion of a participant.
   * It shows a confirmation dialog, then sets the deleting state to trigger a fade-out animation,
   * and finally removes the participant from the state after the animation completes.
   * @param {string} id - The ID of the participant to delete.
   */
  const handleDeleteParticipant = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this participant?')) {
        // ================================================================
        // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
        // ================================================================
        // This logic is for client-side state management. In production,
        // you would first make an API call to delete the participant
        // from the database before updating the UI state.
        //
        // Example:
        // deleteParticipantAPI(id).then(() => {
        //   setDeletingId(id);
        //   setTimeout(() => {
        //     setParticipants(prev => prev.filter(p => p.id !== id));
        //     setDeletingId(null);
        //   }, 300);
        // });
        // ================================================================
        setDeletingId(id);
        setTimeout(() => {
            setParticipants(prev => prev.filter(p => p.id !== id));
            setDeletingId(null);
        }, 300); // Corresponds to animation duration
    }
  }, [setParticipants]);

  const handleAddParticipantClick = () => {
    setAddError(null);
    setNewParticipant(getInitialNewParticipantState());
    setIsAdding(true);
  };
  
  const handleCloseAddModal = () => {
    setIsAdding(false);
  };

  const handleNewParticipantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewParticipant(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveParticipant = () => {
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

    const participantToAdd: Participant = {
        id: `p${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: newParticipant.role.trim() || 'N/A',
        departmentId: departmentId,
        paEmail: paEmail.trim() || undefined,
    };
    
    // ================================================================
    // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
    // ================================================================
    // This `setParticipants` call directly manipulates client-side state.
    // In a real application, you would replace this with an API call to
    // your backend to create a new participant in the database.
    //
    // Example:
    // createParticipantAPI(participantToAdd).then(createdParticipant => {
    //   setParticipants(prev => [createdParticipant, ...prev].sort(...));
    // });
    // ================================================================
    setParticipants(prev => [participantToAdd, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    handleCloseAddModal();
  };
  
  const handleEditClick = (participant: Participant) => {
    setEditingParticipant({ ...participant });
    setEditError(null);
  };
  
  const handleCloseEditModal = () => {
    setEditingParticipant(null);
    setEditError(null);
  };

  const handleEditParticipantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingParticipant) return;
    const { name, value } = e.target;
    setEditingParticipant(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleUpdateParticipant = () => {
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
    
    // Check for email duplicates, excluding the current participant
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
    
    // ================================================================
    // NOTE FOR DEPLOYMENT OUTSIDE GOOGLE AI STUDIO
    // ================================================================
    // This `setParticipants` call directly manipulates client-side state.
    // In a real application, you would replace this with an API call to
    // your backend to update the participant in the database.
    // ================================================================
    setParticipants(prev => prev.map(p => p.id === participantToUpdate.id ? participantToUpdate : p));
    handleCloseEditModal();
  };

  const handleAiScan = async () => {
    if (isAiDisabled) {
        promptSubscription();
        return;
    }

    setIsScanningForPAs(true);
    setImportMessage({ type: 'success', text: 'AI is analyzing participant roles... This may take a moment.' });
    try {
        const suggestions = await suggestPaEmailsForParticipants(participants);
        refreshAiUsage();
        if (suggestions.length === 0) {
            setImportMessage({ type: 'success', text: 'AI analysis complete. No participants were identified as needing a PA.' });
            return;
        }

        const suggestedIds = new Set(suggestions.map(s => s.id));
        const participantsToUpdate = participants.filter(p => suggestedIds.has(p.id));
        
        setParticipantsForPaUpdate(participantsToUpdate);
        
        const initialInputs = participantsToUpdate.reduce((acc, p) => {
            acc[p.id] = p.paEmail || '';
            return acc;
        }, {} as Record<string, string>);
        setPaEmailInputs(initialInputs);

        setIsPaModalOpen(true);
        setImportMessage({ type: 'success', text: `AI has identified ${suggestions.length} participants who may have a PA. Please review and assign their PA's email.` });

    } catch (error: any) {
        setImportMessage({ type: 'error', text: error.message || 'An unknown error occurred during the AI scan.' });
    } finally {
        setIsScanningForPAs(false);
    }
  };

  const handlePaInputChange = (participantId: string, value: string) => {
    setPaEmailInputs(prev => ({ ...prev, [participantId]: value }));
  };

  const handleSavePaEmails = () => {
      setParticipants(prevParticipants => 
          prevParticipants.map(p => 
              paEmailInputs.hasOwnProperty(p.id) 
                  ? { ...p, paEmail: paEmailInputs[p.id].trim() || undefined } 
                  : p
          )
      );
      setIsPaModalOpen(false);
      setParticipantsForPaUpdate([]);
      setPaEmailInputs({});
      setImportMessage({ type: 'success', text: `PA emails updated successfully.` });
  };


  return (
    <>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
          <h1 className="text-3xl font-bold font-title">Manage Participants</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setIsTutorialOpen(true)}
                className="text-light-text-secondary dark:text-brand-text-secondary hover:text-brand-accent-purple dark:hover:text-brand-accent transition p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-light/50 self-end"
                title="CSV Import Help"
              >
                  <HelpIcon />
              </button>
              <button
                onClick={handleAiScan}
                disabled={isScanningForPAs || participants.length === 0 || isAiDisabled}
                className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:cursor-not-allowed"
                title={isAiDisabled ? "Daily AI limit reached. Upgrade to Pro for unlimited use." : "Use AI to find participants who might have a PA"}
            >
                {isScanningForPAs ? <LoadingIcon /> : <AIIcon />}
                <span>AI Scan</span>
            </button>
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <button 
                  onClick={handleImportClick}
                  className="bg-brand-accent-purple text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                  <UploadIcon />
                  <span>Import</span>
                </button>
              <button onClick={handleAddParticipantClick} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 transition">
                <PlusIcon />
                <span>Add New</span>
              </button>
          </div>
        </div>
        
        {importMessage && (
          <div className={`p-3 rounded-md mb-4 text-sm ${
              importMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
          }`}>
              {importMessage.text}
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow">
                <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-light-surface dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent placeholder-light-text-secondary dark:placeholder-brand-text-secondary"
                />
            </div>
            <div className="w-full md:w-1/3">
                <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full bg-light-surface dark:bg-brand-light/50 p-3 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
            </div>
        </div>
        
        {/* Table for larger screens */}
        <div className="hidden lg:block bg-light-surface dark:bg-brand-dark/50 backdrop-blur-sm border border-light-border dark:border-brand-light/20 rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-light-bg dark:bg-brand-light/30">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  <button onClick={() => requestSort('name')} className="flex items-center space-x-1 group">
                    <span>Name</span>
                    {getSortIndicator('name')}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  <button onClick={() => requestSort('email')} className="flex items-center space-x-1 group">
                    <span>Email</span>
                    {getSortIndicator('email')}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  <button onClick={() => requestSort('role')} className="flex items-center space-x-1 group">
                    <span>Role</span>
                    {getSortIndicator('role')}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  <button onClick={() => requestSort('departmentName')} className="flex items-center space-x-1 group">
                    <span>Department</span>
                    {getSortIndicator('departmentName')}
                  </button>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  <button onClick={() => requestSort('paEmail')} className="flex items-center space-x-1 group">
                    <span>PA's Email</span>
                    {getSortIndicator('paEmail')}
                  </button>
                </th>
                <th className="p-4 text-right text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((p) => (
                  <tr key={p.id} className={`border-t border-light-border dark:border-brand-light/20 hover:bg-light-bg/70 dark:hover:bg-brand-light/20 transition-opacity duration-300 ${deletingId === p.id ? 'opacity-0' : ''}`}>
                      <td className="p-4 font-semibold text-light-text dark:text-white">{p.name}</td>
                      <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{p.email}</td>
                      <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{p.role}</td>
                      <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{departmentMap.get(p.departmentId) || 'N/A'}</td>
                      <td className="p-4 text-light-text-secondary dark:text-brand-text-secondary">{p.paEmail || '—'}</td>
                      <td className="p-4 flex justify-end space-x-2">
                        <button onClick={() => handleEditClick(p)} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                        <button onClick={() => handleDeleteParticipant(p.id)} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                      </td>
                  </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={6} className="text-center p-8 text-light-text-secondary dark:text-brand-text-secondary">
                          No participants found matching your criteria.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards for smaller screens */}
        <div className="lg:hidden space-y-4">
            {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p) => (
                <div key={p.id} className={`bg-light-surface dark:bg-brand-dark/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 transition-opacity duration-300 ${deletingId === p.id ? 'opacity-0' : ''}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex-grow pr-4">
                            <p className="font-bold text-lg text-light-text dark:text-white">{p.name}</p>
                            <a href={`mailto:${p.email}`} className="text-sm text-brand-accent-purple dark:text-brand-accent break-all">{p.email}</a>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                             <button onClick={() => handleEditClick(p)} className="p-2 text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition"><EditIcon /></button>
                            <button onClick={() => handleDeleteParticipant(p.id)} className="p-2 text-light-text-secondary hover:text-red-500 dark:text-brand-text-secondary dark:hover:text-red-500 transition"><DeleteIcon /></button>
                        </div>
                    </div>
                    <div className="mt-4 border-t border-light-border dark:border-brand-light/20 pt-4 space-y-2 text-sm">
                        <p><span className="font-semibold w-24 inline-block text-light-text-secondary dark:text-brand-text-secondary">Role:</span> {p.role}</p>
                        <p><span className="font-semibold w-24 inline-block text-light-text-secondary dark:text-brand-text-secondary">Department:</span> {departmentMap.get(p.departmentId) || 'N/A'}</p>
                        <p><span className="font-semibold w-24 inline-block text-light-text-secondary dark:text-brand-text-secondary">PA's Email:</span> {p.paEmail || '—'}</p>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center p-8 text-light-text-secondary dark:text-brand-text-secondary bg-light-surface dark:bg-brand-dark/50 rounded-lg">
                    No participants found matching your criteria.
                </div>
            )}
        </div>

      </div>
      
      {isTutorialOpen && (
        <TutorialModal title="CSV Import Guide" onClose={() => setIsTutorialOpen(false)}>
          <div>
            <h3 className="text-lg font-semibold text-light-text dark:text-brand-text mb-2">How to Format Your CSV File</h3>
            <p>To successfully import participants, your CSV file must follow specific formatting rules. The file must be a <code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">.csv</code> file type.</p>
          </div>
          <div>
            <h4 className="font-semibold text-light-text dark:text-brand-text mb-2">Column Headers</h4>
            <p>The first row of your file must contain headers. The column order does not matter, but the header names must be correct (case-insensitive).</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">name</code> (Required): The full name of the participant.</li>
                <li><code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">email</code> (Required): The participant's email address.</li>
                <li><code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">departmentName</code> (Required): The name of the department. This <strong className="text-light-text dark:text-brand-text">must exactly match</strong> one of the existing department names in the system.</li>
                <li><code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">role</code> (Optional): The participant's role or job title. If left empty, it will default to "N/A".</li>
                <li><code className="bg-slate-200 dark:bg-brand-light/50 text-brand-accent-purple px-1 py-0.5 rounded text-sm">paemail</code> (Optional): The email address of the participant's Personal Assistant.</li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold text-light-text dark:text-brand-text mb-2">Example CSV Content</h4>
            <p>Here is an example of a valid CSV file:</p>
            <pre className="bg-slate-100 dark:bg-brand-darker border border-light-border dark:border-brand-light/30 rounded-md p-3 mt-2 text-sm whitespace-pre-wrap">
{`name,email,role,departmentName,paemail
Alice Wonder,alice@example.com,Lead Developer,Engineering,
Bob Builder,bob@example.com,Project Manager,Sales,pa.bob@example.com
Charlie Chaplin,charlie@example.com,,Marketing,assist.charlie@example.com`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-light-text dark:text-brand-text mb-2">Data Validation</h4>
            <p>The system will validate each row before importing:</p>
             <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong className="text-light-text dark:text-brand-text">Skipped Rows:</strong> A row will be skipped if the required fields (<code className="text-sm">name</code>, <code className="text-sm">email</code>, <code className="text-sm">departmentName</code>) are empty.</li>
                <li><strong className="text-light-text dark:text-brand-text">Invalid Department:</strong> A row will also be skipped if the value in <code className="text-sm">departmentName</code> does not match any existing department in the system.</li>
                <li>After the import, a message will inform you of how many participants were successfully added and how many rows were skipped.</li>
            </ul>
          </div>
        </TutorialModal>
      )}

      {/* Add Participant Modal */}
      {isAdding && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg p-8 max-h-[90vh] flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                  Add New Participant
              </h2>
              
              <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
                      <input 
                          type="text" name="name" value={newParticipant.name} onChange={handleNewParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                          placeholder="John Doe"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                      <input 
                          type="email" name="email" value={newParticipant.email} onChange={handleNewParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                          placeholder="john.doe@example.com"
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role / Position</label>
                      <input 
                          type="text" name="role" value={newParticipant.role} onChange={handleNewParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                          placeholder="e.g., Software Engineer"
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department</label>
                      <select
                        name="departmentId"
                        value={newParticipant.departmentId}
                        onChange={handleNewParticipantChange}
                        disabled={departments.length === 0}
                        className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent disabled:opacity-50"
                      >
                          {departments.length > 0 ? (
                            departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))
                          ) : (
                            <option value="">Please add a department first</option>
                          )}
                      </select>
                  </div>
                   <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">PA's Email (Optional)</label>
                        <input 
                            type="email" name="paEmail" value={newParticipant.paEmail} onChange={handleNewParticipantChange}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="pa.assist@example.com"
                        />
                    </div>
              </div>

              {addError && <p className="text-red-500 text-sm mt-4 text-center">{addError}</p>}
              
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                  <button onClick={handleCloseAddModal} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                  <button onClick={handleSaveParticipant} disabled={departments.length === 0} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition disabled:bg-slate-300 dark:disabled:bg-brand-light disabled:cursor-not-allowed">Save Participant</button>
              </div>
          </div>
        </div>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-lg p-8 max-h-[90vh] flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-center font-title text-light-text dark:text-white">
                  Edit Participant
              </h2>
              
              <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Full Name</label>
                      <input 
                          type="text" name="name" value={editingParticipant.name} onChange={handleEditParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Email Address</label>
                      <input 
                          type="email" name="email" value={editingParticipant.email} onChange={handleEditParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Role / Position</label>
                      <input 
                          type="text" name="role" value={editingParticipant.role} onChange={handleEditParticipantChange}
                          className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">Department</label>
                      <select
                        name="departmentId"
                        value={editingParticipant.departmentId}
                        onChange={handleEditParticipantChange}
                        className="w-full bg-light-bg dark:bg-brand-light/50 p-2.5 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                      >
                          {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-brand-text-secondary mb-1">PA's Email (Optional)</label>
                        <input 
                            type="email" name="paEmail" value={editingParticipant.paEmail || ''} onChange={handleEditParticipantChange}
                            className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            placeholder="pa.assist@example.com"
                        />
                    </div>
              </div>

              {editError && <p className="text-red-500 text-sm mt-4 text-center">{editError}</p>}
              
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                  <button onClick={handleCloseEditModal} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                  <button onClick={handleUpdateParticipant} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save Changes</button>
              </div>
          </div>
        </div>
      )}
      
      {/* AI PA Suggestions Modal */}
      {isPaModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-center flex items-center justify-center space-x-3 font-title text-light-text dark:text-white">
                    <AIIcon /> <span>Assign PA Emails</span>
                </h2>
                <p className="text-center text-light-text-secondary dark:text-brand-text-secondary mb-6">AI has identified these participants as likely having a Personal Assistant. Please enter their PA's email address below.</p>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {participantsForPaUpdate.map(p => (
                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div>
                                <p className="font-semibold text-light-text dark:text-white">{p.name}</p>
                                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{p.role}</p>
                            </div>
                            <input 
                                type="email"
                                value={paEmailInputs[p.id] || ''}
                                onChange={(e) => handlePaInputChange(p.id, e.target.value)}
                                placeholder="Enter PA's email address"
                                className="w-full bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent"
                            />
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-light-border dark:border-brand-light/20">
                    <button onClick={() => setIsPaModalOpen(false)} className="text-light-text-secondary hover:text-light-text dark:text-brand-text-secondary dark:hover:text-white transition">Cancel</button>
                    <button onClick={handleSavePaEmails} className="bg-brand-accent-purple text-white dark:bg-brand-accent dark:text-brand-darker font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition">Save PA Emails</button>
                </div>
            </div>
        </div>
      )}

    </>
  );
};