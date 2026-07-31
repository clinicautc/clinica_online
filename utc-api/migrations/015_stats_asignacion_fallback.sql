-- Migración 015: soporte para el módulo de Métricas/Inteligencia Clínica
--
-- Contexto: auditoría 2026-07-29 encontró que el panel de estadísticas dependía
-- de un modelo de estados de citas anterior a la migración 008, y de dos KPIs
-- (tasaAbandono, velocidadAsignacionDocente) que nunca existieron en el backend.
--
-- Esta migración no toca ningún dato existente — solo agrega:
--   1. Un índice sobre metricas.tipo_evento (hoy sin índice; cada consulta de
--      cancelaciones/reagendados era table scan completo).
--   2. Una columna en citas para persistir si la asignación automática de
--      practicante requirió fallback a un docente — ese dato ya se calculaba
--      en asignacionService.js (esFallbackDocente) pero nunca se guardaba,
--      así que el reemplazo del KPI "Respuesta Docente" no tenía de dónde salir.
--
-- Nota: metricas.fecha_registro ya existía (verificado con information_schema
-- antes de escribir esta migración) — no hace falta agregar columna de fecha.

CREATE INDEX IF NOT EXISTS idx_metricas_tipo_evento
  ON metricas(tipo_evento);

ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS asignacion_fallback BOOLEAN NOT NULL DEFAULT false;
