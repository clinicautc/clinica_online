import React, { useState, useRef } from 'react';
// IMPORTA LA IMAGEN AQUÍ PARA QUE REACT LA RECONOZCA
import Humano1Img from './Humano_1.png'; 
// Importamos las páginas para la navegación interna
import PhysiotherapyFormPage from './PhysiotherapyFormPage';
import PhysiotherapyFormPage3 from './PhysiotherapyFormPage3';

const HistoriaClinicaPag2: React.FC = () => {
  // Estado para manejar la navegación interna
  const [currentPage, setCurrentPage] = useState(2);
  // Estado para manejar los marcadores (X) en la imagen
  const [markers, setMarkers] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lógica de navegación condicional
  if (currentPage === 1) {
    return <PhysiotherapyFormPage />;
  }

  if (currentPage === 3) {
    return <PhysiotherapyFormPage3 />;
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.btn-clear-as-icon')) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMarkers([...markers, { x, y }]);
    }
  };

  const clearAllMarkers = () => {
    setMarkers([]);
  };

  return (
    <>
      <style>{`
        /* Configuraciones Generales */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --utc-blue: #2A4B8C;
            --utc-light-blue: #5575B3;
        }
        .body-wrapper {
            font-family: Arial, sans-serif;
            background-color: #525659;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            min-height: 100vh;
        }

        .controls-bar {
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

        /* ESTILO BOTÓN ANTERIOR */
        .btn-anterior {
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
        .btn-anterior:hover { transform: scale(1.05); background-color: var(--utc-light-blue); }

        /* ESTILO BOTÓN PÁGINA 3 */
        .btn-pagina3 {
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
        .btn-pagina3:hover { transform: scale(1.05); background-color: #15803d; }

        .page {
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
        }

        .box {
            border: 2px solid var(--utc-blue);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: transparent;
            width: 100%;
        }

        .box-header {
            background-color: var(--utc-blue);
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            padding: 5px 0;
        }

        input.line-input {
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

        .free-text {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            font-size: 11px;
            color: #000;
            outline: none !important;
            resize: none;
            width: 100%;
            height: 100%;
            min-height: 24px;
            font-family: Arial, sans-serif;
            padding: 6px;
            box-sizing: border-box;
            display: block;
        }

        .chk-group { display: flex; align-items: center; gap: 15px; flex-wrap: wrap;}
        .chk-label { display: flex; align-items: center; cursor: pointer; font-size: 11px; color: var(--utc-blue);}
        
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
        .plazos-header { display: flex; background-color: var(--utc-blue); color: white; border-radius: 10px; overflow: hidden; margin-top: 10px; }
        .plazos-header div { flex: 1; text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; border-right: 1px solid white; }
        .plazos-header div:last-child { border-right: none; }
        .plazos-columns { display: flex; flex-grow: 1; margin-top: 5px; }
        .plazos-columns textarea { flex: 1; border: none; border-right: 1px solid var(--utc-blue); background: transparent; resize: none; outline: none; padding: 8px; font-size: 11px; font-family: Arial, sans-serif; color: #000; }
        .plazos-columns textarea:last-child { border-right: none; }

        .table-responsive { width: 100%; overflow-x: auto; }
        .tabla-exploracion { width: 100%; border-collapse: collapse; text-align: center; }
        .tabla-exploracion th { color: var(--utc-blue); font-size: 14px; padding: 4px; border-bottom: 1px solid var(--utc-blue); border-right: 1px solid var(--utc-blue); }
        .tabla-exploracion td { border: 1px solid var(--utc-blue); height: 28px; padding: 0; vertical-align: middle; }
        .lbl-col { color: var(--utc-blue); font-size: 11px; width: 12%; text-align: center; padding: 4px;}

        .zona-content { display: flex; padding: 12px 15px; }
        .zona-left { width: 35%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-right: 1px dashed #ccc; padding-right: 10px; }
        .zona-right { width: 65%; padding-left: 20px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }

        .image-marker-container {
            position: relative;
            display: inline-block;
            cursor: crosshair;
        }
        .image-marker-container img {
            max-width: 100%;
            height: 190px;
            object-fit: contain;
        }
        .marker {
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

        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; font-size: 9px; color: var(--utc-blue); border-top: 1px solid var(--utc-light-blue); padding-top: 5px; }
        .page-num { font-size: 14px; font-weight: bold; }

        @media screen and (max-width: 768px) {
            .body-wrapper { padding: 10px; }
            .page { padding: 15px; height: auto; border-radius: 12px; }
            .smart-content { flex-direction: column; }
            .smart-left { width: 100%; border-right: none; border-bottom: 2px dashed var(--utc-blue); }
            .smart-right { width: 100%; }
            .plazos-header, .plazos-columns { flex-direction: column; }
            .zona-content { flex-direction: column; }
            .zona-left, .zona-right { width: 100%; padding: 0; border-right: none; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
            .eraser-container { bottom: 10px; transform: translateX(0); left: 10px; }
            .btn-anterior { bottom: 16px; left: 16px; padding: 8px 20px; }
            .btn-pagina3 { bottom: 16px; right: 16px; padding: 8px 20px; }
        }

        @media print {
            @page { size: letter portrait; margin: 0; }
            .body-wrapper { padding: 0; background: white; }
            .controls-bar, .btn-anterior, .btn-pagina3 { display: none !important; }
            .eraser-container { display: none !important; }
            .page {
                box-shadow: none !important;
                width: 215.9mm !important;
                height: 279.4mm !important;
                padding: 10mm 15mm !important;
            }
        }
      `}</style>

      <div className="body-wrapper">
        <button 
          className="btn-anterior"
          onClick={() => setCurrentPage(1)}
        >
          Anterior
        </button>

        <button 
          className="btn-pagina3"
          onClick={() => setCurrentPage(3)}
        >
          Página 3
        </button>

        <div className="controls-bar"></div>

        <div className="page">
          {/* SECCIÓN 1: OBJETIVOS SMART */}
          <div className="box">
            <div className="box-header">Objetivos SMART</div>
            <div className="smart-content">
              <div className="smart-left">
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>
                  Objetivo del paciente:
                </div>
                <div className="lines-container">
                  {[...Array(8)].map((_, i) => (
                    <input key={i} type="text" className="line-input" />
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
                  <input type="text" className="line-input" style={{ flexGrow: 1 }} />
                </div>

                <div className="plazos-wrapper">
                  <div className="plazos-header">
                    <div>Objetivos a corto plazo</div>
                    <div>Objetivos a mediano plazo</div>
                    <div>Objetivos a largo plazo</div>
                  </div>
                  <div className="plazos-columns">
                    <textarea placeholder="Escribe aquí..."></textarea>
                    <textarea placeholder="Escribe aquí..."></textarea>
                    <textarea placeholder="Escribe aquí..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: EXPLORACIÓN FÍSICA */}
          <div className="box">
            <div className="box-header">Exploración física</div>
            <div className="table-responsive">
              <table className="tabla-exploracion">
                <thead>
                  <tr>
                    <th colSpan={2} style={{ width: '33.33%' }}>Observación</th>
                    <th colSpan={2} style={{ width: '33.33%' }}>Inspección</th>
                    <th colSpan={2} style={{ width: '33.33%' }}>Palpación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="lbl-col" rowSpan={2}>Marcha</td>
                    <td className="inp-col" rowSpan={2}><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Cicatriz</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Temperatura</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                  </tr>
                  <tr>
                    <td className="lbl-col">Hematoma</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                    <td className="lbl-col" rowSpan={2}>Contractura</td>
                    <td className="inp-col" rowSpan={2}><textarea className="free-text"></textarea></td>
                  </tr>
                  <tr>
                    <td className="lbl-col" rowSpan={2}>Movilidad</td>
                    <td className="inp-col" rowSpan={2}><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Edema</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                  </tr>
                  <tr>
                    <td className="lbl-col">Tumefacción</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Dolor</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                  </tr>
                  <tr>
                    <td className="lbl-col">Agilidad</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Otro</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                    <td className="lbl-col">Otro</td>
                    <td className="inp-col"><textarea className="free-text"></textarea></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 3: ESTADO DE LA ZONA */}
          <div className="box">
            <div className="box-header">Estado de la zona</div>
            <div className="zona-content">
              <div className="zona-left">
                <div style={{ color: 'var(--utc-blue)', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                  Ubicación
                </div>
                <div 
                  className="image-marker-container" 
                  ref={containerRef} 
                  onClick={handleImageClick}
                >
                  <img src={Humano1Img} alt="Ubicación Cuerpo" />
                  {markers.map((marker, index) => (
                    <div
                      key={index}
                      className="marker"
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
                    <div className="chk-group">
                      {row.options.map(opt => (
                        <label className="chk-label" key={opt}>
                          <input type="checkbox" /> {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {[1, 2].map(num => (
                  <div className="otros-row" key={num} style={{ marginTop: num === 1 ? '15px' : '0' }}>
                    <div className="lbl">Otro:</div><input type="text" className="line-input" style={{ flex: 1 }} />
                    <div className="lbl">Severidad:</div><input type="text" className="line-input" style={{ flex: 1 }} />
                    <div className="lbl">Zona:</div><input type="text" className="line-input" style={{ flex: 2 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer">
            <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.</div>
            <div className="page-num">2</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HistoriaClinicaPag2;