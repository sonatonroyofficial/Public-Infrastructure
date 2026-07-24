import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { FaUser, FaCrown, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaEdit, FaSave, FaCreditCard } from 'react-icons/fa';

const Profile = () => {
    const { user, login } = useAuth(); // login used to update user context after profile update
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await userAPI.updateProfile(formData);
            // Update local context manually or fetch profile again. 
            // Since useAuth stores user in localStorage, we might need to update it.
            // For now, assume a page refresh or context update is needed.
            alert('Profile updated successfully!');
            setIsEditing(false);
            window.location.reload(); // Simple way to refresh context
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubscribe = async () => {
        if (!window.confirm("Confirm payment of 1000tk for Premium Subscription?")) return;

        setLoading(true);
        try {
            await userAPI.subscribe(1000);
            alert('Congratulations! You are now a Premium member.');
            window.location.reload(); // Refresh to update user role/premium status in context
        } catch (error) {
            alert(error.response?.data?.message || 'Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Please log in to view profile.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="bg-white p-1 rounded-full shadow-lg">
                                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl text-gray-400">
                                    <FaUser />
                                </div>
                            </div>
                            {user.isPremium && (
                                <div className="absolute top-14 left-20 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-yellow-200">
                                    <FaCrown /> Premium
                                </div>
                            )}
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="mb-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm flex items-center gap-2 transition-colors"
                            >
                                {isEditing ? 'Cancel Edit' : <><FaEdit /> Edit Profile</>}
                            </button>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500 font-medium capitalize flex items-center gap-2 mt-1">
                                {user.role} Account
                                {user.isBlocked && <span className="text-red-600 text-xs bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Blocked</span>}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Info */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Profile Details Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FaUser className="text-blue-500" /> Personal Information
                            </h2>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500' : 'border-transparent bg-gray-50 text-gray-600'}`}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                disabled
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-gray-50 text-gray-500 cursor-not-allowed"
                                                value={user.email}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number</label>
                                        <div className="relative">
                                            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                placeholder="Add phone number"
                                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500' : 'border-transparent bg-gray-50 text-gray-600'}`}
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Address</label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                placeholder="Add address"
                                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isEditing ? 'border-gray-300 bg-white focus:ring-2 focus:ring-blue-500' : 'border-transparent bg-gray-50 text-gray-600'}`}
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                        >
                                            <FaSave /> Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Subscription & Status */}
                    <div className="space-y-8">
                        {/* Subscription Card */}
                        <div className={`rounded-2xl shadow-sm border p-6 ${user.isPremium ? 'bg-gradient-to-br from-gray-900 to-black text-white border-black' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FaCrown className={user.isPremium ? 'text-yellow-400' : 'text-gray-300'} />
                                    Subscription
                                </h3>
                                {user.isPremium ? (
                                    <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded border border-yellow-500/30">ACTIVE</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">FREE</span>
                                )}
                            </div>

                            {user.isPremium ? (
                                <div>
                                    <p className="text-gray-300 text-sm mb-4">You have unlimited access to report issues and report priority problems.</p>
                                    <div className="text-xs text-gray-500">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600 text-sm mb-4">Upgrade to Premium to report unlimited issues and get priority support.</p>
                                    <div className="mb-4">
                                        <span className="text-2xl font-bold text-gray-900">1000tk</span>
                                        <span className="text-gray-500 text-sm"> / one-time</span>
                                    </div>
                                    <button
                                        onClick={handleSubscribe}
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-bold rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Processing...' : <><FaCreditCard /> Upgrade Now</>}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Account Status */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Account Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Joined</span>
                                    <span className="text-sm text-gray-500 flex items-center gap-2">
                                        <FaCalendarAlt />
                                        {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Warning Status</span>
                                    {user.isBlocked ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-red-600 font-bold flex items-center gap-1">
                                                <FaExclamationTriangle /> Restricted
                                            </span>
                                            <span className="text-xs text-red-500 mt-1">Please contact authorities.</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-green-600 font-bold">Good Standing</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
