import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, Clock, Navigation } from 'lucide-react';
// LandingPage.css has been removed, using Tailwind CSS

export function LandingPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      
      {/* Background Video Band (Bottom half) */}
      <div className="absolute left-0 right-0 bottom-0 h-[60vh] bg-[#0db5ed] z-0 overflow-hidden rounded-t-[3rem]">
        <div className="absolute inset-0 bg-black/10 z-10"></div>
        <video 
          className="absolute inset-0 w-full h-full object-cover object-top opacity-90 mix-blend-overlay"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125119_4963ddd4-c287-4044-b014-b68943cdd8bd.mp4"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125039_45a71f04-36dd-4620-99d8-7526316d439e.png"
          autoPlay muted loop playsInline
        />
      </div>

      {/* Floating Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-black text-white rounded-full px-6 py-3 flex items-center justify-between z-50 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-[#38c6ec]" viewBox="0 0 26 25" fill="none">
            <path fillRule="evenodd" d="M9.45 24.95 L7.07 24.09 L5.56 23.30 L3.33 21.03 L2.31 19.44 L0.74 16.05 L0.27 13.91 L0.29 11.25 L0.80 8.75 L1.95 6.20 L3.26 4.50 L5.15 2.67 L7.77 1.02 L9.91 0.18 L12.16 -0.20 L15.22 -0.16 L17.61 0.35 L19.30 1.06 L20.88 2.06 L22.23 3.37 L24.01 5.48 L24.76 6.58 L25.70 8.63 L26.00 10.35 L26.02 11.35 L25.54 12.12 L24.96 12.32 L22.35 12.36 L21.46 12.18 L20.78 11.85 L20.32 11.37 L19.45 9.56 L17.88 7.58 L16.59 6.60 L14.59 5.84 L13.24 5.69 L11.54 5.93 L10.47 6.44 L9.12 7.35 L7.92 8.50 L6.70 10.55 L6.26 12.65 L6.41 14.36 L7.14 15.86 L8.63 17.79 L12.57 20.70 L12.96 21.60 L13.13 22.82 L12.93 24.36 L12.65 24.86 L12.03 25.35 L11.27 25.42 L9.45 24.95 Z M24.55 25.53 L22.49 24.77 L19.56 23.18 L18.15 22.07 L16.63 20.48 L16.14 19.79 L15.63 18.71 L14.66 15.66 L14.59 14.50 L14.75 13.92 L15.12 13.45 L15.85 13.10 L16.91 12.88 L18.90 12.85 L19.49 13.04 L19.94 13.38 L20.25 13.88 L20.86 15.66 L21.97 17.30 L23.05 18.22 L25.00 19.43 L26.05 20.27 L26.34 20.66 L26.63 21.86 L26.51 23.68 L25.79 25.10 L25.35 25.42 L24.55 25.53 Z" fill="currentColor"/>
          </svg>
          <span className="font-black text-lg tracking-tight">DriveMate<sup className="text-[10px] ml-0.5">2</sup></span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-300">
          <a href="#" className="hover:text-white transition-colors">Rider App</a>
          <a href="#" className="hover:text-white transition-colors">Customer App</a>
          <a href="#" className="hover:text-white transition-colors">Safety</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/master')} 
            className="hidden md:block bg-white text-black font-bold text-sm px-5 py-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            Admin Login
          </button>
          
          <button 
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {navOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] bg-black/95 backdrop-blur-xl text-white rounded-2xl p-6 flex flex-col gap-4 z-50 md:hidden border border-white/10 shadow-2xl animate-in slide-in-from-top-4 fade-in">
          <a href="#" className="text-lg font-medium py-2 border-b border-white/10" onClick={() => setNavOpen(false)}>Rider App</a>
          <a href="#" className="text-lg font-medium py-2 border-b border-white/10" onClick={() => setNavOpen(false)}>Customer App</a>
          <a href="#" className="text-lg font-medium py-2 border-b border-white/10" onClick={() => setNavOpen(false)}>Safety</a>
          <a href="#" className="text-lg font-medium py-2 border-b border-white/10" onClick={() => setNavOpen(false)}>Support</a>
          <button 
            onClick={() => navigate('/master')} 
            className="bg-white text-black font-bold py-3 mt-4 rounded-xl text-lg hover:bg-slate-200 transition-colors"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Hero Content */}
      <main className="relative z-10 pt-40 md:pt-48 pb-20 px-6 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-900 leading-[1.1] max-w-4xl text-balance animate-in fade-in slide-in-from-bottom-8 duration-700">
          Convert your daily commute into a seamless experience
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          From booking to destination, powered by intelligent routing. Skip the hassle and travel safe.
        </p>
        
        <button 
          onClick={() => alert('Download Customer App!')}
          className="mt-10 bg-black text-white font-semibold text-lg px-8 py-3.5 rounded-full hover:bg-slate-800 hover:scale-105 transition-all shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both"
        >
          Get Started
        </button>

        {/* Ride Status Card (Mockup) */}
        <div className="mt-16 md:mt-24 w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
          
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#38c6ec] mb-2 tracking-wide uppercase">Trip ID 1742m • En Route</p>
                <h2 className="text-3xl font-light text-slate-900 tracking-tight">Ride Status</h2>
              </div>
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-amber-700 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-[url('https://api.dicebear.com/7.x/notionists/svg?seed=Felix')] bg-cover" />
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-[url('https://api.dicebear.com/7.x/notionists/svg?seed=Luna')] bg-cover" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                <Clock size={16} />
                <span>ETA: 15 mins</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                <Navigation size={16} />
                <span>Arriving Soon</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 md:p-8">
            <h3 className="font-semibold text-slate-900 text-lg mb-4">Current Trip Details</h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-[#38c6ec] transition-colors cursor-default">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Driver: John Doe (4.9 ⭐)</p>
                  <p className="text-slate-500 text-sm mt-0.5">2 mins away • Honda Activa</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-[#38c6ec] transition-colors cursor-default">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Vehicle: Toyota Prius</p>
                  <p className="text-slate-500 text-sm mt-0.5">License: ABC-1234 (Silver)</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
      
    </div>
  );
}
