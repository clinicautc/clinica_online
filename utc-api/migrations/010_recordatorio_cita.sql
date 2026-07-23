-- Recordatorio automático de cita (24h antes, solo al paciente).
-- Flag para que la tarea programada (scheduledTasks.js, corre cada minuto) no
-- reenvíe el correo en cada tick una vez que ya se mandó para una cita dada.

ALTER TABLE citas ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean NOT NULL DEFAULT false;
