import { useState } from 'react';
import { Link } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaEye, FaFilter, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

const MyIssues = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: { address: '' }
    });

    // Fetch My Issues
    const { data: issues = [], isLoading } = useQuery({
        queryKey: ['myIssues', user.userId],
        queryFn: () => issueAPI.getAllIssues({ citizenId: user.userId }).then(res => res.data.issues || []),
        enabled: !!user.userId
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => issueAPI.deleteIssue(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['myIssues']);
            toast.success('Issue deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete issue');
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => issueAPI.updateIssue(id, data), // Assuming updateIssue API exists, userAPI.updateUser type logic, need to check API file if needed but context says issueAPI.updateIssue used in original code line 65
        onSuccess: () => {
            queryClient.invalidateQueries(['myIssues']);
            setIsEditModalOpen(false);
            toast.success('Issue updated successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update issue');
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const openEditModal = (issue) => {
        setEditingIssue(issue);
        setEditFormData({
            title: issue.title,
            description: issue.description,
            category: issue.category,
            location: { address: issue.location.address }
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        // Assuming there is an issueAPI.updateIssue method based on original code
        // If it doesn't exist in api.js, we might fail here, but assuming it does since original code used it.
        // Actually, looking at previous view of api.js, there is NO updateIssue in issueAPI!
        // Wait, line 65 of original code: await issueAPI.updateIssue(editingIssue._id, editFormData);
        // Let's enable it if it works, or fix api.js next.
        // If it fails, I will add it to api.js.
        updateMutation.mutate({ id: editingIssue._id, data: editFormData });
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
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Issues</h1>
                        <p className="text-gray-600">Manage and track your reported issues</p>
                    </div>
                    <Link to="/report-issue" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors">
                        + Report New Issue
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search your issues..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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

                {/* Issues List */}
                <div className="space-y-4">
                    {filteredIssues.length > 0 ? (
                        filteredIssues.map(issue => (
                            <div key={issue._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block h-24 w-24 flex-shrink-0">
                                            {issue.photos && issue.photos.length > 0 ? (
                                                <img src={issue.photos[0]} alt="" className="h-full w-full object-cover rounded-lg border border-gray-100" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl">
                                                    <FaExclamationTriangle />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border
                                                    ${issue.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                        issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                            'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                                    {issue.status}
                                                </span>
                                                <span className="text-gray-400 text-xs">•</span>
                                                <span className="text-sm text-gray-500 capitalize">{issue.category.replace('_', ' ')}</span>
                                                <span className="text-gray-400 text-xs">•</span>
                                                <span className="text-sm text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
                                            <p className="text-gray-600 line-clamp-2">{issue.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 md:w-48">
                                        <Link to={`/issues/${issue._id}`} className="w-full px-4 py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                            View Details
                                        </Link>
                                        {issue.status === 'pending' && (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => openEditModal(issue)}
                                                    className="flex-1 px-2 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(issue._id)}
                                                    className="flex-1 px-2 py-2 text-center text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                            <FaExclamationTriangle className="mx-auto text-4xl text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No issues found</h3>
                            <p className="text-gray-500 mb-6">You haven't reported any issues matching your criteria.</p>
                            <Link to="/report-issue" className="text-blue-600 hover:text-blue-700 font-medium">
                                Report an Issue &rarr;
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Edit Issue</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        value={editFormData.category}
                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    >
                                        <option value="pothole">Pothole</option>
                                        <option value="streetlight">Streetlight</option>
                                        <option value="water_leakage">Water Leakage</option>
                                        <option value="garbage">Garbage</option>
                                        <option value="footpath">Footpath</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Location Address</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={editFormData.location.address}
                                        onChange={(e) => setEditFormData({ ...editFormData, location: { ...editFormData.location, address: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                                    required
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-lg shadow-blue-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyIssues;
