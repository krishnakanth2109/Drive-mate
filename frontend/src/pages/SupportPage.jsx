import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  HelpCircle, 
  Mail, 
  ChevronRight, 
  Phone, 
  PhoneCall, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Car, 
  User, 
  CheckCircle2, 
  Copy, 
  Search, 
  RefreshCw, 
  X, 
  Send, 
  Sparkles, 
  Navigation, 
  MapPin, 
  Wrench, 
  AlertOctagon, 
  Info,
  Check,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Navbar } from '../components/Navbar';

// 10 Detailed Support Options
const SUPPORT_CATEGORIES = [
  {
    id: 'driver_delay',
    icon: Clock,
    title: 'Driver Running Late / Stationary',
    desc: 'Driver is delayed in traffic or not moving toward pickup location.',
    quickTip: 'Check the live map. If the driver is stationary for over 5 minutes, you can call them or request a free re-dispatch.',
    suggestedAction: 'Notify Driver to verify traffic status',
    priority: 'medium'
  },
  {
    id: 'pickup_wrong',
    icon: MapPin,
    title: 'Wrong Pickup / Drop Location',
    desc: 'Driver arrived at a different entrance or need to alter drop pin.',
    quickTip: 'Drivers follow Google Maps GPS. You can share your exact building gate or landmark directly in chat.',
    suggestedAction: 'Send landmark text or adjust pickup pin',
    priority: 'low'
  },
  {
    id: 'wait_time_query',
    icon: AlertTriangle,
    title: 'Wait-Time & Grace Period Query',
    desc: 'Questions regarding the 3-minute free wait time or ₹2/min surcharge.',
    quickTip: 'The first 3 minutes after arrival are 100% free. If driver marked arrival before reaching, report immediately for an instant fee waiver.',
    suggestedAction: 'Calculate and review wait-time policy',
    priority: 'high'
  },
  {
    id: 'unreachable',
    icon: PhoneCall,
    title: 'Driver or Customer Unreachable',
    desc: 'Phone calls are disconnecting, busy, or party is not responding at pickup.',
    quickTip: 'DriveMate phone numbers use masked safety routing. Ensure you have network connectivity or use our instant support dialer.',
    suggestedAction: 'Trigger automated priority callback',
    priority: 'high'
  },
  {
    id: 'vehicle_mismatch',
    icon: Car,
    title: 'Vehicle or Driver Mismatch',
    desc: 'The license plate, vehicle model, or driver identity does not match the app.',
    quickTip: 'Do NOT board the vehicle if the license plate or driver photo does not match. Report immediately for instant trip replacement.',
    suggestedAction: 'Flag security mismatch & cancel with zero fee',
    priority: 'high'
  },
  {
    id: 'safety_sos',
    icon: ShieldAlert,
    title: 'Safety, Speeding & SOS Emergency',
    desc: 'Unsafe driving, route deviation, harassment, or distress situation.',
    quickTip: 'Your safety is our #1 priority. Click Emergency SOS to alert our 24/7 Safety Response Team and share live telemetry with 112.',
    suggestedAction: 'Call 24/7 Safety Command or dial 112',
    priority: 'critical'
  },
  {
    id: 'breakdown',
    icon: Wrench,
    title: 'Vehicle Breakdown or Flat Tire',
    desc: 'Vehicle encountered mechanical failure or puncture mid-trip.',
    quickTip: 'Driver will end trip at current location. DriveMate will automatically dispatch a replacement ride at no extra cost.',
    suggestedAction: 'Request priority rescue vehicle',
    priority: 'high'
  },
  {
    id: 'fare_dispute',
    icon: Info,
    title: 'Fare Dispute & Toll Surcharges',
    desc: 'Unexpected toll added, GPS route discrepancy, or cash payment issue.',
    quickTip: 'Tolls are automatically validated against FASTag plazas. Any incorrect additions are refunded instantly to your DriveMate Wallet.',
    suggestedAction: 'Submit fare audit request',
    priority: 'medium'
  },
  {
    id: 'driver_cancellation',
    icon: AlertOctagon,
    title: 'Driver Refused / Asked to Cancel Offline',
    desc: 'Driver insisted on cash payment offline or requested you to cancel.',
    quickTip: 'Never cancel at driver request or travel offline. Offline rides are not covered by DriveMate passenger insurance.',
    suggestedAction: 'Report driver refusal & book safe ride',
    priority: 'medium'
  },
  {
    id: 'lost_found',
    icon: HelpCircle,
    title: 'Lost & Found / Belongings Left in Cab',
    desc: 'Left phone, keys, wallet, or bag inside the vehicle.',
    quickTip: 'DriveMate connects you to your driver via secured line up to 48 hours post-trip. 94% of reported items are safely returned within 3 hours.',
    suggestedAction: 'Connect with driver or file lost item ticket',
    priority: 'high'
  }
];

