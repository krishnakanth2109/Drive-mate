import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    // Read user token from sessionStorage
    const token = sessionStorage.getItem('dm_user_token');
    const profile = sessionStorage.getItem('dm_user_profile');
    setUserToken(token);
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (e) {}
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Customer App', path: '/customer' },
    { name: 'Community Rides', path: '/dashboard' },
    { name: 'Safety', path: '/safety' },
    { name: 'Support', path: '/support' }
  ];

  return (
    <>
      {/* Floating Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full rounded-full px-5 py-3 flex items-center justify-between transition-all duration-500 border ${scrolled ? 'bg-black/70 backdrop-blur-2xl shadow-2xl border-white/10' : 'bg-black/30 backdrop-blur-md border-transparent hover:bg-black/50 hover:border-white/5'}`}
        >
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
            <svg className="w-8 h-8 text-[#38c6ec] drop-shadow-[0_0_8px_rgba(56,198,236,0.5)]" viewBox="0 0 26 25" fill="none">
              <path fillRule="evenodd" d="M9.45 24.95 L7.07 24.09 L5.56 23.30 L3.33 21.03 L2.31 19.44 L0.74 16.05 L0.27 13.91 L0.29 11.25 L0.80 8.75 L1.95 6.20 L3.26 4.50 L5.15 2.67 L7.77 1.02 L9.91 0.18 L12.16 -0.20 L15.22 -0.16 L17.61 0.35 L19.30 1.06 L20.88 2.06 L22.23 3.37 L24.01 5.48 L24.76 6.58 L25.70 8.63 L26.00 10.35 L26.02 11.35 L25.54 12.12 L24.96 12.32 L22.35 12.36 L21.46 12.18 L20.78 11.85 L20.32 11.37 L19.45 9.56 L17.88 7.58 L16.59 6.60 L14.59 5.84 L13.24 5.69 L11.54 5.93 L10.47 6.44 L9.12 7.35 L7.92 8.50 L6.70 10.55 L6.26 12.65 L6.41 14.36 L7.14 15.86 L8.63 17.79 L12.57 20.70 L12.96 21.60 L13.13 22.82 L12.93 24.36 L12.65 24.86 L12.03 25.35 L11.27 25.42 L9.45 24.95 Z" fill="currentColor"/>
            </svg>
          </motion.div>
          <span className="font-bold text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">DriveMate<span className="text-[#38c6ec]">.</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/5">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-black bg-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Auth & Portal Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {userToken ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#38c6ec] font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[#38c6ec]/25 transition-all shadow-[0_0_12px_rgba(56,198,236,0.2)] cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#38c6ec] text-black font-bold text-xs flex items-center justify-center">
                {userProfile?.firstName ? userProfile.firstName[0] : (userProfile?.name ? userProfile.name[0] : 'U')}
              </div>
              <span className="hidden sm:inline">{userProfile?.firstName || 'Dashboard'}</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="text-white hover:text-[#38c6ec] font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                Login
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="hidden sm:flex items-center gap-1.5 bg-[#38c6ec] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(56,198,236,0.3)] cursor-pointer"
              >
                Register
              </motion.button>
            </>
          )}

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/master')} 
            className="hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3.5 py-2.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            title="Master Administration Portal"
          >
            <UserCircle size={16} />
            Admin
          </motion.button>
          
          <button 
            className="lg:hidden p-2.5 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        </motion.nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {navOpen && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[95%] z-40 lg:hidden">
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full bg-slate-900/95 backdrop-blur-2xl text-white rounded-[2rem] p-6 flex flex-col gap-2 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
            {navLinks.map((item, i) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  key={item.name}
                >
                  <Link 
                    to={item.path} 
                    className={`text-lg font-medium py-3.5 px-4 rounded-2xl flex items-center justify-between group transition-colors ${isActive ? 'bg-[#38c6ec]/10 text-[#38c6ec]' : 'hover:bg-white/5 text-slate-200 hover:text-white'}`}
                    onClick={() => setNavOpen(false)}
                  >
                    {item.name}
                    <ChevronRight size={20} className={isActive ? 'text-[#38c6ec]' : 'text-slate-500 group-hover:text-white'} />
                  </Link>
                </motion.div>
              )
            })}
            
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2"
            >
              {userToken ? (
                <button 
                  onClick={() => { setNavOpen(false); navigate('/dashboard'); }} 
                  className="w-full flex justify-center items-center gap-2 bg-[#38c6ec] text-black font-bold py-3.5 rounded-2xl text-base hover:bg-cyan-300 transition-colors shadow-lg cursor-pointer"
                >
                  My Commuter Dashboard
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { setNavOpen(false); navigate('/login'); }} 
                    className="flex justify-center items-center py-3 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => { setNavOpen(false); navigate('/register'); }} 
                    className="flex justify-center items-center py-3 rounded-2xl bg-[#38c6ec] text-black font-bold text-sm hover:bg-cyan-300 transition-colors cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              )}

              <button 
                onClick={() => { setNavOpen(false); navigate('/master'); }} 
                className="w-full flex justify-center items-center gap-2 bg-white/5 border border-white/10 text-slate-300 font-semibold py-3 rounded-2xl text-xs hover:bg-white/10 transition-colors cursor-pointer"
              >
                <UserCircle size={16} />
                Admin Staff Portal
              </button>
            </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
