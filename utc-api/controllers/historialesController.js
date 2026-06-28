const pool = require('../db');

async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT * FROM historiales_medicos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// LÓGICA DE VERIFICACIÓN DE RECURRENCIA
// Utilizada por los Dashboards de Practicante para cambiar el botón dinámicamente.
async function verificarRecurrencia(req, res) {
  const { pacienteId, area } = req.params;
  const tabla = area === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';

  try {
    const result = await pool.query(`SELECT COUNT(*) FROM ${tabla} WHERE paciente_id = $1`, [pacienteId]);
    const esRecurrente = parseInt(result.rows[0].count) > 0;

    if (esRecurrente) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
        ['paciente_recurrente', area, pacienteId, JSON.stringify({ mensaje: "Cita subsecuente detectada" })]
      );
    }
    res.json({ existe: esRecurrente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateGenerico(req, res) {
  const { id } = req.params; // ID del registro en la tabla de historiales
  const { datos, tipo } = req.body;

  if (tipo !== 'nutricion' && tipo !== 'fisioterapia') {
    return res.status(400).json({ error: 'Tipo de historial inválido. Usa "nutricion" o "fisioterapia".' });
  }
  const tabla = tipo === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';

  try {
    const result = await pool.query(
      `UPDATE ${tabla} SET datos = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(datos), id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ENDPOINT: Obtener datos específicos de un historial de NUTRICIÓN, usado para el auto-rellenado de formularios guardados.
async function getNutricionDetalle(req, res) {
  const { appointmentId } = req.params;

  if (!appointmentId || appointmentId === 'undefined' || isNaN(parseInt(appointmentId))) {
    return res.status(400).json({ error: "ID de cita inválido o no proporcionado." });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM historiales_nutricion WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1',
      [appointmentId]
    );

    if (result.rows.length > 0) {
      let fila = result.rows[0];
      if (typeof fila.datos === 'string') {
        fila.datos = JSON.parse(fila.datos);
      }
      res.json(fila);
    } else {
      res.status(404).json({ error: "No se encontraron datos para esta cita." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ENDPOINT: Obtener datos específicos de un historial de FISIOTERAPIA
async function getFisioterapiaDetalle(req, res) {
  const { appointmentId } = req.params;

  if (!appointmentId || appointmentId === 'undefined' || isNaN(parseInt(appointmentId))) {
    return res.status(400).json({ error: "ID de cita inválido o no proporcionado." });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM historiales_fisioterapia WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1',
      [appointmentId]
    );

    if (result.rows.length > 0) {
      let fila = result.rows[0];
      if (typeof fila.datos === 'string') {
        fila.datos = JSON.parse(fila.datos);
      }
      res.json(fila);
    } else {
      res.status(404).json({ error: "No se encontraron datos para esta cita." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getNutricionByPaciente(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_nutricion WHERE paciente_id = $1 ORDER BY fecha_creacion DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFisioterapiaByPaciente(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_fisioterapia WHERE paciente_id = $1 ORDER BY fecha_creacion DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GUARDADO DE HISTORIAL CLÍNICO (MASTER POST)
// Realiza tres acciones clave: Guarda datos, actualiza cita y registra métrica.
async function create(req, res) {
  let { paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id, duracion_carga, timestamp_inicio } = req.body;

  const tipoLimpio = tipo ? tipo.trim().toLowerCase() : 'medicos';
  let tablaDestino = 'historiales_medicos';

  if (tipoLimpio === 'nutricion') tablaDestino = 'historiales_nutricion';
  else if (tipoLimpio === 'fisioterapia') tablaDestino = 'historiales_fisioterapia';

  try {
    // Si el formulario nos envía el ID de la cita, le preguntamos a la base de datos a quién le pertenece.
    if (appointment_id) {
      const citaResult = await pool.query('SELECT paciente_id, paciente_nombre FROM citas WHERE id = $1', [appointment_id]);

      if (citaResult.rows.length > 0) {
        paciente_id = paciente_id || citaResult.rows[0].paciente_id;

        if (!paciente_nombre || paciente_nombre === "Paciente sin nombre") {
          paciente_nombre = citaResult.rows[0].paciente_nombre;
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO ${tablaDestino} (paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id, duracion_carga, timestamp_inicio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [paciente_id, paciente_nombre, tipoLimpio, JSON.stringify(datos), creado_por, creado_por_nombre, appointment_id, duracion_carga || 0, timestamp_inicio || null]
    );

    // ACTUALIZAR ESTADO DE LA CITA PARA QUE DESAPAREZCA DEL DASHBOARD
    if (appointment_id) {
      await pool.query("UPDATE citas SET estado = 'completada' WHERE id = $1", [appointment_id]);
    }

    // Registro de métrica para el dashboard de control del Master/Admin
    await pool.query(
      "INSERT INTO metricas (tipo_evento, area, valor_numerico, paciente_id) VALUES ($1, $2, $3, $4)",
      ['tiempo_consulta', tipoLimpio, duracion_carga || 0, paciente_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAll,
  verificarRecurrencia,
  updateGenerico,
  getNutricionDetalle,
  getFisioterapiaDetalle,
  getNutricionByPaciente,
  getFisioterapiaByPaciente,
  create
};
