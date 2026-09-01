import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

export function MasterAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock authentication for Master
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        // Issue a distinct master token
        const mockToken = btoa(JSON.stringify({ sub: 'admin', role: 'master' })) + '.mock';
        sessionStorage.setItem('vlt_master_token', mockToken);
        navigate('/master/dashboard');
      } else {
        setError('Invalid master credentials');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7a22ff] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7a22ff] to-[#3a00b3] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(122,34,255,0.4)] mb-6 border border-[#9d4edd]/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Master Console</h1>
          <p className="text-[#a0a0a5] mt-2 text-sm uppercase tracking-widest font-semibold">Restricted Access</p>
        </div>

        <div className="bg-[#0f0f16]/80 backdrop-blur-xl border border-[#2a2a35] rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] text-sm px-4 py-3 rounded-xl mb-6 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#8a8a93] uppercase tracking-wider">Master ID</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#15151e] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7a22ff] focus:ring-1 focus:ring-[#7a22ff] transition-all"
                  placeholder="Enter administrative ID"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#8a8a93] uppercase tracking-wider">Passcode</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#15151e] border border-[#2a2a35] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7a22ff] focus:ring-1 focus:ring-[#7a22ff] transition-all pr-10"
                  placeholder="••••••••••••"
                />
                <Lock className="w-4 h-4 text-[#8a8a93] absolute right-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-[#7a22ff] to-[#9d4edd] hover:from-[#6b15eb] hover:to-[#8a38c9] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(122,34,255,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[#5a5a63] text-xs mt-8 font-medium">
          Vaultra System Administration © {new Date().getFullYear()}<br />
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
}
