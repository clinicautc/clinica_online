-- Fase: evolución de "Autorizar Practicantes" a "Gestión de Personal"
-- Nueva columna para identificar al docente por su número de empleado,
-- análoga a "matricula" para practicantes. Nullable: cada usuario solo
-- llena una de las dos columnas según su rol (practicante -> matricula,
-- admin/docente -> numero_empleado).

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero_empleado varchar(20);
