import { useState } from 'react';
import { userAPI } from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner, FaUsers, FaUserShield } from 'react-icons/fa';

const ManageStaff = () => {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', address: '', role: 'staff'
    });

    // Fetch Staff
    const { data: staff = [], isLoading } = useQuery({
        queryKey: ['staffList'],
        queryFn: () => userAPI.getAllUsers({ role: 'staff' }).then(res => res.data.users || [])
    });

    // Create Staff Mutation
    const createStaffMutation = useMutation({
        mutationFn: (data) => userAPI.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['staffList']);
            toast.success('Staff account created successfully!');
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', phone: '', address: '', role: 'staff' });
        },
        onError: (error) => {
            toast.error('Error creating staff: ' + (error.response?.data?.message || 'Failed'));
        }
    });

    // Delete Staff Mutation
    const deleteStaffMutation = useMutation({
        mutationFn: (id) => userAPI.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['staffList']);
            toast.success('Staff deleted successfully');
        },
        onError: (error) => {
            toast.error('Error deleting staff: ' + (error.response?.data?.message || 'Failed'));
        }
    });

    const handleCreateStaff = (e) => {
        e.preventDefault();
        createStaffMutation.mutate(formData);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member? This cannot be undone.')) return;
        deleteStaffMutation.mutate(id);
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <FaUserShield className="text-blue-600" /> Manage Staff
                    </h1>
                    <p className="text-gray-600">Add, remove, and manage support staff.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <FaUserPlus /> Add Staff Member
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Staff Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staff.map(s => (
                            <tr key={s._id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{s.name}</div>
                                            <div className="text-xs text-gray-500">ID: {s._id.slice(-6)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{s.email}</div>
                                    <div className="text-xs text-gray-500">{s.phone || 'No phone'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(s.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 p-2">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">No staff members found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Add New Staff</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createStaffMutation.isLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {createStaffMutation.isLoading && <FaSpinner className="animate-spin" />}
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default ManageStaff;
