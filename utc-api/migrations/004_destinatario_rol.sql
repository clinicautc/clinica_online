-- 004_destinatario_rol.sql
-- Agrega destinatario_rol para que master pueda dirigir comunicados
-- a roles específicos (todos | admin | practicante) independientemente del área.

ALTER TABLE notas_universitarias
  ADD COLUMN IF NOT EXISTS destinatario_rol VARCHAR(20) DEFAULT 'todos';
