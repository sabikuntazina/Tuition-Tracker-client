import api from './api';

export const classService = {
  async getClasses(params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    if (params.studentId && params.studentId !== 'all') query.append('studentId', params.studentId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    
    const queryString = query.toString();
    return api.get(`/classes${queryString ? `?${queryString}` : ''}`);
  },

  async getClassById(id) {
    return api.get(`/classes/${id}`);
  },

  async createClass(classData) {
    return api.post('/classes', classData);
  },

  async updateClass(id, classData) {
    return api.put(`/classes/${id}`, classData);
  },

  async markClassCompleted(id) {
    return api.patch(`/classes/${id}/complete`);
  },

  async markClassCancelled(id) {
    return api.patch(`/classes/${id}/cancel`);
  },

  async deleteClass(id) {
    return api.delete(`/classes/${id}`);
  },
};
