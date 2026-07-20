/**
 * ============================================================================
 * ARCHIVO: EvolucionSeguimientoCaptura.tsx
 * PROPÓSITO: Interfaz de captura responsive para la Hoja Evolutiva (consultas
 * de seguimiento, nutrición y fisioterapia). Reemplaza a HojaEvolutiva.tsx
 * como componente de captura en vivo — HojaEvolutiva.tsx se conserva como
 * representación documental (hoja impresa en mm, solo lectura). Comparten
 * exactamente los mismos nombres de campo y la misma fuente de datos
 * (useHojaEvolutivaData) — ver docs/RESPONSIVE_DESIGN_STRATEGY.md sección 9.
 * ============================================================================
 */
import { forwardRef } from 'react';
import { useNavigate } from 'react-router';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import FormSectionCard from '../../components/formClinico/FormSectionCard';
import MatrixTable, { type MatrixRowConfig } from '../../components/formClinico/MatrixTable';
import SimpleFieldTable from '../../components/formClinico/SimpleFieldTable';
import FormClinicoActionBar from '../../components/formClinico/FormClinicoActionBar';
import DiagnosticosNutriciosSection from './DiagnosticosNutriciosSection';
import EducacionConsejeriaSection from './EducacionConsejeriaSection';
import { useHojaEvolutivaData } from '../../hooks/formClinico/useHojaEvolutivaData';
import { useFormClinicoController } from '../../hooks/formClinico/useFormClinicoController';
import { useFormFieldMasks } from '../../hooks/formClinico/useFormFieldMasks';
import { formatExpediente } from '../../lib/formatExpediente';
import type { FormClinicoHandle, FormClinicoCallbacks } from '../../lib/types/formClinico';

const ALIMENTOS: string[] = [
  "Verduras", "Frutas", "Cereal sin grasa", "Pan dulce natural", "Pan dulce UP", "Galletas",
  "Leguminosas", "Carne de res", "Carne de cerdo", "Carne de pollo", "Pavo", "Pescados",
  "Mariscos", "Huevo", "Prod. animal UP", "Quesos blancos", "Quesos amarillos", "Embutidos",
  "Leche sin sabor", "Yogurt sin sabor", "Leche UP", "Yogurt UP", "Oleaginosas", "Aceites",
  "Mantequilla", "Margarina", "Refresco", "Agua de sabor UP", "Jugos naturales", "Jugos UP",
  "Helado", "Nieve", "Gelatinas", "Aguas de frutas", "Té", "Café", "Agua natural",
  "Papas fritas", "Garnachas a comal", "Garnachas fritas"
];

const rowsPsicologicos: MatrixRowConfig[] = [
  "¿Cómo te sentiste emocionalmente al iniciar el plan de alimentación que te propusimos?",
  "Durante la aplicación del plan, ¿experimentaste motivación, frustración o alguna otra emoción predominante?",
  "¿Qué tanto sentiste que el plan se adaptaba a tu estilo de vida y te generaba tranquilidad o estrés?",
  "¿Hubo momentos en los que te sentiste orgulloso(a) o satisfecho(a) por seguir el plan?",
  "¿De qué manera el plan de alimentación influyó en tu estado de ánimo o en tu percepción personal durante estos días?",
].map((q, idx) => ({ label: q, name: (col: number) => `psi_q${idx}_col${col}`, type: 'textarea' as const }));

const rowsSintomatologia: MatrixRowConfig[] = [
  "Gastritis", "Colitis", "Reflujo gastroesofágico", "Diarrea", "Estreñimiento", "Vómito",
  "Náuseas", "Disfagia", "Hiperfagia", "Flatulencias", "Distensión abdominal", "Hiporexia", "Escala de Bristol",
].map((s, idx) => ({ label: s, name: (col: number) => `sint_${idx}_col${col}` }));

const rowsEjercicio: MatrixRowConfig[] = [
  "Si/No", "Anaerobico/Aeróbico", "¿Cual?", "Frecuencia", "Intensidad", "Tiempo", "Volumen", "Progresion",
].map((p, idx) => ({ label: p, name: (col: number) => `ejer_${idx}_col${col}` }));

const rowsDieteticos: MatrixRowConfig[] = [
  "Comidas al día", "Dieta especial", "Uso de laxantes", "Medicamentos ↓ peso",
].map((p, idx) => ({ label: p, name: (col: number) => `diet_${idx}_col${col}` }));

