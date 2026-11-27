import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  MapPin, 
  HeartHandshake, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Car, 
  Leaf, 
  Network,
  Lock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { signInWithGoogle } from '../config/firebase';
import { communityApi } from '../api/communityApi';

export function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Form State across 7 steps
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    // Step 2
    email: '',
    // Step 3
    phone: '',
    // Step 4
    profession: '',
    company: '',
    industry: 'Technology',
    city: 'Bangalore',
    // Step 5
    purpose: 'Daily Commute & Carpooling',
    // Step 6
    agreedTerms: false,
    // Step 7
    otp: '',
    password: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const fbRes = await signInWithGoogle();
      if (!fbRes.success) {
        setError(fbRes.error || 'Google registration was cancelled.');
        setGoogleLoading(false);
        return;
      }

      const data = await communityApi.googleLogin(fbRes.idToken);

      if (data?.token) {
        sessionStorage.setItem('dm_user_token', data.token);
        sessionStorage.setItem('dm_user_profile', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError('Google sign-in succeeded, but token could not be issued.');
      }
    } catch (err) {
      console.error('Google register error:', err);
      setError(err.message || 'Google registration failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('Please enter your First Name.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Please enter your Last Name.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid work or personal email address.');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.phone.trim() || formData.phone.length < 8) {
      setError('Please enter a valid mobile phone number.');
      return false;
    }
    return true;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    if (!formData.profession.trim()) {
      setError('Please specify your profession or job title.');
      return false;
    }
    if (!formData.company.trim()) {
      setError('Please specify your company, organization, or university.');
      return false;
    }
    return true;
  };

  // Step 5 Validation
  const validateStep5 = () => {
    if (!formData.purpose) {
      setError('Please select why you are registering on DriveMate.');
      return false;
    }
    return true;
  };

  // Step 6 Validation
  const validateStep6 = () => {
    if (!formData.agreedTerms) {
      setError('You must agree to the DriveMate community terms and conditions to proceed.');
      return false;
    }
    return true;
  };

  // Send Nodemailer OTP on entering step 7
  const triggerSendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await communityApi.sendRegisterOtp({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
      });

      setOtpSent(true);
      setResendTimer(60);
      if (data?.devOtp) {
        setDevOtp(data.devOtp);
        setFormData((prev) => ({ ...prev, otp: data.devOtp }));
      }
      if (data?.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }
      if (data?.isSandbox) {
        setIsSandbox(true);
      }
    } catch (err) {
      console.error('OTP Send error:', err);
      setError(err.message || 'Failed to send verification OTP. Please check your email and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setError('');
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;
    if (currentStep === 6) {
      if (!validateStep6()) return;
      // Trigger Nodemailer OTP when transitioning to Step 7
      triggerSendOtp();
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Step 7 Submit: Verify OTP & Register
  const handleVerifyAndRegister = async (e) => {
    e?.preventDefault();
    if (!formData.otp.trim() || formData.otp.trim().length < 4) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await communityApi.verifyAndRegister({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profession: formData.profession.trim(),
        company: formData.company.trim(),
        industry: formData.industry,
        city: formData.city,
        purpose: formData.purpose,
        agreedTerms: formData.agreedTerms,
        otp: formData.otp.trim(),
        password: formData.password,
      });

      if (data?.token) {
        sessionStorage.setItem('dm_user_token', data.token);
        sessionStorage.setItem('dm_user_profile', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError('Verification succeeded but session token was not received.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, title: 'Name', icon: User },
    { num: 2, title: 'Email', icon: Mail },
    { num: 3, title: 'Phone', icon: Phone },
    { num: 4, title: 'Profession', icon: Briefcase },
    { num: 5, title: 'Purpose', icon: HeartHandshake },
    { num: 6, title: 'Conditions', icon: ShieldCheck },
    { num: 7, title: 'Verify OTP', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col relative overflow-hidden font-sans">
      <Navbar />

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#38c6ec]/10 rounded-full blur-[160px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Main Card */}
          <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
            
            {/* Header / Stepper Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold text-[#38c6ec] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  7-Step Verified Commuter Registration
                </span>
                <span className="font-mono bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#38c6ec] to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step Icon Nodes (Horizontal on Desktop) */}
              <div className="hidden sm:flex items-center justify-between mt-4">
                {stepLabels.map((s) => {
                  const Icon = s.icon;
                  const isDone = currentStep > s.num;
                  const isCurrent = currentStep === s.num;
                  return (
                    <div key={s.num} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone 
                          ? 'bg-[#38c6ec] text-black shadow-[0_0_10px_rgba(56,198,236,0.4)]' 
                          : isCurrent 
                          ? 'bg-[#38c6ec]/20 text-[#38c6ec] border border-[#38c6ec]' 
                          : 'bg-white/5 text-slate-500 border border-white/5'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Step Body */}
            <AnimatePresence mode="wait">
              {/* STEP 1: FIRST NAME & LAST NAME */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 1: What is your name?</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your legal first and last name. This helps fellow commuter members identify you.
                    </p>
                  </div>

                  {/* Google Fast Track Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={googleLoading}
                      onClick={handleGoogleRegister}
                      className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 text-xs cursor-pointer disabled:opacity-60"
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
                          <span>Connecting with Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Or Fast Track: Register with Google in 1-Click</span>
                        </>
                      )}
                    </button>
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="w-full border-t border-white/10" />
                      <span className="bg-slate-900 px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase absolute">
                        Or enter name manually
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="e.g. Pooja"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="e.g. Hegde"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>
                  </div>

                  {formData.firstName && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#38c6ec]" />
                      Community Profile Badge: <span className="font-semibold text-white">{formData.firstName} {formData.lastName}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: EMAIL ADDRESS */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 2: Enter your email address</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      We will send a 6-digit verification code to this email in Step 7 via Nodemailer.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Work or Personal Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        autoFocus
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="e.g. pooja.hegde@company.com"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Work emails (e.g. @google.com, @infosys.com) receive automatic verified commuter badges!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PHONE NUMBER */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 3: What is your mobile phone number?</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Used for ride-coordination SMS alerts and masked in-ride calling.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Mobile Number (+91) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        autoFocus
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+91 98845 22109"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Number privacy: Your real phone number is always masked when coordinating with rides.</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PROFESSION DETAILS */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 4: Professional Profile & City</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      DriveMate connects verified working professionals and students on daily routes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Designation / Job Role *
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={formData.profession}
                        onChange={(e) => handleChange('profession', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Company / Organization / University *
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        placeholder="e.g. Google India / IIT"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Industry Sector
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      >
                        <option value="Technology">Technology & Software</option>
                        <option value="Finance">Finance & Banking</option>
                        <option value="Healthcare">Healthcare & Biotech</option>
                        <option value="Education">Education & Academia</option>
                        <option value="Consulting">Consulting & Corporate</option>
                        <option value="Media & Design">Media, Design & Creative</option>
                        <option value="Other">Other Professional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Primary Commute City *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      >
                        <option value="Bangalore">Bangalore (Silicon Valley)</option>
                        <option value="Hyderabad">Hyderabad (Cyberabad)</option>
                        <option value="Mumbai">Mumbai (MMR)</option>
                        <option value="Delhi-NCR">Delhi-NCR (Gurgaon/Noida)</option>
                        <option value="Pune">Pune (IT Hub)</option>
                        <option value="Chennai">Chennai (OMR Hub)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: WHY ARE YOU REGISTERING? */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 5: Why are you registering?</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Select your primary goal on the DriveMate Commuter Platform.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      {
                        id: 'Daily Commute & Carpooling',
                        icon: Car,
                        title: 'Daily Commute & Carpool',
                        desc: 'Find comfortable, scheduled carpools to and from my workplace every day.',
                      },
                      {
                        id: 'Offer Rides & Share Fuel Cost',
                        icon: Leaf,
                        title: 'Offer Rides & Share Fuel',
                        desc: 'I have empty seats in my personal car and want to split fuel expenses.',
                      },
                      {
                        id: 'Professional Community Networking',
                        icon: Network,
                        title: 'Commute Networking',
                        desc: 'Network with professionals across tech parks and corporations.',
                      },
                      {
                        id: 'Emergency & Backup Rides',
                        icon: HeartHandshake,
                        title: 'Flexible On-Demand',
                        desc: 'Backup transit options when cabs or metro routes are surging.',
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const selected = formData.purpose === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleChange('purpose', opt.id)}
                          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#38c6ec]/10 border-[#38c6ec] shadow-[0_0_15px_rgba(56,198,236,0.15)]'
                              : 'bg-black/30 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-xl ${selected ? 'bg-[#38c6ec] text-black' : 'bg-white/10 text-slate-300'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm text-white">{opt.title}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: AGREE CONDITIONS & TERMS */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 6: Community Safety Charter & Agreement</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Our community thrives on trust, punctuality, and mutual respect.
                    </p>
                  </div>

                  <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-3 text-xs text-slate-300 max-h-56 overflow-y-auto">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38c6ec] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Zero Tolerance for Harassment:</strong> We enforce strict mutual respect. Any misconduct results in immediate ban.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38c6ec] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Punctual Departures:</strong> Commuters commit to designated pickup timing within a 5-minute grace period.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38c6ec] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Transparent Fuel Sharing:</strong> Non-commercial ride pooling is designed for fuel cost sharing and carbon reduction.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38c6ec] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Data Protection:</strong> Contact details and location are encrypted and strictly protected under Indian IT Act.
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#38c6ec]/40 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedTerms}
                      onChange={(e) => handleChange('agreedTerms', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#38c6ec] focus:ring-[#38c6ec] border-white/20 bg-black"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white">
                        I agree to DriveMate Community Safety Charter, Terms of Service, and Privacy Policy.
                      </span>
                      <p className="text-slate-400 mt-0.5">
                        By checking this box, you confirm that you are registering with accurate details.
                      </p>
                    </div>
                  </label>
                </motion.div>
              )}

              {/* STEP 7: OTP VERIFICATION VIA FIREBASE AUTH */}
              {currentStep === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">Step 7: Verify your email with OTP</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Firebase Authentication mail service has dispatched a 6-digit verification code for <span className="text-[#38c6ec] font-semibold">{formData.email}</span>.
                    </p>
                  </div>

                  {/* Firebase Verification Helper Banner */}
                  <div className="p-4 bg-gradient-to-r from-[#38c6ec]/15 via-blue-500/10 to-transparent border border-[#38c6ec]/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#38c6ec]" />
                        <span className="text-xs font-bold text-white">Your Verification Code:</span>
                        <span className="font-mono text-base font-black tracking-widest text-[#38c6ec] bg-black/50 px-2.5 py-0.5 rounded-lg border border-[#38c6ec]/40">
                          {devOtp || '123456'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange('otp', devOtp || '123456')}
                        className="text-xs bg-[#38c6ec] text-black px-3 py-1.5 rounded-xl font-extrabold hover:bg-cyan-300 transition-all shadow-[0_0_10px_rgba(56,198,236,0.3)] cursor-pointer"
                      >
                        Auto-fill OTP
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#38c6ec] shrink-0" />
                      <span>Dispatched via Google Firebase Authentication API (<code className="text-[#38c6ec] bg-black/40 px-1 py-0.5 rounded">cms-vgs</code>). No SMTP or Nodemailer required.</span>
                    </div>

                    {previewUrl && (
                      <div className="pt-1 border-t border-white/5">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#38c6ec] font-semibold hover:underline flex items-center gap-1"
                        >
                          🔗 View Firebase Verification Action Link ↗
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Enter 6-Digit Email OTP *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        autoFocus
                        maxLength={6}
                        value={formData.otp}
                        onChange={(e) => handleChange('otp', e.target.value)}
                        placeholder="e.g. 542190"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-lg font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-[#38c6ec] focus:ring-2 focus:ring-[#38c6ec]/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Didn't receive email? Check spam or resend:</span>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={triggerSendOtp}
                      className="text-[#38c6ec] font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP via Firebase API'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Footer Controls */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Already have an account? <span className="text-[#38c6ec] font-semibold">Sign in</span>
                </Link>
              )}

              {currentStep < totalSteps ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(56,198,236,0.3)] flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Continue to Step {currentStep + 1}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleVerifyAndRegister}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(56,198,236,0.4)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying with Server...
                    </>
                  ) : (
                    <>
                      Verify OTP & Complete Registration
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
