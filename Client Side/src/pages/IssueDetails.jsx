import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaCheckCircle, FaExclamationTriangle, FaThumbsUp, FaClock, FaTrash, FaCopy, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upvoteLoading, setUpvoteLoading] = useState(false);

    const trackingCode = issue?._id ? issue._id.toString().substring(0, 8).toUpperCase() : (issue?.id ? String(issue.id).substring(0, 8).toUpperCase() : '');

    const handleCopyTrackingCode = () => {
        if (trackingCode) {
            navigator.clipboard.writeText(trackingCode);
            toast.success(`Tracking code #${trackingCode} copied to clipboard!`);
        }
    };

    useEffect(() => {
        fetchIssue();
    }, [id]);

    useEffect(() => {
        let interval;
        if (issue && issue.aiProcessingStatus === 'processing') {
            interval = setInterval(async () => {
                try {
                    const response = await issueAPI.getIssueStatus(id);
                    if (response.data.aiProcessingStatus !== 'processing') {
                        fetchIssue();
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Error polling issue status:', err);
                }
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [issue?.aiProcessingStatus, id]);

    const fetchIssue = async () => {
        try {
            const response = await issueAPI.getIssueById(id);
            setIssue(response.data.issue);
        } catch (err) {
            console.error('Error fetching issue:', err);
            setError('Failed to load issue details. It may not exist or you do not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (issue.citizenId === user.userId) {
            alert("You cannot upvote your own issue.");
            return;
        }

        if (issue.upvotedBy?.includes(user.userId)) {
            alert("You have already upvoted this issue.");
            return;
        }

        setUpvoteLoading(true);
        try {
            const response = await issueAPI.upvoteIssue(id);
            setIssue(prev => ({
                ...prev,
                upvotes: response.data.upvotes,
                upvotedBy: [...(prev.upvotedBy || []), user.userId]
            }));
        } catch (err) {
            console.error('Upvote failed:', err);
            alert(err.response?.data?.message || 'Failed to upvote');
        } finally {
            setUpvoteLoading(false);
        }
    };

    const handleDeleteIssue = async () => {
        if (window.confirm('Are you sure you want to delete this issue report? This action cannot be undone.')) {
            try {
                await issueAPI.deleteIssue(id);
                toast.success('Issue deleted successfully!');
                navigate('/dashboard');
            } catch (err) {
                console.error('Delete issue error:', err);
                toast.error(err.response?.data?.message || 'Failed to delete issue');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-center px-4">
                <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Issue</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link to="/issues" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Back to Issues
                </Link>
            </div>
        );
    }

    if (!issue) return null;

    const isOwner = user?.userId === issue.citizenId;
    const hasUpvoted = issue.upvotedBy?.includes(user?.userId);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <Link to="/issues" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors">
                    <FaArrowLeft className="mr-2" /> Back to All Issues
                </Link>

                {issue.aiProcessingStatus === 'processing' && (
                    <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-lg border border-blue-400 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <div>
                                <h4 className="font-bold">🤖 AI Report Analysis in progress...</h4>
                                <p className="text-xs text-blue-100 mt-0.5">We are analyzing language, categories, and checking for duplicates. This page will auto-update.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="lg:flex">
                        {/* Image Section */}
                        <div className="lg:w-1/2 bg-gray-100 relative min-h-[400px]">
                            {issue.photos && issue.photos.length > 0 ? (
                                <img
                                    src={issue.photos[0]}
                                    alt={issue.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <span className="text-6xl">📷</span>
                                </div>
                            )}

                            {/* Upvote Button Overlay (Mobile) */}
                            <div className="absolute bottom-4 right-4 lg:hidden">
                                <button
                                    onClick={handleUpvote}
                                    disabled={upvoteLoading || (isOwner)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${hasUpvoted
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FaThumbsUp />
                                    <span>{issue.upvotes || 0}</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getPriorityColor(issue.priority)}`}>
                                        {issue.priority} Priority
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {issue.category}
                                    </span>

                                    {/* Prominent Tracking Code Badge */}
                                    {trackingCode && (
                                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-blue-700 shadow-xs">
                                            <span>#{trackingCode}</span>
                                            <button
                                                onClick={handleCopyTrackingCode}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Copy Tracking Code"
                                            >
                                                <FaCopy />
                                            </button>
                                            <Link
                                                to={`/track?code=${trackingCode}`}
                                                className="ml-1 text-blue-600 hover:underline font-sans text-[11px] flex items-center gap-1"
                                                title="Track Issue Status Timeline"
                                            >
                                                <FaSearch className="text-[10px]" /> Track
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {(user?.role === 'admin' || (isOwner && issue.status === 'pending')) && (
                                    <button
                                        onClick={handleDeleteIssue}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        <FaTrash /> Delete Issue
                                    </button>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{issue.title}</h1>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <FaCalendarAlt className="text-gray-400" />
                                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <FaUser className="text-gray-400" />
                                    <span>{issue.citizenName || 'Anonymous'}</span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Description</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {issue.description}
                                </p>
                            </div>

                            {/* Internal Admin Note (Admin & Staff Only) */}
                            {(user?.role === 'admin' || user?.role === 'staff') && (issue.internalNote || issue.adminNote) && (
                                <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1">
                                    <h3 className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-widest">
                                        <span>📝</span> Internal Admin Instructions / Note
                                    </h3>
                                    <p className="text-sm font-medium text-amber-800 italic">
                                        "{issue.internalNote || issue.adminNote}"
                                    </p>
                                </div>
                            )}

                            <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest mb-2">
                                    <FaMapMarkerAlt className="text-red-500" /> Location
                                </h3>
                                <p className="text-gray-700">{issue.location.address}</p>
                            </div>

                            {/* Upvote Section (Desktop) */}
                            <div className="mt-auto hidden lg:flex items-center justify-between pt-6 border-t border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Is this issue important to you?
                                </div>
                                <button
                                    onClick={handleUpvote}
                                    disabled={upvoteLoading || (isOwner)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1 ${hasUpvoted
                                        ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                                        } ${isOwner ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}`}
                                    title={isOwner ? "You cannot upvote your own issue" : "Upvote this issue"}
                                >
                                    <FaThumbsUp className={hasUpvoted ? '' : 'text-gray-400'} />
                                    <span>{issue.upvotes || 0} Upvotes</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status History */}
                    {/* Timeline / Tracking Section */}
                    <div className="bg-white border-t border-gray-100 p-8 lg:p-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                            <FaClock className="text-blue-600" /> Issue Timeline & Tracking
                        </h3>

                        {issue.statusHistory && issue.statusHistory.length > 0 ? (
                            <div className="relative">
                                {/* Vertical Line */}
                                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>

                                <div className="space-y-8">
                                    {[...issue.statusHistory].reverse().map((history, index) => {
                                        let icon;
                                        let bgColor;
                                        let badgeColor;

                                        switch (history.status) {
                                            case 'resolved':
                                                icon = <FaCheckCircle className="text-white text-lg" />;
                                                bgColor = 'bg-emerald-500';
                                                badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                                                break;
                                            case 'in-progress':
                                                icon = <FaClock className="text-white text-lg" />;
                                                bgColor = 'bg-blue-500';
                                                badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                                                break;
                                            case 'assigned':
                                                icon = <FaUser className="text-white text-lg" />;
                                                bgColor = 'bg-indigo-500';
                                                badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                                                break;
                                            case 'closed':
                                                icon = <FaCheckCircle className="text-white text-lg" />;
                                                bgColor = 'bg-gray-600';
                                                badgeColor = 'bg-gray-100 text-gray-800 border-gray-200';
                                                break;
                                            case 'rejected':
                                                icon = <FaExclamationTriangle className="text-white text-lg" />;
                                                bgColor = 'bg-red-600';
                                                badgeColor = 'bg-red-100 text-red-800 border-red-200';
                                                break;
                                            case 'boosted':
                                                icon = <FaThumbsUp className="text-white text-lg" />;
                                                bgColor = 'bg-purple-600';
                                                badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                                                break;
                                            default: // pending
                                                icon = <FaExclamationTriangle className="text-white text-lg" />;
                                                bgColor = 'bg-amber-500';
                                                badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                                        }

                                        return (
                                            <div key={index} className="relative pl-20 transition-all hover:bg-gray-50 rounded-xl p-4 -ml-4 group">
                                                {/* Stepper Dot/Icon */}
                                                <div className={`absolute left-0 top-3 w-12 h-12 rounded-full flex items-center justify-center shadow-sm z-10 border-[3px] border-white ${bgColor} ring-1 ring-gray-100 group-hover:scale-110 transition-transform`}>
                                                    {icon}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-3">
                                                    <div>
                                                        {/* Status Badge */}
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2 ${badgeColor}`}>
                                                            {history.status.replace('-', ' ')}
                                                        </span>

                                                        {/* User Info */}
                                                        <div className="text-xs text-gray-500 font-medium ml-1 flex items-center gap-1">
                                                            <FaUser className="text-gray-300" />
                                                            {history.updatedByRole ? (
                                                                <span className="capitalize font-bold text-gray-700">{history.updatedByRole}</span>
                                                            ) : 'Updated by'}
                                                            <span className="text-gray-400">•</span>
                                                            {history.updatedBy || 'System'}
                                                        </div>
                                                    </div>

                                                    {/* Date/Time */}
                                                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap mt-2 sm:mt-0 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                        <FaCalendarAlt className="text-gray-300" />
                                                        {new Date(history.timestamp).toLocaleString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Message/Note */}
                                                <div className="text-gray-700 text-sm bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm relative">
                                                    {/* Little arrow for bubble effect */}
                                                    <div className="absolute top-[-6px] left-4 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                                                    {history.comment}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-center py-6">No tracking history available.</p>
                        )}
                    </div>
                </div>

                {/* AI Analysis Section (Admin & Staff Only) */}
                {(user?.role === 'admin' || user?.role === 'staff') && (
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <span>🤖</span> AI Processing & Analysis Dashboard
                        </h3>
                        
                        {issue.aiProcessingStatus === 'processing' ? (
                            <div className="flex items-center gap-3 text-gray-500 py-4 animate-pulse">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>AI is currently running analysis on this report...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left column: Severity & Language */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Severity Analysis</h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border capitalize
                                                ${issue.severityLabel === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold' :
                                                  issue.severityLabel === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200 font-bold' :
                                                  issue.severityLabel === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200 font-bold' :
                                                  'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'}`}>
                                                {issue.severityLabel || 'Low'} Severity (Score: {issue.severityScore || 1}/10)
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                            "{issue.severityReason || 'No reasoning provided.'}"
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1.5">AI Classification</h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">
                                                {issue.specificIssueLabel || issue.aiCategory || 'Other'}
                                            </span>
                                            {/* Show fixed enum in muted style when it differs from specificIssueLabel */}
                                            {issue.specificIssueLabel && issue.specificIssueLabel !== issue.aiCategory && (
                                                <span className="text-xs text-gray-400 italic">
                                                    (classified as: {issue.aiCategory})
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                (Confidence: {((issue.aiCategoryConfidence || 0) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Language Detection</h4>
                                        <p className="text-sm text-gray-700">
                                            Detected input language: <span className="font-semibold uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded text-xs border border-blue-100 ml-1 inline-block">{issue.detectedLanguage || 'unknown'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Right column: Completeness & Duplicates */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Completeness Check</h4>
                                        {issue.isIncomplete ? (
                                            <div className="bg-red-50 text-red-800 border border-red-100 p-4 rounded-xl">
                                                <div className="font-bold flex items-center gap-2 text-sm text-red-900">
                                                    ⚠️ Needs Citizen Clarification
                                                </div>
                                                <p className="text-xs text-red-700 mt-1.5 bg-white/70 p-2.5 rounded border border-red-200/50">
                                                    {issue.missingInfoNote || 'Vague description or missing critical context.'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
                                                ✅ Report is complete and actionable
                                            </div>
                                        )}
                                    </div>

                                    {/* Duplicates Section */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Duplicate Detection</h4>
                                        {issue.duplicateOf ? (
                                            <div className="bg-purple-50 text-purple-800 border border-purple-100 p-4 rounded-xl">
                                                <div className="font-bold flex items-center gap-2 text-sm text-purple-900">
                                                    🔗 Possible Duplicate Detected
                                                </div>
                                                <p className="text-xs text-purple-700 mt-1">
                                                    Confidence level: <span className="font-bold">{((issue.duplicateConfidence || 0) * 100).toFixed(0)}%</span>
                                                </p>
                                                <Link 
                                                    to={`/issues/${issue.duplicateOf}`}
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold bg-white border border-purple-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                                >
                                                    View Original Report ➜
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-xl text-xs">
                                                No duplicates found.
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapsible Original Text */}
                                    <CollapsibleOriginalText text={issue.originalText || issue.description} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Collapsible helper component
const CollapsibleOriginalText = ({ text }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mt-4 shadow-sm">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-semibold text-gray-700 transition-colors"
            >
                <span>Original Submitted Text</span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-100 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50/50">
                    {text}
                </div>
            )}
        </div>
    );
};

export default IssueDetails;
