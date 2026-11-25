import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  X
} from 'lucide-react';
import { fetchApi } from '../../../api/client';
import { DriverVerificationDetailModal } from './DriverVerificationDetailModal';
import { NotificationToast } from '../../../components/common/NotificationToast';

const DOC_TYPES = [
  { id: 'DRIVING_LICENSE', label: 'Driving Licence (DL)' },
  { id: 'AADHAAR', label: 'Aadhaar Card' },
  { id: 'PAN', label: 'PAN Card (KYC)' },
  { id: 'RC', label: 'Vehicle RC' },
  { id: 'INSURANCE', label: 'Insurance Policy' },
];

export function DocumentStreamView({ defaultType = 'DRIVING_LICENSE', title = 'Document Verification Stream' }) {
  const [selectedType, setSelectedType] = useState(defaultType);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [toast, setToast] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Reject / Re-upload modals
  const [actionDoc, setActionDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reuploadReason, setReuploadReason] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'reject' | 'reupload'
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setSelectedType(defaultType);
  }, [defaultType]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        type: selectedType,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      });
      const data = await fetchApi(`/admin/verification/documents/stream?${query.toString()}`);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents stream:', err);
      setToast({
        type: 'error',
        title: 'Error Loading Stream',
        message: err.message || 'Could not fetch document stream',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedType, statusFilter]);

  // Quick Approve
  const handleApprove = async (doc) => {
    try {
      await fetchApi('/admin/verification/approve', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: doc.onboardingId,
          documentId: doc.id,
          notes: `Document approved via compliance stream by staff reviewer.`,
        }),
      });
      setToast({
        type: 'success',
        title: 'Document Approved',
        message: `${doc.documentType} marked as verified.`,
      });
      fetchDocuments();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Could not approve document.',
      });
    }
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a mandatory rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await fetchApi('/admin/verification/reject', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: actionDoc.onboardingId,
          documentId: actionDoc.id,
          reason: rejectReason.trim(),
        }),
      });
      setToast({
        type: 'info',
        title: 'Document Rejected',
        message: `${actionDoc.documentType} has been rejected.`,
      });
      setModalMode(null);
      setActionDoc(null);
      setRejectReason('');
      fetchDocuments();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Reject Failed',
        message: err.message || 'Failed to reject document',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Re-upload
  const handleConfirmReupload = async () => {
    if (!reuploadReason.trim()) {
      alert('Please enter instructions for the driver.');
      return;
    }
    setActionLoading(true);
    try {
      await fetchApi('/admin/verification/request-reupload', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: actionDoc.onboardingId,
          documentType: actionDoc.documentType,
          reason: reuploadReason.trim(),
        }),
      });
      setToast({
        type: 'info',
        title: 'Re-upload Requested',
        message: `Driver notified to re-upload ${actionDoc.documentType}.`,
      });
      setModalMode(null);
      setActionDoc(null);
      setReuploadReason('');
      fetchDocuments();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'Failed to request re-upload',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Retry Sandbox Check
  const handleRetrySandbox = async (doc) => {
    try {
      await fetchApi('/admin/verification/retry-sandbox', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: doc.onboardingId,
          documentType: doc.documentType,
        }),
      });
      setToast({
        type: 'success',
        title: 'Sandbox Verification Re-run',
        message: `Triggered live check for ${doc.documentType}.`,
      });
      fetchDocuments();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Sandbox Provider Error',
        message: err.message || 'Sandbox verification unavailable',
      });
    }
  };

  // Open Full Driver Details
  const handleOpenDriverDetails = async (doc) => {
    try {
      const fullDetails = await fetchApi(`/admin/verification/registration/${doc.onboardingId}`);
      setSelectedReg(fullDetails);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const driver = d.onboarding?.driver || {};
    return (
      !searchQuery.trim() ||
      (driver.name && driver.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (driver.phone && driver.phone.includes(searchQuery)) ||
      (d.documentNumber && d.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    if (s === 'MANUAL_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <AlertTriangle className="w-3 h-3" />
          Manual Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3 h-3" />
        {s || 'REJECTED'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Stream, inspect, and verify submitted driver documents with live Sandbox API support.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Document Type Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        {DOC_TYPES.map((dt) => (
          <button
            key={dt.id}
            onClick={() => setSelectedType(dt.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === dt.id
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/10'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PENDING', 'MANUAL_REVIEW', 'VERIFIED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver, phone, doc #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Document Grid Cards */}
      {loading ? (
        <div className="p-16 text-center text-neutral-500 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
          Loading {selectedType} documents from database...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-16 text-center text-neutral-500 bg-neutral-900/60 rounded-2xl border border-neutral-800 text-xs">
          No {selectedType} documents found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const driver = doc.onboarding?.driver || {};
            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-xl space-y-4"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{driver.name || 'Anonymous Applicant'}</h4>
                      <p className="text-xs text-neutral-400">{driver.phone || 'No phone'}</p>
                    </div>
                    {getStatusBadge(doc.verificationStatus)}
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Document No:</span>
                    <span className="font-mono font-bold text-white">{doc.documentNumber || '—'}</span>
                  </div>
                </div>

                {/* Previews: Front and Back */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="h-28 rounded-xl bg-neutral-950 border border-neutral-800/80 overflow-hidden flex items-center justify-center cursor-pointer group relative"
                    onClick={() => doc.frontImageUrl && setPreviewImage(doc.frontImageUrl)}
                  >
                    {doc.frontImageUrl ? (
                      <>
                        <img
                          src={doc.frontImageUrl}
                          alt="Front"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">
                          Front
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-500">No front image</span>
                    )}
                  </div>

                  <div
                    className="h-28 rounded-xl bg-neutral-950 border border-neutral-800/80 overflow-hidden flex items-center justify-center cursor-pointer group relative"
                    onClick={() => doc.backImageUrl && setPreviewImage(doc.backImageUrl)}
                  >
                    {doc.backImageUrl ? (
                      <>
                        <img
                          src={doc.backImageUrl}
                          alt="Back"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">
                          Back
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-500">No back image</span>
                    )}
                  </div>
                </div>

                {/* Provider Info */}
                <div className="text-[11px] text-neutral-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Provider:</span>
                    <span className="text-neutral-300 font-mono uppercase">{doc.verificationProvider || 'Manual'}</span>
                  </div>
                  {doc.providerReferenceId && (
                    <div className="flex items-center justify-between">
                      <span>Ref ID:</span>
                      <span className="text-neutral-300 font-mono truncate max-w-[120px]">
                        {doc.providerReferenceId}
                      </span>
                    </div>
                  )}
                  {doc.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span>Expiry:</span>
                      <span className="text-neutral-300">{new Date(doc.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApprove(doc)}
                      title="Approve this document"
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setActionDoc(doc);
                        setModalMode('reject');
                      }}
                      title="Reject with mandatory reason"
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setActionDoc(doc);
                        setModalMode('reupload');
                      }}
                      title="Request re-upload"
                      className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRetrySandbox(doc)}
                      title="Retry Sandbox check"
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenDriverDetails(doc)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {modalMode === 'reject' && actionDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Reject {actionDoc.documentType}
            </h4>
            <p className="text-xs text-neutral-400">
              Provide a mandatory reason for rejecting this document.
            </p>
            <textarea
              className="w-full h-24 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              placeholder="e.g. Document image is blurry or expired."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModalMode(null);
                  setActionDoc(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-upload Modal */}
      {modalMode === 'reupload' && actionDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Request Re-upload for {actionDoc.documentType}
            </h4>
            <p className="text-xs text-neutral-400">
              Enter specific instructions for the driver explaining why a new copy is requested.
            </p>
            <textarea
              className="w-full h-24 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Please take a clear picture of the original document showing all four corners."
              value={reuploadReason}
              onChange={(e) => setReuploadReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModalMode(null);
                  setActionDoc(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReupload}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl">
            <img src={previewImage} alt="Document large preview" className="max-w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Driver Detail Modal */}
      {selectedReg && (
        <DriverVerificationDetailModal
          registration={selectedReg}
          onClose={() => setSelectedReg(null)}
          onUpdated={fetchDocuments}
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
