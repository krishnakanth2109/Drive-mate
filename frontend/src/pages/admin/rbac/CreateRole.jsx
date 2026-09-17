import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    category: 'Rides',
    permissions: [
      { id: 'ride:read', label: 'View Rides' },
      { id: 'ride:create', label: 'Create Rides' },
      { id: 'ride:update', label: 'Update Rides' },
      { id: 'ride:cancel', label: 'Cancel Rides' },
      { id: 'ride:assign', label: 'Assign Driver' },
      { id: 'ride:investigate', label: 'Investigate Rides' }
    ]
  },
  {
    category: 'Customers',
    permissions: [
      { id: 'customer:read', label: 'View Customers' },
      { id: 'customer:create', label: 'Create Customers' },
      { id: 'customer:update', label: 'Update Customers' },
      { id: 'customer:suspend', label: 'Suspend Customers' }
    ]
  },
  {
    category: 'Drivers',
    permissions: [
      { id: 'driver:read', label: 'View Drivers' },
      { id: 'driver:update', label: 'Update Drivers' },
      { id: 'driver:suspend', label: 'Suspend Drivers' },
      { id: 'driver:approve', label: 'Approve Drivers' }
    ]
  },
  {
    category: 'Access Control',
    permissions: [
      { id: 'role:read', label: 'View Roles' },
      { id: 'role:create', label: 'Create Roles' },
      { id: 'role:update', label: 'Update Roles' },
      { id: 'role:delete', label: 'Delete Roles' },
      { id: 'staff:read', label: 'View Staff' },
      { id: 'staff:manage', label: 'Assign Roles to Staff' },
      { id: 'audit:read', label: 'View Audit Logs' }
    ]
  }
];

export function CreateRole() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
    accessScope: 'All Resources',
    dataAccess: {
      customerPhone: 'No Access',
      customerEmail: 'No Access',
      driverLocation: 'No Access',
      paymentInfo: 'No Access'
    }
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const togglePermission = (id) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    try {
      const token = sessionStorage.getItem('vlt_master_token');
      await axios.post('http://localhost:5000/api/rbac/roles', {
        ...formData,
        permissions: selectedPermissions
      }, {
        headers: { 'x-auth-token': token }
      });
      alert('Role created successfully!');
      navigate('/master/access-control/roles');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating role');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center">
          Create New Role
        </h1>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl text-white font-semibold mb-4 border-b border-neutral-800 pb-2">1. Role Details</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Role Name</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                  value={formData.name} 
                  onChange={e => {
                    const name = e.target.value;
                    setFormData({...formData, name, code: name.toUpperCase().replace(/\s+/g, '_')});
                  }} 
                  placeholder="e.g., Support Agent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Role Code</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none"
                  value={formData.code} 
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
              <textarea 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none h-24"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.name}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Next: Configure Permissions
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h2 className="text-xl text-white font-semibold mb-4 border-b border-neutral-800 pb-2">2. Permissions & Accessibility</h2>

            {/* Permission Matrix */}
            <div>
              <h3 className="text-lg text-emerald-400 mb-4">Resource Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.category} className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                    <h4 className="font-bold text-white mb-3">{group.category}</h4>
                    <div className="space-y-2">
                      {group.permissions.map(p => (
                        <label key={p.id} className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedPermissions.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                            className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-neutral-300">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Access Level */}
            <div>
              <h3 className="text-lg text-emerald-400 mb-4">Sensitive Data Accessibility</h3>
              <div className="grid grid-cols-2 gap-6">
                {Object.keys(formData.dataAccess).map(key => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-neutral-400 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <select 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                      value={formData.dataAccess[key]}
                      onChange={e => setFormData({
                        ...formData, 
                        dataAccess: { ...formData.dataAccess, [key]: e.target.value }
                      })}
                    >
                      <option value="No Access">No Access</option>
                      <option value="Masked">Masked View</option>
                      <option value="Full">Full Access</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-neutral-800">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleCreate}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Create Role
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
