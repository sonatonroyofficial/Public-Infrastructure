import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaCheckCircle, FaExclamationTriangle, FaThumbsUp, FaClock } from 'react-icons/fa';

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [upvoteLoading, setUpvoteLoading] = useState(false);

    useEffect(() => {
        fetchIssue();
    }, [id]);

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
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(issue.status)}`}>
                                    {issue.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getPriorityColor(issue.priority)}`}>
                                    {issue.priority} Priority
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {issue.category}
                                </span>
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
            </div>
        </div>
    );
};

export default IssueDetails;
