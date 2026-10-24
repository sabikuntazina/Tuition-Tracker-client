import api from './api';

export const dashboardService = {
  async getDashboardOverview() {
    return api.get('/dashboard');
  },

  async getMonthlyProgress() {
    return api.get('/dashboard/monthly-progress');
  },

  async getUpcomingClasses() {
    return api.get('/dashboard/upcoming-classes');
  },
};
