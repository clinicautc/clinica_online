/**
 * ============================================================================
 * ARCHIVO: NutritionMasterFormRouteResolver.tsx
 * PROPÓSITO: /forms/nutricion/:appointmentId sirve doble propósito hoy —
 * captura nueva (paciente no recurrente, sin historial aún) y "Ver historial
 * completo" desde MedicalHistoryViewer.tsx (historial ya finalizado). Este
 * wrapper decide en runtime cuál de las dos capas montar, sin necesidad de
 * una ruta nueva ni de tocar MedicalHistoryViewer.
 * Ver docs/RESPONSIVE_DESIGN_STRATEGY.md sección 9 y el plan de Fase 5.
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import NutricionPrimeraConsultaCaptura from './captura/NutricionPrimeraConsultaCaptura';
import NutritionMasterForm from './NutritionMasterForm';

export default function NutritionMasterFormRouteResolver() {
  const params = useParams();
  const appointmentId = params.id || params.appointmentId;
  const [yaExiste, setYaExiste] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelado = false;
    const verificar = async () => {
      if (!appointmentId || appointmentId === 'undefined') { setYaExiste(false); return; }
      try {
        const response = await apiFetch(`/historiales-nutricion/detalle/${appointmentId}`);
        if (!cancelado) setYaExiste(response.ok);
      } catch {
        if (!cancelado) setYaExiste(false);
      }
    };
    verificar();
    return () => { cancelado = true; };
  }, [appointmentId]);

  if (yaExiste === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-900" />
      </div>
    );
  }

  return yaExiste ? <NutritionMasterForm /> : <NutricionPrimeraConsultaCaptura />;
}
