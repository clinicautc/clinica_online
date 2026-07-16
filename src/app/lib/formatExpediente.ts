/**
 * Genera el identificador legible del expediente a partir de usuarios.id.
 *
 * No representa una entidad ni un consecutivo independiente: las relaciones
 * del sistema continúan usando el ID numérico original del paciente.
 */
export function formatExpediente(patientId: string | number | null | undefined): string {
    const id = Number(patientId);

    if (!Number.isSafeInteger(id) || id < 1) {
        return 'PAC-S/N';
    }

    return `PAC-${String(id).padStart(6, '0')}`;
}
