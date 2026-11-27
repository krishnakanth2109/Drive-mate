import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  MapPin, 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Save,
  Bike,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { communityApi } from '../../api/communityApi';

const CITIES = [
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Delhi-NCR',
  'Pune',
  'Chennai',
];

const INDUSTRIES = [
  'Technology & Software',
  'Finance & Banking',
  'Consulting & Advisory',
  'Healthcare & Pharma',
  'Consumer Tech & E-Com',
  'Automotive & EV',
];

export function UserDetailsView({ userProfile, onProfileUpdated, theme = 'dark' }) {
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || userProfile?.name?.split(' ')[0] || '',
    lastName: userProfile?.lastName || userProfile?.name?.split(' ').slice(1).join(' ') || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    profession: userProfile?.profession || '',
    company: userProfile?.company || '',
    industry: userProfile?.industry || '',
    city: userProfile?.city || '',
    purpose: userProfile?.purpose || '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updated = await communityApi.updateMyProfile(formData);
      if (updated) {
        setSuccess(true);
        sessionStorage.setItem('dm_user_profile', JSON.stringify(updated));
        if (onProfileUpdated) {
          onProfileUpdated(updated);
        }
        setTimeout(() => setSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#0284c7] dark:text-[#38c6ec] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Commuter Identity & Profile
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          User Details<span className="text-[#38c6ec]">.</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Manage your verified professional details, workplace information, and carpool preferences.
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Profile details updated successfully! Changes are live across your profile.</span>
        </motion.div>
      )}

      {/* Error Notification */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="lg:col-span-2">
          <form 
            onSubmit={handleSaveProfile} 
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-xl space-y-6 ${
              isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  First Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Last Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Email Address
                  </label>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm cursor-not-allowed ${
                      isDark 
                        ? 'bg-black/20 border border-white/5 text-slate-500' 
                        : 'bg-slate-100 border border-slate-200 text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mobile Contact *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Profession & Workplace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Profession / Designation
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="e.g. Lead Cloud Architect"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Company / Workplace
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="e.g. Tech Mahindra / Manyata"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* City Hub: Visual Pill Chips */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                City Hub
              </label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => {
                  const isSelected = formData.city === c;
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => handleChange('city', c)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-[#38c6ec] text-black font-extrabold shadow-[0_0_12px_rgba(56,198,236,0.35)] scale-105' 
                          : isDark 
                            ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Industry: Visual Chips */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Industry
              </label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => {
                  const isSelected = formData.industry === ind;
                  return (
                    <button
                      type="button"
                      key={ind}
                      onClick={() => handleChange('industry', ind)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected 
                          ? isDark
                            ? 'bg-[#38c6ec]/20 border-[#38c6ec] text-white shadow-sm font-bold'
                            : 'bg-sky-100 border-sky-400 text-sky-900 font-bold'
                          : isDark 
                            ? 'bg-black/30 text-slate-400 hover:text-white border border-white/5' 
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#38c6ec]" />}
                      <span>{ind}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Commute Objective & Bio
              </label>
              <textarea
                rows={2}
                value={formData.purpose}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="Share your typical daily schedule or carpool preferences..."
                className={`w-full rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                  isDark 
                    ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-sky-500'
                }`}
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(56,198,236,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Verification Status & Badges */}
        <div className="space-y-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <ShieldCheck className="w-4 h-4 text-[#38c6ec]" />
            Verification Badges
          </h2>

          <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Verified</span>
                <span className="text-[11px] text-slate-400">Firebase Auth authentication active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#38c6ec]/15 border border-[#38c6ec]/30 flex items-center justify-center text-[#38c6ec]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Corporate Hub Member</span>
                <span className="text-[11px] text-slate-400">{formData.company || 'Tech Hub'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Verified Urban Biker 2026</span>
                <span className="text-[11px] text-slate-400">Community trust score 4.9/5.0</span>
              </div>
            </div>

            <div className={`pt-3 border-t text-[11px] leading-relaxed ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              Your profile is verified with Google Firebase Authentication and your commuter organization. Fellow commuters see your verified badge when connecting.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
