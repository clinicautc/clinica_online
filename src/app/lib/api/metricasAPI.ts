import { apiFetchJson } from './client';

export const metricasAPI = {

  getDashboardStats() {
    return apiFetchJson('/stats/dashboard');
  },

  getLogs() {
    return apiFetchJson('/logs');
  }

};
