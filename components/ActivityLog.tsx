import React, { useState, useEffect } from 'react';
import { ActivityLogItem } from '../types';
import { getActivityLogs } from '../services/activityLogService';
import { UserIcon, TimeIcon, InfoIcon } from './common/Icons';

const ActivityLog: React.FC = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await getActivityLogs();
        setActivityLogs(logs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-title dark:text-white">Activity Log</h1>
        <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary">
          Track user actions and system events.
        </p>
      </div>

      <div className="bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-light-border dark:divide-brand-light/20">
            <thead className="bg-light-bg dark:bg-brand-dark">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-brand-text-secondary uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-brand-light/20">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-light-text-secondary dark:text-brand-text-secondary">
                    Loading activity logs...
                  </td>
                </tr>
              ) : activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-light-bg dark:hover:bg-brand-light/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-light-text-secondary dark:text-brand-text-secondary" />
                        <span className="text-sm font-medium text-light-text dark:text-white">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-light-text dark:text-white">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <InfoIcon className="w-5 h-5 mr-2 text-light-text-secondary dark:text-brand-text-secondary" />
                        <span className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{log.details}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TimeIcon className="w-5 h-5 mr-2 text-light-text-secondary dark:text-brand-text-secondary" />
                        <span className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-light-text-secondary dark:text-brand-text-secondary">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
