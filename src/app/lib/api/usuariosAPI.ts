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

  solicitarCambioEmail(id: string | number, nuevoEmail: string) {
    return apiFetchJson(`/usuarios/${id}/email/solicitar-cambio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEmail })
    });
  },

  reenviarCodigoCambioEmail(id: string | number) {
    return apiFetchJson(`/usuarios/${id}/email/reenviar-codigo`, { method: 'POST' });
  },

  validarCodigoCambioEmail(id: string | number, codigo: string) {
    return apiFetchJson(`/usuarios/${id}/email/validar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });
  },

  confirmarCambioEmail(id: string | number, codigo: string, password: string) {
    return apiFetchJson(`/usuarios/${id}/email/confirmar-cambio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, password })
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
