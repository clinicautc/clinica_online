-- Migración 014: permite diferir una REDUCCIÓN de consultorios a una fecha
-- futura cuando ya hay citas agendadas que ocupan más consultorios de los
-- que se quieren dejar. Mientras cantidad_pendiente/vigente_desde estén
-- llenos, la capacidad real de un día es "cantidad" si el día es anterior a
-- vigente_desde, o "cantidad_pendiente" si es igual o posterior — el cron de
-- scheduledTasks.js promueve cantidad_pendiente -> cantidad y limpia estos
-- campos en cuanto vigente_desde llega.
ALTER TABLE consultorios_config ADD COLUMN IF NOT EXISTS cantidad_pendiente smallint CHECK (cantidad_pendiente BETWEEN 1 AND 10);
ALTER TABLE consultorios_config ADD COLUMN IF NOT EXISTS vigente_desde date;
