/**
 * ============================================================================
 * ARCHIVO: NutricionPrimeraConsultaCaptura.tsx
 * PROPÓSITO: Interfaz de captura responsive para la Historia Clínica
 * Nutricional (primera consulta). Reemplaza a NutritionMasterForm.tsx como
 * componente de captura en vivo — NutritionMasterForm.tsx se conserva como
 * representación documental (hoja impresa en mm, solo lectura). Comparten
 * exactamente los mismos nombres de campo y la misma fuente de datos
 * (useNutritionHistoriaData) — ver docs/RESPONSIVE_DESIGN_STRATEGY.md sección 9.
 *
 * Nota de alcance: los checkboxes "Realiza ejercicio No/Sí/Aeróbico/Anaeróbico",
 * "Embarazo No/Sí", "Remplazo hormonal No/Sí" y "Anticonceptivos No/Sí" de la
 * Página 1 eran decorativos (sin `name`/`value`/`onChange`) tanto aquí como en
 * NutritionMasterForm.tsx; ya se cablearon con estado real en ambos archivos.
 * ============================================================================
 */
import { forwardRef } from 'react';
import { useNavigate } from 'react-router';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import FormSectionCard from '../../components/formClinico/FormSectionCard';
import FormClinicoActionBar from '../../components/formClinico/FormClinicoActionBar';
import CheckboxGridSection from './CheckboxGridSection';
import VoInterpretacionTable, { VoInterpretacionMobile, type VoInterpRow } from './VoInterpretacionTable';
import bristolImg from '../bristol.jpg';
import { useNutritionHistoriaData } from '../../hooks/formClinico/useNutritionHistoriaData';
import { useFormClinicoController } from '../../hooks/formClinico/useFormClinicoController';
import { formatExpediente } from '../../lib/formatExpediente';
import type { FormClinicoHandle, FormClinicoCallbacks } from '../../lib/types/formClinico';

const ENFERMEDADES_HEREDO = [
  'Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales',
];
const COLS_HEREDO = ['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'];

const ENFERMEDADES_PERSONALES = [
  'Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales',
];

const SINTOMAS = [
  'Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito',
  'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia',
];

const NO_PATOLOGICOS = ['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'];

const ALIMENTOS_FRECUENCIA = [
  'Verduras', 'Frutas', 'Cereal sin grasa', 'Pan dulce natural', 'Pan dulce UP', 'Galletas', 'Leguminosas',
  'Carne de res', 'Carne de cerdo', 'Carne de pollo', 'Pavo', 'Pescados', 'Mariscos', 'Huevo',
  'Prod. animal UP', 'Quesos blancos', 'Quesos amarillos', 'Embutidos', 'Leche sin sabor', 'Yogurt sin sabor',
  'Leche UP', 'Yogurt UP', 'Oleaginosas', 'Aceites', 'Mantequilla', 'Margarina', 'Refresco',
  'Agua de sabor UP', 'Jugos naturales', 'Jugos UP', 'Helado', 'Nieve', 'Gelatinas', 'Aguas de frutas', 'Té',
  'Café', 'Agua natural', 'Papas fritas', 'Garnachas a comal', 'Garnachas fritas',
];

const ANTROPOMETRIA: Array<{ label: string; n: string; d: boolean }> = [
  { label: 'Talla (m)', n: 'talla', d: false }, { label: 'Peso (kg)', n: 'peso', d: false },
  { label: 'IMC (kg/m²)', n: 'imc', d: true }, { label: 'Peso ideal/PAO (kg)', n: 'peso_fao', d: false },
  { label: 'Circ. Muñeca (cm)', n: 'muneca', d: true }, { label: 'Diámetro de codo (cm)', n: 'codo', d: true },
  { label: 'Circ. Brazo (cm)', n: 'brazo', d: true }, { label: 'Circ. Abdominal (cm)', n: 'abd', d: true },
  { label: 'Circ. Cintura (cm)', n: 'cintura', d: false }, { label: 'Circ. Cadera (cm)', n: 'cadera', d: false },
  { label: 'ICC', n: 'icc', d: true }, { label: 'PCB (mm)', n: 'pcb', d: true },
  { label: 'PCT (mm)', n: 'pct', d: true }, { label: 'PCSe (mm)', n: 'pcse', d: true },
  { label: 'PCSi (mm)', n: 'pcsi', d: true }, { label: '% Grasa, Siri (%/kg)', n: 'grasa_siri', d: true },
  { label: '% Grasa, InBody (%/kg)', n: 'grasa_inb', d: true }, { label: 'IMG, con InBody (kgMG/m²)', n: 'img_inb', d: true },
  { label: 'MLG (kg)', n: 'mlg', d: false }, { label: 'IMLG, con (kgMLG/m²)', n: 'imlg', d: true },
  { label: 'cAMB (cm²)', n: 'camb', d: true }, { label: 'MMT, InBody (%/kg)', n: 'mmt_inb', d: true },
  { label: 'IMEA, con InBody (kgMM/m²)', n: 'imea_inb', d: true }, { label: 'ACT (L)', n: 'act', d: false },
  { label: 'Grasa visceral (L)', n: 'grasa_visc', d: true },
];

