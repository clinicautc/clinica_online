import React, { useState, useRef, useEffect } from 'react'; //
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import { toast } from 'sonner';

// IMPORTACIÓN DE IMÁGENES
import caritasImg from './Caritas.png';
import Humano1Img from './Humano_1.png'; 
import Humano2Img from './Humano_2.png';

interface PageProps {
  accumulatedData: any;
  onUpdate: (page: string, data: any) => void;
  onBack: () => void;
  onNext: () => void;
  appointmentId?: string;
  isSaving?: boolean;
  setIsSaving: (value: boolean) => void;
}

const PhysiotherapyMasterForm: React.FC = () => {
  const [isReadOnly, setIsReadOnly] = useState(false); //
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
        const response = await fetch('http://localhost:3001/api/historiales',{
          headers: {email: user?.email || ''}});
        if (response.ok) {
          const todos: any[] = await response.json();
          const encontrado = todos.find(h => 
            String(h.appointment_id) === String(appointmentId) && h.tipo === 'fisioterapia'
          );
          if (encontrado) {
            setFormData(encontrado.datos); // Inyecta los datos guardados
            setIsReadOnly(true); // Activa modo lectura
            toast.info("Visualizando historial clínico guardado.");
          }
        }
      } catch (error) {
        console.error("Error al recuperar historial:", error);
      }
    };
    cargarHistorialExistente();
  }, [appointmentId]);

  // ... (Sigue el resto del código: updateGlobalData, handleNext, etc.)

  // Función núcleo para actualizar datos globalmente
  const updateGlobalData = (page: string, data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [page]: { ...prev[page], ...data }
    }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // --- LÓGICA DE GUARDADO FINAL (En el último paso) ---
  const handleFinalSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('http://localhost:3001/api/historiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: formData.paciente_id || 0,
          tipo: 'fisioterapia',
          datos: formData,
          creado_por: user?.id,
          appointment_id: appointmentId
        })
      });

      if (response.ok) {
        toast.success('¡Historial clínico de fisioterapia guardado con éxito!');
        navigate('/physiotherapy-dashboard');
      } else {
        toast.error('Error al guardar en el servidor.');
      }
    } catch (error) {
      console.error("Error crítico:", error);
      toast.error('Fallo de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-600">
      
      {/* RENDERIZADO DINÁMICO SEGÚN EL PASO */}
      {step === 1 && (
        <PhysiotherapyPage1Component 
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => window.history.back()}
          onNext={handleNext}
          appointmentId={appointmentId}
        />
      )}

      {step === 2 && (
        <PhysiotherapyPage2Component 
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={handleBack}
          onNext={handleNext}
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
        />
      )}

    </div>
  );
};

/**
 * ============================================================================
 * PIEZA 1: COMPONENTE PÁGINA 1 (HISTORIA CLÍNICA)
 * ============================================================================
 */
