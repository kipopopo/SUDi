import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { Department, Participant, EmailTemplate, BlastHistoryItem } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  departments: Department[];
  participants: Participant[];
  templates: EmailTemplate[];
  history: BlastHistoryItem[];
  refreshHistory: () => void;
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  setHistory: React.Dispatch<React.SetStateAction<BlastHistoryItem[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [history, setHistory] = useState<BlastHistoryItem[]>([]);

  const refreshHistory = useCallback(() => {
    if (isAuthenticated) {
      api.get('/history').then(response => setHistory(response.data));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/departments').then(response => setDepartments(response.data));
      api.get('/participants').then(response => setParticipants(response.data));
      api.get('/templates').then(response => setTemplates(response.data));
      refreshHistory();
    }
  }, [isAuthenticated, refreshHistory]);

  const value = useMemo(() => ({
    departments,
    participants,
    templates,
    history,
    refreshHistory,
    setParticipants,
    setDepartments,
    setTemplates,
    setHistory
  }), [departments, participants, templates, history, refreshHistory]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
