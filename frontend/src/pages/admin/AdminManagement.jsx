import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create admin modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  
  const navigate = useNavigate();
  const token = sessionStorage.getItem('vlt_master_token');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`${API_URL}/admin/list`, config);
        setAdmins(res.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          sessionStorage.removeItem('vlt_master_token');
          navigate('/master');
        } else {
          setError('Failed to load admins');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [navigate, token]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const config = { headers: { 'x-auth-token': token } };
      
      const res = await axios.post(`${API_URL}/admin/create`, newAdmin, config);
      setAdmins([res.data, ...admins]);
      setIsModalOpen(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
    } catch (err) {
      setCreateError(err.response?.data?.msg || 'Error creating admin');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Management</h1>
          <p className="text-neutral-400 mt-1">Manage system administrators and their roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Admin
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center">
          <p>{error}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/50 text-neutral-400 text-sm border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-neutral-500">
                    No admins found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white flex items-center">
                        <ShieldCheck className={`w-4 h-4 mr-2 ${admin.role === 'superadmin' ? 'text-amber-400' : 'text-emerald-400'}`} />
                        {admin.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-400">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${admin.role === 'superadmin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                      `}>
                        {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-400">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create New Admin</h2>
            {createError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Name</label>
                <input 
                  type="text" required
                  value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                <input 
                  type="email" required
                  value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                  placeholder="john@drivemate.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
                <input 
                  type="password" required minLength="6"
                  value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Role</label>
                <select 
                  value={newAdmin.role} onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2.5 rounded-xl transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center">
                  {createLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Admin'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
