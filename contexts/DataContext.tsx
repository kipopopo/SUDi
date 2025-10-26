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
      api.get('/history').then(response => {
        if (Array.isArray(response.data)) {
          setHistory(response.data);
        } else {
          console.error("API did not return an array for history:", response.data);
          setHistory([]); // Set to empty array to prevent crashes
        }
      }).catch(error => {
        console.error("Failed to fetch history:", error);
        setHistory([]); // Also set to empty on API error
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/departments').then(response => {
        if (Array.isArray(response.data)) {
          setDepartments(response.data);
        } else {
          console.error("API did not return an array for departments:", response.data);
          setDepartments([]);
        }
      }).catch(error => {
        console.error("Failed to fetch departments:", error);
        setDepartments([]);
      });

      api.get('/participants').then(response => {
        if (Array.isArray(response.data)) {
          setParticipants(response.data);
        } else {
          console.error("API did not return an array for participants:", response.data);
          setParticipants([]);
        }
      }).catch(error => {
        console.error("Failed to fetch participants:", error);
        setParticipants([]);
      });

      api.get('/templates').then(response => {
        if (Array.isArray(response.data)) {
          setTemplates(response.data);
        } else {
          console.error("API did not return an array for templates:", response.data);
          setTemplates([]);
        }
      }).catch(error => {
        console.error("Failed to fetch templates:", error);
        setTemplates([]);
      });

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