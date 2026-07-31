import { useEffect, useState } from 'react';
import { Eraser } from 'lucide-react';
import { useBodyMarkers, type BodyMarkerPct } from '../../hooks/formClinico/useBodyMarkers';

interface BodyMarkerDiagramProps {
  image: string;
  alt: string;
  markers: unknown[] | undefined;
  onChangeMarkers: (markers: BodyMarkerPct[]) => void;
  withMarkerId?: boolean;
  heightClass?: string;
  /**
   * Relación de aspecto real de la imagen ("ancho/alto", ej. "585/521").
   * Sin esto, el contenedor usa una altura fija (heightClass) + flexbox para
   * centrar la imagen (object-contain) — si la imagen no llena el
   * contenedor en algún eje queda una franja vacía ("letterbox"), y el %
   * del clic se calcula sobre el CONTENEDOR completo (letterbox incluido),
   * no sobre la imagen. Eso es inofensivo mientras el tamaño del
   * contenedor nunca cambie, pero si se agranda/achica después de guardar
   * marcas, el letterbox se redistribuye y las marcas guardadas (mismo %,
   * ahora relativo a un letterbox distinto) aparecen desplazadas respecto
   * a la imagen. Fijando aspect-ratio al de la imagen real, esta nunca
   * necesita letterbox (siempre llena el contenedor en ambos ejes), así
   * que contenedor% === imagen% sin importar el tamaño elegido.
   */
  aspectRatio?: string;
}

/**
 * Diagrama corporal con clic-para-marcar, usado en Fisioterapia (ubicación
 * del dolor y dermatomas). Normaliza marcadores legados en px la primera vez
 * que el contenedor se monta (mismo tamaño real disponible vía
 * getBoundingClientRect), y de ahí en adelante trabaja siempre en %.
 */
export default function BodyMarkerDiagram({ image, alt, markers, onChangeMarkers, withMarkerId, heightClass = 'h-56', aspectRatio }: BodyMarkerDiagramProps) {
  const { containerRef, addMarker, normalizeMarkers } = useBodyMarkers();
  const [normalized, setNormalized] = useState<BodyMarkerPct[] | null>(null);

  useEffect(() => {
    // Recalcula cada vez que cambian los marcadores de origen (no solo la
    // primera vez): el estado inicial del formulario ya trae `markers = []`
    // (arreglo vacío, "truthy") antes de que llegue el expediente real desde
    // la API — un guard de "solo una vez" se quedaría fijo en ese `[]`
    // transitorio y nunca reflejaría los marcadores reales una vez cargados.
    setNormalized(markers && markers.length > 0 ? normalizeMarkers(markers as any) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  const displayMarkers = normalized ?? (markers as BodyMarkerPct[] | undefined) ?? [];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.body-marker-clear-btn')) return;
    const marker = addMarker(e, withMarkerId);
    if (!marker) return;
    const next = [...displayMarkers, marker];
    setNormalized(next);
    onChangeMarkers(next);
  };

  const handleClear = () => {
    setNormalized([]);
    onChangeMarkers([]);
  };

  return (
    <div className="relative inline-block w-full">
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`relative w-full ${aspectRatio ? '' : heightClass} bg-white rounded-lg border border-slate-200 cursor-crosshair flex items-center justify-center overflow-hidden`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img src={image} alt={alt} className="max-w-full max-h-full object-contain pointer-events-none select-none" />
        {displayMarkers.map((m, i) => (
          <div
            key={m.id ?? i}
            className="absolute text-red-600 font-bold text-lg pointer-events-none"
            style={{ left: `${m.xPct}%`, top: `${m.yPct}%`, transform: 'translate(-50%, -50%)' }}
          >
            ✖
          </div>
        ))}
      </div>
      <button
        type="button"
        title="Doble clic para borrar todas las marcas"
        onDoubleClick={handleClear}
        className="body-marker-clear-btn absolute bottom-2 left-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow"
      >
        <Eraser className="w-4 h-4" />
      </button>
    </div>
  );
}
