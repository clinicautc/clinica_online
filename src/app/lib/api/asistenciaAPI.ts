import { apiFetchJson } from './client';

export interface RegistroAsistencia {
  usuario_id: number;
  estado: 'presente' | 'ausente';
}

export interface PracticanteAsistencia {
  id: number;
  nombre: string;
  area: string;
  status: string;
  asistencia: 'presente' | 'ausente' | 'sin_registro';
}

export interface AsistenciaMesEntry {
  fecha: string;
  id: number;
  nombre: string;
  area: string;
  estado: 'presente' | 'ausente';
}

export const asistenciaAPI = {
  getByFecha(fecha: string, area?: string): Promise<PracticanteAsistencia[]> {
    const params = new URLSearchParams({ fecha });
    if (area) params.set('area', area);
    return apiFetchJson(`/asistencia?${params}`);
  },
  getByMes(mes: string, area?: string): Promise<AsistenciaMesEntry[]> {
    const params = new URLSearchParams({ mes });
    if (area) params.set('area', area);
    return apiFetchJson(`/asistencia/mes?${params}`);
  },
  registrar(fecha: string, registros: RegistroAsistencia[]): Promise<{ message: string; total: number }> {
    return apiFetchJson('/asistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, registros }),
    });
  },
  getByPracticante(usuarioId: string | number) {
    return apiFetchJson(`/asistencia/practicante/${usuarioId}`);
  },
};
