  /**
   * ============================================================================
   * ARCHIVO: NutritionMasterForm.tsx (Pestaña 1 de 4)
   * PROPÓSITO: Formulario Multi-pasos con persistencia de datos local.
   * ============================================================================
   */
  import React, { useState } from 'react';
  import { useNavigate } from 'react-router';
  import { useNutritionHistoriaData } from '../hooks/formClinico/useNutritionHistoriaData';
  // IMPORTACIÓN DE LA IMAGEN
  import bristolImg from './bristol.jpg';

  // --- INTERFAZ PARA LAS PROPS DE TODAS LAS PÁGINAS ---
  interface PageProps {
    accumulatedData: any;
    onUpdate: (page: string, data: any) => void;
    onBack: () => void;
    onNext: () => void;
    isReadOnly: boolean;
    historialId?: number | null;
    onGuardarDirecto?: () => void;
    isYaGuardado?: boolean;
    isSaving?: boolean;
    onFinalizarDirecto?: () => void;
  }

  const NutritionMasterForm = () => {
    const navigate = useNavigate();

    const {
      updateGlobalData, isSaving, yaGuardado, historialId, formData,
    } = useNutritionHistoriaData({});

    // Este componente ahora solo se monta cuando ya existe un historial
    // persistido (ver NutritionMasterFormRouteResolver.tsx) — es la
    // representación documental de solo lectura, nunca la interfaz de
    // captura en vivo (eso es NutricionPrimeraConsultaCaptura.tsx).
    const isReadOnly = true;

    // Los manejadores de edición ya no se disparan (fieldset disabled),
    // se conservan sin efecto para no tener que tocar cada referencia.
    const handleInputChange = (..._args: any[]) => {};

    return (
      <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .p1-outer { background: white !important; padding: 0 !important; }
          .p1-paper { transform: scale(0.87); transform-origin: top center; box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .p1-paper input[type="text"], .p1-paper textarea {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .p1-paper textarea.cell-ta {
          width: 100%;
          height: 100%;
          min-height: 13px;
          border: none;
          outline: none;
          padding: 0 2px;
          box-sizing: border-box;
          background: transparent;
          resize: none;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          overflow: hidden;
          font-family: inherit;
          font-size: 9px;
          line-height: 1.2;
          color: #333;
          display: block;
        }
        @media print {
          .p1-paper textarea { overflow: visible !important; height: auto !important; }
          .p1-paper tr, .p1-paper td { break-inside: avoid; }
        }
      `}</style>
      {/* Solo lectura: las 4 páginas se muestran apiladas (no hay wizard de
          pasos que navegar, no aplica a un documento ya finalizado) con un
          único botón "Volver", fuera del fieldset deshabilitado. */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 right-4 bg-slate-600 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-2xl z-50 transition-colors print:hidden flex items-center gap-2 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver
      </button>

      {/* fieldset disabled bloquea todos los controles descendientes
          (páginas 1-4) sin tener que tocar cada input individualmente;
          display:contents lo hace invisible en el layout calibrado en mm. */}
      <fieldset disabled={isReadOnly} className="contents">
      <div className="p1-outer bg-zinc-600 min-h-screen flex flex-col items-center px-2 sm:px-6 md:px-12 lg:px-24 xl:px-[220px] pt-5 pb-24 font-sans print:bg-white print:p-0 relative">

        {/* --- LAS 4 PÁGINAS SE MUESTRAN SIEMPRE, APILADAS --- */}
        <NutritionPage2Component
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly={isReadOnly}
        />

        <NutritionPage3Component
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly={isReadOnly}
        />

        <NutritionPage4Component
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly={isReadOnly}
          historialId={historialId}
          onGuardarDirecto={undefined}
          isYaGuardado={yaGuardado}
          isSaving={isSaving}
          onFinalizarDirecto={undefined}
        />
{/* --- PÁGINA 1 --- */}
        <div className="block">

          {/* CONTENEDOR HOJA A4 (DISEÑO UNIFORME SIN SUPERPOSICIONES) */}
          <div className="p1-paper bg-white w-full px-[8mm] pt-[6mm] pb-[6mm] relative shadow-2xl flex flex-col justify-between overflow-hidden text-[#2c5392] border-[3.5px] border-[#2c5392] rounded-[25px] print:shadow-none print:m-0">
            
            {/* ENCABEZADO */}
            <header className="flex justify-between items-start mb-1 shrink-0">
              <div className="leading-none shrink-0">
                <h1 className="text-[32px] font-black tracking-tighter mb-0">utc</h1>
                <p className="text-[7.5px] font-bold leading-tight uppercase">Universidad<br />Tres Culturas</p>
              </div>
              <div className="text-center flex-grow mt-1">
                <div className="bg-[#2c5392] text-white px-10 py-1.5 rounded-full text-[22px] font-bold inline-block mb-1">
                  Historia Clínica Nutricional
                </div>
                <p className="text-[8px] font-bold">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</p>
              </div>
              <div className="flex items-end gap-1 text-[9.5px] font-bold mt-3 border-b-2 border-[#2c5392] pb-0.5">
                <span>Fecha</span>
                <input
                  type="text"
                  id="fecha"
                  value={formData.pagina_1.fecha || ''}
                  onChange={(e) => handleInputChange(e, 'fecha')}
                  className="w-24 outline-none px-1 h-3.5 bg-transparent text-center font-bold text-[#333]"
                />
              </div>
            </header>

            {/* DATOS PERSONALES */}
            <SectionBox title="Datos personales" marginTop="mt-2">
              <div className="flex items-end gap-1 mb-1 text-[9.5px] font-bold w-full">
                <span className="shrink-0">Nombre completo</span>
      <input
    type="text"
    value={formData.pagina_1?.nombre || ''}
    onChange={(e) => handleInputChange(e, 'nombre')}
    disabled={isReadOnly}
    className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[#333]"
  />
                <span className="shrink-0 ml-2">Expediente</span>
                <input
                  type="text"
                  id="expediente"
                  value={formData.pagina_1.expediente || ''}
                  onChange={(e) => handleInputChange(e, 'expediente')}
                  className="border-b-[1.5px] border-[#2c5392] w-24 outline-none px-1 h-3.5 bg-transparent text-center text-[#333]"
                />
              </div>

              <div className="flex items-end gap-2 text-[9.5px] font-bold overflow-hidden w-full mb-1">
                <div className="flex items-end gap-1 shrink-0">
                  <span>Edad</span>
                  <input
                    type="text"
                    id="edad"
                    value={formData.pagina_1.edad || ''}
                    onChange={(e) => handleInputChange(e, 'edad')}
                    className="border-b-[1.5px] border-[#2c5392] w-10 outline-none px-1 h-3.5 bg-transparent text-center text-[#333]"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span>Sexo</span>
                  <CustomCheckbox
                    label="Fem"
                    checked={formData.pagina_1.sexo === 'Fem'}
                    onChange={() => updateGlobalData('pagina_1', {sexo: 'Fem'})}
                  />
                  <CustomCheckbox
                    label="Mas"
                    checked={formData.pagina_1.sexo === 'Mas'}
                    onChange={() => updateGlobalData('pagina_1', {sexo: 'Mas'})}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span>Edo. civil</span>
                  <CustomCheckbox
                    label="Soltero"
                    checked={formData.pagina_1.civil === 'Soltero'}
                    onChange={() => updateGlobalData('pagina_1', {civil: 'Soltero'})}
                  />
                  <CustomCheckbox
                    label="Casado"
                    checked={formData.pagina_1.civil === 'Casado'}
                    onChange={() => updateGlobalData('pagina_1', {civil: 'Casado'})}
                  />
                </div>
                <div className="flex items-end gap-1 flex-grow ml-2">
                  <span className="shrink-0">Ocupación</span>
                  <input
                    type="text"
                    id="ocupacion"
                    value={formData.pagina_1.ocupacion || ''}
                    onChange={(e) => handleInputChange(e, 'ocupacion')}
                    className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[#333]"
                  />
                </div>
                <div className="flex items-end gap-1 shrink-0">
                  <span>F/N</span>
                  <input
                    type="text"
                    id="fn"
                    value={formData.pagina_1.fn || ''}
                    onChange={(e) => handleInputChange(e, 'fn')}
                    className="border-b-[1.5px] border-[#2c5392] w-20 outline-none px-1 h-3.5 bg-transparent text-center text-[#333]"
                  />
                </div>
              </div>

              <div className="flex items-end gap-1 text-[9.5px] font-bold w-full">
                <span className="shrink-0">Teléfono</span>
                <input
                  type="text"
                  id="telefono"
                  value={formData.pagina_1.telefono || ''}
                  onChange={(e) => handleInputChange(e, 'telefono')}
                  className="border-b-[1.5px] border-[#2c5392] w-48 outline-none px-1 h-3.5 bg-transparent text-[#333]"
                />
                <span className="shrink-0 ml-2">Dirección</span>
                <input
                  type="text"
                  id="direccion"
                  value={formData.pagina_1.direccion || ''}
                  onChange={(e) => handleInputChange(e, 'direccion')}
                  className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[#333]"
                />
              </div>
            </SectionBox>

            {/* MOTIVOS Y QX */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <SectionBox title="Motivos de consulta" paddingX="px-2" marginTop="mt-2">
                <LineTextarea
                  id="motivos"
                  value={formData.pagina_1.motivos || ''}
                  onChange={handleInputChange}
                  rows={2}
                  lineHeight={16}
                />
              </SectionBox>
              <SectionBox title="Qx o Tx previos" paddingX="px-2" marginTop="mt-2">
                <LineTextarea
                  id="qx"
                  value={formData.pagina_1.qx || ''}
                  onChange={handleInputChange}
                  rows={2}
                  lineHeight={16}
                />
              </SectionBox>
            </div>

            {/* ANTECEDENTES GRID */}
            <div className="grid grid-cols-[1.7fr_1fr] gap-2 shrink-0">
              <SectionBox title="Antecedentes patológicos heredofamiliares" paddingX="px-0" marginTop="mt-2">
                <div className="w-full h-full overflow-hidden rounded-b-md">
                  <table className="w-full border-collapse text-[8.5px] font-bold table-fixed mt-0">
                    <thead>
                      <tr className="border-b-[1.5px] border-[#2c5392] bg-slate-50/50">
                        <th className="text-left pl-2 w-[40%] py-1">Enfermedades</th>
                        {['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'].map(h => <th key={h} className="text-[7.5px] py-1">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {['Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map((item) => (
                        <tr key={item} className="border-b-[1.5px] border-[#2c5392] h-[13.5px]">
                          <td className="text-left pl-2 border-r-[1.5px] border-[#2c5392] whitespace-nowrap overflow-hidden text-ellipsis">{item}</td>
                          {[...Array(6)].map((_, i) => (
                            <td key={i} className="border-r-[1.5px] border-[#2c5392] last:border-r-0">
                              <input
                                type="checkbox"
                                checked={formData.pagina_1[`heredo-${item}-${i}`] || false}
                                onChange={(e) => updateGlobalData('pagina_1', {[`heredo-${item}-${i}`]: e.target.checked})}
                                disabled={isReadOnly}
                                className="appearance-none w-2.5 h-2.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] cursor-pointer align-middle"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={7} className="text-left px-2 py-1 text-[8.5px]">
                          Otras: <input
                            type="text"
                            id="otrasHeredo"
                            value={formData.pagina_1.otrasHeredo || ''}
                            onChange={(e) => handleInputChange(e, 'otrasHeredo')}
                            className="border-b-[1.5px] border-[#2c5392] w-[80%] outline-none h-3.5 bg-transparent ml-1 text-[#333]"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </SectionBox>

              <SectionBox title="Antecedentes patológicos personales" marginTop="mt-2">
                <div className="flex flex-col justify-between h-full text-[9px] font-bold px-1 py-1">
                  {['Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map(item => (
                    <CustomCheckbox
                      key={item}
                      label={item}
                      checked={formData.pagina_1[`pers-${item}`] || false}
                      onChange={(e:any) => updateGlobalData('pagina_1', {[`pers-${item}`]: e.target.checked})}
                      textSize="text-[9px]"
                    />
                  ))}
                  <div className="flex items-end gap-1 mt-auto pt-2">
                    <span className="whitespace-nowrap">Otras:</span>
                    <input
                      type="text"
                      id="otrasPers"
                      value={formData.pagina_1.otrasPers || ''}
                      onChange={(e) => handleInputChange(e, 'otrasPers')}
                      className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none h-3.5 bg-transparent text-[#333]"
                    />
                  </div>
                </div>
              </SectionBox>
            </div>

            <div className="grid grid-cols-3 gap-2 shrink-0">
              <SectionBox title="Sintomatología" paddingX="px-0" className="row-span-2" marginTop="mt-2">
                <table className="w-full text-[8.5px] font-bold table-fixed border-collapse mt-0 h-full">
                  <thead><tr className="border-b-[1.5px] border-[#2c5392] bg-slate-50/50"><th className="text-left pl-2 border-r-[1.5px] border-[#2c5392] w-[60%] py-1">Enfermedades</th><th className="py-1">Freq./Cant.</th></tr></thead>
                  <tbody>
                    {['Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito', 'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia'].map(item => (
                      <tr key={item} className="border-b-[1.5px] border-[#2c5392] h-[14.5px]">
                        <td className="text-left pl-2 border-r-[1.5px] border-[#2c5392] flex items-center gap-1.5 h-full">
                          <input
                            type="checkbox"
                            checked={formData.pagina_1[`sintoma-check-${item}`] || false}
                            onChange={(e) => updateGlobalData('pagina_1', {[`sintoma-check-${item}`]: e.target.checked})}
                            className="appearance-none w-2.5 h-2.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] shrink-0 cursor-pointer align-middle"
                          />
                          <span className="truncate">{item}</span>
                        </td>
                        <td className="p-0 border-none h-full">
                          <input
                            type="text"
                            value={formData.pagina_1[`sintoma-val-${item}`] || ''}
                            onChange={(e) => updateGlobalData('pagina_1', {[`sintoma-val-${item}`]: e.target.value})}
                            className="w-full h-full border-none outline-none px-1.5 bg-transparent text-center text-[#333]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionBox>

              <SectionBox title="Escala de Bristol" className="text-center" marginTop="mt-2">
                <div className="flex flex-col items-center justify-center w-full h-full py-1">
                  <img
                    src={bristolImg}
                    alt="Escala de Bristol"
                    className="max-h-[60px] w-auto object-contain mix-blend-multiply mb-2"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/150x60?text=Bristol+Img";
                    }}
                  />
                  <div className="flex justify-between w-full px-5">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <input
                        key={num}
                        type="radio"
                        name="bristol_scale"
                        checked={formData.pagina_1.bristol === num}
                        onChange={() => updateGlobalData('pagina_1', {bristol: num})}
                        className="appearance-none w-3.5 h-3.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </SectionBox>

              <SectionBox title="Antecedentes personales no patológicos" paddingX="px-0" marginTop="mt-2" className="pb-0">
                <table className="w-full text-[8.5px] font-bold border-collapse table-fixed mt-0 h-full">
                  <thead>
                    <tr className="border-b-[1.5px] border-[#2c5392] bg-slate-50/50">
                      <th className="w-[45%] border-r-[1.5px] border-[#2c5392] py-1"></th>
                      <th className="border-r-[1.5px] border-[#2c5392] py-1">Frecuencia</th>
                      <th className="py-1">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="leading-none">
                    {['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'].map((item, index, array) => (
                      <tr key={item} className={`${index === array.length - 1 ? '' : 'border-b-[1.5px] border-[#2c5392]'} h-[16px]`}>
                        <td className="text-left pl-2 border-r-[1.5px] border-[#2c5392] flex items-center gap-1.5 h-full">
                          <input
                            type="checkbox"
                            checked={formData.pagina_1[`nopato-check-${item}`] || false}
                            onChange={(e) => updateGlobalData('pagina_1', {[`nopato-check-${item}`]: e.target.checked})}
                            className="appearance-none w-2.5 h-2.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] shrink-0 cursor-pointer align-middle"
                          />
                          <span className="truncate">{item}</span>
                        </td>
                        <td className="border-r-[1.5px] border-[#2c5392] p-0">
                          <input
                            type="text"
                            value={formData.pagina_1[`nopato-freq-${item}`] || ''}
                            onChange={(e) => updateGlobalData('pagina_1', {[`nopato-freq-${item}`]: e.target.value})}
                            className="w-full h-full border-none outline-none text-center bg-transparent text-[#333]"
                          />
                        </td>
                        <td className="p-0">
                          <input
                            type="text"
                            value={formData.pagina_1[`nopato-cant-${item}`] || ''}
                            onChange={(e) => updateGlobalData('pagina_1', {[`nopato-cant-${item}`]: e.target.value})}
                            className="w-full h-full border-none outline-none text-center bg-transparent text-[#333]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionBox>

              <SectionBox title="Diagnósticos médicos" paddingX="px-0" marginTop="mt-2">
                <div className="flex flex-col justify-between h-full border-t-[1.5px] border-[#2c5392]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-b-[1.5px] border-[#2c5392] last:border-b-0 flex-1 flex items-center">
                      <textarea
                        value={formData.pagina_1[`diag-med-${i}`] || ''}
                        onChange={(e) => updateGlobalData('pagina_1', {[`diag-med-${i}`]: e.target.value})}
                        className="cell-ta"
                      />
                    </div>
                  ))}
                </div>
              </SectionBox>

              <SectionBox title={
                <div className="flex gap-8 px-2 text-[9px]"><span>Medicamentos</span> <span>Dosis</span></div>
              } paddingX="px-1.5" marginTop="mt-2">
                <div className="flex flex-col justify-between h-full py-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center w-full gap-2">
                      <input
                        type="text"
                        value={formData.pagina_1[`med-nom-${i}`] || ''}
                        onChange={(e) => updateGlobalData('pagina_1', {[`med-nom-${i}`]: e.target.value})}
                        className="flex-1 h-[13px] border-b-[1.5px] border-[#2c5392] outline-none px-1 bg-transparent text-[9px] text-[#333]"
                      />
                      <input
                        type="text"
                        value={formData.pagina_1[`med-dos-${i}`] || ''}
                        onChange={(e) => updateGlobalData('pagina_1', {[`med-dos-${i}`]: e.target.value})}
                        className="flex-1 h-[13px] border-b-[1.5px] border-[#2c5392] outline-none px-1 bg-transparent text-[9px] text-[#333]"
                      />
                    </div>
                  ))}
                </div>
              </SectionBox>
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0">
              <SectionBox title="Ejercicio" marginTop="mt-2">
                <div className="flex flex-col gap-1 w-full h-full justify-center">
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full mb-1">
                    <span className="shrink-0">Realiza ejercicio</span>
                    <CustomCheckbox label="No" />
                    <CustomCheckbox label="Sí" />
                    <div className="flex gap-2 ml-auto">
                      <CustomCheckbox label="Aeróbico" />
                      <CustomCheckbox label="Anaeróbico" />
                    </div>
                  </div>
                  <FilaInput
                    label="¿Cuál?"
                    id="ejercicioCual"
                    value={formData.pagina_1.ejercicioCual || ''}
                    onChange={handleInputChange}
                  />
                  <div className="flex gap-3 w-full">
                    <FilaInput
                      label="Frecuencia"
                      id="frecuencia"
                      value={formData.pagina_1.frecuencia || ''}
                      onChange={handleInputChange}
                    />
                    <FilaInput
                      label="Intensidad"
                      id="intensidad"
                      value={formData.pagina_1.intensidad || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex gap-3 w-full">
                    <FilaInput
                      label="Tiempo"
                      id="tiempo"
                      value={formData.pagina_1.tiempo || ''}
                      onChange={handleInputChange}
                    />
                    <FilaInput
                      label="Volumen"
                      id="volumen"
                      value={formData.pagina_1.volumen || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <FilaInput
                    label="Progresión"
                    id="progresion"
                    value={formData.pagina_1.progresion || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </SectionBox>

              <SectionBox title="Antecedentes gineco-obstétricos" marginTop="mt-2">
                <div className="flex flex-col gap-1.5 justify-center h-full w-full">
                  <div className="flex items-end gap-1.5 text-[9px] font-bold w-full">
                    <span>G</span><input type="text" value={formData.pagina_1.g || ''} onChange={(e) => updateGlobalData('pagina_1', {g: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-6 outline-none text-center h-[13px] text-[#333]" />
                    <span className="ml-0.5 text-[7.5px]">de las cuales fueron:</span>
                    <span>P</span><input type="text" value={formData.pagina_1.p || ''} onChange={(e) => updateGlobalData('pagina_1', {p: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-5 outline-none text-center h-[13px] text-[#333]" />
                    <span>C</span><input type="text" value={formData.pagina_1.c || ''} onChange={(e) => updateGlobalData('pagina_1', {c: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-5 outline-none text-center h-[13px] text-[#333]" />
                    <span>A</span><input type="text" value={formData.pagina_1.a || ''} onChange={(e) => updateGlobalData('pagina_1', {a: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-5 outline-none text-center h-[13px] text-[#333]" />
                    <span className="ml-auto">FUM</span><input type="text" value={formData.pagina_1.fum || ''} onChange={(e) => updateGlobalData('pagina_1', {fum: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-14 outline-none h-[13px] text-center text-[#333]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full">
                    <span className="shrink-0">Embarazo</span>
                    <CustomCheckbox label="No" />
                    <CustomCheckbox label="Sí" />
                    <span className="ml-auto">SDG</span><input type="text" value={formData.pagina_1.sdg || ''} onChange={(e) => updateGlobalData('pagina_1', {sdg: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-12 outline-none text-center h-[13px] text-[#333]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full">
                    <span className="whitespace-nowrap shrink-0">Remplazo hormonal</span>
                    <CustomCheckbox label="No" />
                    <CustomCheckbox label="Sí" />
                    <input type="text" value={formData.pagina_1.hormo || ''} onChange={(e) => updateGlobalData('pagina_1', {hormo: e.target.value})} className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none h-[13px] text-[#333]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full">
                    <span className="whitespace-nowrap shrink-0">Anticonceptivos</span>
                    <CustomCheckbox label="No" />
                    <CustomCheckbox label="Sí" />
                    <input type="text" value={formData.pagina_1.anti || ''} onChange={(e) => updateGlobalData('pagina_1', {anti: e.target.value})} className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none h-[13px] text-[#333]" />
                  </div>
                </div>
              </SectionBox>
            </div>

            {/* FOOTER */}
            <footer className="mt-1 flex justify-between items-end border-t-2 border-[#2c5392] pt-1 text-[8px] leading-tight font-bold italic shrink-0">
              <div>
                ESA: Exploración sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✔: Adecuado.<br />
                G: Gestas; P: Partos; C: Cesáreas; A: Abortos. FUM: Fecha de última menstruación. SDG: Semanas de Gestación.
              </div>
              <div className="text-sm font-black not-italic text-[#2c5392]">1</div>
            </footer>
          </div>
        </div>
      </div>
      </fieldset>
      </>
    );
  };

  /* --- COMPONENTES AUXILIARES --- */

  const SectionBox: React.FC<{
    title: React.ReactNode,
    children: React.ReactNode,
    className?: string,
    paddingX?: string,
    marginTop?: string
  }> = ({ title, children, className = "", paddingX = "px-2", marginTop = "mt-2" }) => (
    <section className={`relative border-[1.5px] border-[#2c5392] rounded-lg ${marginTop} pt-[10px] pb-1.5 ${paddingX} w-full flex flex-col bg-white ${className}`}>
      <div className="absolute -top-[8.5px] left-4 bg-[#2c5392] text-white px-3 py-[1px] rounded-full text-[9px] font-bold z-10 whitespace-nowrap shadow-sm leading-none flex items-center justify-center">
        {title}
      </div>
      <div className="flex-1 flex flex-col w-full h-full justify-start">
        {children}
      </div>
    </section>
  );

  const LineTextarea: React.FC<{
    rows?: number,
    id: string,
    value?: string,
    onChange: any,
    lineHeight?: number
  }> = ({ rows = 2, id, value = "", onChange, lineHeight = 16 }) => {
    const totalHeight = rows * lineHeight;
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e, id)}
        style={{
          backgroundImage: `linear-gradient(transparent ${lineHeight - 1}px, #2c5392 1px)`,
          backgroundSize: `100% ${lineHeight}px`,
          lineHeight: `${lineHeight}px`,
          height: `${totalHeight}px`
        }}
        autoCapitalize="sentences"
        className="w-full resize-none border-none outline-none text-[#333] text-[9px] bg-repeat-y bg-transparent px-1 m-0 p-0 block overflow-y-auto box-border break-words"
      />
    );
  };

  const FilaInput: React.FC<{ label: string, id: string, value?: string, onChange: any }> = ({ label, id, value = "", onChange }) => (
    <div className="flex items-end gap-1 mb-[2px] text-[9px] font-bold w-full overflow-hidden flex-1">
      <span className="whitespace-nowrap shrink-0">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e, id)}
        className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none text-[#333] px-1 h-[13px] bg-transparent"
      />
    </div>
  );

  const CustomCheckbox: React.FC<{ label: string, checked?: boolean, onChange?: any, textSize?: string }> = ({ label, checked, onChange, textSize = "text-[9px]" }) => (
    <label className={`flex items-center gap-1 cursor-pointer shrink-0 ${textSize} font-bold`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="appearance-none w-2.5 h-2.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] transition-colors relative cursor-pointer align-middle shrink-0"
      />
      <span className="truncate leading-none pt-[1px]">{label}</span>
    </label>
  );
  
  /* --- DECLARACIONES DE FUNCIONES (Páginas 2, 3 y 4) --- */
  // Las llenaremos conforme me pases los códigos.

  function NutritionPage2Component({ accumulatedData, onUpdate, onBack: _onBack, onNext: _onNext, isReadOnly }: PageProps) {
    const capFirst2 = (v: string) => v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const isText = type !== 'checkbox' && type !== 'number' && type !== 'radio';
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (isText ? capFirst2(value) : value);
      onUpdate('pagina_2', { [name]: val });
    };

    return (
      <>
        <style>{`
          :root {
            --primary-blue: #1d4d96;
            --light-blue: #f2f7ff;
            --border-blue: #1d4d96;
            --pdf-grey: #525659;
            --btn-cobalt: #1d4d96;
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

          .page {
            width: 100%;
            background-color: white;
            padding: 20px;
            box-sizing: border-box;
            border: 3.5px solid #2c5392;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            position: relative;
          }

          .section-header {
            background-color: var(--primary-blue);
            color: white;
            padding: 4px 12px;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
            font-size: 13px;
            display: inline-block;
            margin-left: 5px;
          }

          .section-box {
            border: 1.5px solid var(--primary-blue);
            border-radius: 8px;
            padding: 8px;
            margin-top: -1.5px;
            margin-bottom: 8px;
          }

          .dieteticos-row {
            display: flex;
            align-items: center;
            margin-bottom: 1.5px;
            font-size: 9px;
            gap: 4px;
          }

          .dieteticos-row label {
            font-size: 9px;
            font-weight: 600;
            color: var(--primary-blue);
          }

          .dieteticos-line {
            flex-grow: 1;
            border-bottom: 1px solid var(--primary-blue);
            height: 14px;
            margin-left: 2px;
            display: flex;
            align-items: flex-end;
          }

          .dieteticos-line input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 9px;
            padding: 0 3px;
            background: transparent;
          }

          .freq-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            column-gap: 8px;
            row-gap: 0px;
          }

          .freq-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7.8px; 
            border-bottom: 0.5px solid #d1d1d1;
            padding: 1px 0;
            color: var(--primary-blue);
          }

          .freq-val {
            color: var(--primary-blue);
            font-weight: bold;
            font-size: 7.5px;
            display: flex;
            align-items: center;
          }

          .freq-val input {
            width: 20px; 
            border: none;
            text-align: right;
            font-weight: bold;
            color: var(--primary-blue);
            outline: none;
            background: transparent;
            font-size: 8px;
            margin-right: 6px; 
          }

          .solicitud-wrapper {
            position: relative;
            margin-top: 12px;
            width: 100%;
          }

          .solicitud-box {
            border: 2px solid var(--primary-blue);
            border-radius: 15px;
            padding: 10px 8px 6px 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            min-height: 40px;
          }

          .solicitud-tag {
            position: absolute;
            top: -10px;
            left: -2px;
            background-color: var(--primary-blue);
            color: white;
            padding: 1px 12px;
            border-radius: 8px 8px 8px 0;
            font-weight: bold;
            font-size: 11px;
          }

          .sol-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 8px;
            color: var(--primary-blue);
          }

          .sol-line {
            flex-grow: 1;
            border-bottom: 1.2px solid var(--primary-blue);
            height: 12px;
            display: flex;
            align-items: flex-end;
            margin-left: 2px;
          }

          .sol-line input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 8px;
            background: transparent;
          }

          .interpret-box {
            border: 1.5px solid var(--primary-blue);
            border-radius: 8px;
            min-height: 28px;
            margin-bottom: 5px;
          }
          
          .interpret-box textarea {
            width: 100%;
            border: none;
            outline: none;
            resize: none;
            padding: 3px 5px;
            box-sizing: border-box;
            font-family: inherit;
            font-size: 9px;
            line-height: 1.2;
            background: transparent;
          }

          .tables-container {
            display: flex;
            gap: 12px;
            margin-bottom: 5px;
          }

          .col-left { flex: 1.1; }
          .col-right { flex: 1; }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
          }

          th {
            background-color: var(--primary-blue);
            color: white;
            padding: 2px;
            font-weight: bold;
            border: 1px solid var(--primary-blue);
            text-align: center;
          }

          td {
            border: 1px solid var(--primary-blue);
            padding: 0;
            height: 14px; 
          }

          td input {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            padding: 0 3px;
            box-sizing: border-box;
            font-size: 7.5px;
            background: transparent;
            word-break: break-word;
            overflow-wrap: break-word;
            text-transform: capitalize;
          }
          td textarea {
            width: 100%;
            height: 100%;
            min-height: 14px;
            border: none;
            outline: none;
            padding: 0 3px;
            box-sizing: border-box;
            font-size: 7.5px;
            background: transparent;
            resize: none;
            white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: break-word;
            overflow: hidden;
            font-family: inherit;
            line-height: 1.2;
            display: block;
          }
          input[type="text"], textarea {
            word-break: break-word;
            overflow-wrap: break-word;
          }
          textarea {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          @media print {
            td textarea { overflow: visible !important; height: auto !important; }
            td { height: auto !important; }
            tr { break-inside: avoid; }
          }

          .label-cell {
            color: var(--primary-blue);
            font-weight: 500;
            padding-left: 3px;
          }

          .dark-cell { background-color: var(--primary-blue); }

          .footer {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 8px;
            color: var(--primary-blue);
            border-top: 1px solid #eee;
            padding-top: 4px;
          }

          @page { size: A4 portrait; margin: 0; }
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .nav-button { display: none !important; }
            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .page { width: 100% !important; box-shadow: none !important; transform: scale(0.87); transform-origin: top center; }
          }
        `}</style>

        <div className="w-full">
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
                        <td>
                          <input 
                            type="number" 
                            step="0.01" 
                            name={`antrop_${row.n}_vo`} 
                            value={accumulatedData.pagina_2?.[`antrop_${row.n}_vo`] || ''} 
                            onChange={handleLocalChange} 
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className={row.d ? "" : "dark-cell"}>
                          {row.d && (
                            <textarea
                              name={`antrop_${row.n}_int`}
                              value={accumulatedData.pagina_2?.[`antrop_${row.n}_int`] || ''}
                              onChange={handleLocalChange}
                              disabled={isReadOnly}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="section-header" style={{ marginTop: '8px' }}>Interpretación antropométrica</div>
                <div className="interpret-box">
                  <textarea 
                    name="int_antrop" 
                    value={accumulatedData.pagina_2?.int_antrop || ''} 
                    onChange={handleLocalChange} 
                    rows={2}
                    disabled={isReadOnly}
                  ></textarea>
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
                        <td>
                          <input 
                            type="text" 
                            name={`sv_${p}_vo`} 
                            value={accumulatedData.pagina_2?.[`sv_${p}_vo`] || ''} 
                            onChange={handleLocalChange} 
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            name={`sv_${p}_int`} 
                            value={accumulatedData.pagina_2?.[`sv_${p}_int`] || ''} 
                            onChange={handleLocalChange} 
                            disabled={isReadOnly}
                          />
                        </td>
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
                        <td>
                          <textarea
                            name={`bq_${i}_nom`}
                            value={accumulatedData.pagina_2?.[`bq_${i}_nom`] || ''}
                            onChange={handleLocalChange}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name={`bq_${i}_vo`}
                            value={accumulatedData.pagina_2?.[`bq_${i}_vo`] || ''}
                            onChange={handleLocalChange}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <textarea
                            name={`bq_${i}_int`}
                            value={accumulatedData.pagina_2?.[`bq_${i}_int`] || ''}
                            onChange={handleLocalChange}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="section-header" style={{ marginTop: '8px' }}>Interpretación bioquímica</div>
                <div className="interpret-box">
                  <textarea 
                    name="int_bioq" 
                    value={accumulatedData.pagina_2?.int_bioq || ''} 
                    onChange={handleLocalChange} 
                    rows={2}
                    disabled={isReadOnly}
                  ></textarea>
                </div>

                <div className="solicitud-wrapper">
                  <div className="solicitud-tag">Solicitud de análisis</div>
                  <div className="solicitud-box">
                    {['Química Sanguínea', 'EGO', 'Biometría hemática'].map(s => (
                      <div className="sol-item" key={s}>
                        <input 
                          type="checkbox" 
                          name={`sol_${s}`} 
                          checked={accumulatedData.pagina_2?.[`sol_${s}`] || false} 
                          onChange={handleLocalChange} 
                          disabled={isReadOnly}
                        /> {s}
                      </div>
                    ))}
                    <div className="sol-item">
                      <input 
                        type="checkbox" 
                        name="sol_otro" 
                        checked={accumulatedData.pagina_2?.sol_otro || false} 
                        onChange={handleLocalChange} 
                        disabled={isReadOnly}
                      /> Otro: 
                      <div className="sol-line">
                        <input 
                          type="text" 
                          name="sol_otro_txt" 
                          value={accumulatedData.pagina_2?.sol_otro_txt || ''} 
                          onChange={handleLocalChange} 
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer">
              <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓ Adecuado</div>
              <div className="page-num" style={{fontSize:'14px', fontWeight:'bold'}}>2</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function NutritionPage3Component({ accumulatedData, onUpdate, onBack: _onBack, onNext: _onNext, isReadOnly: _isReadOnly }: PageProps) {
    // --- LÓGICA DE NAVEGACIÓN POR TECLADO (FLECHAS) ---
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentInput = e.currentTarget;
        const inputs = Array.from(document.querySelectorAll('input:not([type="checkbox"])')) as HTMLInputElement[];
        const currentIndex = inputs.indexOf(currentInput);

        if (e.key === 'ArrowDown' && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          inputs[currentIndex - 1].focus();
        }
      }
    };

    const capFirst3 = (v: string) => v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const { name, value, type } = target;
      const checked = (target as HTMLInputElement).checked;
      const isText = type !== 'checkbox' && type !== 'number' && type !== 'radio';
      const newValue = type === 'checkbox' ? checked : (isText ? capFirst3(value) : value);
      onUpdate('pagina_3', { [name]: newValue });
    };

    const styles: { [key: string]: React.CSSProperties } = {
      contenedorMaestro: {
        backgroundColor: '#ffffff',
        width: '100%',
        minHeight: '279mm',
        border: '3.5px solid #2c5392',
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

            @page {
              size: A4 portrait;
              margin: 0;
            }

            @media print {
              html, body {
                background-color: #ffffff !important;
              }

              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              .contenedor-maestro-perimetral {
                box-shadow: none !important;
                border: 3.5px solid #2c5392 !important;
                margin: 0 !important;
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                transform: scale(0.87);
                transform-origin: top center;
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
              word-break: break-word;
              overflow-wrap: break-word;
            }
            input[type="text"], textarea {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            textarea {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            textarea.ta-cell {
              width: 100%;
              height: 100%;
              min-height: 14px;
              border: none;
              outline: none;
              padding: 0 2px;
              box-sizing: border-box;
              background: transparent;
              resize: none;
              white-space: pre-wrap;
              word-break: break-word;
              overflow-wrap: break-word;
              overflow: hidden;
              font-family: inherit;
              font-size: 7.2px;
              line-height: 1.2;
              color: #2c5697;
              display: block;
              text-align: left;
            }
            textarea.ta-linea {
              width: 100%;
              height: 22px;
              border: none;
              border-bottom: 1px solid #2c5697;
              outline: none;
              padding: 2px 5px;
              box-sizing: border-box;
              background: transparent;
              resize: none;
              white-space: pre-wrap;
              word-break: break-word;
              overflow-wrap: break-word;
              overflow: hidden;
              font-family: inherit;
              font-size: inherit;
              color: #2c5697;
              display: block;
              line-height: 1.2;
            }
            @media print {
              textarea.ta-cell, textarea.ta-linea { overflow: visible !important; height: auto !important; }
              tr { break-inside: avoid; }
              td { height: auto !important; }
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
        
        <div className="w-full">

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
                  <b>Diagnóstico Matriz IMLO/IMG:</b> <input type="text" name="diag_matriz_imlo_img" value={accumulatedData.pagina_3?.diag_matriz_imlo_img || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} style={{width: '60%', borderBottom: '1px solid #2c5697', textAlign: 'left'}} />
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
                    ].map((item, idx) => {
                      const itemKey = item.replace(/\s+/g, '_').replace(/\//g, '_').toLowerCase();
                      return (
                      <tr key={idx}>
                        <td className="celda-hallazgo-compacta" style={{ ...styles.thTd, ...styles.alignLeftPadding, width: '40%' }}>{item}</td>
                        <td className="celda-hallazgo-compacta" style={styles.thTd}><textarea className="ta-cell" name={`hallazgo_${itemKey}_desc`} value={accumulatedData.pagina_3?.[`hallazgo_${itemKey}_desc`] || ''} onChange={handleLocalChange} style={{textAlign: 'left'}} /></td>
                        <td className="celda-hallazgo-compacta" style={styles.thTd}><textarea className="ta-cell" name={`hallazgo_${itemKey}_den`} value={accumulatedData.pagina_3?.[`hallazgo_${itemKey}_den`] || ''} onChange={handleLocalChange} /></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.tituloSeccionAzul} className="encabezado-azul-print">Recordatorio de 24 horas</div>
            
            <div style={styles.layoutFilaMediaRecortada}>
              <div style={styles.cajaRecordatorioPrincipalRecortada}>
                <div style={styles.headerDatosRecordatorio}>
                  <span><b>Fecha:</b> <input type="text" name="rec_fecha" value={accumulatedData.pagina_3?.rec_fecha || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} style={{width: '100px', borderBottom: '1px solid #2c5697', textAlign: 'left'}} /></span>
                  <span><b>Hora:</b> <input type="text" name="rec_hora" value={accumulatedData.pagina_3?.rec_hora || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} style={{width: '100px', borderBottom: '1px solid #2c5697', textAlign: 'left'}} /></span>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#f2f5f9', borderBottom: '1.5px solid #2c5697' }}>
                  <div style={{ width: '20%', padding: '4px', borderRight: '1.5px solid #2c5697', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5px' }}>Hora</div>
                  <div style={{ width: '80%', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8.5px' }}>Contenido (platillo: cantidad y alimento)</div>
                </div>
                
                <div className="espacio-blanco-separador"></div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ display: 'flex' }}>
                      <div style={{ width: '20%', borderRight: '1.5px solid #2c5697' }}><input name={`rec_hora_${i}`} value={accumulatedData.pagina_3?.[`rec_hora_${i}`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} className="linea-escritura" style={{textAlign: 'center'}} /></div>
                      <div style={{ width: '80%' }}><textarea name={`rec_contenido_${i}`} value={accumulatedData.pagina_3?.[`rec_contenido_${i}`] || ''} onChange={handleLocalChange} className="ta-linea" /></div>
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
                    {["Verduras", "Frutas", "Cereales s/g", "Leguminosas", "POA ___", "Lácteo ___", "Aceites s/p", "Aceites c/p", "Azúcares"].map((grupo, idx) => {
                      const grupoKey = grupo.replace(/\s+/g, '_').replace(/___/g, '').toLowerCase();
                      return (
                      <tr key={idx}>
                        <td style={{ ...styles.thTd, ...styles.alignLeftPadding }}>{grupo}</td>
                        <td style={styles.thTd}><input type="number" name={`porcion_${grupoKey}_porciones`} value={accumulatedData.pagina_3?.[`porcion_${grupoKey}_porciones`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" name={`porcion_${grupoKey}_energia`} value={accumulatedData.pagina_3?.[`porcion_${grupoKey}_energia`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" name={`porcion_${grupoKey}_proteina`} value={accumulatedData.pagina_3?.[`porcion_${grupoKey}_proteina`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" name={`porcion_${grupoKey}_lipidos`} value={accumulatedData.pagina_3?.[`porcion_${grupoKey}_lipidos`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                        <td style={styles.thTd}><input type="number" name={`porcion_${grupoKey}_hco`} value={accumulatedData.pagina_3?.[`porcion_${grupoKey}_hco`] || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                      </tr>
                      );
                    })}
                    <tr style={styles.celdaEnfasisGris}>
                      <td style={styles.thTd}>Total</td>
                      <td style={styles.thTd}><input type="number" name="porcion_total_porciones" value={accumulatedData.pagina_3?.porcion_total_porciones || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /></td>
                      <td style={styles.thTd}><div className="input-unidad"><input type="number" name="porcion_total_energia" value={accumulatedData.pagina_3?.porcion_total_energia || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /><input type="text" placeholder="kcal" style={{fontSize: '7px'}} /></div></td>
                      <td style={styles.thTd}><div className="input-unidad"><input type="number" name="porcion_total_proteina" value={accumulatedData.pagina_3?.porcion_total_proteina || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
                      <td style={styles.thTd}><div className="input-unidad"><input type="number" name="porcion_total_lipidos" value={accumulatedData.pagina_3?.porcion_total_lipidos || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
                      <td style={styles.thTd}><div className="input-unidad"><input type="number" name="porcion_total_hco" value={accumulatedData.pagina_3?.porcion_total_hco || ''} onChange={handleLocalChange} onKeyDown={handleKeyDown} /><input type="text" placeholder="g" style={{fontSize: '7px'}} /></div></td>
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
  }
  /**
   * ============================================================================
   * COMPONENTE: NutritionPage4Component (Adaptación Visual Exacta)
   * PROPÓSITO: Coincidir visualmente con el diseño de ingeniería.
   * ============================================================================
   */

function NutritionPage4Component({ accumulatedData, onUpdate, onBack: _onBack, onNext: _onNext, isReadOnly, historialId: _historialId, onGuardarDirecto, isYaGuardado, isSaving, onFinalizarDirecto }: PageProps) {
  const [showConfirm, setShowConfirm] = useState(false);

    const capFirst4 = (v: string) => v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;
    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const { name, value, type } = target;
      const checked = (target as HTMLInputElement).checked;
      const isText = type !== 'checkbox' && type !== 'number' && type !== 'radio';
      const newValue = type === 'checkbox' ? checked : (isText ? capFirst4(value) : value);
      onUpdate('pagina_4', { [name]: newValue });
    };

    // El guardado real (antes duplicado aquí y en el componente padre) ahora
    // vive únicamente en useNutritionHistoriaData — este componente solo
    // dispara onFinalizarDirecto (modo standalone) u onGuardarDirecto (modo
    // workspace, no persiste), igual que decide handleFinalizar() más abajo.
    const handleFinalizar = async () => {
      await onFinalizarDirecto?.();
    };
    const styles: { [key: string]: React.CSSProperties } = {
      bodyWrapper: {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        backgroundColor: '#525659',
        minHeight: '100vh',
        padding: '40px 180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      },
      container: {
        backgroundColor: '#ffffff',
        width: '100%',
        minHeight: '279mm',
        border: '3.5px solid #2c5392',
        borderRadius: '25px',
        padding: '15px',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      },
      btnNavigation: {
        position: 'fixed',
        bottom: '30px',
        left: '40px',
        backgroundColor: '#1a428a',
        color: 'white',
        padding: '14px 32px',
        borderRadius: '50px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '13px',
        textTransform: 'uppercase',
        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        zIndex: 1000,
      },
      btnFinalizar: {
        position: 'fixed',
        bottom: '30px',
        right: '40px',
        backgroundColor: isSaving ? '#95a5a6' : '#27ae60',
        color: 'white',
        padding: '14px 32px',
        borderRadius: '50px',
        border: 'none',
        fontWeight: 'bold',
        cursor: isSaving ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        textTransform: 'uppercase',
        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        zIndex: 1000,
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '15px',
      },
      headerCell: {
        backgroundColor: '#1a428a',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '6px',
        border: '1px solid #1a428a',
      },
      seccionSuperior: {
        border: '2px solid #1a428a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        marginBottom: '15px',
      },
      colHeader: {
        backgroundColor: '#1a428a',
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: '6px',
        fontSize: '11px',
        borderRight: '1px solid white',
      },
      cellContent: {
        borderRight: '1.5px solid #1a428a',
        minHeight: '250px',
        padding: '8px',
        position: 'relative',
      },
      subCell: {
        height: '50%',
        borderBottom: '1.5px solid #1a428a',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
      },
      labelBlue: {
        color: '#1a428a',
        fontWeight: 'bold',
        fontSize: '10px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', gap: '4px',
        marginBottom: '4px',
      },
      smartList: {
        fontSize: '8.5px',
        color: '#1a428a',
        listStyle: 'none',
        padding: '0',
        margin: '0',
        position: 'absolute',
        bottom: '8px',
        left: '8px',
      },
      smartListLi: {
        position: 'relative',
        paddingLeft: '10px',
        marginBottom: '2px',
      },
      smartListBullet: {
        position: 'absolute',
        left: 0,
        fontWeight: 'bold',
      },
      intervencionContainer: {
        border: '2px solid #1a428a',
        borderRadius: '8px',
        marginBottom: '15px',
        overflow: 'hidden',
      },
      intervencionTitle: {
        backgroundColor: '#1a428a',
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: '2px',
        fontSize: '11px',
        textTransform: 'uppercase',
      },
      grid3Columns: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.2fr',
        gap: '8px',
        padding: '6px',
      },
      card: {
        border: '2px solid #1a428a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100px',
      },
      cardHeader: {
        backgroundColor: '#1a428a',
        color: 'white',
        padding: '3px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '10px',
      },
      calculoPorcionesContainer: {
        border: '1.5px solid #1a428a',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '8px',
      },
      calculoPorcionesHeader: {
        backgroundColor: '#1a428a',
        color: 'white',
        padding: '2px 10px',
        fontWeight: 'bold',
        fontSize: '10px',
        display: 'inline-block',
        borderBottomRightRadius: '10px',
      },
      tablaPorciones: {
        width: '100%',
        borderCollapse: 'collapse',
      },
      tablaPorcionesTh: {
        color: '#1a428a',
        fontSize: '7px',
        textAlign: 'center',
        border: '0.5px solid #1a428a',
        padding: '2px 1px',
      },
      tablaPorcionesTd: {
        border: '0.5px solid #1a428a',
        padding: '0',
      },
      inputInvisible: {
        border: 'none',
        width: '100%',
        height: '100%',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        outline: 'none',
        background: 'transparent',
        resize: 'none',
        padding: '4px',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
      },
      inputLine: {
        border: 'none',
        borderBottom: '1px solid #1a428a',
        outline: 'none',
        flexGrow: 1,
        fontSize: '9px',
        padding: '0 4px',
        background: 'transparent',
      },
      inputHeaderInline: {
        border: 'none',
        borderBottom: '1px solid #1a428a',
        outline: 'none',
        fontSize: '10px',
        width: '40px',
        textAlign: 'center',
        color: '#1a428a',
        fontWeight: 'bold',
        background: 'transparent',
      }
    };

    return (
      <div className="w-full">
        <style>
          {`
            @page { size: A4 portrait; margin: 0; }
            @media print {
              .no-print { display: none !important; }
              html, body {
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .body-wrapper { background-color: white !important; padding: 0 !important; }
              .printable-page {
                box-shadow: none !important;
                border: 3.5px solid #2c5392 !important;
                width: 100% !important;
                margin: 0 !important;
                border-radius: 25px !important;
                transform: scale(0.87);
                transform-origin: top center;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            .printable-page input[type="text"], .printable-page textarea {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .printable-page textarea {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              .printable-page textarea { overflow: visible !important; height: auto !important; }
              .printable-page tr { break-inside: avoid; }
              .printable-page td { height: auto !important; }
            }
          `}
        </style>


        {/* En modo solo lectura no se renderiza — un botón "Guardar" visible
            (aunque inerte vía fieldset) es una señal visual engañosa sobre
            un documento ya finalizado; mejor ausente que aparentemente activo. */}
        {!isReadOnly && (
          <button
            className="no-print"
            style={styles.btnFinalizar}
            onClick={() => !isYaGuardado && setShowConfirm(true)}
            disabled={isSaving || isYaGuardado}
          >
            {isYaGuardado ? 'Guardado ✓' : isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        )}

        {showConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', fontSize: '18px' }}>¿Guardar expediente?</h3>
              <p style={{ color: '#555', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                Al confirmar, el expediente quedará guardado para esta consulta. Podrás revisarlo o editarlo antes de dar por finalizada la sesión.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: 'white', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    if (onGuardarDirecto) {
                      onGuardarDirecto();
                    } else {
                      handleFinalizar();
                    }
                  }}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#27AE60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Sí, guardar
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.container} className="printable-page">
          {/* SECCIÓN SUPERIOR */}
          <div style={styles.seccionSuperior}>
            <div style={styles.colHeader}>Diagnósticos Nutricios</div>
            <div style={styles.colHeader}>Objetivo general</div>
            <div style={styles.colHeader}>Educación Nutricia</div>
            <div style={{...styles.colHeader, borderRight: 'none'}}>Consejería Nutricia</div>

            <div style={styles.cellContent}><textarea name="diag" value={accumulatedData.pagina_4?.diag || ''} onChange={handleLocalChange} style={styles.inputInvisible}></textarea></div>
            
            <div style={styles.cellContent}>
              <textarea className="objetivo-textarea" name="objetivo" value={accumulatedData.pagina_4?.objetivo || ''} onChange={handleLocalChange} style={{...styles.inputInvisible, height: '140px'}}></textarea>
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
              <div style={styles.subCell}><span style={styles.labelBlue}>Contenido (E-1.<input type="text" className="edu-cont-input" name="edu_cont_num" value={accumulatedData.pagina_4?.edu_cont_num || ''} onChange={handleLocalChange} style={styles.inputHeaderInline} />)</span><textarea name="edu_contenido" value={accumulatedData.pagina_4?.edu_contenido || ''} onChange={handleLocalChange} style={styles.inputInvisible}></textarea></div>
              <div style={{...styles.subCell, borderBottom: 'none'}}><span style={styles.labelBlue}>Aplicación (E-2.<input type="text" className="edu-app-input" name="edu_app_num" value={accumulatedData.pagina_4?.edu_app_num || ''} onChange={handleLocalChange} style={styles.inputHeaderInline} />)</span><textarea name="edu_aplicacion" value={accumulatedData.pagina_4?.edu_aplicacion || ''} onChange={handleLocalChange} style={styles.inputInvisible}></textarea></div>
            </div>

            <div style={{...styles.cellContent, padding: 0, borderRight: 'none'}}>
              <div style={styles.subCell}><span style={styles.labelBlue}>Bases/Acercamiento Teórico (C-1.<input type="text" className="cons-bases-input" name="cons_bases_num" value={accumulatedData.pagina_4?.cons_bases_num || ''} onChange={handleLocalChange} style={styles.inputHeaderInline} />)</span><textarea name="cons_bases" value={accumulatedData.pagina_4?.cons_bases || ''} onChange={handleLocalChange} style={styles.inputInvisible}></textarea></div>
              <div style={{...styles.subCell, borderBottom: 'none'}}><span style={styles.labelBlue}>Estrategias (C-2.<input type="text" className="cons-est-input" name="cons_est_num" value={accumulatedData.pagina_4?.cons_est_num || ''} onChange={handleLocalChange} style={styles.inputHeaderInline} />)</span><textarea name="cons_estrategias" value={accumulatedData.pagina_4?.cons_estrategias || ''} onChange={handleLocalChange} style={styles.inputInvisible}></textarea></div>
            </div>
          </div>

          <div style={styles.intervencionContainer}>
            <div style={styles.intervencionTitle}>Intervención</div>
            <div style={styles.grid3Columns}>
              
              <div style={styles.card}>
                <div style={styles.cardHeader}>Indicación de Alimentos/Nutrimentos</div>
                <div style={{padding: '5px'}}>
                  {(['indicacion_1', 'indicacion_2', 'indicacion_3', 'indicacion_4'] as const).map((key) => (
                    <textarea
                      key={key}
                      name={key}
                      value={accumulatedData.pagina_4?.[key] || ''}
                      onChange={handleLocalChange}
                      style={{
                        ...styles.inputLine,
                        width: '100%',
                        marginBottom: '4px',
                        fontSize: '8px',
                        resize: 'none',
                        overflow: 'hidden',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minHeight: '18px',
                        height: 'auto',
                        display: 'block',
                        fontFamily: 'inherit',
                        lineHeight: '1.3',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>Requerimiento calórico</div>
                <div style={{padding: '3px 8px', color: '#1a428a', fontSize: '9px'}}>
                  <div style={{display: 'flex', marginBottom: '2px'}}>
                    <input type="checkbox" name="req_ec_pred" checked={accumulatedData.pagina_4?.req_ec_pred || false} onChange={handleLocalChange} style={{marginRight: '6px', width: '11px', height: '11px'}} />
                    <div style={{flexGrow: 1}}><span style={{fontSize: '9px'}}>Ecuación predictiva</span>
                      <div style={{display: 'flex', alignItems: 'center'}}><span style={{fontSize: '7px'}}>Nombre:</span><input type="text" name="req_ec_pred_nombre" value={accumulatedData.pagina_4?.req_ec_pred_nombre || ''} onChange={handleLocalChange} style={styles.inputLine} /></div>
                    </div>
                  </div>
                  <div style={{display: 'flex', marginBottom: '2px'}}>
                    <input type="checkbox" name="req_ec_rapida" checked={accumulatedData.pagina_4?.req_ec_rapida || false} onChange={handleLocalChange} style={{marginRight: '6px', width: '11px', height: '11px'}} />
                    <div style={{flexGrow: 1}}><span style={{fontSize: '9px'}}>Ecuación rápida</span>
                      <div style={{display: 'flex', alignItems: 'center'}}><span style={{fontSize: '7px'}}>Peso:</span><input type="text" name="req_ec_rapida_peso" value={accumulatedData.pagina_4?.req_ec_rapida_peso || ''} onChange={handleLocalChange} style={{...styles.inputLine, width:'30px'}} /><span style={{fontSize: '7px'}}>kg</span> <span style={{fontSize: '7px', marginLeft:'5px'}}>kcal/kg:</span><input type="text" name="req_ec_rapida_kcal_kg" value={accumulatedData.pagina_4?.req_ec_rapida_kcal_kg || ''} onChange={handleLocalChange} style={styles.inputLine} /></div>
                    </div>
                  </div>
                  <div style={{marginTop: '3px', display: 'flex', alignItems: 'baseline', fontWeight: 'bold'}}>
                    <span style={{fontSize: '9px'}}>Total</span><input type="text" name="req_total_kcal" value={accumulatedData.pagina_4?.req_total_kcal || ''} onChange={handleLocalChange} style={{...styles.inputLine, fontWeight: 'bold', textAlign: 'center'}} /><span style={{fontSize: '9px'}}>kcal</span>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>Cuadro dietosintético</div>
                <table style={{...styles.table, marginBottom: 0, border: 'none'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f0f4fa', fontSize: '6.5px'}}>
                      <th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>Macro</th>
                      <th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>%</th>
                      <th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>Kcal</th>
                      <th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>G</th>
                      <th style={{...styles.tablaPorcionesTh, border: '1px solid #1a428a'}}>g/kg</th>
                    </tr>
                  </thead>
                  <tbody style={{fontSize: '8px'}}>
                    {["Proteína", "HCO", "Lípidos"].map(m => {
                      const macroKey = m.toLowerCase().replace('í', 'i');
                      return (
                      <tr key={m}>
                        <td style={{fontWeight: 'bold', color: '#1a428a', border: '1px solid #1a428a', padding: '1px 2px'}}>{m}</td>
                        <td style={{border: '1px solid #1a428a'}}><input type="text" name={`${macroKey}_porc`} value={accumulatedData.pagina_4?.[`${macroKey}_porc`] || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                        <td style={{border: '1px solid #1a428a'}}><input type="text" name={`${macroKey}_kcal`} value={accumulatedData.pagina_4?.[`${macroKey}_kcal`] || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                        <td style={{border: '1px solid #1a428a'}}><input type="text" name={`${macroKey}_g`} value={accumulatedData.pagina_4?.[`${macroKey}_g`] || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                        <td style={{border: '1px solid #1a428a'}}><input type="text" name={`${macroKey}_g_kg`} value={accumulatedData.pagina_4?.[`${macroKey}_g_kg`] || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                      </tr>
                      );
                    })}
                    <tr style={{backgroundColor: '#f0f4fa'}}>
                      <td style={{fontWeight: 'bold', color: '#1a428a', border: '1px solid #1a428a', padding: '1px 2px'}}>Tot.</td>
                      <td style={{textAlign: 'center', fontWeight: 'bold', border: '1px solid #1a428a'}}>100%</td>
                      <td style={{border: '1px solid #1a428a'}}><input type="text" name="total_kcal" value={accumulatedData.pagina_4?.total_kcal || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                      <td style={{border: '1px solid #1a428a'}}><input type="text" name="total_g" value={accumulatedData.pagina_4?.total_g || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>
                      <td style={{fontSize: '5px', textAlign: 'right', border: '1px solid #1a428a'}}>kcal/kg/d</td>
                    </tr>
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
                  <th style={styles.tablaPorcionesTh}>Grupo alimentario</th>
                  <th style={styles.tablaPorcionesTh}>DES</th><th style={styles.tablaPorcionesTh}>CM</th>
                  <th style={styles.tablaPorcionesTh}>COM</th><th style={styles.tablaPorcionesTh}>CV</th>
                  <th style={styles.tablaPorcionesTh}>CENA</th><th style={styles.tablaPorcionesTh}>RAC</th>
                  <th style={styles.tablaPorcionesTh}>KCAL</th><th style={styles.tablaPorcionesTh}>PROT</th>
                  <th style={styles.tablaPorcionesTh}>LIP</th><th style={styles.tablaPorcionesTh}>HCO</th>
                </tr>
              </thead>
              <tbody style={{fontSize: '7.5px'}}>
                {['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'].map(grupo => {
                  const grupoKey = grupo.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
                  const cols = ['des', 'cm', 'com', 'cv', 'cena', 'rac', 'kcal', 'prot', 'lip', 'hco'];
                  return (
                  <tr key={grupo}>
                    <td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>{grupo}</td>
                    {cols.map(col => <td key={col} style={styles.tablaPorcionesTd}><input type="text" name={`calc_${grupoKey}_${col}`} value={accumulatedData.pagina_4?.[`calc_${grupoKey}_${col}`] || ''} onChange={handleLocalChange} style={styles.inputInvisible} /></td>)}
                  </tr>
                  );
                })}
                <tr style={{backgroundColor: '#f2f5f9'}}>
                  <td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>Total</td>
                  <td colSpan={6} style={{border: '0.5px solid #1a428a'}}></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_total_kcal" value={accumulatedData.pagina_4?.calc_total_kcal || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>kcal</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_total_prot" value={accumulatedData.pagina_4?.calc_total_prot || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_total_lip" value={accumulatedData.pagina_4?.calc_total_lip || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_total_hco" value={accumulatedData.pagina_4?.calc_total_hco || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>g</span></div></td>
                </tr>
                <tr style={{backgroundColor: '#f2f5f9'}}>
                  <td style={{color:'#1a428a', fontWeight:'bold', border: '0.5px solid #1a428a', padding: '1px 4px'}}>% Adecuación</td>
                  <td colSpan={6} style={{border: '0.5px solid #1a428a'}}></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_adec_kcal" value={accumulatedData.pagina_4?.calc_adec_kcal || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_adec_prot" value={accumulatedData.pagina_4?.calc_adec_prot || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_adec_lip" value={accumulatedData.pagina_4?.calc_adec_lip || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td>
                  <td style={styles.tablaPorcionesTd}><div style={{display:'flex', alignItems:'center'}}><input type="text" name="calc_adec_hco" value={accumulatedData.pagina_4?.calc_adec_hco || ''} onChange={handleLocalChange} style={styles.inputInvisible}/><span style={{fontSize:'6px'}}>%</span></div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <table style={{...styles.table, marginBottom: '8px'}}>
            <thead>
              <tr><th colSpan={5} style={{...styles.headerCell, padding: '3px', fontSize: '11px'}}>Menú del día</th></tr>
              <tr style={{backgroundColor: '#f0f4fa', fontWeight: 'bold', textAlign: 'center', fontSize: '10px'}}>
                <td style={{border: '1px solid #1a428a', padding: '4px'}}>Desayuno</td>
                <td style={{border: '1px solid #1a428a', padding: '4px'}}>C.M.</td>
                <td style={{border: '1px solid #1a428a', padding: '4px'}}>Comida</td>
                <td style={{border: '1px solid #1a428a', padding: '4px'}}>C.V.</td>
                <td style={{border: '1px solid #1a428a', padding: '4px'}}>Cena</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                {['desayuno', 'cm', 'comida', 'cv', 'cena'].map(meal => (
                  <td key={meal} style={{height: '140px', border: '1px solid #1a428a', padding: 0, verticalAlign: 'top'}}>
                    <textarea name={`menu_${meal}`} value={accumulatedData.pagina_4?.[`menu_${meal}`] || ''} onChange={handleLocalChange} style={{...styles.inputInvisible, fontSize: '9px'}}></textarea>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-around', textAlign: 'center', paddingBottom: '15px', fontSize: '10px'}}>
            <div style={{width: '40%'}}>
              <input type="text" name="firma_alumno" value={accumulatedData.pagina_4?.firma_alumno || ''} onChange={handleLocalChange} autoCapitalize="sentences" style={{width: '100%', border: 'none', borderBottom: '1px solid #1a428a', outline: 'none', fontSize: '10px', textAlign: 'center', background: 'transparent', marginBottom: '4px', color: '#1a428a'}} />
              <div style={{borderTop: '1px solid #000', paddingTop: '5px'}}>Nombre, matrícula y firma del alumno</div>
            </div>
            <div style={{width: '40%'}}>
              <input type="text" name="firma_docente" value={accumulatedData.pagina_4?.firma_docente || ''} onChange={handleLocalChange} autoCapitalize="sentences" style={{width: '100%', border: 'none', borderBottom: '1px solid #1a428a', outline: 'none', fontSize: '10px', textAlign: 'center', background: 'transparent', marginBottom: '4px', color: '#1a428a'}} />
              <div style={{borderTop: '1px solid #000', paddingTop: '5px'}}>Nombre, cédula y firma del docente responsable</div>
            </div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '8px'}}>
            <div>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado, ✔: Adecuado</div>
            <div style={{fontWeight: 'bold', fontSize: '14px'}}>4</div>
          </div>
        </div>
      </div>
    );
  }
  export default NutritionMasterForm;