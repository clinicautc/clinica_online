# Límites de caracteres — Seguimiento Nutricional (post-ajustes de ancho/alto)

Medido en vivo contra el documento real (`/forms/seguimiento-nutricional/:id/documento`),
con fuente 8px en todos los campos de datos. Es el máximo que cabe sin que el navegador
recorte texto (`scrollWidth`/`scrollHeight` vs. tamaño visible de la caja).

CAMPO 15 (Indicación de Alimentos/Nutrimentos) y CAMPO 19 (Firmas) se ampliaron una vez
más en esta ronda (angostando su columna de etiqueta un poco más: 45→52 y 27→29
respectivamente). El resto de los campos se deja fijo en el valor de hoy — es la
referencia para usarse después (p. ej. como `maxLength` en los campos de captura).

| # | Campo (prefijo real) | Sección | Máx. caracteres |
|---|---|---|---|
| 1 | `psi_q*_col*` | A. Psicológicos | **99** |
| 2 | `sint_*_col*` | Sintomatología | **26** |
| 3 | `ejer_*_col*` | Ejercicio | **26** |
| 4 | `diet_*_col*` | A. Dietéticos | **26** |
| 5 | `cual_*_col*` | Análisis cualitativo | **19** |
| 6 | `eq_*_col*` | Equivalentes (Parámetros dietéticos) | **21** |
| 7 | `cn_*_col*` | Contenido Nutrimental (Parámetros dietéticos) | **21** |
| 8 | `int_*_col*` | Interpretación de la ingestión (Parámetros dietéticos) | **21** |
| 9 | `diag_interp_*` | Interpretación antropométrica | **252** |
| — | `diag_matriz_*` | Diagnóstico Matriz IMG/IMLG | **99** |
| 10 | `sig_*_col*` | Signos Vitales | **26** |
| 11 | `bioq_*_col*` | P. Bioquímicos (valores) | **19** |
| — | `bioq_param_*` | P. Bioquímicos (nombre del parámetro) | 52 *(sin cambio esta ronda)* |
| 12 | `int_bioq_desc_*` | Interpretación bioquímica | **350** |
| 13 | `explor_*_col*` | Exploración física | **26** |
| 14 | `diag_nutri_txt_*` | Diagnósticos Nutricios (texto paralelo) | 223 *(sin cambio esta ronda)* |
| 15 | `interv_ind_col*` | Indicación de Alimentos/Nutrimentos | **52** ⬆ |
| 16 | `interv_macro_*_col*` | Contenido Nutrimental (Intervención) | **29** |
| 17 | `interv_eq_*_col*` | Equivalentes (Intervención) | **29** |
| 18 | `edu_cont_*` / `edu_apl_*` / `cons_base_*` / `cons_est_*` | Educación / Consejería (texto paralelo) | 141 *(sin cambio esta ronda)* |
| 19 | `firma_*_col*` / `firma_final_col*` | Firmas | **29** ⬆ |

Campos de fecha (`*_fecha_*`, formato DD/MM/AAAA) y numéricos (`antro_*`, `type="number"`)
no están en esta tabla — no tienen riesgo real de recorte, su contenido siempre es corto.

Estado de las 6 páginas del documento tras estos cambios: las 6 caen exactas en 279.4mm
(0.00mm de sobrante), sin desacomodo al imprimir.
