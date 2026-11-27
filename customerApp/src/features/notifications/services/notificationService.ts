import { api, safeGet } from '../../../services/api';

export interface NotificationItem {
  _id: string;
  id?: string;
  title: string;
  body: string;
  type: 'promo' | 'ride' | 'system' | 'claim' | 'payout' | 'bonus';
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: () => safeGet<NotificationItem[]>('/profile/notifications'),
  markAllRead: async (): Promise<void> => {
    await api.put('/profile/notifications/mark-read');
  },
};
