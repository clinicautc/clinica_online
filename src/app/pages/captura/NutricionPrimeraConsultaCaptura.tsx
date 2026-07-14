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
 * Nota de alcance: varios grupos de checkboxes/inputs del documento original
 * (Página 1 "Ejercicio"/"Antecedentes gineco-obstétricos": checkboxes
 * No/Sí decorativos; Página 3 "Distribución nutrimental actual",
 * "Interpretación % IAN", "Evaluación Cualitativa") nunca tuvieron
 * `name`/`value`/`onChange` en el original — son un bug preexistente, no
 * introducido aquí. Se replican tal cual (deshabilitados, sin persistir)
 * para no ampliar el alcance de esta fase corrigiendo comportamiento no
 * relacionado con responsive design.
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
import type { FormClinicoHandle, FormClinicoCallbacks } from '../../lib/types/formClinico';

const ENFERMEDADES_HEREDO = [
  'Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales',
];
const COLS_HEREDO = ['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'];

const ENFERMEDADES_PERSONALES = [
  'Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales',
];

const SINTOMAS = [
  'Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito',
  'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia',
];

const NO_PATOLOGICOS = ['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'];

const ALIMENTOS_FRECUENCIA = [
  'Verduras', 'Fruta²', 'Cereal s/g', 'Pan dulce nat', 'Pan dulce UP', 'Galletas', 'Leguminosas',
  'Carne de res', 'Carne de cerdo', 'Carne de pollo', 'Pavo', 'Pescados', 'Mariscos', 'Huevo',
  'Prod. anim UP', 'Quesos bcos', 'Quesos amr', 'Embutidos', 'Leche s/sab', 'Yogurt s/sab',
  'Leche UP', 'Yogurt UP', 'Oleaginosas', 'Aceites', 'Mantequilla', 'Margarina', 'Refresco',
  'Agua sab UP', 'Jugos nat', 'Jugos UP', 'Helado', 'Nieve', 'Gelatinas', 'Aguas frutas', 'Té',
  'Café', 'Agua natural', 'Papas fritas', 'Garnachas com', 'Garnachas fri',
];

const ANTROPOMETRIA: Array<{ label: string; n: string; d: boolean }> = [
  { label: 'Talla (m)', n: 'talla', d: false }, { label: 'Peso (kg)', n: 'peso', d: false },
  { label: 'IMC (kg/m²)', n: 'imc', d: true }, { label: 'Peso Ideal FAO (kg)', n: 'peso_fao', d: false },
  { label: 'Circ. Muñeca (cm)', n: 'muneca', d: true }, { label: 'Diámetro codo (cm)', n: 'codo', d: true },
  { label: 'Circ. Brazo (cm)', n: 'brazo', d: true }, { label: 'Circ. Abd (cm)', n: 'abd', d: true },
  { label: 'Circ. Cintura (cm)', n: 'cintura', d: false }, { label: 'Circ. Cadera (cm)', n: 'cadera', d: false },
  { label: 'ICC', n: 'icc', d: true }, { label: 'PCB (mm)', n: 'pcb', d: true },
  { label: 'PCT (mm)', n: 'pct', d: true }, { label: 'PCSe (mm)', n: 'pcse', d: true },
  { label: 'PCSi (mm)', n: 'pcsi', d: true }, { label: '% Grasa SIRI', n: 'grasa_siri', d: true },
  { label: '% Grasa InBody', n: 'grasa_inb', d: true }, { label: 'IMG InBody', n: 'img_inb', d: true },
  { label: 'MLG (kg)', n: 'mlg', d: false }, { label: 'IMLG (kg/m²)', n: 'imlg', d: true },
  { label: 'cAMB (cm²)', n: 'camb', d: true }, { label: 'MMT InBody', n: 'mmt_inb', d: true },
  { label: 'IMEA InBody', n: 'imea_inb', d: true }, { label: 'ACT (L)', n: 'act', d: false },
  { label: 'Grasa Visc (L)', n: 'grasa_visc', d: true },
];

