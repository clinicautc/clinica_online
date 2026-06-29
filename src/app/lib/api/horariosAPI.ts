import { apiFetchJson } from './client';

export interface DiaSemana {
  dia_semana: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  activo: boolean;
}

export const horariosAPI = {
  getByUsuario(usuarioId: string | number): Promise<DiaSemana[]> {
    return apiFetchJson(`/horarios/${usuarioId}`);
  },
  upsert(usuarioId: string | number, dias: DiaSemana[]): Promise<DiaSemana[]> {
    return apiFetchJson(`/horarios/${usuarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dias }),
    });
  },
};
