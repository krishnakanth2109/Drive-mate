import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Car,
  User,
  ExternalLink
} from 'lucide-react';
import { fetchApi } from '../../../api/client';
import { DriverVerificationDetailModal } from './DriverVerificationDetailModal';
import { NotificationToast } from '../../../components/common/NotificationToast';

export function PendingReviewsView() {
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPendingQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/admin/verification/pending-reviews');
      setPendingQueue(data.pendingQueue || []);
    } catch (err) {
      console.error('Failed to load pending reviews queue:', err);
      setToast({
        type: 'error',
        title: 'Error Loading Queue',
        message: err.message || 'Could not load pending reviews queue',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
  }, []);

  const handleOpenDetail = async (reg) => {
    try {
      const fullDetails = await fetchApi(`/admin/verification/registration/${reg.id}`);
      setSelectedReg(fullDetails);
    } catch {
      setSelectedReg(reg);
    }
  };

  const filteredQueue = pendingQueue.filter((item) => {
    const driver = item.driver || {};
    const matchesSearch =
      !searchQuery.trim() ||
      (driver.name && driver.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (driver.phone && driver.phone.includes(searchQuery)) ||
      (item.id && item.id.includes(searchQuery));

    let matchesFilter = true;
    if (filterType === 'DL') matchesFilter = item.dlStatus === 'Pending' || item.dlStatus === 'MANUAL_REVIEW';
    if (filterType === 'AADHAAR') matchesFilter = item.aadharStatus === 'Pending' || item.aadharStatus === 'MANUAL_REVIEW';
    if (filterType === 'PAN') matchesFilter = item.panStatus === 'Pending' || item.panStatus === 'MANUAL_REVIEW';
    if (filterType === 'RC') matchesFilter = item.rcStatus === 'Pending' || item.rcStatus === 'MANUAL_REVIEW';

    return matchesSearch && matchesFilter;
  });

  const getWaitTime = (submissionDate, createdAt) => {
    const date = new Date(submissionDate || createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Pending Driver Compliance Queue</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingQueue.length} Awaiting Verification
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Prioritized compliance queue for driver documents requiring manual officer sign-off before ride enablement.
          </p>
        </div>

        <button
          onClick={fetchPendingQueue}
          disabled={loading}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Pending' },
            { id: 'DL', label: 'Pending DL' },
            { id: 'AADHAAR', label: 'Pending Aadhaar' },
            { id: 'PAN', label: 'Pending PAN' },
            { id: 'RC', label: 'Pending RC' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicant name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Queue Cards */}
      {loading ? (
        <div className="p-16 text-center text-neutral-500 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
          Checking pending driver applications in database...
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="p-16 text-center text-neutral-500 bg-neutral-900/60 rounded-2xl border border-neutral-800 text-xs">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          All clear! No driver registrations currently pending verification.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const driver = item.driver || {};
            const vehicle = driver.vehicle || item.vehicle || {};
            const docs = item.documents || [];

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
              >
                {/* Driver Info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{driver.name || 'Anonymous Applicant'}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                        Step {item.currentStep || 7}/7
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {driver.phone || 'No phone'} • Vehicle:{' '}
                      <span className="text-emerald-400 font-mono font-bold">
                        {vehicle.plate || vehicle.plateNumber || '—'}
                      </span>{' '}
                      ({driver.vehicleType || 'Bike'})
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-500">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Submitted: <span className="text-neutral-300">{getWaitTime(item.submissionDate, item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Pending Verification Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 mr-2">DL:</span>
                    <span
                      className={`font-semibold ${
                        item.dlStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.dlStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 mr-2">Aadhaar:</span>
                    <span
                      className={`font-semibold ${
                        item.aadharStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.aadharStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 mr-2">PAN:</span>
                    <span
                      className={`font-semibold ${
                        item.panStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.panStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                    <span className="text-neutral-500 mr-2">RC:</span>
                    <span
                      className={`font-semibold ${
                        item.rcStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {item.rcStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-500/10"
                  >
                    <Eye className="w-4 h-4" />
                    Review & Decide
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Detail Modal */}
      {selectedReg && (
        <DriverVerificationDetailModal
          registration={selectedReg}
          onClose={() => setSelectedReg(null)}
          onUpdated={fetchPendingQueue}
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
