import axios from 'axios';
import { ActivityLogItem } from '../types';

export const getActivityLogs = async (): Promise<ActivityLogItem[]> => {
  const response = await axios.get('/api/activity-logs');
  return response.data;
};
