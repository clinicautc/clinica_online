-- Migración 011: Horario de atención de la clínica (configurable por el Master,
-- por separado para cada área) y cierres de días completos.
--
-- horarios_atencion: rango de horas por día de la semana en el que el
-- calendario del paciente permite seleccionar cita, por área. Es el techo
-- dentro del cual además debe caber el horario individual de cada
-- practicante (horarios_practicas) — se valida en el backend, no aquí.
-- dia_semana: 1=Lunes … 7=Domingo (ISO 8601 ISODOW, mismo criterio que
-- horarios_practicas de la migración 005).
CREATE TABLE IF NOT EXISTS horarios_atencion (
  id           serial PRIMARY KEY,
  area         varchar(20) NOT NULL CHECK (area IN ('nutricion', 'fisioterapia')),
  dia_semana   smallint NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio  time NOT NULL DEFAULT '08:00',
  hora_fin     time NOT NULL DEFAULT '24:00',
  activo       boolean NOT NULL DEFAULT false,
  UNIQUE (area, dia_semana)
);

-- Estado por defecto: igual al comportamiento fijo que tenía el sistema antes
-- de esta migración (lunes a viernes 08:00–24:00 habilitado, fin de semana
-- deshabilitado), para las dos áreas. El master lo edita desde su panel.
INSERT INTO horarios_atencion (area, dia_semana, hora_inicio, hora_fin, activo)
SELECT area, dia_semana, '08:00', '24:00', (dia_semana BETWEEN 1 AND 5)
FROM (VALUES ('nutricion'), ('fisioterapia')) AS a(area)
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6),(7)) AS d(dia_semana)
ON CONFLICT (area, dia_semana) DO NOTHING;

-- cierres_clinicos: días completos deshabilitados para una fecha puntual
-- (ej. día festivo), independiente del horario_atencion recurrente.
CREATE TABLE IF NOT EXISTS cierres_clinicos (
  id           serial PRIMARY KEY,
  area         varchar(20) NOT NULL CHECK (area IN ('nutricion', 'fisioterapia')),
  fecha        date NOT NULL,
  motivo       varchar(200),
  creado_por   integer REFERENCES usuarios(id),
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (area, fecha)
);

CREATE INDEX IF NOT EXISTS idx_cierres_clinicos_fecha ON cierres_clinicos(fecha);
