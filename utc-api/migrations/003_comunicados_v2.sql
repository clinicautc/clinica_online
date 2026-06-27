-- 003_comunicados_v2.sql
-- Fase 4: Comunicados v2
-- - destinatario_id (FK a usuarios.id) reemplaza destinatario_especifico (TEXT con email)
-- - respuestas_comunicados reemplaza la columna respuesta TEXT concatenada

-- 1. Nueva columna con FK estable
ALTER TABLE notas_universitarias
  ADD COLUMN IF NOT EXISTS destinatario_id INTEGER REFERENCES usuarios(id);

-- 2. Migrar datos existentes: email almacenado → id del usuario correspondiente
UPDATE notas_universitarias n
SET destinatario_id = u.id
FROM usuarios u
WHERE n.destinatario_especifico = u.email
  AND n.destinatario_especifico IS NOT NULL
  AND n.destinatario_id IS NULL;

-- 3. Tabla de respuestas individuales (reemplaza la columna respuesta TEXT)
CREATE TABLE IF NOT EXISTS respuestas_comunicados (
  id             SERIAL PRIMARY KEY,
  nota_id        INTEGER NOT NULL REFERENCES notas_universitarias(id) ON DELETE CASCADE,
  autor_id       INTEGER NOT NULL REFERENCES usuarios(id),
  contenido      TEXT    NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Nota: las columnas destinatario_especifico, creado_por_nombre, creado_por_email,
-- respuesta y fecha_respuesta se conservan por retrocompatibilidad y se pueden eliminar
-- en una migración futura una vez que ningún proceso activo las escriba.