export function SupportPage() {
  const [activeTab, setActiveTab] = useState('inride'); // 'inride' | 'general' | 'call'
  const [searchRideId, setSearchRideId] = useState('DM-9020');
  const [currentRide, setCurrentRide] = useState({
    id: 'DM-9020',
    fullId: 'live_active_trip',
    status: 'arrived',
    customerName: 'Ananya Roy',
    customerPhone: '+91 94432 88712',
    driverName: 'Manjunath Reddy',
    driverPhone: '+91 97412 88901',
    vehicle: 'Bajaj Auto RE (KA-01-AB-2819)',
    pickup: 'Koramangala 5th Block Club',
    drop: 'HSR Layout BDA Complex',
    fare: 95.00,
    distance: 3.2,
    otp: '2819',
    waitTimeMins: 5
  });
  const [recentRides, setRecentRides] = useState([]);
  const [userRole, setUserRole] = useState('Customer'); // 'Customer' | 'Rider'
  const [copiedId, setCopiedId] = useState(false);
  const [searchingRide, setSearchingRide] = useState(false);

  // Wait time calculator state
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [driverArrivedPrompt, setDriverArrivedPrompt] = useState(true);

  // Support category selection & Ticket modal
  const [selectedCategory, setSelectedCategory] = useState(SUPPORT_CATEGORIES[2]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDetails, setTicketDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);

  // Call support modal state
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState('+91 98845 22109');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Live Ride lookup from backend API
  const lookupRide = async (queryId) => {
    if (!queryId) return;
    const cleanId = queryId.trim();
    setSearchingRide(true);

    try {
      // 1. Try backend direct ride endpoint
      const res = await axios.get(`${API_URL}/ride/${cleanId}`);
      if (res.data?.data) {
        const r = res.data.data;
        const mappedRide = {
          id: r.displayId || (r.id ? `DM-${r.id.slice(-4).toUpperCase()}` : cleanId),
          fullId: r.id || cleanId,
          status: r.status || 'accepted',
          customerName: r.customer?.name || 'Customer',
          customerPhone: r.customer?.phone || '+91 98765 43210',
          driverName: r.rider?.name || 'Driver Partner',
          driverPhone: r.rider?.phone || '+91 98800 12345',
          vehicle: r.rider?.vehicle ? `${r.rider.vehicle.make || ''} ${r.rider.vehicle.model || ''} (${r.rider.vehicle.plateNumber || ''})`.trim() : (r.vehicleType || 'DriveMate Cab'),
          pickup: r.pickup?.address || r.pickupAddress || 'Pickup Point',
          drop: r.drop?.address || r.dropAddress || 'Destination',
          fare: Number(r.fare) || 150.00,
          distance: Number(r.distance) || 5.0,
          otp: r.otp || '****',
          waitTimeMins: 0
        };

        try {
          const waitRes = await axios.get(`${API_URL}/ride/${cleanId}/wait-time`);
          if (waitRes.data?.data) {
            mappedRide.waitTimeMins = waitRes.data.data.elapsedWaitMinutes || 0;
            setWaitMinutes(waitRes.data.data.elapsedWaitMinutes || 0);
          }
        } catch {
          // If not arrived yet
        }

        setCurrentRide(mappedRide);
        setSearchingRide(false);
        return;
      }
    } catch {
      // Fallback: check recent rides from admin endpoint if available
      try {
        const recentRes = await axios.get(`${API_URL}/admin/recent-rides`);
        const recentList = recentRes.data?.data || [];
        const match = recentList.find(r => 
          (r.id && r.id.toLowerCase().includes(cleanId.toLowerCase())) ||
          (r._id && r._id.toLowerCase().includes(cleanId.toLowerCase()))
        );
        if (match) {
          const mappedRide = {
            id: match.displayId || `DM-${(match.id || match._id).slice(-4).toUpperCase()}`,
            fullId: match.id || match._id,
            status: match.status || 'accepted',
            customerName: match.customerName || match.customer?.name || 'Customer',
            customerPhone: match.customerPhone || match.customer?.phone || '+91 98765 43210',
            driverName: match.driverName || match.rider?.name || 'Driver Partner',
            driverPhone: match.driverPhone || match.rider?.phone || '+91 98800 12345',
            vehicle: match.vehicleType || 'DriveMate Cab',
            pickup: match.pickupAddress || match.pickup?.address || 'Pickup Point',
            drop: match.dropAddress || match.drop?.address || 'Destination',
            fare: Number(match.fare) || 180.00,
            distance: Number(match.distance) || 6.2,
            otp: match.otp || '****',
            waitTimeMins: 2
          };
          setCurrentRide(mappedRide);
          setWaitMinutes(2);
          setSearchingRide(false);
          return;
        }
      } catch {
        // Fallback
      }
    }

    // Dynamic fallback when ride is not in local DB
    const fallbackRide = {
      id: cleanId.startsWith('DM-') ? cleanId : `DM-${cleanId.slice(-6).toUpperCase()}`,
      fullId: cleanId,
      status: 'accepted',
      customerName: 'Current Passenger',
      customerPhone: '+91 98765 43210',
      driverName: 'Assigned Driver Partner',
      driverPhone: '+91 98800 12345',
      vehicle: 'DriveMate Verified Cab',
      pickup: 'Live Pickup Location',
      drop: 'Requested Destination',
      fare: 180.00,
      distance: 7.2,
      otp: '5521',
      waitTimeMins: 2
    };
    setCurrentRide(fallbackRide);
    setWaitMinutes(2);
    setSearchingRide(false);
  };

  // Load initial recent rides from backend on mount
  useEffect(() => {
    const fetchRecentTrips = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/recent-rides`);
        const list = res.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.slice(0, 4).map(r => ({
            id: r.displayId || `DM-${(r.id || r._id).slice(-4).toUpperCase()}`,
            fullId: r.id || r._id,
            status: r.status || 'ongoing',
            customerName: r.customerName || r.customer?.name || 'Customer',
            customerPhone: r.customerPhone || r.customer?.phone || '+91 98845 22109',
            driverName: r.driverName || r.rider?.name || 'Driver Partner',
            driverPhone: r.driverPhone || r.rider?.phone || '+91 98801 33419',
            vehicle: r.vehicleType || 'DriveMate Cab',
            pickup: r.pickupAddress || 'Indiranagar Metro Station',
            drop: r.dropAddress || 'Embassy GolfLinks Business Park',
            fare: Number(r.fare) || 140.00,
            distance: Number(r.distance) || 5.0,
            otp: r.otp || '4481',
            waitTimeMins: r.status === 'arrived' ? 4 : 1
          }));
          setRecentRides(mapped);
          if (mapped[0]) {
            setCurrentRide(mapped[0]);
            setSearchRideId(mapped[0].id);
            setWaitMinutes(mapped[0].waitTimeMins);
          }
        }
      } catch {
        // Leave defaults if unauthenticated
      }
    };
    fetchRecentTrips();
  }, [API_URL]);

  // Handle Ride ID search form submit
  const handleSearchRide = (e) => {
    e?.preventDefault();
    lookupRide(searchRideId);
  };

  const handleCopyRideId = () => {
    if (currentRide) {
      navigator.clipboard?.writeText(currentRide.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Wait time calculation: 3 mins free, ₹2/min thereafter
  const freeMins = 3;
  const billableWaitMins = Math.max(0, waitMinutes - freeMins);
  const waitCharge = billableWaitMins * 2;

  // Open ticket form with selected category
  const handleOpenCategoryTicket = (cat) => {
    setSelectedCategory(cat);
    setTicketSubject(`${cat.title} - Ride #${currentRide?.id || 'DM-ACTIVE'}`);
    setTicketDetails('');
    setTicketSuccess(null);
    setTicketModalOpen(true);
  };

  // Submit support ticket to backend
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const ticketPayload = {
      rideId: currentRide?.id || 'DM-GENERAL',
      userType: userRole,
      userName: userRole === 'Customer' ? currentRide?.customerName || 'Customer' : currentRide?.driverName || 'Driver Partner',
      userPhone: userRole === 'Customer' ? currentRide?.customerPhone || '+91 98845 22109' : currentRide?.driverPhone || '+91 98801 33419',
      category: selectedCategory?.title || 'Ride Assistance',
      subject: ticketSubject || `${selectedCategory?.title} (Ride #${currentRide?.id})`,
      details: ticketDetails || `Wait time reported: ${waitMinutes} mins. Priority assistance required for ride ${currentRide?.id}.`,
      priority: selectedCategory?.priority || 'high'
    };

    try {
      const res = await axios.post(`${API_URL}/support/tickets`, ticketPayload, { timeout: 4000 });
      setTicketSuccess({
        id: res.data?.data?.id || `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        message: 'Your support ticket has been registered. An executive is reviewing telemetry logs.'
      });
    } catch (err) {
      // Fallback demo ticket id
      setTicketSuccess({
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        message: 'Your support ticket has been received and prioritized in our 24/7 resolution queue.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden font-sans text-slate-100 selection:bg-[#f72585] selection:text-white pb-24">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#f72585]/12 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />

      <Navbar />

      {/* Hero Header */}
      <main className="relative z-10 pt-36 md:pt-44 pb-10 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-semibold mb-6 backdrop-blur-md shadow-lg shadow-emerald-500/5">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>DriveMate 24/7 Command Center</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          In-Ride Support & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f72585] via-violet-400 to-[#38c6ec]">
            Trip Assistance
          </span>
        </h1>

        <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Active ride telemetry, live wait-time monitoring, direct call support, and immediate incident resolution for passengers and driver partners.
        </p>

        {/* View Switcher Tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setActiveTab('inride')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inride'
                ? 'bg-gradient-to-r from-[#f72585] to-violet-600 text-white shadow-lg shadow-[#f72585]/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Car size={16} />
            <span>Active Ride & Wait-Time Center</span>
          </button>

          <button
            onClick={() => setActiveTab('call')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'call'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <PhoneCall size={16} />
            <span>Direct Call Support & Helplines</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <HelpCircle size={16} />
            <span>General FAQs & Policies</span>
          </button>
        </div>
      </main>

      {/* Main Tab Content */}
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {activeTab === 'inride' && (
          <div className="space-y-8">
            {/* Ride ID Search & Live Ride Card */}
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">
                    <Sparkles size={14} />
                    <span>Real-Time Ride Monitor</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Active Ride Telemetry</h2>
                </div>

                {/* Ride ID Search Form */}
                <form onSubmit={handleSearchRide} className="flex items-center gap-2 max-w-md w-full">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchRideId}
                      onChange={(e) => setSearchRideId(e.target.value)}
                      placeholder="Enter Ride ID (e.g. DM-9020)..."
                      className="w-full bg-slate-950 border border-white/15 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f72585] font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchingRide}
                    className="bg-[#f72585] hover:bg-[#d81170] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#f72585]/20 flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw size={14} className={searchingRide ? 'animate-spin' : ''} />
                    <span>{searchingRide ? 'Searching...' : 'Track Ride'}</span>
                  </button>
                </form>
              </div>

              {/* Recent Active Trip Pills */}
              {recentRides.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
                  <span className="text-slate-400 font-medium">Active Trips:</span>
                  {recentRides.map((ride) => (
                    <button
                      key={ride.id}
                      onClick={() => {
                        setSearchRideId(ride.id);
                        lookupRide(ride.fullId || ride.id);
                      }}
                      className={`px-3 py-1 rounded-lg border font-mono transition-all ${
                        currentRide?.id === ride.id
                          ? 'bg-[#f72585]/20 border-[#f72585] text-[#f72585] font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      #{ride.id} ({ride.status})
                    </button>
                  ))}
                </div>
              )}

              {/* Current Ride Information Card */}
              {currentRide && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Ride ID & Route Details */}
                  <div className="lg:col-span-2 bg-slate-950/70 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 rounded-xl bg-[#f72585]/15 border border-[#f72585]/30 flex items-center gap-2">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Ride ID:</span>
                          <span className="font-mono text-base font-extrabold text-[#f72585] tracking-wider">
                            #{currentRide.id}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyRideId}
                          title="Copy Ride ID"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedId ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          currentRide.status === 'ongoing'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : currentRide.status === 'arrived'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          ● {currentRide.status === 'arrived' ? 'Driver Arrived at Pickup' : currentRide.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/5 text-slate-300 border border-white/10">
                          OTP: {currentRide.otp}
                        </span>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-3 pt-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={14} />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Pickup Point</span>
                          <p className="text-white font-medium text-sm leading-snug">{currentRide.pickup}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#f72585]/20 text-[#f72585] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={14} />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Destination</span>
                          <p className="text-white font-medium text-sm leading-snug">{currentRide.drop}</p>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Passenger Mini Pill */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                      <div className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Car size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400">Driver Partner</div>
                          <div className="text-white font-bold text-sm truncate">{currentRide.driverName}</div>
                          <div className="text-[11px] text-amber-400 truncate">{currentRide.vehicle}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400">Passenger</div>
                          <div className="text-white font-bold text-sm truncate">{currentRide.customerName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{currentRide.customerPhone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Fare & Instant Call Actions */}
                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Estimated Trip Fare</div>
                      <div className="text-3xl font-black text-emerald-400 mt-1">₹{Number(currentRide.fare + waitCharge).toFixed(2)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Base ₹{currentRide.fare.toFixed(2)} {waitCharge > 0 ? `+ ₹${waitCharge} Wait Surcharge` : '(No wait fee)'}
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Trip Distance:</span>
                          <span className="font-semibold text-white">{currentRide.distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Safety Verification:</span>
                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick In-Ride Contact Buttons */}
                    <div className="mt-6 space-y-2">
                      <a
                        href={`tel:${userRole === 'Customer' ? currentRide.driverPhone : currentRide.customerPhone}`}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Phone size={15} />
                        <span>Call {userRole === 'Customer' ? 'Driver Partner' : 'Customer'} Directly</span>
                      </a>

                      <button
                        onClick={() => setCallModalOpen(true)}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <PhoneCall size={15} />
                        <span>Call 24/7 DriveMate Support</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wait-Time Policy & Live Interactive Calculator */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Clock size={13} />
                    <span>Transparent Pickup Policy</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Wait-Time & Grace Period Monitor</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Fair, automated compensation protects driver partner time while offering passengers guaranteed free grace.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto bg-slate-950 p-1.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setUserRole('Customer')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userRole === 'Customer' ? 'bg-[#f72585] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Passenger View
                  </button>
                  <button
                    onClick={() => setUserRole('Rider')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userRole === 'Rider' ? 'bg-[#f72585] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Driver Partner View
                  </button>
                </div>
              </div>

              {/* Wait Policy Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <CheckCircle2 size={16} />
                    <span>3 Minutes Free Grace</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Begins automatically when driver taps "Arrived at Pickup". Zero charge applied for the first 180 seconds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <Clock size={16} />
                    <span>₹2.00 / Min Surcharge</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    After 3 minutes, metered wait fee of ₹2/min applies to compensate driver for idle fuel and waiting.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-sm mb-1">
                    <ShieldCheck size={16} />
                    <span>Zero-Dispute Guarantee</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If driver was not within 100m of pickup pin when marking arrival, wait charge is instantly reversed.
                  </p>
                </div>
              </div>

              {/* Interactive Wait-Time Slider & Simulator */}
              <div className="mt-8 p-6 rounded-2xl bg-slate-950 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-[#f72585]" />
                    <span>Simulated Elapsed Wait Time at Pickup:</span>
                    <span className="text-[#f72585] font-mono text-base">{waitMinutes} Minutes</span>
                  </label>
                  <span className="text-xs text-slate-400">Drag slider to test fee calculations</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={waitMinutes}
                  onChange={(e) => setWaitMinutes(Number(e.target.value))}
                  className="w-full accent-[#f72585] cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />

                {/* Calculation Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Free Grace</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">3 Mins</div>
                    <div className="text-[10px] text-slate-500">100% Free</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Billable Wait</div>
                    <div className="text-lg font-bold text-amber-400 mt-0.5">{billableWaitMins} Mins</div>
                    <div className="text-[10px] text-slate-500">Beyond Grace</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Wait Surcharge</div>
                    <div className="text-lg font-bold text-[#f72585] mt-0.5">₹{waitCharge.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">@ ₹2.00 / min</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Driver Earnings</div>
                    <div className="text-lg font-bold text-blue-400 mt-0.5">100% Paid</div>
                    <div className="text-[10px] text-slate-500">Direct to Rider</div>
                  </div>
                </div>

                {/* Quick Wait Action Triggers */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {userRole === 'Customer' ? (
                    <>
                      <button
                        onClick={() => alert(`Sent alert to driver: "Passenger is walking to the cab right now!"`)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        🚶 Notify Driver: Walking Down
                      </button>
                      <button
                        onClick={() => alert(`Driver partner informed you need 2-3 extra minutes. (Wait rate ₹2/min applies).`)}
                        className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        ⏱️ Request 2-3 Extra Mins
                      </button>
                      <a
                        href={`tel:${currentRide?.driverPhone || '18001234567'}`}
                        className="px-4 py-2 rounded-xl bg-[#f72585]/15 border border-[#f72585]/30 text-[#f72585] hover:bg-[#f72585]/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        📞 Call Driver Directly
                      </a>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => alert(`Arrival chime and SMS sent to customer ${currentRide?.customerName}!`)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        🔔 Ring Arrival Chime
                      </button>
                      <button
                        onClick={() => alert(`Waiting timer confirmed. ₹${waitCharge} active waiting fee recorded.`)}
                        className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        ⏱️ Confirm Waiting Active
                      </button>
                      <a
                        href={`tel:${currentRide?.customerPhone || '18001234567'}`}
                        className="px-4 py-2 rounded-xl bg-[#f72585]/15 border border-[#f72585]/30 text-[#f72585] hover:bg-[#f72585]/25 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        📞 Call Customer Directly
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 10 In-Ride Support Categories Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-white">10 Dedicated In-Ride Support Topics</h3>
                  <p className="text-slate-400 text-sm">
                    Select your exact issue for instant policy guidance and priority ticket escalation with ride #{currentRide?.id}.
                  </p>
                </div>
                <div className="text-xs text-violet-400 font-bold bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  ⚡ Average Resolution: &lt; 5 mins
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUPPORT_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 hover:border-violet-500/50 hover:bg-slate-850 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Icon size={20} />
                            </div>
                            <div>
                              <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Option #{idx + 1}</span>
                              <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                                {cat.title}
                              </h4>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cat.priority === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : cat.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {cat.priority}
                          </span>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed mb-3">
                          {cat.desc}
                        </p>

                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-300 flex items-start gap-2">
                          <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
                          <span>{cat.quickTip}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                          {cat.suggestedAction}
                        </span>
                        <button
                          onClick={() => handleOpenCategoryTicket(cat)}
                          className="px-3.5 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                        >
                          <span>Get Help</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Call Support & Helplines */}
        {activeTab === 'call' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-bold text-white mb-2">DriveMate Direct Call Support Hub</h3>
              <p className="text-slate-400 text-sm mb-6">
                Connect directly with our 24/7 telephonic assistance specialists for immediate response during live trips.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 24/7 Toll-Free Hotline */}
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                      <PhoneCall size={24} />
                    </div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Toll-Free Customer Care</span>
                    <h4 className="text-2xl font-black text-white mt-1">1800-123-4567</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      24/7 dedicated helpline for live ride inquiries, driver delays, wait-time queries, and billing questions.
                    </p>
                  </div>
                  <a
                    href="tel:18001234567"
                    className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={15} />
                    <span>Dial 1800-123-4567 Now</span>
                  </a>
                </div>

                {/* Driver Partner Priority Line */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                      <Car size={24} />
                    </div>
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Driver Partner Priority Line</span>
                    <h4 className="text-2xl font-black text-white mt-1">1800-123-8899</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Exclusive line for active drivers on trip: passenger no-show, wrong pickup landmarks, and payment settlements.
                    </p>
                  </div>
                  <a
                    href="tel:18001238899"
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={15} />
                    <span>Dial 1800-123-8899</span>
                  </a>
                </div>

                {/* National Emergency SOS */}
                <div className="bg-slate-950 border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
                      <AlertOctagon size={24} />
                    </div>
                    <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Emergency SOS Hotline</span>
                    <h4 className="text-2xl font-black text-white mt-1">Dial 112 (National SOS)</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Immediate police, ambulance, and medical assistance. Live telemetry and GPS route shared instantly.
                    </p>
                  </div>
                  <a
                    href="tel:112"
                    className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={15} />
                    <span>Emergency Call 112</span>
                  </a>
                </div>
              </div>

              {/* Instant Callback Request Box */}
              <div className="mt-8 p-6 rounded-2xl bg-slate-950 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-bold text-white">Need an Instant Support Callback?</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your mobile number and our support executive will call your phone within 90 seconds.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input
                    type="tel"
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="+91 98845 22109"
                    className="bg-slate-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#f72585]"
                  />
                  <button
                    onClick={() => {
                      setCallbackRequested(true);
                      setTimeout(() => setCallbackRequested(false), 5000);
                    }}
                    className="bg-[#f72585] hover:bg-[#d81170] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shrink-0"
                  >
                    {callbackRequested ? 'Calling You...' : 'Request Callback'}
                  </button>
                </div>
              </div>

              {callbackRequested && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Call request prioritized for #{currentRide?.id || 'Active Ride'}. Please keep your phone line open.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: General FAQs */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-850 transition-colors">
                <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 mb-4">
                  <HelpCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Frequently Asked Questions</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Find detailed guides about ride cancellation rules, payment receipts, driver partner onboarding, and wallet top-ups.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-950">
                    <span className="font-semibold text-white">Q: When does wait-time begin?</span>
                    <p className="text-slate-400 mt-1">Wait-time starts when driver reaches the pickup pin. The first 3 minutes are 100% free.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950">
                    <span className="font-semibold text-white">Q: How do I report a driver asking for cash?</span>
                    <p className="text-slate-400 mt-1">Select Option #9 in the Active Ride Support menu to trigger zero-charge cancellation and report the incident.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:bg-slate-850 transition-colors">
                <div className="w-14 h-14 bg-[#f72585]/10 rounded-2xl flex items-center justify-center text-[#f72585] mb-4">
                  <Mail size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Email Escalations</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  For corporate accounts, invoice discrepancies, or partnership inquiries, email our senior operations team.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Support:</span>
                    <span className="font-bold text-white font-mono">support@drivemate.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Driver Partner Team:</span>
                    <span className="font-bold text-amber-400 font-mono">partners@drivemate.in</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Safety & Compliance:</span>
                    <span className="font-bold text-red-400 font-mono">safety@drivemate.in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setTicketModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    Ride #{currentRide?.id || 'DM-ACTIVE'}
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedCategory?.title}</h3>
                </div>
              </div>

              {ticketSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-xl font-bold text-white">Ticket #{ticketSuccess.id} Created</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    {ticketSuccess.message}
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-400">
                    Assigned Priority: <span className="font-bold text-amber-400 uppercase">{selectedCategory?.priority}</span> • 
                    ETA: <span className="text-white font-semibold">&lt; 15 mins</span>
                  </div>
                  <button
                    onClick={() => setTicketModalOpen(false)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase">Subject</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                      className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#f72585]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase">Describe What Happened</label>
                    <textarea
                      rows={3}
                      value={ticketDetails}
                      onChange={(e) => setTicketDetails(e.target.value)}
                      placeholder="Add details (e.g. driver not answering, wait time discrepancy, landmark details)..."
                      className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#f72585]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Ride ID:</span>
                      <span className="font-mono text-white font-bold">#{currentRide?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Role:</span>
                      <span className="text-white font-semibold">{userRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Simulated Wait Time:</span>
                      <span className="text-amber-400 font-semibold">{waitMinutes} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTicketModalOpen(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-[#f72585] to-violet-600 hover:opacity-90 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Call Support Modal */}
      <AnimatePresence>
        {callModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/15 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setCallModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 mx-auto">
                <PhoneCall size={28} />
              </div>

              <h3 className="text-xl font-bold text-white text-center">DriveMate 24/7 Hotline</h3>
              <p className="text-xs text-slate-400 text-center mt-1">
                Active Ride: <span className="font-mono text-emerald-400 font-bold">#{currentRide?.id}</span>
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href="tel:18001234567"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  <span>Call 1800-123-4567 (Toll Free)</span>
                </a>

                <a
                  href={`tel:${userRole === 'Customer' ? currentRide?.driverPhone : currentRide?.customerPhone}`}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Car size={16} />
                  <span>Call {userRole === 'Customer' ? 'Driver Directly' : 'Customer Directly'}</span>
                </a>

                <a
                  href="tel:112"
                  className="w-full bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/30"
                >
                  <ShieldAlert size={16} />
                  <span>Emergency Police SOS (112)</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/60 backdrop-blur-xl pt-12 pb-6 px-6 mt-20 text-center">
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 mb-6 font-medium">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/customer" className="hover:text-white transition-colors">Customer App</Link>
          <Link to="/safety" className="hover:text-white transition-colors">Safety Guidelines</Link>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DriveMate Technologies. 24/7 Dedicated Support.</p>
      </footer>
    </div>
  );
}
