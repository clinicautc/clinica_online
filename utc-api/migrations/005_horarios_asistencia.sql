-- Migración 005: Horarios de prácticas y asistencia diaria

-- Horario semanal de cada practicante.
-- dia_semana: 1=Lunes … 7=Domingo (ISO 8601 ISODOW).
CREATE TABLE IF NOT EXISTS horarios_practicas (
  id           serial PRIMARY KEY,
  usuario_id   integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dia_semana   smallint NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio  time,
  hora_fin     time,
  activo       boolean NOT NULL DEFAULT false,
  UNIQUE (usuario_id, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_horarios_usuario ON horarios_practicas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia     ON horarios_practicas(dia_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_activo  ON horarios_practicas(activo) WHERE activo = true;

-- Asistencia diaria: un registro por practicante por fecha.
CREATE TABLE IF NOT EXISTS asistencia_practicantes (
  id             serial PRIMARY KEY,
  usuario_id     integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha          date NOT NULL,
  estado         varchar(10) NOT NULL CHECK (estado IN ('presente', 'ausente')),
  registrado_por integer REFERENCES usuarios(id),
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_asistencia_fecha   ON asistencia_practicantes(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencia_usuario ON asistencia_practicantes(usuario_id);
