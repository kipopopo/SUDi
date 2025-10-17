import api from './api';
import { EmailTemplate } from '../types';

export const getTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await api.get(`/templates`);
  return response.data;
};

export const addTemplate = async (template: EmailTemplate): Promise<EmailTemplate> => {
  const response = await api.post(`/templates`, template);
  return response.data;
};

export const updateTemplate = async (template: EmailTemplate): Promise<EmailTemplate> => {
  const response = await api.put(`/templates/${template.id}`, template);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}`);
};