const SIGNOS_VITALES = ['Tensión arterial (mmHg)', 'Frecuencia respiratoria (rpm)', 'Frecuencia cardiaca (lpm)', 'Temperatura (°C)', 'SO₂'];

const HALLAZGOS_FISICOS = [
  'Hallazgos generales', 'Adiposidad', 'Huesos', 'Sistema cardiovascular-respiratorio', 'Sistema digestivo',
  'Edema', 'Extremidades', 'Ojos', 'Pelo', 'Cabeza', 'Manos y uñas', 'Boca', 'Músculos', 'Cuello',
  'Piel', 'Dientes', 'Garganta y deglución', 'Lengua',
];
const hallazgoKey = (h: string) => h.replace(/\s+/g, '_').replace(/\//g, '_').toLowerCase();

const GRUPOS_PORCIONES_P3 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA ___', 'Lácteo ___', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP3 = (g: string) => g.replace(/\s+/g, '_').replace(/___/g, '').toLowerCase();

const GRUPOS_CALC_P4 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP4 = (g: string) => g.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
const CALC_COLS = ['des', 'cm', 'com', 'cv', 'cena', 'rac', 'kcal', 'prot', 'lip', 'hco'];
const CALC_COLS_LABELS: Record<string, string> = {
  des: 'DES', cm: 'CM', com: 'COM', cv: 'CV', cena: 'CENA', rac: 'RACIONES',
  kcal: 'ENERGÍA', prot: 'PROTEÍNA', lip: 'LÍPIDOS', hco: 'HCO',
};

const distribKey = (v: string) => v.toLowerCase().replace('í', 'i').replace('é', 'e');

const ALIMENTOS_OLVIDADOS = [
  'Agua', 'Café', 'Té', 'Leche', 'Azúcar en agua, café o té', 'Jugos', 'Agua de sabor', 'Refresco',
  'SAL', 'Chile piquín', 'Caramelos', 'Chicle', 'Galletas', 'Pastel', 'Aguacate', 'Gelatina',
  'Nieve o helado', 'Oleaginosas (Cacahuates, nueces, pistaches)', 'Chocolates', 'Papas', 'Palomitas',
  'Frutas', 'TORTILLAS', 'Aceite', 'Mantequilla', 'Crema', 'Salsa verde o roja',
];

const MATRIZ_IMG_IMLG_COLS = [
  'IMG Dimsinuido (<5 H / <7 M)', 'IMG Adecuado (5–9 H / 7–11 M)', 'IMG Adecuado (5–9 H / 7–11 M)', 'IMG Elevado (>9 H / >11 M)',
];

const MATRIZ_IMG_IMLG_ROWS: Array<{ label: string; cells: string[] }> = [
  {
    label: 'IMLG Bajo (<17 H / <15 M)',
    cells: [
      'Caquexia',
      'Desnutrición proteico-energética / Riesgo de sarcopenia por baja masa muscular',
      'Desnutrición proteico-energética / Riesgo de sarcopenia por baja masa muscular',
      'Obesidad preclínica (si no hay Dx previos) / Obesidad clínica (hay Dx previos)',
    ],
  },
  {
    label: 'IMLG Normal (17–23 H / 15–21 M)',
    cells: [
      'Bajo en grasa',
      'Normalidad',
      'Normalidad',
      'Obesidad preclínica (si no hay Dx previos) / Obesidad clínica (hay Dx previos)',
    ],
  },
  {
    label: 'IMLG Alto (23–25 H / 21–23 M)',
    cells: [
      'Atletas de alto rendimiento',
      'Persona físicamente activa',
      'Persona físicamente activa',
      'Sano, metabólicamente funcional (sin Dx previos) / Obesidad clínica (hay Dx previos)',
    ],
  },
];

const MATRIZ_IMG_IMLG_MUY_ALTO: Array<{ label: string; texto: string }> = [
  { label: 'IMLG Muy Alto (25–28 H / 23–25 M)', texto: 'Sospecha de uso de esteroides / Obesidad mórbida' },
  { label: 'IMLG Muy Alto (>28 H / >25 M)', texto: 'Diagnóstico de uso de esteroides / Obesidad mórbida' },
];

const EVALUACION_CUALITATIVA = [
  { text: '¿Incluye todos los nutrimentos esenciales (HC, proteínas, lípidos, vitaminas, minerales y agua)?', res: 'Completa' },
  { text: '¿Los nutrimentos están en proporciones apropiadas entre sí?', res: 'Equilibrada' },
  { text: '¿Los alimentos están libres de microorganismos patógenos, toxinas o contaminantes?', res: 'Inocua' },
  { text: '¿No se consumen en cantidades excesivas ni contienen excesos de sodio, azúcares o grasas trans?', res: 'Equilibrada' },
  { text: '¿Cubre los requerimientos energéticos y nutrimentales del individuo según edad, sexo, actividad física y estado fisiológico?', res: 'Suficiente' },
  { text: '¿Incluye diferentes alimentos dentro de cada grupo alimenticio a lo largo del día o la semana?', res: 'Variada' },
  { text: '¿Evita la monotonía alimentaria?', res: 'Variada' },
  { text: '¿Es acorde a los gustos, cultura, hábitos y disponibilidad económica del individuo?', res: 'Adecuada' },
  { text: '¿Está ajustada a su disponibilidad económica?', res: 'Adecuada' },
];

const NutricionPrimeraConsultaCaptura = forwardRef<FormClinicoHandle, Partial<FormClinicoCallbacks>>((props, ref) => {
  const navigate = useNavigate();
  const {
    formData, updateGlobalData, setFormData, isSaving, yaGuardado, setYaGuardado, doSave, canSave,
  } = useNutritionHistoriaData(props);

  const { confirmarGuardado } = useFormClinicoController(
    {
      formKeyProp: props.formKey,
      state: formData,
      onStateChange: props.onStateChange,
      onBack: props.onBack,
      canSave,
      triggerSave: doSave,
      restoreDraft: (draft) => {
        const d = (draft as any) ?? { pagina_1: {}, pagina_2: {}, pagina_3: {}, pagina_4: {} };
        setFormData({
          ...d,
          pagina_1: { ...d.pagina_1, ...(props.pacienteId != null ? { paciente_id: props.pacienteId } : {}) },
        });
      },
      onGuardarSinFinalizar: () => setYaGuardado(true),
    },
    ref
  );

  const handleVolver = () => {
    const confirmar = window.confirm('¿Deseas salir sin guardar los cambios?');
    if (confirmar) navigate(-1);
  };

  const p1 = formData.pagina_1 || {};
  const p2 = formData.pagina_2 || {};
  const p3 = formData.pagina_3 || {};
  const p4 = formData.pagina_4 || {};

  const set1 = (data: Record<string, any>) => updateGlobalData('pagina_1', data);
  const set2 = (data: Record<string, any>) => updateGlobalData('pagina_2', data);
  const set3 = (data: Record<string, any>) => updateGlobalData('pagina_3', data);
  const set4 = (data: Record<string, any>) => updateGlobalData('pagina_4', data);

  const field1 = (name: string) => ({
    value: (p1[name] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set1({ [name]: e.target.value }),
  });
  const field2 = (name: string) => ({
    value: (p2[name] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set2({ [name]: e.target.value }),
  });
  const field3 = (name: string) => ({
    value: (p3[name] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set3({ [name]: e.target.value }),
  });
  const field4 = (name: string) => ({
    value: (p4[name] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set4({ [name]: e.target.value }),
  });

  const onChange2 = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set2({ [e.target.name]: e.target.value });

  const antropRows: VoInterpRow[] = ANTROPOMETRIA.map(a => ({
    label: a.label, voName: `antrop_${a.n}_vo`, voType: 'number', intName: a.d ? `antrop_${a.n}_int` : undefined,
  }));
  const signosRows: VoInterpRow[] = SIGNOS_VITALES.map(s => ({ label: s, voName: `sv_${s}_vo`, intName: `sv_${s}_int` }));
  const bioqRows: VoInterpRow[] = Array.from({ length: 28 }, (_, i) => ({
    label: { fieldName: `bq_${i}_nom` }, voName: `bq_${i}_vo`, intName: `bq_${i}_int`,
  }));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28">
      <Tabs defaultValue="p1">
        <TabsList>
          <TabsTrigger value="p1">Historia clínica</TabsTrigger>
          <TabsTrigger value="p2">Dieta y antropometría</TabsTrigger>
          <TabsTrigger value="p3">Exploración</TabsTrigger>
          <TabsTrigger value="p4">Intervención</TabsTrigger>
        </TabsList>

        {/* ================= PÁGINA 1 ================= */}
        <TabsContent value="p1" className="space-y-4 mt-4">
          <FormSectionCard title="Datos personales">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Nombre completo</label><Input {...field1('nombre')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Expediente</label><Input value={formatExpediente(p1.paciente_id)} readOnly tabIndex={-1} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Fecha</label><Input {...field1('fecha')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Edad</label><Input {...field1('edad')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">F/N</label><Input {...field1('fn')} /></div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Sexo</label>
                <div className="flex gap-3">
                  {['Fem', 'Mas'].map(v => (
                    <label key={v} className="flex items-center gap-1 text-sm"><input type="radio" name="sexo" checked={p1.sexo === v} onChange={() => set1({ sexo: v })} /> {v}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Edo. civil</label>
                <div className="flex gap-3">
                  {['Soltero', 'Casado'].map(v => (
                    <label key={v} className="flex items-center gap-1 text-sm"><input type="radio" name="civil" checked={p1.civil === v} onChange={() => set1({ civil: v })} /> {v}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ocupación</label><Input {...field1('ocupacion')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Teléfono</label><Input type="tel" inputMode="numeric" {...field1('telefono')} onChange={(e) => set1({ telefono: e.target.value.replace(/\D/g, '') })} /></div>
              <div className="sm:col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Dirección</label><Input {...field1('direccion')} /></div>
            </div>
          </FormSectionCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSectionCard title="Motivos de consulta"><Textarea {...field1('motivos')} className="min-h-20" /></FormSectionCard>
            <FormSectionCard title="Qx o Tx previos"><Textarea {...field1('qx')} className="min-h-20" /></FormSectionCard>
          </div>

          <FormSectionCard title="Antecedentes patológicos heredofamiliares">
            <CheckboxGridSection
              rows={ENFERMEDADES_HEREDO}
              columns={COLS_HEREDO}
              fieldName={(row, ci) => `heredo-${row}-${ci}`}
              formData={p1}
              onChange={(name, checked) => set1({ [name]: checked })}
              otrasRow={{
                value: (p1.otrasHeredo as string) || '',
                onTextChange: (value) => set1({ otrasHeredo: value }),
                fieldName: (ci) => `heredo-otras-${ci}`,
              }}
            />
          </FormSectionCard>

          <FormSectionCard title="Antecedentes patológicos personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ENFERMEDADES_PERSONALES.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!p1[`pers-${item}`]} onChange={e => set1({ [`pers-${item}`]: e.target.checked })} />
                  {item}
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm shrink-0">
                <input type="checkbox" checked={!!p1.otrasPersCheck} onChange={e => set1({ otrasPersCheck: e.target.checked })} />
                Otras
              </label>
              <Input {...field1('otrasPers')} />
            </div>
          </FormSectionCard>

          <FormSectionCard title="Sintomatología">
            <div className="space-y-2">
              {SINTOMAS.map(item => (
                <div key={item} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm flex-1"><input type="checkbox" checked={!!p1[`sintoma-check-${item}`]} onChange={e => set1({ [`sintoma-check-${item}`]: e.target.checked })} />{item}</label>
                  <Input className="w-32" placeholder="Freq./Cant." value={(p1[`sintoma-val-${item}`] as string) || ''} onChange={e => set1({ [`sintoma-val-${item}`]: e.target.value })} />
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Escala de Bristol">
            <div className="flex flex-col items-center gap-3">
              <img src={bristolImg} alt="Escala de Bristol" className="max-h-24 object-contain" onError={e => { e.currentTarget.src = 'https://via.placeholder.com/150x60?text=Bristol+Img'; }} />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <label
                    key={num}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-blue-900/30 text-sm font-bold text-blue-900 has-[:checked]:bg-blue-900 has-[:checked]:text-white"
                  >
                    <input type="radio" name="bristol_scale" checked={p1.bristol === num} onChange={() => set1({ bristol: num })} className="sr-only" />
                    {num}
                  </label>
                ))}
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Antecedentes personales no patológicos">
            <div className="space-y-2">
              {NO_PATOLOGICOS.map(item => (
                <div key={item} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p1[`nopato-check-${item}`]} onChange={e => set1({ [`nopato-check-${item}`]: e.target.checked })} />{item}</label>
                  <Input placeholder="Frecuencia" value={(p1[`nopato-freq-${item}`] as string) || ''} onChange={e => set1({ [`nopato-freq-${item}`]: e.target.value })} />
                  <Input placeholder="Cantidad" value={(p1[`nopato-cant-${item}`] as string) || ''} onChange={e => set1({ [`nopato-cant-${item}`]: e.target.value })} />
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Diagnósticos médicos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[0, 1, 2, 3, 4].map(i => <Textarea key={i} value={(p1[`diag-med-${i}`] as string) || ''} onChange={e => set1({ [`diag-med-${i}`]: e.target.value })} className="min-h-14" />)}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Medicamentos / Dosis">
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input placeholder="Medicamento" value={(p1[`med-nom-${i}`] as string) || ''} onChange={e => set1({ [`med-nom-${i}`]: e.target.value })} />
                  <Input placeholder="Dosis" value={(p1[`med-dos-${i}`] as string) || ''} onChange={e => set1({ [`med-dos-${i}`]: e.target.value })} />
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Ejercicio">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
              <span className="text-sm font-medium text-slate-600">Realiza ejercicio</span>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={!!p1.ejercicio_realiza_no} onChange={e => set1({ ejercicio_realiza_no: e.target.checked })} /> No</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={!!p1.ejercicio_realiza_si} onChange={e => set1({ ejercicio_realiza_si: e.target.checked })} /> Sí</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={!!p1.ejercicio_aerobico} onChange={e => set1({ ejercicio_aerobico: e.target.checked })} /> Aeróbico</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={!!p1.ejercicio_anaerobico} onChange={e => set1({ ejercicio_anaerobico: e.target.checked })} /> Anaeróbico</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">¿Cuál?</label><Input {...field1('ejercicioCual')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Frecuencia</label><Input {...field1('frecuencia')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Intensidad</label><Input {...field1('intensidad')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Tiempo</label><Input {...field1('tiempo')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Volumen</label><Input {...field1('volumen')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Progresión</label><Input {...field1('progresion')} /></div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Antecedentes gineco-obstétricos">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">G</label><Input {...field1('g')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">P</label><Input {...field1('p')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">C</label><Input {...field1('c')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">A</label><Input {...field1('a')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">FUM</label><Input {...field1('fum')} /></div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Embarazo</label>
                <div className="flex items-center gap-3 h-9">
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.embarazo_no} onChange={e => set1({ embarazo_no: e.target.checked })} /> No</label>
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.embarazo_si} onChange={e => set1({ embarazo_si: e.target.checked })} /> Sí</label>
                </div>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">SDG</label><Input {...field1('sdg')} /></div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Remplazo hormonal</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.hormo_no} onChange={e => set1({ hormo_no: e.target.checked })} /> No</label>
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.hormo_si} onChange={e => set1({ hormo_si: e.target.checked })} /> Sí</label>
                </div>
                <Input {...field1('hormo')} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Anticonceptivos</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.anti_no} onChange={e => set1({ anti_no: e.target.checked })} /> No</label>
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!p1.anti_si} onChange={e => set1({ anti_si: e.target.checked })} /> Sí</label>
                </div>
                <Input {...field1('anti')} />
              </div>
            </div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 2 ================= */}
        <TabsContent value="p2" className="space-y-4 mt-4">
          <FormSectionCard title="Aspectos dietéticos">
            <div className="space-y-2">
              {['alergias', 'intolerancias', 'preferencias'].map(name => (
                <div key={name} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_2fr] gap-2 items-center">
                  <span className="text-sm capitalize">{name.replace(/_/g, ' ')}</span>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_no`]} onChange={onChange2} name={`${name}_no`} /> No</label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_si`]} onChange={onChange2} name={`${name}_si`} /> Sí</label>
                  <Input placeholder="¿Cuál?" name={`${name}_txt`} value={(p2[`${name}_txt`] as string) || ''} onChange={onChange2} />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Alimentos que no le agradan o no acostumbre</label>
                <Input {...field2('desagrados')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input placeholder="Comidas al día" {...field2('comidas_dia')} />
                <Input placeholder="Fuertes" {...field2('comidas_fuertes')} />
                <Input placeholder="Colaciones" {...field2('comidas_col')} />
                <Input placeholder="¿Quién prepara sus alimentos en su casa?" {...field2('quien_prepara')} />
              </div>
              {['modifico_alim', 'dieta_previa', 'alim_animo', 'laxantes', 'meds_peso'].map(name => (
                <div key={name} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_2fr] gap-2 items-center">
                  <span className="text-sm capitalize">{name.replace(/_/g, ' ')}</span>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_no`]} onChange={onChange2} name={`${name}_no`} /> No</label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_si`]} onChange={onChange2} name={`${name}_si`} /> Sí</label>
                  <Input placeholder="Cómo/Cuál" name={`${name}_txt`} value={(p2[`${name}_txt`] as string) || ''} onChange={onChange2} />
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Frecuencia de consumo (veces por semana)">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALIMENTOS_FRECUENCIA.map(a => (
                <div key={a} className="space-y-1">
                  <label className="text-[11px] text-slate-500">{a}</label>
                  <Input type="number" name={`freq_${a}`} value={(p2[`freq_${a}`] as string) || ''} onChange={onChange2} className="h-8 text-xs" />
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Antropometría">
            <VoInterpretacionTable rows={antropRows} formData={p2} onChange={onChange2} />
            <VoInterpretacionMobile rows={antropRows} formData={p2} onChange={onChange2} />
            <div className="mt-3 space-y-1"><label className="text-xs font-medium text-slate-600">Interpretación antropométrica</label><Textarea {...field2('int_antrop')} className="min-h-16" /></div>
          </FormSectionCard>

          <FormSectionCard title="Signos Vitales">
            <VoInterpretacionTable rows={signosRows} formData={p2} onChange={onChange2} />
            <VoInterpretacionMobile rows={signosRows} formData={p2} onChange={onChange2} />
          </FormSectionCard>

          <FormSectionCard title="Parámetros bioquímicos">
            <VoInterpretacionTable rows={bioqRows} formData={p2} onChange={onChange2} />
            <VoInterpretacionMobile rows={bioqRows} formData={p2} onChange={onChange2} />
            <div className="mt-3 space-y-1"><label className="text-xs font-medium text-slate-600">Interpretación bioquímica</label><Textarea {...field2('int_bioq')} className="min-h-16" /></div>
          </FormSectionCard>

          <FormSectionCard title="Solicitud de análisis">
            <div className="flex flex-wrap gap-4">
              {['Química Sanguínea', 'EGO', 'Biometría hemática'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p2[`sol_${s}`]} onChange={onChange2} name={`sol_${s}`} />{s}</label>
              ))}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p2.sol_otro} onChange={onChange2} name="sol_otro" />Otro</label>
              <Input placeholder="¿Cuál?" {...field2('sol_otro_txt')} className="w-40" />
            </div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 3 ================= */}
        <TabsContent value="p3" className="space-y-4 mt-4">
          <FormSectionCard
            title="Matriz IMG/IMLG"
            description="Referencia para determinar el diagnóstico — Franssen FM, et al. J Am Med Dir Assoc. 2014;15(6):448-53. Kyle UG, et al. Clin Nutr. 2004;23(6):1226-43."
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-normal">IMLG (kgMG/est²)</TableHead>
                    {MATRIZ_IMG_IMLG_COLS.map((c, i) => (
                      <TableHead key={i} className="whitespace-normal text-xs">{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MATRIZ_IMG_IMLG_ROWS.map(row => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium whitespace-normal text-xs">{row.label}</TableCell>
                      {row.cells.map((c, i) => (
                        <TableCell key={i} className="whitespace-normal text-xs">{c}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {MATRIZ_IMG_IMLG_MUY_ALTO.map(row => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium whitespace-normal text-xs">{row.label}</TableCell>
                      <TableCell colSpan={4} className="whitespace-normal text-xs font-medium text-center">{row.texto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Diagnóstico Matriz IMG/IMLG">
            <Textarea {...field3('diag_matriz_imlo_img')} className="min-h-16" />
          </FormSectionCard>

          <FormSectionCard title="Hallazgos físicos orientados a Nut" description="DEN: Deficiencia o exceso en nutrimento.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HALLAZGOS_FISICOS.map(h => {
                const key = hallazgoKey(h);
                return (
                  <div key={h} className="grid grid-cols-[1fr_auto] gap-2 items-center border border-slate-100 rounded-lg p-2">
                    <p className="text-xs font-bold text-slate-700">{h}</p>
                    <Input placeholder="DEN" className="w-24 h-8 text-xs" value={(p3[`hallazgo_${key}_den`] as string) || ''} onChange={e => set3({ [`hallazgo_${key}_den`]: e.target.value })} />
                  </div>
                );
              })}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Recordatorio de 24 horas">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
              <div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Input placeholder="Fecha" {...field3('rec_fecha')} />
                  <Input placeholder="Hora" {...field3('rec_hora')} />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="grid grid-cols-[auto_1fr] gap-2">
                      <Input placeholder="Hora" className="w-24" value={(p3[`rec_hora_${i}`] as string) || ''} onChange={e => set3({ [`rec_hora_${i}`]: e.target.value })} />
                      <Textarea placeholder="Contenido (platillo: cantidad y alimento)" value={(p3[`rec_contenido_${i}`] as string) || ''} onChange={e => set3({ [`rec_contenido_${i}`]: e.target.value })} className="min-h-10" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-slate-100 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">Alimentos olvidados</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {ALIMENTOS_OLVIDADOS.map(a => <li key={a}>{a}</li>)}
                </ul>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Consumo de porciones">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Grupo</TableHead><TableHead>Porciones</TableHead><TableHead>Energía</TableHead><TableHead>Proteína</TableHead><TableHead>Lípidos</TableHead><TableHead>HCO</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {GRUPOS_PORCIONES_P3.map(g => {
                    const gk = grupoKeyP3(g);
                    return (
                      <TableRow key={g}>
                        <TableCell className="font-medium">{g}</TableCell>
                        {['porciones', 'energia', 'proteina', 'lipidos', 'hco'].map(col => (
                          <TableCell key={col}><Input type="number" className="h-8 text-xs" value={(p3[`porcion_${gk}_${col}`] as string) || ''} onChange={e => set3({ [`porcion_${gk}_${col}`]: e.target.value })} /></TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    {['porciones', 'energia', 'proteina', 'lipidos', 'hco'].map(col => (
                      <TableCell key={col}><Input type="number" className="h-8 text-xs" value={(p3[`porcion_total_${col}`] as string) || ''} onChange={e => set3({ [`porcion_total_${col}`]: e.target.value })} /></TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="block sm:hidden space-y-3">
              {[...GRUPOS_PORCIONES_P3, 'Total'].map(g => {
                const gk = g === 'Total' ? 'total' : grupoKeyP3(g);
                return (
                  <div key={g} className="border border-slate-200 rounded-lg p-2.5">
                    <p className="text-xs font-bold mb-2">{g}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['porciones', 'energia', 'proteina', 'lipidos', 'hco'].map(col => (
                        <div key={col}>
                          <label className="text-[10px] text-slate-500 capitalize">{col}</label>
                          <Input type="number" className="h-8 text-xs" value={(p3[`porcion_${gk}_${col}`] as string) || ''} onChange={e => set3({ [`porcion_${gk}_${col}`]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Distribución nutrimental actual">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Macronutrimento</TableHead><TableHead>%</TableHead><TableHead>Kcal</TableHead><TableHead>Gramos</TableHead><TableHead>g/kg</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {['Proteína', 'HCO', 'Lípidos'].map(macro => {
                    const mk = distribKey(macro);
                    return (
                      <TableRow key={macro}>
                        <TableCell className="font-medium">{macro}</TableCell>
                        {['pct', 'kcal', 'g', 'gkg'].map(col => (
                          <TableCell key={col}><Input type="number" className="h-8 text-xs w-20" value={(p3[`dn_${mk}_${col}`] as string) || ''} onChange={e => set3({ [`dn_${mk}_${col}`]: e.target.value })} /></TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-bold">Totales</TableCell>
                    <TableCell className="text-xs text-slate-500">100%</TableCell>
                    <TableCell><Input type="number" className="h-8 text-xs w-20" value={(p3.dn_total_kcal as string) || ''} onChange={e => set3({ dn_total_kcal: e.target.value })} /></TableCell>
                    <TableCell><Input type="number" className="h-8 text-xs w-20" value={(p3.dn_total_g as string) || ''} onChange={e => set3({ dn_total_g: e.target.value })} /></TableCell>
                    <TableCell className="text-[10px] text-slate-500">kcal/kgPA/d</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="block sm:hidden space-y-3">
              {['Proteína', 'HCO', 'Lípidos'].map(macro => {
                const mk = distribKey(macro);
                return (
                  <div key={macro} className="border border-slate-200 rounded-lg p-2.5">
                    <p className="text-xs font-bold mb-2">{macro}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[['pct', '%'], ['kcal', 'Kcal'], ['g', 'Gramos'], ['gkg', 'g/kg']].map(([col, label]) => (
                        <div key={col}>
                          <label className="text-[10px] text-slate-500">{label}</label>
                          <Input type="number" className="h-8 text-xs" value={(p3[`dn_${mk}_${col}`] as string) || ''} onChange={e => set3({ [`dn_${mk}_${col}`]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="border border-slate-200 rounded-lg p-2.5">
                <p className="text-xs font-bold mb-2">Totales (100%) — kcal/kgPA/d</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-slate-500">Kcal</label><Input type="number" className="h-8 text-xs" value={(p3.dn_total_kcal as string) || ''} onChange={e => set3({ dn_total_kcal: e.target.value })} /></div>
                  <div><label className="text-[10px] text-slate-500">Gramos</label><Input type="number" className="h-8 text-xs" value={(p3.dn_total_g as string) || ''} onChange={e => set3({ dn_total_g: e.target.value })} /></div>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Interpretación de la ingestión actual">
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-bold text-slate-500">
                <span></span><span>Dieta</span><span>% IAN</span>
              </div>
              {['Energía', 'Proteína', 'HCO', 'Lípidos'].map(item => {
                const ik = distribKey(item);
                return (
                  <div key={item} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <span className="text-sm font-medium">{item}</span>
                    <Input placeholder="Dieta" className="w-full sm:w-32 h-8 text-xs" value={(p3[`ian_${ik}_dieta`] as string) || ''} onChange={e => set3({ [`ian_${ik}_dieta`]: e.target.value })} />
                    <Input type="number" placeholder="% IAN" className="w-full sm:w-20 h-8 text-xs" value={(p3[`ian_${ik}_pct`] as string) || ''} onChange={e => set3({ [`ian_${ik}_pct`]: e.target.value })} />
                  </div>
                );
              })}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Evaluación Cualitativa">
            <div className="space-y-2">
              {EVALUACION_CUALITATIVA.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex gap-3 shrink-0">
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p3[`evalcual_${idx}_no`]} onChange={e => set3({ [`evalcual_${idx}_no`]: e.target.checked })} /> No</label>
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p3[`evalcual_${idx}_si`]} onChange={e => set3({ [`evalcual_${idx}_si`]: e.target.checked })} /> Sí</label>
                  </div>
                  <span className="flex-1">{item.text} <span className="text-slate-500">&rarr; <b>{item.res}</b></span></span>
                </div>
              ))}
            </div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 4 ================= */}
        <TabsContent value="p4" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSectionCard title="Diagnósticos Nutricios"><Textarea {...field4('diag')} className="min-h-20" /></FormSectionCard>
            <FormSectionCard title="Objetivo general (SMART)"><Textarea {...field4('objetivo')} className="min-h-20" /></FormSectionCard>
            <FormSectionCard title="Educación Nutricia">
              <div className="flex gap-2 mb-2"><Input placeholder="E-1" className="w-16" {...field4('edu_cont_num')} /><span className="text-xs self-center">Contenido</span></div>
              <Textarea {...field4('edu_contenido')} className="min-h-14 mb-2" />
              <div className="flex gap-2 mb-2"><Input placeholder="E-2" className="w-16" {...field4('edu_app_num')} /><span className="text-xs self-center">Aplicación</span></div>
              <Textarea {...field4('edu_aplicacion')} className="min-h-14" />
            </FormSectionCard>
            <FormSectionCard title="Consejería Nutricia">
              <div className="flex gap-2 mb-2"><Input placeholder="C-1" className="w-16" {...field4('cons_bases_num')} /><span className="text-xs self-center">Bases/Acercamiento Teórico</span></div>
              <Textarea {...field4('cons_bases')} className="min-h-14 mb-2" />
              <div className="flex gap-2 mb-2"><Input placeholder="C-2" className="w-16" {...field4('cons_est_num')} /><span className="text-xs self-center">Estrategias</span></div>
              <Textarea {...field4('cons_estrategias')} className="min-h-14" />
            </FormSectionCard>
          </div>

          <FormSectionCard title="Intervención">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-16">
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2">Indicación de Alimentos/Nutrimentos</p>
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Textarea key={i} value={(p4[`indicacion_${i}`] as string) || ''} onChange={e => set4({ [`indicacion_${i}`]: e.target.value })} className="min-h-10 text-xs" />)}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2">Requerimiento calórico</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!p4.req_ec_pred} onChange={e => set4({ req_ec_pred: e.target.checked })} />Ecuación predictiva</label>
                  <Input placeholder="Nombre de ecuación" {...field4('req_ec_pred_nombre')} className="text-xs h-8" />
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!p4.req_ec_rapida} onChange={e => set4({ req_ec_rapida: e.target.checked })} />Ecuación rápida</label>
                  <Input placeholder="Peso a usar (kg)" {...field4('req_ec_rapida_peso')} className="text-xs h-8" />
                  <Input placeholder="Constante de kcal (kcal/kg/d)" {...field4('req_ec_rapida_kcal_kg')} className="text-xs h-8" />
                  <Input placeholder="Total (kcal)" {...field4('req_total_kcal')} className="text-xs h-8" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2">Cuadro dietosintético</p>
                <div className="space-y-2">
                  {['Proteína', 'HCO', 'Lípidos'].map(m => {
                    const mk = m.toLowerCase().replace('í', 'i');
                    return (
                      <div key={m} className="grid grid-cols-4 gap-1">
                        <span className="text-[10px] col-span-4 font-medium">{m}</span>
                        {['porc', 'kcal', 'g', 'g_kg'].map(col => (
                          <Input key={col} placeholder={col} className="h-8 text-xs" value={(p4[`${mk}_${col}`] as string) || ''} onChange={e => set4({ [`${mk}_${col}`]: e.target.value })} />
                        ))}
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-4 gap-1 pt-1 items-center">
                    <span className="text-[10px] text-slate-500">100%</span>
                    <Input placeholder="Kcal" className="h-8 text-xs" {...field4('total_kcal')} />
                    <Input placeholder="Gramos" className="h-8 text-xs" {...field4('total_g')} />
                    <span className="text-[9px] text-slate-500">kcal/kgPI/d</span>
                  </div>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Cálculo de porciones">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Grupo</TableHead>{CALC_COLS.map(c => <TableHead key={c} className="text-[10px]">{CALC_COLS_LABELS[c]}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {GRUPOS_CALC_P4.map(g => {
                    const gk = grupoKeyP4(g);
                    return (
                      <TableRow key={g}>
                        <TableCell className="font-medium">{g}</TableCell>
                        {CALC_COLS.map(col => <TableCell key={col}><Input className="h-8 text-xs w-16" value={(p4[`calc_${gk}_${col}`] as string) || ''} onChange={e => set4({ [`calc_${gk}_${col}`]: e.target.value })} /></TableCell>)}
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    {['kcal', 'prot', 'lip', 'hco'].map(col => <TableCell key={col}><Input className="h-8 text-xs w-16" value={(p4[`calc_total_${col}`] as string) || ''} onChange={e => set4({ [`calc_total_${col}`]: e.target.value })} /></TableCell>)}
                    <TableCell colSpan={6} />
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">% Adecuación</TableCell>
                    {['kcal', 'prot', 'lip', 'hco'].map(col => <TableCell key={col}><Input className="h-8 text-xs w-16" value={(p4[`calc_adec_${col}`] as string) || ''} onChange={e => set4({ [`calc_adec_${col}`]: e.target.value })} /></TableCell>)}
                    <TableCell colSpan={6} />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="block lg:hidden space-y-3">
              {GRUPOS_CALC_P4.map(g => {
                const gk = grupoKeyP4(g);
                return (
                  <div key={g} className="border border-slate-200 rounded-lg p-2.5">
                    <p className="text-xs font-bold mb-2">{g}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {CALC_COLS.map(col => (
                        <div key={col}>
                          <label className="text-[10px] text-slate-500">{CALC_COLS_LABELS[col]}</label>
                          <Input className="h-8 text-xs" value={(p4[`calc_${gk}_${col}`] as string) || ''} onChange={e => set4({ [`calc_${gk}_${col}`]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="border border-slate-200 rounded-lg p-2.5">
                <p className="text-xs font-bold mb-2">Total / % Adecuación</p>
                <div className="grid grid-cols-2 gap-2">
                  {['kcal', 'prot', 'lip', 'hco'].map(col => (
                    <div key={col}>
                      <label className="text-[10px] text-slate-500 uppercase">Total {col}</label>
                      <Input className="h-8 text-xs" value={(p4[`calc_total_${col}`] as string) || ''} onChange={e => set4({ [`calc_total_${col}`]: e.target.value })} />
                    </div>
                  ))}
                  {['kcal', 'prot', 'lip', 'hco'].map(col => (
                    <div key={col}>
                      <label className="text-[10px] text-slate-500 uppercase">% Adec. {col}</label>
                      <Input className="h-8 text-xs" value={(p4[`calc_adec_${col}`] as string) || ''} onChange={e => set4({ [`calc_adec_${col}`]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Menú del día">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {[['desayuno', 'Desayuno'], ['cm', 'C.M.'], ['comida', 'Comida'], ['cv', 'C.V.'], ['cena', 'Cena']].map(([key, label]) => (
                <div key={key} className="space-y-1"><label className="text-xs font-medium text-slate-600">{label}</label><Textarea value={(p4[`menu_${key}`] as string) || ''} onChange={e => set4({ [`menu_${key}`]: e.target.value })} className="min-h-16 text-xs" /></div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Firmas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Nombre, matrícula y firma del alumno</label><Input {...field4('firma_alumno')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Nombre, cédula y firma del docente responsable</label><Input {...field4('firma_docente')} /></div>
            </div>
          </FormSectionCard>
        </TabsContent>
      </Tabs>

      <FormClinicoActionBar
        isSaving={isSaving}
        yaGuardado={yaGuardado}
        showVolver={!props.formKey}
        onVolver={handleVolver}
        onConfirmarGuardado={confirmarGuardado}
        guardarLabel="Guardar"
      />
    </div>
  );
});

export default NutricionPrimeraConsultaCaptura;
