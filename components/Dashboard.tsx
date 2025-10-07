
import React from 'react';
import { View, Department, Participant, EmailTemplate, BlastHistoryItem } from '../types';
import { 
  ParticipantsIcon, 
  DepartmentsIcon, 
  TemplatesIcon, 
  BlastIcon, 
  HistoryIcon,
  CheckCircleIcon,
  FailCircleIcon,
  PlusIcon
} from './common/Icons';

interface DashboardProps {
  setCurrentView: (view: View) => void;
  departments: Department[];
  participants: Participant[];
  templates: EmailTemplate[];
  history: BlastHistoryItem[];
}

/**
 * A redesigned, standardized card component to display a key statistic.
 * @param {object} props - The props for the component.
 * @returns {React.ReactElement} The rendered statistic card component.
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  title: string;
  description: string;
  onClick: () => void;
  colorClass: string;
}> = ({ icon, value, title, description, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className="relative group w-full p-6 bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 rounded-xl overflow-hidden text-left transition-all duration-300 hover:border-transparent hover:-translate-y-1 hover:shadow-2xl"
  >
    {/* Background glow effect on hover */}
    <div className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 ${colorClass} rounded-full opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}></div>
    
    <div className="relative z-10">
      <div className={`w-12 h-12 mb-4 flex items-center justify-start rounded-lg bg-opacity-10 ${colorClass.replace('bg-', 'text-')}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold font-title text-light-text dark:text-white">{value}</p>
      <h3 className="text-md font-semibold text-light-text dark:text-white mt-1">{title}</h3>
      <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{description}</p>
    </div>
  </button>
);

/**
 * A reusable button for the "Quick Actions" panel.
 * @param {object} props - The props for the component.
 * @returns {React.ReactElement} The rendered quick action button.
 */
const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center p-4 space-x-4 bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 rounded-lg hover:bg-light-bg dark:hover:bg-brand-light/50 transition-all duration-200"
    >
        <div className="p-3 bg-light-bg text-brand-accent-purple dark:bg-brand-light dark:text-brand-accent rounded-lg">
          {icon}
        </div>
        <div>
            <h4 className="font-semibold text-light-text dark:text-white text-left">{title}</h4>
            <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary text-left">{description}</p>
        </div>
    </button>
);

/**
 * Renders a single item for the "Recent Activity" feed.
 * @param {object} props - The props for the component.
 * @returns {React.ReactElement} The rendered activity item.
 */
const ActivityItem: React.FC<{ item: BlastHistoryItem }> = ({ item }) => {
    const getStatusIcon = () => {
        const iconClass = "w-6 h-6";
        switch (item.status) {
            case 'Completed':
                return <CheckCircleIcon className={iconClass} />;
            case 'Scheduled':
                return <HistoryIcon className={iconClass} />;
            case 'Failed':
                return <FailCircleIcon className={iconClass} />;
            default:
                return <HistoryIcon className={iconClass} />;
        }
    };

    const getStatusColor = () => {
         switch (item.status) {
            case 'Completed':
                return 'text-green-500';
            case 'Scheduled':
                return 'text-blue-500';
            case 'Failed':
                return 'text-red-500';
            default:
                return 'text-light-text-secondary dark:text-brand-text-secondary';
        }
    }

    const formatDateTime = (isoString: string | undefined) => {
        if (!isoString) return 'Pending...';
        return new Date(isoString).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const dateToShow = item.status === 'Scheduled' ? item.scheduledDate : item.sentDate;

    return (
        <li className="flex items-center space-x-4 py-3">
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${getStatusColor()} bg-current/10`}>
                {getStatusIcon()}
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-light-text dark:text-white truncate">{item.templateName}</p>
                <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary truncate">
                    To {item.recipientGroup} ({item.recipientCount} recipients)
                </p>
            </div>
            <div className="flex-shrink-0 text-sm text-right text-light-text-secondary dark:text-brand-text-secondary">
                {formatDateTime(dateToShow)}
            </div>
        </li>
    );
};


/**
 * Renders the completely redesigned dashboard view of the application.
 * It provides a comprehensive overview with statistics, recent activity, and quick actions.
 * @param {DashboardProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered dashboard component.
 */
export const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, departments, participants, templates, history }) => {
  const completedCampaigns = history.filter(item => item.status === 'Completed').length;
  
  // Sort history by date to get the most recent items for the activity feed.
  const recentActivities = history.slice().sort((a, b) => {
    const dateA = new Date(a.scheduledDate || a.sentDate || 0).getTime();
    const dateB = new Date(b.scheduledDate || b.sentDate || 0).getTime();
    return dateB - dateA;
  }).slice(0, 5);

  return (
    <div className="animate-fade-in">
        <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-title">Welcome back, Admin!</h1>
            <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary">Here's a snapshot of your system. Ready to engage your audience?</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard 
                      icon={<ParticipantsIcon className="w-8 h-8" />} 
                      value={String(participants.length)} 
                      title="Participants" 
                      description="Total managed contacts"
                      onClick={() => setCurrentView('participants')}
                      colorClass="bg-brand-accent-purple"
                    />
                    <StatCard 
                      icon={<DepartmentsIcon className="w-8 h-8" />} 
                      title="Departments"
                      value={String(departments.length)} 
                      description="Organized contact groups" 
                      onClick={() => setCurrentView('departments')}
                      colorClass="bg-blue-500"
                    />
                    <StatCard 
                      icon={<TemplatesIcon className="w-8 h-8" />} 
                      title="Templates"
                      value={String(templates.length)} 
                      description="Reusable email designs" 
                      onClick={() => setCurrentView('templates')}
                      colorClass="bg-green-500"
                    />
                    <StatCard 
                      icon={<BlastIcon className="w-8 h-8" />} 
                      title="Campaigns Sent" 
                      value={String(completedCampaigns)} 
                      description="Completed email blasts"
                      onClick={() => setCurrentView('history')}
                      colorClass="bg-brand-accent"
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold font-title">Recent Activity</h2>
                        <button onClick={() => setCurrentView('history')} className="text-sm font-semibold text-brand-accent-purple dark:text-brand-accent hover:underline">
                            View All
                        </button>
                    </div>
                    {recentActivities.length > 0 ? (
                        <ul className="divide-y divide-light-border dark:divide-brand-light/20">
                            {recentActivities.map(item => <ActivityItem key={item.id} item={item} />)}
                        </ul>
                    ) : (
                        <p className="text-center py-8 text-light-text-secondary dark:text-brand-text-secondary">
                            No recent activity. Send your first campaign!
                        </p>
                    )}
                </div>
            </div>

            {/* Side Column */}
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
                    <h2 className="text-xl font-bold font-title mb-4">Quick Actions</h2>
                    <div className="space-y-4">
                       <QuickActionButton
                          icon={<BlastIcon className="w-7 h-7" />}
                          title="Create New Blast"
                          description="Start a new email campaign"
                          onClick={() => setCurrentView('blast')}
                        />
                        <QuickActionButton
                          icon={<ParticipantsIcon className="w-7 h-7" />}
                          title="Add Participant"
                          description="Add a new contact manually"
                          onClick={() => setCurrentView('participants')}
                        />
                        <QuickActionButton
                          icon={<TemplatesIcon className="w-7 h-7" />}
                          title="New Template"
                          description="Design a new reusable email"
                          onClick={() => setCurrentView('templates')}
                        />
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};
