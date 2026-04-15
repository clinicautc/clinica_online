import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos las páginas para la navegación
import NutritionFormPage2 from './PhysiotherapyFormPage2'; 

const ReplicaFormatoNutricionalInteractivo: React.FC = () => {
  const navigate = useNavigate();
  // --- LÓGICA DE NAVEGACIÓN ---
  const [step, setStep] = useState(3);

  const handleBack = () => {
    setStep(2); // Regresa a la Página 2
  };

  const handleSave = () => {
    // Redirige al Dashboard del Administrador de Fisioterapia
    navigate('/dashboard'); 
  };

  // --- LÓGICA DE NAVEGACIÓN POR TECLADO (FLECHAS) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentInput = e.currentTarget;
      // Seleccionamos todos los inputs que no sean checkbox para la navegación secuencial
      const inputs = Array.from(document.querySelectorAll('input:not([type="checkbox"])')) as HTMLInputElement[];
      const currentIndex = inputs.indexOf(currentInput);

      if (e.key === 'ArrowDown' && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        inputs[currentIndex - 1].focus();
      }
    }
  };

  if (step === 2) {
    return <NutritionFormPage2 />;
  }

  return (
    <>
      <style>
        {`
          :root {
            --pdf-grey: #525659;
            --primary-blue: #1d4d96;
            --btn-cobalt: #1d4d96;
            --brand-blue: #2c5697;
          }

          /* FUERZA EL FONDO GRIS EN EL NAVEGADOR */
          html, body {
            margin: 0;
            padding: 0;
            background-color: var(--pdf-grey) !important;
            min-height: 100%;
          }

          @page {
            size: letter;
            margin: 0;
          }

          /* --- SOLUCIÓN PARA IMPRESIÓN A COLOR --- */
          @media print {
            html, body {
              background-color: #ffffff !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .form-container { 
              background-color: #ffffff !important; 
              padding: 0 !important; 
            }

            .contenedor-maestro-perimetral { 
              box-shadow: none !important; 
              border: 3.5px solid var(--brand-blue) !important; 
              margin: 0 !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
            }

            div[style*="backgroundColor: rgb(44, 86, 151)"],
            div[style*="background-color: #2c5697"],
            tr[style*="backgroundColor: rgb(44, 86, 151)"],
            .encabezado-azul-print {
              background-color: #2c5697 !important;
              color: white !important;
            }

            tr[style*="backgroundColor: rgb(242, 245, 249)"],
            td[style*="backgroundColor: rgb(242, 245, 249)"] {
              background-color: #f2f5f9 !important;
            }

            input { border: none !important; outline: none !important; }
            .nav-button { display: none !important; }
          }

          .form-container {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 40px 20px; 
            background-color: var(--pdf-grey);
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            position: relative;
            box-sizing: border-box;
          }

          .nav-button {
            position: fixed;
            bottom: 30px;
            padding: 14px 32px;
            border-radius: 50px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            transition: all 0.2s;
            color: white;
            background-color: var(--btn-cobalt);
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.5px;
            z-index: 1000;
          }
          .btn-back { left: 40px; }
          .btn-next { right: 40px; }
          .nav-button:hover {
            transform: translateY(-3px);
            background-color: #153a71; 
            box-shadow: 0 8px 20px rgba(0,0,0,0.7);
          }

          input {
            width: 100%;
            border: none;
            background: transparent;
            font-family: inherit;
            font-size: inherit;
            color: #2c5697;
            outline: none;
            padding: 0;
            margin: 0;
          }
          input[type="number"] { text-align: center; -moz-appearance: textfield; }
          input[type="number"]::-webkit-inner-spin-button, 
          input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          
          .linea-escritura {
            border-bottom: 1px solid #2c5697;
            text-align: left;
            padding: 2px 5px;
            height: 22px;
            box-sizing: border-box;
          }
          .espacio-blanco-separador {
            height: 15px; 
          }
          input[type="checkbox"] {
            cursor: pointer;
            width: 13px;
            height: 13px;
            accent-color: #2c5697;
          }
          .celda-hallazgo-compacta {
            padding: 1px 2px !important;
            height: 14px !important;
            font-size: 7.2px !important;
          }
          .contenedor-redondeado-azul {
            border: 2px solid #2c5697;
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 8px;
          }
          .input-unidad {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
          }
        `}
      </style>
      
      <div className="form-container">
        {/* BOTONES DE NAVEGACIÓN */}
        <button onClick={handleBack} className="nav-button btn-back">
          ← Página 2
        </button>
        <button onClick={handleSave} className="nav-button btn-next">
          Guardar
        </button>

        <div className="contenedor-maestro-perimetral" style={styles.contenedorMaestro}>
          
          {/* LAYOUT SUPERIOR - MATRIZ IMLO/IMG */}
          <div style={styles.layoutFilaSuperior}>
            <div id="columna-izquierda-matriz">
              <table style={styles.tablaGeneral}>
                <thead>
                  <tr style={styles.encabezadoTablaAzul} className="encabezado-azul-print">
                    <th style={{ ...styles.thTd, width: '16%' }}>IMLO (kg/sc/est²)</th>
                    <th style={{ ...styles.thTd, width: '16%' }}>IMG (Z muscular) (-1 H / -1 M)</th>
                    <th style={{ ...styles.thTd, width: '22%' }}>IMG Adecuada (0-4 H / 7-11 M)</th>
                    <th style={{ ...styles.thTd, width: '22%' }}>IMG Adecuada (5-8 H / 12-15 M)</th>
                    <th style={{ ...styles.thTd, width: '24%' }}>IMG Excesiva ({'>'}8 H / {'>'}15 M)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...styles.thTd, ...styles.celdaEnfasisGris }}>IMLO Bajo ( {'<'} 17 H / {'<'} 15 M )</td>
                    <td style={styles.thTd}>Caquexia</td>
                    <td style={styles.thTd}>Desnutrición proteico-energética / Si la grasa es normal pero bajo masa muscular</td>
                    <td style={styles.thTd}>Desnutrición proteico-energética / Si la grasa es normal pero bajo masa muscular</td>
                    <td style={styles.thTd}>Obesidad sarcopénica (si no hay Dx de previo) / Obesidad abdominal (hay Dx previo)</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.thTd, ...styles.celdaEnfasisGris }}>IMLO Normal ( 17 - 22 H / 15 - 21 M )</td>
                    <td style={styles.thTd}>Bajo en grasa</td>
                    <td style={styles.thTd}>Normolipidad</td>
                    <td style={styles.thTd}>Normolipidad</td>
                    <td style={styles.thTd}>Obesidad sarcopénica (si no hay Dx de previo) / Obesidad abdominal (hay Dx previo)</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.thTd, ...styles.celdaEnfasisGris }}>IMLO Alto ( 22 - 25 H / 21 - 23 M )</td>
                    <td style={styles.thTd}>Atleta con alto nivel muscular</td>
                    <td style={styles.thTd}>Persona físicamente activa</td>
                    <td style={styles.thTd}>Persona físicamente activa</td>
                    <td style={styles.thTd}>Sano, metabólicamente funcional (Sin Dx previo) / Obesidad clínica (Con Dx previo)</td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.thTd, ...styles.celdaEnfasisGris }}>IMLO Muy Alto ( 25 - 28 H / 23 - 25 M )</td>
                    <td colSpan={4} style={styles.thTd}><b>Sospecha de uso de esteroides / Obesidad mórbida</b></td>
                  </tr>
                  <tr>
                    <td style={{ ...styles.thTd, ...styles.celdaEnfasisGris }}>IMLO Muy Alto ( {'>'} 28 H / {'>'} 25 M )</td>
                    <td colSpan={4} style={styles.thTd}><b>Diagnóstico de uso de esteroides / Obesidad mórbida</b></td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: '9.5px' }}>
                <b>Diagnóstico Matriz IMLO/IMG:</b> <input type="text" onKeyDown={handleKeyDown} style={{width: '60%', borderBottom: '1px solid #2c5697', textAlign: 'left'}} />
              </div>
            </div>

            <div id="columna-derecha-hallazgos">
              <table style={{ ...styles.tablaGeneral, marginBottom: 0 }}>
                <thead>
                  <tr style={styles.encabezadoTablaAzul} className="encabezado-azul-print">
                    <th colSpan={2} style={{ ...styles.thTd, textAlign: 'left', paddingLeft: '10px', fontSize: '8px' }}>Hallazgos físicos</th>
                    <th style={{ ...styles.thTd, width: '22%', textAlign: 'center' }}>DEN</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Hallazgos grales", "Adiposidad", "Músculo", "Cardiovascular",
                    "Respiratorio", "Digestivo", "Edema", "Extremidades",
                    "Ojos", "Pelo", "Cabeza", "Manos y uñas", "Boca / Lengua",
                    "Cuello / Piel", "Dientes", "Garganta"
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="celda-hallazgo-compacta" style={{ ...styles.thTd, ...styles.alignLeftPadding, width: '40%' }}>{item}</td>
                      <td className="celda-hallazgo-compacta" style={styles.thTd}><input type="text" onKeyDown={handleKeyDown} style={{textAlign: 'left', fontSize: '7.2px'}} /></td>
                      <td className="celda-hallazgo-compacta" style={styles.thTd}><input type="text" onKeyDown={handleKeyDown} style={{fontSize: '7.2px'}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.tituloSeccionAzul} className="encabezado-azul-print">Recordatorio de 24 horas</div>
          
          <div style={styles.layoutFilaMediaRecortada}>
            <div style={styles.cajaRecordatorioPrincipalRecortada}>
              <div style={styles.headerDatosRecordatorio}>
                <span><b>Fecha:</b> <input type="text" onKeyDown={handleKeyDown} style={{width: '100px', borderBottom: '1px solid #2c5697', textAlign: 'left'}} /></span>
                <span><b>Hora:</b> <input type="text" onKeyDown={handleKeyDown} style={{width: '100px', borderBottom: '1px solid #2c5697', textAlign: 'left'}} /></span>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#f2f5f9', borderBottom: '1.5px solid #2c5697' }}>
                <div style={{ width: '20%', padding: '4px', borderRight: '1.5px solid #2c5697', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5px' }}>Hora</div>
                <div style={{ width: '80%', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5px' }}>Contenido (platillo: cantidad y alimento)</div>
              </div>
              
              <div className="espacio-blanco-separador"></div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <div style={{ width: '20%', borderRight: '1.5px solid #2c5697' }}><input onKeyDown={handleKeyDown} className="linea-escritura" style={{textAlign: 'center'}} /></div>
                    <div style={{ width: '80%' }}><input onKeyDown={handleKeyDown} className="linea-escritura" /></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.contenedorAlimentosOlvidadosVertical}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '8.5px', marginBottom: '5px', textAlign: 'center' }}>Alimentos olvidados:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '7.5px', lineHeight: '1.1' }}>
                <span>• Agua</span><span>• Café / Té</span><span>• Leche</span><span>• Azúcar / Endulzante</span>
                <span>• Jugos / Refresco</span><span>• Agua de sabor</span><span>• Sal</span><span>• Chile / Salsas</span>
                <span>• Caramelos / Chicle</span><span>• Galletas / Pastel</span><span>• Aguacate</span>
                <span>• Gelatina</span><span>• Nieve / Helado</span><span>• Oleaginosas</span><span>• Chocolates</span>
                <span>• Papas / Palomitas</span><span>• Frutas</span><span>• TORTILLAS</span>
                <span>• Aceite / Crema</span><span>• Mantequilla</span>
              </div>
            </div>
          </div>

          <div style={styles.layoutFilaInferiorAcomodada}>
            <div id="col-porciones">
              <div style={{ ...styles.tituloSeccionAzul, width: '100%', boxSizing: 'border-box', fontSize: '11px', padding: '3px 20px' }} className="encabezado-azul-print">Consumo de porciones</div>
              <table style={styles.tablaGeneral}>
                <tbody>
                  <tr style={styles.celdaEnfasisGris}>
                    <th style={{ ...styles.thTd, width: '30%' }}>Grupo alimentario</th>
                    <th style={styles.thTd}>Porciones</th><th style={styles.thTd}>Energía</th><th style={styles.thTd}>Proteína</th><th style={styles.thTd}>Lípidos</th><th style={styles.thTd}>HCO</th>
                  </tr>
                  {["Verduras", "Frutas", "Cereales s/g", "Leguminosas", "POA ___", "Lácteo ___", "Aceites s/p", "Aceites c/p", "Azúcares"].map((grupo, idx) => (
                    <tr key={idx}>
                      <td style={{ ...styles.thTd, ...styles.alignLeftPadding }}>{grupo}</td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                    </tr>
                  ))}
                  <tr style={styles.celdaEnfasisGris}>
                    <td style={styles.thTd}>Total</td>
                    <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                    <td style={styles.thTd}><div className="input-unidad"><input type="number" onKeyDown={handleKeyDown} /><input type="text" placeholder="kcal" style={{fontSize: '7px'}} /></div></td>
                    <td style={styles.thTd}><div className="input-unidad"><input type="number" onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
                    <td style={styles.thTd}><div className="input-unidad"><input type="number" onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
                    <td style={styles.thTd}><div className="input-unidad"><input type="number" onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div id="col-macros">
              <div className="contenedor-redondeado-azul">
                <div style={{ ...styles.encabezadoTablaAzul, padding: '4px', textAlign: 'center' }} className="encabezado-azul-print">Distribución nutrimental actual</div>
                <table style={{ ...styles.tablaGeneral, marginBottom: 0 }}>
                  <tbody>
                    <tr style={styles.celdaEnfasisGris}>
                      <th style={styles.thTd}>Macronutrimento</th><th style={styles.thTd}>%</th><th style={styles.thTd}>Kcal</th><th style={styles.thTd}>Gramos</th><th style={styles.thTd}>g/kg</th>
                    </tr>
                    {["Proteína", "HCO", "Lípidos"].map((macro) => (
                      <tr key={macro}>
                        <td style={{ ...styles.thTd, ...styles.alignLeftPadding }}>{macro}</td>
                        <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      </tr>
                    ))}
                    <tr style={styles.celdaEnfasisGris}>
                      <td style={styles.thTd}>Totales</td><td style={styles.thTd}>100%</td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><input type="number" onKeyDown={handleKeyDown} /></td>
                      <td style={{ ...styles.thTd, fontSize: '6px' }}>Ideal 1.2-2.0 g/kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="contenedor-redondeado-azul">
                <div style={{ ...styles.encabezadoTablaAzul, padding: '4px', textAlign: 'center' }} className="encabezado-azul-print">Interpretación % IAN</div>
                <table style={{ ...styles.tablaGeneral, marginBottom: 0 }}>
                  <tbody>
                    {["Energía", "Proteína", "HCO", "Lípidos"].map((item) => (
                      <tr key={item}>
                        <td style={{ ...styles.thTd, ...styles.alignLeftPadding }}>{item}</td>
                        <td style={{ ...styles.thTd, fontSize: '7px' }}>Dieta <input type="text" onKeyDown={handleKeyDown} style={{display: 'inline', width: '40px', borderBottom: '1px solid #2c5697'}} /></td>
                        <td style={styles.thTd}>
                            <div className="input-unidad">
                              <input type="number" onKeyDown={handleKeyDown} style={{width: '35px'}} />
                              <span style={{fontSize: '8px'}}>%</span>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ ...styles.tituloSeccionAzul, fontSize: '11px', marginTop: '10px' }} className="encabezado-azul-print">Evaluación Cualitativa</div>
          <div style={styles.seccionEvaluacionCualitativa}>
            {[
              { text: "¿Incluye todos los nutrimentos esenciales (HC, proteínas, lípidos, vitaminas, minerales y agua)?", res: "Completa" },
              { text: "¿Los nutrimentos están en proporciones apropiadas entre sí?", res: "Equilibrada" },
              { text: "¿Los alimentos están libres de microorganismos patógenos, toxinas o contaminantes?", res: "Inocua" },
              { text: "¿No se consumen en cantidades excesivas de sodio, azúcares o grasas trans?", res: "Equilibrada" },
              { text: "¿Cubre los requerimientos energéticos y nutrimentales del individuo?", res: "Suficiente" },
              { text: "¿Incluye diferentes alimentos dentro de cada grupo alimenticio?", res: "Variada" },
              { text: "¿Es acorde a los gustos, cultura, hábitos y disponibilidad económica?", res: "Adecuada" }
            ].map((item, idx) => (
              <div key={idx} style={styles.lineaChecklist}>
                <input type="checkbox" /> No &nbsp; <input type="checkbox" /> Sí &nbsp; {item.text} &rarr; <b>{item.res}</b>
              </div>
            ))}
          </div>

          <div style={styles.piePaginaTexto}>
            <div>EEA: Explorada y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✔ Adecuado.</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>3</div>
          </div>

        </div>
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  contenedorMaestro: {
    backgroundColor: '#ffffff',
    width: '210mm', 
    minHeight: '279mm', 
    border: '3.5px solid #2c5697',
    borderRadius: '25px',
    padding: '12px',
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
  },
  tablaGeneral: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '8px',
    tableLayout: 'fixed',
  },
  thTd: {
    border: '1.5px solid #2c5697',
    padding: '2.5px',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontSize: '7.8px',
    lineHeight: '1.1',
  },
  tituloSeccionAzul: {
    backgroundColor: '#2c5697',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '4px 20px',
    borderRadius: '15px',
    display: 'inline-block',
    marginBottom: '8px',
    marginTop: '2px',
    width: 'fit-content'
  },
  encabezadoTablaAzul: {
    backgroundColor: '#2c5697',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '8.5px',
  },
  celdaEnfasisGris: {
    backgroundColor: '#f2f5f9',
    fontWeight: 'bold',
  },
  layoutFilaSuperior: {
    display: 'grid',
    gridTemplateColumns: '2.1fr 1fr',
    gap: '12px',
    width: '100%',
  },
  layoutFilaMediaRecortada: {
    display: 'grid',
    gridTemplateColumns: '3fr 1.1fr',
    gap: '10px',
    marginTop: '2px',
    marginBottom: '0',
    height: '185px',
    overflow: 'visible',
  },
  cajaRecordatorioPrincipalRecortada: {
    border: '2px solid #2c5697',
    borderRadius: '18px',
    height: '100%',
    overflow: 'hidden',
  },
  headerDatosRecordatorio: {
    borderBottom: '1.5px solid #2c5697',
    padding: '6px',
    display: 'flex',
    fontSize: '9px',
    gap: '15px',
  },
  contenedorAlimentosOlvidadosVertical: {
    border: '2px solid #2c5697',
    borderRadius: '15px',
    padding: '8px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
    boxSizing: 'border-box',
  },
  layoutFilaInferiorAcomodada: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '12px',
    marginTop: '65px', 
  },
  seccionEvaluacionCualitativa: {
    border: '2px solid #2c5697',
    borderRadius: '15px',
    padding: '8px',
    marginTop: '2px',
  },
  lineaChecklist: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '3px',
    fontSize: '9px',
  },
  piePaginaTexto: {
    marginTop: 'auto',
    fontSize: '7.5px',
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '2px',
  },
  alignLeftPadding: {
    textAlign: 'left',
    paddingLeft: '6px',
  }
};

export default ReplicaFormatoNutricionalInteractivo;