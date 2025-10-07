import React, { useMemo, useState } from 'react';
import { BlastHistoryItem } from '../types';
import { ReportIcon, MailOpenIcon, CursorClickIcon, CheckCircleIcon, BlastIcon } from './common/Icons';

interface AnalyticsProps {
    history: BlastHistoryItem[];
}

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

const Analytics: React.FC<AnalyticsProps> = ({ history }) => {
    const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

    const analyticsData = useMemo(() => {
        const completed = history.filter(item => item.status === 'Completed');
        if (completed.length === 0) {
            return {
                totalCampaigns: 0,
                totalEmailsSent: 0,
                avgOpenRate: 0,
                avgClickRate: 0,
                avgDeliveryRate: 0,
                topCampaigns: [],
                chartData: [],
            };
        }

        const totalCampaigns = completed.length;
        const totalEmailsSent = completed.reduce((sum, item) => sum + item.recipientCount, 0);

        const avgOpenRate = completed.reduce((sum, item) => sum + (item.openRate || 0), 0) / totalCampaigns;
        const avgClickRate = completed.reduce((sum, item) => sum + (item.clickRate || 0), 0) / totalCampaigns;
        const avgDeliveryRate = completed.reduce((sum, item) => sum + (item.deliveryRate || 0), 0) / totalCampaigns;
        
        const sortedCampaigns = [...completed].sort((a, b) => (b.openRate || 0) - (a.openRate || 0));
        const topCampaigns = sortedCampaigns.slice(0, 5);
        
        const chartData = [...completed].sort((a, b) => {
            const timeA = new Date(a.sentDate).getTime();
            const timeB = new Date(b.sentDate).getTime();
            
            if (isNaN(timeA)) return -1;
            if (isNaN(timeB)) return 1;
            
            return timeA - timeB;
        }).slice(-7).map(c => ({
            name: c.templateName,
            sentDate: c.sentDate,
            openRate: c.openRate || 0,
            clickRate: c.clickRate || 0,
        }));

        return {
            totalCampaigns,
            totalEmailsSent,
            avgOpenRate: parseFloat(avgOpenRate.toFixed(2)),
            avgClickRate: parseFloat(avgClickRate.toFixed(2)),
            avgDeliveryRate: parseFloat(avgDeliveryRate.toFixed(2)),
            topCampaigns,
            chartData
        };

    }, [history]);

    if (history.filter(h => h.status === 'Completed').length === 0) {
        return (
             <div className="animate-fade-in text-center p-12 bg-light-surface dark:bg-brand-dark/50 rounded-lg border border-light-border dark:border-brand-light/20">
                <ReportIcon className="w-16 h-16 mx-auto text-light-text-secondary dark:text-brand-text-secondary mb-4" />
                <h1 className="text-2xl font-bold font-title">No Analytics Data Available</h1>
                <p className="text-light-text-secondary dark:text-brand-text-secondary mt-2">
                    Complete your first email campaign to see performance analytics here.
                </p>
            </div>
        )
    }

    const { totalCampaigns, avgOpenRate, avgClickRate, avgDeliveryRate, topCampaigns, chartData } = analyticsData;
    
    // --- SVG Chart Constants & Helpers ---
    const svgWidth = 500;
    const svgHeight = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 30 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;
    
    const maxChartValue = Math.max(...chartData.flatMap(d => [d.openRate, d.clickRate]), 0);
    const chartCeiling = Math.ceil(maxChartValue / 20) * 20 || 20;

    const xScale = (index: number) => padding.left + (chartData.length > 1 ? (index / (chartData.length - 1)) * chartWidth : chartWidth / 2);
    const yScale = (value: number) => padding.top + chartHeight - (value / chartCeiling) * chartHeight;
    
    const createPath = (dataKey: 'openRate' | 'clickRate') => {
        if (chartData.length === 0) return '';
        const points = chartData.map((d, i) => `${xScale(i)},${yScale(d[dataKey])}`);
        return `M ${points.join(' L ')}`;
    };

    const openRatePath = createPath('openRate');
    const clickRatePath = createPath('clickRate');

    const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // --- End SVG Chart Helpers ---

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-title">Campaign Analytics</h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-brand-text-secondary">An overview of your email marketing performance.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KpiCard icon={<BlastIcon className="w-6 h-6"/>} value={String(totalCampaigns)} title="Campaigns Sent" />
                 <KpiCard icon={<CheckCircleIcon className="w-6 h-6"/>} value={`${avgDeliveryRate}%`} title="Avg. Delivery Rate" />
                 <KpiCard icon={<MailOpenIcon className="w-6 h-6"/>} value={`${avgOpenRate}%`} title="Avg. Open Rate" />
                 <KpiCard icon={<CursorClickIcon className="w-6 h-6"/>} value={`${avgClickRate}%`} title="Avg. Click-Through Rate" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                 {/* Chart */}
                <div className="lg:col-span-3 bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
                    <h2 className="text-xl font-bold font-title mb-4">Recent Campaign Performance</h2>
                     <div className="h-80 relative" onMouseLeave={() => setActiveTooltipIndex(null)}>
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full text-light-text-secondary dark:text-brand-text-secondary">
                           {/* Y-Axis Grid Lines & Labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                                const y = yScale(tick * chartCeiling);
                                return (
                                    <g key={tick} className="text-xs">
                                        <line x1={padding.left} x2={svgWidth - padding.right} y1={y} y2={y} className="stroke-current opacity-10 dark:opacity-20" />
                                        <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-current">{tick * chartCeiling}%</text>
                                    </g>
                                )
                            })}
                            
                            {/* X-Axis Labels */}
                            {chartData.map((d, i) => (
                                <text key={i} x={xScale(i)} y={svgHeight - padding.bottom + 15} textAnchor="middle" className="text-xs fill-current">{formatDate(d.sentDate)}</text>
                            ))}
                            
                            {/* Lines */}
                            <path d={openRatePath} fill="none" className="stroke-blue-500" strokeWidth="2" />
                            <path d={clickRatePath} fill="none" className="stroke-brand-accent" strokeWidth="2" />
                            
                            {/* Data Points & Hover Areas */}
                            {chartData.map((d, i) => (
                                <g key={`point-${i}`}>
                                    <circle cx={xScale(i)} cy={yScale(d.openRate)} r="4" className="stroke-blue-500 fill-light-surface dark:fill-brand-dark" strokeWidth="2" />
                                    <circle cx={xScale(i)} cy={yScale(d.clickRate)} r="4" className="stroke-brand-accent fill-light-surface dark:fill-brand-dark" strokeWidth="2" />
                                    <rect 
                                        x={xScale(i) - 10} 
                                        y="0" 
                                        width="20" 
                                        height={svgHeight - padding.bottom}
                                        fill="transparent"
                                        onMouseEnter={() => setActiveTooltipIndex(i)}
                                    />
                                </g>
                            ))}
                        </svg>

                        {/* Tooltip */}
                        {activeTooltipIndex !== null && chartData[activeTooltipIndex] && (
                             <div 
                                className="absolute w-max max-w-xs text-center bg-brand-darker text-white text-xs rounded py-1.5 px-3 opacity-100 pointer-events-none z-10 shadow-lg transition-all"
                                style={{
                                    left: `${xScale(activeTooltipIndex)}px`,
                                    bottom: `${svgHeight - Math.min(yScale(chartData[activeTooltipIndex].openRate), yScale(chartData[activeTooltipIndex].clickRate)) + 15}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <p className="font-bold">{chartData[activeTooltipIndex].name}</p>
                                <p><span className="text-blue-400">Open Rate:</span> {chartData[activeTooltipIndex].openRate}%</p>
                                <p><span className="text-brand-accent">Click Rate:</span> {chartData[activeTooltipIndex].clickRate}%</p>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-darker rotate-45"></div>
                            </div>
                        )}
                    </div>
                     <div className="flex items-center justify-center space-x-4 text-sm mt-4 pt-4 border-t border-light-border dark:border-brand-light/20">
                        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>Open Rate</span></div>
                        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-sm bg-brand-accent"></div><span>Click Rate</span></div>
                    </div>
                </div>

                {/* Top Campaigns */}
                <div className="lg:col-span-2 bg-light-surface dark:bg-brand-dark/50 border border-light-border dark:border-brand-light/20 p-6 rounded-xl">
                    <h2 className="text-xl font-bold font-title mb-4">Top Performing Campaigns</h2>
                    <ul className="space-y-4">
                        {topCampaigns.map(campaign => (
                            <li key={campaign.id} className="border-b border-light-border dark:border-brand-light/20 pb-3 last:border-b-0 last:pb-0">
                                <p className="font-semibold text-light-text dark:text-white truncate">{campaign.templateName}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-light-text-secondary dark:text-brand-text-secondary">{campaign.recipientCount} Recipients</p>
                                    <div className="flex space-x-3">
                                        <p><span className="text-blue-500 font-semibold">{campaign.openRate || 0}%</span> Open</p>
                                        <p><span className="text-brand-accent font-semibold">{campaign.clickRate || 0}%</span> Click</p>
                                    </div>
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