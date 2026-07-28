import { apiFetch, apiFetchJson } from './client';

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

export interface ConsultoriosConfig {
  area: Area;
  cantidad: number;
  cantidadPendiente: number | null;
  vigenteDesde: string | null;
}

// Respuesta cuando reducir consultorios dejaría citas ya agendadas por
// encima de la nueva capacidad: no se aplica nada todavía, se propone la
// primera fecha en la que sí se puede.
export interface ConsultoriosRequiereFecha {
  requiereFecha: true;
  fechaSugerida: string;
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
  getConsultorios(area: Area): Promise<ConsultoriosConfig> {
    return apiFetchJson(`/consultorios/${area}`);
  },
  // Puede devolver la config aplicada, o (si reducir choca con citas ya
  // agendadas y no se pasó vigenteDesde, o la fecha dada no alcanza)
  // ConsultoriosRequiereFecha en vez de lanzar — el llamador decide qué
  // mostrar en cada caso.
  async upsertConsultorios(area: Area, cantidad: number, vigenteDesde?: string): Promise<ConsultoriosConfig | ConsultoriosRequiereFecha> {
    const response = await apiFetch(`/consultorios/${area}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad, vigenteDesde }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && !data?.requiereFecha) {
      throw new Error(data?.error || 'Error en la solicitud');
    }
    return data;
  },
};
