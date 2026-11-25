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
  AlertTriangle,
  ZoomIn,
  X,
  CreditCard,
  FileText,
  User,
  Fingerprint,
  Calendar,
  Check,
  Maximize2
} from 'lucide-react';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { CityFilter } from '../../../components/common/CityFilter';
import { Modal } from '../../../components/common/Modal';
import { fetchApi } from '../../../api/client';

/**
 * Resolves static document URLs safely whether hosted on Cloudinary or served from backend /uploads
 */
export const resolveImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image/')) {
    return path;
  }
  const backendUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:5000';
  return `${backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export function RidersVerificationView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || 'all';

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Selected driver for document inspection
  const [activeDriver, setActiveDriver] = useState<any | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'all' | 'DL' | 'AADHAAR' | 'PAN' | 'RC' | 'PROFILE'>('all');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  
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
      setActiveDocTab('all');
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
          <span>{row.city || 'Hyderabad'}</span>
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
          className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 text-xs font-bold text-white transition-all border border-neutral-700 flex items-center gap-1.5 shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Documents</span>
        </button>
      ),
    },
  ];

  // Helper to filter documents according to selected tab
  const getFilteredDocs = () => {
    if (!activeDriver?.documents) return [];
    if (activeDocTab === 'all') return activeDriver.documents;
    if (activeDocTab === 'DL') {
      return activeDriver.documents.filter((d: any) => d.documentType === 'DRIVING_LICENSE');
    }
    if (activeDocTab === 'AADHAAR') {
      return activeDriver.documents.filter((d: any) => d.documentType === 'AADHAAR');
    }
    if (activeDocTab === 'PAN') {
      return activeDriver.documents.filter((d: any) => d.documentType === 'PAN');
    }
    if (activeDocTab === 'RC') {
      return activeDriver.documents.filter((d: any) => d.documentType === 'RC' || d.documentType === 'INSURANCE');
    }
    return activeDriver.documents;
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'DRIVING_LICENSE':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'AADHAAR':
        return <Fingerprint className="w-4 h-4 text-sky-400" />;
      case 'PAN':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'RC':
      case 'INSURANCE':
        return <Car className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getDocDisplayTitle = (type: string) => {
    switch (type) {
      case 'DRIVING_LICENSE':
        return 'Driving Licence (DL)';
      case 'AADHAAR':
        return 'Aadhaar Identity Card';
      case 'PAN':
        return 'Income Tax PAN Card';
      case 'RC':
        return 'Vehicle Certificate of Registration (RC)';
      case 'INSURANCE':
        return 'Vehicle Insurance Policy';
      default:
        return type.replace(/_/g, ' ');
    }
  };

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
            Audit driver Driving Licences, Aadhaar, PAN Cards, and Vehicle RC certificates with live image preview and sandbox verification.
          </p>
        </div>

        <button
          onClick={() => loadRegistrations()}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-colors flex items-center gap-2 shadow-sm"
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

      {/* Comprehensive Driver Document Inspection Modal */}
      <Modal
        isOpen={!!activeDriver}
        onClose={() => setActiveDriver(null)}
        title={`Driver Documents: ${activeDriver?.driver?.name || 'Driver'}`}
        subtitle={`City: ${activeDriver?.stepData?.contact?.city || 'Hyderabad'} • Phone: ${activeDriver?.driver?.phone} • Email: ${activeDriver?.driver?.email}`}
        maxWidth="5xl"
      >
        {activeDriver && (
          <div className="space-y-6">
            {/* Driver Profile Header Card */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Photo */}
                <div 
                  className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-emerald-500/40 cursor-pointer relative group flex-shrink-0"
                  onClick={() => {
                    const photo = activeDriver.stepData?.personal?.profilePhoto || activeDriver.driver?.documents?.profilePhoto;
                    if (photo) setPreviewImage({ url: resolveImageUrl(photo), title: `${activeDriver.driver?.name} - Profile Photo` });
                  }}
                >
                  <img
                    src={resolveImageUrl(activeDriver.stepData?.personal?.profilePhoto || activeDriver.driver?.documents?.profilePhoto || '/uploads/documents/profilePhoto_0b77f0e4c91758076566335e_1795170389975_9aefc1d086889490.jpg')}
                    alt={activeDriver.driver?.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{activeDriver.driver?.name}</h3>
                    <StatusBadge status={activeDriver.overallStatus} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                    <span>Phone: <b className="text-white font-mono">{activeDriver.driver?.phone}</b></span>
                    <span>•</span>
                    <span>City: <b className="text-emerald-400">{activeDriver.stepData?.contact?.city || 'Hyderabad'}</b></span>
                    <span>•</span>
                    <span>Vehicle: <b className="text-white uppercase font-mono">{activeDriver.driver?.vehicle?.plate || 'TS09EA1234'} ({activeDriver.driver?.vehicleType || 'BIKE'})</b></span>
                  </div>
                </div>
              </div>

              {/* Quick Overall Compliance Badge */}
              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
                  Onboarding Step: <b className="text-white">{activeDriver.currentStep} of 7</b>
                </span>
              </div>
            </div>

            {/* Document Category Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: `All Documents (${activeDriver.documents?.length || 0})`, icon: ShieldCheck },
                { id: 'DL', label: 'Driving Licence (DL)', icon: CreditCard },
                { id: 'AADHAAR', label: 'Aadhaar Card', icon: Fingerprint },
                { id: 'PAN', label: 'PAN Card', icon: FileText },
                { id: 'RC', label: 'Vehicle RC & Insurance', icon: Car },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDocTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                      activeDocTab === tab.id
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Administrative Action / Note Input Bar */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter admin verification notes or mandatory rejection reason..."
                className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Documents Display Grid */}
            <div className="space-y-4">
              {getFilteredDocs().map((doc: any) => (
                <div
                  key={doc.id || doc.documentType}
                  className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 hover:border-neutral-700 transition-all shadow-sm"
                >
                  {/* Document Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                        {getDocTypeIcon(doc.documentType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">
                            {getDocDisplayTitle(doc.documentType)}
                          </h4>
                          <StatusBadge status={doc.verificationStatus} size="sm" />
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          ID: <span className="text-white font-bold">{doc.documentNumber || '—'}</span> • Provider: <span className="text-emerald-400">{doc.verificationProvider || 'sandbox'}</span>
                        </p>
                      </div>
                    </div>

                    {doc.expiryDate && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>Valid till: {new Date(doc.expiryDate).toLocaleDateString('en-IN')}</span>
                      </span>
                    )}
                  </div>

                  {/* Dual Front & Back Image Previews */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        <span>Front Side Document</span>
                        {doc.frontImageUrl && (
                          <button
                            onClick={() => setPreviewImage({ url: resolveImageUrl(doc.frontImageUrl), title: `${getDocDisplayTitle(doc.documentType)} - Front` })}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Enlarge</span>
                          </button>
                        )}
                      </div>
                      
                      {doc.frontImageUrl ? (
                        <div 
                          className="h-48 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group cursor-pointer flex items-center justify-center p-2"
                          onClick={() => setPreviewImage({ url: resolveImageUrl(doc.frontImageUrl), title: `${getDocDisplayTitle(doc.documentType)} - Front` })}
                        >
                          <img
                            src={resolveImageUrl(doc.frontImageUrl)}
                            alt="Front Document"
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-3 py-1.5 rounded-lg bg-neutral-900/90 text-white text-xs font-semibold border border-neutral-700 flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Click to Zoom</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-xs text-neutral-500 gap-1">
                          <FileText className="w-6 h-6 text-neutral-600" />
                          <span>No front document image</span>
                        </div>
                      )}
                    </div>

                    {/* Back Image */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        <span>Back Side Document</span>
                        {doc.backImageUrl && (
                          <button
                            onClick={() => setPreviewImage({ url: resolveImageUrl(doc.backImageUrl), title: `${getDocDisplayTitle(doc.documentType)} - Back` })}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Enlarge</span>
                          </button>
                        )}
                      </div>

                      {doc.backImageUrl ? (
                        <div 
                          className="h-48 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group cursor-pointer flex items-center justify-center p-2"
                          onClick={() => setPreviewImage({ url: resolveImageUrl(doc.backImageUrl), title: `${getDocDisplayTitle(doc.documentType)} - Back` })}
                        >
                          <img
                            src={resolveImageUrl(doc.backImageUrl)}
                            alt="Back Document"
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-3 py-1.5 rounded-lg bg-neutral-900/90 text-white text-xs font-semibold border border-neutral-700 flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Click to Zoom</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-xs text-neutral-500 gap-1">
                          <FileText className="w-6 h-6 text-neutral-600" />
                          <span>No back document image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Action Controls */}
                  <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Audit: {doc.verificationStatus === 'VERIFIED' ? 'Cryptographically verified with official registry' : 'Awaiting administrative sign-off'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRetryVerification(doc.id)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 flex items-center gap-1.5 transition-colors border border-neutral-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Retry Sandbox</span>
                      </button>

                      <button
                        onClick={() => handleRejectDocument(doc.id)}
                        disabled={submittingAction}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApproveDocument(doc.id)}
                        disabled={submittingAction}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {getFilteredDocs().length === 0 && (
                <div className="p-10 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-2xl">
                  No documents found for this category tab.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* High-Resolution Document Image Lightbox / Zoom Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 text-white">
              <span className="font-bold text-sm tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{previewImage.title}</span>
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image viewer */}
            <div className="max-h-[75vh] overflow-auto rounded-xl flex items-center justify-center p-2 bg-neutral-900/60">
              <img
                src={previewImage.url}
                alt="Enlarged Document Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            <div className="mt-3 text-xs text-neutral-500">
              Press ESC or click outside to close preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
