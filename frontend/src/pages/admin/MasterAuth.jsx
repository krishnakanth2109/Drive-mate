import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  UserCheck, 
  ArrowRight, 
  Headphones, 
  Car, 
  TrendingUp, 
  IndianRupee, 
  CreditCard, 
  Award,
  KeyRound
} from 'lucide-react';
import axios from 'axios';
import { useRole, DEMO_PROFILES, ROLES } from '../../context/RoleContext';

const ROLE_ICONS = {
  SUPPORT_AGENT: Headphones,
  HEAD_OF_SUPPORT: Award,
  ADMIN: ShieldCheck,
  FLEET_COACH: Car,
  HEAD_OF_FLEET: UserCheck,
  MANAGER: TrendingUp,
  FINANCE_ADMIN: IndianRupee,
  FINANCER: CreditCard
};

export function MasterAuth() {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'credentials'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAsDemo, switchRole } = useRole();

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/admin/login`, {
        email,
        password,
      });

      const user = response.data.data.user;
      const token = response.data.data.token;

      sessionStorage.setItem('vlt_master_token', token);
      sessionStorage.setItem('vlt_master_user', JSON.stringify(user));

      // Match user role or fallback to ADMIN
      const primaryRoleCode = user.roles?.[0]?.code || user.role || 'ADMIN';
      const targetRole = switchRole(primaryRoleCode);

      navigate(targetRole?.defaultPath || '/master/dashboard/admin');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Invalid credentials or unauthorized account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (profile) => {
    const role = loginAsDemo(profile);
    navigate(role.defaultPath || '/master/dashboard/admin');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-neutral-900/90 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl"
      >
        {/* Top Header */}
        <div className="p-8 pb-6 border-b border-neutral-800 text-center relative">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            DriveMate Staff & Operations Portal
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-lg mx-auto">
            Unified authentication & role access control for operations, fleet, support, and finance
          </p>

          {/* Toggle Tabs */}
          <div className="flex items-center justify-center mt-6">
            <div className="p-1 rounded-xl bg-neutral-950 border border-neutral-800 flex gap-1">
              <button
                onClick={() => setActiveTab('quick')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'quick'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                1-Click Role Logins
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'credentials'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Account Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: 1-Click Master Admin Launch */}
        {activeTab === 'quick' && (
          <div className="p-8">
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold uppercase tracking-wider text-neutral-300">
                Master Administrator Authentication
              </span>
              <span className="text-emerald-400 font-mono">Full Privileges Active</span>
            </div>

            <div className="max-w-2xl mx-auto">
              {DEMO_PROFILES.map((profile) => {
                const roleConfig = ROLES[profile.roleId] || ROLES.ADMIN;

                return (
                  <button
                    key={profile.roleId}
                    onClick={() => handleQuickLogin(profile)}
                    className="w-full p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all duration-200 group shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-md">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
                              {roleConfig.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              SUPER PRIVILEGED
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">{profile.name} • {profile.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                        {profile.badge}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
                      {roleConfig.description}
                    </p>

                    {/* Capabilities Badge Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800/80">
                      <div className="flex items-center text-xs text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                        Modify System Roles & Permissions Matrix
                      </div>
                      <div className="flex items-center text-xs text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                        View & Verify Driver Documents (DL, Aadhaar, PAN, RC)
                      </div>
                      <div className="flex items-center text-xs text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                        Live Rides GPS, Fleet Dispatch & Surge Control
                      </div>
                      <div className="flex items-center text-xs text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                        Financial Settlement & Platform Audit Trail
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>Launch Master Admin Control Center</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Standard Credentials Form */}
        {activeTab === 'credentials' && (
          <div className="p-8 max-w-md mx-auto">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Corporate Staff Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="admin@drivemate.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Account Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition-all duration-150 flex items-center justify-center disabled:opacity-70 mt-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate Credentials'}
              </button>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-500 text-center">
                Default Super Admin credential: <span className="text-neutral-300 font-mono">admin@drivemate.com / admin123</span>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="bg-neutral-950/60 p-4 border-t border-neutral-800 flex items-center justify-between px-8 text-xs text-neutral-500">
          <span>Protected by Neon PostgreSQL & DriveMate RBAC</span>
          <span>DriveMate Operations Suite v2.0</span>
        </div>
      </motion.div>
    </div>
  );
}