const rowsFrecuencia: MatrixRowConfig[] = ALIMENTOS.map((item, idx) => ({
  label: item, name: (col: number) => `freq_${idx}_col${col}`, type: 'days' as const,
}));

const rowsCualitativo: MatrixRowConfig[] = [
  { q: "¿Incluye todos los nutrimentos esenciales?", r: "→ Completa" },
  { q: "¿Los nutrimentos están en proporciones adecuadas?", r: "→ Equilibrada" },
  { q: "¿Los alimentos están libres de patógenos?", r: "→ Inocua" },
  { q: "¿No se consumen en cantidades excesivas?", r: "→ Equilibrada" },
  { q: "¿Cubre los requerimientos según edad/sexo?", r: "→ Suficiente" },
].map((item, idx) => ({
  label: <>{item.q}<br /><b>{item.r}</b></>,
  name: (col: number) => `cual_${idx}_col${col}`,
}));

const rowsParametrosDieteticos: MatrixRowConfig[] = [
  ...["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"]
    .map((r, idx) => ({ label: r, name: (col: number) => `eq_${idx}_col${col}` })),
  ...["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"]
    .map((r, idx) => ({ label: r, name: (col: number) => `cn_${idx}_col${col}` })),
  ...["Energía", "Proteína", "HCO", "Lípidos"]
    .map((r, idx) => ({ label: r, name: (col: number) => `int_${idx}_col${col}` })),
];
const gruposParametrosDieteticos = [
  { beforeRow: 0, label: 'Equivalentes (rac)' },
  { beforeRow: 10, label: 'Contenido Nutrimental' },
  { beforeRow: 14, label: 'Interpretación de la ingestión actual (Dieta)' },
];

const ANTROPOMETRIA_ROWS: Array<{ label: React.ReactNode }> = [
  { label: "Peso (kg)" }, { label: <>IMC (kg/m<sup>2</sup>)</> }, { label: "Peso ideal/PAO (kg)" },
  { label: "Circ. Muñeca (cm)" }, { label: "Circ. Brazo (cm)" }, { label: "Circ. Abdominal (cm)" },
  { label: "Circ. Cintura (cm)" }, { label: "Circ. Cadera (cm)" }, { label: "ICC" },
  { label: "PCB (mm)" }, { label: "PCT (mm)" }, { label: "PCSe (mm)" }, { label: "PCSi (mm)" },
  { label: "% Grasa, Siri (%/kg)" }, { label: "% Grasa, InBody (%/kg)" },
  { label: <>IMG, con InBody (kgMG/m<sup>2</sup>)</> },
  { label: "MLG (kg)" }, { label: <>IMLG, con (kgMLG/m<sup>2</sup>)</> },
  { label: <>cAMB (cm<sup>2</sup>)</> }, { label: "MMT, InBody (%/kg)" },
  { label: <>IMEA, con InBody (kgMM/m<sup>2</sup>)</> },
  { label: "ACT (L)" }, { label: "Grasa visceral (L)" },
];
const rowsAntropometria: MatrixRowConfig[] = ANTROPOMETRIA_ROWS.map((row, idx) => ({
  label: row.label, name: (col: number) => `antro_${idx}_col${col}`, type: 'number' as const,
}));

const rowsSignosVitales: MatrixRowConfig[] = [
  "Tensión arterial (mmHg)", "Frecuencia respiratoria (rpm)", "Frecuencia cardiaca (lpm)", "Temperatura (°C)", "SO₂",
].map((s, idx) => ({ label: s, name: (col: number) => `sig_${idx}_col${col}` }));

const rowsExploracionFisica: MatrixRowConfig[] = [
  "Hallazgos generales", "Adiposidad", "Huesos", "Sistema CV-respiratorio", "Sistema digestivo", "Edema",
  "Extremidades", "Ojos", "Pelo", "Cabeza", "Manos y uñas", "Boca", "Músculos", "Cuello", "Piel", "Dientes",
  "Garganta y deglución", "Lengua",
].map((h, idx) => ({ label: h, name: (col: number) => `explor_${idx}_col${col}` }));

