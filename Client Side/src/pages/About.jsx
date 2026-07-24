import { motion } from 'framer-motion';
import { FaCity, FaUsers, FaHandshake, FaLightbulb, FaTools, FaShieldAlt } from 'react-icons/fa';

const About = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Hero Section */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Building Better <span className="text-blue-600">Communities</span> Together
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Empowering citizens to take active roles in maintaining and improving our shared public infrastructure.
                    </p>
                </motion.div>

                {/* Mission & Vision */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    <motion.div variants={fadeIn} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transform hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            <FaLightbulb className="text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
                        <p className="text-slate-600 leading-relaxed">
                            To create a seamless, transparent, and efficient channel for citizens to report infrastructure issues, ensuring that every voice is heard and every problem is addressed promptly by the responsible authorities.
                        </p>
                    </motion.div>

                    <motion.div variants={fadeIn} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transform hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                            <FaCity className="text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
                        <p className="text-slate-600 leading-relaxed">
                            A world where technology bridges the gap between citizens and administration, fostering trust, accountability, and rapid development of safe, modern, and sustainable public infrastructure.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Core Values */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <h2 className="text-3xl font-bold text-slate-900">Why Choose InfraReport?</h2>
                        <p className="text-slate-600 mt-2">Driven by values that matter to you and our community.</p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {[
                            { icon: FaUsers, title: "Community First", color: "text-indigo-600", bg: "bg-indigo-50", desc: "Built for the people, by the people." },
                            { icon: FaHandshake, title: "Transparency", color: "text-amber-600", bg: "bg-amber-50", desc: "Real-time updates on every report." },
                            { icon: FaTools, title: "Efficiency", color: "text-cyan-600", bg: "bg-cyan-50", desc: "Streamlined workflows for quick fixes." },
                            { icon: FaShieldAlt, title: "Reliability", color: "text-rose-600", bg: "bg-rose-50", desc: "Trusted by thousands of citizens." }
                        ].map((item, index) => (
                            <motion.div key={index} variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center ${item.color} mb-4`}>
                                    <item.icon className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-blue-600 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Ready to Make a Difference?</h2>
                        <p className="text-blue-100 max-w-xl mx-auto text-lg">
                            Join thousands of citizens who are actively contributing to a better tomorrow. Report an issue today and see the change happen.
                        </p>
                        <button onClick={() => window.location.href = '/register'} className="px-8 py-3 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            Get Started
                        </button>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default About;
