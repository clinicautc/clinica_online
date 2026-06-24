// Normaliza nombres/apellidos antes de guardarlos: colapsa espacios y pone
// en mayúscula la primera letra de cada palabra (resto en minúscula), p.ej.
// "juan PEDRO  perez" -> "Juan Pedro Perez".
export function capitalizeWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((palabra) =>
      palabra
        ? palabra[0].toLocaleUpperCase('es') + palabra.slice(1).toLocaleLowerCase('es')
        : palabra
    )
    .join(' ');
}
