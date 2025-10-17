import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlastHistoryItem, RecipientActivity } from '../types';
import { CloseIcon, CheckCircleIcon, HistoryIcon, EyeIcon, CursorClickIcon, UserRemoveIcon, MailOpenIcon, DownloadIcon, LoadingIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';

interface HistoryManagerProps {}

const ReportModal: React.FC<{ report: BlastHistoryItem; onClose: () => void }> = ({ report, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'activity' | 'content'>('activity');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            console.error("jsPDF library is not loaded.");
            alert('Could not download PDF. The jsPDF library is missing.');
            return;
        }
    
        setIsDownloading(true);
    
        try {
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
            });

            // @ts-ignore
            if (typeof doc.autoTable !== 'function') {
                console.error("jsPDF-AutoTable plugin is not loaded.");
                alert('Could not download PDF. The autoTable plugin is missing.');
                setIsDownloading(false);
                return;
            }
    
            // --- PDF Color Palette (Theme-Independent) ---
            const pdfTitleColor = [100, 116, 139];       // slate-500
            const pdfHeadingColor = [51, 65, 85];      // slate-700
            const pdfTextColor = [15, 23, 42];           // slate-900
            const pdfSecondaryTextColor = [71, 85, 105];  // slate-600
            const accentColor = [249, 115, 22];          // brand-accent (orange)
            const lightLineColor = [226, 232, 240];      // slate-200
            
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let cursorY = margin;
    
            // === HEADER ===
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pdfTitleColor[0], pdfTitleColor[1], pdfTitleColor[2]);
            doc.text('SUDi Campaign Report', pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 10;
    
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(pdfHeadingColor[0], pdfHeadingColor[1], pdfHeadingColor[2]);
            doc.text(report.templateName, pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 10;
            
            doc.setDrawColor(lightLineColor[0], lightLineColor[1], lightLineColor[2]); 
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 10;
    
            // === METADATA ===
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pdfTitleColor[0], pdfTitleColor[1], pdfTitleColor[2]);
            doc.text('Campaign Details', margin, cursorY);
            cursorY += 6;
    
            const details = [
                { label: 'Sent To:', value: report.recipientGroup },
                { label: 'Total Recipients:', value: String(report.recipientCount) },
                { label: 'Sent Date:', value: new Date(report.sentDate).toLocaleString() },
                { label: 'Subject:', value: report.subject },
            ];

            doc.setFontSize(10);
            details.forEach(detail => {
                const labelWidth = 35;
                const valueWidth = pageWidth - margin * 2 - labelWidth;
                const splitValue = doc.splitTextToSize(detail.value, valueWidth);
                
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(pdfSecondaryTextColor[0], pdfSecondaryTextColor[1], pdfSecondaryTextColor[2]);
                doc.text(detail.label, margin, cursorY);
                
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(pdfTextColor[0], pdfTextColor[1], pdfTextColor[2]);
                doc.text(splitValue, margin + labelWidth, cursorY);
                cursorY += (splitValue.length * 5); // Adjust spacing based on lines
            });
            cursorY += 5;

            // === KPIs ===
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pdfTitleColor[0], pdfTitleColor[1], pdfTitleColor[2]);
            doc.text('Performance Overview', margin, cursorY);
            cursorY += 8;
    
            const kpiData = [
                { label: 'Delivery Rate', value: `${report.deliveryRate}%` },
                { label: 'Open Rate', value: `${report.openRate}%` },
                { label: 'Click Rate', value: `${report.clickRate}%` },
                { label: 'Unsubscribe Rate', value: `${report.unsubscribeRate}%` },
            ];
            
            const kpiBoxWidth = (pageWidth - (2 * margin)) / 4;
            kpiData.forEach((kpi, index) => {
                const x = margin + (index * kpiBoxWidth);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.text(kpi.value, x + kpiBoxWidth/2, cursorY, { align: 'center'});
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(pdfSecondaryTextColor[0], pdfSecondaryTextColor[1], pdfSecondaryTextColor[2]);
                doc.text(kpi.label, x + kpiBoxWidth/2, cursorY + 6, { align: 'center' });
            });
            cursorY += 15;
    
            // === RECIPIENT ACTIVITY TABLE ===
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pdfTitleColor[0], pdfTitleColor[1], pdfTitleColor[2]);
            doc.text('Recipient Activity', margin, cursorY);
            
            const tableColumn = ["Name", "Email", "Status"];
            const tableRows = report.detailedRecipientActivity.map(p => [p.name, p.email, p.status]);
            
            const tableHeaderBg = [30, 41, 59];
            const tableHeaderText = [255, 255, 255];
            const tableRowDarkBg = [30, 41, 59];
            const tableRowDarkText = [255, 255, 255];
            const tableRowLightBg = [255, 255, 255];
            const tableRowLightText = pdfTextColor;
            const tableLineColor = [48, 59, 81];
    
            // @ts-ignore
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: cursorY + 4,
                theme: 'grid',
                headStyles: { fillColor: tableHeaderBg, textColor: tableHeaderText, lineColor: tableLineColor },
                styles: { textColor: tableRowLightText, fillColor: tableRowLightBg, lineColor: tableLineColor, lineWidth: 0.1 },
                alternateRowStyles: { fillColor: tableRowDarkBg, textColor: tableRowDarkText },
            });
            
            // Get Y position after table
            // @ts-ignore
            cursorY = doc.autoTable.previous.finalY;

            // === EMAIL CONTENT ===
            // Add a new page if the table took up too much space
            if (pageHeight - cursorY < 40) {
              doc.addPage();
              cursorY = margin;
            } else {
              cursorY += 15;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pdfTitleColor[0], pdfTitleColor[1], pdfTitleColor[2]);
            doc.text('Email Content', margin, cursorY);
            cursorY += 10;
            
            const stripHtml = (html: string) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.body.textContent || "";
            }
            
            const emailContent = stripHtml(report.body);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(pdfTextColor[0], pdfTextColor[1], pdfTextColor[2]);
            const lines = doc.splitTextToSize(emailContent, pageWidth - (2 * margin));
            doc.text(lines, margin, cursorY);
            
            const fileName = `SUDi_Report_${report.templateName.replace(/\s/g, '_')}.pdf`;
            doc.save(fileName);
        } catch (e) {
          console.error("Error generating PDF", e);
          alert('Sorry, there was an error generating the PDF.');
        } finally {
          setIsDownloading(false);
        }
    };


    const filteredActivity = useMemo(() => {
        if (!searchTerm) return report.detailedRecipientActivity;
        const lowercasedTerm = searchTerm.toLowerCase();
        return report.detailedRecipientActivity.filter(
            p => p.name.toLowerCase().includes(lowercasedTerm) || p.email.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, report.detailedRecipientActivity]);

    

    const getStatusChip = (status: RecipientActivity['status']) => {
        const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'Opened': return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300`;
            case 'Clicked': return `${baseClass} bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300`;
            case 'Bounced': return `${baseClass} bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300`;
            case 'Unsubscribed': return `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300`;
            default: return `${baseClass} bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-brand-dark border border-light-border dark:border-brand-light/20 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold font-title dark:text-white">{report.templateName} {t('historyManager.reportModal.title')}</h2>
                        <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary">{t('historyManager.reportModal.sentTo')} "{report.recipientGroup}" {t('historyManager.reportModal.withRecipients')} {report.recipientCount} recipients</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleDownloadPdf} 
                            disabled={isDownloading}
                            className="flex items-center space-x-2 text-sm text-light-text-secondary dark:text-brand-text-secondary hover:text-light-text dark:hover:text-white bg-light-bg dark:bg-brand-light/50 hover:bg-slate-200 dark:hover:bg-brand-light p-2 rounded-lg transition disabled:opacity-50"
                        >
                            {isDownloading ? <LoadingIcon /> : <DownloadIcon />}
                            <span className="hidden sm:inline">{isDownloading ? t('historyManager.reportModal.downloading') : t('historyManager.reportModal.downloadPdf')}</span>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-brand-light/50"><CloseIcon /></button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {/* KPI Cards */}
                    

                    {/* Tabs */}
                    <div className="border-b border-light-border dark:border-brand-light/20 mb-4">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('activity')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-brand-accent-purple dark:border-brand-accent text-brand-accent-purple dark:text-brand-accent' : 'border-transparent text-light-text-secondary dark:text-brand-text-secondary hover:border-gray-300'}`}>{t('historyManager.reportModal.recipientActivity')}</button>
                            <button onClick={() => setActiveTab('content')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'content' ? 'border-brand-accent-purple dark:border-brand-accent text-brand-accent-purple dark:text-brand-accent' : 'border-transparent text-light-text-secondary dark:text-brand-text-secondary hover:border-gray-300'}`}>{t('historyManager.reportModal.emailContent')}</button>
                        </nav>
                    </div>

                    <div>
                        {activeTab === 'activity' ? (
                            <div>
                                <div className="mb-4">
                                    <input type="text" placeholder={t('historyManager.reportModal.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-sm bg-light-bg dark:bg-brand-light/50 p-2 rounded-md border border-light-border dark:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent-purple dark:focus:ring-brand-accent" />
                                </div>
                                <div>
                                    <table className="w-full text-left">
                                        <thead className="bg-light-bg dark:bg-brand-light/30">
                                            <tr>
                                                <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase">{t('historyManager.reportModal.name')}</th>
                                                <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase">{t('historyManager.reportModal.email')}</th>
                                                <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-brand-text-secondary uppercase">{t('historyManager.reportModal.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredActivity.map(p => (
                                                <tr key={p.participantId} className="border-b border-light-border dark:border-brand-light/20">
                                                    <td className="p-3 font-medium text-light-text dark:text-white">{p.name}</td>
                                                    <td className="p-3 text-light-text-secondary dark:text-brand-text-secondary">{p.email}</td>
                                                    <td className="p-3"><span className={getStatusChip(p.status)}>{p.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-light-bg dark:bg-brand-light/20 rounded-lg">
                               <div className="p-4" dangerouslySetInnerHTML={{ __html: `<div class="prose prose-sm dark:prose-invert max-w-none text-light-text dark:text-brand-text">${report.body}</div>` }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HistoryManager: React.FC<HistoryManagerProps> = () => {
    const { t } = useTranslation();
    const { history } = useData();
    const [selectedReport, setSelectedReport] = useState<BlastHistoryItem | null>(null);

    const formatDateTime = (isoString: string | undefined) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const StatusBadge: React.FC<{ status: BlastHistoryItem['status'] }> = ({ status }) => (
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
            }`}>
            {status}
        </span>
    );
    
    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => {
            const dateA = new Date(a.scheduledDate || a.sentDate || 0).getTime();
            const dateB = new Date(b.scheduledDate || b.sentDate || 0).getTime();
            return dateB - dateA;
        });
    }, [history]);

    return (
        <>
            <div className="animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-title dark:text-white">{t('historyManager.title')}</h1>
                    <p className="text-light-text-secondary dark:text-brand-text-secondary mt-2">{t('historyManager.subtitle')}</p>
                </div>

                <div className="space-y-4">
                    {sortedHistory.length > 0 ? (
                        sortedHistory.map((item) => (
                            <div key={item.id} className="bg-light-surface dark:bg-brand-dark/50 p-4 rounded-lg border border-light-border dark:border-brand-light/20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {item.status === 'Completed' ? <CheckCircleIcon /> : <HistoryIcon />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-light-text dark:text-white">{item.templateName}</h3>
                                            <p className="text-sm text-light-text-secondary dark:text-brand-text-secondary truncate max-w-sm">{item.subject}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-shrink-0 flex flex-wrap items-start justify-center md:justify-start gap-x-6 gap-y-4 text-sm text-center md:text-left">
                                         <div>
                                            <p className="font-semibold text-light-text-secondary dark:text-brand-text-secondary text-xs uppercase tracking-wider">{t('historyManager.status')}</p>
                                            <div className="mt-1"><StatusBadge status={item.status} /></div>
                                         </div>
                                          <div>
                                            <p className="font-semibold text-light-text-secondary dark:text-brand-text-secondary text-xs uppercase tracking-wider">{t('historyManager.recipients')}</p>
                                            <p className="font-medium mt-1">{item.recipientCount}</p>
                                         </div>
                                          <div>
                                            <p className="font-semibold text-light-text-secondary dark:text-brand-text-secondary text-xs uppercase tracking-wider">{item.status === 'Scheduled' ? t('historyManager.scheduledFor') : t('historyManager.sentOn')}</p>
                                            <p className="font-medium mt-1 whitespace-nowrap">{formatDateTime(item.status === 'Scheduled' ? item.scheduledDate : item.sentDate)}</p>
                                         </div>
                                    </div>
                                     <div className="flex-shrink-0 md:border-l md:pl-4 border-light-border dark:border-brand-light/20">
                                        <button
                                            onClick={() => setSelectedReport(item)}
                                            disabled={item.status === 'Scheduled'}
                                            className="w-full md:w-auto bg-brand-accent-purple/10 text-brand-accent-purple dark:bg-brand-accent/10 dark:text-brand-accent font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-80 dark:hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                            <span>{t('historyManager.viewReport')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-12 text-light-text-secondary dark:text-brand-text-secondary bg-light-surface dark:bg-brand-dark/50 rounded-lg">
                            {t('historyManager.noHistory')}
                        </div>
                    )}
                </div>
            </div>
            {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
        </>
    );
};

export default HistoryManager;