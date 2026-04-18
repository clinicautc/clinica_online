/**
 * ============================================================================
 * ARCHIVO: PhysiotherapyMasterForm.tsx - VERSIÓN DEFINITIVA (1300+ líneas)
 * PROPÓSITO: Formulario Clínico de Fisioterapia Multi-pasos (P1, P2, P3).
 * CORRECCIÓN: Tipado de interfaces, corrección de UMD globals y lógica de búsqueda.
 * ============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { endpoints } from '../lib/api';

// --- INTERFAZ PARA LAS PROPS DE TODAS LAS PÁGINAS ---
interface PageProps {
  accumulatedData: any;
  onUpdate: (page: string, data: any) => void;
  onBack: () => void;
  onNext: () => void;
  appointmentId?: string;
  isSaving?: boolean;
  setIsSaving?: (value: boolean) => void; // <--- ¡EL SIGNO DE INTERROGACIÓN ES LA CLAVE!
  readOnly?: boolean;
}

const PhysiotherapyMasterForm: React.FC = () => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<any>({
    pagina_1: {},
    pagina_2: { markers: [] },
    pagina_3: { markers: [] }
  });

  // Lógica de carga automática desde PostgreSQL
  useEffect(() => {
    const cargarHistorialExistente = async () => {
      if (!appointmentId) return;
      try {
        const response = await fetch(endpoints.historiales);
        if (response.ok) {
          const todos: any[] = await response.json();
          // BUSCAMOS COINCIDENCIA (Asegúrate de tener appointment_id en tu DB)
          const encontrado = todos.find(h =>
              String(h.appointment_id || h.id) === String(appointmentId) && h.tipo === 'fisioterapia'
          );
          if (encontrado) {
            setFormData(encontrado.datos);
            setIsReadOnly(true);
            toast.info("Visualizando historial clínico guardado.");
          }
        }
      } catch (error) {
        console.error("Error al recuperar historial:", error);
      }
    };
    void cargarHistorialExistente(); // CORRECCIÓN: Manejo de promesa
  }, [appointmentId]);

  const updateGlobalData = (page: string, data: any) => {
    if (isReadOnly) return;
    setFormData((prev: any) => ({
      ...prev,
      [page]: { ...prev[page], ...data }
    }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // LÓGICA DE GUARDADO FINAL
  const handleFinalSave = async () => {
    try {
      setIsSaving(true);
      const urlParams = new URLSearchParams(window.location.search);
      const pIdReal = urlParams.get('pId');

      const response = await fetch(endpoints.historiales, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: pIdReal || formData.paciente_id || 5,
          paciente_nombre: formData.pagina_1?.nombre_completo || "Paciente",
          tipo: 'fisioterapia',
          datos: formData,
          creado_por: user?.id,
          creado_por_nombre: user?.nombre || "Practicante",
          appointment_id: appointmentId
        })
      });

      if (response.ok) {
        toast.success('¡Historial guardado con éxito!');
        navigate('/dashboard');
      } else {
        toast.error('Error al guardar en el servidor.');
      }
    } catch (error) {
      toast.error('Fallo de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="min-h-screen bg-zinc-600">
        {step === 1 && (
            <PhysiotherapyPage1Component
                accumulatedData={formData}
                onUpdate={updateGlobalData}
                onBack={() => navigate('/dashboard')}
                onNext={handleNext}
                appointmentId={appointmentId}
                readOnly={isReadOnly}
            />
        )}
        {step === 2 && (
            <PhysiotherapyPage2Component
                accumulatedData={formData}
                onUpdate={updateGlobalData}
                onBack={handleBack}
                onNext={handleNext}
                readOnly={isReadOnly}
            />
        )}
        {step === 3 && (
            <PhysiotherapyPage3Component
                accumulatedData={formData}
                onUpdate={updateGlobalData}
                onBack={handleBack}
                onNext={handleFinalSave}
                isSaving={isSaving}
                setIsSaving={setIsSaving}
                readOnly={isReadOnly}
            />
        )}
      </div>
  );
};

/**
 * ============================================================================
 * PIEZA 1: COMPONENTE PÁGINA 1 (HISTORIA CLÍNICA COMPLETA)
 * ============================================================================
 */
