-- Igual que la migración 017 pero para el practicante en vez del paciente:
-- impide que un mismo practicante quede asignado a dos citas activas
-- (programada o en_atencion) a la misma fecha y hora. Cierra la condición
-- de carrera real de asignacionService.js (_buscarPracticante seguido de
-- _guardarAsignacion no es atómico): dos citas creadas casi al mismo
-- tiempo para el mismo horario pueden ver ambas al mismo practicante como
-- "disponible" antes de que cualquiera de las dos termine de asignarlo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_practicante_fecha_hora_activa
ON citas (practicante_id, fecha, hora)
WHERE estado IN ('programada', 'en_atencion') AND practicante_id IS NOT NULL;
