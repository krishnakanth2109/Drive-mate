import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Shield, Activity, MapPin, PhoneCall, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Navbar } from '../components/Navbar';

export function SafetyPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Customer App', path: '/customer' },
    { name: 'Support', path: '/support' }
  ];

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans text-slate-100 selection:bg-[#38c6ec] selection:text-white">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="relative z-10 pt-40 md:pt-48 pb-20 px-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-start text-left"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-medium mb-6 backdrop-blur-md">
            <Shield size={16} className="text-cyan-400" />
            <span>Trust & Safety Center</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Your safety is <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">our priority</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-400 max-w-lg font-light leading-relaxed">
            We are committed to making every ride with DriveMate secure, transparent, and completely peace-of-mind. From start to finish, we've got you covered.
          </motion.p>
          
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-cyan-500 text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              View Safety Features
            </button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-1 w-full relative h-[500px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1571168127419-5eb7eb51e9b7?q=80&w=2000&auto=format&fit=crop" alt="Safety" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Mockup */}
          <motion.div style={{ y: y1 }} className="absolute bottom-8 left-8 right-8 z-20 bg-black/60 backdrop-blur-xl border border-white/20 p-6 rounded-3xl">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/50">
                  <Activity size={28} />
                </div>
                <div className="flex-1">
                   <h4 className="text-white font-bold text-lg">Real-time GPS Tracking</h4>
                   <p className="text-slate-400 text-sm">Active on all rides</p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Built-in protection</h2>
            <p className="text-slate-400 text-lg">Advanced technology designed to keep you safe.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <MapPin size={32} />, title: 'Share Your Trip', desc: 'Let loved ones follow your route in real-time right from the app.' },
              { icon: <Shield size={32} />, title: 'Verified Drivers', desc: 'Every driver undergoes strict background checks and regular vehicle inspections.' },
              { icon: <PhoneCall size={32} />, title: '24/7 Emergency Support', desc: 'One tap in the app connects you instantly to emergency services and our support team.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-800 transition-colors"
              >
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl pt-16 pb-8 px-6 mt-10 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mb-8 font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} DriveMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