const rowsIntervencion: MatrixRowConfig[] = [
  { label: "Indicación de Alimentos/Nutrimentos", name: (col: number) => `interv_ind_col${col}`, type: 'textarea' as const },
  ...["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"]
    .map((m, idx) => ({ label: m, name: (col: number) => `interv_macro_${idx}_col${col}` })),
  ...["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"]
    .map((eq, idx) => ({ label: eq, name: (col: number) => `interv_eq_${idx}_col${col}` })),
];
const gruposIntervencion = [
  { beforeRow: 1, label: 'Contenido Nutrimental' },
  { beforeRow: 5, label: 'Equivalentes (rac)' },
];

const rowsFirmas: MatrixRowConfig[] = [
  ...["PLN.", "Matrícula", "Firma", "LN.", "Céd. Prof."].map((label, idx) => ({ label, name: (col: number) => `firma_${idx}_col${col}` })),
  { label: "Firma", name: (col: number) => `firma_final_col${col}` },
];

const EvolucionSeguimientoCaptura = forwardRef<FormClinicoHandle, Partial<FormClinicoCallbacks>>((props, ref) => {
  const navigate = useNavigate();
  const {
    formData, setFormData, isSaving, yaGuardado, setYaGuardado, doSave, canSave,
  } = useHojaEvolutivaData(props);
  const { handleInputChange, handleDateInput, handleNumberInput, handleDaysInput } = useFormFieldMasks(setFormData);

  const { confirmarGuardado } = useFormClinicoController(
    {
      formKeyProp: props.formKey,
      state: formData,
      onStateChange: props.onStateChange,
      onBack: props.onBack,
      canSave,
      triggerSave: doSave,
      restoreDraft: (draft) => setFormData({
        ...((draft as typeof formData) ?? {}),
        ...(props.pacienteId != null ? { paciente_id: String(props.pacienteId) } : {}),
      }),
      onGuardarSinFinalizar: () => setYaGuardado(true),
    },
    ref
  );

  const handleVolver = () => {
    const confirmar = window.confirm("¿Deseas salir sin guardar los cambios?");
    if (confirmar) navigate(-1);
  };

  const matrixProps = { formData, onChange: handleInputChange, onDateChange: handleDateInput, onNumberChange: handleNumberInput, onDaysChange: handleDaysInput };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28">
      <FormSectionCard title="Datos personales" className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-600">Nombre completo</label>
            <Input type="text" name="paciente_nombre" value={(formData.paciente_nombre as string) || ''} onChange={handleInputChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Expediente</label>
            <Input type="text" value={formatExpediente(props.pacienteId ?? (typeof formData.paciente_id === 'string' ? formData.paciente_id : undefined))} readOnly tabIndex={-1} />
          </div>
        </div>
      </FormSectionCard>

      <Tabs defaultValue="p1">
        <TabsList>
          <TabsTrigger value="p1">Estado clínico</TabsTrigger>
          <TabsTrigger value="p2">Dieta</TabsTrigger>
          <TabsTrigger value="p3">Antropometría</TabsTrigger>
          <TabsTrigger value="p4">Diagnóstico</TabsTrigger>
          <TabsTrigger value="p5">Exploración</TabsTrigger>
          <TabsTrigger value="p6">Intervención</TabsTrigger>
        </TabsList>

        <TabsContent value="p1" className="space-y-4 mt-4">
          <FormSectionCard title="A. Psicológicos"><MatrixTable numCols={6} fechaName={col => `psi_fecha_${col}`} rows={rowsPsicologicos} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="Sintomatología"><MatrixTable numCols={6} fechaName={col => `sint_fecha_${col}`} rows={rowsSintomatologia} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="Ejercicio"><MatrixTable numCols={6} fechaName={col => `ejer_fecha_${col}`} rows={rowsEjercicio} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="A. Dietéticos"><MatrixTable numCols={6} fechaName={col => `diet_fecha_${col}`} rows={rowsDieteticos} {...matrixProps} /></FormSectionCard>
        </TabsContent>

        <TabsContent value="p2" className="space-y-4 mt-4">
          <FormSectionCard title="Frecuencia de consumo"><MatrixTable numCols={6} fechaName={col => `freq_fecha_${col}`} rows={rowsFrecuencia} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="Análisis cualitativo"><MatrixTable numCols={6} fechaName={col => `cual_fecha_${col}`} rows={rowsCualitativo} {...matrixProps} /></FormSectionCard>
        </TabsContent>

        <TabsContent value="p3" className="space-y-4 mt-4">
          <FormSectionCard title="Parámetros dietéticos">
            <MatrixTable numCols={6} fechaName={col => `p3_fecha_${col}`} rows={rowsParametrosDieteticos} groupHeaders={gruposParametrosDieteticos} {...matrixProps} />
          </FormSectionCard>
          <FormSectionCard title="Antropometría">
            <div className="mb-4 max-w-xs space-y-1">
              <label className="text-xs font-medium text-slate-600">Talla (m)</label>
              <Input type="text" name="antro_talla" value={(formData.antro_talla as string) || ''} onChange={handleInputChange} />
            </div>
            <MatrixTable numCols={6} fechaName={col => `antro_fecha_${col}`} rows={rowsAntropometria} {...matrixProps} />
          </FormSectionCard>
        </TabsContent>

        <TabsContent value="p4" className="space-y-4 mt-4">
          <FormSectionCard title="Diagnóstico Matriz IMG/IMLG e Interpretación antropométrica">
            <SimpleFieldTable
              numRows={6}
              columns={[
                { label: 'Fecha', name: row => `diag_fecha_${row}`, type: 'date' },
                { label: 'Diagnóstico Matriz IMG/IMLG', name: row => `diag_matriz_${row}`, type: 'textarea' },
                { label: 'Interpretación antropométrica', name: row => `diag_interp_${row}`, type: 'textarea' },
              ]}
              formData={formData}
              onChange={handleInputChange}
              onDateChange={handleDateInput}
            />
          </FormSectionCard>
          <FormSectionCard title="Signos Vitales"><MatrixTable numCols={6} fechaName={col => `sig_fecha_${col}`} rows={rowsSignosVitales} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="Parámetros Bioquímicos">
            <MatrixTable
              numCols={6}
              fechaName={col => `bioq_fecha_${col}`}
              rows={Array.from({ length: 10 }, (_, idx) => ({
                label: <Input type="text" name={`bioq_param_${idx}`} value={(formData[`bioq_param_${idx}`] as string) || ''} onChange={handleInputChange} className="h-8 text-xs px-2" placeholder="Parámetro" />,
                name: (col: number) => `bioq_${idx}_col${col}`,
              }))}
              {...matrixProps}
            />
          </FormSectionCard>
          <FormSectionCard title="Interpretación bioquímica">
            <SimpleFieldTable
              numRows={6}
              columns={[
                { label: 'Fecha', name: row => `int_bioq_fecha_${row}`, type: 'date' },
                { label: 'Interpretación', name: row => `int_bioq_desc_${row}`, type: 'textarea' },
              ]}
              formData={formData}
              onChange={handleInputChange}
              onDateChange={handleDateInput}
            />
          </FormSectionCard>
        </TabsContent>

        <TabsContent value="p5" className="space-y-4 mt-4">
          <FormSectionCard title="Exploración física"><MatrixTable numCols={6} fechaName={col => `explor_fecha_${col}`} rows={rowsExploracionFisica} {...matrixProps} /></FormSectionCard>
          <FormSectionCard title="Diagnósticos Nutricios">
            <DiagnosticosNutriciosSection formData={formData} onChange={handleInputChange} onDateChange={handleDateInput} />
          </FormSectionCard>
        </TabsContent>

        <TabsContent value="p6" className="space-y-4 mt-4">
          <FormSectionCard title="Intervención Nutricia">
            <MatrixTable numCols={6} fechaName={col => `interv_fecha_${col}`} rows={rowsIntervencion} groupHeaders={gruposIntervencion} {...matrixProps} />
          </FormSectionCard>
          <FormSectionCard title="Educación Nutricional y Consejería">
            <EducacionConsejeriaSection formData={formData} onChange={handleInputChange} onDateChange={handleDateInput} />
          </FormSectionCard>
          <FormSectionCard title="Firmas">
            <MatrixTable numCols={6} fechaName={col => `firma_fecha_col${col}`} rows={rowsFirmas} {...matrixProps} />
          </FormSectionCard>
        </TabsContent>
      </Tabs>

      <FormClinicoActionBar
        isSaving={isSaving}
        yaGuardado={yaGuardado}
        showVolver={!props.formKey}
        onVolver={handleVolver}
        onConfirmarGuardado={confirmarGuardado}
        guardarLabel="Guardar Hoja"
      />
    </div>
  );
});

export default EvolucionSeguimientoCaptura;
