import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Car,
  FileCheck,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { fetchApi } from '../../../api/client';
import { DriverVerificationDetailModal } from './DriverVerificationDetailModal';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function DriverRegistrationsView() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    inProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReg, setSelectedReg] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/admin/verification/registrations');
      setRegistrations(data.registrations || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load driver registrations:', err);
      setToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Could not fetch driver registrations',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleOpenDetail = async (reg) => {
    try {
      const fullDetails = await fetchApi(`/admin/verification/registration/${reg.id}`);
      setSelectedReg(fullDetails);
    } catch {
      setSelectedReg(reg);
    }
  };

  // Filtered registrations
  const filtered = registrations.filter((r) => {
    const d = r.driver || {};
    const v = d.vehicle || r.vehicle || {};
    const matchesSearch =
      !searchQuery.trim() ||
      (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.phone && d.phone.includes(searchQuery)) ||
      (d.email && d.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.plate && v.plate.toLowerCase().includes(searchQuery.toLowerCase()));

    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && (r.overallStatus === 'pending_review' || r.overallStatus === 'in_progress')) ||
      (statusFilter === 'VERIFIED' && (r.overallStatus === 'approved' || r.overallStatus === 'verified')) ||
      (statusFilter === 'REJECTED' && r.overallStatus === 'rejected') ||
      (statusFilter === 'IN_PROGRESS' && r.overallStatus === 'in_progress');

    return matchesSearch && statusMatch;
  });

  const getStatusPill = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </span>
      );
    }
    if (s === 'PENDING_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Pending Review
        </span>
      );
    }
    if (s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Clock className="w-3 h-3" />
          In Progress
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400">
        {s || 'Draft'}
      </span>
    );
  };

  const getDocDot = (status, title) => {
    const s = String(status || '').toUpperCase();
    let color = 'bg-neutral-600';
    if (s === 'VERIFIED' || s === 'APPROVED') color = 'bg-emerald-500';
    else if (s === 'PENDING' || s === 'MANUAL_REVIEW') color = 'bg-amber-500';
    else if (s === 'FAILED' || s === 'REJECTED') color = 'bg-rose-500';

    return (
      <span
        title={`${title}: ${s || 'Not submitted'}`}
        className={`w-2.5 h-2.5 rounded-full ${color} inline-block shadow-sm`}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Driver Registrations & Onboarding</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sandbox Live
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Review 7-step driver registrations, verified documents, and automated sandbox KYC checks.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          disabled={loading}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Applications</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.total || registrations.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Pending Review</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Verified Drivers</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.verified || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">In Progress (Draft)</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">{stats.inProgress || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Rejected</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Registrations Data Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[11px] font-bold tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Driver Applicant</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4 text-center">Wizard Step</th>
                <th className="py-3.5 px-4">Document Checks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading driver onboarding records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No onboarding applications match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const driver = r.driver || {};
                  const vehicle = driver.vehicle || r.vehicle || {};
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(r)}
                    >
                      {/* Driver */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                            {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{driver.name || 'Anonymous Applicant'}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">ID: {r.id.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div>{driver.phone || '—'}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[140px]">{driver.email || '—'}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-400">
                          {vehicle.plate || vehicle.plateNumber || '—'}
                        </div>
                        <div className="text-[10px] text-neutral-500 uppercase">{driver.vehicleType || 'Bike'}</div>
                      </td>

                      {/* Wizard Step */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Step {r.currentStep || 1}/7
                        </span>
                      </td>

                      {/* Document Checks Indicator Dots */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5" title="DL check">
                            <span className="text-[10px] text-neutral-500">DL:</span>
                            {getDocDot(r.dlStatus, 'Driving Licence')}
                          </div>
                          <div className="flex items-center gap-1.5" title="PAN check">
                            <span className="text-[10px] text-neutral-500">PAN:</span>
                            {getDocDot(r.panStatus, 'PAN Card')}
                          </div>
                          <div className="flex items-center gap-1.5" title="RC check">
                            <span className="text-[10px] text-neutral-500">RC:</span>
                            {getDocDot(r.rcStatus, 'Vehicle RC')}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusPill(r.overallStatus)}</td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-mono whitespace-nowrap">
                        {r.submissionDate
                          ? new Date(r.submissionDate).toLocaleDateString()
                          : new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(r);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Verification Detail Modal */}
      {selectedReg && (
        <DriverVerificationDetailModal
          registration={selectedReg}
          onClose={() => setSelectedReg(null)}
          onUpdated={fetchRegistrations}
          onToast={setToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <NotificationToast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
