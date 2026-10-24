import api from './api';

export const reportService = {
  async getMonthlySummary(params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    
    const queryString = query.toString();
    return api.get(`/monthly-summary${queryString ? `?${queryString}` : ''}`);
  },

  async getStudentMonthlySummary(studentId, params = {}) {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    
    const queryString = query.toString();
    return api.get(`/monthly-summary/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },
};
