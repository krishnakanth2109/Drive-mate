import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Car, MapPin, IndianRupee, Activity, Loader2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MasterDashboard() {
  const [stats, setStats] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = sessionStorage.getItem('vlt_master_token');
      if (!token) {
        navigate('/master');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };

        const [statsRes, ridesRes] = await Promise.all([
          axios.get(`${API_URL}/admin/stats`, config),
          axios.get(`${API_URL}/admin/recent-rides`, config)
        ]);

        setStats(statsRes.data.data);
        setRecentRides(ridesRes.data.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          sessionStorage.removeItem('vlt_master_token');
          navigate('/master');
        } else {
          setError('Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Customers', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Registered Riders', value: stats?.totalRiders || 0, icon: Car, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Total Rides', value: stats?.totalRides || 0, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { title: 'Total Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-neutral-400 mt-1">Real-time metrics and platform activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl bg-neutral-900 border border-neutral-800 relative overflow-hidden group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`${stat.bg} ${stat.border} p-3 rounded-xl border`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            
            {/* Decorative background blur */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-current ${stat.color}`}></div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Rides</h2>
            <p className="text-sm text-neutral-400">Latest activity across the platform</p>
          </div>
          <button className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center font-medium">
            View All <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/50 text-neutral-400 text-sm border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Rider</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-neutral-500">
                    No recent rides found.
                  </td>
                </tr>
              ) : (
                recentRides.map((ride) => (
                  <tr key={ride._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{ride.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-neutral-500">{ride.customer?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {ride.rider ? (
                        <>
                          <div className="text-sm font-medium text-white">{ride.rider.name}</div>
                          <div className="text-xs text-neutral-500">{ride.vehicleType || 'Bike'}</div>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-md">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-xs text-neutral-300">
                          <MapPin className="w-3 h-3 text-emerald-500 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{ride.pickup?.address || 'Lat/Lng'}</span>
                        </div>
                        <div className="flex items-center text-xs text-neutral-300">
                          <MapPin className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{ride.drop?.address || 'Lat/Lng'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${ride.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          ride.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          ride.status === 'ongoing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                      `}>
                        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-white">₹{ride.fare}</div>
                      <div className="text-xs text-neutral-500">{ride.distance} km</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
