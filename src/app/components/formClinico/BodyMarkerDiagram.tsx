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
}

/**
 * Diagrama corporal con clic-para-marcar, usado en Fisioterapia (ubicación
 * del dolor y dermatomas). Normaliza marcadores legados en px la primera vez
 * que el contenedor se monta (mismo tamaño real disponible vía
 * getBoundingClientRect), y de ahí en adelante trabaja siempre en %.
 */
export default function BodyMarkerDiagram({ image, alt, markers, onChangeMarkers, withMarkerId, heightClass = 'h-56' }: BodyMarkerDiagramProps) {
  const { containerRef, addMarker, normalizeMarkers } = useBodyMarkers();
  const [normalized, setNormalized] = useState<BodyMarkerPct[] | null>(null);

  useEffect(() => {
    if (normalized === null && markers) {
      setNormalized(normalizeMarkers(markers as any));
    }
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
        className={`relative w-full ${heightClass} bg-white rounded-lg border border-slate-200 cursor-crosshair flex items-center justify-center overflow-hidden`}
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
