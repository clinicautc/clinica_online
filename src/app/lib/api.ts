/**
 * ============================================================================
 * LIBRERÍA: api.ts
 * PROPÓSITO: Centralizar la URL del servidor para fácil mantenimiento.
 * ============================================================================
 */

// Cuando hagas deploy en Render, solo cambias esta URL aquí y listo.
export const API_BASE_URL = 'http://localhost:3001/api';

export const endpoints = {
    usuarios: `${API_BASE_URL}/usuarios`,
    citas: `${API_BASE_URL}/citas`,
    historiales: `${API_BASE_URL}/historiales`,
    notas: `${API_BASE_URL}/notas`,
    practicantes: `${API_BASE_URL}/practicantes`,
};