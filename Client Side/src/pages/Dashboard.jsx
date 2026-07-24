import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { issueAPI, userAPI, statsAPI } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    FaUsers,
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaTimes,
    FaSearch,
    FaFilter,
    FaChartLine,
    FaClipboardList,
    FaUserTie
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Dashboard Stats
    const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => statsAPI.getDashboardStats().then(res => res.data),
    });

    // Fetch All Issues
    const { data: issues = [], isLoading: issuesLoading, refetch: refetchIssues } = useQuery({
        queryKey: ['allIssues'],
        queryFn: () => issueAPI.getAllIssues().then(res => Array.isArray(res.data.issues) ? res.data.issues : []),
    });

    // Fetch Staff (Admin Only)
    const { data: staff = [] } = useQuery({
        queryKey: ['staffUsers'],
        queryFn: () => userAPI.getAllUsers({ role: 'staff' }).then(res => res.data.users || []),
        enabled: user.role === 'admin'
    });

    // Assign Issue Mutation
    const assignMutation = useMutation({
        mutationFn: ({ issueId, staffId }) => issueAPI.assignIssue(issueId, staffId),
        onSuccess: () => {
            queryClient.invalidateQueries(['allIssues']);
            queryClient.invalidateQueries(['dashboardStats']);
            toast.success('Issue assigned successfully!');
        },
        onError: (error) => {
            toast.error('Error assigning issue: ' + (error.response?.data?.message || error.message));
        }
    });

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: ({ issueId, status }) => issueAPI.updateStatus(issueId, status, `Status updated to ${status}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['allIssues']);
            queryClient.invalidateQueries(['dashboardStats']);
            toast.success('Status updated successfully!');
        },
        onError: (error) => {
            toast.error('Error updating status: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleAssignIssue = (issueId, staffId) => {
        assignMutation.mutate({ issueId, staffId });
    };

    const handleUpdateStatus = (issueId, status) => {
        statusMutation.mutate({ issueId, status });
    };

    const isLoading = statsLoading || issuesLoading;

    const filteredIssues = Array.isArray(issues) ? issues.filter(issue => {
        const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
        const matchesSearch = (issue.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (issue.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }) : [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-72px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Welcome back, {user.name}! <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{user.role} Account</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { refetchStats(); refetchIssues(); }} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                        Refresh Data
                    </button>
                    {user.role === 'citizen' && (
                        <button onClick={() => window.location.href = '/report-issue'} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                            Report New Issue
                        </button>
                    )}
                </div>
            </div>

            {statsError && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
                    <p className="text-red-600 font-medium">Unable to load dashboard statistics.</p>
                    <button onClick={refetchStats} className="mt-2 text-sm text-red-700 underline hover:text-red-800">Try Again</button>
                </div>
            )}

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Common: Total Issues */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Issues</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.issues?.total || 0}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <FaClipboardList className="text-xl" />
                        </div>
                    </div>

                    {/* Admin: Total Users / Staff: In Progress */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                {user.role === 'admin' ? 'Total Users' : 'In Progress'}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                {user.role === 'admin' ? (stats.users?.total || 0) : (stats.issues?.inProgress || 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            {user.role === 'admin' ? <FaUsers className="text-xl" /> : <FaClock className="text-xl" />}
                        </div>
                    </div>

                    {/* Admin: Revenue / Staff: Resolved */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                {user.role === 'admin' ? 'Total Revenue' : 'Resolved'}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                {user.role === 'admin' ? `${stats.revenue || 0} tk` : (stats.issues?.resolved || 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <FaCheckCircle className="text-xl" />
                        </div>
                    </div>

                    {/* Admin: Rejected / Staff: Today or Pending */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                {user.role === 'admin' ? 'Rejected Issues' : 'Today\'s Updates'}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                {user.role === 'admin' ? (stats.issues?.rejected || 0) : (stats.issues?.today || 0)}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            {user.role === 'admin' ? <FaTimes className="text-xl" /> : <FaChartLine className="text-xl" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Charts Section */}
            {user.role === 'staff' && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Task Overview</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'In Progress', value: stats.issues?.inProgress || 0 },
                                    { name: 'Pending', value: stats.issues?.pending || 0 },
                                    { name: 'Resolved', value: stats.issues?.resolved || 0 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Activity</h3>
                        <div className="flex items-center justify-center h-64 flex-col">
                            <div className="text-6xl font-bold text-blue-600 mb-2">{stats.issues?.today || 0}</div>
                            <p className="text-gray-500">Tasks Updated Today</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaExclamationTriangle className="text-gray-400" />
                        Manage Issues
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Issue Details</th>
                                <th className="px-6 py-4">Citizen</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Assigned To</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIssues.length > 0 ? (
                                filteredIssues.map((issue) => (
                                    <tr key={issue._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {issue.photos && issue.photos.length > 0 ? (
                                                    <img src={issue.photos[0]} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <FaExclamationTriangle />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{issue.title || 'Untitled Issue'}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{(issue.category || 'general').replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{issue.citizenName || 'Anonymous'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                                    issue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                        issue.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    issue.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-green-100 text-green-800'}`}>
                                                {issue.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {issue.assignedStaffName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs">
                                                        <FaUserTie />
                                                    </div>
                                                    <span className="text-sm text-gray-700">{issue.assignedStaffName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.role === 'admin' && issue.status === 'pending' && (
                                                    <select
                                                        onChange={(e) => handleAssignIssue(issue._id, e.target.value)}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Assign...</option>
                                                        {staff.map((s) => (
                                                            <option key={s._id} value={s._id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                )}

                                                {(user.role === 'staff' || user.role === 'admin') &&
                                                    (user.role === 'admin' || issue.assignedTo === user.id) &&
                                                    issue.status !== 'closed' && (
                                                        <select
                                                            value={issue.status}
                                                            onChange={(e) => handleUpdateStatus(issue._id, e.target.value)}
                                                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="assigned">Assigned</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="closed">Closed</option>
                                                        </select>
                                                    )}

                                                <button className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                                                    <FaUsers />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FaClipboardList className="text-4xl text-gray-200 mb-3" />
                                            <p className="font-medium">No issues found</p>
                                            <p className="text-sm">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Showing {filteredIssues.length} issues</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
