import api from './api';
import { Participant } from '../types';

export const getParticipants = async (): Promise<Participant[]> => {
  const response = await api.get(`/participants`);
  return response.data;
};

export const addParticipant = async (participant: Participant): Promise<Participant> => {
  const response = await api.post(`/participants`, participant);
  return response.data;
};

export const updateParticipant = async (participant: Participant): Promise<Participant> => {
  const response = await api.put(`/participants/${participant.id}`, participant);
  return response.data;
};

export const deleteParticipant = async (id: string): Promise<void> => {
  await api.delete(`/participants/${id}`);
};
