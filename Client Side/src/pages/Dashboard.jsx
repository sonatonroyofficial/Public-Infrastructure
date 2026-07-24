import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI, userAPI, statsAPI } from '../utils/api';
import BangladeshIssueMap from '../components/BangladeshIssueMap';
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
    FaUserTie,
    FaTrash
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterDuplicate, setFilterDuplicate] = useState('all');
    const [sortBy, setSortBy] = useState('severityScoreDesc');
    const [searchTerm, setSearchTerm] = useState('');

    // Map Filter States (PHASE 5 & 6)
    const [mapCategory, setMapCategory] = useState('');
    const [mapSeverity, setMapSeverity] = useState('');
    const [mapDuplicate, setMapDuplicate] = useState('');
    const [mapStatus, setMapStatus] = useState('');
    const [isCriticalOnly, setIsCriticalOnly] = useState(false);
    const [mapRefreshKey, setMapRefreshKey] = useState(0);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

    // 60-second auto-refresh for map data
    useEffect(() => {
        const interval = setInterval(() => {
            setMapRefreshKey(prev => prev + 1);
            setLastRefreshedAt(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleManualRefreshMap = () => {
        setMapRefreshKey(prev => prev + 1);
        setLastRefreshedAt(new Date());
        toast.success('Map data refreshed!');
    };

    const toggleCriticalOnly = () => {
        if (!isCriticalOnly) {
            setIsCriticalOnly(true);
            setMapSeverity('critical_high');
        } else {
            setIsCriticalOnly(false);
            setMapSeverity('');
        }
    };

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
        enabled: Boolean(user?.role === 'admin')
    });

    // Assign Modal State
    const [assignModal, setAssignModal] = useState({
        isOpen: false,
        issueId: null,
        issueTitle: '',
        staffId: '',
        staffName: '',
        internalNote: ''
    });

    // Assign Issue Mutation
    const assignMutation = useMutation({
        mutationFn: ({ issueId, staffId, internalNote }) => issueAPI.assignIssue(issueId, staffId, internalNote),
        onSuccess: () => {
            queryClient.invalidateQueries(['allIssues']);
            queryClient.invalidateQueries(['dashboardStats']);
            setAssignModal({ isOpen: false, issueId: null, issueTitle: '', staffId: '', staffName: '', internalNote: '' });
            toast.success('Issue assigned to staff successfully!');
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

    // Delete Issue Mutation
    const deleteMutation = useMutation({
        mutationFn: (issueId) => issueAPI.deleteIssue(issueId),
        onSuccess: () => {
            queryClient.invalidateQueries(['allIssues']);
            queryClient.invalidateQueries(['dashboardStats']);
            toast.success('Issue deleted successfully!');
        },
        onError: (error) => {
            toast.error('Error deleting issue: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleAssignIssue = (issue, staffId) => {
        const foundStaff = staff.find(s => s._id === staffId);
        setAssignModal({
            isOpen: true,
            issueId: issue._id,
            issueTitle: issue.title || 'Untitled Issue',
            staffId: staffId,
            staffName: foundStaff ? foundStaff.name : '',
            internalNote: ''
        });
    };

    const handleConfirmAssign = () => {
        if (!assignModal.staffId) {
            toast.error('Please select a staff member');
            return;
        }
        assignMutation.mutate({
            issueId: assignModal.issueId,
            staffId: assignModal.staffId,
            internalNote: assignModal.internalNote
        });
    };

    const handleUpdateStatus = (issueId, status) => {
        statusMutation.mutate({ issueId, status });
    };

    const handleDeleteIssue = (issueId) => {
        if (window.confirm('Are you sure you want to delete this issue report? This action cannot be undone.')) {
            deleteMutation.mutate(issueId);
        }
    };

    const canDeleteIssue = (issue) => {
        if (!user) return false;
        if (user?.role === 'admin') return true;
        
        const currentUserId = String(user?.userId || user?._id || user?.id || '');
        const issueCitizenId = String(
            typeof issue.citizenId === 'object'
                ? (issue.citizenId?._id || issue.citizenId?.toString() || '')
                : (issue.citizenId || '')
        );

        const isOwner = (currentUserId && issueCitizenId && currentUserId === issueCitizenId) ||
                        (user?.email && issue.citizenEmail && user.email.toLowerCase() === issue.citizenEmail.toLowerCase());

        return isOwner && issue.status === 'pending';
    };

    const myIssueIds = Array.isArray(issues) ? issues
        .filter(i => {
            if (!user) return false;
            const currentUserId = String(user?.userId || user?._id || user?.id || '');
            const issueCitizenId = String(
                typeof i.citizenId === 'object'
                    ? (i.citizenId?._id || i.citizenId?.toString() || '')
                    : (i.citizenId || '')
            );
            return (currentUserId && issueCitizenId && currentUserId === issueCitizenId) ||
                   (user?.email && i.citizenEmail && user.email.toLowerCase() === i.citizenEmail.toLowerCase());
        })
        .map(i => (i._id ? i._id.toString() : i.id)) : [];

    const isLoading = statsLoading || issuesLoading;

    const filteredIssues = Array.isArray(issues) ? issues.filter(issue => {
        const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
        const matchesSeverity = filterSeverity === 'all' || (issue.severityLabel || 'Low').toLowerCase() === filterSeverity.toLowerCase();
        
        let matchesDuplicate = true;
        if (filterDuplicate === 'duplicate') {
            matchesDuplicate = issue.duplicateStatus === 'possible_duplicate' || issue.duplicateStatus === 'confirmed_duplicate';
        } else if (filterDuplicate === 'none') {
            matchesDuplicate = !issue.duplicateStatus || issue.duplicateStatus === 'none';
        }

        const matchesSearch = (issue.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (issue.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (issue.aiSummaryEn?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
        return matchesStatus && matchesSeverity && matchesDuplicate && matchesSearch;
    }) : [];

    const sortedIssues = [...filteredIssues].sort((a, b) => {
        if (sortBy === 'severityScoreDesc') {
            return (b.severityScore || 0) - (a.severityScore || 0);
        }
        if (sortBy === 'createdAtDesc') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });

    if (!user || isLoading) {
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

                    {/* Resolved Issues */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">
                                Resolved Issues
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                {stats.issues?.resolved || 0}
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

            {/* Interactive Map with My Reports Highlight & Admin Triage Filters (PHASE 5 & 6) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <span>🗺️</span> {user.role === 'citizen' ? 'My Area & Live Issues Map' : 'National Infrastructure Overview Map'}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Live Sync (60s)
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {user.role === 'citizen'
                                ? 'Explore reported issues nationwide. Your submitted reports are highlighted with golden star (★) markers.'
                                : 'National spatial analysis, critical hazard triage, duplicate clusters & report management click-through.'}
                        </p>
                    </div>

                    {/* Filter Controls & Management Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Triage Toggle: Critical & High Only */}
                        <button
                            onClick={toggleCriticalOnly}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isCriticalOnly ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'}`}
                        >
                            <span>🚨</span> Critical & High Only
                        </button>

                        <select
                            value={mapCategory}
                            onChange={(e) => setMapCategory(e.target.value)}
                            className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <option value="">All Categories</option>
                            <option value="Pothole">Pothole</option>
                            <option value="Water Leak">Water Leak</option>
                            <option value="Illegal Dumping">Illegal Dumping</option>
                            <option value="Broken Streetlight">Broken Streetlight</option>
                            <option value="Damaged Footpath">Damaged Footpath</option>
                            <option value="Other">Other</option>
                        </select>

                        <select
                            value={mapSeverity}
                            onChange={(e) => {
                                setMapSeverity(e.target.value);
                                setIsCriticalOnly(e.target.value === 'critical_high');
                            }}
                            className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <option value="">All Severity</option>
                            <option value="critical_high">🚨 Critical & High Only</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>

                        <select
                            value={mapStatus}
                            onChange={(e) => setMapStatus(e.target.value)}
                            className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <option value="">All Status</option>
                            <option value="open">Open (Active)</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        {user.role === 'admin' && (
                            <select
                                value={mapDuplicate}
                                onChange={(e) => setMapDuplicate(e.target.value)}
                                className="text-xs font-medium border border-purple-200 rounded-lg px-3 py-2 bg-purple-50 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            >
                                <option value="">All Duplicates</option>
                                <option value="duplicate">🔗 Possible/Confirmed Duplicates</option>
                                <option value="none">Original Reports Only</option>
                            </select>
                        )}

                        <button
                            onClick={handleManualRefreshMap}
                            title="Refresh Map Data"
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            🔄 Refresh
                        </button>

                        {(mapCategory || mapSeverity || mapStatus || mapDuplicate || isCriticalOnly) && (
                            <button
                                onClick={() => {
                                    setMapCategory('');
                                    setMapSeverity('');
                                    setMapStatus('');
                                    setMapDuplicate('');
                                    setIsCriticalOnly(false);
                                }}
                                className="text-xs text-blue-600 font-semibold hover:underline px-2 cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                <div key={mapRefreshKey}>
                    <BangladeshIssueMap
                        mode={user.role === 'admin' ? 'admin' : user.role === 'staff' ? 'staff' : 'citizen'}
                        myReportIds={myIssueIds}
                        filters={{
                            category: mapCategory,
                            severity: mapSeverity,
                            status: mapStatus,
                            duplicateStatus: mapDuplicate
                        }}
                    />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2 px-1">
                    <span>Click any pin to manage issue details & assign staff.</span>
                    <span>Last updated: {lastRefreshedAt.toLocaleTimeString()}</span>
                </div>
            </div>

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

                    <div className="flex flex-wrap gap-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
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

                        <div className="relative">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                            >
                                <option value="all">All Severity</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                                value={filterDuplicate}
                                onChange={(e) => setFilterDuplicate(e.target.value)}
                            >
                                <option value="all">All Duplicates</option>
                                <option value="duplicate">Duplicates Only</option>
                                <option value="none">Non-Duplicates Only</option>
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="severityScoreDesc">Severity (High to Low)</option>
                                <option value="createdAtDesc">Newest First</option>
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
                                <th className="px-6 py-4">AI Severity</th>
                                <th className="px-6 py-4">Assigned To</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedIssues.length > 0 ? (
                                sortedIssues.map((issue) => (
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
                                                    <div className="flex items-center gap-2">
                                                        <Link to={`/issues/${issue._id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                                                            {issue.title || 'Untitled Issue'}
                                                        </Link>
                                                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                                            #{issue._id ? issue._id.toString().substring(0, 8).toUpperCase() : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">
                                                        {issue.aiSummaryEn || issue.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            {issue.specificIssueLabel || issue.aiCategory || (issue.category || 'general').replace('_', ' ')}
                                                        </span>
                                                        {issue.isIncomplete && (
                                                            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                                                ⚠️ Needs clarification
                                                            </span>
                                                        )}
                                                        {(issue.duplicateStatus === 'possible_duplicate' || issue.duplicateStatus === 'confirmed_duplicate') && (
                                                            <Link
                                                                to={`/issues/${issue.duplicateOf}`}
                                                                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                🔗 Duplicate ({issue.duplicateStatus === 'confirmed_duplicate' ? 'Confirmed' : 'Possible'})
                                                            </Link>
                                                        )}
                                                    </div>
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
                                            {issue.aiProcessingStatus === 'processing' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                                                    🤖 AI analyzing...
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                    ${issue.severityLabel === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold' :
                                                      issue.severityLabel === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                      issue.severityLabel === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                      'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                                                    {issue.severityLabel || 'Low'} ({issue.severityScore || 1})
                                                </span>
                                            )}
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
                                                        onChange={(e) => {
                                                            const selectedStaffId = e.target.value;
                                                            if (selectedStaffId) {
                                                                handleAssignIssue(issue, selectedStaffId);
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                        value=""
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

                                                {canDeleteIssue(issue) && (
                                                    <button
                                                        onClick={() => handleDeleteIssue(issue._id)}
                                                        title="Delete Issue"
                                                        className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <FaTrash className="w-3 h-3 text-red-500" />
                                                        <span>Delete</span>
                                                    </button>
                                                )}
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

            {/* Assign Staff & Internal Note Modal */}
            {assignModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2 text-gray-900 font-extrabold text-lg">
                                <span>👷</span> Assign Staff & Internal Note
                            </div>
                            <button
                                onClick={() => setAssignModal({ isOpen: false, issueId: null, issueTitle: '', staffId: '', staffName: '', internalNote: '' })}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Target Issue</span>
                                <span className="text-sm font-bold text-slate-900 line-clamp-1">{assignModal.issueTitle}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Assigned Field Staff Member
                                </label>
                                <select
                                    value={assignModal.staffId}
                                    onChange={(e) => {
                                        const found = staff.find(s => s._id === e.target.value);
                                        setAssignModal(prev => ({ ...prev, staffId: e.target.value, staffName: found ? found.name : '' }));
                                    }}
                                    className="w-full text-sm font-medium border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" disabled>Select Staff Member...</option>
                                    {staff.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>📝 Internal Note / Instructions for Staff</span>
                                    <span className="text-[10px] text-gray-400 font-normal">Visible to Staff & Admin</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={assignModal.internalNote}
                                    onChange={(e) => setAssignModal(prev => ({ ...prev, internalNote: e.target.value }))}
                                    placeholder="Enter internal instructions for field staff (e.g. Inspect water leak on site immediately, bring heavy repair equipment)..."
                                    className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setAssignModal({ isOpen: false, issueId: null, issueTitle: '', staffId: '', staffName: '', internalNote: '' })}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAssign}
                                disabled={assignMutation.isLoading || !assignModal.staffId}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {assignMutation.isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Assigning...</span>
                                    </>
                                ) : (
                                    <span>Confirm & Assign Staff</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
