/**
 * ============================================================================
 * ARCHIVO: PhysiotherapyFormPage.tsx (Hoja 1)
 * UBICACIÓN: src/pages/PhysiotherapyFormPage.tsx
 * PROPÓSITO: Formulario de Historia Clínica Fisioterapéutica - Parte 1
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// --- CORRECCIÓN DE IMPORTACIONES ---
// Se eliminan las extensiones .tsx para evitar errores de compilación en Vite
import caritasImg from './Caritas.png'; 
import PhysiotherapyFormPage2 from './PhysiotherapyFormPage2';

const HistoriaClinica: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  // Estado para manejar la navegación interna entre hojas del formulario
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * EFECTO DE PERSISTENCIA:
   * Evita que el usuario sea expulsado si presiona F5 dentro del formulario.
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('utc_current_user');
    if (!user && !isLoading && !savedUser) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Pantalla de carga breve para rehidratar sesión tras F5
  if (isLoading) {
    return <div className="hc-body" style={{color: 'white'}}>Cargando evaluación...</div>;
  }

  // Renderizado condicional de la segunda página
  if (currentPage === 2) {
    return <PhysiotherapyFormPage2 />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Configuraciones Generales */
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

        /* Contenedor de la Hoja */
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
        }

        /* HEADER */
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

        .title-sub-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 5px;
            padding: 0 10px;
        }
        .address { font-size: 9px; color: #5575B3; font-weight: bold;}
        .fecha-container { display: flex; align-items: flex-end; width: 140px; }

        /* CAJAS REDONDEADAS */
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

        /* FORMULARIOS */
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

        /* CHECKBOXES */
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

        .escala-dolor-chk {
            display: flex;
            width: 100%;
            justify-content: space-around;
            margin-top: 6px;
            flex-wrap: wrap;
            gap: 5px;
        }
        .escala-dolor-chk label {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 8px;
            font-weight: bold;
            color: #2A4B8C;
            cursor: pointer;
            gap: 2px;
        }

        /* TABLAS GLOBALES */
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th, td { border: 1px solid #5575B3; padding: 0; font-size: 8px; height: 14px; }
        th { color: #fff; background-color: #2A4B8C; font-weight: bold; print-color-adjust: exact; padding: 2px;}
        .text-left { text-align: left; padding-left: 4px; }

        input.table-input {
            width: 100%; height: 100%; border: none; background: transparent;
            text-align: center; font-size: 9px; outline: none; padding: 0 2px; color: #000;
        }

        .tabla-antecedentes th,
        .tabla-antecedentes td {
            border: 1px solid #2A4B8C !important;
            color: #2A4B8C !important;
            padding: 3px 4px;
            height: 18px;
        }
        .tabla-antecedentes th { background-color: transparent !important; font-size: 10.5px; }

        /* LAYOUT */
        .grid-60-40 { display: grid; grid-template-columns: 63% 35%; gap: 2%; }
        .grid-3-col { display: grid; grid-template-columns: 28% 34% 34%; gap: 2%; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .full-width-title {
            background-color: #2A4B8C;
            color: white; font-weight: bold; font-size: 11px;
            padding: 3px 0; text-align: center; width: 100%;
            print-color-adjust: exact;
        }

        .blank-lines { display: flex; flex-direction: column; gap: 4px; margin-top: 5px; }
        .motivo-container { display: flex; gap: 15px; }
        .motivo-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .alicia-box { width: 160px; font-size: 8px; border-left: 1px solid #2A4B8C; padding-left: 10px; }
        .alicia-box b { color: #2A4B8C; }

        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; font-size: 7px; color: #5575B3; border-top: 1px solid #ddd; padding-top: 5px;}
        .page-num { font-size: 12px; font-weight: bold; color: #2A4B8C; }

        /* ESTILOS BOTONES */
        .btn-salir {
          position: fixed; top: 16px; right: 16px; background-color: #e11d48; color: white; 
          padding: 8px 20px; border-radius: 8px; font-weight: bold; z-index: 50; border: none; cursor: pointer;
        }
        .btn-siguiente {
          position: fixed; bottom: 32px; right: 32px; padding: 12px 32px; border-radius: 9999px; 
          font-weight: bold; z-index: 50; border: none; transition: all 0.2s;
          background-color: #16a34a; color: white; cursor: pointer;
        }
        .btn-siguiente:hover { transform: scale(1.05); background-color: #15803d; }

        @media (max-width: 768px) {
            .hc-body { padding: 10px; background-color: #fff; }
            .page { padding: 15px; box-shadow: none; overflow: visible; }
            .header { flex-direction: column; align-items: center; }
            .grid-60-40, .grid-3-col, .grid-2 { grid-template-columns: 1fr; }
            .form-row { flex-direction: column; align-items: flex-start; }
            .motivo-container { flex-direction: column; }
            .alicia-box { width: 100%; border-left: none; border-top: 2px dashed #2A4B8C; padding-top: 10px; }
        }

        @media print {
            @page { size: letter; margin: 0; }
            .hc-body { padding: 0; background: none; }
            .page { box-shadow: none; border: none; width: 215.9mm; height: 279.4mm; }
            .btn-salir, .btn-siguiente { display: none; }
        }
      ` }} />

      <div className="hc-container hc-body">
        {/* BOTONES INTEGRADOS - Usando navegación de React para coherencia */}
        <button className="btn-salir" onClick={() => navigate(-1)}>
          Salir
        </button>

        <button 
          className="btn-siguiente"
          onClick={() => setCurrentPage(2)}
        >
          Siguiente
        </button>

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
                  <input type="text" className="line-input" />
                </div>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div className="box" style={{ marginTop: 0 }}>
            <div className="box-title left-aligned">Datos personales</div>
            <div className="form-row">
              <div className="field" style={{ flex: 3 }}><span className="field-label">Nombre completo</span><input type="text" className="line-input" /></div>
              <div className="field" style={{ flex: 0.8 }}><span className="field-label">Edad</span><input type="text" className="line-input" /></div>
              <div className="field" style={{ flex: 1.2 }}><span className="field-label">Expediente</span><input type="text" className="line-input" defaultValue={appointmentId} /></div>
            </div>
            <div className="form-row">
              <div className="field chk-group" style={{ flex: 1 }}>
                <span className="field-label">Sexo</span>
                <label className="chk-label"><input type="radio" name="sexo" /> Fem</label>
                <label className="chk-label"><input type="radio" name="sexo" /> Mas</label>
              </div>
              <div className="field chk-group" style={{ flex: 1.5 }}>
                <span className="field-label">Edo. civil</span>
                <label className="chk-label"><input type="radio" name="civil" /> Soltero</label>
                <label className="chk-label"><input type="radio" name="civil" /> Casado</label>
                <label className="chk-label"><input type="radio" name="civil" /> Viuda(o)</label>
              </div>
              <div className="field" style={{ flex: 1.5 }}><span className="field-label">Ocupación</span><input type="text" className="line-input" /></div>
              <div className="field" style={{ flex: 0.8 }}><span className="field-label">F/N</span><input type="text" className="line-input" /></div>
            </div>
            <div className="form-row">
              <div className="field" style={{ flex: 1 }}><span className="field-label">Teléfono</span><input type="text" className="line-input" /></div>
              <div className="field" style={{ flex: 2.5 }}><span className="field-label">Dirección</span><input type="text" className="line-input" /></div>
            </div>
          </div>

          {/* ANTECEDENTES PATOLÓGICOS */}
          <div className="grid-60-40">
            <div className="box" style={{ padding: 0, overflow: 'hidden', borderWidth: '2px' }}>
              <div className="full-width-title" style={{ fontSize: '13px', padding: '6px 0' }}>Antecedentes patológicos heredofamiliares</div>
              <div className="table-responsive">
                <table className="tabla-antecedentes">
                  <thead>
                    <tr>
                      <th className="text-left" style={{ width: '42%' }}>Enfermedades</th>
                      <th>Madre</th><th>Padre</th><th>Aa Mat</th><th>Ao Mat</th><th>Aa Pat</th><th>Ao Pat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Diabetes Mellitus', 'Obesidad o sobrepeso'].map((item) => (
                      <tr key={item}>
                        <td className="text-left">{item}</td>
                        {[...Array(6)].map((_, i) => <td key={i}><input type="checkbox" /></td>)}
                      </tr>
                    ))}
                    <tr>
                      <td className="text-left">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          Cáncer, tipo: <input type="text" className="line-input" style={{ marginLeft: '4px', flexGrow: 1, borderColor: '#2A4B8C' }} />
                        </div>
                      </td>
                      {[...Array(6)].map((_, i) => <td key={i}><input type="checkbox" /></td>)}
                    </tr>
                    {['Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales'].map((item) => (
                      <tr key={item}>
                        <td className="text-left">{item}</td>
                        {[...Array(6)].map((_, i) => <td key={i}><input type="checkbox" /></td>)}
                      </tr>
                    ))}
                    <tr>
                      <td className="text-left">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          Otras: <input type="text" className="line-input" style={{ marginLeft: '4px', flexGrow: 1, borderColor: '#2A4B8C' }} />
                        </div>
                      </td>
                      {[...Array(6)].map((_, i) => <td key={i}><input type="checkbox" /></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="box">
              <div className="box-title left-aligned">Antecedentes patológicos personales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {['Diabetes Mellitus', 'Obesidad o Sobrepeso'].map(item => (
                  <label key={item} className="chk-label"><input type="checkbox" /> {item}</label>
                ))}
                <label className="chk-label" style={{ display: 'flex' }}>Cáncer, tipo: <input type="text" className="line-input" style={{ marginLeft: '4px', flexGrow: 1 }} /></label>
                {['Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales', 'Fracturas', 'Esguinces'].map(item => (
                  <label key={item} className="chk-label"><input type="checkbox" /> {item}</label>
                ))}
                <label className="chk-label" style={{ display: 'flex' }}>Otras: <input type="text" className="line-input" style={{ marginLeft: '4px', flexGrow: 1 }} /></label>
              </div>
            </div>
          </div>

          {/* ESCALA Y DIAGNÓSTICOS */}
          <div className="grid-3-col">
            <div className="box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="box-title">Escala de dolor</div>
              <img src={caritasImg} alt="Escala de dolor 0-10" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
              <div className="escala-dolor-chk">
                {[...Array(10)].map((_, i) => (
                  <label key={i + 1}>{i + 1}<input type="checkbox" /></label>
                ))}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Diagnósticos médicos</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" />)}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Medicamentos</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" />)}
              </div>
            </div>
          </div>

          {/* ESTUDIOS Y NO PATOLÓGICOS */}
          <div className="grid-3-col">
            <div className="box">
              <div className="box-title">Estudios de gabinete</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" />)}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Qx o Tx previos</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" />)}
              </div>
            </div>
            <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="full-width-title">Antecedentes personales no patológicos</div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr><th></th><th>Frecuencia</th><th>Cantidad</th></tr>
                  </thead>
                  <tbody>
                    {['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'].map(item => (
                      <tr key={item}>
                        <td className="text-left"><label className="chk-label"><input type="checkbox" /> {item}</label></td>
                        <td><input type="text" className="table-input" /></td>
                        <td><input type="text" className="table-input" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* EJERCICIO Y GINECO */}
          <div className="grid-2">
            <div className="box">
              <div className="box-title">Ejercicio</div>
              <div className="form-row">
                <div className="field chk-group"><span className="field-label">Realiza ejercicio</span>
                  <label className="chk-label"><input type="radio" name="eje" /> No</label>
                  <label className="chk-label"><input type="radio" name="eje" /> Sí</label>
                </div>
                <div className="field"><span className="field-label">¿Cuál?</span><input type="text" className="line-input" /></div>
              </div>
              <div className="form-row">
                <div className="field"><span className="field-label">Frecuencia</span><input type="text" className="line-input" /></div>
                <div className="field"><span className="field-label">Intensidad</span><input type="text" className="line-input" /></div>
              </div>
              <div className="form-row"><div className="field"><span className="field-label">Tiempo</span><input type="text" className="line-input" /></div></div>
            </div>
            <div className="box">
              <div className="box-title">Antecedentes gineco-obstétricos</div>
              <div className="form-row">
                <div className="field"><span className="field-label">Gestas</span><input type="text" className="line-input" /></div>
                <div className="field-label">fueron:</div>
                <div className="field"><span className="field-label">P</span><input type="text" className="line-input" /></div>
                <div className="field"><span className="field-label">C</span><input type="text" className="line-input" /></div>
                <div className="field"><span className="field-label">A</span><input type="text" className="line-input" /></div>
              </div>
              <div className="form-row">
                <div className="field"><span className="field-label">FUM</span><input type="text" className="line-input" /></div>
                <div className="field chk-group"><span className="field-label">Embarazo</span>
                  <label className="chk-label"><input type="radio" name="emb" /> No</label>
                  <label className="chk-label"><input type="radio" name="emb" /> Sí</label>
                </div>
                <div className="field"><span className="field-label">SDG</span><input type="text" className="line-input" /></div>
              </div>
              <div className="form-row">
                <div className="field chk-group"><span className="field-label">Remplazo hormonal</span>
                  <label className="chk-label"><input type="radio" name="horm" /> No</label>
                  <label className="chk-label"><input type="radio" name="horm" /> Sí</label>
                </div>
              </div>
              <div className="form-row">
                <div className="field chk-group"><span className="field-label">Anticonceptivos</span>
                  <label className="chk-label"><input type="radio" name="anti" /> No</label>
                  <label className="chk-label"><input type="radio" name="anti" /> Sí</label>
                </div>
              </div>
            </div>
          </div>

          {/* MOTIVO DE CONSULTA */}
          <div className="box">
            <div className="box-title">Motivo de consulta</div>
            <div className="motivo-container">
              <div className="motivo-lines">
                {[...Array(10)].map((_, i) => <input key={i} type="text" className="line-input" />)}
              </div>
              <div className="alicia-box">
                <p><b>Recordando, dolor (ALICIA), donde:</b></p>
                <ul style={{ listStyle: 'none', marginTop: '5px' }}>
                  <li>• <b>A</b>ntigüedad</li>
                  <li>• <b>L</b>ugar: Zona</li>
                  <li>• <b>I</b>ncidencia: # episodios / frecuencia</li>
                  <li>• <b>C</b>aracterísticas</li>
                  <li>• <b>I</b>ntensidad</li>
                  <li>• <b>A</b>gravantes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="footer">
            <p>
              ESA: Exploración y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.<br />
              Aa: abuela; Ao: abuelo; Mat: materno (a); Pat: paterno (a); Qx: Cirugías; Tx: Tratamientos; G: Gestas; P: Partos; C: Cesárea; A: Abortos. FUM: Fecha de última menstruación. SDG: Semanas de Gestación
            </p>
            <div className="page-num">1</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoriaClinica;