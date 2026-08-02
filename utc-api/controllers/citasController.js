const pool = require('../db');
const { asignarPracticante } = require('../services/asignacionService');
const notificationService = require('../services/notificationService');
const { getTipoConsulta, getDocumentosRequeridos } = require('../services/consultaConfig');
const { obtenerConsultorios, obtenerConfig, capacidadEnFecha } = require('../services/consultoriosService');

// Compara solo la parte de fecha (yyyy-MM-dd) en zona horaria de México —
// debe usar la misma zona que esCitaDeHoy/getFechaMexico; comparar contra la
// fecha UTC cruda marca como "pasada" una cita de HOY en México durante las
// primeras horas del día en UTC (madrugada en México sigue siendo el día anterior en UTC).
function esFechaPasada(fecha) {
  const fechaStr = new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const hoyStr = getFechaMexico();
  return fechaStr < hoyStr;
}

// Las citas solo pueden agendarse hasta 90 días naturales a futuro — mismo límite
// aplicado en el frontend (AppointmentForm.tsx), mantener ambos en sync.
const DIAS_MAXIMOS_ANTICIPACION = 90;

function esFechaMuyLejana(fecha) {
  const fechaStr = new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_MAXIMOS_ANTICIPACION);
  const limiteStr = limite.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  return fechaStr > limiteStr;
}

// dia_semana ISO (1=lunes…7=domingo), igual criterio que horarios_atencion
// y horarioAtencionService.js — se calcula en calendario local, no UTC.
function isoDow(fechaStr) {
  const [y, m, d] = String(fechaStr).split('T')[0].split('-').map(Number);
  const js = new Date(y, m - 1, d).getDay();
  return js === 0 ? 7 : js;
}

// Respaldo del lado del servidor al horario de atención configurado por el
// master (el frontend ya restringe qué horarios se pueden elegir en
// AppointmentForm.tsx, pero sin esto una cita fuera de rango — o un día
// cerrado — se podía guardar igual si esa validación de frontend fallaba o
// se saltaba). Devuelve un mensaje de error si la fecha/hora no es válida
// para el área, o null si sí lo es.
async function validarHorarioDisponible(area, fechaStr, hora) {
  const fechaSolo = String(fechaStr).split('T')[0];

  const cierre = await pool.query(
    'SELECT 1 FROM cierres_clinicos WHERE area = $1 AND fecha = $2',
    [area, fechaSolo]
  );
  if (cierre.rows.length > 0) {
    return 'La clínica no atiende ese día — está marcado como día cerrado.';
  }

  const regla = await pool.query(
    'SELECT hora_inicio, hora_fin, activo FROM horarios_atencion WHERE area = $1 AND dia_semana = $2',
    [area, isoDow(fechaSolo)]
  );
  if (regla.rows.length === 0 || !regla.rows[0].activo) {
    return 'La clínica no atiende ese día de la semana.';
  }

  const horaStr = String(hora).substring(0, 5);
  const hIni = regla.rows[0].hora_inicio.substring(0, 5);
  const hFin = regla.rows[0].hora_fin.substring(0, 5);
  if (horaStr < hIni || horaStr >= hFin) {
    return `Ese horario está fuera del horario de atención (${hIni}–${hFin}).`;
  }
  return null;
}

