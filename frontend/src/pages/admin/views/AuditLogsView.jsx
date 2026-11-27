import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
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

export function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
      setLogs([]);
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
