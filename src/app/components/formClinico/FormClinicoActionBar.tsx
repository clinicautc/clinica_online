import { useState } from 'react';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import ConfirmDialog from '../ConfirmDialog';

interface FormClinicoActionBarProps {
  isSaving: boolean;
  yaGuardado: boolean;
  showVolver: boolean;
  onVolver: () => void;
  onConfirmarGuardado: () => void;
  guardarLabel?: string;
  confirmDescription?: string;
  volverDescription?: string;
}

/**
 * Botonera de acción compartida por los formularios de captura clínica —
 * reemplaza los bloques de botón flotante + modal de confirmación hechos a
 * mano que existían inline en cada formulario, unificando el patrón visual
 * sobre el ConfirmDialog ya usado en el resto de la app (ej. ConsultaWorkspace).
 */
export default function FormClinicoActionBar({
  isSaving,
  yaGuardado,
  showVolver,
  onVolver,
  onConfirmarGuardado,
  guardarLabel = 'Guardar',
  confirmDescription = 'Al confirmar, la información quedará guardada para esta consulta. Podrás revisarla o editarla antes de dar por finalizada la sesión.',
  volverDescription = 'Si sales ahora sin guardar, los cambios que hayas hecho en esta consulta se perderán.',
}: FormClinicoActionBarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmVolver, setShowConfirmVolver] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col sm:flex-row gap-2">
        {showVolver && (
          <Button type="button" variant="outline" onClick={() => setShowConfirmVolver(true)} className="rounded-full font-bold shadow-md gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        )}
        <Button
          type="button"
          onClick={() => !yaGuardado && setShowConfirm(true)}
          disabled={isSaving || yaGuardado}
          className={`rounded-full font-bold shadow-lg gap-2 ${yaGuardado ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-900 hover:bg-blue-800'}`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {yaGuardado ? 'Guardado ✓' : isSaving ? 'Guardando...' : guardarLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="¿Guardar expediente?"
        description={confirmDescription}
        confirmLabel="Sí, guardar"
        confirmClass="flex-1 bg-green-600 hover:bg-green-700 font-bold shadow-md"
        onConfirm={onConfirmarGuardado}
      />

      <ConfirmDialog
        open={showConfirmVolver}
        onOpenChange={setShowConfirmVolver}
        title="¿Salir sin guardar?"
        description={volverDescription}
        confirmLabel="Sí, salir"
        confirmClass="flex-1 bg-red-600 hover:bg-red-700 font-bold shadow-md"
        onConfirm={onVolver}
      />
    </>
  );
}
