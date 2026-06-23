/**
 * ============================================================================
 * AUTH API — login, registro OTP, forgot/reset password, sesión.
 * Estos endpoints son públicos (sin sesión todavía), así que usan fetch()
 * directo en vez de apiFetch (no hay access token que adjuntar ni 401 que
 * reintentar con refresh).
 * ============================================================================
 */

import { API_BASE_URL } from './client';

export const authAPI = {

  async login(data: { email: string; password: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Credenciales incorrectas');
    }

    return result;
  },

  async sendRegisterCode(data: { name: string; email: string; password: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/pre-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error enviando código');
    }

    return result;
  },

  async verifyRegister(data: { email: string; code: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/verify-and-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Código inválido');
    }

    return result;
  },

  async forgotPassword(email: string) {

    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error enviando código');
    }

    return result;
  },

  async verifyResetCode(data: { email: string; code: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Código inválido');
    }

    return result;
  },

  async resetPassword(data: { email: string; newPassword: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error actualizando contraseña');
    }

    return result;
  },

  async resendCode(data: { email: string; tipo: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error reenviando código');
    }

    return result;
  },

  async logout(refreshToken: string) {

    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  },

  async cambiarPasswordInicial(data: { email: string; passwordActual: string; passwordNueva: string }) {

    const response = await fetch(`${API_BASE_URL}/auth/cambiar-password-inicial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'No se pudo actualizar la contraseña');
    }

    return result;
  }

};
