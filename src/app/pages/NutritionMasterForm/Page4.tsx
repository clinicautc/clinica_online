import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { endpoints } from '../../lib/api';

interface Props {
  accumulatedData: any;
  onBack: () => void;
  appointmentId: string | undefined;
  user?: any;
}

export default function Page4({ accumulatedData, onBack, appointmentId, user }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleFinalizar = async () => {
    try {
      setIsSaving(true);
      const pId = parseInt(accumulatedData?.pagina_1?.paciente_id) || 5;
      const pNombre = accumulatedData?.pagina_1?.nombre || "Paciente";
      const aId = appointmentId ? parseInt(appointmentId) : null;

      const payload = {
        paciente_id: pId, 
        paciente_nombre: pNombre,
        tipo: 'nutricion',
        datos: accumulatedData, 
        creado_por: user?.id || 1, 
        creado_por_nombre: user?.nombre || "Practicante Nutrición",
        appointment_id: aId 
      };

      const response = await fetch(endpoints.historiales, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        toast.error("Error de integridad en Base de Datos.");
      } else {
        toast.success("Historial guardado exitosamente");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    bodyWrapper: { fontFamily: 'Segoe UI, Arial, sans-serif', backgroundColor: '#525659', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', },
    container: { backgroundColor: '#ffffff', width: '210mm', minHeight: '279mm', border: '3.5px solid #1a428a', borderRadius: '25px', padding: '15px', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', },
    btnNavigation: { position: 'fixed', bottom: '30px', left: '40px', backgroundColor: '#1a428a', color: 'white', padding: '14px 32px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.6)', zIndex: 1000, },
    btnFinalizar: { position: 'fixed', bottom: '30px', right: '40px', backgroundColor: isSaving ? '#95a5a6' : '#27ae60', color: 'white', padding: '14px 32px', borderRadius: '50px', border: 'none', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '13px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.6)', zIndex: 1000, },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '15px', },
    headerCell: { backgroundColor: '#1a428a', color: 'white', fontWeight: 'bold', textAlign: 'center', padding: '6px', border: '1px solid #1a428a', },
    seccionSuperior: { border: '2px solid #1a428a', borderRadius: '12px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', marginBottom: '15px', },
    colHeader: { backgroundColor: '#1a428a', color: 'white', textAlign: 'center', fontWeight: 'bold', padding: '6px', fontSize: '11px', borderRight: '1px solid white', },
    cellContent: { borderRight: '1.5px solid #1a428a', minHeight: '250px', padding: '8px', position: 'relative', },
    subCell: { height: '50%', borderBottom: '1.5px solid #1a428a', padding: '5px', display: 'flex', flexDirection: 'column', },
    labelBlue: { color: '#1a428a', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px', },
    smartList: { fontSize: '8.5px', color: '#1a428a', listStyle: 'none', padding: '0', margin: '0', position: 'absolute', bottom: '8px', left: '8px', },
    smartListLi: { position: 'relative', paddingLeft: '10px', marginBottom: '2px', },
    smartListBullet: { position: 'absolute', left: 0, fontWeight: 'bold', },
    intervencionContainer: { border: '2px solid #1a428a', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', },
    intervencionTitle: { backgroundColor: '#1a428a', color: 'white', textAlign: 'center', fontWeight: 'bold', padding: '2px', fontSize: '11px', textTransform: 'uppercase', },
    grid3Columns: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px', padding: '6px', },
    card: { border: '2px solid #1a428a', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100px', },
    cardHeader: { backgroundColor: '#1a428a', color: 'white', padding: '3px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', },
    calculoPorcionesContainer: { border: '1.5px solid #1a428a', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', },
    calculoPorcionesHeader: { backgroundColor: '#1a428a', color: 'white', padding: '2px 10px', fontWeight: 'bold', fontSize: '10px', display: 'inline-block', borderBottomRightRadius: '10px', },
    tablaPorciones: { width: '100%', borderCollapse: 'collapse', },
    tablaPorcionesTh: { color: '#1a428a', fontSize: '7px', textAlign: 'center', border: '0.5px solid #1a428a', padding: '2px 1px', },
    tablaPorcionesTd: { border: '0.5px solid #1a428a', padding: '0', },
    inputInvisible: { border: 'none', width: '100%', height: '100%', fontFamily: 'inherit', fontSize: 'inherit', outline: 'none', background: 'transparent', resize: 'none', padding: '4px', boxSizing: 'border-box', },
    inputLine: { border: 'none', borderBottom: '1px solid #1a428a', outline: 'none', flexGrow: 1, fontSize: '9px', padding: '0 4px', background: 'transparent', },
    inputHeaderInline: { border: 'none', borderBottom: '1px solid #1a428a', outline: 'none', fontSize: '10px', width: '40px', textAlign: 'center', color: '#1a428a', fontWeight: 'bold', background: 'transparent', }
  };

  return (
    <div style={styles.bodyWrapper}>
      <style>
        {`
          @media print {
            @page { size: auto; margin: 0mm; }
            .no-print { display: none !important; }
            html, body { background-color: white !important; margin: 0; padding: 0; height: 100%; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .body-wrapper { background-color: white !important; padding: 0 !important; }
            .printable-page { box-shadow: none !important; border: 3.5px solid #1a428a !important; width: 100% !important; margin: 0 !important; border-radius: 0 !important; transform: scale(0.97); transform-origin: top center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      <button className="no-print" style={styles.btnNavigation} onClick={onBack}>← Pagina 3</button>
      <button className="no-print" style={styles.btnFinalizar} onClick={handleFinalizar} disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Finalizar y Guardar'}
      </button>

      <div style={styles.container} className="printable-page">
        <div style={styles.seccionSuperior}>
          <div style={styles.colHeader}>Diagnósticos Nutricios</div>
          <div style={styles.colHeader}>Objetivo general</div>
          <div style={styles.colHeader}>Educación Nutricia</div>
          <div style={{...styles.colHeader, borderRight: 'none'}}>Consejería Nutricia</div>

          <div style={styles.cellContent}><textarea name="diag" style={styles.inputInvisible}></textarea></div>
          <div style={styles.cellContent}>
            <textarea className="objetivo-textarea" style={{...styles.inputInvisible, height: '140px'}}></textarea>
            <ul style={styles.smartList}>
              <li style={{listStyle: 'none', marginLeft: '-10px', marginBottom: '4px', color: '#1a428a'}}>En formato SMART (por sus siglas en inglés):</li>
              <li style={styles.smartListLi}><span style={styles.smartListBullet}>•</span><strong style={{color: '#1a428a'}}>Specific:</strong> Definición del fenómeno</li>
              <li style={styles.smartListLi}><span style={styles.smartListBullet}>•</span><strong style={{color: '#1a428a'}}>Measurable:</strong> Selección del indicador</li>
              <li style={styles.smartListLi}><span style={styles.smartListBullet}>•</span><strong style={{color: '#1a428a'}}>Achievable:</strong> Evaluación de factibilidad</li>
              <li style={styles.smartListLi}><span style={styles.smartListBullet}>•</span><strong style={{color: '#1a428a'}}>Relevant:</strong> Relación con el problema clínico</li>
              <li style={styles.smartListLi}><span style={styles.smartListBullet}>•</span><strong style={{color: '#1a428a'}}>Time-bound:</strong> Dinámica temporal de adaptación</li>
            </ul>
          </div>
          <div style={{...styles.cellContent, padding: 0}}>
            <div style={styles.subCell}><span style={styles.labelBlue}>Contenido (E-1.<input type="text" className="edu-cont-input" style={styles.inputHeaderInline} />)</span><textarea style={styles.inputInvisible}></textarea></div>
            <div style={{...styles.subCell, borderBottom: 'none'}}><span style={styles.labelBlue}>Aplicación (E-2.<input type="text" className="edu-app-input" style={styles.inputHeaderInline} />)</span><textarea style={styles.inputInvisible}></textarea></div>
          </div>
          <div style={{...styles.cellContent, padding: 0, borderRight: 'none'}}>
            <div style={styles.subCell}><span style={styles.labelBlue}>Bases/Acercamiento Teórico (C-1.<input type="text" className="cons-bases-input" style={styles.inputHeaderInline} />)</span><textarea style={styles.inputInvisible}></textarea></div>
            <div style={{...styles.subCell, borderBottom: 'none'}}><span style={styles.labelBlue}>Estrategias (C-2.<input type="text" className="cons-est-input" style={styles.inputHeaderInline} />)</span><textarea style={styles.inputInvisible}></textarea></div>
          </div>
        </div>

        <div style={styles.intervencionContainer}>
          <div style={styles.intervencionTitle}>Intervención</div>
          <div style={styles.grid3Columns}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>Indicación de Alimentos/Nutrimentos</div>
              <div style={{padding: '5px'}}>
                {[...Array(4)].map((_, i) => <input key={i} type="text" style={{...styles.inputLine, width: '100%', marginBottom: '4px', fontSize: '8px'}} />)}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>Requerimiento calórico</div>
              <div style={{padding: '3px 8px', color: '#1a428a', fontSize: '9px'}}>
                <div style={{display: 'flex', marginBottom: '2px'}}><input type="checkbox" style={{marginRight: '6px', width: '11px', height: '11px'}} /><div style={{flexGrow: 1}}><span style={{fontSize: '9px'}}>Ecuación predictiva</span><div style={{display: 'flex', alignItems: 'center'}}><span style={{fontSize: '7px'}}>Nombre:</span><input type="text" style={styles.inputLine} /></div></div></div>
                <div style={{display: 'flex', marginBottom: '2px'}}><input type="checkbox" style={{marginRight: '6px', width: '11px', height: '11px'}} /><div style={{flexGrow: 1}}><span style={{fontSize: '9px'}}>Ecuación rápida</span><div style={{display: 'flex', alignItems: 'center'}}><span style={{fontSize: '7px'}}>Peso:</span><input type="text" style={{...styles.inputLine, width:'30px'}} /><span style={{fontSize: '7px'}}>kg</span> <span style={{fontSize: '7px', marginLeft:'5px'}}>kcal/kg:</span><input type="text" style={styles.inputLine} /></div></div></div>
                <div style={{marginTop: '3px', display: 'flex', alignItems: 'baseline', fontWeight: 'bold'}}><span style={{fontSize: '9px'}}>Total</span><input type="text" style={{...styles.inputLine, fontWeight: 'bold', textAlign: 'center'}} /><span style={{fontSize: '9px'}}>kcal</span></div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>Cuadro dietosintético</div>
              <table style={{...styles.table, marginBottom: 0, border: 'none'}}>
                <thead><tr style={{backgroundColor: '#f0f4fa', fontSize: '6.5px'}}><th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>Macro</th><th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>%</th><th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>Kcal</th><th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>G</th><th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>g/kg</th></tr></thead>
                <tbody style={{fontSize: '8px'}}>
                  {["Proteína", "HCO", "Lípidos"].map(m => (
                    <tr key={m}><td style={{fontWeight: 'bold', color: '#1a428a', border: '1px solid #1a428a', padding: '1px 2px'}}>{m}</td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td></tr>
                  ))}
                  <tr style={{backgroundColor: '#f0f4fa'}}><td style={{fontWeight: 'bold', color: '#1a428a', border: '1px solid #1a428a', padding: '1px 2px'}}>Tot.</td><td style={{textAlign: 'center', fontWeight: 'bold', border: '1px solid #1a428a'}}>100%</td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td><td style={{border: '1px solid #1a428a'}}><input type="text" style={styles.inputInvisible} /></td><td style={{fontSize: '5px', textAlign: 'right', border: '1px solid #1a428a'}}>kcal/kg/d</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={styles.calculoPorcionesContainer}>
          <div style={styles.calculoPorcionesHeader}>Cálculo de porciones</div>
          <table style={styles.tablaPorciones}>
            <thead>
              <tr>
                <th style={styles.tablaPorcionesTh}>Grupo alimentario</th><th style={styles.tablaPorcionesTh}>DES</th><th style={styles.tablaPorcionesTh}>CM</th><th style={styles.tablaPorcionesTh}>COM</th><th style={styles.tablaPorcionesTh}>CV</th><th style={styles.tablaPorcionesTh}>CENA</th><th style={styles.tablaPorcionesTh}>RAC</th><th style={styles.tablaPorcionesTh}>KCAL</th><th style={styles.tablaPorcionesTh}>PROT</th><th style={styles.tablaPorcionesTh}>LIP</th><th style={styles.tablaPorcionesTh}>HCO</th>
              </tr>
            </thead>
            <tbody style={{fontSize: '7.5px'}}>
              {['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'].map(grupo => (
                <tr key={grupo}><td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>{grupo}</td>{[...Array(10)].map((_, i) => <td key={i} style={styles.tablaPorcionesTd}><input type="text" style={styles.inputInvisible} /></td>)}</tr>
              ))}
              <tr style={{backgroundColor: '#f2f5f9'}}><td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>Total</td><td colSpan={6} style={{border: '0.5px solid #1a428a'}}></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>kcal</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td></tr>
              <tr style={{backgroundColor: '#f2f5f9'}}><td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>% Adecuación</td><td colSpan={6} style={{border: '0.5px solid #1a428a'}}></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td><td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td></tr>
            </tbody>
          </table>
        </div>

        <table style={{...styles.table, marginBottom: '8px'}}>
          <thead>
            <tr><th colSpan={5} style={{...styles.headerCell, padding: '3px', fontSize: '11px'}}>Menú del día</th></tr>
            <tr style={{backgroundColor: '#f0f4fa', fontWeight: 'bold', textAlign: 'center', fontSize: '10px'}}>
              <td style={{border: '1px solid #1a428a', padding: '4px'}}>Desayuno</td><td style={{border: '1px solid #1a428a', padding: '4px'}}>C.M.</td><td style={{border: '1px solid #1a428a', padding: '4px'}}>Comida</td><td style={{border: '1px solid #1a428a', padding: '4px'}}>C.V.</td><td style={{border: '1px solid #1a428a', padding: '4px'}}>Cena</td>
            </tr>
          </thead>
          <tbody>
            <tr>{[...Array(5)].map((_, i) => <td key={i} style={{height: '140px', border: '1px solid #1a428a', padding: 0, verticalAlign: 'top'}}><textarea style={{...styles.inputInvisible, fontSize: '9px'}}></textarea></td>)}</tr>
          </tbody>
        </table>

        <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-around', textAlign: 'center', paddingBottom: '15px', fontSize: '10px'}}>
          <div style={{width: '40%', borderTop: '1px solid #000', paddingTop: '5px'}}>Nombre, matrícula y firma del alumno</div>
          <div style={{width: '40%', borderTop: '1px solid #000', paddingTop: '5px'}}>Nombre, cédula y firma del docente responsable</div>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '8px'}}>
          <div className="font-bold text-slate-500">ESA: Explorado y sin alteraciones; N/A: No Aplica</div>
          <div className="font-black text-lg text-[#1a428a]">4</div>
        </div>
      </div>
    </div>
  );
}