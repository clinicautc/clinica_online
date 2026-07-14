/**
 * ============================================================================
 * ARCHIVO: PhysiotherapyMasterFormRouteResolver.tsx
 * PROPÓSITO: /forms/fisioterapia/:appointmentId — captura nueva y edición de
 * un expediente ya finalizado ("Ver historial completo" desde
 * MedicalHistoryViewer.tsx) usan la misma interfaz de captura. Mismo cambio
 * que NutritionMasterFormRouteResolver.tsx: se restaura la posibilidad de
 * editar un expediente ya guardado en vez de bifurcar a una variante de solo
 * lectura.
 * ============================================================================
 */
import FisioterapiaPrimeraConsultaCaptura from './captura/FisioterapiaPrimeraConsultaCaptura';

export default function PhysiotherapyMasterFormRouteResolver() {
  return <FisioterapiaPrimeraConsultaCaptura />;
}
