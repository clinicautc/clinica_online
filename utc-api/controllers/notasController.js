const pool = require('../db');

// OBTENER HOJA EVOLUTIVA POR ID DE CITA
// Recupera el JSON guardado para rellenar la vista del frontend.
async function getEvolucion(req, res) {
  const { id } = req.params; // El frontend envía el ID de la cita en la URL
  try {
    const result = await pool.query(
      'SELECT * FROM notas_evolucion WHERE appointment_id = $1 ORDER BY fecha_elaboracion DESC LIMIT 1',
      [id]
    );

    if (result.rows.length > 0) {
      let fila = result.rows[0];
      if (typeof fila.cuadro_evolucion === 'string') {
        fila.cuadro_evolucion = JSON.parse(fila.cuadro_evolucion);
      }
      res.json(fila);
    } else {
      // Devolvemos un objeto vacío para que el frontend no falle si es la primera vez
      res.status(200).json({ cuadro_evolucion: {} });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createEvolucion(req, res) {
  let { paciente_id, practicante_id, appointment_id, nombre_completo, numero_expediente, edad, fecha_elaboracion, cuadro_evolucion, area } = req.body;

  try {
    // CONVERSIÓN ESTRICTA A ENTEROS (integer) para evitar que PostgreSQL rechace textos ('15' -> 15)
    const apptIdInt = parseInt(appointment_id, 10) || null;
    const practIdInt = parseInt(practicante_id, 10) || null;
    let pacIdInt = parseInt(paciente_id, 10) || null;

    // AUTO-COMPLETADO DEL PACIENTE
    if (apptIdInt) {
      const citaResult = await pool.query('SELECT paciente_id, paciente_nombre FROM citas WHERE id = $1', [apptIdInt]);

      if (citaResult.rows.length > 0) {
        pacIdInt = parseInt(citaResult.rows[0].paciente_id, 10);

        if (!nombre_completo || nombre_completo === 'Sin nombre') {
          nombre_completo = citaResult.rows[0].paciente_nombre;
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO notas_evolucion (
        paciente_id, practicante_id, appointment_id, nombre_completo,
        numero_expediente, edad, fecha_elaboracion, cuadro_evolucion, area, fecha_creacion
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [
        pacIdInt,
        practIdInt,
        apptIdInt,
        nombre_completo,
        numero_expediente,
        parseInt(edad, 10) || 0,
        fecha_elaboracion,
        JSON.stringify(cuadro_evolucion || {}),
        area || 'nutricion'
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    // Si la consola arroja código 23503, es porque la cita (appointment_id) no existe en tu tabla 'citas'
    console.error("❌ Error BD notas-evolucion:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// ACTUALIZAR HOJA EVOLUTIVA (PUT) — evita duplicados actualizando el registro existente
async function updateEvolucion(req, res) {
  const { id } = req.params;
  const { cuadro_evolucion, fecha_elaboracion } = req.body;

  try {
    const result = await pool.query(
      `UPDATE notas_evolucion
       SET cuadro_evolucion = $1, fecha_elaboracion = $2
       WHERE id = $3 RETURNING *`,
      [JSON.stringify(cuadro_evolucion || {}), fecha_elaboracion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró la nota evolutiva a actualizar." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error BD notas-evolucion (PUT):", error.message);
    res.status(500).json({ error: error.message });
  }
}

async function getUniversitarias(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        n.*,
        u.rol AS creado_por_rol
      FROM notas_universitarias n
      LEFT JOIN usuarios u ON n.creado_por = u.id
      ORDER BY n.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUniversitaria(req, res) {
  const { titulo, contenido, creado_por, creado_por_nombre, destino, destinatario_especifico, creado_por_email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO notas_universitarias (titulo, contenido, categoria, creado_por, creado_por_nombre, fecha_creacion, destinatario_especifico, creado_por_email)
   VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) RETURNING *`,
      [titulo, contenido, destino, creado_por, creado_por_nombre, destinatario_especifico, creado_por_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function responderUniversitaria(req, res) {
  const { id } = req.params;
  const { respuesta } = req.body;

  try {
    const result = await pool.query(
      `UPDATE notas_universitarias
       SET respuesta = $1, fecha_respuesta = NOW()
       WHERE id = $2
       RETURNING *`,
      [respuesta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "La nota no existe." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT responder:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getEvolucion,
  createEvolucion,
  updateEvolucion,
  getUniversitarias,
  createUniversitaria,
  responderUniversitaria
};
