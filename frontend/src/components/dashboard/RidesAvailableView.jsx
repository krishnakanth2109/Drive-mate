import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Loader2,
  RefreshCw,
  Building2,
  HeartHandshake
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

export function RidesAvailableView({ 
  posts = [], 
  loading = false, 
  selectedCity = 'All Cities', 
  setSelectedCity,
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  connectedDrivers = [],
  onOpenChat,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';
  const [seatRequestedId, setSeatRequestedId] = useState(null);

  const filteredPosts = posts.filter((p) => {
    const matchCity = selectedCity === 'All Cities' || (p.city && p.city.toLowerCase() === selectedCity.toLowerCase());
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      (p.fromLocation && p.fromLocation.toLowerCase().includes(query)) ||
      (p.toLocation && p.toLocation.toLowerCase().includes(query)) ||
      (p.driverName && p.driverName.toLowerCase().includes(query)) ||
      (p.driverCompany && p.driverCompany.toLowerCase().includes(query));
    return matchCity && matchSearch;
  });

  const handleRequestSeat = (rideId) => {
    setSeatRequestedId(rideId);
    setTimeout(() => {
      setSeatRequestedId(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#0284c7] dark:text-[#38c6ec] text-xs font-semibold mb-2">
            <Bike className="w-3.5 h-3.5" />
            Verified Urban BikePool Network
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Available Bike Rides<span className="text-[#38c6ec]">.</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Browse verified two-wheeler commutes across urban hubs. Hop on a colleague's bike pillion and beat traffic jams for free.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className={`px-4 py-2.5 rounded-2xl border font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto ${
            isDark 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#38c6ec]' : ''}`} />
          <span>Refresh Listings</span>
        </button>
      </div>

      {/* Search & City Filter Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-xl shadow-xl space-y-4 ${
        isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pickup, destination, tech park, or driver name..."
            className={`w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 transition-all ${
              isDark 
                ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
            }`}
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className={`text-xs font-semibold flex items-center gap-1 shrink-0 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Filter className="w-3.5 h-3.5 text-[#38c6ec]" />
            Hub:
          </span>
          {CITIES.map((city) => {
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-[#38c6ec] text-black font-extrabold shadow-[0_0_12px_rgba(56,198,236,0.3)] scale-105' 
                    : isDark 
                      ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'}
                `}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Listings Counter */}
      <div className={`flex items-center justify-between text-xs px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <span>Showing <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredPosts.length}</strong> active bike rides</span>
        {selectedCity !== 'All Cities' && (
          <span className="text-[#0284c7] dark:text-[#38c6ec] font-semibold">Filtered by {selectedCity}</span>
        )}
      </div>

      {/* Rides List */}
      {loading ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
          <Loader2 className="w-8 h-8 animate-spin text-[#38c6ec] mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading verified community bike rides...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border space-y-3 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
          <Bike className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Bike Commutes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No bike rides currently match your filters in {selectedCity}. Be the first to post a bike ride or select "All Cities".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map((ride, idx) => {
            const isRequested = seatRequestedId === (ride.id || idx);

            return (
              <motion.div
                key={ride.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`p-6 rounded-3xl border transition-all backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 group ${
                  isDark 
                    ? 'bg-slate-900/80 border-white/10 hover:border-[#38c6ec]/40' 
                    : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-2xl'
                }`}
              >
                {/* Driver Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-sm shadow-md shrink-0">
                      {ride.driverName ? ride.driverName.charAt(0) : 'D'}
                    </div>
                    <div>
                      <div className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span>{ride.driverName || 'Verified Commuter'}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#38c6ec]" />
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{ride.driverCompany || 'Corporate Hub'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] bg-[#38c6ec]/10 text-[#0284c7] dark:text-[#38c6ec] border border-[#38c6ec]/20 px-2.5 py-1 rounded-full font-semibold">
                    {ride.city || 'Bangalore'}
                  </span>
                </div>

                {/* Route Box */}
                <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#38c6ec] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">From</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ride.fromLocation}</span>
                    </div>
                  </div>
                  <div className="pl-2 border-l border-dashed border-slate-400/30 h-2 ml-2" />
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">To</span>
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

                {/* Bike Model & Helmet Badge */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Bike className="w-3.5 h-3.5 text-[#38c6ec]" />
                    {(!ride.vehicleType || ride.vehicleType.toLowerCase().includes('car')) ? 'Commuter Motorcycle' : ride.vehicleType}
                  </span>
                  <span className="text-[10px] font-semibold text-[#0284c7] dark:text-[#38c6ec] bg-[#38c6ec]/10 px-2 py-0.5 rounded-full border border-[#38c6ec]/20">
                    {ride.spareHelmetProvided ? '🪖 Spare Helmet: Yes' : '🎒 Helmet: BYO'}
                  </span>
                </div>

                {/* Community Badge & Request Button */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      100% Free Shared
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequestSeat(ride.id || idx)}
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
          })}
        </div>
      )}
    </div>
  );
}
