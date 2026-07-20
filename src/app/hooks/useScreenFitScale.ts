import { useEffect } from 'react';

/**
 * Ajuste de pantalla (no impresión) para los documentos clínicos en mm
 * (Carta: 215.9mm de ancho). En escritorio la hoja cabe sobrada; en celular
 * (~390px) sus 816px físicos desbordan el viewport y el navegador termina
 * ampliando el viewport de layout completo en vez de solo mostrar scroll —
 * el resultado visual es la hoja "cortada". Este hook mide el ancho real
 * disponible y aplica un `zoom` (afecta el modelo de caja, no solo lo
 * visual, a diferencia de `transform: scale`) para que la hoja completa
 * quepa a lo ancho, como una miniatura de PDF — el usuario puede hacer
 * pinch-zoom para leer el detalle, igual que con cualquier PDF en celular.
 *
 * Mismo mecanismo/constantes que usePrintFitScale.ts (ver ese archivo), pero
 * disparado por resize/orientationchange en vez de `beforeprint`, y
 * calculando el factor a partir del ANCHO disponible en vez del alto.
 *
 * Cada selector que se le pase a este hook debe tener, en su CSS base
 * (fuera de `@media print`):
 *
 *     zoom: var(--screen-scale, 1);
 */
const CARTA_ANCHO_MM = 215.9;
const PX_POR_MM = 96 / 25.4;
const MARGEN_LATERAL_PX = 16;

export function useScreenFitScale(selectores: string[]) {
  const clave = selectores.join('|');

  useEffect(() => {
    const listaSelectores = clave.split('|').filter(Boolean);
    const anchoHojaPx = CARTA_ANCHO_MM * PX_POR_MM;

    const ajustarEscalaEnPantalla = () => {
      const anchoDisponible = document.documentElement.clientWidth - MARGEN_LATERAL_PX;
      const factor = Math.min(1, anchoDisponible / anchoHojaPx);
      listaSelectores.forEach(selector => {
        document.querySelectorAll<HTMLElement>(selector).forEach(hoja => {
          hoja.style.setProperty('--screen-scale', String(factor));
        });
      });
    };

    ajustarEscalaEnPantalla();
    window.addEventListener('resize', ajustarEscalaEnPantalla);
    window.addEventListener('orientationchange', ajustarEscalaEnPantalla);
    return () => {
      window.removeEventListener('resize', ajustarEscalaEnPantalla);
      window.removeEventListener('orientationchange', ajustarEscalaEnPantalla);
    };
  }, [clave]);
}
