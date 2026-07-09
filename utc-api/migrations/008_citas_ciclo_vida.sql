-- Migración 008: Ciclo de vida clínico completo
--
-- Introduce los estados en_atencion y no_asistio al flujo de citas,
-- añade soporte para borradores, tipo de consulta, auditoría de transiciones
-- y almacenamiento de consentimientos informados.
--
-- Cambios:
--   1. Nuevas columnas en citas (tipo_consulta, iniciada_en, finalizada_en,
--      borrador, borrador_actualizado_en)
--   2. Tabla citas_auditoria — registro inmutable de cada transición de estado
--   3. Tabla consentimientos_informados — con facade para migración futura
--      a proveedor externo (S3, Azure Blob, MinIO, etc.)
--   4. Actualización de índices parciales — se elimina 'confirmada' (estado en
--      desuso) y se agrega 'en_atencion' (ocupa horario igual que 'programada')

-- -----------------------------------------------------------------------------
-- 1. Nuevas columnas en citas
-- -----------------------------------------------------------------------------

ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS tipo_consulta            VARCHAR(20),
  ADD COLUMN IF NOT EXISTS iniciada_en              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalizada_en            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS borrador                 JSONB,
  ADD COLUMN IF NOT EXISTS borrador_actualizado_en  TIMESTAMPTZ;

-- tipo_consulta: 'primera' | 'subsecuente' — se congela al ejecutar PATCH /iniciar
-- borrador: JSON opaco del estado del formulario; nunca interpretado por el backend

-- -----------------------------------------------------------------------------
-- 2. Auditoría de transiciones de estado
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS citas_auditoria (
  id              SERIAL PRIMARY KEY,
  cita_id         INTEGER REFERENCES citas(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(30),
  estado_nuevo    VARCHAR(30) NOT NULL,
  usuario_id      INTEGER,
  usuario_nombre  VARCHAR(255),
  usuario_rol     VARCHAR(20),
  motivo          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- usuario_id es NULL cuando la transición la ejecuta el job automático.
-- motivo es obligatorio solo para revertir a programada (validado en controller).

CREATE INDEX IF NOT EXISTS idx_citas_auditoria_cita_id
  ON citas_auditoria(cita_id);

-- -----------------------------------------------------------------------------
-- 3. Consentimientos informados
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS consentimientos_informados (
  id               SERIAL PRIMARY KEY,
  paciente_id      INTEGER NOT NULL,
  area             VARCHAR(20) NOT NULL,
  appointment_id   INTEGER REFERENCES citas(id) ON DELETE SET NULL,
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'postgres',
  storage_key      VARCHAR(500),
  archivo          BYTEA,
  mime_type        VARCHAR(50),
  nombre_archivo   VARCHAR(255),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- storage_provider: 'postgres' (hoy) | 's3' | 'azure' | 'minio' (futuro)
-- Cuando storage_provider = 'postgres': el archivo vive en la columna bytea.
-- Cuando storage_provider != 'postgres': storage_key referencia el objeto
--   en el proveedor externo y la columna archivo queda NULL.
-- El controlador nunca accede a esta tabla directamente — usa consentimientoService.js.

CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente_area
  ON consentimientos_informados(paciente_id, area);

CREATE INDEX IF NOT EXISTS idx_consentimientos_appointment
  ON consentimientos_informados(appointment_id);

-- -----------------------------------------------------------------------------
-- 4. Actualizar índices parciales de citas
--
-- Los índices parciales no admiten ALTER — deben recrearse.
-- Cambio: 'confirmada' → 'en_atencion'
-- Una cita en consulta activa ocupa el horario del practicante igual que
-- una cita programada; debe incluirse en conflictos y conteos de carga.
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_citas_practicante_fecha;
CREATE INDEX idx_citas_practicante_fecha
  ON citas(practicante_id, fecha)
  WHERE estado IN ('programada', 'en_atencion');

DROP INDEX IF EXISTS idx_citas_practicante_fecha_hora;
CREATE INDEX idx_citas_practicante_fecha_hora
  ON citas(practicante_id, fecha, hora)
  WHERE estado IN ('programada', 'en_atencion');
