import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, MessageSquare, HelpCircle, Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Navbar } from '../components/Navbar';

export function SupportPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

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
    { name: 'Safety', path: '/safety' }
  ];

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans text-slate-100 selection:bg-[#38c6ec] selection:text-white">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="relative z-10 pt-40 md:pt-48 pb-20 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-400 text-sm font-medium mb-6 backdrop-blur-md">
            <MessageSquare size={16} className="text-violet-400" />
            <span>24/7 Help Center</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            How can we <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">help you?</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-400 max-w-xl font-light leading-relaxed">
            Whether you are a rider or a driver, our dedicated support team is here to assist you with any questions or issues.
          </motion.p>
        </motion.div>
      </main>

      {/* Support Options */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-800 transition-colors flex items-start gap-6 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 shrink-0">
                <HelpCircle size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">FAQs</h3>
                 <p className="text-slate-400 leading-relaxed mb-4">Find quick answers to common questions about accounts, payments, and rides.</p>
                 <span className="text-violet-400 font-medium flex items-center gap-1">Browse FAQs <ChevronRight size={16} /></span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-800 transition-colors flex items-start gap-6 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 shrink-0">
                <Mail size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">Contact Us</h3>
                 <p className="text-slate-400 leading-relaxed mb-4">Need personalized help? Send us a message and our team will get back to you.</p>
                 <span className="text-fuchsia-400 font-medium flex items-center gap-1">Send Message <ChevronRight size={16} /></span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl pt-16 pb-8 px-6 mt-20 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mb-8 font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} DriveMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
