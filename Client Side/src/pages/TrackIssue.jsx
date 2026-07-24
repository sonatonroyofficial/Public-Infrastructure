import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trackAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
    FaSearch,
    FaCheckCircle,
    FaClock,
    FaUserShield,
    FaExclamationTriangle,
    FaClipboardList,
    FaCopy,
    FaArrowLeft,
    FaBuilding
} from 'react-icons/fa';

// 5-Stage Stepper Progression Mapping
const STEPS = [
    { key: 'pending', label: 'Submitted', icon: '📝', description: 'Report received in system' },
    { key: 'review', label: 'Under Review', icon: '🔍', description: 'AI & Admin initial evaluation' },
    { key: 'assigned', label: 'Assigned', icon: '👷', description: 'Assigned to field staff' },
    { key: 'in-progress', label: 'In Progress', icon: '🛠️', description: 'Field crew addressing issue' },
    { key: 'resolved', label: 'Resolved', icon: '✅', description: 'Issue resolved & verified' }
];

function getActiveStepIndex(status) {
    const s = (status || '').toLowerCase();
    if (s === 'resolved' || s === 'closed') return 4;
    if (s === 'in-progress' || s === 'in_progress') return 3;
    if (s === 'assigned') return 2;
    if (s === 'pending') return 1; // Under review
    return 0; // Default submitted
}

const TrackIssue = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCode = searchParams.get('code') || '';
    const [trackingInput, setTrackingInput] = useState(initialCode);
    const [activeTrackingCode, setActiveTrackingCode] = useState(initialCode);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialCode) {
            fetchTrackingData(initialCode);
        }
    }, [initialCode]);

    const fetchTrackingData = async (codeToSearch) => {
        const cleanCode = (codeToSearch || '').trim();
        if (!cleanCode) {
            toast.error('Please enter a tracking code');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setReport(null);

        try {
            const res = await trackAPI.getReportByCode(cleanCode);
            if (res.data && res.data.found) {
                setReport(res.data);
                setActiveTrackingCode(cleanCode);
            } else {
                setErrorMsg('No report found with this tracking code — please check and try again.');
            }
        } catch (error) {
            console.error('Tracking API error:', error);
            const serverMsg = error.response?.data?.message;
            if (error.response?.status === 404) {
                setErrorMsg(serverMsg || 'No report found with this tracking code — please check and try again.');
            } else {
                setErrorMsg('Unable to connect to tracking server. Please check your network and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!trackingInput.trim()) return;
        setSearchParams({ code: trackingInput.trim() });
        fetchTrackingData(trackingInput.trim());
    };

    const handleCopyCode = () => {
        if (report?.trackingCode) {
            navigator.clipboard.writeText(report.trackingCode);
            toast.success('Tracking code copied to clipboard!');
        }
    };

    const currentStepIndex = report ? getActiveStepIndex(report.status) : 0;

    return (
        <div className="min-h-[calc(100vh-72px)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Back to Home Header */}
                <div className="flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                        <FaArrowLeft /> Back to Home
                    </Link>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                        Public Report Tracker
                    </span>
                </div>

                {/* Main Hero Card & Search Bar */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
                        🔍
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Track Infrastructure Report
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-lg mx-auto">
                            Enter your 8-character unique tracking code to check real-time resolution progress and status updates. No login required.
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <FaSearch className="text-lg" />
                            </div>
                            <input
                                type="text"
                                value={trackingInput}
                                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                                placeholder="Enter 8-digit tracking code (e.g. 6651E9F2)"
                                maxLength={24}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-center sm:text-left"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !trackingInput.trim()}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <FaSearch />
                                    <span>Track Status</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Error State Banner */}
                {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 animate-in fade-in duration-200">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="text-lg font-bold text-rose-900">Report Not Found</h3>
                        <p className="text-sm text-rose-700 max-w-md mx-auto">{errorMsg}</p>
                    </div>
                )}

                {/* Report Tracking Results */}
                {report && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

                        {/* Top Summary Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                                            #{report.trackingCode}
                                        </span>
                                        <button
                                            onClick={handleCopyCode}
                                            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                            title="Copy Tracking Code"
                                        >
                                            <FaCopy /> Copy Code
                                        </button>
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
                                        {report.specificIssueLabel || report.aiCategory}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Submitted on {new Date(report.submittedAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                                        report.severityLabel === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                        report.severityLabel === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                        report.severityLabel === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    }`}>
                                        {report.severityLabel} Priority
                                    </span>
                                    <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                                        {report.status}
                                    </span>
                                </div>
                            </div>

                            {/* 5-Stage Visual Stepper */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center sm:text-left">
                                    Resolution Progress Timeline
                                </h3>

                                <div className="relative">
                                    {/* Desktop Stepper */}
                                    <div className="hidden md:flex items-center justify-between relative z-10">
                                        {STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;
                                            return (
                                                <div key={step.key} className="flex flex-col items-center text-center max-w-[120px] space-y-2">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${
                                                        isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 scale-110' :
                                                        isCompleted ? 'bg-emerald-500 text-white shadow-md' :
                                                        'bg-slate-100 text-slate-400 border border-slate-200'
                                                    }`}>
                                                        {isCompleted && !isCurrent ? <FaCheckCircle /> : step.icon}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                            {step.label}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 leading-tight">
                                                            {step.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Connecting Line */}
                                    <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-1 bg-slate-200 -z-0">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${(currentStepIndex / 4) * 100}%` }}
                                        ></div>
                                    </div>

                                    {/* Mobile Vertical Stepper */}
                                    <div className="md:hidden space-y-3 pl-4 border-l-2 border-slate-200">
                                        {STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;
                                            return (
                                                <div key={step.key} className="flex items-center gap-3 relative">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold -ml-[21px] ${
                                                        isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                                        isCompleted ? 'bg-emerald-500 text-white' :
                                                        'bg-slate-200 text-slate-400'
                                                    }`}>
                                                        {isCompleted && !isCurrent ? <FaCheckCircle /> : step.icon}
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                            {step.label}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{step.description}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Department Info */}
                            {report.assignedStaffName && (
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-lg">
                                        <FaBuilding />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Assigned Department</div>
                                        <div className="text-sm font-bold text-slate-900">{report.assignedStaffName}</div>
                                    </div>
                                </div>
                            )}

                            {/* AI Summary Box */}
                            {report.aiSummaryEn && (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <span>🤖</span> AI Summary Breakdown
                                    </div>
                                    <p className="text-sm text-slate-700 italic">
                                        "{report.aiSummaryEn}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status History Logs */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FaClock className="text-blue-600" /> Official Status Log History
                            </h3>

                            {Array.isArray(report.statusHistory) && report.statusHistory.length > 0 ? (
                                <div className="space-y-4 divide-y divide-slate-100">
                                    {report.statusHistory.map((history, idx) => (
                                        <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="capitalize font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                                        {history.status}
                                                    </span>
                                                    <span className="text-[10px] font-semibold uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                        By {history.updatedByRole || 'Official'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 font-medium">
                                                    {history.comment || `Status updated to ${history.status}`}
                                                </p>
                                            </div>
                                            <div className="text-[11px] text-slate-400 whitespace-nowrap">
                                                {new Date(history.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No formal status updates recorded yet.</p>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default TrackIssue;
