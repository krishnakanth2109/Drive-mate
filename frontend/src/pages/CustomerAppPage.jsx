import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Smartphone, Map, Star, ChevronRight, Navigation } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Navbar } from '../components/Navbar';

export function CustomerAppPage() {
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
    { name: 'Safety', path: '/safety' },
    { name: 'Support', path: '/support' }
  ];

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans text-slate-100 selection:bg-[#38c6ec] selection:text-white">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#38c6ec]/10 blur-[120px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="relative z-10 pt-40 md:pt-48 pb-20 px-6 flex flex-col md:flex-row-reverse items-center justify-between max-w-7xl mx-auto gap-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-start text-left"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-6 backdrop-blur-md">
            <Smartphone size={16} className="text-indigo-400" />
            <span>DriveMate For Passengers</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Your ride, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-[#38c6ec]">your way</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-400 max-w-lg font-light leading-relaxed">
            Get where you need to go in comfort and style. Enjoy transparent pricing, smart routing, and the safest rides in the city.
          </motion.p>
          
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-indigo-500 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Download App
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-1 w-full relative h-[500px] md:h-[600px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?q=80&w=2000&auto=format&fit=crop" alt="Passenger" className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
          
          {/* Mockup */}
          <motion.div style={{ y: y1 }} className="absolute bottom-8 left-8 right-8 z-20 bg-black/60 backdrop-blur-xl border border-white/20 p-6 rounded-3xl">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Navigation size={24} />
                </div>
                <div className="flex-1">
                   <h4 className="text-white font-bold text-lg">Arriving in 3 mins</h4>
                   <p className="text-slate-400 text-sm">Toyota Camry • XYZ 1234</p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">A better way to ride</h2>
            <p className="text-slate-400 text-lg">Designed for comfort, speed, and reliability.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Map size={32} />, title: 'Smart Routing', desc: 'Our AI finds the quickest routes, saving you time and avoiding traffic jams.' },
              { icon: <Star size={32} />, title: 'Top-Rated Drivers', desc: 'Every driver is thoroughly vetted and continuously rated by our community.' },
              { icon: <Smartphone size={32} />, title: 'Seamless App', desc: 'Book a ride in seconds with our beautiful, easy-to-use mobile application.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-800 transition-colors"
              >
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
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
      <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl pt-16 pb-8 px-6 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 mb-8 font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} DriveMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
