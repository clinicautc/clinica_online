const pool = require('../db');

async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC');
    const citasEstandarizadas = result.rows.map(cita => ({
      ...cita,
      date: cita.fecha,
      time: cita.hora,
      status: cita.estado
    }));
    res.json(citasEstandarizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// OBTENER CITAS POR PACIENTE
// Se eliminó el filtro de CURRENT_DATE para que el paciente pueda visualizar sus registros previos y actuales.
async function getByPaciente(req, res) {
  const { id } = req.params;

  if (req.user.rol === 'paciente' && String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No puedes ver las citas de otro paciente.' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha DESC, hora DESC`, // Más recientes primero
      [id]
    );

    const citasSincronizadas = result.rows.map(cita => ({
      ...cita,
      tipo: cita.tipo,
      estado: cita.estado
    }));

    res.json(citasSincronizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// OBTENER DISPONIBILIDAD DE HORARIOS (BLOQUEO POR ÁREA)
async function getDisponibilidad(req, res) {
  const { fecha, tipo } = req.query; // tipo = 'nutricion' o 'fisioterapia'

  if (!fecha || !tipo) {
    return res.status(400).json({ error: "Faltan parámetros de fecha o tipo" });
  }

  try {
    const result = await pool.query(
      `SELECT hora FROM citas WHERE fecha = $1 AND tipo = $2 AND estado IN ('programada', 'confirmada')`,
      [fecha, tipo.toLowerCase()]
    );

    const horasOcupadas = result.rows.map(row => row.hora);

    res.json(horasOcupadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const { paciente_id, paciente_nombre, tipo, fecha, hora, estado } = req.body;

  try {
    const check = await pool.query(
      "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'confirmada')",
      [fecha, hora, tipo.toLowerCase()]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Este horario ya fue ocupado en esta área. Por favor elige otro." });
    }

    const result = await pool.query(
      'INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, fecha, hora, estado || 'programada']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// REAGENDAR O MODIFICAR CITA
async function update(req, res) {
  const { id } = req.params;
  const { fecha, hora, tipo, estado } = req.body;

  try {
    // Ignoramos la cita actual (id != $4) para que el paciente pueda conservar su misma hora si lo desea
    const check = await pool.query(
      "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'confirmada') AND id != $4",
      [fecha, hora, tipo.toLowerCase(), id]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Este horario ya está ocupado. Elige otro." });
    }

    const result = await pool.query(
      `UPDATE citas SET fecha = $1, hora = $2, estado = $3 WHERE id = $4 RETURNING *`,
      [fecha, hora, estado || 'programada', id]
    );

    if (result.rows.length > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
        ['cita_reagendada', result.rows[0].tipo, result.rows[0].paciente_id, JSON.stringify({ nueva_fecha: fecha, nueva_hora: hora })]
      );
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Cita no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const citaPrevia = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);
    if (citaPrevia.rowCount > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id) VALUES ($1, $2, $3)",
        ['cita_cancelada', citaPrevia.rows[0].tipo, citaPrevia.rows[0].paciente_id]
      );
    }
    const result = await pool.query('DELETE FROM citas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount > 0) {
      res.json({ message: "Cita eliminada correctamente" });
    } else {
      res.status(404).json({ error: "No se encontró la cita" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function asignar(req, res) {
  const { id } = req.params;
  const { practicante_id, practicante_nombre } = req.body;

  try {
    const result = await pool.query(
      `UPDATE citas SET practicante_id = $1, practicante_nombre = $2, estado = 'programada', fecha_asignacion = NOW() WHERE id = $3 RETURNING *`,
      [practicante_id, practicante_nombre, id]
    );
    res.json(result.rows.length > 0 ? result.rows[0] : res.status(404).json({ error: "No se encontró la cita." }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAll, getByPaciente, getDisponibilidad, create, update, remove, asignar };
