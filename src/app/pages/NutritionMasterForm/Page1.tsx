import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionBox, CustomCheckbox, LineTextarea, FilaInput } from './SharedComponents';

// 🔥 Ya NO importamos la imagen aquí arriba, la leeremos directamente de la carpeta public

interface Props {
  accumulatedData: any;
  onUpdate: (page: string, data: any) => void;
  onNext: () => void;
  isReadOnly: boolean;
}

export default function Page1({ accumulatedData, onUpdate, onNext, isReadOnly }: Props) {
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => {
    onUpdate('pagina_1', { [id]: e.target.value });
  };

  return (
    <div className="block">
      <button onClick={() => navigate(-1)} className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-2xl z-50 transition-colors print:hidden flex items-center gap-2 text-sm">
        Salir
      </button>
      <button onClick={onNext} className="fixed bottom-8 right-10 bg-[#1d4d96] hover:bg-[#153a71] text-white px-8 py-3 rounded-full font-bold shadow-2xl z-50 transition-all scale-105 uppercase text-sm tracking-wider print:hidden">
        Siguiente (P2) →
      </button>

      <div className="bg-white w-[210mm] h-[297mm] p-[10mm] pt-[5mm] relative shadow-2xl flex flex-col overflow-hidden text-[#2c5392] print:shadow-none">
        <header className="flex justify-between items-start mb-2">
          <div className="leading-none shrink-0">
            <h1 className="text-[32px] font-black tracking-tighter mb-0">utc</h1>
            <p className="text-[7px] font-bold leading-tight uppercase">Universidad<br />Tres Culturas</p>
          </div>
          <div className="text-center flex-grow mt-2">
            <div className="bg-[#2c5392] text-white px-10 py-1.5 rounded-full text-2xl font-bold inline-block mb-1">Historia Clínica Nutricional</div>
            <p className="text-[8px] font-bold">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</p>
          </div>
          <div className="flex items-end gap-1 text-[10px] font-bold mt-2 border-b border-[#2c5392]">
            <span>Fecha</span>
            <input type="text" value={accumulatedData.pagina_1?.fecha || ''} onChange={(e) => handleInputChange(e, 'fecha')} className="w-24 outline-none px-1 h-3.5 bg-transparent" />
          </div>
        </header>

        <SectionBox title="Datos personales" marginTop="mt-2">
          <div className="flex items-end gap-1 mb-1 text-[10px] font-bold">
            <span className="shrink-0">Nombre completo</span>
            <input type="text" value={accumulatedData.pagina_1?.nombre || ''} onChange={(e) => handleInputChange(e, 'nombre')} disabled={isReadOnly} className="border-b border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent" />
            <span className="shrink-0">Expediente</span>
            <input type="text" value={accumulatedData.pagina_1?.expediente || ''} onChange={(e) => handleInputChange(e, 'expediente')} className="border-b border-[#2c5392] w-24 outline-none px-1 h-3.5 bg-transparent" />
          </div>

          <div className="flex items-end gap-1 mb-1 text-[10px] font-bold overflow-hidden">
            <span className="shrink-0">Edad</span>
            <input type="text" value={accumulatedData.pagina_1?.edad || ''} onChange={(e) => handleInputChange(e, 'edad')} className="border-b border-[#2c5392] w-10 outline-none px-1 h-3.5 bg-transparent" />
            <span className="ml-1 shrink-0">Sexo</span>
            <CustomCheckbox label="Fem" checked={accumulatedData.pagina_1?.sexo === 'Fem'} onChange={() => onUpdate('pagina_1', {sexo: 'Fem'})} />
            <CustomCheckbox label="Mas" checked={accumulatedData.pagina_1?.sexo === 'Mas'} onChange={() => onUpdate('pagina_1', {sexo: 'Mas'})} />
            <span className="ml-2 shrink-0">Edo. civil</span>
            <CustomCheckbox label="Soltero" checked={accumulatedData.pagina_1?.civil === 'Soltero'} onChange={() => onUpdate('pagina_1', {civil: 'Soltero'})} />
            <CustomCheckbox label="Casado" checked={accumulatedData.pagina_1?.civil === 'Casado'} onChange={() => onUpdate('pagina_1', {civil: 'Casado'})} />
            <span className="ml-2 shrink-0">Ocupación</span>
            <input type="text" value={accumulatedData.pagina_1?.ocupacion || ''} onChange={(e) => handleInputChange(e, 'ocupacion')} className="border-b border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent" />
            <span className="shrink-0 ml-1">F/N</span>
            <input type="text" value={accumulatedData.pagina_1?.fn || ''} onChange={(e) => handleInputChange(e, 'fn')} className="border-b border-[#2c5392] w-16 outline-none px-1 h-3.5 bg-transparent" />
          </div>

          <div className="flex items-end gap-1 text-[10px] font-bold">
            <span className="shrink-0">Teléfono</span>
            <input type="text" value={accumulatedData.pagina_1?.telefono || ''} onChange={(e) => handleInputChange(e, 'telefono')} className="border-b border-[#2c5392] w-48 outline-none px-1 h-3.5 bg-transparent" />
            <span className="shrink-0 ml-1">Dirección</span>
            <input type="text" value={accumulatedData.pagina_1?.direccion || ''} onChange={(e) => handleInputChange(e, 'direccion')} className="border-b border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent" />
          </div>
        </SectionBox>

        <div className="grid grid-cols-2 gap-2">
          <SectionBox title="Motivos de consulta" paddingX="px-0" marginTop="mt-3">
            <LineTextarea id="motivos" value={accumulatedData.pagina_1?.motivos || ''} onChange={handleInputChange} rows={4} lineHeight={18} />
          </SectionBox>
          <SectionBox title="Qx o Tx previos" paddingX="px-0" marginTop="mt-3">
            <LineTextarea id="qx" value={accumulatedData.pagina_1?.qx || ''} onChange={handleInputChange} rows={4} lineHeight={18} />
          </SectionBox>
        </div>

        <div className="grid grid-cols-[1.7fr_1fr] gap-2">
          <SectionBox title="Antecedentes patológicos heredofamiliares" paddingX="px-0" marginTop="mt-3" className="overflow-hidden">
            <div className="max-h-[200px] overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-400">
              <table className="w-full border-collapse text-[8.5px] font-bold table-fixed mt-1">
                <thead>
                  <tr className="border-b border-[#2c5392]">
                    <th className="text-left pl-1 w-[38%]">Enfermedades</th>
                    {['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'].map(h => <th key={h} className="text-[8px]">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="text-center">
                  {['Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map((item) => (
                    <tr key={item} className="border-b border-[#2c5392] h-[16px]">
                      <td className="text-left pl-1 border-r border-[#2c5392] whitespace-nowrap overflow-hidden text-ellipsis">{item}</td>
                      {[...Array(6)].map((_, i) => (
                        <td key={i} className="border-r border-[#2c5392] last:border-r-0">
                          <input type="checkbox" checked={accumulatedData.pagina_1?.[`heredo-${item}-${i}`] || false} onChange={(e) => onUpdate('pagina_1', {[`heredo-${item}-${i}`]: e.target.checked})} disabled={isReadOnly} className="appearance-none w-2 h-2 border border-[#2c5392] checked:bg-[#2c5392]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={7} className="text-left px-1 py-1 text-[9px]">
                      Otras: <input type="text" value={accumulatedData.pagina_1?.otrasHeredo || ''} onChange={(e) => handleInputChange(e, 'otrasHeredo')} className="border-b border-[#2c5392] w-[80%] outline-none h-3 bg-transparent" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionBox>

          <SectionBox title="Antecedentes patológicos personales" marginTop="mt-3">
            <div className="flex flex-col gap-0.5 text-[9px] font-bold px-0.5 mt-1">
              {['Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map(item => (
                <CustomCheckbox key={item} label={item} checked={accumulatedData.pagina_1?.[`pers-${item}`] || false} onChange={(val: boolean) => onUpdate('pagina_1', {[`pers-${item}`]: val})} textSize="text-[9px]" />
              ))}
              <div className="flex items-end gap-1 mt-1">
                <span className="whitespace-nowrap">Otras:</span>
                <input type="text" value={accumulatedData.pagina_1?.otrasPers || ''} onChange={(e) => handleInputChange(e, 'otrasPers')} className="border-b border-[#2c5392] flex-grow outline-none h-3 bg-transparent" />
              </div>
            </div>
          </SectionBox>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SectionBox title="Sintomatología" paddingX="px-0" className="row-span-2" marginTop="mt-3">
            <table className="w-full text-[8.5px] font-bold table-fixed border-collapse mt-1">
              <thead><tr className="border-b border-[#2c5392]"><th className="text-left pl-1 border-r border-[#2c5392] w-[60%]">Enfermedades</th><th>Freq./Cant.</th></tr></thead>
              <tbody>
                {['Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito', 'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia'].map(item => (
                  <tr key={item} className="border-b border-[#2c5392] h-[16.5px]">
                    <td className="text-left pl-1 border-r border-[#2c5392] flex items-center gap-1 h-full">
                      <input type="checkbox" checked={accumulatedData.pagina_1?.[`sintoma-check-${item}`] || false} onChange={(e) => onUpdate('pagina_1', {[`sintoma-check-${item}`]: e.target.checked})} className="appearance-none w-2.5 h-2.5 border border-[#2c5392] shrink-0 checked:bg-[#2c5392]" />
                      <span className="truncate">{item}</span>
                    </td>
                    <td className="p-0 border-none h-full">
                      <input type="text" value={accumulatedData.pagina_1?.[`sintoma-val-${item}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`sintoma-val-${item}`]: e.target.value})} className="w-full h-full border-none outline-none px-1 bg-transparent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionBox>

          <SectionBox title="Escala de Bristol" className="text-center" marginTop="mt-3">
            <div className="flex flex-col items-center w-full">
              {/* 🔥 AQUÍ USAMOS LA RUTA DIRECTA A LA CARPETA PUBLIC */}
              <img 
                src="/assets/bristol.jpg" 
                alt="Escala de Bristol" 
                className="max-h-[120px] w-auto object-contain mix-blend-multiply" 
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150x100?text=Bristol+Img"; }} 
              />
              <div className="flex justify-between w-full px-2 mt-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className="flex flex-col items-center flex-1">
                    <input type="radio" name="bristol_scale" checked={accumulatedData.pagina_1?.bristol === num} onChange={() => onUpdate('pagina_1', {bristol: num})} className="appearance-none w-3 h-3 border border-[#2c5392] checked:bg-[#2c5392] cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          </SectionBox>

          <SectionBox title="Antecedentes personales no patológicos" paddingX="px-0" marginTop="mt-3" className="pb-0">
            <table className="w-full text-[8.5px] font-bold border-collapse table-fixed mt-1">
              <thead>
                <tr className="border-b border-[#2c5392]">
                  <th className="w-[45%] border-r border-[#2c5392]"></th>
                  <th className="border-r border-[#2c5392]">Frecuencia</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody className="leading-none">
                {['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'].map((item, index, array) => (
                  <tr key={item} className={`${index === array.length - 1 ? '' : 'border-b border-[#2c5392]'} h-[18px]`}>
                    <td className="text-left pl-1 border-r border-[#2c5392] flex items-center gap-1 h-full">
                      <input type="checkbox" checked={accumulatedData.pagina_1?.[`nopato-check-${item}`] || false} onChange={(e) => onUpdate('pagina_1', {[`nopato-check-${item}`]: e.target.checked})} className="appearance-none w-2.5 h-2.5 border border-[#2c5392] shrink-0 checked:bg-[#2c5392]" />
                      <span className="truncate">{item}</span>
                    </td>
                    <td className="border-r border-[#2c5392] p-0">
                      <input type="text" value={accumulatedData.pagina_1?.[`nopato-freq-${item}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`nopato-freq-${item}`]: e.target.value})} className="w-full h-full border-none outline-none text-center bg-transparent" />
                    </td>
                    <td className="p-0">
                      <input type="text" value={accumulatedData.pagina_1?.[`nopato-cant-${item}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`nopato-cant-${item}`]: e.target.value})} className="w-full h-full border-none outline-none text-center bg-transparent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionBox>

          <SectionBox title="Diagnósticos médicos" paddingX="px-0" marginTop="mt-3">
            <div className="mt-1 flex flex-col gap-0 border-t border-[#2c5392]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-[#2c5392] flex items-center">
                  <input type="text" value={accumulatedData.pagina_1?.[`diag-med-${i}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`diag-med-${i}`]: e.target.value})} className="w-full h-[14.5px] border-none outline-none px-2 bg-transparent text-[9.5px]" />
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox title={<div className="flex justify-between w-[150px] text-[9px]"><span>Medicamentos</span> <span>Dosis</span></div>} paddingX="px-1" marginTop="mt-3">
            <div className="mt-1 flex flex-col gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center w-full">
                  <input type="text" value={accumulatedData.pagina_1?.[`med-nom-${i}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`med-nom-${i}`]: e.target.value})} className="w-[48%] h-[14.5px] border-b border-[#2c5392] outline-none px-1 bg-transparent text-[9.5px]" />
                  <input type="text" value={accumulatedData.pagina_1?.[`med-dos-${i}`] || ''} onChange={(e) => onUpdate('pagina_1', {[`med-dos-${i}`]: e.target.value})} className="w-[48%] h-[14.5px] border-b border-[#2c5392] outline-none px-1 bg-transparent text-[9.5px]" />
                </div>
              ))}
            </div>
          </SectionBox>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SectionBox title="Ejercicio" marginTop="mt-3">
            <div className="flex items-center gap-2 text-[9px] font-bold mb-1 mt-1">
              <span className="shrink-0">Realiza ejercicio</span>
              <CustomCheckbox label="No" checked={accumulatedData.pagina_1?.ejercicio_no || false} onChange={(val) => onUpdate('pagina_1', {ejercicio_no: val})} />
              <CustomCheckbox label="Sí" checked={accumulatedData.pagina_1?.ejercicio_si || false} onChange={(val) => onUpdate('pagina_1', {ejercicio_si: val})} />
              <div className="flex gap-2 ml-auto">
                <CustomCheckbox label="Aeróbico" checked={accumulatedData.pagina_1?.ejercicio_aero || false} onChange={(val) => onUpdate('pagina_1', {ejercicio_aero: val})} />
                <CustomCheckbox label="Anaeróbico" checked={accumulatedData.pagina_1?.ejercicio_anaero || false} onChange={(val) => onUpdate('pagina_1', {ejercicio_anaero: val})} />
              </div>
            </div>
            <FilaInput label="¿Cuál?" id="ejercicioCual" value={accumulatedData.pagina_1?.ejercicioCual || ''} onChange={handleInputChange} />
            <div className="flex gap-4">
              <FilaInput label="Frecuencia" id="frecuencia" value={accumulatedData.pagina_1?.frecuencia || ''} onChange={handleInputChange} />
              <FilaInput label="Intensidad" id="intensidad" value={accumulatedData.pagina_1?.intensidad || ''} onChange={handleInputChange} />
            </div>
            <div className="flex gap-4">
              <FilaInput label="Tiempo" id="tiempo" value={accumulatedData.pagina_1?.tiempo || ''} onChange={handleInputChange} />
              <FilaInput label="Volumen" id="volumen" value={accumulatedData.pagina_1?.volumen || ''} onChange={handleInputChange} />
            </div>
            <FilaInput label="Progresión" id="progresion" value={accumulatedData.pagina_1?.progresion || ''} onChange={handleInputChange} />
          </SectionBox>

          <SectionBox title="Antecedentes gineco-obstétricos" marginTop="mt-3">
            <div className="flex items-end gap-1 text-[9px] font-bold mb-1 mt-1">
              <span>G</span><input type="text" value={accumulatedData.pagina_1?.g || ''} onChange={(e) => onUpdate('pagina_1', {g: e.target.value})} className="border-b border-[#2c5392] w-6 outline-none text-center h-3" />
              <span className="ml-1 text-[7px]">de las cuales fueron:</span>
              <span>P</span><input type="text" value={accumulatedData.pagina_1?.p || ''} onChange={(e) => onUpdate('pagina_1', {p: e.target.value})} className="border-b border-[#2c5392] w-4 outline-none text-center h-3" />
              <span>C</span><input type="text" value={accumulatedData.pagina_1?.c || ''} onChange={(e) => onUpdate('pagina_1', {c: e.target.value})} className="border-b border-[#2c5392] w-4 outline-none text-center h-3" />
              <span>A</span><input type="text" value={accumulatedData.pagina_1?.a || ''} onChange={(e) => onUpdate('pagina_1', {a: e.target.value})} className="border-b border-[#2c5392] w-4 outline-none text-center h-3" />
              <span className="ml-auto">FUM</span><input type="text" value={accumulatedData.pagina_1?.fum || ''} onChange={(e) => onUpdate('pagina_1', {fum: e.target.value})} className="border-b border-[#2c5392] w-14 outline-none h-3" />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold mb-1">
              <span className="shrink-0">Embarazo</span>
              <CustomCheckbox label="No" checked={accumulatedData.pagina_1?.embarazo_no || false} onChange={(val) => onUpdate('pagina_1', {embarazo_no: val})} />
              <CustomCheckbox label="Sí" checked={accumulatedData.pagina_1?.embarazo_si || false} onChange={(val) => onUpdate('pagina_1', {embarazo_si: val})} />
              <span className="ml-2">SDG</span><input type="text" value={accumulatedData.pagina_1?.sdg || ''} onChange={(e) => onUpdate('pagina_1', {sdg: e.target.value})} className="border-b border-[#2c5392] w-10 outline-none text-center h-3" />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold mb-1">
              <span className="whitespace-nowrap shrink-0">Remplazo hormonal</span>
              <CustomCheckbox label="No" checked={accumulatedData.pagina_1?.hormonal_no || false} onChange={(val) => onUpdate('pagina_1', {hormonal_no: val})} />
              <CustomCheckbox label="Sí" checked={accumulatedData.pagina_1?.hormonal_si || false} onChange={(val) => onUpdate('pagina_1', {hormonal_si: val})} />
              <input type="text" value={accumulatedData.pagina_1?.hormo || ''} onChange={(e) => onUpdate('pagina_1', {hormo: e.target.value})} className="border-b border-[#2c5392] flex-grow outline-none h-3" />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold">
              <span className="whitespace-nowrap shrink-0">Anticonceptivos</span>
              <CustomCheckbox label="No" checked={accumulatedData.pagina_1?.anti_no || false} onChange={(val) => onUpdate('pagina_1', {anti_no: val})} />
              <CustomCheckbox label="Sí" checked={accumulatedData.pagina_1?.anti_si || false} onChange={(val) => onUpdate('pagina_1', {anti_si: val})} />
              <input type="text" value={accumulatedData.pagina_1?.anti || ''} onChange={(e) => onUpdate('pagina_1', {anti: e.target.value})} className="border-b border-[#2c5392] flex-grow outline-none h-3" />
            </div>
          </SectionBox>
        </div>

        <footer className="mt-auto pt-1 flex justify-between items-end border-t border-[#2c5392] text-[7px] leading-tight font-bold italic">
          <div>
            ESA: Exploración sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✔: Adecuado.<br />
            G: Gestas; P: Partos; C: Cesáreas; A: Abortos. FUM: Fecha de última menstruación. SDG: Semanas de Gestación.
          </div>
          <div className="text-xs font-black not-italic">1</div>
        </footer>
      </div>
    </div>
  );
}