-- Migración 007: Eliminar tabla legacy practicantes_autorizados
--
-- Esta tabla nunca fue fuente de verdad del sistema actual.
-- El estado de practicantes vive en usuarios.status (gestionado por
-- PUT /api/usuarios/:id). La tabla se conservó por retrocompatibilidad
-- pero ningún endpoint activo la lee ni la escribe.

DROP TABLE IF EXISTS practicantes_autorizados;