function getFechaMexico() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function getHoraMexico() {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function esCitaDeHoy(fechaCita) {
  const fechaStr = new Date(fechaCita).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  return fechaStr === getFechaMexico();
}

// Devuelve true si la hora de la cita + minutosGracia ya pasó en zona México.
function horaVencida(horaCita, minutosGracia = 0) {
  const horaActual = getHoraMexico();
  const [h, m] = horaCita.substring(0, 5).split(':').map(Number);
  const [hA, mA] = horaActual.split(':').map(Number);
  return hA * 60 + mA >= h * 60 + m + minutosGracia;
}

async function escribirAuditoria(citaId, estadoAnterior, estadoNuevo, usuario, motivo = null) {
  await pool.query(
    `INSERT INTO citas_auditoria
       (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      citaId,
      estadoAnterior,
      estadoNuevo,
      usuario?.id   ?? null,
      usuario?.nombre ?? null,
      usuario?.rol  ?? null,
      motivo
    ]
  );
}

// Verifica si el paciente ya tiene historial previo en el área (para determinar tipo de consulta).
async function esConsultaSubsecuente(pacienteId, area) {
  const tabla = area === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';
  const result = await pool.query(`SELECT COUNT(*) FROM ${tabla} WHERE paciente_id = $1`, [pacienteId]);
  return parseInt(result.rows[0].count) > 0;
}

// Devuelve los tipos de documentos que ya existen para una cita específica.
async function getDocumentosExistentes(appointmentId, area, tipoConsulta) {
  if (!tipoConsulta) return [];
  const docs = [];

  if (area === 'nutricion') {
    const hist = await pool.query(
      'SELECT id FROM historiales_nutricion WHERE appointment_id = $1 LIMIT 1',
      [appointmentId]
    );
    if (hist.rows.length > 0) {
      docs.push(tipoConsulta === 'primera' ? 'historia_clinica_nutricion' : 'seguimiento_nutricion');
    }
    if (tipoConsulta === 'primera') {
      const consent = await pool.query(
        'SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (consent.rows.length > 0) docs.push('consentimiento');
    }
  } else if (area === 'fisioterapia') {
    if (tipoConsulta === 'primera') {
      const hist = await pool.query(
        'SELECT id FROM historiales_fisioterapia WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (hist.rows.length > 0) docs.push('valoracion_inicial_fisioterapia');

      const consent = await pool.query(
        'SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (consent.rows.length > 0) docs.push('consentimiento');
    } else {
      const nota = await pool.query(
        'SELECT id FROM notas_evolucion WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (nota.rows.length > 0) docs.push('nota_evolutiva');
    }
  }

  return docs;
}

// Verifica si existe cualquier documento clínico para esta cita (sin importar el tipo).
// Se usa en noAsistio cuando tipo_consulta aún es null (cita nunca iniciada).
async function tieneAlgunDocumento(appointmentId) {
  const checks = await Promise.all([
    pool.query('SELECT id FROM historiales_nutricion     WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM historiales_fisioterapia  WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM notas_evolucion           WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
  ]);
  return checks.some(r => r.rows.length > 0);
}

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*,
         NULLIF((SELECT COUNT(*) FROM citas c2
                 WHERE c2.paciente_id = c.paciente_id
                   AND c2.tipo = c.tipo
                   AND c2.id <= c.id
                   AND c2.estado = 'completada'), 0) AS numero_consulta
       FROM citas c
       ORDER BY c.fecha DESC, c.hora DESC`
    );
    const citasEstandarizadas = result.rows.map(cita => ({
      ...cita,
      date: cita.fecha,
      time: cita.hora,
      status: cita.estado,
      numero_consulta: cita.numero_consulta ? parseInt(cita.numero_consulta, 10) : null
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
// Un horario solo cuenta como "ocupado" cuando ya tiene tantas citas como
// consultorios configurados para el área — con más de un consultorio,
// varias citas pueden compartir la misma hora (una por consultorio).
async function getDisponibilidad(req, res) {
  const { fecha, tipo } = req.query; // tipo = 'nutricion' o 'fisioterapia'

  if (!fecha || !tipo) {
    return res.status(400).json({ error: "Faltan parámetros de fecha o tipo" });
  }

  try {
    const area = tipo.toLowerCase();
    const consultorios = await obtenerConsultorios(area, fecha);
    const result = await pool.query(
      `SELECT hora, COUNT(*) AS cantidad
       FROM citas WHERE fecha = $1 AND tipo = $2 AND estado IN ('programada', 'en_atencion')
       GROUP BY hora`,
      [fecha, area]
    );

    const horasOcupadas = result.rows
      .filter(row => Number(row.cantidad) >= consultorios)
      .map(row => row.hora);

    res.json(horasOcupadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Devuelve los días del mes que tienen todos los slots posibles ocupados.
// El total de slots depende del horario de atención vigente de cada día de
// la semana (hora_fin - hora_inicio, en horas) — no es fijo, cambia por área
// y por día (ej. fisioterapia lunes solo tiene 2 slots, miércoles puede
// tener 16). Cada slot, a su vez, solo cuenta como lleno cuando alcanza la
// cantidad de consultorios configurada para el área.
async function getDiasCompletos(req, res) {
  const { mes, tipo } = req.query;
  if (!mes || !tipo) return res.status(400).json({ error: 'Faltan parámetros mes o tipo' });
  const area = tipo.toLowerCase();

  try {
    const consultoriosConfig = await obtenerConfig(area);

    const reglasRes = await pool.query(
      'SELECT dia_semana, hora_inicio, hora_fin, activo FROM horarios_atencion WHERE area = $1',
      [area]
    );
    const reglasPorDia = {};
    reglasRes.rows.forEach(r => { reglasPorDia[r.dia_semana] = r; });

    const citasRes = await pool.query(
      `SELECT fecha::date::text AS fecha, LEFT(hora::text, 5) AS hora, COUNT(*) AS cantidad
       FROM citas
       WHERE tipo = $1
         AND estado IN ('programada', 'en_atencion')
         AND TO_CHAR(fecha, 'YYYY-MM') = $2
       GROUP BY fecha::date, LEFT(hora::text, 5)`,
      [area, mes]
    );

    const porFecha = {};
    citasRes.rows.forEach(row => {
      (porFecha[row.fecha] ??= []).push(Number(row.cantidad));
    });

    const diasCompletos = Object.keys(porFecha)
      .filter(fecha => {
        const [y, m, d] = fecha.split('-').map(Number);
        const js = new Date(y, m - 1, d).getDay();
        const diaSemana = js === 0 ? 7 : js;
        const regla = reglasPorDia[diaSemana];
        if (!regla || !regla.activo) return false;

        const hIni = parseInt(regla.hora_inicio.substring(0, 2), 10);
        const hFin = parseInt(regla.hora_fin.substring(0, 2), 10);
        const totalSlots = hFin - hIni;
        if (totalSlots <= 0) return false;

        const capacidad = capacidadEnFecha(consultoriosConfig, fecha);
        const horasLlenas = porFecha[fecha].filter(cantidad => cantidad >= capacidad).length;
        return horasLlenas >= totalSlots;
      });

    res.json(diasCompletos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const { paciente_id, paciente_nombre, tipo, fecha, hora } = req.body;
  const area = tipo.toLowerCase();

  if (esFechaMuyLejana(fecha)) {
    return res.status(400).json({ error: `Las citas solo pueden agendarse con un máximo de ${DIAS_MAXIMOS_ANTICIPACION} días de anticipación.` });
  }

  const client = await pool.connect();
  try {
    const errorHorario = await validarHorarioDisponible(area, fecha, hora);
    if (errorHorario) {
      return res.status(400).json({ error: errorHorario });
    }

    await client.query('BEGIN');

    // Candado de cupo: pg_advisory_xact_lock serializa, a nivel de Postgres,
    // todas las peticiones que compitan por el mismo (area, fecha, hora) —
    // se libera solo al hacer COMMIT/ROLLBACK. Sin esto, el COUNT de abajo
    // (¿cuántos consultorios ya están ocupados?) es un SELECT-antes-de-INSERT
    // clásico: dos citas creadas casi al mismo tiempo pueden ver ambas "hay
    // cupo" antes de que cualquiera termine de insertar, colando más citas
    // de las que caben. Con el candado, la segunda petición espera a que la
    // primera termine su transacción y entonces sí ve el cupo real.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${area}|${fecha}|${hora}`]);

    const conflictoPaciente = await client.query(
      "SELECT tipo FROM citas WHERE paciente_id = $1 AND fecha = $2 AND hora = $3 AND estado IN ('programada', 'en_atencion')",
      [paciente_id, fecha, hora]
    );

    if (conflictoPaciente.rows.length > 0) {
      await client.query('ROLLBACK');
      const areaExistente = conflictoPaciente.rows[0].tipo;
      const areaFormateada = areaExistente === 'nutricion' ? 'Nutrición' : 'Fisioterapia';
      return res.status(409).json({ error: `Ya tienes una cita de ${areaFormateada} a esa hora. Selecciona un horario distinto.` });
    }

    // "Ocupado" ya no es "existe una cita" — el área puede tener varios
    // consultorios, cada uno cabe una cita simultánea en el mismo horario.
    const consultoriosArea = await obtenerConsultorios(area, fecha);
    const check = await client.query(
      "SELECT COUNT(*) FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'en_atencion')",
      [fecha, hora, area]
    );

    if (parseInt(check.rows[0].count, 10) >= consultoriosArea) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: "Este horario ya está lleno en esta área. Por favor elige otro." });
    }

    // Insertar la cita sin practicante todavía
    const inserted = await client.query(
      `INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado)
       VALUES ($1, $2, $3, $4, $5, 'programada') RETURNING *`,
      [paciente_id, paciente_nombre, area, fecha, hora]
    );
    const nuevaCita = inserted.rows[0];

    await client.query('COMMIT');

    // A partir de aquí el cupo y el candado ya cumplieron su función — la
    // cita ya existe y ya reservó su lugar. Lo que sigue usa el pool normal.

    // Asignación automática
    const { cita, asignado, esFallbackDocente } = await asignarPracticante(
      nuevaCita.id, area, fecha, hora
    );

    // Notificaciones informativas — se disparan sin bloquear la respuesta.
    // Si fallan, el error queda registrado en consola. La cita ya existe en BD.
    const pacienteResult = await pool.query(
      'SELECT email FROM usuarios WHERE id = $1', [paciente_id]
    );
    if (pacienteResult.rows.length > 0) {
      // Incluye el practicante en el correo del paciente si ya viene asignado
      notificationService.notificarCitaCreada(
        paciente_nombre, pacienteResult.rows[0].email, fecha, hora, area,
        asignado ? asignado.nombre : null
      );
    }

    if (asignado) {
      const practicanteResult = await pool.query(
        'SELECT email FROM usuarios WHERE id = $1', [cita.practicante_id]
      );
      if (practicanteResult.rows.length > 0) {
        notificationService.notificarAsignacionAutomatica(
          asignado.nombre, practicanteResult.rows[0].email, paciente_nombre, fecha, hora, area
        );
      }
    }

    res.status(201).json({ ...cita, asignado, esFallbackDocente });
  } catch (error) {
    // Si la transacción sigue abierta (falló entre el BEGIN y el COMMIT de
    // arriba), revertirla antes de responder — si ya se hizo COMMIT esto no
    // hace nada.
    await client.query('ROLLBACK').catch(() => {});

    // Respaldo a nivel de base de datos contra la validación de arriba (SELECT
    // + INSERT no es atómico: dos peticiones casi simultáneas, ej. el mismo
    // paciente en dos dispositivos, pueden pasar ambas el chequeo antes de que
    // cualquiera termine de insertar). El índice único
    // idx_citas_paciente_fecha_hora_activa (migración 017) rechaza la segunda
    // a nivel de Postgres con este código — lo traducimos al mismo mensaje
    // amigable en vez de un 500 genérico.
    if (error.code === '23505' && error.constraint === 'idx_citas_paciente_fecha_hora_activa') {
      return res.status(409).json({ error: 'Ya tienes una cita a esa hora. Selecciona un horario distinto.' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

// REAGENDAR O MODIFICAR CITA
async function update(req, res) {
  const { id } = req.params;
  const { fecha, hora, tipo, estado } = req.body;

  try {
    const citaActual = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);

    if (citaActual.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const original = citaActual.rows[0];

    // Usar los valores del body si vienen, si no mantener los de la cita original
    const nuevaFecha = fecha ?? new Date(original.fecha).toISOString().split('T')[0];
    const nuevaHora  = hora  ?? original.hora;
    const nuevoTipo  = tipo  ?? original.tipo;

    const fechaOriginalStr = new Date(original.fecha).toISOString().split('T')[0];
    const horaOriginalStr  = original.hora.substring(0, 5);
    const esReagendamiento = nuevaFecha !== fechaOriginalStr || nuevaHora.substring(0, 5) !== horaOriginalStr;

    if (esReagendamiento) {
      if (['completada', 'en_atencion', 'no_asistio'].includes(original.estado)) {
        return res.status(409).json({ error: "No se puede reagendar una cita en ese estado." });
      }
      if (esFechaPasada(original.fecha)) {
        return res.status(409).json({ error: "No se puede reagendar una cita de una fecha pasada." });
      }
      if (esFechaMuyLejana(nuevaFecha)) {
        return res.status(400).json({ error: `Las citas solo pueden agendarse con un máximo de ${DIAS_MAXIMOS_ANTICIPACION} días de anticipación.` });
      }

      const errorHorario = await validarHorarioDisponible(nuevoTipo.toLowerCase(), nuevaFecha, nuevaHora);
      if (errorHorario) {
        return res.status(400).json({ error: errorHorario });
      }

      // Solo verificar conflicto de horario cuando realmente cambia fecha u hora.
      // "Ocupado" ya no es "existe una cita" — puede haber varios consultorios.
      const consultoriosNuevoTipo = await obtenerConsultorios(nuevoTipo.toLowerCase(), nuevaFecha);
      const check = await pool.query(
        "SELECT COUNT(*) FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'en_atencion') AND id != $4",
        [nuevaFecha, nuevaHora, nuevoTipo.toLowerCase(), id]
      );
      if (parseInt(check.rows[0].count, 10) >= consultoriosNuevoTipo) {
        return res.status(409).json({ error: "Este horario ya está lleno. Elige otro." });
      }
    }

    // Si el paciente reagenda por su cuenta una cita que había quedado
    // marcada por un conflicto de horario de atención (ver
    // horarioAtencionService.js), se limpia la marca — ya se resolvió y no
    // debe seguir esperando el cierre automático por vencimiento.
    const result = await pool.query(
      esReagendamiento
        ? `UPDATE citas SET fecha = $1, hora = $2, estado = $3, conflicto_horario_notificado = false WHERE id = $4 RETURNING *`
        : `UPDATE citas SET fecha = $1, hora = $2, estado = $3 WHERE id = $4 RETURNING *`,
      [nuevaFecha, nuevaHora, estado ?? original.estado, id]
    );

    if (result.rows.length > 0) {
      if (esReagendamiento) {
        await pool.query(
          "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
          ['cita_reagendada', result.rows[0].tipo, result.rows[0].paciente_id, JSON.stringify({ nueva_fecha: nuevaFecha, nueva_hora: nuevaHora })]
        );
      }
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Cita no encontrada" });
    }
  } catch (error) {
    // Mismo respaldo que en create() — ver esa nota (índice
    // idx_citas_paciente_fecha_hora_activa, migración 017). Aquí cubre el
    // caso de reagendar dos citas casi al mismo tiempo hacia el mismo
    // horario, que ya quedaba ocupado por otra cita activa del paciente.
    if (error.code === '23505' && error.constraint === 'idx_citas_paciente_fecha_hora_activa') {
      return res.status(409).json({ error: 'Ya tienes una cita a esa hora. Selecciona un horario distinto.' });
    }
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const citaPrevia = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);
    if (citaPrevia.rowCount > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id, practicante_id) VALUES ($1, $2, $3, $4)",
        ['cita_cancelada', citaPrevia.rows[0].tipo, citaPrevia.rows[0].paciente_id, citaPrevia.rows[0].practicante_id]
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
    const citaActual = await pool.query("SELECT fecha, estado FROM citas WHERE id = $1", [id]);

    if (citaActual.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const original = citaActual.rows[0];

    if (['completada', 'en_atencion', 'no_asistio'].includes(original.estado)) {
      return res.status(409).json({ error: "No se puede asignar un practicante a una cita en ese estado." });
    }
    if (esFechaPasada(original.fecha)) {
      return res.status(409).json({ error: "No se puede asignar un practicante a una cita de una fecha pasada." });
    }

    const result = await pool.query(
      `UPDATE citas SET practicante_id = $1, practicante_nombre = $2, estado = 'programada', fecha_asignacion = NOW() WHERE id = $3 RETURNING *`,
      [practicante_id, practicante_nombre, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró la cita." });
    }
    const cita = result.rows[0];
    res.json(cita);

    // Notificaciones informativas — la cita ya se asignó, si el correo falla no
    // se revierte nada. Mismo par de correos (paciente + practicante) que se
    // manda en la reasignación automática por inasistencia (asistenciaController).
    if (practicante_id) {
      try {
        const [pacResult, pracResult] = await Promise.all([
          pool.query('SELECT email FROM usuarios WHERE id = $1', [cita.paciente_id]),
          pool.query('SELECT email FROM usuarios WHERE id = $1', [practicante_id]),
        ]);
        if (pacResult.rows.length > 0) {
          notificationService.notificarReasignacion(
            cita.paciente_nombre, pacResult.rows[0].email, cita.fecha, cita.hora, practicante_nombre, cita.tipo
          );
        }
        if (pracResult.rows.length > 0) {
          notificationService.notificarAsignacionAutomatica(
            practicante_nombre, pracResult.rows[0].email, cita.paciente_nombre, cita.fecha, cita.hora, cita.tipo
          );
        }
      } catch (notifErr) {
        console.error('[citas] Error al notificar asignación manual:', notifErr.message);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];
    const rol = req.user.rol;

    if (rol === 'paciente' && String(cita.paciente_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (rol === 'practicante' && String(cita.practicante_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (rol === 'admin' && cita.tipo !== req.user.area) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    let documentosExistentes = [];
    if (cita.tipo_consulta) {
      documentosExistentes = await getDocumentosExistentes(id, cita.tipo, cita.tipo_consulta);
    }
    const documentosRequeridos = cita.tipo_consulta
      ? getDocumentosRequeridos(cita.tipo, cita.tipo_consulta)
      : [];

    const numResult = await pool.query(
      `SELECT COUNT(*) AS numero_consulta FROM citas
       WHERE paciente_id = $1 AND tipo = $2 AND id <= $3 AND estado = 'completada'`,
      [cita.paciente_id, cita.tipo, id]
    );
    const numero_consulta = parseInt(numResult.rows[0].numero_consulta, 10);

    res.json({ ...cita, documentosExistentes, documentosRequeridos, numero_consulta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function iniciar(req, res) {
  const { id } = req.params;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante asignado puede iniciar la consulta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'Solo el practicante asignado puede iniciar la consulta.' });
    }

    const esProgramada  = cita.estado === 'programada';
    const esRecuperada  = cita.estado === 'recuperada';

    if (!esProgramada && !esRecuperada) {
      return res.status(409).json({ error: 'La cita no está en un estado que permita iniciarla.', estadoActual: cita.estado });
    }

    let tipoConsulta = cita.tipo_consulta;
    let updated;

    if (esProgramada) {
      if (!esCitaDeHoy(cita.fecha)) {
        return res.status(409).json({ error: 'Solo se pueden iniciar citas del día de hoy.' });
      }
      const horaActual = getHoraMexico();
      const horaActualHH = parseInt(horaActual.split(':')[0], 10);
      const citaHH = parseInt(cita.hora.substring(0, 2), 10);
      if (citaHH !== horaActualHH) {
        return res.status(409).json({
          error: `Solo puedes iniciar citas de la hora actual (${horaActual}). Esta cita es a las ${cita.hora.substring(0, 5)}.`
        });
      }

      const subsecuente = await esConsultaSubsecuente(cita.paciente_id, cita.tipo);
      tipoConsulta = getTipoConsulta(cita.tipo, subsecuente);

      updated = await pool.query(
        `UPDATE citas
            SET estado = 'en_atencion',
                tipo_consulta = $1,
                iniciada_en = NOW(),
                timer_expira_en = (fecha + hora) AT TIME ZONE 'America/Mexico_City' + INTERVAL '90 minutes'
          WHERE id = $2 AND estado = 'programada'
          RETURNING *`,
        [tipoConsulta, id]
      );

      if (updated.rows.length === 0) {
        return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
      }

      await escribirAuditoria(id, 'programada', 'en_atencion', usuario, null);

      if (subsecuente) {
        await pool.query(
          "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
          ['paciente_recurrente', cita.tipo, cita.paciente_id, JSON.stringify({ cita_id: id })]
        );
      }
    } else {
      // recuperada → en_atencion: el timer arranca desde ahora
      updated = await pool.query(
        `UPDATE citas
            SET estado = 'en_atencion',
                timer_expira_en = NOW() + INTERVAL '90 minutes'
          WHERE id = $1 AND estado = 'recuperada'
          RETURNING *`,
        [id]
      );

      if (updated.rows.length === 0) {
        return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
      }

      await escribirAuditoria(id, 'recuperada', 'en_atencion', usuario, null);
    }

    const documentosRequeridos = getDocumentosRequeridos(cita.tipo, tipoConsulta);
    res.json({ ...updated.rows[0], documentosRequeridos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function recuperar(req, res) {
  const { id } = req.params;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'Solo admin o master pueden recuperar una cita incompleta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (cita.estado !== 'incompleta') {
      return res.status(409).json({ error: 'Solo se puede recuperar una cita incompleta.', estadoActual: cita.estado });
    }

    const updated = await pool.query(
      `UPDATE citas SET estado = 'recuperada' WHERE id = $1 AND estado = 'incompleta' RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'incompleta', 'recuperada', usuario, null);

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function finalizar(req, res) {
  const { id } = req.params;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante asignado puede finalizar la consulta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'Solo el practicante asignado puede finalizar la consulta.' });
    }
    if (cita.estado !== 'en_atencion') {
      return res.status(409).json({ error: 'La cita no está en atención.', estadoActual: cita.estado });
    }

    // La validación de documentos solo aplica a la primera consulta.
    // Las consultas subsecuentes (nota evolutiva / seguimiento) no requieren esta verificación.
    if (cita.tipo_consulta === 'primera') {
      const documentosExistentes = await getDocumentosExistentes(id, cita.tipo, cita.tipo_consulta);
      const documentosRequeridos = getDocumentosRequeridos(cita.tipo, cita.tipo_consulta);
      const faltantes = documentosRequeridos.filter(d => !documentosExistentes.includes(d));

      if (faltantes.length > 0) {
        return res.status(422).json({
          error: 'Faltan documentos clínicos requeridos.',
          documentosFaltantes: faltantes,
          documentosExistentes
        });
      }
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'completada',
              finalizada_en = NOW(),
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = 'en_atencion'
        RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'en_atencion', 'completada', usuario, null);

    await pool.query(
      "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
      ['cita_completada', cita.tipo, cita.paciente_id, JSON.stringify({ cita_id: id, tipo_consulta: cita.tipo_consulta })]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function noAsistio(req, res) {
  const { id } = req.params;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['practicante', 'admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'No autorizado.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'practicante' && String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (!['programada', 'en_atencion'].includes(cita.estado)) {
      return res.status(409).json({ error: 'La cita no puede marcarse como no asistió en su estado actual.', estadoActual: cita.estado });
    }

    const tipoConsultaParaCheck = cita.tipo_consulta;
    let tieneDocumentos = false;
    if (tipoConsultaParaCheck) {
      const docs = await getDocumentosExistentes(id, cita.tipo, tipoConsultaParaCheck);
      tieneDocumentos = docs.length > 0;
    } else {
      tieneDocumentos = await tieneAlgunDocumento(id);
    }

    if (tieneDocumentos) {
      return res.status(422).json({ error: 'No se puede marcar como no asistió: existen documentos clínicos registrados para esta cita.' });
    }

    if (!horaVencida(cita.hora.substring(0, 5), 15)) {
      return res.status(422).json({ error: 'Todavía no han pasado 15 minutos desde la hora de la cita.' });
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'no_asistio',
              finalizada_en = NOW(),
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = ANY($2::text[])
        RETURNING *`,
      [id, ['programada', 'en_atencion']]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, cita.estado, 'no_asistio', usuario, 'Paciente no se presentó');

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function revertirAProgramada(req, res) {
  const { id } = req.params;
  const { motivo } = req.body;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'Solo admin o master pueden revertir una cita a programada.' });
  }
  if (!motivo || motivo.trim().length === 0) {
    return res.status(400).json({ error: 'Se requiere un motivo para revertir la cita.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (cita.estado !== 'en_atencion') {
      return res.status(409).json({ error: 'Solo se puede revertir una cita que esté en atención.', estadoActual: cita.estado });
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'programada',
              iniciada_en = NULL,
              tipo_consulta = NULL,
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = 'en_atencion'
        RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'en_atencion', 'programada', usuario, motivo.trim());

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function guardarBorrador(req, res) {
  const { id } = req.params;
  const { borrador } = req.body;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante puede guardar el borrador.' });
  }
  if (borrador === undefined || borrador === null) {
    return res.status(400).json({ error: 'Se requiere el campo borrador.' });
  }

  try {
    const result = await pool.query(
      `UPDATE citas
          SET borrador = $1,
              borrador_actualizado_en = NOW()
        WHERE id = $2 AND practicante_id = $3 AND estado = 'en_atencion'
        RETURNING id, borrador_actualizado_en`,
      [borrador, id, usuario.id]
    );

    if (result.rows.length === 0) {
      const check = await pool.query('SELECT estado, practicante_id FROM citas WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
      if (String(check.rows[0].practicante_id) !== String(usuario.id)) {
        return res.status(403).json({ error: 'No autorizado.' });
      }
      return res.status(409).json({ error: 'La cita ya no está en atención.', estadoActual: check.rows[0].estado });
    }

    res.json({ ok: true, borrador_actualizado_en: result.rows[0].borrador_actualizado_en });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAll, getByPaciente, getDisponibilidad, getDiasCompletos, create, update, remove, asignar,
  getById, iniciar, finalizar, noAsistio, revertirAProgramada, guardarBorrador, recuperar
};
