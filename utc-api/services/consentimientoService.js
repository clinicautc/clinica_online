const pool = require('../db');

function generarNombreArchivo(pacienteId, pacienteNombre, fecha, citaId, mimeType) {
  const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg';
  const nombreLimpio = pacienteNombre
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toUpperCase();
  return `PAC${pacienteId}_${nombreLimpio}_${fecha}_CITA${citaId}_CONSENTIMIENTO.${ext}`;
}

async function guardar({ archivo, mimeType, pacienteId, pacienteNombre, area, appointmentId, fecha }) {
  const nombreArchivo = generarNombreArchivo(pacienteId, pacienteNombre, fecha, appointmentId, mimeType);

  const result = await pool.query(
    `INSERT INTO consentimientos_informados
       (paciente_id, area, appointment_id, storage_provider, storage_key, archivo, mime_type, nombre_archivo)
     VALUES ($1, $2, $3, 'postgres', $4, $5, $6, $7)
     RETURNING id, nombre_archivo`,
    [pacienteId, area, appointmentId, nombreArchivo, archivo, mimeType, nombreArchivo]
  );

  return result.rows[0];
}

async function obtener(storageKey, storageProvider = 'postgres') {
  if (storageProvider === 'postgres') {
    const result = await pool.query(
      'SELECT archivo, mime_type, nombre_archivo FROM consentimientos_informados WHERE storage_key = $1',
      [storageKey]
    );
    return result.rows[0] ?? null;
  }
  // Futuros proveedores (S3, Azure, MinIO) se agregan aquí sin tocar controladores.
  throw new Error(`Proveedor no soportado: ${storageProvider}`);
}

async function existePorCita(appointmentId) {
  const result = await pool.query(
    'SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1',
    [appointmentId]
  );
  return result.rows.length > 0;
}

async function eliminarPorCita(appointmentId) {
  await pool.query(
    'DELETE FROM consentimientos_informados WHERE appointment_id = $1',
    [appointmentId]
  );
}

module.exports = { guardar, obtener, existePorCita, eliminarPorCita };
