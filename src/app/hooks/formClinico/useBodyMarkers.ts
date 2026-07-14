import { useRef } from 'react';

export interface BodyMarkerPct {
  xPct: number;
  yPct: number;
  id?: number;
}

/** Formato legado (antes de esta fase): posición absoluta en px del contenedor en el momento del clic. */
interface LegacyMarker {
  x: number;
  y: number;
  id?: number;
}

type AnyMarker = BodyMarkerPct | LegacyMarker;

function isLegacyMarker(m: AnyMarker): m is LegacyMarker {
  return 'x' in m && 'y' in m;
}

/**
 * Convierte clics sobre el diagrama corporal a coordenadas porcentuales
 * (0-100) relativas al contenedor, en vez de píxeles absolutos — sobrevive a
 * cualquier ancho de pantalla, a diferencia del cálculo original en
 * PhysiotherapyMasterForm.tsx (`x = e.clientX - rect.left`, guardado tal cual
 * en px). Incluye conversión de marcadores legados (formato {x,y} en px) a
 * {xPct,yPct} para que un borrador en vuelo capturado antes de esta fase
 * siga renderizando en la posición correcta tras el despliegue.
 */
export function useBodyMarkers() {
  const containerRef = useRef<HTMLDivElement>(null);

  const addMarker = (e: React.MouseEvent<HTMLDivElement>, withId = false): BodyMarkerPct | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    return withId ? { xPct, yPct, id: Date.now() } : { xPct, yPct };
  };

  /** Normaliza un array de marcadores (legado o nuevo) a {xPct,yPct} usando el tamaño real del contenedor ya montado. */
  const normalizeMarkers = (markers: AnyMarker[] | undefined): BodyMarkerPct[] => {
    if (!markers || markers.length === 0) return [];
    const rect = containerRef.current?.getBoundingClientRect();
    return markers.map((m) => {
      if (!isLegacyMarker(m)) return m;
      if (!rect || rect.width === 0 || rect.height === 0) return { xPct: 0, yPct: 0, id: m.id };
      return { xPct: (m.x / rect.width) * 100, yPct: (m.y / rect.height) * 100, id: m.id };
    });
  };

  return { containerRef, addMarker, normalizeMarkers };
}
