import { fetchApi } from './client';

export const adminApi = {
  // Auth & Staff
  login: (credentials) =>
    fetchApi('/admin/login', {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(credentials),
    }),
  getAdmins: () => fetchApi('/admin/list', { authScope: 'admin' }),
  createAdmin: (payload) =>
    fetchApi('/admin/create', {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),

  // Core Admin Metrics & Directory
  getStats: () => fetchApi('/admin/stats', { authScope: 'admin' }),
  getHealth: () => fetchApi('/health', { authScope: 'admin' }),
  getRecentRides: () => fetchApi('/admin/recent-rides', { authScope: 'admin' }),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/orders${query ? `?${query}` : ''}`, { authScope: 'admin' });
  },
  getCustomers: () => fetchApi('/admin/customers', { authScope: 'admin' }),
  getDrivers: () => fetchApi('/admin/drivers', { authScope: 'admin' }),

  // Driver KYC Verification
  getDriverVerifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/driver-verifications${query ? `?${query}` : ''}`, { authScope: 'admin' });
  },
  getDriverVerificationDetails: (driverId) =>
    fetchApi(`/admin/driver-verifications/${driverId}`, { authScope: 'admin' }),
  getDocumentsByType: (type) =>
    fetchApi(`/admin/documents/by-type/${type}`, { authScope: 'admin' }),
  getPendingReviews: () => fetchApi('/admin/verifications/pending', { authScope: 'admin' }),
  approveDocument: (docId, notes) =>
    fetchApi(`/admin/documents/${docId}/approve`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify({ notes }),
    }),
  rejectDocument: (docId, reason) =>
    fetchApi(`/admin/documents/${docId}/reject`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify({ reason }),
    }),
  requestDocumentReupload: (docId, reason) =>
    fetchApi(`/admin/documents/${docId}/request-reupload`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify({ reason }),
    }),
  retryDocumentVerification: (docId) =>
    fetchApi(`/admin/documents/${docId}/retry-verification`, {
      method: 'POST',
      authScope: 'admin',
    }),

  // RBAC & Audit
  getMyPermissions: () => fetchApi('/rbac/my-permissions', { authScope: 'admin' }),
  getRoles: () => fetchApi('/rbac/roles', { authScope: 'admin' }),
  createRole: (payload) =>
    fetchApi('/rbac/roles', {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  updateRole: (id, payload) =>
    fetchApi(`/rbac/roles/${id}`, {
      method: 'PUT',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  deleteRole: (id) =>
    fetchApi(`/rbac/roles/${id}`, { method: 'DELETE', authScope: 'admin' }),
  getPermissionsCatalog: () => fetchApi('/rbac/permissions', { authScope: 'admin' }),
  createPermission: (payload) =>
    fetchApi('/rbac/permissions', {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  getAuditLogs: () => fetchApi('/rbac/audit-logs', { authScope: 'admin' }),

  // Finance
  getFinanceMetrics: () => fetchApi('/finance/metrics', { authScope: 'admin' }),
  getFinanceBatches: () => fetchApi('/finance/batches', { authScope: 'admin' }),
  authorizeBatch: (batchId, status) =>
    fetchApi(`/finance/batches/${batchId}/authorize`, {
      method: 'PATCH',
      authScope: 'admin',
      body: JSON.stringify({ status }),
    }),
  getDisbursements: () => fetchApi('/finance/disbursements', { authScope: 'admin' }),
  executeDisbursement: (id, payload) =>
    fetchApi(`/finance/disbursements/${id}/execute`, {
      method: 'PATCH',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  getFinancialLedger: () => fetchApi('/finance/ledger', { authScope: 'admin' }),

  // Fleet & Onboarding
  getFleetMetrics: () => fetchApi('/fleet/metrics', { authScope: 'admin' }),
  getFleetZones: () => fetchApi('/fleet/zones', { authScope: 'admin' }),
  getFleetOnboarding: () => fetchApi('/fleet/onboarding', { authScope: 'admin' }),
  updateFleetOnboarding: (id, payload) =>
    fetchApi(`/fleet/onboarding/${id}`, {
      method: 'PATCH',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),

  // Operations
  getOperationsMetrics: () => fetchApi('/operations/metrics', { authScope: 'admin' }),
  getCityZones: () => fetchApi('/operations/zones', { authScope: 'admin' }),
  updateZoneSurge: (zoneId, payload) =>
    fetchApi(`/operations/zones/${zoneId}/surge`, {
      method: 'PATCH',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  createBroadcast: (payload) =>
    fetchApi('/operations/broadcasts', {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),

  // Support
  getSupportMetrics: () => fetchApi('/support/metrics', { authScope: 'admin' }),
  getSupportTickets: () => fetchApi('/support/tickets', { authScope: 'admin' }),
  updateSupportTicket: (id, payload) =>
    fetchApi(`/support/tickets/${id}`, {
      method: 'PATCH',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  escalateSupportTicket: (id, payload) =>
    fetchApi(`/support/tickets/${id}/escalate`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  addTicketMessage: (id, payload) =>
    fetchApi(`/support/tickets/${id}/messages`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
  getSupportEscalations: () => fetchApi('/support/escalations', { authScope: 'admin' }),
  reviewEscalation: (id, payload) =>
    fetchApi(`/support/escalations/${id}/review`, {
      method: 'POST',
      authScope: 'admin',
      body: JSON.stringify(payload),
    }),
};
