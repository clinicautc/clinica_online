const pool = require('../db');
const consentimientoService = require('../services/consentimientoService');

const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

async function upload(req, res) {
  const { id: citaId } = req.params;
  const usuario = req.user;
  const { archivo, mimeType } = req.body;

  if (!archivo || !mimeType) {
    return res.status(400).json({ error: 'archivo y mimeType son requeridos' });
  }
  if (!TIPOS_PERMITIDOS.includes(mimeType)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido. Usa PDF, JPG o PNG.' });
  }

  try {
    const citaResult = await pool.query('SELECT * FROM citas WHERE id = $1', [citaId]);
    if (citaResult.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    const cita = citaResult.rows[0];

    if (usuario.rol === 'practicante' && String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const buffer = Buffer.from(archivo, 'base64');
    const fechaStr = cita.fecha instanceof Date
      ? cita.fecha.toISOString().split('T')[0]
      : String(cita.fecha).split('T')[0];

    const saved = await consentimientoService.guardar({
      archivo: buffer,
      mimeType,
      pacienteId: cita.paciente_id,
      pacienteNombre: cita.paciente_nombre,
      area: cita.tipo,
      appointmentId: citaId,
      fecha: fechaStr,
    });

    res.json({ ok: true, nombre_archivo: saved.nombre_archivo });
  } catch (error) {
    console.error('[consentimiento] Error al guardar:', error);
    res.status(500).json({ error: error.message });
  }
}

async function check(req, res) {
  const { id: citaId } = req.params;
  try {
    const existe = await consentimientoService.existePorCita(citaId);
    res.json({ existe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function descargar(req, res) {
  const { id: citaId } = req.params;
  try {
    const result = await pool.query(
      'SELECT archivo, mime_type, nombre_archivo FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1',
      [citaId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay consentimiento para esta cita' });
    }
    const { archivo, mime_type, nombre_archivo } = result.rows[0];
    res.setHeader('Content-Type', mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${nombre_archivo}"`);
    res.send(archivo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function eliminar(req, res) {
  const { id: citaId } = req.params;
  const usuario = req.user;
  try {
    const citaResult = await pool.query('SELECT practicante_id FROM citas WHERE id = $1', [citaId]);
    if (citaResult.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    if (usuario.rol === 'practicante' && String(citaResult.rows[0].practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await consentimientoService.eliminarPorCita(citaId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { upload, check, descargar, eliminar };
