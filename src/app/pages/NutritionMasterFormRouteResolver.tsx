/**
 * ============================================================================
 * ARCHIVO: NutritionMasterFormRouteResolver.tsx
 * PROPÓSITO: /forms/nutricion/:appointmentId — captura nueva y edición de un
 * expediente ya finalizado ("Ver historial completo" desde
 * MedicalHistoryViewer.tsx) usan la misma interfaz de captura. Antes del
 * refactor de responsividad, un único componente permitía editar cualquier
 * expediente (nuevo o ya guardado); se restaura ese comportamiento aquí en
 * vez de bifurcar a una variante de solo lectura.
 * ============================================================================
 */
import NutricionPrimeraConsultaCaptura from './captura/NutricionPrimeraConsultaCaptura';

export default function NutritionMasterFormRouteResolver() {
  return <NutricionPrimeraConsultaCaptura />;
}
