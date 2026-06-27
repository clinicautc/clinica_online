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
  const { id: userId, rol, area } = req.user;

  // Construye el WHERE según el rol del usuario autenticado.
  // Replica exactamente la lógica de filteredNotes en NotesViewer.tsx:
  //   master      → todo sin filtro
  //   admin       → mensajes de master + su área + generales + privados para él
  //   practicante → igual que admin pero bloqueando mensajes de master
  let whereClause = '';
  let params = [];

  if (rol === 'master') {
    // Sin restricción — ve todo el sistema
  } else if (rol === 'admin') {
    // Privadas para él + notas que él creó + públicas de su área dirigidas a admin.
    // n.destinatario_id IS NULL garantiza que notas privadas a otro usuario no se filtren.
    whereClause = `
      WHERE (
        n.destinatario_id = $1
        OR n.creado_por = $1
        OR (
          n.destinatario_id IS NULL
          AND (n.categoria IN ('todos', 'general') OR n.categoria = $2)
          AND COALESCE(n.destinatario_rol, 'todos') IN ('todos', 'admin')
        )
      )
    `;
    params = [userId, area];
  } else if (rol === 'practicante') {
    // Privadas para él + públicas de su área dirigidas a practicante o todos.
    // Sin bloqueo por creador: master puede dirigirse a practicantes explícitamente.
    whereClause = `
      WHERE (
        n.destinatario_id = $1
        OR (
          n.destinatario_id IS NULL
          AND (n.categoria IN ('todos', 'general') OR n.categoria = $2)
          AND COALESCE(n.destinatario_rol, 'todos') IN ('todos', 'practicante')
        )
      )
    `;
    params = [userId, area];
  } else {
    return res.json([]);
  }

  try {
    const notasResult = await pool.query(`
      SELECT
        n.id,
        n.titulo,
        n.contenido,
        n.categoria,
        n.destinatario_rol,
        n.fecha_creacion,
        n.creado_por,
        n.destinatario_id,
        u_creador.nombre  AS creado_por_nombre,
        u_creador.rol     AS creado_por_rol,
        u_creador.area    AS creado_por_area,
        u_dest.nombre     AS destinatario_nombre
      FROM notas_universitarias n
      LEFT JOIN usuarios u_creador ON n.creado_por    = u_creador.id
      LEFT JOIN usuarios u_dest    ON n.destinatario_id = u_dest.id
      ${whereClause}
      ORDER BY n.fecha_creacion DESC
    `, params);

    const respuestasResult = await pool.query(`
      SELECT
        r.id,
        r.nota_id,
        r.autor_id,
        r.contenido,
        r.fecha_creacion,
        u.nombre AS autor_nombre,
        u.area   AS autor_area,
        u.rol    AS autor_rol
      FROM respuestas_comunicados r
      JOIN usuarios u ON r.autor_id = u.id
      WHERE r.nota_id = ANY($1::int[])
      ORDER BY r.fecha_creacion ASC
    `, [notasResult.rows.map(n => n.id)]);

    const respuestasPorNota = {};
    for (const r of respuestasResult.rows) {
      if (!respuestasPorNota[r.nota_id]) respuestasPorNota[r.nota_id] = [];
      respuestasPorNota[r.nota_id].push(r);
    }

    const notas = notasResult.rows.map(n => ({
      ...n,
      respuestas: respuestasPorNota[n.id] || []
    }));

    res.json(notas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUniversitaria(req, res) {
  const { titulo, contenido, destino, destinatario_id, destinatario_rol } = req.body;
  const { id: creado_por, nombre: creado_por_nombre, email: creado_por_email, rol, area } = req.user;

  // Practicantes solo pueden publicar en su propia área
  if (rol === 'practicante' && destino && destino !== area) {
    return res.status(403).json({ error: 'Solo puedes enviar comunicados a tu propia área.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notas_universitarias
         (titulo, contenido, categoria, creado_por, creado_por_nombre, creado_por_email, fecha_creacion, destinatario_id, destinatario_rol)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
       RETURNING *`,
      [titulo, contenido, destino, creado_por, creado_por_nombre, creado_por_email, destinatario_id || null, destinatario_rol || 'todos']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function responderUniversitaria(req, res) {
  const { id }     = req.params;
  const { contenido } = req.body;
  const autor_id   = req.user.id;

  if (!contenido || contenido.trim().length < 2) {
    return res.status(400).json({ error: 'El contenido es demasiado breve.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO respuestas_comunicados (nota_id, autor_id, contenido, fecha_creacion)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, autor_id, contenido.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en responderUniversitaria:', error);
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
