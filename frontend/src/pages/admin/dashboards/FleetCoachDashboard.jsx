import React, { useState } from 'react';
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
  Phone
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';
import { NotificationToast } from '../../../components/common/NotificationToast';

const MOCK_APPLICANTS = [
  {
    id: 'DRV-501',
    name: 'Suresh Kumar',
    phone: '+91 98801 33419',
    vehicle: 'Honda Activa 6G (KA-01-AB-1234)',
    vehicleType: 'bike',
    experience: '3 Years',
    docsStatus: {
      dl: 'Approved',
      rc: 'Approved',
      aadhar: 'Pending Review',
      policeVerification: 'Required'
    },
    trainingStatus: 'Module 3/4',
    overallStatus: 'pending review',
    appliedDate: '2 days ago'
  },
  {
    id: 'DRV-502',
    name: 'Manjunath Reddy',
    phone: '+91 97412 88901',
    vehicle: 'Bajaj Pulsar 150 (KA-04-E-9021)',
    vehicleType: 'bike',
    experience: '5 Years',
    docsStatus: {
      dl: 'Approved',
      rc: 'Approved',
      aadhar: 'Approved',
      policeVerification: 'Approved'
    },
    trainingStatus: 'Completed (100%)',
    overallStatus: 'approved',
    appliedDate: '4 days ago'
  },
  {
    id: 'DRV-503',
    name: 'Basavaraj Patil',
    phone: '+91 96112 44321',
    vehicle: 'Piaggio Ape Auto (KA-02-C-5544)',
    vehicleType: 'auto',
    experience: '7 Years',
    docsStatus: {
      dl: 'Approved',
      rc: 'Pending Review',
      aadhar: 'Approved',
      policeVerification: 'Required'
    },
    trainingStatus: 'Module 1/4',
    overallStatus: 'in progress',
    appliedDate: '1 week ago'
  },
  {
    id: 'DRV-504',
    name: 'Ravi Teja',
    phone: '+91 94488 12390',
    vehicle: 'Maruti Suzuki WagonR (KA-05-MN-7711)',
    vehicleType: 'car',
    experience: '2 Years',
    docsStatus: {
      dl: 'Pending Review',
      rc: 'Required',
      aadhar: 'Pending Review',
      policeVerification: 'Required'
    },
    trainingStatus: 'Not Started',
    overallStatus: 'pending review',
    appliedDate: 'Yesterday'
  }
];

