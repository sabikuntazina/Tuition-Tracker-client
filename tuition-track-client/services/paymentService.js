import api from './api';

export const paymentService = {
  async getPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.month && params.month !== 'all') query.append('month', params.month);
    if (params.year && params.year !== 'all') query.append('year', params.year);
    if (params.studentId && params.studentId !== 'all') query.append('studentId', params.studentId);
    if (params.paymentStatus && params.paymentStatus !== 'all') query.append('paymentStatus', params.paymentStatus);
    
    const queryString = query.toString();
    return api.get(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  async createOrUpdatePayment(paymentData) {
    return api.post('/payments', paymentData);
  },

  async getStudentPayments(studentId) {
    return api.get(`/payments/student/${studentId}`);
  },

  async updatePayment(id, paymentData) {
    return api.patch(`/payments/${id}`, paymentData);
  },
};
