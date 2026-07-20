/**
 * Clasificación de los campos de Seguimiento Nutricional según su eje.
 *
 * El documento tiene dos tipos de "1 a 6" que NO deben confundirse:
 *  - Eje de CONSULTA: el número final del nombre de campo coincide con la
 *    columna (o fila, en las 2 tablas de página 4) de Fecha — cada valor es
 *    el dato de una consulta de seguimiento distinta. Este es el eje que se
 *    bloquea progresivamente (columnas anteriores = solo lectura para
 *    practicante, columna actual = editable, columnas futuras = vacías).
 *  - Eje de CONTENIDO (diagGroup, rowBlock, idx de fila/parámetro): un
 *    número intermedio en el nombre que identifica un renglón/diagnóstico/
 *    parámetro paralelo, NO una consulta. Estos campos nunca se bloquean
 *    por columna.
 *
 * Lista construida a mano leyendo cada `name={...}` de HojaEvolutiva.tsx
 * (ver Task #3 de la sesión que introdujo este módulo) — no inferir por
 * regex genérica sobre "cualquier número final", ya sea aquí o al portar
 * este archivo a src/app/lib/seguimientoNutricionalCampos.ts (deben
 * mantenerse idénticos).
 */

const PATRONES_EJE_CONSULTA = [
  // Página 1
  /^psi_fecha_(\d+)$/, /^psi_q\d+_col(\d+)$/,
  /^sint_fecha_(\d+)$/, /^sint_\d+_col(\d+)$/,
  /^ejer_fecha_(\d+)$/, /^ejer_\d+_col(\d+)$/,
  /^diet_fecha_(\d+)$/, /^diet_\d+_col(\d+)$/,
  // Página 2
  /^freq_fecha_(\d+)$/, /^freq_\d+_col(\d+)$/,
  /^cual_fecha_(\d+)$/, /^cual_\d+_col(\d+)$/,
  // Página 3
  /^p3_fecha_(\d+)$/,
  /^eq_\d+_col(\d+)$/, /^cn_\d+_col(\d+)$/, /^int_\d+_col(\d+)$/,
  /^antro_fecha_(\d+)$/, /^antro_\d+_col(\d+)$/,
  // Página 4
  /^diag_fecha_(\d+)$/, /^diag_matriz_(\d+)$/, /^diag_interp_(\d+)$/,
  /^sig_fecha_(\d+)$/, /^sig_\d+_col(\d+)$/,
  /^bioq_fecha_(\d+)$/, /^bioq_\d+_col(\d+)$/,
  /^int_bioq_fecha_(\d+)$/, /^int_bioq_desc_(\d+)$/,
  // Página 5
  /^explor_fecha_(\d+)$/, /^explor_\d+_col(\d+)$/,
  /^diag_nutri_fecha_(\d+)$/,
  /^diag_nutri_\d+_nuevo_col(\d+)$/, /^diag_nutri_\d+_cont_col(\d+)$/, /^diag_nutri_\d+_res_col(\d+)$/,
  // Página 6
  /^interv_fecha_(\d+)$/, /^interv_ind_col(\d+)$/, /^interv_macro_\d+_col(\d+)$/, /^interv_eq_\d+_col(\d+)$/,
  /^edu_fecha_(\d+)$/, /^edu_\d+_log_col(\d+)$/, /^edu_\d+_sus_col(\d+)$/, /^edu_\d+_nol_col(\d+)$/,
  /^firma_fecha_col(\d+)$/, /^firma_\d+_col(\d+)$/, /^firma_final_col(\d+)$/,
];

/** Devuelve el número de columna de consulta (1-6) de un campo, o null si el campo no pertenece a ese eje. */
function obtenerColumnaDeConsulta(nombreCampo) {
  for (const patron of PATRONES_EJE_CONSULTA) {
    const m = nombreCampo.match(patron);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

module.exports = { obtenerColumnaDeConsulta };
