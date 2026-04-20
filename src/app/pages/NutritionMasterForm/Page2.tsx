import React from 'react';

interface Props {
  accumulatedData: any;
  onUpdate: (page: string, data: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Page2({ accumulatedData, onUpdate, onBack, onNext }: Props) {
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    onUpdate('pagina_2', { [name]: val });
  };

  return (
    <>
      <style>{`
        :root { --primary-blue: #1d4d96; --light-blue: #f2f7ff; --border-blue: #1d4d96; --pdf-grey: #525659; --btn-cobalt: #1d4d96; }
        .form-container { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px 20px 60px 20px; background-color: var(--pdf-grey); display: flex; flex-direction: column; align-items: center; min-height: 100vh; position: relative; box-sizing: border-box; }
        .nav-button { position: fixed; bottom: 30px; padding: 14px 32px; border-radius: 50px; font-weight: bold; cursor: pointer; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.2s; color: white; background-color: var(--btn-cobalt); text-transform: uppercase; font-size: 13px; z-index: 1000; }
        .btn-back { left: 40px; } .btn-next { right: 40px; }
        .page { width: 800px; background-color: white; padding: 25px; box-sizing: border-box; border: none; box-shadow: 0 0 35px rgba(0,0,0,0.7); position: relative; }
        .section-header { background-color: var(--primary-blue); color: white; padding: 4px 12px; border-radius: 8px 8px 0 0; font-weight: bold; font-size: 13px; display: inline-block; margin-left: 5px; }
        .section-box { border: 1.5px solid var(--primary-blue); border-radius: 8px; padding: 8px; margin-top: -1.5px; margin-bottom: 8px; }
        .dieteticos-row { display: flex; align-items: center; margin-bottom: 1.5px; font-size: 9px; gap: 4px; }
        .dieteticos-row label { font-size: 9px; font-weight: 600; color: var(--primary-blue); }
        .dieteticos-line { flex-grow: 1; border-bottom: 1px solid var(--primary-blue); height: 14px; margin-left: 2px; display: flex; align-items: flex-end; }
        .dieteticos-line input { width: 100%; border: none; outline: none; font-size: 9px; padding: 0 3px; background: transparent; }
        .freq-grid { display: grid; grid-template-columns: repeat(5, 1fr); column-gap: 8px; row-gap: 0px; }
        .freq-item { display: flex; justify-content: space-between; align-items: center; font-size: 7.8px; border-bottom: 0.5px solid #d1d1d1; padding: 1px 0; color: var(--primary-blue); }
        .freq-val { color: var(--primary-blue); font-weight: bold; font-size: 7.5px; display: flex; align-items: center; }
        .freq-val input { width: 20px; border: none; text-align: right; font-weight: bold; color: var(--primary-blue); outline: none; background: transparent; font-size: 8px; margin-right: 6px; }
        .solicitud-wrapper { position: relative; margin-top: 12px; width: 100%; }
        .solicitud-box { border: 2px solid var(--primary-blue); border-radius: 15px; padding: 10px 8px 6px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; min-height: 40px; }
        .solicitud-tag { position: absolute; top: -10px; left: -2px; background-color: var(--primary-blue); color: white; padding: 1px 12px; border-radius: 8px 8px 8px 0; font-weight: bold; font-size: 11px; }
        .sol-item { display: flex; align-items: center; gap: 4px; font-size: 8px; color: var(--primary-blue); }
        .sol-line { flex-grow: 1; border-bottom: 1.2px solid var(--primary-blue); height: 12px; display: flex; align-items: flex-end; margin-left: 2px; }
        .sol-line input { width: 100%; border: none; outline: none; font-size: 8px; background: transparent; }
        .interpret-box { border: 1.5px solid var(--primary-blue); border-radius: 8px; min-height: 28px; margin-bottom: 5px; }
        .interpret-box textarea { width: 100%; border: none; outline: none; resize: none; padding: 3px 5px; box-sizing: border-box; font-family: inherit; font-size: 9px; line-height: 1.2; background: transparent; }
        .tables-container { display: flex; gap: 12px; margin-bottom: 5px; }
        .col-left { flex: 1.1; } .col-right { flex: 1; }
        table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
        th { background-color: var(--primary-blue); color: white; padding: 2px; font-weight: bold; border: 1px solid var(--primary-blue); text-align: center; }
        td { border: 1px solid var(--primary-blue); padding: 0; height: 14px; }
        td input { width: 100%; height: 100%; border: none; outline: none; padding: 0 3px; box-sizing: border-box; font-size: 8.5px; background: transparent; }
        .label-cell { color: var(--primary-blue); font-weight: 500; padding-left: 3px; }
        .dark-cell { background-color: var(--primary-blue); }
        .footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8px; color: var(--primary-blue); border-top: 1px solid #eee; padding-top: 4px; }
        @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .nav-button { display: none !important; } .form-container { background-color: white !important; padding: 0 !important; } .page { width: 100% !important; box-shadow: none !important; transform: scale(0.98); transform-origin: top center; } }
      `}</style>

      <div className="form-container">
        <button onClick={onBack} className="nav-button btn-back">← Página 1</button>
        <button onClick={onNext} className="nav-button btn-next">Página 3 →</button>

        <div className="page">
          <div className="section-header">Aspectos dietéticos</div>
          <div className="section-box">
            {[
              { label: 'Alergias alimentarias:', name: 'alergias' },
              { label: 'Intolerancias alimentarias:', name: 'intolerancias' },
              { label: 'Alimentos de preferencia:', name: 'preferencias' }
            ].map((item) => (
              <div className="dieteticos-row" key={item.name}>
                <label>{item.label}</label> 
                <input type="checkbox" name={`${item.name}_no`} checked={accumulatedData.pagina_2[`${item.name}_no`] || false} onChange={handleLocalChange} /> No 
                <input type="checkbox" name={`${item.name}_si`} checked={accumulatedData.pagina_2[`${item.name}_si`] || false} onChange={handleLocalChange} /> Sí 
                <label>Cuál</label> 
                <div className="dieteticos-line">
                  <input type="text" name={`${item.name}_txt`} value={accumulatedData.pagina_2[`${item.name}_txt`] || ''} onChange={handleLocalChange} />
                </div>
              </div>
            ))}
            <div className="dieteticos-row">
              <label>Alimentos que no le agradan o no acostumbre</label> 
              <div className="dieteticos-line">
                <input type="text" name="desagrados" value={accumulatedData.pagina_2.desagrados || ''} onChange={handleLocalChange} />
              </div>
            </div>
            <div className="dieteticos-row">
              <label>Comidas al día</label> 
              <div style={{ width: '25px' }} className="dieteticos-line">
                <input type="number" name="comidas_dia" value={accumulatedData.pagina_2.comidas_dia || ''} onChange={handleLocalChange} />
              </div>
              <label>Fuertes</label> 
              <div style={{ width: '25px' }} className="dieteticos-line">
                <input type="number" name="comidas_fuertes" value={accumulatedData.pagina_2.comidas_fuertes || ''} onChange={handleLocalChange} />
              </div>
              <label>Colaciones</label> 
              <div style={{ width: '25px' }} className="dieteticos-line">
                <input type="number" name="comidas_col" value={accumulatedData.pagina_2.comidas_col || ''} onChange={handleLocalChange} />
              </div>
              <label>¿Quién prepara sus alimentos?</label> 
              <div className="dieteticos-line">
                <input type="text" name="quien_prepara" value={accumulatedData.pagina_2.quien_prepara || ''} onChange={handleLocalChange} />
              </div>
            </div>
            {[
              { label: 'Modificó alimentación últimos 6 meses', name: 'modifico_alim' },
              { label: 'Dieta especial/recomendada previa', name: 'dieta_previa' },
              { label: 'Alimentación según estado de ánimo', name: 'alim_animo' },
              { label: 'Uso de laxantes', name: 'laxantes' },
              { label: 'Medicamentos para bajar de peso', name: 'meds_peso' }
            ].map((item) => (
              <div className="dieteticos-row" key={item.name}>
                <label>{item.label}</label> 
                <input type="checkbox" name={`${item.name}_no`} checked={accumulatedData.pagina_2[`${item.name}_no`] || false} onChange={handleLocalChange} /> No 
                <input type="checkbox" name={`${item.name}_si`} checked={accumulatedData.pagina_2[`${item.name}_si`] || false} onChange={handleLocalChange} /> Sí 
                <label>Cuál</label> 
                <div className="dieteticos-line">
                  <input type="text" name={`${item.name}_txt`} value={accumulatedData.pagina_2[`${item.name}_txt`] || ''} onChange={handleLocalChange} />
                </div>
              </div>
            ))}
          </div>

          <div className="section-header">Frecuencia de consumo</div>
          <div className="section-box">
            <div className="freq-grid">
              {[
                "Verduras", "Fruta²", "Cereal s/g", "Pan dulce nat", "Pan dulce UP", "Galletas", "Leguminosas", "Carne de res",
                "Carne de cerdo", "Carne de pollo", "Pavo", "Pescados", "Mariscos", "Huevo", "Prod. anim UP", "Quesos bcos",
                "Quesos amr", "Embutidos", "Leche s/sab", "Yogurt s/sab", "Leche UP", "Yogurt UP", "Oleaginosas", "Aceites",
                "Mantequilla", "Margarina", "Refresco", "Agua sab UP", "Jugos nat", "Jugos UP", "Helado", "Nieve", "Gelatinas",
                "Aguas frutas", "Té", "Café", "Agua natural", "Papas fritas", "Garnachas com", "Garnachas fri"
              ].map((f) => (
                <div className="freq-item" key={f}>
                  <span>{f}</span> 
                  <span className="freq-val">
                    <input type="number" name={`freq_${f}`} value={accumulatedData.pagina_2[`freq_${f}`] || ''} onChange={handleLocalChange} />/7d
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="tables-container">
            <div className="col-left">
              <table>
                <thead>
                  <tr><th>Antropometría</th><th>VO</th><th>Interpretación</th></tr>
                </thead>
                <tbody>
                  {[
                    { l: "Talla (m)", n: "talla", d: false }, { l: "Peso (kg)", n: "peso", d: false }, { l: "IMC (kg/m²)", n: "imc", d: true },
                    { l: "Peso Ideal/FAO (kg)", n: "peso_fao", d: false }, { l: "Circ. Muñeca (cm)", n: "muneca", d: true }, { l: "Diámetro codo (cm)", n: "codo", d: true },
                    { l: "Circ. Brazo (cm)", n: "brazo", d: true }, { l: "Circ. Abd (cm)", n: "abd", d: true }, { l: "Circ. Cintura (cm)", n: "cintura", d: false },
                    { l: "Circ. Cadera (cm)", n: "cadera", d: false }, { l: "ICC", n: "icc", d: true }, { l: "PCB (mm)", n: "pcb", d: true },
                    { l: "PCT (mm)", n: "pct", d: true }, { l: "PCSe (mm)", n: "pcse", d: true }, { l: "PCSi (mm)", n: "pcsi", d: true },
                    { l: "% Grasa SIRI", n: "grasa_siri", d: true }, { l: "% Grasa InBody", n: "grasa_inb", d: true }, { l: "IMG InBody", n: "img_inb", d: true },
                    { l: "MLG (kg)", n: "mlg", d: false }, { l: "IMLG (kg/m²)", n: "imlg", d: true }, { l: "cAMB (cm²)", n: "camb", d: true },
                    { l: "MMT InBody", n: "mmt_inb", d: true }, { l: "IMEA InBody", n: "imea_inb", d: true }, { l: "ACT (L)", n: "act", d: false },
                    { l: "Grasa Visc (L)", n: "grasa_visc", d: true }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="label-cell">{row.l}</td>
                      <td><input type="number" step="0.01" name={`antrop_${row.n}_vo`} value={accumulatedData.pagina_2[`antrop_${row.n}_vo`] || ''} onChange={handleLocalChange} /></td>
                      <td className={row.d ? "" : "dark-cell"}>
                        {row.d && <input type="text" name={`antrop_${row.n}_int`} value={accumulatedData.pagina_2[`antrop_${row.n}_int`] || ''} onChange={handleLocalChange} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="section-header" style={{ marginTop: '8px' }}>Interpretación antropométrica</div>
              <div className="interpret-box">
                <textarea name="int_antrop" value={accumulatedData.pagina_2.int_antrop || ''} onChange={handleLocalChange} rows={2}></textarea>
              </div>

              <div className="section-header">Signos Vitales</div>
              <table>
                <thead>
                  <tr><th>Parámetro</th><th>VO</th><th>Interpretación</th></tr>
                </thead>
                <tbody>
                  {["T. Arterial", "F. Resp (rpm)", "F. Card (lpm)", "Temp (°C)", "SO₂"].map((p, i) => (
                    <tr key={i}>
                      <td className="label-cell">{p}</td>
                      <td><input type="text" name={`sv_${p}_vo`} value={accumulatedData.pagina_2[`sv_${p}_vo`] || ''} onChange={handleLocalChange} /></td>
                      <td><input type="text" name={`sv_${p}_int`} value={accumulatedData.pagina_2[`sv_${p}_int`] || ''} onChange={handleLocalChange} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="col-right">
              <table>
                <thead>
                  <tr><th>Parámetros bioquímicos</th><th>VO</th><th>Interpretación</th></tr>
                </thead>
                <tbody>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <tr key={i}>
                      <td><input type="text" name={`bq_${i}_nom`} value={accumulatedData.pagina_2[`bq_${i}_nom`] || ''} onChange={handleLocalChange} /></td>
                      <td><input type="text" name={`bq_${i}_vo`} value={accumulatedData.pagina_2[`bq_${i}_vo`] || ''} onChange={handleLocalChange} /></td>
                      <td><input type="text" name={`bq_${i}_int`} value={accumulatedData.pagina_2[`bq_${i}_int`] || ''} onChange={handleLocalChange} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="section-header" style={{ marginTop: '8px' }}>Interpretación bioquímica</div>
              <div className="interpret-box">
                <textarea name="int_bioq" value={accumulatedData.pagina_2.int_bioq || ''} onChange={handleLocalChange} rows={2}></textarea>
              </div>

              <div className="solicitud-wrapper">
                <div className="solicitud-tag">Solicitud de análisis</div>
                <div className="solicitud-box">
                  {['Química Sanguínea', 'EGO', 'Biometría hemática'].map(s => (
                    <div className="sol-item" key={s}>
                      <input type="checkbox" name={`sol_${s}`} checked={accumulatedData.pagina_2[`sol_${s}`] || false} onChange={handleLocalChange} /> {s}
                    </div>
                  ))}
                  <div className="sol-item">
                    <input type="checkbox" name="sol_otro" checked={accumulatedData.pagina_2.sol_otro || false} onChange={handleLocalChange} /> Otro: 
                    <div className="sol-line">
                      <input type="text" name="sol_otro_txt" value={accumulatedData.pagina_2.sol_otro_txt || ''} onChange={handleLocalChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer">
            <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✔ Adecuado</div>
            <div className="page-num" style={{fontSize:'14px', fontWeight:'bold'}}>2</div>
          </div>
        </div>
      </div>
    </>
  );
}