export function FleetCoachDashboard() {
  const [applicants, setApplicants] = useState(MOCK_APPLICANTS);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);

  const handleApproveDriver = (driverId) => {
    setApplicants(prev =>
      prev.map(d => (d.id === driverId ? { ...d, overallStatus: 'approved', trainingStatus: 'Completed (100%)' } : d))
    );
    setSelectedDriver(null);
    setToast({
      title: 'Driver Onboarding Approved',
      message: `Driver ${driverId} passed inspection and is activated on DriveMate network!`,
      type: 'success'
    });
  };

  const handleRequestDocResubmission = (driverId) => {
    setSelectedDriver(null);
    setToast({
      title: 'Resubmission Requested',
      message: `SMS sent to driver ${driverId} with document correction link.`,
      type: 'info'
    });
  };

  const columns = [
    {
      header: 'Driver ID',
      accessor: 'id',
      render: r => <span className="font-mono text-xs font-bold text-amber-400">{r.id}</span>
    },
    {
      header: 'Driver Name & Contact',
      render: r => (
        <div>
          <div className="font-semibold text-white">{r.name}</div>
          <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-neutral-500" /> {r.phone}
          </div>
        </div>
      )
    },
    {
      header: 'Vehicle & Category',
      render: r => (
        <div>
          <div className="text-xs font-medium text-neutral-200">{r.vehicle}</div>
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            {r.vehicleType}
          </span>
        </div>
      )
    },
    {
      header: 'Documents Verification',
      render: r => {
        const approvedCount = Object.values(r.docsStatus).filter(s => s === 'Approved').length;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <span>{approvedCount} / 4 Verified</span>
              {approvedCount === 4 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="w-24 h-1.5 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${approvedCount === 4 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(approvedCount / 4) * 100}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Safety Training',
      accessor: 'trainingStatus',
      render: r => <span className="text-xs text-cyan-400 font-medium">{r.trainingStatus}</span>
    },
    {
      header: 'Stage Status',
      render: r => <StatusPill status={r.overallStatus} size="sm" />
    },
    {
      header: 'Actions',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedDriver(r)}
          className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Inspect Dossier
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Fleet Coach Portal
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Driver Academy & Vehicle Verification
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Driver onboarding verification, physical fitness inspections, and defensive driving compliance
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Pending Document Review"
          value={applicants.filter(a => a.overallStatus !== 'approved').length}
          subtitle="Awaiting coach approval"
          icon={FileCheck2}
          color="amber"
          trend="4 urgent"
          trendType="neutral"
        />
        <MetricCard
          title="Vehicle Inspections"
          value="18"
          subtitle="Passed this week"
          icon={Car}
          color="emerald"
          trend="+5 vs last wk"
          trendType="up"
        />
        <MetricCard
          title="Training Graduations"
          value="89%"
          subtitle="Passed safety quiz"
          icon={GraduationCap}
          color="cyan"
          trend="+4%"
          trendType="up"
        />
        <MetricCard
          title="Avg Fleet Rating"
          value="4.88 ★"
          subtitle="Across active drivers"
          icon={Star}
          color="purple"
          trend="Top quartile"
          trendType="up"
        />
      </div>

      {/* Onboarding Table */}
      <DataTable
        title="Driver Onboarding Queue"
        subtitle="Applicants under review for vehicle and document clearance"
        columns={columns}
        data={applicants}
        searchPlaceholder="Search applicants by name, vehicle number or ID..."
        searchKeys={['name', 'id', 'vehicle', 'phone']}
        filterKey="overallStatus"
        filterOptions={[
          { label: 'All Stages', value: 'all' },
          { label: 'Pending Review', value: 'pending review' },
          { label: 'In Progress', value: 'in progress' },
          { label: 'Approved', value: 'approved' }
        ]}
      />

      {/* Driver Inspection Modal */}
      {selectedDriver && (
        <DetailModal
          isOpen={Boolean(selectedDriver)}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Dossier: ${selectedDriver.name}`}
          subtitle={`${selectedDriver.id} • Applied ${selectedDriver.appliedDate} • Phone: ${selectedDriver.phone}`}
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
                variant="danger"
                icon={X}
                onClick={() => handleRequestDocResubmission(selectedDriver.id)}
              >
                Reject / Resubmit Docs
              </QuickActionBtn>
              <QuickActionBtn
                variant="primary"
                icon={Check}
                onClick={() => handleApproveDriver(selectedDriver.id)}
              >
                Approve Driver & Grant Badge
              </QuickActionBtn>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Vehicle info card */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Vehicle Specification:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedDriver.vehicle}</p>
                <p className="text-amber-400 capitalize font-medium mt-0.5">{selectedDriver.vehicleType} Category</p>
              </div>
              <div>
                <span className="text-neutral-500">Driving Experience:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedDriver.experience}</p>
                <p className="text-cyan-400 font-medium mt-0.5">Clean driving record</p>
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div>
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Mandatory Regulatory Documents
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(selectedDriver.docsStatus).map(([doc, status]) => (
                  <div
                    key={doc}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white capitalize">
                        {doc === 'dl' ? 'Driving License (DL)' : doc === 'rc' ? 'RC Vehicle Book' : doc === 'aadhar' ? 'Aadhaar Identity' : 'Police Background Clearance'}
                      </span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Government Verified Record</p>
                    </div>
                    <StatusPill status={status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Training Modules */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white">DriveMate Driver Academy Status</span>
                <span className="text-cyan-400 font-bold">{selectedDriver.trainingStatus}</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Covers route navigation protocols, customer etiquette, zero-tolerance sexual harassment guidelines, and emergency SOS protocol.
              </p>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Toast */}
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
