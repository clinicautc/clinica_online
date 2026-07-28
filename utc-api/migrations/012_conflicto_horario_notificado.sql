-- Marca que una cita 'programada' quedó sin encajar en el horario de
-- atención tras un cambio (horarioAtencionService.js) y ya se le avisó al
-- paciente para que la reagende él mismo. Sirve para:
--   1. No reenviar el mismo correo en cada guardado de horario mientras
--      sigue sin resolverse (reconciliarCitasFuturas).
--   2. Si llega la fecha original sin que el paciente reagende, cancelarla
--      en vez de marcarla como inasistencia (scheduledTasks.js) — no fue
--      culpa del paciente, fue el sistema el que dejó de poder atenderla.

ALTER TABLE citas ADD COLUMN IF NOT EXISTS conflicto_horario_notificado boolean NOT NULL DEFAULT false;
