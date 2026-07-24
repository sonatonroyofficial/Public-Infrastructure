import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { FaCloudUploadAlt, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ReportIssue = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'pothole',
        location: { address: '', latitude: 0, longitude: 0 },
        photos: []
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    photos: [reader.result] // Store base64 string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const toastId = toast.loading('Submitting issue...');

        try {
            await issueAPI.createIssue(formData);
            toast.success('Issue reported successfully!', { id: toastId });
            navigate('/my-issues');
        } catch (err) {
            console.error('Report error:', err);
            const message = err.response?.data?.message || 'Failed to report issue';
            setError(message);
            toast.error(message, { id: toastId });

            // Handle Upgrade Requirement
            if (err.response?.data?.requiresUpgrade) {
                if (window.confirm(`${message}\n\nWould you like to upgrade to Premium?`)) {
                    navigate('/profile');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-blue-600 px-8 py-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
                    <p className="text-blue-100">Help us improve your community by reporting infrastructure problems.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                            <FaExclamationCircle className="mt-1 flex-shrink-0" />
                            <div>
                                <p className="font-bold">Submission Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Issue Title</label>
                            <input
                                type="text"
                                placeholder="e.g., Deep Pothole on Main Street"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="pothole">Pothole</option>
                                    <option value="streetlight">Broken Streetlight</option>
                                    <option value="water_leakage">Water Leakage</option>
                                    <option value="garbage">Garbage Pile</option>
                                    <option value="footpath">Damaged Footpath</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Location Address</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g., 123 Main St, Near Central Park"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.location.address}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            location: { ...formData.location, address: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                                placeholder="Please describe the issue in detail..."
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Upload Photo</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {formData.photos.length > 0 ? (
                                    <div className="flex flex-col items-center">
                                        <img src={formData.photos[0]} alt="Preview" className="h-32 object-cover rounded-lg mb-2 shadow-sm" />
                                        <span className="text-sm text-green-600 font-medium">Photo selected (Click to change)</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <FaCloudUploadAlt className="text-4xl mb-2 text-gray-400" />
                                        <span className="font-medium">Click to upload photo</span>
                                        <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/my-issues')}
                            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Submitting...' : 'Submit Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
