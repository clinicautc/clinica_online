import { apiFetchJson } from './client';

export const usuariosAPI = {

  getAll() {
    return apiFetchJson('/usuarios');
  },

  getById(id: string | number) {
    return apiFetchJson(`/usuarios/${id}`);
  },

  updateProfile(id: string | number, data: { nombre?: string; telefono?: string; matricula?: string }) {
    return apiFetchJson(`/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateStatus(id: string | number, estado: string) {
    return apiFetchJson(`/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
  },

  remove(id: string | number) {
    return apiFetchJson(`/usuarios/${id}`, { method: 'DELETE' });
  }

};
