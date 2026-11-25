import React, { useState } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Clock, 
  Calendar, 
  Bike, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  ShieldCheck,
  Zap,
  Info,
  Check,
  HeartHandshake
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const CITIES = [
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Delhi-NCR',
  'Pune',
  'Chennai',
];

const SCHEDULE_OPTIONS = [
  { id: 'Mon - Fri', label: 'Mon - Fri', sub: 'Standard Workdays' },
  { id: 'Daily', label: 'Daily', sub: 'All 7 Days' },
  { id: 'Mon - Sat', label: 'Mon - Sat', sub: '6-Day Work' },
  { id: 'Weekends Only', label: 'Weekends', sub: 'Sat & Sun' },
];

const BIKE_TYPES = [
  { id: 'Commuter Motorcycle', label: 'Commuter Bike', icon: Bike, desc: '100cc - 160cc (Splendor, Pulsar, Shine)' },
  { id: 'Electric Two-Wheeler (EV)', label: 'Electric EV Bike', icon: Zap, desc: 'Ather, Ola, Chetak, iQube' },
  { id: 'Comfort Scooter', label: 'Gearless Scooter', icon: Bike, desc: 'Activa, Jupiter, Access, Fascino' },
  { id: 'Cruiser & Tourer', label: 'Cruiser Bike', icon: Bike, desc: 'Royal Enfield, Dominar, Duke' },
];

