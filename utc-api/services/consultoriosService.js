const pool = require('../db');

// Config cruda de la fila del área — cantidad vigente, y opcionalmente una
// reducción programada (cantidad_pendiente) a partir de vigente_desde.
async function obtenerConfig(area) {
  const { rows } = await pool.query(
    `SELECT cantidad, cantidad_pendiente, vigente_desde::text AS vigente_desde
     FROM consultorios_config WHERE area = $1`,
    [area]
  );
  return rows.length > 0 ? rows[0] : { cantidad: 1, cantidad_pendiente: null, vigente_desde: null };
}

// Capacidad real para una fecha concreta: si hay una reducción programada y
// la fecha ya alcanzó (o superó) vigente_desde, aplica la cantidad nueva;
// si no, sigue aplicando la vigente.
function capacidadEnFecha(config, fechaStr) {
  const fecha = String(fechaStr).split('T')[0];
  if (config.cantidad_pendiente != null && config.vigente_desde && fecha >= config.vigente_desde) {
    return config.cantidad_pendiente;
  }
  return config.cantidad;
}

// Cantidad de consultorios configurada para el área — determina cuántas
// citas simultáneas caben en el mismo horario (una por consultorio). Si se
// da `fecha`, respeta una reducción programada que ya haya entrado en vigor
// para esa fecha específica.
async function obtenerConsultorios(area, fecha) {
  const config = await obtenerConfig(area);
  return fecha ? capacidadEnFecha(config, fecha) : config.cantidad;
}

// Primera fecha (hoy o después) a partir de la cual reducir a `nuevaCantidad`
// no deja ninguna cita ya agendada por encima de la nueva capacidad. Null si
// no hay ningún conflicto y se puede aplicar de inmediato.
async function calcularFechaSinConflicto(area, nuevaCantidad) {
  const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const { rows } = await pool.query(
    `SELECT fecha::date::text AS fecha
     FROM citas
     WHERE tipo = $1 AND estado IN ('programada', 'en_atencion') AND fecha >= $2
     GROUP BY fecha::date, hora
     HAVING COUNT(*) > $3
     ORDER BY fecha DESC
     LIMIT 1`,
    [area, hoyStr, nuevaCantidad]
  );
  if (rows.length === 0) return null;

  const [y, m, d] = rows[0].fecha.split('-').map(Number);
  const siguiente = new Date(y, m - 1, d + 1);
  return `${siguiente.getFullYear()}-${String(siguiente.getMonth() + 1).padStart(2, '0')}-${String(siguiente.getDate()).padStart(2, '0')}`;
}

module.exports = { obtenerConsultorios, obtenerConfig, capacidadEnFecha, calcularFechaSinConflicto };
