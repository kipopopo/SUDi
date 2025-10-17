import api from './api';
import { Department } from '../types';

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get(`/departments`);
  return response.data;
};

export const addDepartment = async (department: Department): Promise<Department> => {
  const response = await api.post(`/departments`, department);
  return response.data;
};

export const updateDepartment = async (department: Department): Promise<Department> => {
  const response = await api.put(`/departments/${department.id}`, department);
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/departments/${id}`);
};