export function PostRideView({ userProfile, onPostPublished, API_URL, theme = 'dark' }) {
  const isDark = theme === 'dark';

  const [formData, setPostFormData] = useState({
    fromLocation: '',
    toLocation: '',
    departureTime: '08:30 AM',
    returnTime: '06:15 PM',
    days: 'Mon - Fri',
    vehicleType: 'Commuter Motorcycle',
    seatsAvailable: 1, // Fixed 1 Pillion Rider Slot for Two-Wheeler BikePool
    spareHelmetProvided: true,
    preferences: 'Spare helmet provided • Punctual departures • Small backpack only',
    city: userProfile?.city || 'Bangalore',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setPostFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlePublish = async (e) => {
    e?.preventDefault();
    if (!formData.fromLocation.trim()) {
      setError('Please specify origin location (e.g. HSR Layout, Sector 2).');
      return;
    }
    if (!formData.toLocation.trim()) {
      setError('Please specify destination tech park / workplace (e.g. Manyata Tech Park).');
      return;
    }

    setLoading(true);
    setError('');

    const token = sessionStorage.getItem('dm_user_token');

    try {
      const res = await axios.post(`${API_URL}/community/posts`, {
        ...formData,
        fuelShareCost: 0, // Zero cost / free community carpool
      }, {
        headers: token ? { 'x-auth-token': token } : {},
      });

      if (res.data?.data) {
        setSuccess(true);
        if (onPostPublished) {
          onPostPublished(res.data.data);
        }

        setPostFormData((prev) => ({
          ...prev,
          fromLocation: '',
          toLocation: '',
        }));

        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to post ride:', err);
      setError(err.response?.data?.message || 'Failed to post ride. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#0284c7] dark:text-[#38c6ec] text-xs font-semibold mb-2">
          <Bike className="w-3.5 h-3.5" />
          Verified Urban BikePool Network
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Post a Bike Ride Daily<span className="text-[#38c6ec]">.</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Offer your bike's pillion ride to verified colleagues on your commute route. Beat traffic jams on two wheels, 100% free, and eco-friendly.
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold block">Ride Published Successfully!</span>
              <span>Your carpool offer is now live across the {formData.city} network.</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Alert */}
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

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form 
            onSubmit={handlePublish} 
            className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-xl space-y-6 ${
              isDark 
                ? 'bg-slate-900/80 border-white/10' 
                : 'bg-white border-slate-200'
            }`}
          >
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Origin / Pickup Point *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#38c6ec] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.fromLocation}
                    onChange={(e) => handleChange('fromLocation', e.target.value)}
                    placeholder="e.g. HSR Layout, Sector 2"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 transition-all ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Destination Workplace / Tech Park *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.toLocation}
                    onChange={(e) => handleChange('toLocation', e.target.value)}
                    placeholder="e.g. Manyata Tech Park, Gate 3"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 transition-all ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* City Hub: Visual Pill Selectors */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Select City Hub
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

            {/* Commute Schedule: Interactive Segmented Chips */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Commute Days & Schedule
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SCHEDULE_OPTIONS.map((opt) => {
                  const isSelected = formData.days === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => handleChange('days', opt.id)}
                      className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                        isSelected 
                          ? isDark
                            ? 'bg-[#38c6ec]/15 border-[#38c6ec] text-white shadow-[0_0_15px_rgba(56,198,236,0.2)]'
                            : 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm'
                          : isDark 
                            ? 'bg-black/30 border-white/5 text-slate-400 hover:border-white/15' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-xs font-bold block ${isSelected ? (isDark ? 'text-[#38c6ec]' : 'text-sky-700') : ''}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{opt.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Morning Departure Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.departureTime}
                    onChange={(e) => handleChange('departureTime', e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Evening Return Time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.returnTime}
                    onChange={(e) => handleChange('returnTime', e.target.value)}
                    placeholder="e.g. 06:15 PM"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Two-Wheeler Pillion Slot & Spare Helmet Safety */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Two-Wheeler Capacity
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Standard 1 Pillion Rider Slot (Fixed for BikePool)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Bike className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1 Pillion Spot</span>
                </div>
              </div>

              {/* Spare Helmet Choice */}
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Pillion Helmet Safety Provision
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleChange('spareHelmetProvided', true)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      formData.spareHelmetProvided
                        ? isDark
                          ? 'bg-[#38c6ec]/15 border-[#38c6ec] text-white shadow-[0_0_15px_rgba(56,198,236,0.2)]'
                          : 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm'
                        : isDark
                          ? 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">🪖 Spare Helmet Provided</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">I have an extra clean helmet for co-rider</span>
                    </div>
                    {formData.spareHelmetProvided && <Check className="w-4 h-4 text-[#38c6ec] shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('spareHelmetProvided', false)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      !formData.spareHelmetProvided
                        ? isDark
                          ? 'bg-[#38c6ec]/15 border-[#38c6ec] text-white shadow-[0_0_15px_rgba(56,198,236,0.2)]'
                          : 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm'
                        : isDark
                          ? 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">🎒 Co-Rider Carries Helmet</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Pillion rider must bring certified helmet</span>
                    </div>
                    {!formData.spareHelmetProvided && <Check className="w-4 h-4 text-[#38c6ec] shrink-0" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bike / Two-Wheeler Type: Visual Clickable Cards */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Bike / Two-Wheeler Model
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BIKE_TYPES.map((v) => {
                  const Icon = v.icon;
                  const isSelected = formData.vehicleType === v.id;
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleChange('vehicleType', v.id)}
                      className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                        isSelected 
                          ? isDark
                            ? 'bg-[#38c6ec]/15 border-[#38c6ec] text-white shadow-[0_0_15px_rgba(56,198,236,0.2)]'
                            : 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm'
                          : isDark 
                            ? 'bg-black/30 border-white/5 text-slate-400 hover:border-white/15' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#38c6ec]' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold block ${isSelected ? (isDark ? 'text-[#38c6ec]' : 'text-sky-700') : ''}`}>
                        {v.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{v.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commute Preferences */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Ride Preferences & Guidelines
              </label>
              <input
                type="text"
                value={formData.preferences}
                onChange={(e) => handleChange('preferences', e.target.value)}
                placeholder="e.g. AC on • Punctual departures • Non-smoking • Quiet ride"
                className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                  isDark 
                    ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                }`}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-extrabold text-sm transition-all shadow-[0_0_25px_rgba(56,198,236,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Ride to Commuter Network...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Daily Ride Offer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Info className="w-4 h-4 text-[#38c6ec]" />
            Live Community Card Preview
          </h2>

          <div className={`p-6 rounded-3xl border backdrop-blur-xl shadow-xl space-y-4 ${
            isDark 
              ? 'bg-slate-900/90 border-[#38c6ec]/30' 
              : 'bg-white border-sky-200 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-sm">
                  {userProfile?.name ? userProfile.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {userProfile?.name || 'Your Profile'}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {userProfile?.company || 'Verified Professional'}
                  </div>
                </div>
              </div>

              <span className="text-[10px] bg-[#38c6ec]/15 text-[#0284c7] dark:text-[#38c6ec] border border-[#38c6ec]/30 px-2.5 py-0.5 rounded-full font-semibold">
                {formData.city}
              </span>
            </div>

            {/* Route */}
            <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <MapPin className="w-3.5 h-3.5 text-[#38c6ec]" />
                <span className="font-semibold">{formData.fromLocation || 'Enter Origin'}</span>
              </div>
              <div className="pl-1.5 border-l-2 border-dashed border-slate-400/30 h-3 ml-1.5" />
              <div className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold">{formData.toLocation || 'Enter Destination'}</span>
              </div>
            </div>

            {/* Timing & Pillion Capacity */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Departure:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.departureTime}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pillion Spot:</span>
                <span className="text-emerald-500 font-bold">1 Rider (Available)</span>
              </div>
            </div>

            {/* Helmet & Safety Status */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Helmet Provision:</span>
              <span className="font-semibold text-[#0284c7] dark:text-[#38c6ec]">
                {formData.spareHelmetProvided ? 'Spare Helmet Provided' : 'Co-Rider Carries Helmet'}
              </span>
            </div>

            {/* Community Free BikePool Badge */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#38c6ec]/10 border-[#38c6ec]/20' : 'bg-sky-50 border-sky-200'
            }`}>
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#38c6ec]" />
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Community BikePool</span>
              </div>
              <span className="text-[10px] font-bold text-[#0284c7] dark:text-[#38c6ec] uppercase tracking-wider">
                100% Free Shared
              </span>
            </div>

            {/* Vehicle Details */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bike: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{formData.vehicleType}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                {formData.days}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
