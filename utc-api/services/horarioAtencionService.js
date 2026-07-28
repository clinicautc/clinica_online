const pool = require('../db');
const notificationService = require('./notificationService');
const { obtenerConfig, capacidadEnFecha } = require('./consultoriosService');

// Máximo de días hacia adelante en los que se busca un hueco de reemplazo —
// mismo horizonte que el límite de anticipación para agendar (ver
// citasController.js DIAS_MAXIMOS_ANTICIPACION).
const MAX_DIAS_BUSQUEDA = 90;

function isoDow(y, m, d) {
  // JS: 0=domingo…6=sábado. ISO (igual que horarios_atencion): 1=lunes…7=domingo.
  const js = new Date(y, m - 1, d).getDay();
  return js === 0 ? 7 : js;
}

function sumarDias(y, m, d, n) {
  const fecha = new Date(y, m - 1, d + n);
  return {
    y: fecha.getFullYear(),
    m: fecha.getMonth() + 1,
    d: fecha.getDate(),
    str: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
  };
}

async function obtenerReglasArea(area) {
  const { rows } = await pool.query(
    'SELECT dia_semana, hora_inicio, hora_fin, activo FROM horarios_atencion WHERE area = $1',
    [area]
  );
  const porDia = {};
  rows.forEach(r => { porDia[r.dia_semana] = r; });
  return porDia;
}

async function obtenerCierres(area) {
  const { rows } = await pool.query(
    "SELECT fecha FROM cierres_clinicos WHERE area = $1 AND fecha >= CURRENT_DATE",
    [area]
  );
  return new Set(rows.map(r => new Date(r.fecha).toISOString().split('T')[0]));
}

function horaValida(hora, regla) {
  if (!regla || !regla.activo) return false;
  const h = hora.substring(0, 5);
  return h >= regla.hora_inicio.substring(0, 5) && h < regla.hora_fin.substring(0, 5);
}

/**
 * Revisa las citas futuras 'programada' de un área contra el horario de
 * atención y los cierres vigentes. Las que ya no encajan se mueven al día
 * más próximo (misma hora) donde sí encajen y esté libre, y se notifica al
 * paciente. Las citas de hoy no se tocan (regla explícita del negocio).
 * Devuelve cuántas citas se reagendaron.
 */
