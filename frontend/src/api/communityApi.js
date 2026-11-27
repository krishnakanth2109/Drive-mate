import { fetchApi } from './client';

export const communityApi = {
  // Commuter Auth & Profile
  login: (payload) =>
    fetchApi('/auth/login', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  googleLogin: (idToken) =>
    fetchApi('/auth/google', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify({ idToken }),
    }),
  sendRegisterOtp: (payload) =>
    fetchApi('/auth/register/send-otp', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  verifyAndRegister: (payload) =>
    fetchApi('/auth/register/verify-and-register', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  getMyProfile: () => fetchApi('/auth/me', { authScope: 'user' }),
  updateMyProfile: (payload) =>
    fetchApi('/auth/profile', {
      method: 'PUT',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload) =>
    fetchApi('/auth/change-password', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email) =>
    fetchApi('/auth/forgot-password', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload) =>
    fetchApi('/auth/reset-password', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),

  // Community Feed & Chat
  getPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/community/posts${query ? `?${query}` : ''}`, { authScope: 'user' });
  },
  createPost: (payload) =>
    fetchApi('/community/posts', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
  getConnections: () => fetchApi('/community/connections', { authScope: 'user' }),
  getDirectMessages: (recipientId) =>
    fetchApi(`/community/messages/${recipientId}`, { authScope: 'user' }),
  sendDirectMessage: (recipientId, text) =>
    fetchApi(`/community/messages/${recipientId}`, {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify({ text }),
    }),

  // Wallet
  getWallet: () => fetchApi('/wallet', { authScope: 'user' }),
  getWalletTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/wallet/transactions${query ? `?${query}` : ''}`, { authScope: 'user' });
  },
  createTopupOrder: (amount) =>
    fetchApi('/wallet/topup/order', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify({ amount, currency: 'INR' }),
    }),
  verifyTopupPayment: (payload) =>
    fetchApi('/wallet/topup/verify', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),

  // Public Support & Ride Lookup
  getRide: (rideId) => fetchApi(`/ride/${rideId}`, { authScope: 'user' }),
  getRideWaitTime: (rideId) => fetchApi(`/ride/${rideId}/wait-time`, { authScope: 'user' }),
  getCustomerHistory: (limit = 5) =>
    fetchApi(`/ride/customer/history?limit=${limit}`, { authScope: 'user' }),
  submitSupportTicket: (payload) =>
    fetchApi('/support/tickets', {
      method: 'POST',
      authScope: 'user',
      body: JSON.stringify(payload),
    }),
};
