import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function AboutUsPage() {

  // Animation Variants
  const fadeDown = {
    initial: { opacity: 0, y: -20 },
    animate: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
  };

  const fadeUp = {
    initial: { opacity: 0, y: 32 },
    animate: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
  };

  const slideUpWord = {
    initial: { y: "110%" },
    animate: (custom) => ({
      y: 0,
      transition: { delay: 0.4 + custom * 0.14, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    })
  };

  return (
    <div className="font-sans min-h-screen flex flex-col relative text-slate-100 bg-[#030712] overflow-hidden selection:bg-[#38c6ec] selection:text-white">
      {/* Background Video with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#030712]/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/70 z-20" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4"
        />
      </div>

      <Navbar />

      {/* Main Content Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen w-full pt-32">

        {/* Stats Row */}
        <div className="flex-1 flex items-center justify-end px-5 sm:px-8 md:px-12 py-8 md:py-0 w-full">
          <div className="flex items-center gap-5 sm:gap-8 md:gap-10">
            {/* Stat 1 */}
            <motion.div custom={2} initial="initial" animate="animate" variants={fadeUp} className="text-right">
              <div className="font-bold tracking-tight text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)' }}>
                <span className="text-[#38c6ec] mr-1" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>+</span>300
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-300 uppercase tracking-widest whitespace-pre-line leading-tight">
                Crafted<br/>Brands
              </div>
            </motion.div>
            
            {/* Stat 2 */}
            <motion.div custom={3} initial="initial" animate="animate" variants={fadeUp} className="text-right">
              <div className="font-bold tracking-tight text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)' }}>
                <span className="text-[#38c6ec] mr-1" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>+</span>200
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-300 uppercase tracking-widest whitespace-pre-line leading-tight">
                Digital<br/>Products
              </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div custom={4} initial="initial" animate="animate" variants={fadeUp} className="text-right">
              <div className="font-bold tracking-tight text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 3.5rem)' }}>
                <span className="text-[#38c6ec] mr-1" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>+</span>100
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-300 uppercase tracking-widest whitespace-pre-line leading-tight">
                Ventures<br/>Funded
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-5 sm:px-8 md:px-12 pb-8 md:pb-12 flex flex-col gap-6 md:gap-12 w-full">
          {/* Row A */}
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            <motion.p custom={5} initial="initial" animate="animate" variants={fadeUp} className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-300 uppercase tracking-widest max-w-[130px] sm:max-w-[160px] md:max-w-xs m-0">
              Shaping bold<br/>visions into power<br/>for your tribe
            </motion.p>
            <motion.a 
              href="#"
              custom={6} initial="initial" animate="animate" variants={fadeUp}
              className="flex items-center gap-1 font-bold text-base sm:text-xl md:text-2xl whitespace-nowrap text-[#38c6ec] hover:text-cyan-300 transition-colors"
            >
              Work With Us
              <ArrowUpRight className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
            </motion.a>
          </div>

          {/* Row B */}
          <div className="flex flex-row items-end justify-between gap-3 sm:gap-4 w-full">
            <motion.div custom={7} initial="initial" animate="animate" variants={fadeUp} className="w-[120px] sm:w-[180px] md:w-[280px] shrink-0">
              <p className="text-[9px] sm:text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest text-left md:text-right m-0 leading-relaxed">
                Creative studios built around elevating your vision into striking reality
              </p>
            </motion.div>
            
            <div className="flex flex-col items-end">
              {['Fearless', 'Vision', 'Delivered'].map((word, index) => (
                <div key={word} className="overflow-hidden">
                  <motion.div
                    custom={index}
                    initial="initial"
                    animate="animate"
                    variants={slideUpWord}
                    className="font-bold text-right text-white tracking-tighter uppercase"
                    style={{ fontSize: 'clamp(2.5rem, 9vw, 9rem)', lineHeight: 0.88 }}
                  >
                    {word}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