const PhysiotherapyPage1Component: React.FC<PageProps> = ({ 
  accumulatedData, 
  onUpdate, 
  onBack, 
  onNext, 
  appointmentId 
}) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    onUpdate('pagina_1', { [field]: e.target.value });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    onUpdate('pagina_1', { [field]: checked });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hc-container * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --utc-blue: #2A4B8C;
            --utc-light-blue: #5575B3;
        }
        .hc-body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            background-color: #525659;
            display: flex;
            justify-content: center;
            padding: 20px;
            min-height: 100vh;
        }
        .page {
            background-color: #fff;
            width: 100%;
            max-width: 215.9mm;
            height: auto;
            min-height: 279.4mm;
            padding: 10mm 12mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            position: relative;
            color: #5575B3; 
            overflow: hidden;
            zoom: 0.7; 
        }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .logo { display: flex; flex-direction: column; color: #2A4B8C; width: 120px;}
        .logo h1 { font-size: 38px; letter-spacing: -2px; margin-bottom: -5px; font-weight: 900; text-transform: lowercase; }
        .logo p { font-size: 8px; line-height: 1; font-weight: bold; }
        .title-section { flex-grow: 1; margin-left: 15px; display: flex; flex-direction: column;}
        .main-title {
            background-color: #2A4B8C;
            color: #fff;
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            padding: 6px 20px;
            border-radius: 20px;
            print-color-adjust: exact;
        }
        .title-sub-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 5px; padding: 0 10px; }
        .address { font-size: 9px; color: #5575B3; font-weight: bold;}
        .fecha-container { display: flex; align-items: flex-end; width: 140px; }
        .box {
            border: 2px solid #2A4B8C;
            border-radius: 12px;
            position: relative;
            padding: 10px 8px 6px 8px;
            margin-top: 12px;
            margin-bottom: 2px;
            background: transparent;
            width: 100%;
        }
        .box-title {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2A4B8C;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 2px 15px;
            border-radius: 10px;
            print-color-adjust: exact;
            white-space: nowrap;
        }
        .box-title.left-aligned { left: 15px; transform: none; }
        .form-row { display: flex; flex-wrap: wrap; gap: 5px 10px; align-items: flex-end; margin-bottom: 4px; }
        .field { display: flex; align-items: flex-end; flex-grow: 1; }
        .field-label { font-weight: bold; color: #2A4B8C; margin-right: 4px; white-space: nowrap; }
        input.line-input {
            border: none;
            border-bottom: 1px solid #5575B3;
            background: transparent;
            font-size: 9px;
            color: #000;
            flex-grow: 1;
            height: 12px;
            outline: none;
            width: 100%;
        }
        .chk-group { display: flex; align-items: center; gap: 4px; color: #5575B3; flex-wrap: wrap;}
        .chk-label { display: flex; align-items: center; cursor: pointer; white-space: nowrap; font-weight: bold; font-size: 9px;}
        input[type="checkbox"], input[type="radio"] {
            appearance: none;
            width: 9px; height: 9px;
            border: 1px solid #2A4B8C;
            margin-right: 3px; position: relative; cursor: pointer;
        }
        input[type="checkbox"]:checked::after, input[type="radio"]:checked::after {
            content: '✓'; position: absolute; top: -4px; left: 0px;
            font-size: 10px; color: #2A4B8C; font-weight: bold;
        }
        .escala-dolor-chk { display: flex; width: 100%; justify-content: space-around; margin-top: 6px; flex-wrap: wrap; gap: 5px; }
        .escala-dolor-chk label { display: flex; flex-direction: column; align-items: center; font-size: 8px; font-weight: bold; color: #2A4B8C; cursor: pointer; gap: 2px; }
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th, td { border: 1px solid #5575B3; padding: 0; font-size: 8px; height: 14px; }
        th { color: #fff; background-color: #2A4B8C; font-weight: bold; print-color-adjust: exact; padding: 2px;}
        .text-left { text-align: left; padding-left: 4px; }
        input.table-input { width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 9px; outline: none; padding: 0 2px; color: #000; }
        .tabla-antecedentes th, .tabla-antecedentes td { border: 1px solid #2A4B8C !important; color: #2A4B8C !important; padding: 3px 4px; height: 18px; }
        .tabla-antecedentes th { background-color: transparent !important; font-size: 10.5px; }
        .grid-60-40 { display: grid; grid-template-columns: 63% 35%; gap: 2%; }
        .grid-3-col { display: grid; grid-template-columns: 28% 34% 34%; gap: 2%; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .full-width-title { background-color: #2A4B8C; color: white; font-weight: bold; font-size: 11px; padding: 3px 0; text-align: center; width: 100%; print-color-adjust: exact; }
        .blank-lines { display: flex; flex-direction: column; gap: 4px; margin-top: 5px; }
        .motivo-container { display: flex; gap: 15px; }
        .motivo-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .alicia-box { width: 160px; font-size: 8px; border-left: 1px solid #2A4B8C; padding-left: 10px; }
        .alicia-box b { color: #2A4B8C; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; font-size: 7px; color: #5575B3; border-top: 1px solid #ddd; padding-top: 5px;}
        .page-num { font-size: 12px; font-weight: bold; color: #2A4B8C; }
        .btn-salir-fixed { position: fixed; top: 16px; right: 16px; background-color: #e11d48; color: white; padding: 8px 20px; border-radius: 8px; font-weight: bold; z-index: 50; border: none; cursor: pointer; }
        .btn-siguiente-fixed { position: fixed; bottom: 32px; right: 32px; padding: 12px 32px; border-radius: 9999px; font-weight: bold; z-index: 50; border: none; transition: all 0.2s; background-color: #16a34a; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .btn-siguiente-fixed:hover { transform: scale(1.05); background-color: #15803d; }

        @media print {
            @page { size: letter portrait; margin: 0; }
            body, html { height: 100%; overflow: hidden; background-color: #fff; }
            .hc-body { padding: 0 !important; margin: 0 !important; background: white; display: block !important; }
            .page { box-shadow: none !important; border: none !important; width: 215.9mm !important; height: 279.4mm !important; padding: 10mm 15mm !important; position: absolute; top: 0; left: 0; margin: 0 auto !important; transform: scale(0.7); transform-origin: top center; }
            .btn-salir-fixed, .btn-siguiente-fixed { display: none !important; }
        }
      ` }} />

      <div className="hc-container hc-body">
        <button className="btn-salir-fixed" onClick={onBack}>Salir</button>
        <button className="btn-siguiente-fixed" onClick={onNext}>Siguiente (P2) →</button>

        <div className="page">
          {/* HEADER */}
          <div className="header">
            <div className="logo">
              <h1>utc</h1>
              <p>Universidad<br />Tres Culturas</p>
            </div>
            <div className="title-section">
              <div className="main-title">Historia Clínica Fisioterapéutica</div>
              <div className="title-sub-row">
                <div className="address">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</div>
                <div className="fecha-container">
                  <span className="field-label">Fecha:</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.fecha || ''} onChange={(e) => handleInputChange(e, 'fecha')} />
                </div>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div className="box" style={{ marginTop: 0 }}>
            <div className="box-title left-aligned">Datos personales</div>
            <div className="form-row">
              <div className="field" style={{ flex: 3 }}>
                <span className="field-label">Nombre completo</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.nombre_completo || ''} onChange={(e) => handleInputChange(e, 'nombre_completo')} />
              </div>
              <div className="field" style={{ flex: 0.8 }}>
                <span className="field-label">Edad</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.edad || ''} onChange={(e) => handleInputChange(e, 'edad')} />
              </div>
              <div className="field" style={{ flex: 1.2 }}>
                <span className="field-label">Expediente</span>
                <input type="text" className="line-input" value={appointmentId || ''} disabled />
              </div>
            </div>
            <div className="form-row">
              <div className="field chk-group" style={{ flex: 1 }}>
                <span className="field-label">Sexo</span>
                <label className="chk-label"><input type="radio" name="sexo" checked={accumulatedData.pagina_1.sexo === 'Fem'} onChange={() => onUpdate('pagina_1', { sexo: 'Fem' })} /> Fem</label>
                <label className="chk-label"><input type="radio" name="sexo" checked={accumulatedData.pagina_1.sexo === 'Mas'} onChange={() => onUpdate('pagina_1', { sexo: 'Mas' })} /> Mas</label>
              </div>
              <div className="field chk-group" style={{ flex: 1.5 }}>
                <span className="field-label">Edo. civil</span>
                {['Soltero', 'Casado', 'Viuda(o)'].map(civil => (
                  <label key={civil} className="chk-label"><input type="radio" name="civil" checked={accumulatedData.pagina_1.civil === civil} onChange={() => onUpdate('pagina_1', { civil })} /> {civil}</label>
                ))}
              </div>
              <div className="field" style={{ flex: 1.5 }}>
                <span className="field-label">Ocupación</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.ocupacion || ''} onChange={(e) => handleInputChange(e, 'ocupacion')} />
              </div>
              <div className="field" style={{ flex: 0.8 }}>
                <span className="field-label">F/N</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.fn || ''} onChange={(e) => handleInputChange(e, 'fn')} />
              </div>
            </div>
            <div className="form-row">
              <div className="field" style={{ flex: 1 }}>
                <span className="field-label">Teléfono</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.telefono || ''} onChange={(e) => handleInputChange(e, 'telefono')} />
              </div>
              <div className="field" style={{ flex: 2.5 }}>
                <span className="field-label">Dirección</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.direccion || ''} onChange={(e) => handleInputChange(e, 'direccion')} />
              </div>
            </div>
          </div>

          {/* ANTECEDENTES */}
          <div className="grid-60-40">
            <div className="box" style={{ padding: 0, overflow: 'hidden', borderWidth: '2px' }}>
              <div className="full-width-title">Antecedentes patológicos heredofamiliares</div>
              <table className="tabla-antecedentes">
                <thead>
                  <tr>
                    <th className="text-left" style={{ width: '42%' }}>Enfermedades</th>
                    <th>Madre</th><th>Padre</th><th>Aa Mat</th><th>Ao Mat</th><th>Aa Pat</th><th>Ao Pat</th>
                  </tr>
                </thead>
                <tbody>
                  {['Diabetes Mellitus', 'Obesidad o sobrepeso', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas'].map((item) => (
                    <tr key={item}>
                      <td className="text-left">{item}</td>
                      {[...Array(6)].map((_, i) => (
                        <td key={i}><input type="checkbox" checked={accumulatedData.pagina_1[`heredo-${item}-${i}`] || false} onChange={(e) => handleCheckboxChange(`heredo-${item}-${i}`, e.target.checked)} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="box">
              <div className="box-title left-aligned">Antecedentes personales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5px', fontSize: '11px' }}>
                {['Diabetes', 'Obesidad', 'Hipertensión', 'Renales', 'Endocrinas', 'Tiroidea', 'Fracturas', 'Esguinces'].map(item => (
                  <label key={item} className="chk-label"><input type="checkbox" checked={accumulatedData.pagina_1[`pers-${item}`] || false} onChange={(e) => handleCheckboxChange(`pers-${item}`, e.target.checked)} /> {item}</label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-3-col">
            <div className="box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="box-title">Dolor</div>
              <img src={caritasImg} alt="EVA" style={{ maxWidth: '100%', height: 'auto' }} />
              <div className="escala-dolor-chk">
                {[...Array(10)].map((_, i) => (
                  <label key={i+1}>{i+1}<input type="checkbox" checked={accumulatedData.pagina_1.dolor_escala === (i+1)} onChange={() => onUpdate('pagina_1', { dolor_escala: (i+1) })} /></label>
                ))}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Dx Médicos</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`diag_med_${i}`] || ''} onChange={(e) => handleInputChange(e, `diag_med_${i}`)} />)}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Meds</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`med_${i}`] || ''} onChange={(e) => handleInputChange(e, `med_${i}`)} />)}
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-title">Motivo de consulta</div>
            <div className="motivo-container">
              <div className="motivo-lines">
                {[...Array(5)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`motivo_${i}`] || ''} onChange={(e) => handleInputChange(e, `motivo_${i}`)} />)}
              </div>
              <div className="alicia-box">
                <p><b>ALICIA:</b></p>
                <p>A: Antigüedad | L: Lugar | I: Incidencia | C: Caract. | I: Inten. | A: Agrav.</p>
              </div>
            </div>
          </div>

          <div className="footer">
            <p>ESA: Exploración sin alteraciones | ✓: Adecuado</p>
            <div className="page-num">1</div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * ============================================================================
 * PIEZA 2: COMPONENTE PÁGINA 2 (OBJETIVOS SMART Y EXPLORACIÓN FÍSICA)
 * ADAPTACIÓN: Contenido íntegro de PhysiotherapyFormPage2.tsx
 * ============================================================================
 */
const PhysiotherapyPage2Component: React.FC<PageProps> = ({ 
  accumulatedData, 
  onUpdate, 
  onBack, 
  onNext 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Lógica de marcadores (X) adaptada para persistencia global en accumulatedData
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Evita marcar si se hace clic en el botón de borrar
    if ((e.target as HTMLElement).closest('.btn-clear-as-icon')) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const currentMarkers = accumulatedData.pagina_2.markers || [];
      onUpdate('pagina_2', { markers: [...currentMarkers, { x, y }] });
    }
  };

  const clearAllMarkers = () => {
    onUpdate('pagina_2', { markers: [] });
  };

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => {
    onUpdate('pagina_2', { [id]: e.target.value });
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    onUpdate('pagina_2', { [id]: checked });
  };

  return (
    <>
      <style>{`
        /* Configuraciones Generales extraídas del archivo original */
        .hc-body-p2 * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --utc-blue: #2A4B8C;
            --utc-light-blue: #5575B3;
        }
        .hc-body-p2 {
            font-family: Arial, sans-serif;
            background-color: #525659;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            min-height: 100vh;
        }

        .controls-bar-p2 {
            width: 100%;
            max-width: 215.9mm;
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
            height: 30px; 
        }

        .btn-clear-as-icon {
            padding: 7px;
            background-color: #e74c3c;
            color: white;
            border: 2px solid #c0392b;
            border-radius: 8px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            border-style: solid;
        }
        .btn-clear-as-icon:hover { 
            background-color: #c0392b; 
            transform: scale(1.05);
        }
        
        .eraser-container {
            position: absolute;
            left: 10px;
            bottom: 10px;
            pointer-events: none;
            transform: translateX(-36px);
        }

        .btn-anterior-fixed {
            position: fixed;
            bottom: 32px;
            left: 32px;
            padding: 12px 32px;
            border-radius: 9999px;
            font-weight: bold;
            z-index: 50;
            border: none;
            transition: all 0.2s;
            background-color: var(--utc-blue);
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .btn-anterior-fixed:hover { transform: scale(1.05); background-color: var(--utc-light-blue); }

        .btn-siguiente-fixed {
            position: fixed;
            bottom: 32px;
            right: 32px;
            padding: 12px 32px;
            border-radius: 9999px;
            font-weight: bold;
            z-index: 50;
            border: none;
            transition: all 0.2s;
            background-color: #16a34a;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .btn-siguiente-fixed:hover { transform: scale(1.05); background-color: #15803d; }

        .page-p2 {
            background-color: #fff;
            width: 100%;
            max-width: 215.9mm;
            height: 279.4mm;
            padding: 10mm 15mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            color: var(--utc-blue);
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
            overflow: hidden;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .box-p2 {
            border: 2px solid var(--utc-blue);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: transparent;
            width: 100%;
        }

        .box-header-p2 {
            background-color: var(--utc-blue);
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            padding: 5px 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        input.line-input-p2 {
            border: none;
            border-bottom: 1px solid var(--utc-blue);
            background: transparent;
            font-size: 11px;
            color: #000;
            height: 16px;
            outline: none;
            width: 100%;
            font-family: Arial, sans-serif;
        }

        .free-text-p2 {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            font-size: 11px;
            color: #000;
            outline: none !important;
            resize: none;
            width: 100%;
            height: 100%;
            min-height: 20px;
            font-family: Arial, sans-serif;
            padding: 2px 6px;
            box-sizing: border-box;
            display: block;
        }

        .chk-group-p2 { display: flex; align-items: center; gap: 15px; flex-wrap: wrap;}
        .chk-label-p2 { display: flex; align-items: center; cursor: pointer; font-size: 11px; color: var(--utc-blue);}
        
        input[type="checkbox"] {
            appearance: none; -webkit-appearance: none;
            width: 11px; height: 11px;
            border: 1px solid var(--utc-blue);
            margin-right: 5px; position: relative; cursor: pointer;
            display: grid; place-content: center;
            background-color: #fff;
        }
        input[type="checkbox"]:checked::before {
            content: '✓';
            font-size: 10px; color: var(--utc-blue); font-weight: bold;
        }

        .smart-content { display: flex; flex-grow: 1; min-height: 340px; }
        .smart-left { width: 28%; border-right: 2px solid var(--utc-blue); padding: 10px; display: flex; flex-direction: column; }
        .smart-right { width: 72%; display: flex; flex-direction: column; padding: 10px 10px 0 10px; }
        .lines-container { display: flex; flex-direction: column; gap: 10px; margin-top: 5px; flex-grow: 1; }

        .smart-reminder { font-size: 9px; color: var(--utc-blue); margin-top: 10px; line-height: 1.3; }
        .smart-reminder ul { list-style: none; padding-left: 0; margin-top: 4px;}
        
        .plazos-wrapper { width: 100%; display: flex; flex-direction: column; flex-grow: 1; }
        .plazos-header { 
            display: flex; 
            background-color: var(--utc-blue); 
            color: white; 
            border-radius: 10px; 
            overflow: hidden; 
            margin-top: 10px; 
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        .plazos-header div { flex: 1; text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; border-right: 1px solid white; }
        .plazos-header div:last-child { border-right: none; }
        .plazos-columns { display: flex; flex-grow: 1; margin-top: 5px; }
        .plazos-columns textarea { flex: 1; border: none; border-right: 1px solid var(--utc-blue); background: transparent; resize: none; outline: none; padding: 8px; font-size: 11px; font-family: Arial, sans-serif; color: #000; }
        .plazos-columns textarea:last-child { border-right: none; }

        .table-responsive-p2 { width: 100%; overflow: hidden; } 
        .tabla-exploracion-p2 { width: 100%; border-collapse: collapse; text-align: center; }
        .tabla-exploracion-p2 th { color: var(--utc-blue); font-size: 14px; padding: 4px; border-bottom: 1px solid var(--utc-blue); border-right: 1px solid var(--utc-blue); }
        
        .tabla-exploracion-p2 td { border: 1px solid var(--utc-blue); height: 22px; padding: 0; vertical-align: middle; }
        .lbl-col-p2 { color: var(--utc-blue); font-size: 11px; width: 12%; text-align: center; padding: 4px;}

        .zona-content { display: flex; padding: 12px 15px; }
        .zona-left { width: 35%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-right: 1px dashed #ccc; padding-right: 10px; }
        .zona-right { width: 65%; padding-left: 20px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }

        .image-marker-container-p2 {
            position: relative;
            display: inline-block;
            cursor: crosshair;
        }
        .image-marker-container-p2 img {
            max-width: 100%;
            height: 190px;
            object-fit: contain;
        }
        .marker-p2 {
            position: absolute;
            color: red;
            font-weight: bold;
            font-size: 18px;
            transform: translate(-50%, -50%);
            pointer-events: none; 
            text-shadow: 1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white;
        }

        .form-row-zona { display: flex; align-items: center; flex-wrap: wrap; }
        .form-row-zona .lbl { width: 90px; font-weight: bold; font-size: 11px; color: var(--utc-blue); }
        .otros-row { display: flex; align-items: flex-end; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
        .otros-row .lbl { font-weight: bold; font-size: 11px; color: var(--utc-blue); }

        .footer-p2 { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; font-size: 9px; color: var(--utc-blue); border-top: 1px solid var(--utc-light-blue); padding-top: 5px; }
        .page-num-p2 { font-size: 14px; font-weight: bold; }

        @media print {
            @page { size: letter portrait; margin: 0; }
            .hc-body-p2 { padding: 0; background: white; }
            .controls-bar-p2, .btn-anterior-fixed, .btn-siguiente-fixed { display: none !important; }
            .eraser-container { display: none !important; }
            .page-p2 {
                box-shadow: none !important;
                width: 215.9mm !important;
                height: 279.4mm !important;
                padding: 10mm 15mm !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
            }
        }
      `}</style>

      <div className="hc-body-p2">
        <button className="btn-anterior-fixed" onClick={onBack}>Anterior</button>
        <button className="btn-siguiente-fixed" onClick={onNext}>Siguiente (P3) →</button>

        <div className="controls-bar-p2"></div>

        <div className="page-p2">
          {/* SECCIÓN 1: OBJETIVOS SMART */}
          <div className="box-p2">
            <div className="box-header-p2">Objetivos SMART</div>
            <div className="smart-content">
              <div className="smart-left">
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>
                  Objetivo del paciente:
                </div>
                <div className="lines-container">
                  {[...Array(8)].map((_, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      className="line-input-p2" 
                      value={accumulatedData.pagina_2[`obj_px_${i}`] || ''}
                      onChange={(e) => handleLocalInputChange(e, `obj_px_${i}`)}
                    />
                  ))}
                </div>
                <div className="smart-reminder">
                  <p>Recordando, SMART, donde:</p>
                  <ul>
                    <li>• <b>Alcanzable:</b> objetivos reales y acorde a la lesión.</li>
                    <li>• <b>Específico:</b> Establecer un tiempo o zona a trabajar.</li>
                    <li>• <b>Relevante:</b> que sea importante para la lesión y el px.</li>
                    <li>• <b>Tiempo:</b> plazo contemplado dentro de la evolución de la lesión.</li>
                    <li>• <b>Objetivo:</b> mejorar las habilidades.</li>
                  </ul>
                </div>
              </div>

              <div className="smart-right">
                <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '11px', marginRight: '5px' }}>
                    Objetivo general:
                  </span>
                  <input 
                    type="text" 
                    className="line-input-p2" 
                    style={{ flexGrow: 1 }} 
                    value={accumulatedData.pagina_2.obj_general || ''}
                    onChange={(e) => handleLocalInputChange(e, 'obj_general')}
                  />
                </div>

                <div className="plazos-wrapper">
                  <div className="plazos-header">
                    <div>Objetivos a corto plazo</div>
                    <div>Objetivos a mediano plazo</div>
                    <div>Objetivos a largo plazo</div>
                  </div>
                  <div className="plazos-columns">
                    <textarea 
                      placeholder="Escribe aquí..." 
                      value={accumulatedData.pagina_2.obj_corto || ''}
                      onChange={(e) => handleLocalInputChange(e, 'obj_corto')}
                    />
                    <textarea 
                      placeholder="Escribe aquí..." 
                      value={accumulatedData.pagina_2.obj_mediano || ''}
                      onChange={(e) => handleLocalInputChange(e, 'obj_mediano')}
                    />
                    <textarea 
                      placeholder="Escribe aquí..." 
                      value={accumulatedData.pagina_2.obj_largo || ''}
                      onChange={(e) => handleLocalInputChange(e, 'obj_largo')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: EXPLORACIÓN FÍSICA */}
          <div className="box-p2">
            <div className="box-header-p2">Exploración física</div>
            <div className="table-responsive-p2">
              <table className="tabla-exploracion-p2">
                <thead>
                  <tr>
                    <th colSpan={2} style={{ width: '33.33%' }}>Observación</th>
                    <th colSpan={2} style={{ width: '33.33%' }}>Inspección</th>
                    <th colSpan={2} style={{ width: '33.33%' }}>Palpación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="lbl-col-p2" rowSpan={2}>Marcha</td>
                    <td className="inp-col" rowSpan={2}>
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_marcha || ''} onChange={(e) => handleLocalInputChange(e, 'obs_marcha')} />
                    </td>
                    <td className="lbl-col-p2">Cicatriz</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_cicatriz || ''} onChange={(e) => handleLocalInputChange(e, 'ins_cicatriz')} />
                    </td>
                    <td className="lbl-col-p2">Temperatura</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_temp || ''} onChange={(e) => handleLocalInputChange(e, 'pal_temp')} />
                    </td>
                  </tr>
                  <tr>
                    <td className="lbl-col-p2">Hematoma</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_hematoma || ''} onChange={(e) => handleLocalInputChange(e, 'ins_hematoma')} />
                    </td>
                    <td className="lbl-col-p2" rowSpan={2}>Contractura</td>
                    <td className="inp-col" rowSpan={2}>
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_contractura || ''} onChange={(e) => handleLocalInputChange(e, 'pal_contractura')} />
                    </td>
                  </tr>
                  <tr>
                    <td className="lbl-col-p2" rowSpan={2}>Movilidad</td>
                    <td className="inp-col" rowSpan={2}>
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_movilidad || ''} onChange={(e) => handleLocalInputChange(e, 'obs_movilidad')} />
                    </td>
                    <td className="lbl-col-p2">Edema</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_edema || ''} onChange={(e) => handleLocalInputChange(e, 'ins_edema')} />
                    </td>
                  </tr>
                  <tr>
                    <td className="lbl-col-p2">Tumefacción</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_tumefaccion || ''} onChange={(e) => handleLocalInputChange(e, 'ins_tumefaccion')} />
                    </td>
                    <td className="lbl-col-p2">Dolor</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_dolor || ''} onChange={(e) => handleLocalInputChange(e, 'pal_dolor')} />
                    </td>
                  </tr>
                  <tr>
                    <td className="lbl-col-p2">Agilidad</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_agilidad || ''} onChange={(e) => handleLocalInputChange(e, 'obs_agilidad')} />
                    </td>
                    <td className="lbl-col-p2">Otro</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_otro || ''} onChange={(e) => handleLocalInputChange(e, 'ins_otro')} />
                    </td>
                    <td className="lbl-col-p2">Otro</td>
                    <td className="inp-col">
                      <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_otro || ''} onChange={(e) => handleLocalInputChange(e, 'pal_otro')} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 3: ESTADO DE LA ZONA (CON MARCADORES X) */}
          <div className="box-p2">
            <div className="box-header-p2">Estado de la zona</div>
            <div className="zona-content">
              <div className="zona-left">
                <div style={{ color: 'var(--utc-blue)', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                  Ubicación
                </div>
                <div 
                  className="image-marker-container-p2" 
                  ref={containerRef} 
                  onClick={handleImageClick}
                >
                  <img src={Humano1Img} alt="Ubicación Cuerpo" />
                  {(accumulatedData.pagina_2.markers || []).map((marker: any, index: number) => (
                    <div
                      key={index}
                      className="marker-p2"
                      style={{ left: marker.x, top: marker.y }}
                    >
                      ✖
                    </div>
                  ))}
                </div>

                <div className="eraser-container">
                    <button 
                        type="button" 
                        className="btn-clear-as-icon" 
                        title="Doble clic aquí para borrar TODAS las marcas"
                        onDoubleClick={clearAllMarkers}
                    >
                        <span role="img" aria-label="eraser">🧽</span>
                    </button>
                </div>
              </div>

              <div className="zona-right">
                {[
                  { label: 'Color:', options: ['Hematoma', 'Equimosis'] },
                  { label: 'Estado:', options: ['Seca', 'Brillante'] },
                  { label: 'Edema:', options: ['Leve', 'Moderado'] },
                  { label: 'Cicatriz:', options: ['Hipertrófica', 'Queloide'] },
                  { label: 'Heridas:', options: ['Escaras', 'Tumefacciones'] },
                ].map((row, idx) => (
                  <div className="form-row-zona" key={idx}>
                    <div className="lbl">{row.label}</div>
                    <div className="chk-group-p2">
                      {row.options.map(opt => (
                        <label className="chk-label-p2" key={opt}>
                          <input 
                            type="checkbox" 
                            checked={accumulatedData.pagina_2[`zona_${opt}`] || false}
                            onChange={(e) => handleCheckboxChange(`zona_${opt}`, e.target.checked)}
                          /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {[1, 2].map(num => (
                  <div className="otros-row" key={num} style={{ marginTop: num === 1 ? '15px' : '0' }}>
                    <div className="lbl">Otro:</div>
                    <input type="text" className="line-input-p2" style={{ flex: 1 }} value={accumulatedData.pagina_2[`otro_nom_${num}`] || ''} onChange={(e) => handleLocalInputChange(e, `otro_nom_${num}`)} />
                    <div className="lbl">Severidad:</div>
                    <input type="text" className="line-input-p2" style={{ flex: 1 }} value={accumulatedData.pagina_2[`otro_sev_${num}`] || ''} onChange={(e) => handleLocalInputChange(e, `otro_sev_${num}`)} />
                    <div className="lbl">Zona:</div>
                    <input type="text" className="line-input-p2" style={{ flex: 2 }} value={accumulatedData.pagina_2[`otro_zon_${num}`] || ''} onChange={(e) => handleLocalInputChange(e, `otro_zon_${num}`)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-p2">
            <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.</div>
            <div className="page-num-p2">2</div>
          </div>
        </div>
      </div>
    </>
  );
};
/**
 * ============================================================================
 * PIEZA 3: COMPONENTE PÁGINA 3 (NEUROMUSCULAR, MOVILIDAD Y GUARDADO)
 * ADAPTACIÓN: Contenido íntegro de PhysiotherapyFormPage3.tsx con lógica de API
 * ============================================================================
 */
const PhysiotherapyPage3Component: React.FC<PageProps> = ({ 
  accumulatedData, 
  onUpdate, 
  onBack, 
  onNext,
  isSaving, 
  setIsSaving
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  // --- LÓGICA DE MARCADORES (P3 - Dermatomas) ---
  const addMarker = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.btn-clear-as-icon')) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const currentMarkers = accumulatedData.pagina_3.markers || [];
      onUpdate('pagina_3', {
        markers: [...currentMarkers, { x, y, id: Date.now() }]
      });
    }
  };

  const clearMarkers = () => {
    onUpdate('pagina_3', { markers: [] });
  };

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, id: string) => {
    onUpdate('pagina_3', { [id]: e.target.value });
  };

  // --- LÓGICA DE GUARDADO FINAL EN BASE DE DATOS ---
  const handleFinalizarYGuardar = async () => {
  try {
    setIsSaving(true); 

    // 1. Extraemos los valores de forma segura
    const pId = parseInt(accumulatedData?.pagina_1?.paciente_id) || 1;
    const pNombre = accumulatedData?.pagina_1?.nombre_completo || "Paciente sin nombre";
    const aId = appointmentId ? parseInt(appointmentId) : null;

    const payload = {
      paciente_id: pId,
      paciente_nombre: pNombre,
      tipo: 'fisioterapia',
      datos: accumulatedData, 
      creado_por: user?.id || 2, 
      creado_por_nombre: user?.nombre || user?.name || "Practicante UTC",
      appointment_id: aId 
    };

    const response = await fetch('http://localhost:3001/api/historiales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      toast.success('¡Historial guardado con éxito!');
      
      // LA CORRECCIÓN:
      // Redirigimos a '/dashboard'. Tu routes.tsx ya sabe redirigir 
      // automáticamente al panel correcto (Admin o Practicante).
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 1500);

    } else {
      const errorData = await response.json();
      console.error("Error del servidor:", errorData);
      toast.error(`Error: ${errorData.error || 'Revisa la conexión con la API'}`);
    }
  } catch (error) {
    console.error("Error en el guardado final:", error);
    toast.error('Fallo crítico al conectar con el servidor.');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <>
      <style>{`
        .hc-body-p3 * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --utc-blue: #1F4287;
            --utc-light-blue: #5575B3;
        }
        .hc-body-p3 {
            font-family: Arial, Helvetica, sans-serif;
            background-color: #525659;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            min-height: 100vh;
        }

        .btn-anterior-p3 {
            position: fixed;
            bottom: 32px;
            left: 32px;
            padding: 12px 32px;
            border-radius: 9999px;
            font-weight: bold;
            z-index: 50;
            border: none;
            transition: all 0.2s;
            background-color: var(--utc-blue);
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }

        .btn-finalizar-p3 {
            position: fixed;
            bottom: 32px;
            right: 32px;
            padding: 12px 32px;
            border-radius: 9999px;
            font-weight: bold;
            z-index: 50;
            border: none;
            transition: all 0.2s;
            background-color: #27ae60;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .btn-finalizar-p3:disabled { background-color: #95a5a6; cursor: not-allowed; }

        .eraser-container-p3 {
            position: absolute;
            left: 10px;
            bottom: 10px;
            z-index: 10;
        }
        .btn-clear-as-icon-p3 {
            padding: 7px;
            background-color: #e74c3c;
            color: white;
            border: 2px solid #c0392b;
            border-radius: 8px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .page-p3 {
            background-color: #fff;
            width: 100%;
            max-width: 215.9mm;
            min-height: 279.4mm;
            padding: 12mm 15mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            color: #1F4287;
            display: flex;
            flex-direction: column;
            gap: 15px;
            position: relative;
            overflow: hidden;
            z-index: 1;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .page-p3::before {
            content: "utc";
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 280px;
            font-weight: 900;
            color: rgba(230, 235, 240, 0.4);
            z-index: -1;
            pointer-events: none;
            letter-spacing: -15px;
        }

        .box-p3 {
            border: 1.5px solid #1F4287;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            background: transparent;
            width: 100%;
            overflow: hidden;
        }

        .box-title-p3 {
            background-color: #1F4287;
            color: white;
            font-size: 14.5px;
            font-weight: bold;
            text-align: center;
            padding: 6px 0;
            border-bottom: 1.5px solid #1F4287;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .free-text-p3 {
            border: none !important;
            background: transparent !important;
            font-size: 12px;
            color: #333;
            outline: none !important;
            resize: none;
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            padding: 4px 6px;
            display: block;
        }

        .tabla-p3 { width: 100%; border-collapse: collapse; text-align: center; height: 100%; }
        .tabla-p3 th { color: #1F4287; font-size: 12.5px; font-weight: bold; padding: 7px 4px; border: 1px solid #1F4287; }
        .tabla-p3 td { border: 1px solid #1F4287; padding: 0; vertical-align: middle; }
        
        .movilidad-box-p3 th, .movilidad-box-p3 td, .movilidad-box-p3 textarea, .movilidad-box-p3 span {
            font-size: 7.2px !important;
        }
        .movilidad-box-p3 td { height: 12px !important; }

        .image-marker-container-p3 {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            min-height: 230px;
            cursor: crosshair;
            padding: 10px;
            background-color: #fff;
        }
        .image-marker-container-p3 img { max-width: 100%; max-height: 220px; object-fit: contain; }
        .marker-p3 {
            position: absolute;
            color: #e74c3c;
            font-weight: bold;
            font-size: 16px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            text-shadow: 1px 1px 0px white;
        }

        .signatures-area-p3 { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding: 0 30px; margin-bottom: 10px; }
        .signature-line-p3 { border-top: 1px solid #1F4287; width: 42%; text-align: center; font-size: 11.5px; color: #1F4287; font-weight: bold; padding-top: 6px; }
        
        .footer-p3 { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #1F4287; margin-top: auto; }

        @media print {
            @page { size: letter portrait; margin: 0; }
            .hc-body-p3 { padding: 0; background: white; }
            .btn-anterior-p3, .btn-finalizar-p3, .eraser-container-p3 { display: none !important; }
            .page-p3 { box-shadow: none !important; width: 215.9mm !important; height: 279.4mm !important; padding: 10mm 15mm !important; margin: 0 !important; }
        }
      `}</style>

      <div className="hc-body-p3">
        <button className="btn-anterior-p3" onClick={onBack}>Anterior</button>
        <button className="btn-finalizar-p3" onClick={handleFinalizarYGuardar} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Finalizar y Guardar'}
        </button>

        <div className="page-p3">
          <div className="flex gap-3 w-full">
            <div className="box-p3 flex-[0.8]">
              <div className="box-title-p3">Exploración de sensibilidad</div>
              <div className="relative">
                <div className="eraser-container-p3">
                  <button type="button" className="btn-clear-as-icon-p3" onDoubleClick={clearMarkers}>
                    <span role="img" aria-label="eraser">🧽</span>
                  </button>
                </div>
                <div className="image-marker-container-p3" ref={containerRef} onClick={addMarker}>
                  <img src={Humano2Img} alt="Dermatomas" />
                  {(accumulatedData.pagina_3.markers || []).map((marker: any) => (
                    <div key={marker.id} className="marker-p3" style={{ left: marker.x, top: marker.y }}>✖</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="box-p3 flex-1">
              <div className="box-title-p3">Exploración neuromuscular</div>
              <table className="tabla-p3">
                <thead>
                  <tr>
                    <th>Hallazgos por dermatomas</th>
                    <th colSpan={2}>Valoración de reflejos</th>
                    <th>Valoración de tono</th>
                  </tr>
                </thead>
                <tbody>
                  {['Bicipital', 'Tricipital', 'Rotuliano', 'Aquileo'].map((ref, i) => (
                    <tr key={ref}>
                      {i === 0 && <td rowSpan={4}><textarea className="free-text-p3" value={accumulatedData.pagina_3.hallazgos_derma || ''} onChange={(e)=>handleLocalInputChange(e, 'hallazgos_derma')}></textarea></td>}
                      <td className="font-bold p-1 bg-gray-50">{ref}</td>
                      <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`ref_${ref}`] || ''} onChange={(e)=>handleLocalInputChange(e, `ref_${ref}`)}></textarea></td>
                      {i === 0 && <td rowSpan={4}><textarea className="free-text-p3" value={accumulatedData.pagina_3.valoracion_tono || ''} onChange={(e)=>handleLocalInputChange(e, 'valoracion_tono')}></textarea></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="box-p3 movilidad-box-p3">
            <div className="box-title-p3">Movilidad</div>
            <table className="tabla-p3">
              <thead>
                <tr className="bg-gray-100">
                  <th colSpan={5} className="border-r-2 border-blue-900">Derecho</th>
                  <th colSpan={5}>Izquierdo</th>
                </tr>
                <tr>
                  <th style={{width: '16%'}}>Movimiento</th><th colSpan={2}>Fuerza</th><th colSpan={2} className="border-r-2 border-blue-900">Arco</th>
                  <th style={{width: '16%'}}>Movimiento</th><th colSpan={2}>Fuerza</th><th colSpan={2}>Arco</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-left px-2">Zona a valorar:</td>
                  <td colSpan={4} className="border-r-2 border-blue-900"><textarea className="free-text-p3" value={accumulatedData.pagina_3.zona_der || ''} onChange={(e)=>handleLocalInputChange(e, 'zona_der')}></textarea></td>
                  <td className="font-bold text-left px-2">Zona a valorar:</td>
                  <td colSpan={4}><textarea className="free-text-p3" value={accumulatedData.pagina_3.zona_izq || ''} onChange={(e)=>handleLocalInputChange(e, 'zona_izq')}></textarea></td>
                </tr>
                {['Flexión', 'Extensión', 'Abducción', 'Rot. Interna', 'Rot. Externa', 'Desv. Radial', 'Desv. Cubital'].map((mov) => (
                  <tr key={mov}>
                    <td className="font-bold">{mov}</td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_fza1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_fza1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_fza2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_fza2_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_arc1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_arc1_${mov}`)}></textarea></td>
                    <td className="border-r-2 border-blue-900"><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_arc2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_arc2_${mov}`)}></textarea></td>
                    <td className="font-bold">{mov}</td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_fza1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_fza1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_fza2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_fza2_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_arc1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_arc1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_arc2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_arc2_${mov}`)}></textarea></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="text-left p-1 border-r-2 border-blue-900">
                    <span className="font-bold">Observaciones:</span>
                    <textarea className="free-text-p3 h-8" value={accumulatedData.pagina_3.obs_der || ''} onChange={(e)=>handleLocalInputChange(e, 'obs_der')}></textarea>
                  </td>
                  <td colSpan={5} className="text-left p-1">
                    <span className="font-bold">Observaciones:</span>
                    <textarea className="free-text-p3 h-8" value={accumulatedData.pagina_3.obs_izq || ''} onChange={(e)=>handleLocalInputChange(e, 'obs_izq')}></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="box-p3">
            <div className="box-title-p3">Pruebas específicas</div>
            <table className="tabla-p3 text-[10px]">
              <thead><tr className="bg-gray-100"><th>Pruebas</th><th>Hallazgos</th></tr></thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`prueba_${i}`] || ''} onChange={(e)=>handleLocalInputChange(e, `prueba_${i}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`hallazgo_${i}`] || ''} onChange={(e)=>handleLocalInputChange(e, `hallazgo_${i}`)}></textarea></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="signatures-area-p3">
            <div className="signature-line-p3">Nombre, matrícula y firma del alumno</div>
            <div className="signature-line-p3">Nombre, cédula y firma del docente responsable</div>
          </div>

          <div className="footer-p3">
            <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.</div>
            <div className="font-bold text-lg">3</div>
          </div>
        </div>
      </div>
    </>
  );
};
export default PhysiotherapyMasterForm ;
