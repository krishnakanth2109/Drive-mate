import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Car, 
  Search, 
  MapPin, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  ExternalLink,
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { CityFilter } from '../../../components/common/CityFilter';
import { Modal } from '../../../components/common/Modal';
import { fetchApi } from '../../../api/client';

export function RidersVerificationView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || 'all';

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeDriver, setActiveDriver] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await fetchApi(`/admin/driver-verifications?${params.toString()}`);
      if (res) {
        setRegistrations(res.registrations || []);
        if (res.metrics?.byCity) {
          setCityCounts(res.metrics.byCity);
        }
      }
    } catch (err) {
      console.error('Failed to load driver registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [selectedCity, selectedStatus]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSearchParams(city === 'all' ? {} : { city });
  };

  const handleApproveDocument = async (docId: string) => {
    try {
      setSubmittingAction(true);
      await fetchApi(`/admin/documents/${docId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: actionNotes || 'Approved by Master Admin' }),
      });
      alert('Document approved successfully');
      loadRegistrations();
      if (activeDriver) {
        const updated = await fetchApi(`/admin/driver-verifications/${activeDriver.driverId}`);
        setActiveDriver(updated);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
      setActionNotes('');
    }
  };

  const handleRejectDocument = async (docId: string) => {
    if (!actionNotes.trim()) {
      alert('Please provide a mandatory rejection reason for the driver.');
      return;
    }
    try {
      setSubmittingAction(true);
      await fetchApi(`/admin/documents/${docId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: actionNotes }),
      });
      alert('Document rejected');
      loadRegistrations();
      if (activeDriver) {
        const updated = await fetchApi(`/admin/driver-verifications/${activeDriver.driverId}`);
        setActiveDriver(updated);
      }
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
      setActionNotes('');
    }
  };

  const handleRetryVerification = async (docId: string) => {
    try {
      setSubmittingAction(true);
      await fetchApi(`/admin/documents/${docId}/retry-verification`, {
        method: 'POST',
      });
      alert('Sandbox verification retried successfully');
      loadRegistrations();
      if (activeDriver) {
        const updated = await fetchApi(`/admin/driver-verifications/${activeDriver.driverId}`);
        setActiveDriver(updated);
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const openDriverDetails = async (driverId: string) => {
    try {
      const data = await fetchApi(`/admin/driver-verifications/${driverId}`);
      setActiveDriver(data);
    } catch (err: any) {
      alert(`Failed to load driver details: ${err.message}`);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'driverName',
      header: 'Driver Partner',
      render: (row) => (
        <div>
          <p className="font-bold text-white text-sm">{row.driverName}</p>
          <p className="text-xs text-neutral-400">{row.driverPhone}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City Hub',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 text-xs font-semibold text-neutral-300">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{row.city || 'Bengaluru'}</span>
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => (
        <div>
          <span className="font-semibold text-white uppercase text-xs">
            {row.vehicleType || 'BIKE'}
          </span>
          {row.vehicleInfo?.plate && (
            <p className="text-xs font-mono text-neutral-400">{row.vehicleInfo.plate}</p>
          )}
        </div>
      ),
    },
    {
      key: 'documents',
      header: 'Documents Verification',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
            DL: <StatusBadge status={row.dlStatus} size="sm" showIcon={false} />
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
            PAN: <StatusBadge status={row.panStatus} size="sm" showIcon={false} />
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
            RC: <StatusBadge status={row.rcStatus} size="sm" showIcon={false} />
          </span>
        </div>
      ),
    },
    {
      key: 'overallStatus',
      header: 'Overall Status',
      render: (row) => <StatusBadge status={row.overallStatus} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => openDriverDetails(row.driverId)}
          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-xs font-bold text-white transition-all border border-neutral-700 flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect Docs</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Compliance & Sandbox OCR</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Rider Partners & Document Verification by City
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Filter drivers across Indian metro hubs and audit their Driving Licences, PAN, Aadhaar, and RC certificates.
          </p>
        </div>

        <button
          onClick={() => loadRegistrations()}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* City Hub Filter Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg">
        <CityFilter
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
          cityCounts={cityCounts}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Drivers' },
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'approved', label: 'Verified & Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'in_progress', label: 'Draft In-Progress' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              selectedStatus === tab.id
                ? 'bg-neutral-800 text-white border-neutral-600 font-bold'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={registrations}
        loading={loading}
        searchPlaceholder="Search driver by name, phone, city, or plate..."
        searchableKey={(row) => `${row.driverName} ${row.driverPhone} ${row.city} ${row.vehicleInfo?.plate || ''}`}
        pageSize={10}
        emptyMessage={`No driver partners found for ${selectedCity === 'all' ? 'the selected filter' : selectedCity}.`}
      />

      {/* Detailed Document Inspection Modal */}
      <Modal
        isOpen={!!activeDriver}
        onClose={() => setActiveDriver(null)}
        title={`Driver Documents: ${activeDriver?.driver?.name || 'Driver'}`}
        subtitle={`City: ${activeDriver?.stepData?.step2?.city || 'Bengaluru'} • Phone: ${activeDriver?.driver?.phone}`}
        maxWidth="3xl"
      >
        {activeDriver && (
          <div className="space-y-6">
            {/* Driver Overview Summary */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500">Vehicle Category</p>
                <p className="font-bold text-white uppercase mt-0.5">
                  {activeDriver.driver?.vehicleType || 'BIKE'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500">Plate Number</p>
                <p className="font-mono font-bold text-emerald-400 mt-0.5">
                  {activeDriver.driver?.vehicle?.plate || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500">Onboarding Step</p>
                <p className="font-bold text-white mt-0.5">Step {activeDriver.currentStep} of 7</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500">Overall Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={activeDriver.overallStatus} size="sm" />
                </div>
              </div>
            </div>

            {/* Rejection / Note Input */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Administrative Notes / Rejection Reason
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter approval note or mandatory rejection reason..."
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Submitted Verification Documents ({activeDriver.documents?.length || 0})
              </h4>

              {activeDriver.documents && activeDriver.documents.length > 0 ? (
                activeDriver.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{doc.documentType}</span>
                        <StatusBadge status={doc.verificationStatus} size="sm" />
                      </div>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Provider: {doc.verificationProvider || 'sandbox'}
                      </span>
                    </div>

                    {doc.documentNumber && (
                      <p className="text-xs text-neutral-400 font-mono">
                        Document Number: <span className="text-white font-bold">{doc.documentNumber}</span>
                      </p>
                    )}

                    {/* Image previews */}
                    <div className="grid grid-cols-2 gap-3">
                      {doc.frontImageUrl ? (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-neutral-500">Front Side</p>
                          <img
                            src={doc.frontImageUrl}
                            alt="Front"
                            className="w-full h-36 object-cover rounded-xl border border-neutral-800 bg-neutral-900"
                          />
                        </div>
                      ) : (
                        <div className="h-36 rounded-xl border border-dashed border-neutral-800 flex items-center justify-center text-xs text-neutral-600">
                          No front image
                        </div>
                      )}

                      {doc.backImageUrl ? (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-neutral-500">Back Side</p>
                          <img
                            src={doc.backImageUrl}
                            alt="Back"
                            className="w-full h-36 object-cover rounded-xl border border-neutral-800 bg-neutral-900"
                          />
                        </div>
                      ) : (
                        <div className="h-36 rounded-xl border border-dashed border-neutral-800 flex items-center justify-center text-xs text-neutral-600">
                          No back image
                        </div>
                      )}
                    </div>

                    {/* Admin Action Bar per Document */}
                    <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={() => handleRetryVerification(doc.id)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Retry Sandbox</span>
                      </button>

                      <button
                        onClick={() => handleRejectDocument(doc.id)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApproveDocument(doc.id)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve Document</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                  No documents uploaded by driver partner yet.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
