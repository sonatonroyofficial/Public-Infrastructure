import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FaEye, FaSearch, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaThumbsUp } from 'react-icons/fa';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const AllIssues = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // Filter States
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
        search: ''
    });

    // Fetch Issues with React Query
    const { data, isLoading } = useQuery({
        queryKey: ['issues', page, filters],
        queryFn: () => {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            return issueAPI.getAllIssues({ ...activeFilters, page, limit: 6 }).then(res => res.data);
        },
        keepPreviousData: true
    });

    const issues = data?.issues || [];
    const pagination = data?.pagination || { totalPages: 1 };

    // Upvote Mutation
    const upvoteMutation = useMutation({
        mutationFn: (issueId) => issueAPI.upvoteIssue(issueId),
        onMutate: async (issueId) => {
            await queryClient.cancelQueries(['issues', page, filters]);
            const previousData = queryClient.getQueryData(['issues', page, filters]);

            queryClient.setQueryData(['issues', page, filters], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    issues: old.issues.map(issue => {
                        if (issue._id === issueId) {
                            return {
                                ...issue,
                                upvotes: (issue.upvotes || 0) + 1,
                                upvotedBy: [...(issue.upvotedBy || []), user.userId]
                            };
                        }
                        return issue;
                    })
                };
            });

            return { previousData };
        },
        onError: (err, issueId, context) => {
            queryClient.setQueryData(['issues', page, filters], context.previousData);
            toast.error("Failed to upvote. Please try again.");
        },
        onSettled: () => {
            queryClient.invalidateQueries(['issues', page, filters]);
        }
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleUpvote = (e, issue) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (issue.citizenId === user.userId) {
            toast.error("You cannot upvote your own issue.");
            return;
        }

        if (issue.upvotedBy?.includes(user.userId)) {
            toast.error("You have already upvoted this issue.");
            return;
        }

        upvoteMutation.mutate(issue._id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-50 text-red-700 border-red-200';
            case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'low': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="py-12 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">All Reported Issues</h1>
                    <p className="text-lg text-gray-600">Browse community issues, track progress, and upvote important reports.</p>
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 sticky top-[80px] z-30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Search..."
                                value={filters.search}
                                onChange={handleFilterChange}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                name="category"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Categories</option>
                                <option value="pothole">Pothole</option>
                                <option value="streetlight">Streetlight</option>
                                <option value="water_leakage">Water Leakage</option>
                                <option value="garbage">Garbage Overflow</option>
                                <option value="footpath">Damaged Footpath</option>
                                <option value="other">Other Issues</option>
                            </select>
                            <FaFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                name="status"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                            <FaFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Priority Filter */}
                        <div className="relative">
                            <select
                                name="priority"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                value={filters.priority}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Priorities</option>
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                            <FaFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Issues Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No issues found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {issues.map((issue) => {
                                const isOwner = user?.userId === issue.citizenId;
                                const hasUpvoted = issue.upvotedBy?.includes(user?.userId);

                                return (
                                    <motion.div
                                        key={issue._id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden group"
                                        variants={itemVariants}
                                    >
                                        {/* Image */}
                                        <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                                            {issue.photos && issue.photos.length > 0 ? (
                                                <img
                                                    src={issue.photos[0]}
                                                    alt={issue.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300 text-4xl">📷</div>
                                            )}
                                            {/* Priority Badge */}
                                            <div className="absolute top-4 left-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border shadow-sm ${getPriorityColor(issue.priority)} bg-white/90 backdrop-blur-sm`}>
                                                    {issue.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(issue.status)}`}>
                                                    {issue.status}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded">
                                                    {issue.category}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1" title={issue.title}>
                                                <Link to={`/issues/${issue._id}`} className="hover:text-blue-600 transition-colors">
                                                    {issue.title}
                                                </Link>
                                            </h3>

                                            <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-red-400 flex-shrink-0" />
                                                <span className="truncate">{issue.location.address}</span>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                                                {/* Upvote Button */}
                                                <button
                                                    onClick={(e) => handleUpvote(e, issue)}
                                                    disabled={isOwner} // Disable if owner
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${hasUpvoted
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-white hover:shadow hover:text-blue-600 border border-transparent hover:border-gray-200'
                                                        } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={isOwner ? "You cannot upvote your own issue" : "Upvote"}
                                                >
                                                    <FaThumbsUp className={hasUpvoted ? '' : 'text-gray-400'} />
                                                    <span>{issue.upvotes || 0}</span>
                                                </button>

                                                {/* View Details Button */}
                                                <Link
                                                    to={`/issues/${issue._id}`}
                                                    className="px-4 py-2 bg-white border border-blue-200 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                                                >
                                                    <FaEye /> Details
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-600">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllIssues;
