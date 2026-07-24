import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-slate-900 pt-16 pb-8 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🏛️</span>
                            <h3 className="text-xl font-bold text-white">InfraReport</h3>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            Empowering citizens to build better communities through transparent infrastructure reporting and tracking.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all duration-300">
                                <FaFacebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-400 transition-all duration-300">
                                <FaTwitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600 transition-all duration-300">
                                <FaInstagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-700 transition-all duration-300">
                                <FaLinkedin size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">Home</Link>
                            </li>
                            <li>
                                <Link to="/issues" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">All Issues</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">About Us</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">Contact</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/privacy" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">Terms of Service</Link>
                            </li>
                            <li>
                                <Link to="/cookies" className="text-slate-400 hover:text-blue-500 transition-colors inline-block">Cookie Policy</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">Contact Info</h4>
                        <ul className="space-y-4 text-slate-400">
                            <li className="flex items-start gap-3">
                                <span>123 City Hall Avenue, Metro City, MC 10001</span>
                            </li>
                            <li>
                                <a href="mailto:support@infrareport.gov" className="hover:text-blue-500 transition-colors">support@infrareport.gov</a>
                            </li>
                            <li>
                                <a href="tel:+15551234567" className="hover:text-blue-500 transition-colors">+1 (555) 123-4567</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} InfraReport. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
