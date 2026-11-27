import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Car, 
  FileCheck2, 
  GraduationCap, 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  Calendar, 
  Star,
  Clock,
  Phone,
  RefreshCw
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';
import { adminApi } from '../../../api/adminApi';

export function FleetCoachDashboard() {
  const [applicants, setApplicants] = useState([]);
  const [metrics, setMetrics] = useState({
    activeFleetDrivers: 0,
    inOnboardingPipeline: 0,
    inspectionsCount: 0,
    fleetComplianceRate: '0.0%',
    avgDriverRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchFleetData = useCallback(async () => {
    setLoading(true);
    try {
      const [rawOnboarding, metricsData] = await Promise.all([
        adminApi.getFleetOnboarding(),
        adminApi.getFleetMetrics(),
      ]);

      const mapped = (Array.isArray(rawOnboarding) ? rawOnboarding : []).map((d) => ({
        id: d.id ? `DRV-${d.id.slice(-4).toUpperCase()}` : 'DRV',
        rawId: d.id,
        name: d.driverName || 'Driver Applicant',
        phone: d.driverPhone || 'N/A',
        vehicle: d.vehicleDetails
          ? `${d.vehicleDetails.make || ''} ${d.vehicleDetails.model || ''} (${d.vehicleDetails.plateNumber || d.vehicleDetails.plate || 'Not set'})`.trim()
          : (d.vehicleType || 'Not set'),
        vehicleType: d.vehicleType || 'bike',
        experience: d.experience || '',
        docsStatus: {
          dl: d.dlStatus || 'Pending Review',
          rc: d.rcStatus || 'Pending Review',
          aadhar: d.aadharStatus || 'Pending Review',
          policeVerification: d.policeVerificationStatus || 'Required'
        },
        trainingStatus: d.trainingStatus || 'Not Started',
        overallStatus: d.overallStatus?.replace('_', ' ')?.toLowerCase() || 'pending review',
        appliedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''
      }));
      setApplicants(mapped);

      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to load fleet coach data:', err);
      setToast({
        title: 'Failed to Load Fleet Data',
        message: err.message || 'Unable to fetch onboarding pipeline.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  const handleApproveDriver = async (driver) => {
    const targetId = driver.rawId || driver.id;
    setProcessing(true);
    try {
      await adminApi.updateFleetOnboarding(targetId, {
        overallStatus: 'approved',
        trainingStatus: 'Completed (100%)',
        dlStatus: 'Approved',
        rcStatus: 'Approved',
        aadharStatus: 'Approved',
        policeVerificationStatus: 'Approved'
      });

      setApplicants((prev) =>
        prev.map((d) => (d.rawId === targetId || d.id === targetId ? { ...d, overallStatus: 'approved', trainingStatus: 'Completed (100%)' } : d))
      );
      setSelectedDriver(null);
      setToast({
        title: 'Driver Onboarding Approved',
        message: `${driver.name} has passed training and document verification. Driver active on dispatch network.`,
        type: 'success'
      });
      fetchFleetData();
    } catch (err) {
      console.error('Approve error:', err);
      setToast({
        title: 'Approval Failed',
        message: err.message || 'Could not update onboarding status.',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDriver = async (driver) => {
    const targetId = driver.rawId || driver.id;
    setProcessing(true);
    try {
      await adminApi.updateFleetOnboarding(targetId, {
        overallStatus: 'rejected'
      });

      setApplicants((prev) =>
        prev.map((d) => (d.rawId === targetId || d.id === targetId ? { ...d, overallStatus: 'rejected' } : d))
      );
      setSelectedDriver(null);
      setToast({
        title: 'Application Rejected',
        message: `${driver.name}'s onboarding file was rejected.`,
        type: 'info'
      });
      fetchFleetData();
    } catch (err) {
      console.error('Reject error:', err);
      setToast({
        title: 'Action Failed',
        message: err.message || 'Could not reject driver application.',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { header: 'Applicant ID', accessor: 'id', render: r => <span className="font-mono text-xs font-bold text-emerald-400">{r.id}</span> },
    {
      header: 'Driver Name & Phone',
      render: r => (
        <div>
          <div className="font-semibold text-white">{r.name}</div>
          <div className="text-xs text-neutral-400">{r.phone}</div>
        </div>
      )
    },
    {
      header: 'Vehicle Registered',
      render: r => (
        <div>
          <div className="text-xs font-medium text-white">{r.vehicle}</div>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300 uppercase mt-0.5 font-bold">
            {r.vehicleType}
          </span>
        </div>
      )
    },
    {
      header: 'Documents Verification',
      render: r => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            r.docsStatus.dl === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            DL: {r.docsStatus.dl}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            r.docsStatus.rc === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            RC: {r.docsStatus.rc}
          </span>
        </div>
      )
    },
    {
      header: 'Training Progress',
      accessor: 'trainingStatus',
      render: r => (
        <span className={`text-xs font-semibold ${r.trainingStatus.includes('Completed') ? 'text-emerald-400' : 'text-blue-400'}`}>
          {r.trainingStatus}
        </span>
      )
    },
    { header: 'Decision', render: r => <StatusPill status={r.overallStatus} size="sm" /> },
    {
      header: 'Review',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedDriver(r)}
          className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors font-medium"
        >
          Inspect & Verify
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Fleet Coach Workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Driver Onboarding & Fleet Safety Compliance
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Driving license verification, background checks, vehicle safety audits, and customer etiquette training
          </p>
        </div>

        <button
          onClick={fetchFleetData}
          disabled={loading}
          className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors self-start md:self-auto"
          title="Refresh Onboarding List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Fleet Drivers"
          value={metrics.activeFleetDrivers || 0}
          subtitle="Ready on road"
          icon={Car}
          color="emerald"
          trend="Live dispatch"
          trendType="up"
        />
        <MetricCard
          title="In Onboarding Pipeline"
          value={metrics.inOnboardingPipeline || applicants.filter(a => a.overallStatus.includes('pending') || a.overallStatus.includes('progress')).length}
          subtitle="Awaiting checks"
          icon={Clock}
          color="amber"
          trend="In queue"
          trendType="neutral"
        />
        <MetricCard
          title="Inspections Completed"
          value={metrics.inspectionsCount || 0}
          subtitle="42-point safety audits"
          icon={FileCheck2}
          color="cyan"
          trend="Verified fleet"
          trendType="up"
        />
        <MetricCard
          title="Fleet Compliance"
          value={metrics.fleetComplianceRate || '0.0%'}
          subtitle={`Rating: ${metrics.avgDriverRating ?? 0} ★`}
          icon={ShieldAlert}
          color="purple"
          trend="Compliant"
          trendType="up"
        />
      </div>

      {/* Onboarding Table */}
      <DataTable
        title="Driver Applicant Verification Pipeline"
        subtitle="Manage pending background verifications, mock driving tests, and document sign-offs"
        columns={columns}
        data={applicants}
        searchPlaceholder="Search applicants by name, vehicle or ID..."
        searchKeys={['name', 'id', 'vehicle', 'phone']}
        filterKey="overallStatus"
        filterOptions={[
          { label: 'All Applicants', value: 'all' },
          { label: 'Pending Review', value: 'pending review' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' }
        ]}
      />

      {/* Verification Modal */}
      {selectedDriver && (
        <DetailModal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Audit: ${selectedDriver.name}`}
          subtitle={`${selectedDriver.id} • ${selectedDriver.phone} • Applied ${selectedDriver.appliedDate}`}
          badge={<StatusPill status={selectedDriver.overallStatus} size="sm" />}
          actions={
            <>
              <QuickActionBtn
                variant="outline"
                onClick={() => setSelectedDriver(null)}
              >
                Close
              </QuickActionBtn>
              <QuickActionBtn
                variant="accent"
                icon={X}
                disabled={processing}
                onClick={() => handleRejectDriver(selectedDriver)}
              >
                Reject Application
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={Check}
                disabled={processing}
                onClick={() => handleApproveDriver(selectedDriver)}
              >
                Approve & Activate Driver
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Driving License:</span>
                <p className="font-bold text-white mt-0.5">{selectedDriver.docsStatus.dl}</p>
              </div>
              <div>
                <span className="text-neutral-500">RC Book & Insurance:</span>
                <p className="font-bold text-white mt-0.5">{selectedDriver.docsStatus.rc}</p>
              </div>
              <div>
                <span className="text-neutral-500">Aadhaar Identity:</span>
                <p className="font-bold text-white mt-0.5">{selectedDriver.docsStatus.aadhar}</p>
              </div>
              <div>
                <span className="text-neutral-500">Police Background Check:</span>
                <p className="font-bold text-white mt-0.5">{selectedDriver.docsStatus.policeVerification}</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 block mb-1">Safety & Customer Orientation:</span>
              <p className="text-white font-medium">{selectedDriver.trainingStatus}</p>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: selectedDriver.trainingStatus.includes('Completed') ? '100%' : '75%' }}
                />
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      {toast && (
        <NotificationToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
