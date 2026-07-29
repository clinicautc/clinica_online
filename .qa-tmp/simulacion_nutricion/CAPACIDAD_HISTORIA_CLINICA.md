# Capacidad de caracteres — Historia Clínica Nutricional (solo medición, sin implementar)

Medido en vivo contra `/forms/nutricion/72/documento` (fuente 8px en todos los campos, ya
igualada a Seguimiento Nutricional). Mismo método validado: binary search de longitud de
contenido sobre cada campo ya renderizado (`scrollWidth`/`scrollHeight` vs. tamaño visible),
sin mutar CSS en vivo.

115 grupos visuales distintos encontrados (campos con mismo ancho/alto/fuente/padding).

## Aviso importante sobre los valores "6600"
Varios grupos (etiquetados "Verduras", "Proteína", "Energía", "Total", "Talla (m)", etc.)
muestran `max=6600` — **esto NO significa que no tengan límite real**. Son campos
`type="number"`: el navegador rechaza silenciosamente un valor no numérico (lo deja vacío),
así que la prueba nunca detecta overflow y sube hasta el techo del texto de prueba sin razón
real. Su capacidad real está limitada por cuántos dígitos caben, no es una preocupación.

## Campos de texto libre con capacidad más ajustada (candidatos a revisar después)
| Etiqueta detectada | Máx. caracteres | Tamaño |
|---|---|---|
| "P" (Partos, ficha gineco-obstétrica) | 6 | 20×13px |
| "G" (Gestas) | 7 | 24×13px |
| Edad | 9 | 40×14px |
| SDG (Semanas de Gestación) | 14 | 48×13px |
| FUM (Fecha última menstruación) | 16 | 56×13px |
| Hallazgos grales (exploración física, x16 campos) | 16-17 | 64-67×13px |
| Hábito tabáquico / Consumo de drogas (cantidad) | 18 | 63×18-19px |
| Gastritis / Colitis (Freq./Cant., x11 campos) | 23 | 93×14px |
| Frecuencia de consumo (alimentos, x9-20 campos cada uno) | 16-30 | 63-113×12-15px |
| Frecuencia / Intensidad (ejercicio) | 29 | 112-113×13px |

## Campos de texto libre con más margen
| Etiqueta detectada | Máx. caracteres | Tamaño |
|---|---|---|
| ¿Quién prepara sus alimentos? | 84 | 308×16px |
| Diagnóstico Matriz IMG/IMLG | 99 | 356×16px |
| Dirección | 120 | 420×14px |
| Nombre completo | 132 | 465×14px |
| Alimentos que no le agradan... | 148 | 519×16px |
| Recordatorio de 24h (contenido, textarea) | 191-206 | 335-370×36px |
| Contenido (E-1) / Bases Teórico (C-1) (Educación/Consejería) | 230 | 167-168×65px |
| Recordatorio de 24h (renglón completo) | 260-261 | 146-147×100px |
| Objetivo general / Consejería con formato SMART | 269 | 167×84px |
| Diagnósticos Nutricios (columna grande, la más holgada) | 670 | 167×184px |

## Nota metodológica
Las etiquetas se detectaron heurísticamente (texto de la celda vecina en tablas, o texto
suelto en el contenedor) — confiables para identificar la sección, pero pueden no ser
exactas al 100% en un puñado de casos (React no usa `name` en la mayoría de estos inputs,
a diferencia de Seguimiento Nutricional). Los **números de capacidad sí son medición real**,
no heurística.

Archivo de datos completo (115 grupos, todos los campos): `capacidad_historia_clinica.json`
en esta misma carpeta.

**Nada de esto se implementó** — es solo el diagnóstico, a la espera de decidir qué campos
vale la pena ensanchar/ajustar, igual que se hizo con Seguimiento Nutricional.
