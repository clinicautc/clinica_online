import { apiFetchJson } from './client';

export type Area = 'nutricion' | 'fisioterapia';

export interface HorarioAtencionDia {
  dia_semana: number; // 1=Lunes … 7=Domingo (ISO)
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface CierreClinico {
  id: number;
  area: Area;
  fecha: string;
  motivo: string | null;
  created_at: string;
}

export const horariosAtencionAPI = {
  getHorarios(area: Area): Promise<HorarioAtencionDia[]> {
    return apiFetchJson(`/horarios-atencion/${area}`);
  },
  upsertHorarios(area: Area, dias: HorarioAtencionDia[]): Promise<HorarioAtencionDia[]> {
    return apiFetchJson(`/horarios-atencion/${area}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dias }),
    });
  },
  getCierres(area: Area): Promise<CierreClinico[]> {
    return apiFetchJson(`/cierres-clinicos/${area}`);
  },
  crearCierre(area: Area, fecha: string, motivo?: string): Promise<CierreClinico> {
    return apiFetchJson(`/cierres-clinicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, fecha, motivo }),
    });
  },
  eliminarCierre(id: number): Promise<{ message: string }> {
    return apiFetchJson(`/cierres-clinicos/${id}`, { method: 'DELETE' });
  },
};
