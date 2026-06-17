/** api.ts
 * ============================================================================
 * API CENTRALIZADA UTC 
 * ============================================================================
 */

export const API_BASE_URL = 'http://localhost:3001/api';

/**
 * ============================================================================
 * ENDPOINTS
 * ============================================================================
 */

export const endpoints = {

  auth: {
    preRegister: `${API_BASE_URL}/auth/pre-register`,
    verifyRegister: `${API_BASE_URL}/auth/verify-and-register`,
    login: `${API_BASE_URL}/auth/login`,
  },

  usuarios: `${API_BASE_URL}/usuarios`,
  citas: `${API_BASE_URL}/citas`,
  historiales: `${API_BASE_URL}/historiales`,
  notas: `${API_BASE_URL}/notas`,
  practicantes: `${API_BASE_URL}/practicantes`,
};

/**
 * ============================================================================
 * AUTH API
 * ============================================================================
 */

export const authAPI = {

  /**
   * ============================================================================
   * LOGIN
   * ============================================================================
   */

  async login(data: {
    email: string;
    password: string;
  }) {

    const response = await fetch(endpoints.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Credenciales incorrectas');
    }

    return result;
  },

  /**
   * ============================================================================
   * REGISTER — SEND CODE
   * ============================================================================
   */

  async sendRegisterCode(data: {
    name: string;
    email: string;
    password: string;
  }) {

    const response = await fetch(endpoints.auth.preRegister, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error enviando código');
    }

    return result;
  },

  /**
   * ============================================================================
   * REGISTER — VERIFY CODE
   * ============================================================================
   */

  async verifyRegister(data: {
    email: string;
    code: string;
  }) {

    const response = await fetch(endpoints.auth.verifyRegister, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Código inválido');
    }

    return result;
  },

  /**
   * ============================================================================
   * FORGOT PASSWORD — SEND CODE
   * ============================================================================
   */

  async forgotPassword(email: string) {

    const response = await fetch(
      `${API_BASE_URL}/auth/forgot-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Error enviando código'
      );
    }

    return result;
  },

  /**
   * ============================================================================
   * FORGOT PASSWORD — VERIFY CODE
   * ============================================================================
   */

  async verifyResetCode(data: {
    email: string;
    code: string;
  }) {

    const response = await fetch(
      `${API_BASE_URL}/auth/verify-reset-code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Código inválido'
      );
    }

    return result;
  },

  /**
   * ============================================================================
   * FORGOT PASSWORD — RESET PASSWORD
   * ============================================================================
   */

  async resetPassword(data: {
    email: string;
    newPassword: string;
  }) {

    const response = await fetch(
      `${API_BASE_URL}/auth/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Error actualizando contraseña'
      );
    }

    return result;
  },

  /**
   * ============================================================================
   * VALIDATE SESSION
   * ============================================================================
   */

  async validateSession(email: string) {

  const response = await fetch(
    `${API_BASE_URL}/auth/validate-session`,
    {
      method: 'GET',
      headers: {
        email
      }
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || 'Sesión inválida'
    );
  }

  return result;

},

// =========================================================
// REENVIAR CÓDIGO
// =========================================================

async resendCode(data: {

  email: string;

  tipo: string;

}){

  const response = await fetch(

    `${API_BASE_URL}/auth/resend-code`,

    {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify(data)

    }

  );

  const result = await response.json();

  if (!response.ok) {

    throw new Error(

      result.error || 'Error reenviando código'

    );

  }

  return result;

},

};