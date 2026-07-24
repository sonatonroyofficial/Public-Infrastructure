import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI } from '../utils/api';
import {
    FaLightbulb,
    FaRoad,
    FaTint,
    FaTrash,
    FaUserShield,
    FaChartLine,
    FaClock,
    FaCheckCircle,
    FaArrowRight,
    FaApple,
    FaGooglePlay,
    FaMobileAlt
} from 'react-icons/fa';

const Home = () => {
    const { isAuthenticated, isCitizen } = useAuth();
    const [latestResolvedIssues, setLatestResolvedIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(true);

    useEffect(() => {
        const fetchResolvedIssues = async () => {
            try {
                const response = await issueAPI.getAllIssues();
                const issues = response.data.issues || [];
                const resolved = issues
                    .filter(issue => issue.status === 'resolved')
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .slice(0, 6);
                setLatestResolvedIssues(resolved);
            } catch (error) {
                console.error("Failed to fetch resolved issues", error);
            } finally {
                setLoadingIssues(false);
            }
        };

        fetchResolvedIssues();
    }, []);

    const features = [
        {
            icon: <FaLightbulb />,
            title: 'Easy Reporting',
            description: 'Report infrastructure issues with photos and location in seconds'
        },
        {
            icon: <FaClock />,
            title: 'Real-time Tracking',
            description: 'Track your reported issues from submission to resolution'
        },
        {
            icon: <FaUserShield />,
            title: 'Verified Staff',
            description: 'Issues are handled by verified government staff members'
        },
        {
            icon: <FaCheckCircle />,
            title: 'Quick Resolution',
            description: 'Priority system ensures faster response to critical issues'
        }
    ];

    const issueTypes = [
        { icon: <FaRoad />, name: 'Potholes', color: 'bg-amber-500 shadow-amber-200' },
        { icon: <FaLightbulb />, name: 'Streetlights', color: 'bg-blue-500 shadow-blue-200' },
        { icon: <FaTint />, name: 'Water Leakage', color: 'bg-cyan-500 shadow-cyan-200' },
        { icon: <FaTrash />, name: 'Garbage Overflow', color: 'bg-red-500 shadow-red-200' },
        { icon: <FaRoad />, name: 'Damaged Footpaths', color: 'bg-violet-500 shadow-violet-200' },
        { icon: <FaChartLine />, name: 'Other Issues', color: 'bg-emerald-500 shadow-emerald-200' }
    ];

    return (
        <div className="overflow-x-hidden font-sans text-slate-900">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden bg-white">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.1),transparent_50%)]"></div>

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center px-4 py-2 mb-6 bg-blue-50 border border-blue-100 rounded-full text-blue-700 font-semibold text-sm">
                                <span className="mr-2">🏛️</span> Building Better Cities Together
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                                Report Public <br className="hidden lg:block" /> Infrastructure
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Issues Instantly</span>
                            </h1>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Help improve your community by reporting broken streetlights, potholes,
                                water leakage, and other infrastructure issues. Track progress in real-time.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                                {isAuthenticated && isCitizen ? (
                                    <Link to="/report-issue" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1">
                                        <FaArrowRight className="mr-2" /> Report an Issue
                                    </Link>
                                ) : (
                                    <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1">
                                        <FaArrowRight className="mr-2" /> Get Started Free
                                    </Link>
                                )}
                                <Link to="/about" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-700 transition-all duration-200 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1">
                                    Learn More
                                </Link>
                            </div>

                            <div className="grid grid-cols-3 gap-8 py-8 border-t border-slate-100">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-slate-900">1000+</div>
                                    <div className="text-sm text-slate-500 mt-1 uppercase tracking-wide font-semibold">Issues Reported</div>
                                </div>
                                <div className="text-center border-l border-slate-100">
                                    <div className="text-3xl font-black text-blue-600">850+</div>
                                    <div className="text-sm text-slate-500 mt-1 uppercase tracking-wide font-semibold">Resolved</div>
                                </div>
                                <div className="text-center border-l border-slate-100">
                                    <div className="text-3xl font-black text-emerald-500">95%</div>
                                    <div className="text-sm text-slate-500 mt-1 uppercase tracking-wide font-semibold">Satisfaction</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative h-[600px] hidden lg:block">
                            {/* Floating Cards simulating standard float animation */}
                            <div className="absolute top-[15%] left-[10%] bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 border border-slate-100 z-10 animate-pulse">
                                <div className="text-3xl">🚧</div>
                                <div>
                                    <div className="font-bold text-slate-900">Pothole Reported</div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">Pending Review</div>
                                </div>
                            </div>

                            <div className="absolute top-[50%] right-[10%] bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 border border-slate-100 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="text-3xl">💡</div>
                                <div>
                                    <div className="font-bold text-slate-900">Streetlight Fixed</div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">Resolved</div>
                                </div>
                            </div>

                            <div className="absolute bottom-[20%] left-[20%] bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 border border-slate-100 z-10 animate-ping" style={{ animationDuration: '4s' }}>
                                <div className="text-3xl">💧</div>
                                <div>
                                    <div className="font-bold text-slate-900">Water Leak</div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">In Progress</div>
                                </div>
                            </div>

                            {/* Abstract Shapes */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Resolved Issues Section */}
            <section className="py-20 bg-slate-50 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Latest Resolved Issues</h2>
                        <p className="text-lg text-slate-600">See how we are making a difference in the community, one issue at a time.</p>
                    </div>

                    {loadingIssues ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : latestResolvedIssues.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {latestResolvedIssues.map(issue => (
                                <div key={issue._id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full border border-slate-100 overflow-hidden">
                                    {issue.photos && issue.photos.length > 0 ? (
                                        <div className="h-56 w-full bg-slate-100 relative overflow-hidden">
                                            <img src={issue.photos[0]} alt="Resolved Issue" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute top-4 right-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-emerald-600 shadow-sm backdrop-blur-sm">
                                                    <FaCheckCircle /> Resolved
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-56 w-full bg-slate-100 flex items-center justify-center">
                                            <span className="text-slate-400 text-5xl opacity-50">📷</span>
                                        </div>
                                    )}

                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">{issue.category}</span>
                                            <span className="text-xs text-slate-500 font-medium">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
                                        <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed flex-1">
                                            {issue.description}
                                        </p>

                                        <div className="pt-4 border-t border-slate-50 mt-auto">
                                            <div className="flex items-center text-sm text-slate-500 mb-4">
                                                <span className="mr-2 text-red-400">📍</span>
                                                <span className="truncate">{issue.location.address}</span>
                                            </div>
                                            <Link to="/issues" className="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 mb-8">
                            <p className="text-slate-500 text-lg">No recently resolved issues to display.</p>
                        </div>
                    )}

                    <div className="text-center mt-12 relative z-10">
                        <Link to="/issues" className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all duration-200 bg-slate-900 border border-transparent rounded-xl hover:bg-slate-800 hover:shadow-lg">
                            View All Issues
                        </Link>
                    </div>
                </div>
            </section>

            {/* Issue Types Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Can You Report?</h2>
                        <p className="text-lg text-slate-600">We handle a wide range of public infrastructure issues to keep our city running smoothly.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {issueTypes.map((type, index) => (
                            <div key={index} className="group p-6 rounded-2xl bg-white border border-slate-100 text-center transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:-translate-y-2 cursor-pointer">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg transform transition-transform group-hover:scale-110 ${type.color}`}>
                                    {type.icon}
                                </div>
                                <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{type.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose InfraReport?</h2>
                        <p className="text-lg text-slate-600">Making city service delivery more efficient, transparent, and accessible for everyone.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100">
                                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-2xl mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Impact Section */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="mb-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Our Community Impact</h2>
                                <p className="text-lg text-slate-600 leading-relaxed">Together we are transforming our city into a safer, cleaner, and more efficient place for everyone. Every report counts towards a better future.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="p-6 bg-blue-50/50 rounded-2xl text-center border border-blue-100">
                                    <h3 className="text-4xl font-black text-blue-600 mb-2">50+</h3>
                                    <p className="text-slate-600 font-medium">Communities Served</p>
                                </div>
                                <div className="p-6 bg-emerald-50/50 rounded-2xl text-center border border-emerald-100">
                                    <h3 className="text-4xl font-black text-emerald-600 mb-2">12hr</h3>
                                    <p className="text-slate-600 font-medium">Avg. Response Time</p>
                                </div>
                            </div>
                            <div className="relative p-8 bg-slate-50 rounded-2xl border-l-4 border-blue-500">
                                <span className="absolute top-4 left-4 text-6xl text-slate-200 font-serif leading-none -z-10">"</span>
                                <p className="italic text-slate-700 mb-6 text-lg relative z-10">The response time for the streetlight repair I reported was incredible. It makes me feel heard as a citizen.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg">JD</div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">John Doe</h5>
                                        <span className="text-sm text-slate-500">Local Resident</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative lg:h-[600px] h-[400px] order-1 lg:order-2">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl opacity-10 transform rotate-3"></div>
                            <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex items-center justify-center group">
                                <div className="text-center p-12 transition-transform duration-500 group-hover:scale-105">
                                    <FaChartLine className="text-8xl text-indigo-200 mx-auto mb-6" />
                                    <h3 className="text-3xl font-bold text-slate-800 mb-3">Real Impact, Real Time</h3>
                                    <p className="text-slate-500 text-lg">Visualizing change across the city.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
                        <p className="text-lg text-slate-600">Simple 4-step process to report and resolve issues</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-10 left-0 w-full h-1 bg-slate-200 z-0"></div>

                        {[
                            { step: 1, title: 'Submit Report', desc: 'Citizens submit reports with details' },
                            { step: 2, title: 'Admin Review', desc: 'Admin reviews and assigns staff' },
                            { step: 3, title: 'Staff Action', desc: 'Staff verifies and fixes the issue' },
                            { step: 4, title: 'Resolved', desc: 'Citizens get updates on completion' }
                        ].map((item, index) => (
                            <div key={index} className="relative z-10 flex-1 w-full max-w-xs text-center group bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                                <div className="w-20 h-20 mx-auto bg-white border-8 border-slate-50 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 relative z-20">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Download / Newsletter */}
            <section className="relative py-24 bg-slate-900 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 opacity-20 transform skew-x-12 translate-x-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-purple-600 opacity-20 transform -skew-x-12 -translate-x-32 blur-3xl"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left">
                            <span className="inline-block py-1.5 px-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-xs font-bold uppercase tracking-widest mb-6 shadow-lg border border-white/10">Coming Soon</span>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Report Issues <br /> on the Go</h2>
                            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
                                Download our mobile app to report issues directly from your phone.
                                Enable location services for automatic geotagging and receive push notifications on updates.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button className="flex items-center gap-4 bg-white text-slate-900 px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors shadow-lg w-full sm:w-auto justify-start sm:justify-center">
                                    <FaApple className="text-3xl shrink-0" />
                                    <div className="text-left">
                                        <div className="text-xs uppercase font-bold text-slate-500">Download on the</div>
                                        <div className="text-lg font-bold leading-none">App Store</div>
                                    </div>
                                </button>
                                <button className="flex items-center gap-4 bg-transparent border border-slate-600 text-white px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-colors w-full sm:w-auto justify-start sm:justify-center">
                                    <FaGooglePlay className="text-2xl shrink-0" />
                                    <div className="text-left">
                                        <div className="text-xs uppercase font-bold text-slate-400">Get it on</div>
                                        <div className="text-lg font-bold leading-none">Google Play</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-center items-center lg:justify-end">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                                <FaMobileAlt className="text-slate-800 text-[18rem] md:text-[22rem] relative z-10 drop-shadow-2xl transform rotate-12" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Make a Difference?</h2>
                        <p className="text-xl text-blue-50 mb-12 max-w-2xl mx-auto">Join thousands of citizens making their communities better today. It only takes a minute to get started.</p>
                        {!isAuthenticated && (
                            <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-blue-600 transition-all duration-200 bg-white rounded-xl hover:bg-blue-50 hover:shadow-2xl hover:-translate-y-1">
                                Create Free Account
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
