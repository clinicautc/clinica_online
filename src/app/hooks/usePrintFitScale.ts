import { useEffect } from 'react';

/**
 * Regla de impresión única para todos los documentos clínicos del sistema
 * (Historia Clínica y Seguimiento, Nutrición y Fisioterapia): cada hoja
 * lógica (Carta: 215.9mm × 279.4mm) se imprime al 100% de su diseño
 * siempre que su contenido quepa dentro de ese alto físico. Solo si el
 * contenido real lo excede se aplica una reducción uniforme (CSS `zoom`,
 * que escala el modelo de caja completo sin reordenar nada), y el factor
 * se mide en tiempo real justo antes de imprimir — nunca un porcentaje
 * fijo escrito a mano:
 *
 *     factor = min(1, altoFisicoDisponiblePx / altoRealDeLaHojaPx)
 *
 * Cuando una hoja sí necesita reducirse, además se ensancha su ancho de
 * referencia ANTES de aplicar el zoom (a anchoFisicoPx / factor), de modo
 * que, tras el escalado uniforme, el resultado final ocupe el ancho
 * completo de la hoja Carta en vez de dejar márgenes laterales en blanco.
 * Como el zoom escala TODO el contenido por igual (filas, columnas,
 * fuente), esto no distorsiona ninguna proporción del diseño — solo
 * cambia el punto de partida antes de escalar. Se vuelve a medir el alto
 * después de ensanchar por si el ensanchado cambiara el ajuste de línea de
 * algún texto, para no reintroducir un desbordamiento.
 *
 * Cada selector que se le pase a este hook debe tener, en su CSS de
 * impresión:
 *
 *     width: var(--print-width, 215.9mm);
 *     min-height: 279.4mm;   (nunca `height` fija — clip a silencio si excede)
 *     zoom: var(--print-scale, 1);
 *
 * Si el contenido de una hoja cambia en el futuro (se agrega o quita una
 * sección), este cálculo se repite la próxima vez que se imprima — no hay
 * ningún valor "mágico" que pueda quedar desactualizado.
 *
 * Validado originalmente en Seguimiento Nutricional (HojaEvolutiva.tsx) e
 * Historia Clínica Nutricional (NutritionMasterForm.tsx); este hook extrae
 * esa misma lógica para reutilizarla sin duplicarla en cualquier otro
 * documento clínico (Fisioterapia incluida).
 */
const CARTA_ALTO_MM = 279.4;
const CARTA_ANCHO_MM = 215.9;
const PX_POR_MM = 96 / 25.4; // 96 CSS px por pulgada (constante del navegador)
// El motor de impresión de Chromium redondea el layout de forma distinta
// según el valor de `zoom` aplicado (confirmado empíricamente: una misma
// hoja mide unos pocos px menos bajo zoom real que bajo la medición previa
// con zoom reseteado a 1). Sin este colchón, una hoja calculada justo al
// límite puede terminar derramando su pie de página a una hoja extra casi
// en blanco. 6px (~1.6mm) absorbe ese margen de redondeo sin afectar
// visualmente el resultado.
const COLCHON_REDONDEO_PX = 6;

export function usePrintFitScale(selectores: string[]) {
  const clave = selectores.join('|');

  useEffect(() => {
    const listaSelectores = clave.split('|').filter(Boolean);
    const altoDisponiblePx = CARTA_ALTO_MM * PX_POR_MM - COLCHON_REDONDEO_PX;
    const anchoDisponiblePx = CARTA_ANCHO_MM * PX_POR_MM;

    const ajustarEscalaAntesDeImprimir = () => {
      listaSelectores.forEach(selector => {
        document.querySelectorAll<HTMLElement>(selector).forEach(hoja => {
          // Se resetea antes de medir para que scrollHeight refleje el alto
          // NATURAL del contenido y no un escalado/ensanchado previo.
          hoja.style.setProperty('--print-scale', '1');
          hoja.style.removeProperty('--print-width');
          const altoNatural = hoja.scrollHeight;
          let factor = Math.min(1, altoDisponiblePx / altoNatural);

          if (factor < 1) {
            hoja.style.setProperty('--print-width', `${anchoDisponiblePx / factor}px`);
            // Remedición: un ancho mayor puede cambiar el ajuste de línea
            // del texto y por lo tanto el alto natural.
            const altoTrasEnsanchar = hoja.scrollHeight;
            factor = Math.min(1, altoDisponiblePx / altoTrasEnsanchar);
            hoja.style.setProperty('--print-width', `${anchoDisponiblePx / factor}px`);
          }

          hoja.style.setProperty('--print-scale', String(factor));
        });
      });
    };

    window.addEventListener('beforeprint', ajustarEscalaAntesDeImprimir);
    return () => window.removeEventListener('beforeprint', ajustarEscalaAntesDeImprimir);
  }, [clave]);
}
