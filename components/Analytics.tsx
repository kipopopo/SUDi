import React, { useMemo } from 'react';
import { BlastHistoryItem } from '../types';
import { ReportIcon, BlastIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';

interface AnalyticsProps {}

const KpiCard: React.FC<{ icon: React.ReactNode; value: string; title: string; }> = ({ icon, value, title }) => (
    <div className="bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
        <div className="flex items-center space-x-4">
            <div className="bg-brand-accent-purple/10 dark:bg-brand-accent/10 text-brand-accent-purple dark:text-brand-accent p-3 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-2xl sm:text-3xl font-bold font-title text-light-text dark:text-white">{value}</p>
                <h3 className="text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary">{title}</h3>
            </div>
        </div>
    </div>
);

const Analytics: React.FC<AnalyticsProps> = () => {
    const { history } = useData();

    const analyticsData = useMemo(() => {
        const completed = history.filter(item => item.status === 'Completed');
        if (completed.length === 0) {
            return {
                totalCampaigns: 0,
                totalEmailsSent: 0,
                topCampaigns: [],
            };
        }

        const totalCampaigns = completed.length;
        const totalEmailsSent = completed.reduce((sum, item) => sum + item.recipientCount, 0);
        
        const sortedCampaigns = [...completed].sort((a, b) => (b.recipientCount || 0) - (a.recipientCount || 0));
        const topCampaigns = sortedCampaigns.slice(0, 5);
        
        return {
            totalCampaigns,
            totalEmailsSent,
            topCampaigns,
        };

    }, [history]);

    if (history.filter(h => h.status === 'Completed').length === 0) {
        return (
             <div className="animate-fade-in text-center p-12 bg-light-surface dark:bg-brand-dark/50 rounded-lg border border-light-border dark:border-brand-light/20">
                <ReportIcon className="w-16 h-16 mx-auto text-light-text-secondary dark:text-brand-text-secondary mb-4" />
                <h1 className="text-2xl font-bold font-title dark:text-white">No Analytics Data Available</h1>
                <p className="text-light-text-secondary dark:text-brand-text-secondary mt-2">
                    Complete your first email campaign to see performance analytics here.
                </p>
            </div>
        )
    }

    const { totalCampaigns, totalEmailsSent, topCampaigns } = analyticsData;

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-title dark:text-white">Campaign Analytics</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary">An overview of your email marketing performance.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <KpiCard icon={<BlastIcon className="w-6 h-6"/>} value={String(totalCampaigns)} title="Campaigns Sent" />
                 <KpiCard icon={<BlastIcon className="w-6 h-6"/>} value={String(totalEmailsSent)} title="Total Emails Sent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Top Campaigns */}
                <div className="lg:col-span-5 bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
                    <h2 className="text-xl font-bold font-title mb-4 dark:text-white">Top Performing Campaigns</h2>
                    <ul className="space-y-4">
                        {topCampaigns.map(campaign => (
                            <li key={campaign.id} className="border-b border-light-border dark:border-brand-light/20 pb-3 last:border-b-0 last:pb-0">
                                <p className="font-semibold text-light-text dark:text-white truncate">{campaign.templateName}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-light-text-secondary dark:text-brand-text-secondary">{campaign.recipientCount} Recipients</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Analytics;