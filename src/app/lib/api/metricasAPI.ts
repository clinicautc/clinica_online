import { apiFetchJson } from './client';

export const metricasAPI = {

  // Eventos crudos de cancelación/reagendado (tabla metricas) — el llamador
  // agrega por área/rango de fecha, igual que hace con citas/historiales.
  getEventos() {
    return apiFetchJson('/stats/eventos');
  },

  getLogs() {
    return apiFetchJson('/logs');
  }

};
