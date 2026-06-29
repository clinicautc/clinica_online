-- Migración 006: Índices para asignación automática de citas
--
-- Estas consultas se ejecutan en cada creación de cita y en cada reasignación
-- por ausencia. Los índices reducen el costo de las subconsultas de conteo
-- y detección de conflictos.

-- Contar citas por practicante en un día (estrategia: menor carga)
CREATE INDEX IF NOT EXISTS idx_citas_practicante_fecha
  ON citas(practicante_id, fecha)
  WHERE estado IN ('programada', 'confirmada');

-- Detectar conflicto exacto de horario (practicante + fecha + hora)
CREATE INDEX IF NOT EXISTS idx_citas_practicante_fecha_hora
  ON citas(practicante_id, fecha, hora)
  WHERE estado IN ('programada', 'confirmada');

-- Buscar última asignación por practicante (round-robin en empate)
CREATE INDEX IF NOT EXISTS idx_citas_fecha_asignacion
  ON citas(practicante_id, fecha_asignacion);

-- Nota: el valor 'pendiente_reprogramacion' es ahora un estado válido para
-- la columna citas.estado. La columna no tiene CHECK constraint, por lo que
-- no se requiere ALTER TABLE.
