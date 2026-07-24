import { useState } from 'react';
import { userAPI } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FaUserShield, FaBan, FaUnlock, FaCrown, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const ManageUsers = () => {
    const queryClient = useQueryClient();
    const [actionLoading, setActionLoading] = useState(null);

    // Fetch Users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['citizenUsers'],
        queryFn: () => userAPI.getAllUsers({ role: 'citizen' }).then(res => res.data.users || [])
    });

    // Block/Unblock Mutation
    const toggleBlockMutation = useMutation({
        mutationFn: ({ userId, isBlocked }) => userAPI.blockUser(userId, isBlocked),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['citizenUsers']);
            const action = variables.isBlocked ? 'blocked' : 'unblocked';
            toast.success(`User ${action} successfully`);
        },
        onError: (error, variables) => {
            const action = variables.isBlocked ? 'block' : 'unblock';
            toast.error(`Error ${action}ing user: ` + (error.response?.data?.message || 'Failed'));
        }
    });

    const handleBlockToggle = (userId, currentStatus, userName) => {
        const action = currentStatus ? 'Unblock' : 'Block';
        if (!window.confirm(`Are you sure you want to ${action} ${userName}?`)) return;

        setActionLoading(userId);
        toggleBlockMutation.mutate({ userId, isBlocked: !currentStatus }, {
            onSettled: () => setActionLoading(null)
        });
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaUserShield className="text-blue-600" /> Manage Users
                </h1>
                <p className="text-gray-600">Oversee citizen accounts and manage access.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subscription</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u._id} className={`hover:bg-gray-50/50 ${u.isBlocked ? 'bg-red-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold
                                            ${u.isBlocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.isPremium ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                            <FaCrown className="text-[10px]" /> Premium
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Free Tier</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {u.isBlocked ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            <FaBan className="text-[10px]" /> Blocked
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            <FaCheck className="text-[10px]" /> Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleBlockToggle(u._id, u.isBlocked, u.name)}
                                        disabled={actionLoading === u._id}
                                        className={`p-2 rounded-lg transition-colors ${u.isBlocked
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-red-500 hover:bg-red-50'
                                            }`}
                                        title={u.isBlocked ? 'Unblock User' : 'Block User'}
                                    >
                                        {actionLoading === u._id ? <FaSpinner className="animate-spin" /> : (
                                            u.isBlocked ? <FaUnlock /> : <FaBan />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default ManageUsers;
