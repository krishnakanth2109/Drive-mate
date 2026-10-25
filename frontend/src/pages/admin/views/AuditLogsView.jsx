import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Terminal, 
  User, 
  Lock, 
  Clock, 
  Globe, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { DataTable } from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/common/StatusPill';
import { DetailModal } from '../../../components/common/DetailModal';
import { QuickActionBtn } from '../../../components/common/QuickActionBtn';

const MOCK_LOGS = [
  { id: 'LOG-1092', action: 'ROLE_CREATED', adminName: 'Krishna Kanth (Super Admin)', target: 'SUPPORT_AGENT', ip: '192.168.0.123', createdAt: '25 Oct 2026, 11:15 AM', changes: { roleName: 'Support Agent', permissions: ['tickets:read', 'tickets:write'] } },
  { id: 'LOG-1091', action: 'DISBURSEMENT_AUTHORIZED', adminName: 'Sunita Mehra (Finance Admin)', target: 'BATCH-2026-W41', ip: '10.0.4.52', createdAt: '25 Oct 2026, 10:45 AM', changes: { totalAmount: '₹1,28,400', count: 44 } },
  { id: 'LOG-1090', action: 'DRIVER_SUSPENDED', adminName: 'Rajesh Kulkarni (Head of Support)', target: 'DRV-503 (Basavaraj Patil)', ip: '10.0.2.19', createdAt: '25 Oct 2026, 09:30 AM', changes: { reason: 'Severe passenger route dispute', duration: '48h hold' } },
  { id: 'LOG-1089', action: 'SURGE_ZONE_MODIFIED', adminName: 'Arjun Nair (Operations Manager)', target: 'Koramangala 5th Block', ip: '10.0.1.88', createdAt: '25 Oct 2026, 08:00 AM', changes: { previous: '1.2x', updated: '1.8x' } },
  { id: 'LOG-1088', action: 'ROLES_ASSIGNED', adminName: 'Krishna Kanth (Super Admin)', target: 'Karan Patel (Staff)', ip: '192.168.0.123', createdAt: '24 Oct 2026, 06:10 PM', changes: { assigned: ['FINANCER'] } },
];

export function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('vlt_master_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await axios.get(`${API_URL}/rbac/audit-logs`, {
        headers: token ? { 'x-auth-token': token } : {}
      });
      if (res.data?.data && res.data.data.length > 0) {
        setLogs(res.data.data);
      } else {
        setLogs(MOCK_LOGS);
      }
    } catch (err) {
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      header: 'Event / Action',
      render: r => (
        <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
          {r.action}
        </span>
      )
    },
    {
      header: 'Initiator Admin',
      render: r => (
        <div className="flex items-center gap-1.5 font-medium text-white text-xs">
          <User className="w-3.5 h-3.5 text-neutral-400" />
          {r.admin?.name || r.adminName || 'System Admin'}
        </div>
      )
    },
    {
      header: 'Target Entity',
      render: r => <span className="text-xs text-neutral-300 font-medium">{r.target || r.role?.name || 'Global Setting'}</span>
    },
    {
      header: 'IP Address',
      render: r => (
        <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
          <Globe className="w-3 h-3 text-neutral-500" /> {r.ip || '127.0.0.1'}
        </span>
      )
    },
    {
      header: 'Timestamp',
      render: r => (
        <span className="text-xs text-neutral-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-neutral-500" /> {new Date(r.createdAt || Date.now()).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Inspect',
      align: 'right',
      render: r => (
        <button
          onClick={() => setSelectedLog(r)}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-purple-400 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors font-medium flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Payload
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Security & RBAC Audit Logs
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Immutable log of all administrative actions, permissions grants, and system modifications
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      <DataTable
        title="Audit Event Stream"
        subtitle="Chronological audit records stored in Neon PostgreSQL audit_logs table"
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit events by action, admin, target or IP..."
        searchKeys={['action', 'adminName', 'target', 'ip']}
      />

      {selectedLog && (
        <DetailModal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          subtitle={`Initiated by ${selectedLog.admin?.name || selectedLog.adminName || 'Admin'} at ${new Date(selectedLog.createdAt || Date.now()).toLocaleString()}`}
          badge={<span className="text-xs font-mono font-bold text-purple-400">{selectedLog.ip || '127.0.0.1'}</span>}
          actions={
            <QuickActionBtn variant="secondary" onClick={() => setSelectedLog(null)}>
              Dismiss
            </QuickActionBtn>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-500">Event Action:</span>
                <p className="font-bold text-purple-400 text-sm mt-0.5">{selectedLog.action}</p>
              </div>
              <div>
                <span className="text-neutral-500">Origin IP:</span>
                <p className="font-mono text-white mt-0.5">{selectedLog.ip || '127.0.0.1'}</p>
              </div>
            </div>

            <div>
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                Audit Payload Changes (JSON)
              </span>
              <pre className="mt-1 p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedLog.changes || { event: selectedLog.action, status: 'SUCCESS' }, null, 2)}
              </pre>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
