import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        const res = await fetchApi('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });
        sessionStorage.setItem('vlt_token', res.access_token);
        navigate('/dashboard');
      } else {
        await fetchApi('/signup', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        });
        setIsLogin(true);
        setError('Signup successful. Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <svg viewBox="0 0 256 256" className="w-12 h-12 fill-[#c9d1d9] mb-4">
            <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
          </svg>
          <h1 className="text-2xl font-semibold text-[#c9d1d9]">
            {isLogin ? 'Sign in to Vaultra' : 'Create your account'}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-md p-6 mb-4">
          {error && (
            <div className={`mb-4 px-4 py-3 rounded-md text-sm border ${error.includes('successful') ? 'bg-[#0d1117] border-[#3fb950] text-[#3fb950]' : 'bg-[#0d1117] border-[#da3633] text-[#f85149]'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#c9d1d9]">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder-[#484f58]"
              />
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#c9d1d9]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                  className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder-[#484f58]"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#c9d1d9]">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs text-[#58a6ff] hover:underline">Forgot password?</a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder-[#484f58]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 bg-[#238636] hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] text-white font-semibold text-sm py-1.5 rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        {/* Switch */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-md px-6 py-4 text-center text-sm text-[#8b949e]">
          {isLogin ? "New to Vaultra? " : "Already have an account? "}
          <button
            className="text-[#58a6ff] hover:underline font-semibold bg-transparent border-none cursor-pointer"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Create an account.' : 'Sign in.'}
          </button>
        </div>
      </div>
    </div>
  );
}
