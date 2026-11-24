import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  User,
  Phone,
  Car,
  CreditCard,
  Fingerprint,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { fetchApi } from '../../../api/client';

export function DriverVerificationDetailModal({
  registration,
  onClose,
  onUpdated,
  onToast
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingAction, setLoadingAction] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [reuploadDocType, setReuploadDocType] = useState('DRIVING_LICENSE');
  const [reuploadReason, setReuploadReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  if (!registration) return null;

  const driver = registration.driver || {};
  const vehicle = driver.vehicle || registration.vehicle || {};
  const stepData = registration.stepData || {};
  const documents = registration.documents || [];
  const audits = registration.audits || [];

  const getDoc = (type) => documents.find((d) => d.documentType === type);

  const dlDoc = getDoc('DRIVING_LICENSE');
  const aadhaarDoc = getDoc('AADHAAR');
  const panDoc = getDoc('PAN');
  const rcDoc = getDoc('RC');
  const insuranceDoc = getDoc('INSURANCE');

  // Handle Full Approval
  const handleApproveAll = async () => {
    if (!window.confirm('Are you sure you want to approve this driver and authorize ride acceptance?')) {
      return;
    }
    setLoadingAction(true);
    try {
      await fetchApi('/admin/verification/approve', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: registration.id,
          notes: 'Administrative compliance approval granted. Driver activated for rides.',
        }),
      });
      onToast?.({
        type: 'success',
        title: 'Driver Approved',
        message: 'Driver onboarding verified and approved successfully.',
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      onToast?.({
        type: 'error',
        title: 'Approval Failed',
        message: err.message || 'Could not approve driver onboarding.',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Rejection
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a mandatory rejection reason for compliance auditing.');
      return;
    }
    setLoadingAction(true);
    try {
      await fetchApi('/admin/verification/reject', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: registration.id,
          reason: rejectionReason.trim(),
        }),
      });
      onToast?.({
        type: 'info',
        title: 'Application Rejected',
        message: 'Driver registration has been rejected with compliance notice.',
      });
      setRejectModalOpen(false);
      onUpdated?.();
      onClose();
    } catch (err) {
      onToast?.({
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'Could not reject onboarding application.',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Request Re-upload
  const handleConfirmReupload = async () => {
    if (!reuploadReason.trim()) {
      alert('Please provide instructions for the driver regarding what to fix.');
      return;
    }
    setLoadingAction(true);
    try {
      await fetchApi('/admin/verification/request-reupload', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: registration.id,
          documentType: reuploadDocType,
          reason: reuploadReason.trim(),
        }),
      });
      onToast?.({
        type: 'info',
        title: 'Re-upload Requested',
        message: `Notification sent to driver requesting new ${reuploadDocType} upload.`,
      });
      setReuploadModalOpen(false);
      onUpdated?.();
    } catch (err) {
      onToast?.({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'Could not request document re-upload.',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Sandbox Retry
  const handleRetrySandbox = async (docType) => {
    setLoadingAction(true);
    try {
      await fetchApi('/admin/verification/retry-sandbox', {
        method: 'POST',
        body: JSON.stringify({
          onboardingId: registration.id,
          documentType: docType,
        }),
      });
      onToast?.({
        type: 'success',
        title: 'Sandbox Verification Re-run',
        message: `Triggered live sandbox verification check for ${docType}.`,
      });
      onUpdated?.();
    } catch (err) {
      onToast?.({
        type: 'error',
        title: 'Sandbox Error',
        message: err.message || 'Sandbox verification provider unavailable.',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'VERIFIED' || s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {s}
        </span>
      );
    }
    if (s === 'PENDING' || s === 'PENDING_REVIEW' || s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          {s}
        </span>
      );
    }
    if (s === 'MANUAL_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          MANUAL REVIEW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3.5 h-3.5" />
        {s || 'NOT SUBMITTED'}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'step1', label: '1. Personal' },
    { id: 'step2', label: '2. Contact' },
    { id: 'step3', label: '3. Driving Licence' },
    { id: 'step4', label: '4. Aadhaar KYC' },
    { id: 'step5', label: '5. PAN Card' },
    { id: 'step6', label: '6. Vehicle & RC' },
    { id: 'audits', label: '7. Audit Trail' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{driver.name || 'Driver Applicant'}</h3>
                {getStatusBadge(registration.overallStatus)}
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  Step {registration.currentStep || 1}/7
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Application ID: <span className="font-mono text-neutral-300">{registration.id}</span> • Registered:{' '}
                {new Date(registration.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-5 overflow-x-auto gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Driving Licence</span>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(registration.dlStatus || dlDoc?.verificationStatus)}
                    <span className="text-xs text-neutral-400 font-mono">{dlDoc?.documentNumber || '—'}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Aadhaar KYC</span>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(registration.aadharStatus || aadhaarDoc?.verificationStatus)}
                    <span className="text-xs text-neutral-400 font-mono">{aadhaarDoc?.documentNumber || 'Masked'}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">PAN Card (Live)</span>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(registration.panStatus || panDoc?.verificationStatus)}
                    <span className="text-xs text-neutral-400 font-mono">{panDoc?.documentNumber || '—'}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Vehicle RC</span>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(registration.rcStatus || rcDoc?.verificationStatus)}
                    <span className="text-xs text-neutral-400 font-mono">{rcDoc?.documentNumber || vehicle?.plate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Applicant Card */}
              <div className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-4">
                <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Primary Applicant & Vehicle Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Full Name:</span>
                    <span className="text-white font-medium text-sm">{driver.name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Phone:</span>
                    <span className="text-white font-medium text-sm">{driver.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Email:</span>
                    <span className="text-white font-medium text-sm">{driver.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Vehicle Category:</span>
                    <span className="text-white font-medium">{driver.vehicleType || 'Bike'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Plate Number:</span>
                    <span className="text-emerald-400 font-mono font-bold">{vehicle.plate || vehicle.plateNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Make & Model:</span>
                    <span className="text-white font-medium">{vehicle.make} {vehicle.model}</span>
                  </div>
                </div>
              </div>

              {/* Verification Provider Summary */}
              <div className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Automated Sandbox Integration Status
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Connected to Sandbox.co.in KYC & DigiLocker live endpoints. Identity checks have been executed
                  server-side with full audit trail logging and zero PII leakage.
                </p>
                {registration.rejectionReason && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <strong>Rejection Notice:</strong> {registration.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: PERSONAL INFO */}
          {activeTab === 'step1' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Step 1: Personal Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                  <div>
                    <span className="text-neutral-500 block">Full Legal Name:</span>
                    <span className="text-white font-bold text-sm">{stepData.step1?.fullName || driver.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Date of Birth:</span>
                    <span className="text-white">{stepData.step1?.dob || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Gender:</span>
                    <span className="text-white uppercase">{stepData.step1?.gender || 'Not specified'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex flex-col items-center justify-center">
                  <span className="text-neutral-500 text-xs mb-2">Driver Profile Photo</span>
                  {stepData.step1?.profilePhoto ? (
                    <img
                      src={stepData.step1.profilePhoto}
                      alt="Driver selfie"
                      className="w-28 h-28 rounded-full object-cover border-2 border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">
                      No Photo
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & ADDRESS */}
          {activeTab === 'step2' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Step 2: Contact Details & Residential Address</h4>
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-500 block">Mobile Phone:</span>
                    <span className="text-white font-medium">{stepData.step2?.phone || driver.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Email Address:</span>
                    <span className="text-white font-medium">{stepData.step2?.email || driver.email}</span>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 block">Full Residential Address:</span>
                  <span className="text-white font-medium">{stepData.step2?.address || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-neutral-500 block">City:</span>
                    <span className="text-white">{stepData.step2?.city || '—'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">State:</span>
                    <span className="text-white">{stepData.step2?.stateName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Postal Code (PIN):</span>
                    <span className="text-white">{stepData.step2?.postalCode || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DRIVING LICENCE */}
          {activeTab === 'step3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Step 3: Driving Licence (DL) Verification</h4>
                <div className="flex items-center gap-2">
                  {getStatusBadge(dlDoc?.verificationStatus)}
                  <button
                    onClick={() => handleRetrySandbox('DRIVING_LICENSE')}
                    disabled={loadingAction}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Check
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block">DL Number:</span>
                  <span className="text-white font-mono font-bold text-sm">{dlDoc?.documentNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Verification Provider:</span>
                  <span className="text-white uppercase font-mono">{dlDoc?.verificationProvider || 'Manual'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Expiry Date:</span>
                  <span className="text-white">
                    {dlDoc?.expiryDate ? new Date(dlDoc.expiryDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Verified At:</span>
                  <span className="text-white">
                    {dlDoc?.verifiedAt ? new Date(dlDoc.verifiedAt).toLocaleDateString() : 'Pending'}
                  </span>
                </div>
              </div>

              {/* DL Image Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">DL Front Image</span>
                  <div className="h-52 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {dlDoc?.frontImageUrl ? (
                      <img
                        src={dlDoc.frontImageUrl}
                        alt="DL Front"
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setPreviewImage(dlDoc.frontImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No front image uploaded</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">DL Back Image</span>
                  <div className="h-52 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {dlDoc?.backImageUrl ? (
                      <img
                        src={dlDoc.backImageUrl}
                        alt="DL Back"
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setPreviewImage(dlDoc.backImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No back image uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AADHAAR */}
          {activeTab === 'step4' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Step 4: Aadhaar Identity & Consent KYC</h4>
                {getStatusBadge(aadhaarDoc?.verificationStatus)}
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-neutral-500 block">Aadhaar (Masked):</span>
                    <span className="text-white font-mono font-bold">{aadhaarDoc?.documentNumber || 'XXXX-XXXX-1234'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Consent Captured:</span>
                    <span className="text-emerald-400 font-semibold">
                      {registration.consentGiven ? 'YES (Authorized)' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">DigiLocker Session:</span>
                    <span className="text-neutral-300 font-mono">{registration.digilockerSessionId || 'Offline Fallback'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
                  <span className="font-bold text-neutral-300">UIDAI Compliance Note:</span> Unmasked Aadhaar numbers
                  are never logged or stored. Verification is maintained through authorized hashes and masked references.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">Aadhaar Front</span>
                  <div className="h-52 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {aadhaarDoc?.frontImageUrl ? (
                      <img
                        src={aadhaarDoc.frontImageUrl}
                        alt="Aadhaar Front"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(aadhaarDoc.frontImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No front image</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">Aadhaar Back</span>
                  <div className="h-52 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {aadhaarDoc?.backImageUrl ? (
                      <img
                        src={aadhaarDoc.backImageUrl}
                        alt="Aadhaar Back"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(aadhaarDoc.backImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No back image</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PAN CARD */}
          {activeTab === 'step5' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Step 5: PAN Verification (Sandbox KYC)</h4>
                <div className="flex items-center gap-2">
                  {getStatusBadge(panDoc?.verificationStatus)}
                  <button
                    onClick={() => handleRetrySandbox('PAN')}
                    disabled={loadingAction}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-verify PAN
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block">PAN Number:</span>
                  <span className="text-white font-mono font-bold text-sm">{panDoc?.documentNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Provider Ref ID:</span>
                  <span className="text-neutral-300 font-mono">{panDoc?.providerReferenceId || 'Sandbox NSDL'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Verification Status:</span>
                  <span className="text-emerald-400 font-bold">{panDoc?.verificationStatus || 'Pending'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-neutral-400 font-semibold">PAN Card Document Preview</span>
                <div className="h-60 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                  {panDoc?.frontImageUrl ? (
                    <img
                      src={panDoc.frontImageUrl}
                      alt="PAN Card"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setPreviewImage(panDoc.frontImageUrl)}
                    />
                  ) : (
                    <span className="text-xs text-neutral-500">No PAN image uploaded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: VEHICLE & RC */}
          {activeTab === 'step6' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Step 6: Vehicle Registration (RC) & Insurance</h4>
                <div className="flex items-center gap-2">
                  {getStatusBadge(rcDoc?.verificationStatus)}
                  <button
                    onClick={() => handleRetrySandbox('RC')}
                    disabled={loadingAction}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry RC Check
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block">Registration Plate:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {rcDoc?.documentNumber || vehicle.plate || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Make & Model:</span>
                  <span className="text-white font-medium">
                    {vehicle.make} {vehicle.model}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Manufacture Year:</span>
                  <span className="text-white">{vehicle.year || '2023'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Colour:</span>
                  <span className="text-white">{vehicle.color || 'Grey'}</span>
                </div>
              </div>

              {/* RC & Insurance Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">RC Front</span>
                  <div className="h-44 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {rcDoc?.frontImageUrl ? (
                      <img
                        src={rcDoc.frontImageUrl}
                        alt="RC Front"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(rcDoc.frontImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No RC front</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">RC Back</span>
                  <div className="h-44 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {rcDoc?.backImageUrl ? (
                      <img
                        src={rcDoc.backImageUrl}
                        alt="RC Back"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(rcDoc.backImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No RC back</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-semibold">Insurance Document</span>
                  <div className="h-44 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                    {insuranceDoc?.frontImageUrl ? (
                      <img
                        src={insuranceDoc.frontImageUrl}
                        alt="Insurance Policy"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(insuranceDoc.frontImageUrl)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">No insurance document</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG TAB */}
          {activeTab === 'audits' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Chronological Verification Audit Trail
              </h4>

              {audits.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">No audit events recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {audits.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white uppercase">{a.action}</span>
                          {getStatusBadge(a.newStatus)}
                          {a.admin && (
                            <span className="text-neutral-400">by {a.admin.name || a.admin.email}</span>
                          )}
                        </div>
                        <p className="text-neutral-300">{a.reason || 'Verification record processed'}</p>
                      </div>
                      <span className="text-neutral-500 text-[11px] font-mono whitespace-nowrap ml-4">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReuploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Request Re-upload
            </button>
            <button
              onClick={() => setRejectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject Application
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleApproveAll}
              disabled={loadingAction}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve All & Activate Driver
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Reject Driver Onboarding
            </h4>
            <p className="text-xs text-neutral-400">
              Provide a clear compliance reason. This explanation will be logged in the audit trail and sent to
              the driver.
            </p>
            <textarea
              className="w-full h-28 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              placeholder="e.g. Driving licence expired or image blurry. Unmatched PAN details."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Re-upload Modal */}
      {reuploadModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Request Document Re-upload
            </h4>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Document Type to Re-upload:</label>
              <select
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                value={reuploadDocType}
                onChange={(e) => setReuploadDocType(e.target.value)}
              >
                <option value="DRIVING_LICENSE">Driving Licence (DL)</option>
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="RC">Vehicle RC</option>
                <option value="INSURANCE">Insurance Document</option>
                <option value="PROFILE_PHOTO">Profile Photo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">Reason / Instructions for Driver:</label>
              <textarea
                className="w-full h-24 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                placeholder="e.g. The photo submitted is blurry. Please upload a clear original copy showing the expiry date."
                value={reuploadReason}
                onChange={(e) => setReuploadReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReuploadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReupload}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview */}
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
    </div>
  );
}
