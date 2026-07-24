import { useState } from 'react';
import { issueAPI } from '../utils/api';
import { FaEye, FaSortAmountDown, FaFilter, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const AssignedIssues = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch Assigned Issues
    const { data: issues = [], isLoading } = useQuery({
        queryKey: ['assignedIssues', user.userId],
        queryFn: () => issueAPI.getAllIssues().then(res => {
            // Filter strictly for this staff member
            // Ideally backend should support ?assignedTo=me, but logic remains same as original
            const myIssues = res.data.issues.filter(i => i.assignedTo === user.userId);

            // Sort: Boosted/High priority first
            return myIssues.sort((a, b) => {
                if (a.isBoosted && !b.isBoosted) return -1;
                if (!a.isBoosted && b.isBoosted) return 1;
                const priorityWeight = { high: 3, medium: 2, low: 1 };
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            });
        }),
        enabled: !!user.userId
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ issueId, newStatus }) =>
            issueAPI.updateStatus(issueId, newStatus, `Status updated to ${newStatus}`),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['assignedIssues']);
            // Also invalidate single issue detail if it catches it
            queryClient.invalidateQueries(['issue', variables.issueId]);
            toast.success(`Issue marked as ${variables.newStatus}`);
        },
        onError: (error) => {
            toast.error('Failed to update: ' + (error.response?.data?.message || 'Error occurred'));
        }
    });

    const handleStatusUpdate = (issueId, newStatus) => {
        updateStatusMutation.mutate({ issueId, newStatus });
    };

    const filteredIssues = issues.filter(issue => {
        const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
        const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Assigned Issues</h1>
                        <p className="text-gray-600">Manage and resolve your assigned tasks</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search issues..."
                            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="working">Working</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Issue</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Priority</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Update Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIssues.map(issue => (
                                <tr key={issue._id} className={`hover:bg-gray-50/50 ${issue.isBoosted ? 'bg-purple-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0">
                                                {issue.photos?.[0] && <img src={issue.photos[0]} alt="" className="h-full w-full object-cover rounded" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{issue.title}</div>
                                                <div className="text-xs text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                            ${issue.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                issue.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {issue.priority}
                                        </span>
                                        {issue.isBoosted && (
                                            <span className="ml-2 px-2 py-1 rounded text-xs font-bold uppercase bg-purple-100 text-purple-700">
                                                Boosted
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white">
                                            {issue.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={issue.location.address}>
                                        {issue.location.address || 'No address'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:border-blue-500 cursor-pointer disabled:opacity-50"
                                            value=""
                                            onChange={(e) => handleStatusUpdate(issue._id, e.target.value)}
                                            disabled={updateStatusMutation.isLoading}
                                        >
                                            <option value="" disabled>Change Status...</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="working">Working</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/issues/${issue._id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-500">
                                        No assigned issues found.
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

export default AssignedIssues;