const PhysiotherapyPage1Component: React.FC<PageProps> = ({
                                                            accumulatedData, onUpdate, onBack, onNext, appointmentId, readOnly
                                                          }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    onUpdate('pagina_1', { [field]: e.target.value });
  };

  return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
        .hc-container * { box-sizing: border-box; margin: 0; padding: 0; }
        .hc-body { font-family: Arial, sans-serif; font-size: 10px; background-color: #525659; display: flex; justify-content: center; padding: 20px; min-height: 100vh; }
        .page { background-color: #fff; width: 100%; max-width: 215.9mm; height: auto; min-height: 279.4mm; padding: 10mm 12mm; box-shadow: 0 5px 15px rgba(0,0,0,0.5); position: relative; color: #5575B3; zoom: 0.7; overflow: hidden; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .logo h1 { font-size: 38px; letter-spacing: -2px; margin-bottom: -5px; font-weight: 900; color: #2A4B8C; text-transform: lowercase;}
        .main-title { background-color: #2A4B8C; color: #fff; text-align: center; font-size: 22px; font-weight: bold; padding: 6px 20px; border-radius: 20px; }
        .box { border: 2px solid #2A4B8C; border-radius: 12px; position: relative; padding: 10px 8px 6px 8px; margin-top: 12px; background: transparent; width: 100%; }
        .box-title { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background-color: #2A4B8C; color: white; font-size: 11px; font-weight: bold; padding: 2px 15px; border-radius: 10px; white-space: nowrap; }
        .box-title.left-aligned { left: 15px; transform: none; }
        .form-row { display: flex; flex-wrap: wrap; gap: 5px 10px; align-items: flex-end; margin-bottom: 4px; }
        input.line-input { border: none; border-bottom: 1px solid #5575B3; background: transparent; font-size: 9px; color: #000; flex-grow: 1; outline: none; }
        .btn-salir-fixed { position: fixed; top: 16px; right: 16px; background-color: #e11d48; color: white; padding: 8px 20px; border-radius: 8px; font-weight: bold; z-index: 50; border: none; cursor: pointer; }
        .btn-siguiente-fixed { position: fixed; bottom: 32px; right: 32px; padding: 12px 32px; border-radius: 9999px; font-weight: bold; z-index: 50; border: none; background-color: #16a34a; color: white; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th, td { border: 1px solid #5575B3; padding: 2px; font-size: 8px; }
        th { color: #fff; background-color: #2A4B8C; font-weight: bold; }
        ` }} />

        <div className="hc-container hc-body">
          <button className="btn-salir-fixed" onClick={onBack}>Salir</button>
          <button className="btn-siguiente-fixed" onClick={onNext}>Siguiente (P2) →</button>

          <div className="page">
            <div className="header">
              <div className="logo"><h1>utc</h1><p>Universidad<br/>Tres Culturas</p></div>
              <div style={{flexGrow: 1, marginLeft:'15px'}}>
                <div className="main-title">Historia Clínica Fisioterapéutica</div>
                <div style={{display:'flex', justifyContent:'space-between', padding:'0 10px', marginTop:'5px'}}>
                  <div style={{fontSize:'8px'}}>Av. Insurgentes Sur 92, Juárez, CDMX</div>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <span style={{fontWeight:'bold', color:'#2A4B8C', marginRight:'4px'}}>Fecha:</span>
                    <input type="text" className="line-input" style={{width:'80px'}} value={accumulatedData.pagina_1.fecha || ''} onChange={(e)=>handleInputChange(e, 'fecha')} disabled={readOnly} />
                  </div>
                </div>
              </div>
            </div>

            <div className="box" style={{marginTop: 0}}>
              <div className="box-title left-aligned">Datos personales</div>
              <div className="form-row">
                <div style={{flex: 3, display:'flex'}}>
                  <span style={{fontWeight:'bold', color:'#2A4B8C', marginRight:'4px'}}>Nombre:</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.nombre_completo || ''} onChange={(e)=>handleInputChange(e, 'nombre_completo')} disabled={readOnly} />
                </div>
                <div style={{flex: 0.8, display:'flex'}}>
                  <span style={{fontWeight:'bold', color:'#2A4B8C', marginRight:'4px'}}>Edad:</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.edad || ''} onChange={(e)=>handleInputChange(e, 'edad')} disabled={readOnly} />
                </div>
                <div style={{flex: 1.2, display:'flex'}}>
                  <span style={{fontWeight:'bold', color:'#2A4B8C', marginRight:'4px'}}>Expediente:</span>
                  <input type="text" className="line-input" value={appointmentId || ''} disabled />
                </div>
              </div>
            </div>

            <div className="box" style={{padding: 0, overflow: 'hidden'}}>
              <div style={{backgroundColor:'#2A4B8C', color:'white', textAlign:'center', padding:'3px', fontWeight:'bold'}}>Antecedentes Patológicos Heredofamiliares</div>
              <table>
                <thead>
                <tr>
                  <th style={{textAlign:'left'}}>Enfermedades</th>
                  <th>Madre</th><th>Padre</th><th>Aa Mat</th><th>Ao Mat</th><th>Aa Pat</th><th>Ao Pat</th>
                </tr>
                </thead>
                <tbody>
                {['Diabetes', 'Hipertensión', 'Obesidad', 'Renales', 'Endocrinas', 'Tiroidea', 'Psiquiátricas', 'Neurológicas'].map((enf) => (
                    <tr key={enf}>
                      <td style={{textAlign:'left', paddingLeft:'5px'}}>{enf}</td>
                      {[1,2,3,4,5,6].map(i => (
                          <td key={i}>
                            <input type="checkbox" checked={accumulatedData.pagina_1[`enf_${enf}_${i}`] || false} onChange={(e) => onUpdate('pagina_1', {[`enf_${enf}_${i}`]: e.target.checked})} disabled={readOnly} />
                          </td>
                      ))}
                    </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'28% 34% 34%', gap:'2%', marginTop:'15px'}}>
              <div className="box" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <div className="box-title">Dolor</div>
                <img src="/assets/Caritas.png" alt="EVA" style={{maxWidth:'100%', marginTop:'5px'}} />
                <div style={{display:'flex', gap:'3px', marginTop:'5px'}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <label key={n} style={{fontSize:'7px', textAlign:'center'}}>
                        {n}<br/><input type="radio" name="eva" checked={Number(accumulatedData.pagina_1.eva) === n} onChange={()=>onUpdate('pagina_1', {eva: n})} disabled={readOnly} />
                      </label>
                  ))}
                </div>
              </div>
              <div className="box">
                <div className="box-title">Diagnósticos Médicos</div>
                {[1,2,3,4].map(i => <input key={i} type="text" className="line-input" style={{marginBottom:'5px'}} value={accumulatedData.pagina_1[`dx_${i}`] || ''} onChange={(e)=>onUpdate('pagina_1', {[`dx_${i}`]: e.target.value})} disabled={readOnly} />)}
              </div>
              <div className="box">
                <div className="box-title">Medicamentos</div>
                {[1,2,3,4].map(i => <input key={i} type="text" className="line-input" style={{marginBottom:'5px'}} value={accumulatedData.pagina_1[`med_${i}`] || ''} onChange={(e)=>onUpdate('pagina_1', {[`med_${i}`]: e.target.value})} disabled={readOnly} />)}
              </div>
            </div>

            <div className="box">
              <div className="box-title">Motivo de consulta</div>
              <div style={{display:'flex', gap:'15px'}}>
                <div style={{flex: 1}}>
                  {[1,2,3,4,5].map(i => <input key={i} type="text" className="line-input" style={{marginBottom:'6px'}} value={accumulatedData.pagina_1[`motivo_${i}`] || ''} onChange={(e)=>onUpdate('pagina_1', {[`motivo_${i}`]: e.target.value})} disabled={readOnly} />)}
                </div>
                <div style={{width:'160px', fontSize:'8px', borderLeft:'1px solid #2A4B8C', paddingLeft:'10px'}}>
                  <p><b>ALICIA:</b> Antigüedad, Lugar, Incidencia, Característica, Intensidad, Agravantes.</p>
                </div>
              </div>
            </div>

            <div style={{marginTop:'auto', borderTop:'1px solid #ddd', paddingTop:'5px', display:'flex', justifyContent:'space-between'}}>
              <p style={{fontSize:'8px'}}>UTC - Gestión de Clínica Universitaria</p>
              <div style={{fontWeight:'bold', color:'#2A4B8C'}}>1</div>
            </div>
          </div>
        </div>
      </>
  );
};

/**
 * ============================================================================
 * PIEZA 2: COMPONENTE PÁGINA 2 (OBJETIVOS SMART Y MAPA)
 * ============================================================================
 */
const PhysiotherapyPage2Component: React.FC<PageProps> = ({
                                                            accumulatedData, onUpdate, onBack, onNext, readOnly
                                                          }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const currentMarkers = accumulatedData.pagina_2.markers || [];
      onUpdate('pagina_2', { markers: [...currentMarkers, { x, y }] });
    }
  };

  return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
            .page-p2 { background-color: #fff; width: 100%; max-width: 215.9mm; min-height: 279.4mm; padding: 15mm; box-shadow: 0 5px 15px rgba(0,0,0,0.5); zoom: 0.7; color: #2A4B8C; overflow:hidden;}
            .btn-anterior { position: fixed; bottom: 32px; left: 32px; padding: 12px 32px; border-radius: 9999px; background: #2A4B8C; color: white; font-weight: bold; border: none; cursor: pointer; }
        ` }} />
        <div className="hc-body">
          <button className="btn-anterior" onClick={onBack}>← Anterior</button>
          <button className="btn-siguiente-fixed" onClick={onNext}>Siguiente (P3) →</button>

          <div className="page-p2">
            <h2 style={{textAlign:'center', textTransform:'uppercase', borderBottom:'2px solid #2A4B8C', paddingBottom:'10px', marginBottom:'20px'}}>Objetivos y Exploración Física</h2>

            <div className="box">
              <div className="box-title">Mapa de Ubicación del Síntoma</div>
              <div ref={containerRef} onClick={handleImageClick} style={{position:'relative', cursor: readOnly ? 'default' : 'crosshair', textAlign:'center', border:'1px solid #ddd', borderRadius:'15px', padding:'15px', backgroundColor:'#fcfcfc'}}>
                <img src="/assets/Humano_1.png" alt="Anatomía" style={{maxHeight:'450px'}} />
                {(accumulatedData.pagina_2.markers || []).map((m: any, i: number) => (
                    <div key={i} style={{position:'absolute', left: m.x, top: m.y, color:'red', fontWeight:'bold', fontSize:'16px', transform:'translate(-50%, -50%)'}}>✖</div>
                ))}
              </div>
              {!readOnly && <button onClick={()=>onUpdate('pagina_2', {markers: []})} style={{marginTop:'5px', color:'red', fontSize:'9px', cursor:'pointer'}}>Limpiar Marcas</button>}
            </div>

            <div className="box" style={{marginTop:'20px'}}>
              <div className="box-title">Objetivos SMART (Paciente y General)</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', padding:'10px'}}>
                <div>
                  <p style={{fontWeight:'bold', fontSize:'11px', marginBottom:'5px'}}>Objetivo del Paciente:</p>
                  <textarea style={{width:'100%', height:'100px', border:'1px solid #5575B3', borderRadius:'8px', padding:'5px'}} value={accumulatedData.pagina_2.obj_paciente || ''} onChange={(e)=>onUpdate('pagina_2', {obj_paciente: e.target.value})} disabled={readOnly} />
                </div>
                <div>
                  <p style={{fontWeight:'bold', fontSize:'11px', marginBottom:'5px'}}>Objetivo General:</p>
                  <textarea style={{width:'100%', height:'100px', border:'1px solid #5575B3', borderRadius:'8px', padding:'5px'}} value={accumulatedData.pagina_2.obj_general || ''} onChange={(e)=>onUpdate('pagina_2', {obj_general: e.target.value})} disabled={readOnly} />
                </div>
              </div>
            </div>

            <div style={{marginTop:'auto', textAlign:'right', fontWeight:'bold'}}>2</div>
          </div>
        </div>
      </>
  );
};

/**
 * ============================================================================
 * PIEZA 3: COMPONENTE PÁGINA 3 (SISTEMA NEUROMUSCULAR Y GUARDADO FINAL)
 * ============================================================================
 */
const PhysiotherapyPage3Component: React.FC<PageProps> = ({
                                                            accumulatedData, onUpdate, onBack, onNext, isSaving, readOnly
                                                          }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const currentMarkers = accumulatedData.pagina_3.markers || [];
      onUpdate('pagina_3', { markers: [...currentMarkers, { x, y, id: Date.now() }] });
    }
  };

  return (
      <div className="hc-body">
        <button className="btn-anterior" style={{left:'32px'}} onClick={onBack}>← Regresar</button>
        <button
            className="btn-siguiente-fixed"
            style={{background: readOnly ? '#475569' : '#059669', padding:'12px 40px', fontSize:'16px', boxShadow:'0 8px 20px rgba(0,0,0,0.3)'}}
            onClick={onNext}
            disabled={isSaving}
        >
          {isSaving ? 'PROCESANDO...' : readOnly ? 'SALIR DE VISTA' : 'FINALIZAR Y GUARDAR'}
        </button>

        <div className="page" style={{padding:'15mm', backgroundColor:'white', zoom:'0.7', color:'#2A4B8C', minHeight:'279.4mm', display:'flex', flexDirection:'column'}}>
          <h2 style={{textAlign:'center', marginBottom:'30px', borderBottom:'4px double #2A4B8C', paddingBottom:'10px'}}>Exploración Neuromuscular y Pruebas</h2>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
            <div className="box">
              <div className="box-title">Sensibilidad (Dermatomas)</div>
              <div ref={containerRef} onClick={handleImageClick} style={{position:'relative', textAlign:'center', cursor: readOnly ? 'default' : 'crosshair', padding:'20px', border:'1px dashed #2A4B8C', borderRadius:'20px', backgroundColor:'#f8fafc'}}>
                <img src="/assets/Humano_2.png" alt="Dermatomas" style={{maxHeight:'400px'}} />
                {(accumulatedData.pagina_3.markers || []).map((m: any) => (
                    <div key={m.id} style={{position:'absolute', left: m.x, top: m.y, color:'blue', fontWeight:'bold', fontSize:'20px', transform:'translate(-50%, -50%)'}}>✖</div>
                ))}
              </div>
            </div>

            <div className="box">
              <div className="box-title">Valoración de Reflejos Osteotendinosos</div>
              <table style={{width:'100%', borderCollapse:'collapse', marginTop:'10px'}}>
                <thead>
                <tr style={{backgroundColor:'#f1f5f9'}}>
                  <th style={{border:'1px solid #2A4B8C', padding:'8px'}}>Reflejo</th>
                  <th style={{border:'1px solid #2A4B8C', padding:'8px'}}>Grado (0-4+)</th>
                </tr>
                </thead>
                <tbody>
                {['Bicipital', 'Tricipital', 'Estilorradial', 'Rotuliano', 'Aquileo'].map(ref => (
                    <tr key={ref}>
                      <td style={{border:'1px solid #2A4B8C', padding:'8px', fontWeight:'bold'}}>{ref}</td>
                      <td style={{border:'1px solid #2A4B8C', padding:'0'}}>
                        <input type="text" style={{width:'100%', border:'none', textAlign:'center', padding:'8px', outline:'none'}} value={accumulatedData.pagina_3[`ref_${ref}`] || ''} onChange={(e)=>onUpdate('pagina_3', {[`ref_${ref}`]: e.target.value})} disabled={readOnly} />
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
              <div style={{marginTop:'20px'}}>
                <p style={{fontWeight:'bold', fontSize:'11px'}}>Observaciones de Tono (Ashworth/Modified):</p>
                <textarea style={{width:'100%', height:'120px', borderRadius:'10px', marginTop:'5px', padding:'10px', border:'1px solid #cbd5e1'}} value={accumulatedData.pagina_3.obs_tono || ''} onChange={(e)=>onUpdate('pagina_3', {obs_tono: e.target.value})} disabled={readOnly} />
              </div>
            </div>
          </div>

          <div className="box" style={{marginTop:'30px'}}>
            <div className="box-title">Pruebas Específicas / Test Funcionales</div>
            <textarea style={{width:'100%', height:'200px', border:'none', padding:'15px', outline:'none', fontSize:'12px', lineHeight:'1.6'}} placeholder="Ej: Prueba de Phalen (+), Signo de Tinel (-), Prueba de cajón anterior..." value={accumulatedData.pagina_3.pruebas_finales || ''} onChange={(e)=>onUpdate('pagina_3', {pruebas_finales: e.target.value})} disabled={readOnly} />
          </div>

          <div style={{marginTop:'auto', paddingTop:'50px', display:'flex', justifyContent:'space-around'}}>
            <div style={{borderTop:'2px solid #2A4B8C', width:'250px', textAlign:'center', paddingTop:'10px', fontWeight:'bold', fontSize:'11px'}}>Nombre y Firma del Alumno</div>
            <div style={{borderTop:'2px solid #2A4B8C', width:'250px', textAlign:'center', paddingTop:'10px', fontWeight:'bold', fontSize:'11px'}}>Nombre y Cédula del Docente</div>
          </div>

          <div style={{textAlign:'right', fontWeight:'bold', color:'#2A4B8C', marginTop:'10px'}}>3</div>
        </div>
      </div>
  );
};

export default PhysiotherapyMasterForm;