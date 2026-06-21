const pool = require('../db');

async function create(req, res) {
  const { paciente_id, paciente_nombre, contenido, area } = req.body;
  // creado_por_id/nombre se toman del usuario autenticado, nunca del body, para que nadie pueda adjudicarse otra autoría.
  const creado_por_id = req.user.id;
  const creado_por_nombre = req.user.nombre;

  try {
    const result = await pool.query(
      `INSERT INTO recomendaciones_nutricion
      (paciente_id, paciente_nombre, contenido, creado_por_id, creado_por_nombre, area)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, paciente_nombre, contenido, creado_por_id, creado_por_nombre, area]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar en recomendaciones_nutricion:", error.message);
    res.status(500).json({ error: error.message });
  }
}

async function getByPaciente(req, res) {
  const { id } = req.params;
  const { area } = req.query;

  if (req.user.rol === 'paciente' && String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No puedes ver las recomendaciones de otro paciente.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM recomendaciones_nutricion WHERE paciente_id = $1 AND area = $2 ORDER BY fecha_creacion DESC',
      [id, area]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener de recomendaciones_nutricion:", error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { create, getByPaciente };
