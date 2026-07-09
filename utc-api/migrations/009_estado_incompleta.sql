-- Migración 009: Estados incompleta y recuperada + timer de consulta
--
-- Introduce dos nuevos estados al ciclo de vida de las citas:
--   incompleta  — la cita estuvo en atención pero el practicante no la finalizó
--                 antes de que venciera el timer de 90 minutos.
--   recuperada  — un admin/master habilitó la cita incompleta para que el
--                 practicante tenga la oportunidad de terminar el expediente.
--
-- La transición recuperada → en_atencion la ejecuta el practicante al abrir
-- el workspace (misma ruta PATCH /citas/:id/iniciar, que ahora acepta ambos
-- estados de origen).
--
-- Cambios:
--   1. Nueva columna timer_expira_en TIMESTAMPTZ
--   2. Índices parciales actualizados para incluir 'recuperada'

-- -----------------------------------------------------------------------------
-- 1. Columna timer_expira_en
-- -----------------------------------------------------------------------------

ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS timer_expira_en TIMESTAMPTZ;

-- timer_expira_en se establece en PATCH /iniciar:
--   programada  → en_atencion: (fecha + hora) AT TIME ZONE 'America/Mexico_City' + 90 min
--   recuperada  → en_atencion: NOW() + 90 min
-- El job de cierre automático usa: timer_expira_en < NOW() → incompleta

-- -----------------------------------------------------------------------------
-- 2. Actualizar índices parciales de citas
--
-- 'recuperada' ocupa el slot del practicante igual que 'programada':
-- debe incluirse en los índices para evitar doble-asignación y conteos incorrectos.
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_citas_practicante_fecha;
CREATE INDEX idx_citas_practicante_fecha
  ON citas(practicante_id, fecha)
  WHERE estado IN ('programada', 'en_atencion', 'recuperada');

DROP INDEX IF EXISTS idx_citas_practicante_fecha_hora;
CREATE INDEX idx_citas_practicante_fecha_hora
  ON citas(practicante_id, fecha, hora)
  WHERE estado IN ('programada', 'en_atencion', 'recuperada');
