import api from './api';

export const notificationService = {
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.unreadOnly) query.append('unreadOnly', 'true');
    const queryString = query.toString();
    return api.get(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  async markAsRead(id) {
    return api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return api.patch('/notifications/read-all');
  },

  async deleteNotification(id) {
    return api.delete(`/notifications/${id}`);
  },

  async triggerCheck() {
    return api.post('/notifications/check');
  },
};