const SIGNOS_VITALES = ['T. Arterial', 'F. Resp (rpm)', 'F. Card (lpm)', 'Temp (°C)', 'SO₂'];

const HALLAZGOS_FISICOS = [
  'Hallazgos grales', 'Adiposidad', 'Músculo', 'Cardiovascular', 'Respiratorio', 'Digestivo',
  'Edema', 'Extremidades', 'Ojos', 'Pelo', 'Cabeza', 'Manos y uñas', 'Boca / Lengua',
  'Cuello / Piel', 'Dientes', 'Garganta',
];
const hallazgoKey = (h: string) => h.replace(/\s+/g, '_').replace(/\//g, '_').toLowerCase();

const GRUPOS_PORCIONES_P3 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA ___', 'Lácteo ___', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP3 = (g: string) => g.replace(/\s+/g, '_').replace(/___/g, '').toLowerCase();

const GRUPOS_CALC_P4 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP4 = (g: string) => g.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
const CALC_COLS = ['des', 'cm', 'com', 'cv', 'cena', 'rac', 'kcal', 'prot', 'lip', 'hco'];

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
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Expediente</label><Input {...field1('expediente')} /></div>
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
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Teléfono</label><Input {...field1('telefono')} /></div>
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
            />
            <div className="mt-3 space-y-1"><label className="text-xs font-medium text-slate-600">Otras</label><Input {...field1('otrasHeredo')} /></div>
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
            <div className="mt-3 space-y-1"><label className="text-xs font-medium text-slate-600">Otras</label><Input {...field1('otrasPers')} /></div>
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
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <label key={num} className="flex flex-col items-center text-xs gap-1"><input type="radio" name="bristol_scale" checked={p1.bristol === num} onChange={() => set1({ bristol: num })} />{num}</label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="¿Cuál?" {...field1('ejercicioCual')} />
              <Input placeholder="Frecuencia" {...field1('frecuencia')} />
              <Input placeholder="Intensidad" {...field1('intensidad')} />
              <Input placeholder="Tiempo" {...field1('tiempo')} />
              <Input placeholder="Volumen" {...field1('volumen')} />
              <Input placeholder="Progresión" {...field1('progresion')} />
            </div>
          </FormSectionCard>

          <FormSectionCard title="Antecedentes gineco-obstétricos">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="G" {...field1('g')} /><Input placeholder="P" {...field1('p')} /><Input placeholder="C" {...field1('c')} /><Input placeholder="A" {...field1('a')} />
              <Input placeholder="FUM" {...field1('fum')} /><Input placeholder="SDG" {...field1('sdg')} />
              <Input placeholder="Remplazo hormonal" {...field1('hormo')} /><Input placeholder="Anticonceptivos" {...field1('anti')} />
            </div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 2 ================= */}
        <TabsContent value="p2" className="space-y-4 mt-4">
          <FormSectionCard title="Aspectos dietéticos">
            <div className="space-y-2">
              {['alergias', 'intolerancias', 'preferencias', 'modifico_alim', 'dieta_previa', 'alim_animo', 'laxantes', 'meds_peso'].map(name => (
                <div key={name} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_2fr] gap-2 items-center">
                  <span className="text-sm capitalize">{name.replace(/_/g, ' ')}</span>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_no`]} onChange={onChange2} name={`${name}_no`} /> No</label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!p2[`${name}_si`]} onChange={onChange2} name={`${name}_si`} /> Sí</label>
                  <Input placeholder="¿Cuál?" name={`${name}_txt`} value={(p2[`${name}_txt`] as string) || ''} onChange={onChange2} />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <Input placeholder="Alimentos que no le agradan" {...field2('desagrados')} />
                <Input placeholder="¿Quién prepara sus alimentos?" {...field2('quien_prepara')} />
                <Input placeholder="Comidas al día" {...field2('comidas_dia')} />
                <Input placeholder="Comidas fuertes" {...field2('comidas_fuertes')} />
                <Input placeholder="Colaciones" {...field2('comidas_col')} />
              </div>
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
          <FormSectionCard title="Diagnóstico Matriz IMLO/IMG">
            <Textarea {...field3('diag_matriz_imlo_img')} className="min-h-16" />
          </FormSectionCard>

          <FormSectionCard title="Hallazgos físicos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HALLAZGOS_FISICOS.map(h => {
                const key = hallazgoKey(h);
                return (
                  <div key={h} className="space-y-1 border border-slate-100 rounded-lg p-2">
                    <p className="text-xs font-bold text-slate-700">{h}</p>
                    <Textarea placeholder="Descripción" value={(p3[`hallazgo_${key}_desc`] as string) || ''} onChange={e => set3({ [`hallazgo_${key}_desc`]: e.target.value })} className="min-h-10 text-xs" />
                    <Textarea placeholder="Denominación" value={(p3[`hallazgo_${key}_den`] as string) || ''} onChange={e => set3({ [`hallazgo_${key}_den`]: e.target.value })} className="min-h-10 text-xs" />
                  </div>
                );
              })}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Recordatorio de 24 horas">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Input placeholder="Fecha" {...field3('rec_fecha')} />
              <Input placeholder="Hora" {...field3('rec_hora')} />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="grid grid-cols-[auto_1fr] gap-2">
                  <Input placeholder="Hora" className="w-24" value={(p3[`rec_hora_${i}`] as string) || ''} onChange={e => set3({ [`rec_hora_${i}`]: e.target.value })} />
                  <Textarea placeholder="Contenido" value={(p3[`rec_contenido_${i}`] as string) || ''} onChange={e => set3({ [`rec_contenido_${i}`]: e.target.value })} className="min-h-10" />
                </div>
              ))}
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

          <FormSectionCard
            title="Distribución nutrimental actual / Interpretación % IAN / Evaluación Cualitativa"
            description="Estos campos nunca tuvieron persistencia real en el documento original (bug preexistente) — se muestran deshabilitados para no aparentar una función que nunca existió."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-50">
              <Input disabled placeholder="Proteína % / Kcal / g / g·kg" />
              <Input disabled placeholder="HCO % / Kcal / g / g·kg" />
              <Input disabled placeholder="Lípidos % / Kcal / g / g·kg" />
              <Input disabled placeholder="Interpretación % IAN — Dieta" />
              <Input disabled placeholder="Interpretación % IAN — %" />
              <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" disabled />Evaluación cualitativa (No/Sí)</label>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2">Indicación de Alimentos/Nutrimentos</p>
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Textarea key={i} value={(p4[`indicacion_${i}`] as string) || ''} onChange={e => set4({ [`indicacion_${i}`]: e.target.value })} className="min-h-10 text-xs" />)}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2">Requerimiento calórico</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!p4.req_ec_pred} onChange={e => set4({ req_ec_pred: e.target.checked })} />Ecuación predictiva</label>
                  <Input placeholder="Nombre" {...field4('req_ec_pred_nombre')} className="text-xs h-8" />
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!p4.req_ec_rapida} onChange={e => set4({ req_ec_rapida: e.target.checked })} />Fórmula rápida</label>
                  <Input placeholder="Peso" {...field4('req_ec_rapida_peso')} className="text-xs h-8" />
                  <Input placeholder="Kcal/kg" {...field4('req_ec_rapida_kcal_kg')} className="text-xs h-8" />
                  <Input placeholder="Total Kcal" {...field4('req_total_kcal')} className="text-xs h-8" />
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
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <Input placeholder="Total kcal" className="h-8 text-xs" {...field4('total_kcal')} />
                    <Input placeholder="Total g" className="h-8 text-xs" {...field4('total_g')} />
                  </div>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Cálculo de porciones">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Grupo</TableHead>{CALC_COLS.map(c => <TableHead key={c} className="uppercase text-[10px]">{c}</TableHead>)}</TableRow>
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
                          <label className="text-[10px] text-slate-500 uppercase">{col}</label>
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
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Firma alumno</label><Input {...field4('firma_alumno')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Firma docente</label><Input {...field4('firma_docente')} /></div>
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
