import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Shield, Zap, Star, ChevronRight, Smartphone } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export function LandingPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 1000], [0, 100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -50]);

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
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans text-slate-100 selection:bg-[#38c6ec] selection:text-white">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#38c6ec]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Floating Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl rounded-full px-6 py-3 flex items-center justify-between z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/10' : 'bg-transparent'}`}
      >
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
            <svg className="w-8 h-8 text-[#38c6ec]" viewBox="0 0 26 25" fill="none">
              <path fillRule="evenodd" d="M9.45 24.95 L7.07 24.09 L5.56 23.30 L3.33 21.03 L2.31 19.44 L0.74 16.05 L0.27 13.91 L0.29 11.25 L0.80 8.75 L1.95 6.20 L3.26 4.50 L5.15 2.67 L7.77 1.02 L9.91 0.18 L12.16 -0.20 L15.22 -0.16 L17.61 0.35 L19.30 1.06 L20.88 2.06 L22.23 3.37 L24.01 5.48 L24.76 6.58 L25.70 8.63 L26.00 10.35 L26.02 11.35 L25.54 12.12 L24.96 12.32 L22.35 12.36 L21.46 12.18 L20.78 11.85 L20.32 11.37 L19.45 9.56 L17.88 7.58 L16.59 6.60 L14.59 5.84 L13.24 5.69 L11.54 5.93 L10.47 6.44 L9.12 7.35 L7.92 8.50 L6.70 10.55 L6.26 12.65 L6.41 14.36 L7.14 15.86 L8.63 17.79 L12.57 20.70 L12.96 21.60 L13.13 22.82 L12.93 24.36 L12.65 24.86 L12.03 25.35 L11.27 25.42 L9.45 24.95 Z M24.55 25.53 L22.49 24.77 L19.56 23.18 L18.15 22.07 L16.63 20.48 L16.14 19.79 L15.63 18.71 L14.66 15.66 L14.59 14.50 L14.75 13.92 L15.12 13.45 L15.85 13.10 L16.91 12.88 L18.90 12.85 L19.49 13.04 L19.94 13.38 L20.25 13.88 L20.86 15.66 L21.97 17.30 L23.05 18.22 L25.00 19.43 L26.05 20.27 L26.34 20.66 L26.63 21.86 L26.51 23.68 L25.79 25.10 L25.35 25.42 L24.55 25.53 Z" fill="currentColor"/>
            </svg>
          </motion.div>
          <span className="font-bold text-xl tracking-tight text-white">DriveMate<span className="text-[#38c6ec]">.</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-300">
          {['Rider App', 'Customer App', 'Safety', 'Support'].map((item) => (
            <a key={item} href="#" className="hover:text-white transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#38c6ec] transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/master')} 
            className="hidden md:block bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Admin Login
          </motion.button>
          
          <button 
            className="md:hidden p-2 text-slate-300 hover:text-white bg-white/10 rounded-full backdrop-blur-md"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-6 flex flex-col gap-4 z-50 md:hidden border border-white/10 shadow-2xl"
          >
            {['Rider App', 'Customer App', 'Safety', 'Support'].map((item) => (
              <a key={item} href="#" className="text-lg font-medium py-3 border-b border-white/5 flex items-center justify-between group" onClick={() => setNavOpen(false)}>
                {item}
                <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </a>
            ))}
            <button 
              onClick={() => navigate('/master')} 
              className="bg-[#38c6ec] text-black font-bold py-4 mt-4 rounded-xl text-lg hover:bg-[#2bb5da] transition-colors"
            >
              Admin Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <main className="relative z-10 pt-40 md:pt-52 pb-20 px-6 flex flex-col items-center text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#38c6ec] text-sm font-medium mb-8 backdrop-blur-md">
            <Zap size={16} className="fill-[#38c6ec]" />
            <span>The Next Generation of Mobility</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1] text-balance">
            Reimagine your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38c6ec] to-indigo-400">daily commute</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl text-balance font-light leading-relaxed">
            Experience seamless travel with DriveMate. Intelligent routing, transparent pricing, and unparalleled safety, all integrated into one beautiful app.
          </motion.p>
          
          <motion.div variants={fadeUp} className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => alert('Download Customer App!')}
              className="w-full sm:w-auto bg-white text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <Smartphone size={20} />
              Get the App
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="w-full sm:w-auto bg-white/5 text-white border border-white/10 font-medium text-lg px-8 py-4 rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
            >
              Explore Features
            </button>
          </motion.div>
        </motion.div>

        {/* Dynamic Image Grid (Bento Box) */}
        <div className="mt-32 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8">
          
          {/* Card 1 */}
          <motion.div 
            style={{ y: y1 }}
            className="col-span-1 md:col-span-2 relative h-[450px] rounded-[2rem] overflow-hidden group bg-slate-900 border border-white/10 shadow-2xl"
          >
            <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors duration-500"></div>
            <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2000&auto=format&fit=crop" alt="Driving" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 p-8 md:p-10 z-20 text-left">
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl inline-block mb-4 border border-white/10">
                <Shield size={28} className="text-[#38c6ec]" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Safe & Secure</h3>
              <p className="text-slate-200 text-lg max-w-md font-light leading-relaxed">Every ride is tracked in real-time with verified drivers and 24/7 proactive support.</p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            style={{ y: y2 }}
            className="col-span-1 relative h-[450px] rounded-[2rem] overflow-hidden group bg-slate-900 border border-white/10 shadow-2xl"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"></div>
             <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop" alt="Navigation" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
             <div className="absolute bottom-0 left-0 p-8 z-20 text-left w-full">
              <h3 className="text-2xl font-bold text-white mb-2">Smart Routing</h3>
              <p className="text-slate-300 font-light">Powered by advanced AI for the fastest, most efficient routes avoiding traffic.</p>
             </div>
          </motion.div>

          {/* Video / App Mockup Card */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="col-span-1 relative h-[500px] rounded-[2rem] overflow-hidden group border border-white/10 bg-slate-800 shadow-2xl"
          >
             <div className="absolute inset-0 bg-[#0db5ed]/20 z-0"></div>
             <div className="absolute inset-0 bg-black/40 z-10 mix-blend-overlay"></div>
             <video 
                className="absolute inset-0 w-full h-full object-cover object-center opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125119_4963ddd4-c287-4044-b014-b68943cdd8bd.mp4"
                poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125039_45a71f04-36dd-4620-99d8-7526316d439e.png"
                autoPlay muted loop playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center z-20 p-6 md:p-8">
                {/* Floating Ride Status Mockup inside the video card */}
                <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl transform group-hover:-translate-y-4 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <span className="bg-[#38c6ec] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">En Route</span>
                    <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">15 min</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-white/50 bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                      <div className="w-full h-full bg-[url('https://api.dicebear.com/7.x/notionists/svg?seed=Felix')] bg-cover" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">John Doe</h4>
                      <p className="text-slate-300 text-sm flex items-center gap-1">4.9 <Star size={12} className="fill-yellow-400 text-yellow-400" /> • Honda Activa</p>
                    </div>
                  </div>
                </div>
              </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-1 md:col-span-2 relative h-[500px] rounded-[2rem] overflow-hidden group bg-slate-900 border border-white/10 shadow-2xl"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
             <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2000&auto=format&fit=crop" alt="Night Drive" className="absolute inset-0 w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute inset-y-0 left-0 p-8 md:p-14 z-20 flex flex-col justify-center max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs font-semibold mb-6 backdrop-blur-md uppercase tracking-widest w-fit">
                  Premium Experience
                </div>
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">Executive Fleet,<br/>On Demand.</h3>
                <p className="text-slate-300 text-lg mb-10 font-light leading-relaxed">From daily commutes to executive travel, choose the perfect ride for your needs with unparalleled comfort.</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                    <Star size={24} className="text-[#38c6ec]" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                    <Shield size={24} className="text-[#38c6ec]" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                    <Zap size={24} className="text-[#38c6ec]" />
                  </div>
                </div>
             </div>
          </motion.div>

        </div>
      </main>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl pt-16 pb-8 px-6 mt-20 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <svg className="w-8 h-8 text-[#38c6ec]" viewBox="0 0 26 25" fill="none">
              <path fillRule="evenodd" d="M9.45 24.95 L7.07 24.09 L5.56 23.30 L3.33 21.03 L2.31 19.44 L0.74 16.05 L0.27 13.91 L0.29 11.25 L0.80 8.75 L1.95 6.20 L3.26 4.50 L5.15 2.67 L7.77 1.02 L9.91 0.18 L12.16 -0.20 L15.22 -0.16 L17.61 0.35 L19.30 1.06 L20.88 2.06 L22.23 3.37 L24.01 5.48 L24.76 6.58 L25.70 8.63 L26.00 10.35 L26.02 11.35 L25.54 12.12 L24.96 12.32 L22.35 12.36 L21.46 12.18 L20.78 11.85 L20.32 11.37 L19.45 9.56 L17.88 7.58 L16.59 6.60 L14.59 5.84 L13.24 5.69 L11.54 5.93 L10.47 6.44 L9.12 7.35 L7.92 8.50 L6.70 10.55 L6.26 12.65 L6.41 14.36 L7.14 15.86 L8.63 17.79 L12.57 20.70 L12.96 21.60 L13.13 22.82 L12.93 24.36 L12.65 24.86 L12.03 25.35 L11.27 25.42 L9.45 24.95 Z" fill="currentColor"/>
          </svg>
          <span className="font-bold text-2xl text-white tracking-tight">DriveMate<span className="text-[#38c6ec]">.</span></span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mb-8 font-medium">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} DriveMate. All rights reserved.</p>
      </footer>
      
    </div>
  );
}
