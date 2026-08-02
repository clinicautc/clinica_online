-- Impide, a nivel de base de datos, que un mismo paciente tenga dos citas
-- activas (programada o en_atencion) el mismo día y hora. Cierra una
-- condición de carrera real explotada en producción: dos peticiones desde
-- dispositivos distintos, disparadas casi al mismo tiempo, pasaban ambas la
-- validación en JavaScript (SELECT) antes de que cualquiera de las dos
-- terminara su INSERT. Un índice único parcial es atómico a nivel de
-- Postgres — la segunda inserción/actualización que choque revienta con
-- error 23505 (unique_violation), sin importar qué tan simultáneas sean las
-- peticiones. Protege tanto la creación de citas (INSERT) como el
-- reagendamiento (UPDATE), sin requerir ningún cambio adicional de código
-- en ese segundo flujo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_paciente_fecha_hora_activa
ON citas (paciente_id, fecha, hora)
WHERE estado IN ('programada', 'en_atencion');