async function reconciliarCitasFuturas(area, usuarioId) {
  const reglas = await obtenerReglasArea(area);
  const cierres = await obtenerCierres(area);
  const consultoriosConfig = await obtenerConfig(area);
  const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const { rows: citas } = await pool.query(
    `SELECT id, paciente_id, paciente_nombre, hora, fecha, conflicto_horario_notificado
     FROM citas
     WHERE tipo = $1 AND estado = 'programada' AND fecha > $2`,
    [area, hoyStr]
  );

  let reagendadas = 0;

  for (const cita of citas) {
    const fechaObj = new Date(cita.fecha);
    const y = fechaObj.getUTCFullYear(), m = fechaObj.getUTCMonth() + 1, d = fechaObj.getUTCDate();
    const fechaStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = isoDow(y, m, d);
    const regla = reglas[dow];

    const sigueSiendoValida = !cierres.has(fechaStr) && horaValida(cita.hora, regla);
    if (sigueSiendoValida) {
      // Se había marcado por un conflicto anterior y el horario se reabrió
      // antes de que el paciente actuara — ya no está en conflicto, así que
      // se limpia la marca. Si no se hiciera esto, un conflicto nuevo y
      // distinto más adelante se saltaría el aviso pensando que ya se había
      // notificado.
      if (cita.conflicto_horario_notificado) {
        await pool.query('UPDATE citas SET conflicto_horario_notificado = false WHERE id = $1', [cita.id]);
      }
      continue;
    }

    let candidata = null;
    for (let i = 1; i <= MAX_DIAS_BUSQUEDA; i++) {
      const cand = sumarDias(y, m, d, i);
      if (cierres.has(cand.str)) continue;
      const candDow = isoDow(cand.y, cand.m, cand.d);
      if (!horaValida(cita.hora, reglas[candDow])) continue;

      // "Ocupado" es alcanzar la capacidad de consultorios del área, no que
      // exista una sola cita — con varios consultorios el hueco puede seguir
      // libre aunque ya haya alguna cita a esa hora.
      const ocupado = await pool.query(
        `SELECT COUNT(*) FROM citas
         WHERE fecha = $1 AND hora = $2 AND tipo = $3
           AND estado IN ('programada', 'en_atencion') AND id != $4`,
        [cand.str, cita.hora, area, cita.id]
      );
      if (parseInt(ocupado.rows[0].count, 10) >= capacidadEnFecha(consultoriosConfig, cand.str)) continue;

      candidata = cand.str;
      break;
    }

    if (!candidata) {
      // Ya se había avisado de este mismo conflicto en una reconciliación
      // anterior y sigue sin resolverse — no repetir el correo ni el
      // registro de auditoría en cada guardado de horario. El paciente
      // sigue pudiendo reagendarla él mismo; si llega la fecha sin que lo
      // haga, scheduledTasks.js la cancela (no la marca como inasistencia).
      if (cita.conflicto_horario_notificado) continue;

      console.warn(`[horario-atencion] No se encontró fecha de reemplazo dentro de ${MAX_DIAS_BUSQUEDA} días para la cita #${cita.id}; se deja sin tocar, se notifica al paciente para que reagende manualmente.`);

      await pool.query('UPDATE citas SET conflicto_horario_notificado = true WHERE id = $1', [cita.id]);

      await pool.query(
        `INSERT INTO citas_auditoria (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
         VALUES ($1, 'programada', 'programada', $2, NULL, 'master', $3)`,
        [cita.id, usuarioId || null, `Ya no encaja en el nuevo horario de atención de ${area} y no se encontró hueco automático dentro de ${MAX_DIAS_BUSQUEDA} días — requiere que el paciente reagende o cancele manualmente.`]
      );

      try {
        const { rows: pacRows } = await pool.query('SELECT email FROM usuarios WHERE id = $1', [cita.paciente_id]);
        if (pacRows.length > 0) {
          notificationService.notificarConflictoHorarioOperacion(
            cita.paciente_nombre, pacRows[0].email, fechaStr, cita.hora, area
          );
        }
      } catch (notifErr) {
        console.error('[horario-atencion] Error al notificar conflicto sin solución automática:', notifErr.message);
      }

      continue;
    }

    // Si venía marcada de un conflicto previo y ahora sí se le encontró
    // hueco, se limpia la marca: si vuelve a romperse más adelante por otro
    // cambio de horario, debe poder notificarse de nuevo.
    await pool.query(
      'UPDATE citas SET fecha = $1, conflicto_horario_notificado = false WHERE id = $2',
      [candidata, cita.id]
    );

    await pool.query(
      `INSERT INTO citas_auditoria (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
       VALUES ($1, 'programada', 'programada', $2, NULL, 'master',
               $3)`,
      [cita.id, usuarioId || null, `Reagendada automáticamente de ${fechaStr} a ${candidata} (mismo horario) por cambio en el horario de atención de ${area}.`]
    );

    reagendadas++;

    try {
      const { rows: pacRows } = await pool.query('SELECT email FROM usuarios WHERE id = $1', [cita.paciente_id]);
      if (pacRows.length > 0) {
        notificationService.notificarCambioHorarioOperacion(
          cita.paciente_nombre, pacRows[0].email, fechaStr, candidata, cita.hora, area
        );
      }
    } catch (notifErr) {
      console.error('[horario-atencion] Error al notificar cambio de horario:', notifErr.message);
    }
  }

  if (reagendadas > 0) {
    console.log(`[horario-atencion] ${reagendadas} cita(s) reagendada(s) automáticamente por cambio de horario en ${area}.`);
  }

  return reagendadas;
}

module.exports = { reconciliarCitasFuturas };
