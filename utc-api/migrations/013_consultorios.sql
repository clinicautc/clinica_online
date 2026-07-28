-- Migración 013: Cantidad de consultorios por área.
--
-- Hasta ahora toda la clínica se trataba como un solo consultorio: solo se
-- podía agendar UNA cita por hora por área. Esta tabla permite al master
-- configurar hasta 10 consultorios por área, permitiendo esa misma cantidad
-- de citas simultáneas en el mismo horario (cada una atendida por un
-- practicante distinto). Por defecto 1, igual al comportamiento anterior.
CREATE TABLE IF NOT EXISTS consultorios_config (
  area     varchar(20) PRIMARY KEY CHECK (area IN ('nutricion', 'fisioterapia')),
  cantidad smallint NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 10)
);

INSERT INTO consultorios_config (area, cantidad)
VALUES ('nutricion', 1), ('fisioterapia', 1)
ON CONFLICT (area) DO NOTHING;
