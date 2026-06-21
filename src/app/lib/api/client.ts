/**
 * ============================================================================
 * CLIENTE HTTP CENTRALIZADO
 * Única fuente de verdad para: base URL, header Authorization, y el
 * refresh silencioso del access token ante un 401.
 * ============================================================================
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const REFRESH_TOKEN_KEY = 'utc_refresh_token';

export interface SessionUser {
  id: number | string;
  nombre: string;
  email: string;
  rol: 'paciente' | 'practicante' | 'admin' | 'master';
  area?: string | null;
  status?: string;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<{ accessToken: string; user: SessionUser } | null> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

async function refreshAccessToken(): Promise<{ accessToken: string; user: SessionUser } | null> {
  const storedRefreshToken = getRefreshToken();

  if (!storedRefreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken })
    });

    if (!response.ok) {
      setAccessToken(null);
      setRefreshToken(null);
      return null;
    }

    const data = await response.json();

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return { accessToken: data.accessToken, user: data.user };

  } catch {
    return null;
  }
}

// Evita ráfagas de /refresh si varias peticiones reciben 401 al mismo tiempo.
function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Intercambia el refresh token guardado por una sesión nueva.
 * Se usa una sola vez, al montar la app.
 */
export async function bootstrapSession(): Promise<SessionUser | null> {
  const result = await refreshAccessToken();
  return result ? result.user : null;
}

export function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
}

/**
 * fetch() con Authorization automático y reintento único tras un refresh
 * silencioso si el servidor responde 401.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const buildHeaders = () => {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return headers;
  };

  let response = await fetch(url, { ...options, headers: buildHeaders() });

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await fetch(url, { ...options, headers: buildHeaders() });
    }
  }

  return response;
}

/** Igual que apiFetch, pero ya parsea JSON y lanza Error con el mensaje del backend si falla. */
export async function apiFetchJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {

  const response = await apiFetch(path, options);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.error || 'Error en la solicitud');
  }

  return result;
}
