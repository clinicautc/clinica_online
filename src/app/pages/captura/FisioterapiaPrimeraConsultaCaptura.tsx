/**
 * ============================================================================
 * ARCHIVO: FisioterapiaPrimeraConsultaCaptura.tsx
 * PROPÓSITO: Interfaz de captura responsive para la Valoración Inicial de
 * Fisioterapia (primera consulta). Reemplaza a PhysiotherapyMasterForm.tsx
 * como componente de captura en vivo — PhysiotherapyMasterForm.tsx se
 * conserva como representación documental (hoja impresa en mm, solo
 * lectura). Comparten los mismos nombres de campo y la misma fuente de
 * datos (usePhysiotherapyValoracionData) — ver
 * docs/RESPONSIVE_DESIGN_STRATEGY.md sección 9.
 *
 * Los marcadores corporales usan coordenadas porcentuales (BodyMarkerDiagram
 * + useBodyMarkers) en vez de píxeles absolutos como el componente viejo —
 * ver la sección 3 del plan de Fase 5 para el shim de compatibilidad con
 * marcadores legados en px.
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
import BodyMarkerDiagram from '../../components/formClinico/BodyMarkerDiagram';
import CheckboxGridSection from './CheckboxGridSection';
import caritasImg from '../Caritas.png';
import Humano1Img from '../Humano_1.png';
import Humano2Img from '../Humano_2.png';
import { usePhysiotherapyValoracionData } from '../../hooks/formClinico/usePhysiotherapyValoracionData';
import { useFormClinicoController } from '../../hooks/formClinico/useFormClinicoController';
import type { FormClinicoHandle, FormClinicoCallbacks } from '../../lib/types/formClinico';

const ENFERMEDADES_HEREDO = [
  'Diabetes Mellitus', 'Obesidad o sobrepeso', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas',
];
const COLS_HEREDO = ['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'];
const ENFERMEDADES_PERSONALES = ['Diabetes', 'Obesidad', 'Hipertensión', 'Renales', 'Endocrinas', 'Tiroidea', 'Fracturas', 'Esguinces'];

const EXPLORACION_FISICA_ROWS: Array<{ obs?: { label: string; name: string }; ins?: { label: string; name: string }; pal?: { label: string; name: string } }> = [
  { obs: { label: 'Marcha', name: 'obs_marcha' }, ins: { label: 'Cicatriz', name: 'ins_cicatriz' }, pal: { label: 'Temperatura', name: 'pal_temp' } },
  { ins: { label: 'Hematoma', name: 'ins_hematoma' }, pal: { label: 'Contractura', name: 'pal_contractura' } },
  { obs: { label: 'Movilidad', name: 'obs_movilidad' }, ins: { label: 'Edema', name: 'ins_edema' } },
  { ins: { label: 'Tumefacción', name: 'ins_tumefaccion' }, pal: { label: 'Dolor', name: 'pal_dolor' } },
  { obs: { label: 'Agilidad', name: 'obs_agilidad' }, ins: { label: 'Otro', name: 'ins_otro' }, pal: { label: 'Otro', name: 'pal_otro' } },
];

const ZONA_ROWS: Array<{ label: string; options: string[] }> = [
  { label: 'Color', options: ['Hematoma', 'Equimosis'] },
  { label: 'Estado', options: ['Seca', 'Brillante'] },
  { label: 'Edema', options: ['Leve', 'Moderado'] },
  { label: 'Cicatriz', options: ['Hipertrófica', 'Queloide'] },
  { label: 'Heridas', options: ['Escaras', 'Tumefacciones'] },
];

const REFLEJOS = ['Bicipital', 'Tricipital', 'Rotuliano', 'Aquileo'];
const MOVIMIENTOS = ['Flexión', 'Extensión', 'Abducción', 'Rot. Interna', 'Rot. Externa', 'Desv. Radial', 'Desv. Cubital'];

const FisioterapiaPrimeraConsultaCaptura = forwardRef<FormClinicoHandle, Partial<FormClinicoCallbacks>>((props, ref) => {
  const navigate = useNavigate();
  const {
    formData, updateGlobalData, setFormData, isSaving, yaGuardado, setYaGuardado, doSave, canSave,
  } = usePhysiotherapyValoracionData(props);

  const { confirmarGuardado } = useFormClinicoController(
    {
      formKeyProp: props.formKey,
      state: formData,
      onStateChange: props.onStateChange,
      onBack: props.onBack,
      canSave,
      triggerSave: doSave,
      restoreDraft: (draft) => {
        const d = (draft as any) ?? { pagina_1: {}, pagina_2: { markers: [] }, pagina_3: { markers: [] } };
        setFormData({
          ...d,
          pagina_1: { ...d.pagina_1, ...(props.pacienteId != null ? { paciente_id: props.pacienteId } : {}) },
        });
      },
      onGuardarSinFinalizar: () => setYaGuardado(true),
    },
    ref
  );

  const handleVolver = () => navigate(-1);

  const p1 = formData.pagina_1 || {};
  const p2 = formData.pagina_2 || {};
  const p3 = formData.pagina_3 || {};

  const set1 = (data: Record<string, any>) => updateGlobalData('pagina_1', data);
  const set2 = (data: Record<string, any>) => updateGlobalData('pagina_2', data);
  const set3 = (data: Record<string, any>) => updateGlobalData('pagina_3', data);

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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28">
      <Tabs defaultValue="p1">
        <TabsList>
          <TabsTrigger value="p1">Historia clínica</TabsTrigger>
          <TabsTrigger value="p2">Objetivos y exploración</TabsTrigger>
          <TabsTrigger value="p3">Neuromuscular y movilidad</TabsTrigger>
        </TabsList>

        {/* ================= PÁGINA 1 ================= */}
        <TabsContent value="p1" className="space-y-4 mt-4">
          <FormSectionCard title="Datos personales">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Nombre completo</label><Input {...field1('nombre_completo')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Edad</label><Input {...field1('edad')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Fecha</label><Input {...field1('fecha')} /></div>
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
                <div className="flex gap-3 flex-wrap">
                  {['Soltero', 'Casado', 'Viuda(o)'].map(v => (
                    <label key={v} className="flex items-center gap-1 text-sm"><input type="radio" name="civil" checked={p1.civil === v} onChange={() => set1({ civil: v })} /> {v}</label>
                  ))}
                </div>
              </div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Ocupación</label><Input {...field1('ocupacion')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">F/N</label><Input {...field1('fn')} /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Teléfono</label><Input type="tel" inputMode="numeric" maxLength={10} {...field1('telefono')} onChange={(e) => set1({ telefono: e.target.value.replace(/\D/g, '') })} /></div>
              <div className="sm:col-span-2 space-y-1"><label className="text-xs font-medium text-slate-600">Dirección</label><Input {...field1('direccion')} /></div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Antecedentes patológicos heredofamiliares">
            <CheckboxGridSection
              rows={ENFERMEDADES_HEREDO}
              columns={COLS_HEREDO}
              fieldName={(row, ci) => `heredo-${row}-${ci}`}
              formData={p1}
              onChange={(name, checked) => set1({ [name]: checked })}
            />
          </FormSectionCard>

          <FormSectionCard title="Antecedentes personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ENFERMEDADES_PERSONALES.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!p1[`pers-${item}`]} onChange={e => set1({ [`pers-${item}`]: e.target.checked })} />
                  {item}
                </label>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Dolor (escala EVA)">
            <div className="flex flex-col items-center gap-3">
              <img src={caritasImg} alt="EVA" className="max-w-xs w-full h-auto" />
              <div className="flex flex-wrap justify-center gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <label key={num} className="flex flex-col items-center text-xs gap-1"><input type="checkbox" checked={p1.dolor_escala === num} onChange={() => set1({ dolor_escala: num })} />{num}</label>
                ))}
              </div>
            </div>
          </FormSectionCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSectionCard title="Dx Médicos">
              <div className="space-y-2">{[0, 1, 2, 3].map(i => <Input key={i} {...field1(`diag_med_${i}`)} />)}</div>
            </FormSectionCard>
            <FormSectionCard title="Medicamentos">
              <div className="space-y-2">{[0, 1, 2, 3].map(i => <Input key={i} {...field1(`med_${i}`)} />)}</div>
            </FormSectionCard>
          </div>

          <FormSectionCard title="Motivo de consulta" description="ALICIA — Antigüedad, Lugar, Incidencia, Característica, Intensidad, Agravantes">
            <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <Input key={i} {...field1(`motivo_${i}`)} />)}</div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 2 ================= */}
        <TabsContent value="p2" className="space-y-4 mt-4">
          <FormSectionCard title="Objetivos SMART">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Objetivo del paciente</label>
                <div className="space-y-2 mt-1">{Array.from({ length: 8 }, (_, i) => <Input key={i} {...field2(`obj_px_${i}`)} />)}</div>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Objetivo general</label><Input {...field2('obj_general')} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Corto plazo</label><Textarea {...field2('obj_corto')} className="min-h-20" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Mediano plazo</label><Textarea {...field2('obj_mediano')} className="min-h-20" /></div>
                <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Largo plazo</label><Textarea {...field2('obj_largo')} className="min-h-20" /></div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Exploración física">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Observación</TableHead><TableHead>Inspección</TableHead><TableHead>Palpación</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {EXPLORACION_FISICA_ROWS.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.obs && (<div className="space-y-1"><label className="text-[10px] text-slate-500">{row.obs.label}</label><Textarea {...field2(row.obs.name)} className="min-h-10 text-xs" /></div>)}</TableCell>
                      <TableCell>{row.ins && (<div className="space-y-1"><label className="text-[10px] text-slate-500">{row.ins.label}</label><Textarea {...field2(row.ins.name)} className="min-h-10 text-xs" /></div>)}</TableCell>
                      <TableCell>{row.pal && (<div className="space-y-1"><label className="text-[10px] text-slate-500">{row.pal.label}</label><Textarea {...field2(row.pal.name)} className="min-h-10 text-xs" /></div>)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="block lg:hidden space-y-3">
              {EXPLORACION_FISICA_ROWS.flatMap((row, i) => [row.obs, row.ins, row.pal].filter(Boolean).map((item, j) => (
                <div key={`${i}-${j}`} className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">{item!.label}</label>
                  <Textarea {...field2(item!.name)} className="min-h-12 text-xs" />
                </div>
              )))}
            </div>
          </FormSectionCard>

          <FormSectionCard title="Estado de la zona">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-900 mb-2 block">Ubicación</label>
                <BodyMarkerDiagram
                  image={Humano1Img}
                  alt="Ubicación cuerpo"
                  markers={p2.markers}
                  onChangeMarkers={(markers) => set2({ markers })}
                />
              </div>
              <div className="space-y-3">
                {ZONA_ROWS.map(row => (
                  <div key={row.label} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">{row.label}</label>
                    <div className="flex flex-wrap gap-3">
                      {row.options.map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={!!p2[`zona_${opt}`]} onChange={e => set2({ [`zona_${opt}`]: e.target.checked })} />{opt}</label>
                      ))}
                    </div>
                  </div>
                ))}
                {[1, 2].map(num => (
                  <div key={num} className="grid grid-cols-3 gap-2">
                    <Input placeholder="Otro" {...field2(`otro_nom_${num}`)} className="text-xs" />
                    <Input placeholder="Severidad" {...field2(`otro_sev_${num}`)} className="text-xs" />
                    <Input placeholder="Zona" {...field2(`otro_zon_${num}`)} className="text-xs" />
                  </div>
                ))}
              </div>
            </div>
          </FormSectionCard>
        </TabsContent>

        {/* ================= PÁGINA 3 ================= */}
        <TabsContent value="p3" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSectionCard title="Exploración de sensibilidad (dermatomas)">
              <BodyMarkerDiagram
                image={Humano2Img}
                alt="Dermatomas"
                markers={p3.markers}
                onChangeMarkers={(markers) => set3({ markers })}
                withMarkerId
              />
            </FormSectionCard>

            <FormSectionCard title="Exploración neuromuscular">
              <div className="space-y-1 mb-3">
                <label className="text-xs font-medium text-slate-600">Hallazgos por dermatomas</label>
                <Textarea {...field3('hallazgos_derma')} className="min-h-16 text-xs" />
              </div>
              <div className="space-y-2 mb-3">
                <p className="text-xs font-bold text-blue-900">Valoración de reflejos</p>
                {REFLEJOS.map(ref => (
                  <div key={ref} className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-xs">{ref}</span>
                    <Textarea {...field3(`ref_${ref}`)} className="min-h-8 text-xs" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Valoración de tono</label>
                <Textarea {...field3('valoracion_tono')} className="min-h-16 text-xs" />
              </div>
            </FormSectionCard>
          </div>

          <FormSectionCard title="Movilidad">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Zona a valorar (derecho)</label><Textarea {...field3('zona_der')} className="min-h-10 text-xs" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Zona a valorar (izquierdo)</label><Textarea {...field3('zona_izq')} className="min-h-10 text-xs" /></div>
            </div>
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movimiento</TableHead><TableHead>Fuerza 1 (D)</TableHead><TableHead>Fuerza 2 (D)</TableHead><TableHead>Arco 1 (D)</TableHead><TableHead>Arco 2 (D)</TableHead>
                    <TableHead>Fuerza 1 (I)</TableHead><TableHead>Fuerza 2 (I)</TableHead><TableHead>Arco 1 (I)</TableHead><TableHead>Arco 2 (I)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOVIMIENTOS.map(mov => (
                    <TableRow key={mov}>
                      <TableCell className="font-medium">{mov}</TableCell>
                      {['d_fza1_', 'd_fza2_', 'd_arc1_', 'd_arc2_', 'i_fza1_', 'i_fza2_', 'i_arc1_', 'i_arc2_'].map(prefix => (
                        <TableCell key={prefix}><Textarea {...field3(`${prefix}${mov}`)} className="min-h-8 text-xs" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="block lg:hidden space-y-3">
              {MOVIMIENTOS.map(mov => (
                <div key={mov} className="border border-slate-200 rounded-lg p-2.5">
                  <p className="text-xs font-bold mb-2">{mov}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['d_fza1_', 'Fuerza 1 D'], ['d_fza2_', 'Fuerza 2 D'], ['d_arc1_', 'Arco 1 D'], ['d_arc2_', 'Arco 2 D'], ['i_fza1_', 'Fuerza 1 I'], ['i_fza2_', 'Fuerza 2 I'], ['i_arc1_', 'Arco 1 I'], ['i_arc2_', 'Arco 2 I']].map(([prefix, label]) => (
                      <div key={prefix}>
                        <label className="text-[10px] text-slate-500">{label}</label>
                        <Textarea {...field3(`${prefix}${mov}`)} className="min-h-8 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Observaciones (derecho)</label><Textarea {...field3('obs_der')} className="min-h-14 text-xs" /></div>
              <div className="space-y-1"><label className="text-xs font-medium text-slate-600">Observaciones (izquierdo)</label><Textarea {...field3('obs_izq')} className="min-h-14 text-xs" /></div>
            </div>
          </FormSectionCard>

          <FormSectionCard title="Pruebas específicas">
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Textarea placeholder="Prueba" {...field3(`prueba_${i}`)} className="min-h-10 text-xs" />
                  <Textarea placeholder="Hallazgos" {...field3(`hallazgo_${i}`)} className="min-h-10 text-xs" />
                </div>
              ))}
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

export default FisioterapiaPrimeraConsultaCaptura;
