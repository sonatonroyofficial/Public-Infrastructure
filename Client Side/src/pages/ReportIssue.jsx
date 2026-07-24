import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../utils/api';
import { FaCloudUploadAlt, FaMapMarkerAlt, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BANGLADESH_LOCATIONS = {
    "Dhaka": {
        "Dhaka North": ["Mirpur 10", "Gulshan 2", "Uttara Sector 3", "Banani", "Tejgaon"],
        "Dhaka South": ["Dhanmondi Road 8", "Lalbagh", "Mohammadpur", "Motijheel", "Baily Road"],
        "Savar": ["Savar Bazar", "EPZ Area", "Jahangirnagar University"]
    },
    "Chattogram": {
        "Chattogram City": ["GEC Circle", "Agrabad", "Halishahar", "Panchlaish", "Chawkbazar"],
        "Hathazari": ["University Area", "Hathazari Sadar"],
        "Cox's Bazar": ["Kolatoli Beach Road", "Laboni Point", "Sugandha Beach"]
    },
    "Sylhet": {
        "Sylhet City": ["Zindabazar", "Ambarkhana", "Uposhahar", "Bandar Bazar"],
        "Sreemangal": ["Tea Garden Area", "Sreemangal Town"]
    }
};

const ReportIssue = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '', // Default empty for AI auto-detection
        location: { address: '', latitude: 0, longitude: 0 },
        photos: []
    });

    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [detailedAddress, setDetailedAddress] = useState('');

    // Trigger full address compilation when any dropdown or detail changes
    useEffect(() => {
        let parts = [];
        if (selectedArea) parts.push(selectedArea);
        if (selectedCity) parts.push(selectedCity);
        if (selectedDistrict) parts.push(selectedDistrict);
        
        let addrStr = parts.join(', ');
        if (detailedAddress) {
            addrStr = `${detailedAddress}, ${addrStr}`;
        }
        
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                address: addrStr
            }
        }));
    }, [selectedDistrict, selectedCity, selectedArea, detailedAddress]);

    const handleAutoDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        const toastId = toast.loading('Detecting your GPS location...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                setFormData(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        latitude,
                        longitude
                    }
                }));

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    
                    if (data && data.display_name) {
                        const fullAddr = data.display_name;
                        
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                address: fullAddr
                            }
                        }));
                        
                        // Parse address components to prefill details if OSM returned them
                        const addrInfo = data.address || {};
                        const road = addrInfo.road || addrInfo.suburb || addrInfo.neighbourhood || '';
                        
                        setDetailedAddress(addrInfo.building || addrInfo.house_number || '');
                        
                        toast.success('Location auto-detected successfully!', { id: toastId });
                    } else {
                        toast.success(`Coordinates found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, { id: toastId });
                    }
                } catch (err) {
                    console.error('OSM Nominatim geocoding failed:', err);
                    toast.success(`Coordinates found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, { id: toastId });
                }
            },
            (error) => {
                console.error('GPS tracking error:', error);
                toast.error('GPS Detection failed: ' + error.message, { id: toastId });
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

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
        const toastId = toast.loading('Analyzing your report and saving...');

        try {
            const response = await issueAPI.createIssue(formData);
            const issueId = response.data.issue._id;
            toast.success('Issue reported successfully!', { id: toastId });
            navigate(`/issues/${issueId}`);
        } catch (err) {
            console.error('Report error:', err);
            const message = err.response?.data?.message || 'Failed to report issue';
            setError(message);
            toast.error(message, { id: toastId });

            // Handle Upgrade Requirement
            if (err.response?.data?.requiresUpgrade) {
                toast((t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '22px' }}>⭐</span>
                            <div>
                                <p style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', margin: 0 }}>
                                    Premium Required
                                </p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                                    {message}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    color: '#475569',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { toast.dismiss(t.id); navigate('/profile'); }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(99,102,241,0.35)'
                                }}
                            >
                                ✨ Upgrade Now
                            </button>
                        </div>
                    </div>
                ), {
                    duration: 8000,
                    style: {
                        borderRadius: '14px',
                        padding: '16px',
                        border: '1px solid #e0e7ff',
                        boxShadow: '0 8px 30px rgba(99,102,241,0.15)'
                    }
                });
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

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wide">
                                <FaMapMarkerAlt className="text-blue-600" /> Incident Location <span className="text-red-500">*</span>
                            </label>

                            {/* Dropdown 1: District (Zilla) */}
                            <select
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer transition-shadow"
                                value={selectedDistrict}
                                onChange={(e) => {
                                    setSelectedDistrict(e.target.value);
                                    setSelectedCity('');
                                    setSelectedArea('');
                                }}
                            >
                                <option value="">— Select District (Zilla) —</option>
                                {Object.keys(BANGLADESH_LOCATIONS).map(dist => (
                                    <option key={dist} value={dist}>{dist}</option>
                                ))}
                            </select>

                            {/* Dropdown 2: City / Upazila */}
                            <select
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50 cursor-pointer transition-shadow"
                                value={selectedCity}
                                disabled={!selectedDistrict}
                                onChange={(e) => {
                                    setSelectedCity(e.target.value);
                                    setSelectedArea('');
                                }}
                            >
                                <option value="">— Select City / Upazila —</option>
                                {selectedDistrict && Object.keys(BANGLADESH_LOCATIONS[selectedDistrict]).map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>

                            {/* Dropdown 3: Road / Area */}
                            <select
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50 cursor-pointer transition-shadow"
                                value={selectedArea}
                                disabled={!selectedCity}
                                onChange={(e) => setSelectedArea(e.target.value)}
                            >
                                <option value="">— Select Road / Area —</option>
                                {selectedDistrict && selectedCity && BANGLADESH_LOCATIONS[selectedDistrict][selectedCity].map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>

                            {/* Detailed Input */}
                            <input
                                type="text"
                                placeholder="House/Building No., Road No., etc. (Optional)"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                value={detailedAddress}
                                onChange={(e) => setDetailedAddress(e.target.value)}
                            />

                            {/* GPS Button */}
                            <button
                                type="button"
                                onClick={handleAutoDetectLocation}
                                className="w-full py-3.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.99] transform"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Auto-Detect my location (GPS)
                            </button>
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
