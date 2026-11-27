import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  Sparkles, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  Building2, 
  HeartHandshake, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  Send, 
  Filter, 
  Share2, 
  ThumbsUp,
  TrendingUp,
  UserCheck,
  Shield,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const CITIES = [
  'All Cities',
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Delhi-NCR',
  'Pune',
  'Chennai',
];

export function DashboardOverview({ 
  userProfile, 
  posts = [], 
  setActiveTab, 
  connectedUsers = [], 
  theme = 'dark',
  onOpenChat
}) {
  const isDark = theme === 'dark';
  const [selectedHub, setSelectedHub] = useState('All Cities');
  const [requestedRides, setRequestedRides] = useState({});

  const trendingRoutes = React.useMemo(() => {
    const counts = new Map();
    for (const p of posts) {
      if (!p?.fromLocation || !p?.toLocation) continue;
      const key = `${p.city || 'Other'}||${p.fromLocation}||${p.toLocation}`;
      const cur = counts.get(key) || {
        from: p.fromLocation,
        to: p.toLocation,
        city: p.city || 'City',
        bikers: 0,
      };
      cur.bikers += 1;
      counts.set(key, cur);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.bikers - a.bikers)
      .slice(0, 4);
  }, [posts]);

  const handleRequestPillion = (rideId, postObj) => {
    setRequestedRides((prev) => ({ ...prev, [rideId]: true }));
    if (onOpenChat && postObj) {
      onOpenChat(postObj);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedHub === 'All Cities') return true;
    return p.city && p.city.toLowerCase() === selectedHub.toLowerCase();
  });

  const getCleanVehicleType = (type) => {
    if (!type || type.toLowerCase().includes('car')) {
      return 'Commuter Motorcycle';
    }
    return type;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
      {/* ========================================================
          LEFT COLUMN: LinkedIn Style User Profile Card & Badges
         ======================================================== */}
      <div className="md:col-span-4 lg:col-span-3 space-y-4">
        {/* Profile Card */}
        <div className={`rounded-3xl border overflow-hidden backdrop-blur-xl shadow-lg transition-all ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          {/* Header Banner */}
          <div className="h-20 bg-gradient-to-r from-[#38c6ec] via-blue-600 to-indigo-600 relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Avatar & Info */}
          <div className="px-4 pb-4 pt-0 relative">
            {/* Overlapping Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#38c6ec] to-blue-500 border-4 border-white dark:border-slate-900 flex items-center justify-center font-extrabold text-black text-xl shadow-md -mt-8 mb-2">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {userProfile?.name || 'Commuter'}
                </h3>
                <ShieldCheck className="w-4 h-4 text-[#38c6ec]" />
              </div>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {userProfile?.profession || 'Community Member'}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{userProfile?.company || 'DriveMate Network'}</span>
              </p>
            </div>

            {/* City Hub Tag */}
            <div className={`mt-3 p-2 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <MapPin className="w-3.5 h-3.5 text-[#38c6ec]" />
                {userProfile?.city || 'City Not Set'}
              </span>
              <span className="text-[10px] font-bold text-[#0284c7] dark:text-[#38c6ec] bg-[#38c6ec]/15 px-2 py-0.5 rounded-full border border-[#38c6ec]/30">
                {userProfile?.isEmailVerified ? 'Verified' : 'Member'}
              </span>
            </div>

            {/* Commuter Metrics */}
            <div className={`mt-4 pt-3 border-t space-y-2 text-xs ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span>Community Listings</span>
                <strong className={isDark ? 'text-[#38c6ec]' : 'text-sky-600'}>{posts.length}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Colleague Connections</span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{connectedUsers.length} peers</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Wallet Balance</span>
                <strong className="text-emerald-500 font-bold">₹{Number(userProfile?.walletBalance ?? 0).toFixed(0)}</strong>
              </div>
            </div>

            {/* Quick Profile Links */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('user-details')}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>

        {/* Safety & Helmet Guidelines Widget */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg space-y-3 ${
          isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Community Safety Rules
            </h4>
          </div>

          <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-base">🪖</span>
              <span><strong>ISI / DOT Helmet Mandatory:</strong> Rider & Pillion must always wear certified helmets.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">🤝</span>
              <span><strong>100% Free Shared Ride:</strong> Zero fare community carpooling among verified workplace peers.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">⚡</span>
              <span><strong>Traffic Bypass:</strong> Beat city peak traffic jams faster and eco-friendly on two wheels.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CENTER COLUMN: LinkedIn Style "Start a Post" & Feed
         ======================================================== */}
      <div className="md:col-span-8 lg:col-span-6 space-y-4">
        {/* LinkedIn "Start a Post / Share a Bike Ride" Card */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg space-y-3 ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-sm shrink-0">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Clickable post trigger bar */}
            <button
              onClick={() => setActiveTab('post-ride')}
              className={`flex-1 text-left px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                isDark 
                  ? 'bg-black/40 border-white/10 text-slate-400 hover:border-[#38c6ec]/50 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:border-sky-400 hover:text-slate-800'
              }`}
            >
              Offer a bike ride or share your pillion seat with colleagues...
            </button>
          </div>

          {/* Quick Action Icons Row (LinkedIn style) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('post-ride')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                isDark ? 'hover:bg-white/5 text-[#38c6ec]' : 'hover:bg-slate-100 text-sky-600'
              }`}
            >
              <Bike className="w-4 h-4 text-[#38c6ec]" />
              <span>Offer Pillion</span>
            </button>

            <button
              onClick={() => setActiveTab('post-ride')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                isDark ? 'hover:bg-white/5 text-amber-400' : 'hover:bg-slate-100 text-amber-600'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Electric EV</span>
            </button>

            <button
              onClick={() => setActiveTab('post-ride')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                isDark ? 'hover:bg-white/5 text-emerald-400' : 'hover:bg-slate-100 text-emerald-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Spare Helmet</span>
            </button>

            <button
              onClick={() => setActiveTab('post-ride')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                isDark ? 'hover:bg-white/5 text-purple-400' : 'hover:bg-slate-100 text-purple-600'
              }`}
            >
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>Set Route</span>
            </button>
          </div>
        </div>

        {/* City Hub Filter Pills */}
        <div className={`p-3 rounded-2xl border backdrop-blur-md flex items-center gap-2 overflow-x-auto scrollbar-none shadow-sm ${
          isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-xs font-semibold flex items-center gap-1 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Filter className="w-3.5 h-3.5 text-[#38c6ec]" />
            Hub:
          </span>
          {CITIES.map((city) => {
            const isSelected = selectedHub === city;
            return (
              <button
                key={city}
                onClick={() => setSelectedHub(city)}
                className={`
                  px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                  ${isSelected 
                    ? 'bg-[#38c6ec] text-black font-extrabold shadow-sm' 
                    : isDark 
                      ? 'bg-white/5 text-slate-400 hover:text-white' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'}
                `}
              >
                {city}
              </button>
            );
          })}
        </div>

        {/* Feed Header */}
        <div className={`flex items-center justify-between text-xs px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>Showing <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredPosts.length}</strong> active community bike rides</span>
          {selectedHub !== 'All Cities' && (
            <span className="text-[#38c6ec] font-semibold">{selectedHub} Hub</span>
          )}
        </div>

        {/* Feed Posts List (LinkedIn Style Cards) */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className={`p-10 text-center rounded-3xl border space-y-3 ${
              isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'
            }`}>
              <Bike className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No Community Bike Rides in {selectedHub}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first to share your bike's pillion ride on this route or switch to "All Cities".
              </p>
              <button
                onClick={() => setActiveTab('post-ride')}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-[#38c6ec] text-black font-extrabold text-xs shadow-md"
              >
                Post a Bike Ride Now
              </button>
            </div>
          ) : (
            filteredPosts.map((ride, idx) => {
              const rideKey = ride.id || idx;
              const isRequested = requestedRides[rideKey];
              const vehicleDisplay = getCleanVehicleType(ride.vehicleType);

              return (
                <motion.div
                  key={rideKey}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-3xl border backdrop-blur-xl shadow-lg transition-all space-y-3.5 group ${
                    isDark 
                      ? 'bg-slate-900/80 border-white/10 hover:border-[#38c6ec]/30' 
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  {/* LinkedIn Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-sm shadow-md shrink-0">
                        {ride.driverName ? ride.driverName.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div>
                        <div className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>{ride.driverName || 'Verified Commuter'}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#38c6ec]" />
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{ride.driverCompany || 'Corporate Tech Hub'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>2h ago</span>
                          <span>•</span>
                          <span>🌐 Commuter Network</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] bg-[#38c6ec]/10 text-[#0284c7] dark:text-[#38c6ec] border border-[#38c6ec]/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
                      {ride.city || 'Bangalore'}
                    </span>
                  </div>

                  {/* Route Timeline Box */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#38c6ec] shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Origin / Pickup</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ride.fromLocation}</span>
                      </div>
                    </div>
                    <div className="pl-2 border-l border-dashed border-slate-400/30 h-2 ml-2" />
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Workplace Destination</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ride.toLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Badges */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Time
                      </span>
                      <span className={`font-medium truncate block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ride.departureTime || '08:30 AM'}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> Days
                      </span>
                      <span className={`font-medium truncate block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ride.days || 'Mon-Fri'}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                        <Bike className="w-2.5 h-2.5 text-[#38c6ec]" /> Pillion
                      </span>
                      <span className="text-emerald-500 font-bold block">1 Rider Spot</span>
                    </div>
                  </div>

                  {/* Bike Model & Helmet Pill */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Bike className="w-3.5 h-3.5 text-[#38c6ec]" />
                      {vehicleDisplay}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0284c7] dark:text-[#38c6ec] bg-[#38c6ec]/10 px-2 py-0.5 rounded-full border border-[#38c6ec]/20">
                      {ride.spareHelmetProvided ? '🪖 Spare Helmet: Yes' : '🎒 Helmet: BYO'}
                    </span>
                  </div>

                  {/* LinkedIn Style Engagement & Action Bar */}
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      100% Free Shared
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRequestPillion(rideKey, ride)}
                        disabled={isRequested}
                        className={`
                          px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer
                          ${isRequested 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-[#38c6ec] hover:bg-[#2bb4d8] text-black shadow-md'}
                        `}
                      >
                        {isRequested ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pillion Requested!</span>
                          </>
                        ) : (
                          <>
                            <Bike className="w-3.5 h-3.5" />
                            <span>Request Pillion</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onOpenChat && onOpenChat({
                          id: ride.driverId || 'peer-1',
                          name: ride.driverName || 'Commuter Driver',
                          company: ride.driverCompany || 'Tech Park',
                          city: ride.city || 'Bangalore'
                        })}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-[#38c6ec]' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-sky-600'
                        }`}
                        title="Chat with Driver"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Trending Commutes & Active Colleagues
         ======================================================== */}
      <div className="hidden lg:block lg:col-span-3 space-y-4">
        {/* Trending Routes Widget */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg space-y-3 ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-3.5 h-3.5 text-[#38c6ec]" />
              Trending Commute Routes
            </h4>
            <span className="text-[10px] text-slate-400">Today</span>
          </div>

          <div className="space-y-2.5">
            {trendingRoutes.length === 0 ? (
              <p className="text-[11px] text-slate-400">No active commute routes posted yet.</p>
            ) : (
              trendingRoutes.map((route, i) => (
                <div 
                  key={i}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    isDark ? 'bg-white/5 border-white/5 hover:border-white/15' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#38c6ec] font-bold">{route.city}</span>
                    <span className="text-[10px] text-emerald-500 font-semibold">{route.bikers} Active</span>
                  </div>
                  <div className={`font-semibold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {route.from} ➔ {route.to}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urban BikePool Community Widget */}
        <div className={`p-4 rounded-3xl border backdrop-blur-xl shadow-lg space-y-3 ${
          isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#38c6ec]" />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Urban Commuter Network
            </h4>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Connect with verified colleagues across Bangalore, Hyderabad, Mumbai, and Delhi-NCR tech hubs. Share your commute and ride clean.
          </p>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#38c6ec]" />
            <span>Open Community Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default DashboardOverview;
