import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhysiotherapyValoracionData } from '../hooks/formClinico/usePhysiotherapyValoracionData';
import { useBodyMarkers, type BodyMarkerPct } from '../hooks/formClinico/useBodyMarkers';
import { usePrintFitScale } from '../hooks/usePrintFitScale';
import { useScreenFitScale } from '../hooks/useScreenFitScale';
import { useAuth } from '../contexts/AuthContext';
import { formatExpediente } from '../lib/formatExpediente';

// IMPORTACIÓN DE IMÁGENES
import logoUtc from './logo_historiales.jpg';
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
  setIsSaving?: (value: boolean) => void;
  historialId?: number | null;
  onGuardarDirecto?: () => void;
  isYaGuardado?: boolean;
  onFinalizarDirecto?: () => void | Promise<void>;
  isReadOnly?: boolean;
}

/**
 * Representación documental de la Valoración Inicial de Fisioterapia — hoja
 * impresa en mm, solo lectura. La captura en vivo vive en
 * captura/FisioterapiaPrimeraConsultaCaptura.tsx (ver
 * docs/RESPONSIVE_DESIGN_STRATEGY.md sección 9); este componente ya no
 * implementa FormClinicoHandle ni persiste cambios. Las 3 páginas se
 * muestran apiladas (no wizard paginado) — mismo patrón aplicado en
 * NutritionMasterForm.tsx tras descubrir que un fieldset anidado no puede
 * "des-deshabilitar" lo que un fieldset ancestro ya deshabilitó.
 */
const PhysiotherapyMasterForm = () => {
  const navigate = useNavigate();
  const { appointmentId, formData } = usePhysiotherapyValoracionData({});
  const { user } = useAuth();
  const puedeEditar = user?.rol === 'admin' || user?.rol === 'master';

  // Regla de impresión única para todos los documentos clínicos del sistema
  // (ver src/app/hooks/usePrintFitScale.ts para la explicación completa del
  // mecanismo). Validado originalmente en HojaEvolutiva.tsx y
  // NutritionMasterForm.tsx; reutilizado tal cual aquí.
  usePrintFitScale(['.page', '.page-p2', '.page-p3']);
  // Ajuste de pantalla en móvil (no impresión) — ver useScreenFitScale.ts.
  useScreenFitScale(['.page', '.page-p2', '.page-p3']);

  return (
    <div className="min-h-screen bg-zinc-600">
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-1.5 sm:gap-2 print:hidden">
        <button
          onClick={() => navigate(`/historial/${formData.pagina_1.paciente_id}`)}
          className="bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-900 hover:bg-blue-800 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Imprimir
        </button>
        {appointmentId && puedeEditar && (
          <button
            onClick={() => navigate(`/forms/fisioterapia/${appointmentId}`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      <fieldset disabled className="contents">
        <PhysiotherapyPage1Component
          accumulatedData={formData}
          onUpdate={() => {}}
          onBack={() => {}}
          onNext={() => {}}
        />
        <PhysiotherapyPage2Component
          accumulatedData={formData}
          onUpdate={() => {}}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly
        />
        <PhysiotherapyPage3Component
          accumulatedData={formData}
          onUpdate={() => {}}
          onBack={() => {}}
          onNext={() => {}}
          isYaGuardado
          isReadOnly
        />
      </fieldset>
    </div>
  );
};


/**
 * ============================================================================
 * PIEZA 1: COMPONENTE PÁGINA 1 (HISTORIA CLÍNICA) - ESCALA EXPANDIDA Y UNIFORME
 * ============================================================================
 */
const PhysiotherapyPage1Component: React.FC<PageProps> = ({ 
  accumulatedData, 
  onUpdate, 
  onBack, 
  onNext
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
        /* Botones de navegación del wizard de captura (Salir/Anterior/
           Siguiente/Finalizar/borrador de firma) no tienen sentido en la
           vista de solo lectura del documento (PhysiotherapyMasterForm la
           envuelve en <fieldset disabled>) — ya estaban ocultos para
           impresión pero seguían apareciendo en pantalla, encima
           desbordando el ancho real en móvil. */
        fieldset:disabled .btn-salir-fixed,
        fieldset:disabled .btn-siguiente-fixed,
        fieldset:disabled .btn-anterior-fixed,
        fieldset:disabled .controls-bar-p2,
        fieldset:disabled .btn-anterior-p3,
        fieldset:disabled .btn-finalizar-p3,
        fieldset:disabled .eraser-container,
        fieldset:disabled .eraser-container-p3 { display: none !important; }

        /* Configuraciones Generales */
        .hc-container * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --utc-blue: #2A4B8C;
            --utc-light-blue: #5575B3;
        }
        .hc-body {
            font-family: Arial, sans-serif;
            background-color: #525659;
            display: flex;
            justify-content: center;
            padding: 20px 180px;
            min-height: 100vh;
        }
        /* El padding lateral de 180px nunca se pensó para móvil: junto con
           el zoom aplicado a la hoja (achicada por useScreenFitScale para
           caber en pantallas angostas), dejaba una caja de contenido de
           apenas unos px de ancho — el centrado (flex o margin:auto) sobre
           un elemento con zoom en una caja tan angosta daba resultados
           inconsistentes en Chromium y desbordaba el viewport real,
           empujando los botones flotantes fuera de la pantalla. La misma
           regla se repite en el <style> de .hc-body-p2/.hc-body-p3 (en vez
           de agruparla aquí con selector combinado) porque en CSS, a
           igual especificidad, gana la declaración que aparece más abajo en
           el documento — puesta solo aquí, la regla base de cada página 2/3
           (definida en un <style> posterior) la habría sobreescrito
           igualmente aunque el media query calzara. */
        @media (max-width: 1023px) {
          .hc-body { padding: 20px 8px; }
        }
        /* Zoom cosmético SOLO para pantalla (mismo criterio que
           NutritionMasterForm.tsx): agranda visualmente el documento como si
           el navegador estuviera a 150% de zoom. No toca --screen-scale ni
           --print-scale — se anula explícitamente dentro de @media print más
           abajo. Restringido a >=1024px: se verificó que en portrait de
           tablet (hasta ~1023px) el problema se reproduce igual que en
           móvil, desbordando el ancho real y empujando los botones
           flotantes fuera de la pantalla visible. */
        @media (min-width: 1024px) {
          .hc-body { zoom: 1.5; }
        }

        /* CONTENEDOR PRINCIPAL — geometría replicada literalmente de la
           referencia de diseño aportada (basada en el PDF oficial). */
        .page {
            zoom: var(--screen-scale, 1);
            background-color: #fff;
            width: var(--screen-width, 215.9mm);
            flex-shrink: 0;
            min-height: 279.4mm;
            padding: 10mm 5mm 8mm 5mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            color: #5575B3;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 8px;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        .page::before {
            content: "utc";
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 280px;
            font-weight: 900;
            color: rgba(230, 235, 240, 0.3);
            z-index: 0;
            pointer-events: none;
            letter-spacing: -15px;
        }
        .page > * { position: relative; z-index: 1; }

        /* ENCABEZADO */
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 5px; }
        /* Mismo tamaño que el logo del documento de Nutrición
           (NutritionMasterForm.tsx: h-[80px] w-[100px]). */
        .logo { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #2A4B8C; width: 100px; height: 80px; }
        .logo h1 { font-size: 48px; letter-spacing: -2px; margin-bottom: -5px; font-weight: 900; text-transform: lowercase; }
        .logo p { font-size: 10px; line-height: 1.1; font-weight: bold; }
        .title-section { flex-grow: 1; margin-left: 15px; display: flex; flex-direction: column;}

        .main-title {
            background-color: #2A4B8C;
            color: #fff;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            padding: 8px;
            border-radius: 20px;
            print-color-adjust: exact;
        }
        .title-sub-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; padding: 0 10px; }
        .address { font-size: 10px; color: #2A4B8C; font-weight: bold;}
        .fecha-container { display: flex; align-items: flex-end; width: 140px; }

        .box {
            border: 2px solid #2A4B8C;
            border-radius: 8px;
            position: relative;
            padding: 16px 8px 8px 8px;
            background: transparent;
            width: 100%;
            display: flex;
            flex-direction: column;
        }
        .box-title {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2A4B8C;
            color: white;
            font-size: 12px;
            font-weight: bold;
            padding: 2px 20px;
            border-radius: 10px;
            print-color-adjust: exact;
            white-space: nowrap;
            z-index: 2;
        }
        .box-title.left-aligned { left: 15px; transform: none; }

        .form-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 6px; }
        .field { display: flex; align-items: flex-end; flex-grow: 1; }
        .field-label { font-weight: bold; font-size: 10px; color: #2A4B8C; margin-right: 4px; white-space: nowrap; }
        input.line-input {
            border: none;
            border-bottom: 1.2px solid #5575B3;
            background: transparent;
            font-size: 11px;
            color: #333;
            flex-grow: 1;
            height: 16px;
            min-height: 16px;
            outline: none;
            width: 100%;
            font-family: Arial, sans-serif;
            padding-left: 4px;
        }

        .chk-group { display: flex; align-items: center; gap: 8px; color: #2A4B8C; font-size: 10px; flex-wrap: wrap;}
        .chk-label { display: flex; align-items: center; cursor: pointer; white-space: nowrap; font-weight: bold; font-size: 10px;}
        input[type="checkbox"], input[type="radio"] {
            appearance: none;
            width: 12px; height: 12px;
            border: 1.5px solid #2A4B8C;
            margin-right: 4px; position: relative; cursor: pointer;
            display: inline-grid; place-content: center;
            background-color: #fff;
        }
        input[type="radio"] { border-radius: 50%; }
        input[type="checkbox"]:checked::after, input[type="radio"]:checked::after {
            content: '✓'; position: absolute; top: -4px; left: 0px;
            font-size: 12px; color: #2A4B8C; font-weight: bold;
        }

        /* "Datos personales" compactada: reduce aún más tipografía/espaciado
           respecto a la base general de arriba, para que la fila
           Sexo/Edo.civil/Ocupación/F-N no haga wrap y duplique el alto. */
        .box-datos-personales {
            padding: 14px 10px 4px 10px;
            gap: 0;
        }
        .box-datos-personales .form-row { gap: 4px 10px; margin-bottom: 2px; }
        .box-datos-personales .field-label { font-size: 9.5px; }
        .box-datos-personales input.line-input { font-size: 9.5px; height: 15px; min-height: 15px; }
        .box-datos-personales .chk-label { font-size: 9.5px; }
        .box-datos-personales input[type="checkbox"],
        .box-datos-personales input[type="radio"] { width: 10px; height: 10px; }
        .box-datos-personales input[type="checkbox"]:checked::after,
        .box-datos-personales input[type="radio"]:checked::after { font-size: 10px; top: -2.5px; left: 0.5px; }

        input.chk-square {
            appearance: none;
            -webkit-appearance: none;
            width: 10px;
            height: 10px;
            border: 1.5px solid #2c5392;
            border-radius: 0;
            cursor: pointer;
            vertical-align: middle;
            flex-shrink: 0;
            transition: background-color 0.15s;
            margin-right: 4px;
        }
        input.chk-square:checked { background-color: #2c5392; }
        input.chk-square:checked::after { content: none !important; }

        .escala-dolor-container { height: 92px; margin-top: 15px; width: 100%; display: flex; justify-content: center; align-items: center; }
        .escala-dolor-chk { display: flex; width: 100%; justify-content: space-around; margin-top: 8px; flex-wrap: wrap; gap: 6px; }
        .escala-dolor-chk label { display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: bold; color: #2A4B8C; cursor: pointer; gap: 4px; }

        .table-responsive { width: 100%; overflow: visible; }
        table { width: 100%; border-collapse: collapse; text-align: center; font-size: 9px; }
        th { color: #2A4B8C; font-weight: bold; padding: 3px; border: 1px solid #2A4B8C; background-color: rgba(240, 244, 250, 0.5); }
        td { border: 1px solid #2A4B8C; padding: 3px; vertical-align: middle; color: #333; }
        .text-left { text-align: left; padding-left: 6px; }

        /* TABLA DE ANTECEDENTES */
        .tabla-antecedentes th, .tabla-antecedentes td {
            border: 1px solid #2A4B8C !important;
            color: #2A4B8C !important;
            padding: 3px;
        }
        .tabla-antecedentes th { background-color: rgba(240, 244, 250, 0.5) !important; font-size: 9px; }
        .tabla-antecedentes td.text-left { font-size: 9px; color: #333 !important; }
        .tabla-antecedentes input[type="checkbox"] { margin: 0; }

        .free-text { border: none; background: transparent; width: 100%; height: 100%; resize: none; outline: none; overflow: hidden; font-size: 9px; font-family: inherit; color: #333; min-height: 16px; text-align: center; }

        .grid-60-40 { display: grid; grid-template-columns: 63% 35%; gap: 2%; }
        .grid-55-43 { display: grid; grid-template-columns: 55% 43%; gap: 2%; }
        .grid-3-col { display: grid; grid-template-columns: 32% 32% 32%; gap: 2%; flex-grow: 1;}

        .full-width-title { background-color: #2A4B8C; color: white; font-weight: bold; font-size: 13px; padding: 4px 0; text-align: center; width: 100%; print-color-adjust: exact; border-radius: 6px 6px 0 0; }

        /* LÍNEAS DE ESCRITURA SEPARADAS */
        .blank-lines { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; flex-grow: 1; justify-content: flex-start; }
        .motivo-container { display: flex; gap: 15px; flex-grow: 1; padding: 6px 0;}
        .motivo-lines { flex: 1; display: flex; flex-direction: column; gap: 14px; justify-content: flex-start; margin-top: 6px; }

        /* ALICIA */
        .alicia-box { width: 200px; font-size: 9px; border-left: 1px solid #2A4B8C; padding-left: 15px; margin-left: 15px; display: flex; flex-direction: column; justify-content: center; line-height: 1.4; color: #2A4B8C; }
        .alicia-box p.alicia-title { font-weight: bold; font-size: 10px; margin-bottom: 4px; }
        .alicia-box ul { padding-left: 12px; }

        /* FOOTER */
        /* margin-top fijo (no "auto"): igual que el footer de
           NutritionMasterForm.tsx — con "auto" el separador solo aparece si
           sobra alto en el flex column, y estas hojas casi siempre van al
           límite (o se reducen por usePrintFitScale), así que "auto" se
           resolvía a 0 y el pie de página quedaba pegado a la tabla de
           arriba en impresión. */
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; font-size: 9px; color: #5575B3; border-top: 1px solid var(--utc-light-blue); padding-top: 4px;}
        .page-num { font-size: 14px; font-weight: bold; color: #2A4B8C; }

        .btn-salir-fixed { position: fixed; top: 64px; right: 16px; background-color: #e11d48; color: white; padding: 8px 20px; border-radius: 8px; font-weight: bold; z-index: 50; border: none; cursor: pointer; }
        .btn-siguiente-fixed { position: fixed; bottom: 32px; right: 32px; padding: 12px 32px; border-radius: 9999px; font-weight: bold; z-index: 50; border: none; transition: all 0.2s; background-color: #16a34a; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .btn-siguiente-fixed:hover { transform: scale(1.05); background-color: #15803d; }

        @media print {
            @page { size: 215.9mm 279.4mm; margin: 0; }
            /* OJO: nunca poner height:100%/overflow:hidden en body/html aquí
               — eso recorta TODO el documento a la altura de una sola página
               e impide que las hojas 2 y 3 lleguen a paginarse. */
            body, html { background-color: #fff; }
            .hc-body { padding: 0 !important; margin: 0 !important; background: white; display: flex !important; justify-content: center !important; zoom: 1 !important; }
            .page {
                box-shadow: none !important;
                border: none !important;
                /* Salto de página hacia la página 2 — sin esto, las 3 hojas
                   fluían de corrido y se aplanaban en 1 sola página física. */
                page-break-after: always;
                width: var(--print-width, 215.9mm) !important;
                min-height: 279.4mm !important;
                padding: 10mm 5mm 8mm 5mm !important;
                position: relative !important;
                margin: 0 auto !important;
                /* Escala calculada en tiempo real por usePrintFitScale — NUNCA
                   un valor fijo. Si la hoja cabe al 100%, --print-scale vale 1
                   y no pasa nada; solo se reduce si el contenido real excede
                   el alto físico de la hoja. */
                zoom: var(--print-scale, 1) !important;
            }
            .btn-salir-fixed, .btn-siguiente-fixed { display: none !important; }
        }
      ` }} />

      <div className="hc-container hc-body">

        {/* BOTONES FLOTANTES RESTAURADOS AQUÍ */}
        <button className="btn-salir-fixed" onClick={onBack}>Salir</button>
        <button className="btn-siguiente-fixed" onClick={onNext}>Siguiente (P2) →</button>

        <div className="page">
          
          {/* HEADER */}
          <div className="header">
            <div className="logo">
              <img src={logoUtc} alt="Universidad Tres Culturas" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="title-section">
              <div className="main-title">Historia Clínica Fisioterapéutica</div>
              <div className="title-sub-row">
                <span className="address">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</span>
                <div className="fecha-container">
                  <span className="field-label">Fecha:</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.fecha || ''} onChange={(e) => handleInputChange(e, 'fecha')} />
                </div>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div className="box box-datos-personales" style={{ marginTop: '0' }}>
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
                <input type="text" className="line-input" value={formatExpediente(accumulatedData.pagina_1.paciente_id)} disabled />
              </div>
            </div>
            <div className="form-row">
              <div className="field chk-group" style={{ flex: 0.9 }}>
                <span className="field-label">Sexo</span>
                <label className="chk-label"><input type="checkbox" className="chk-square" checked={accumulatedData.pagina_1.sexo === 'Fem'} onChange={() => onUpdate('pagina_1', { sexo: 'Fem' })} /> Fem</label>
                <label className="chk-label"><input type="checkbox" className="chk-square" checked={accumulatedData.pagina_1.sexo === 'Mas'} onChange={() => onUpdate('pagina_1', { sexo: 'Mas' })} /> Mas</label>
              </div>
              <div className="field chk-group" style={{ flex: 1.9 }}>
                <span className="field-label">Edo. civil</span>
                {['Soltero', 'Casado', 'Viuda(o)'].map(civil => (
                  <label key={civil} className="chk-label"><input type="checkbox" className="chk-square" checked={accumulatedData.pagina_1.civil === civil} onChange={() => onUpdate('pagina_1', { civil })} /> {civil}</label>
                ))}
              </div>
              <div className="field" style={{ flex: 1.3 }}>
                <span className="field-label">Ocupación</span>
                <input type="text" className="line-input" value={accumulatedData.pagina_1.ocupacion || ''} onChange={(e) => handleInputChange(e, 'ocupacion')} />
              </div>
              <div className="field" style={{ flex: 0.7 }}>
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
          <div className="grid-60-40" style={{ marginTop: '8px' }}>
            <div className="box" style={{ padding: 0, borderWidth: '2px' }}>
              <div className="full-width-title">Antecedentes patológicos heredofamiliares</div>
              <div className="table-responsive" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <table className="tabla-antecedentes" style={{ flex: 1, height: '100%' }}>
                  <thead>
                    <tr>
                      <th className="text-left" style={{ width: '42%' }}>Enfermedades</th>
                      <th>Madre</th><th>Padre</th><th>Aa Mat</th><th>Ao Mat</th><th>Aa Pat</th><th>Ao Pat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'Diabetes Mellitus', label: 'Diabetes Mellitus' },
                      { key: 'Obesidad o sobrepeso', label: 'Obesidad o sobrepeso' },
                      { key: 'Cáncer', label: 'Cáncer, tipo:', textField: 'heredo_cancer_tipo' },
                      { key: 'Hipertensión', label: 'Hipertensión' },
                      { key: 'Enfermedades Renales', label: 'Enfermedades Renales' },
                      { key: 'Enfermedades Endocrinas', label: 'Enfermedades Endocrinas' },
                      { key: 'Enfermedad Tiroidea', label: 'Enfermedad Tiroidea' },
                      { key: 'Enfermedades Psiquiátricas', label: 'Enfermedades Psiquiátricas' },
                      { key: 'Enfermedades Neurológicas', label: 'Enfermedades Neurológicas' },
                      { key: 'Enfermedades Autoinmunes', label: 'Enfermedades Autoinmunes' },
                      { key: 'Enfermedades Gastrointestinales', label: 'Enfermedades Gastrointestinales' },
                      { key: 'Otras', label: 'Otras:', textField: 'heredo_otras_tipo' },
                    ].map(({ key, label, textField }) => (
                      <tr key={key}>
                        <td className="text-left">
                          {textField ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
                              <input type="text" className="line-input" style={{ flex: 1, minWidth: 0 }} value={accumulatedData.pagina_1[textField] || ''} onChange={(e) => handleInputChange(e, textField)} />
                            </div>
                          ) : label}
                        </td>
                        {[...Array(6)].map((_, i) => (
                          <td key={i}><input type="checkbox" checked={accumulatedData.pagina_1[`heredo-${key}-${i}`] || false} onChange={(e) => handleCheckboxChange(`heredo-${key}-${i}`, e.target.checked)} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="box">
              <div className="box-title left-aligned">Antecedentes patológicos personales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                {[
                  { key: 'Diabetes', label: 'Diabetes Mellitus' },
                  { key: 'Obesidad', label: 'Obesidad o Sobrepeso' },
                  { key: 'Cancer', label: 'Cáncer, tipo:', textField: 'pers_cancer_tipo' },
                  { key: 'Hipertensión', label: 'Hipertensión' },
                  { key: 'Renales', label: 'Enfermedades Renales' },
                  { key: 'Endocrinas', label: 'Enfermedades Endocrinas' },
                  { key: 'Tiroidea', label: 'Enfermedad Tiroidea' },
                  { key: 'Psiquiatricas', label: 'Enfermedades Psiquiátricas' },
                  { key: 'Neurologicas', label: 'Enfermedades Neurológicas' },
                  { key: 'Autoinmunes', label: 'Enfermedades Autoinmunes' },
                  { key: 'Gastrointestinales', label: 'Enfermedades Gastrointestinales' },
                  { key: 'Fracturas', label: 'Fracturas' },
                  { key: 'Esguinces', label: 'Esguinces' },
                  { key: 'Otras', label: 'Otras:', textField: 'pers_otras_tipo' },
                ].map(({ key, label, textField }) => (
                  <label key={key} className="chk-label" style={textField ? { display: 'flex', alignItems: 'center' } : undefined}>
                    <input type="checkbox" checked={accumulatedData.pagina_1[`pers-${key}`] || false} onChange={(e) => handleCheckboxChange(`pers-${key}`, e.target.checked)} /> {label}
                    {textField && (
                      <input type="text" className="line-input" style={{ marginLeft: '5px' }} value={accumulatedData.pagina_1[textField] || ''} onChange={(e) => handleInputChange(e, textField)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-3-col" style={{ marginTop: '8px' }}>
            <div className="box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
              <div className="box-title">Dolor</div>
              <div className="escala-dolor-container">
                <img src={caritasImg} alt="EVA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
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

          {/* BLOQUE INFERIOR: Estudios de gabinete / Qx o Tx previos / Antecedentes personales no patológicos */}
          <div className="grid-3-col" style={{ marginTop: '8px' }}>
            <div className="box">
              <div className="box-title">Estudios de gabinete</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`estudio_gabinete_${i}`] || ''} onChange={(e) => handleInputChange(e, `estudio_gabinete_${i}`)} />)}
              </div>
            </div>
            <div className="box">
              <div className="box-title">Qx o Tx previos</div>
              <div className="blank-lines">
                {[...Array(4)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`qx_tx_${i}`] || ''} onChange={(e) => handleInputChange(e, `qx_tx_${i}`)} />)}
              </div>
            </div>
            <div className="box" style={{ padding: 0, borderWidth: '2px' }}>
              <div className="full-width-title" style={{ fontSize: '10px' }}>Antecedentes personales no patológicos</div>
              <div className="table-responsive" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <table style={{ flex: 1, height: '100%' }}>
                  <thead>
                    <tr><th></th><th>Frecuencia</th><th>Cantidad</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'Habito tabaquico', label: 'Hábito tabáquico' },
                      { key: 'Consumo de alcohol', label: 'Consumo de alcohol' },
                      { key: 'Consumo de drogas', label: 'Consumo de drogas' },
                    ].map(({ key, label }, i) => (
                      <tr key={key}>
                        <td className="text-left">
                          <label className="chk-label"><input type="checkbox" checked={accumulatedData.pagina_1[`no_pat-${key}`] || false} onChange={(e) => handleCheckboxChange(`no_pat-${key}`, e.target.checked)} /> {label}</label>
                        </td>
                        <td><input type="text" className="free-text" value={accumulatedData.pagina_1[`no_pat_frecuencia_${i}`] || ''} onChange={(e) => handleInputChange(e, `no_pat_frecuencia_${i}`)} /></td>
                        <td><input type="text" className="free-text" value={accumulatedData.pagina_1[`no_pat_cantidad_${i}`] || ''} onChange={(e) => handleInputChange(e, `no_pat_cantidad_${i}`)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ejercicio / Antecedentes gineco-obstétricos */}
          <div className="grid-55-43" style={{ marginTop: '8px' }}>
            <div className="box" style={{ padding: '18px 10px 5px 10px' }}>
              <div className="box-title">Ejercicio</div>
              <div className="form-row" style={{ marginBottom: '8px' }}>
                <div className="field chk-group">
                  <span className="field-label">Realiza ejercicio</span>
                  <label className="chk-label"><input type="radio" name="ejercicio_realiza" checked={accumulatedData.pagina_1.ejercicio_realiza === 'No'} onChange={() => onUpdate('pagina_1', { ejercicio_realiza: 'No' })} /> No</label>
                  <label className="chk-label"><input type="radio" name="ejercicio_realiza" checked={accumulatedData.pagina_1.ejercicio_realiza === 'Si'} onChange={() => onUpdate('pagina_1', { ejercicio_realiza: 'Si' })} /> Sí</label>
                </div>
                <div className="field" style={{ marginLeft: '10px' }}>
                  <span className="field-label">¿Cuál?</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.ejercicio_cual || ''} onChange={(e) => handleInputChange(e, 'ejercicio_cual')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <span className="field-label">Frecuencia</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.ejercicio_frecuencia || ''} onChange={(e) => handleInputChange(e, 'ejercicio_frecuencia')} />
                </div>
                <div className="field">
                  <span className="field-label">Intensidad</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.ejercicio_intensidad || ''} onChange={(e) => handleInputChange(e, 'ejercicio_intensidad')} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <span className="field-label">Tiempo</span>
                  <input type="text" className="line-input" value={accumulatedData.pagina_1.ejercicio_tiempo || ''} onChange={(e) => handleInputChange(e, 'ejercicio_tiempo')} />
                </div>
              </div>
            </div>

            <div className="box" style={{ padding: '18px 10px 5px 10px' }}>
              <div className="box-title">Antecedentes gineco-obstétricos</div>
              <div className="form-row" style={{ marginBottom: '6px' }}>
                <div className="field" style={{ flex: '0 0 auto' }}>
                  <span className="field-label">Gestas</span>
                  <input type="text" className="line-input" style={{ width: '30px' }} value={accumulatedData.pagina_1.gineco_gestas || ''} onChange={(e) => handleInputChange(e, 'gineco_gestas')} />
                </div>
                <div className="field" style={{ flex: '0 0 auto' }}>
                  <span className="field-label" style={{ fontWeight: 'normal' }}>de las cuales fueron: P</span>
                  <input type="text" className="line-input" style={{ width: '25px' }} value={accumulatedData.pagina_1.gineco_partos || ''} onChange={(e) => handleInputChange(e, 'gineco_partos')} />
                </div>
                <div className="field" style={{ flex: '0 0 auto' }}>
                  <span className="field-label">C</span>
                  <input type="text" className="line-input" style={{ width: '25px' }} value={accumulatedData.pagina_1.gineco_cesarea || ''} onChange={(e) => handleInputChange(e, 'gineco_cesarea')} />
                </div>
                <div className="field" style={{ flex: '0 0 auto' }}>
                  <span className="field-label">A</span>
                  <input type="text" className="line-input" style={{ width: '25px' }} value={accumulatedData.pagina_1.gineco_abortos || ''} onChange={(e) => handleInputChange(e, 'gineco_abortos')} />
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: '6px' }}>
                <div className="field" style={{ flex: '0 0 auto' }}>
                  <span className="field-label">FUM</span>
                  <input type="text" className="line-input" style={{ width: '40px' }} value={accumulatedData.pagina_1.gineco_fum || ''} onChange={(e) => handleInputChange(e, 'gineco_fum')} />
                </div>
                <div className="field chk-group" style={{ marginLeft: '5px' }}>
                  <span className="field-label">Embarazo</span>
                  <label className="chk-label"><input type="radio" name="gineco_embarazo" checked={accumulatedData.pagina_1.gineco_embarazo === 'No'} onChange={() => onUpdate('pagina_1', { gineco_embarazo: 'No' })} /> No</label>
                  <label className="chk-label"><input type="radio" name="gineco_embarazo" checked={accumulatedData.pagina_1.gineco_embarazo === 'Si'} onChange={() => onUpdate('pagina_1', { gineco_embarazo: 'Si' })} /> Sí</label>
                </div>
                <div className="field" style={{ flex: '0 0 auto', marginLeft: '5px' }}>
                  <span className="field-label">SDG</span>
                  <input type="text" className="line-input" style={{ width: '30px' }} value={accumulatedData.pagina_1.gineco_sdg || ''} onChange={(e) => handleInputChange(e, 'gineco_sdg')} />
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: '6px' }}>
                <div className="field chk-group">
                  <span className="field-label">Remplazo hormonal</span>
                  <label className="chk-label"><input type="radio" name="gineco_reemplazo_hormonal" checked={accumulatedData.pagina_1.gineco_reemplazo_hormonal === 'No'} onChange={() => onUpdate('pagina_1', { gineco_reemplazo_hormonal: 'No' })} /> No</label>
                  <label className="chk-label"><input type="radio" name="gineco_reemplazo_hormonal" checked={accumulatedData.pagina_1.gineco_reemplazo_hormonal === 'Si'} onChange={() => onUpdate('pagina_1', { gineco_reemplazo_hormonal: 'Si' })} /> Sí<input type="text" className="line-input" style={{ width: '110px', marginLeft: '6px' }} value={accumulatedData.pagina_1.gineco_reemplazo_hormonal_cual || ''} onChange={(e) => handleInputChange(e, 'gineco_reemplazo_hormonal_cual')} /></label>
                </div>
              </div>
              <div className="form-row">
                <div className="field chk-group">
                  <span className="field-label">Anticonceptivos</span>
                  <label className="chk-label"><input type="radio" name="gineco_anticonceptivos" checked={accumulatedData.pagina_1.gineco_anticonceptivos === 'No'} onChange={() => onUpdate('pagina_1', { gineco_anticonceptivos: 'No' })} /> No</label>
                  <label className="chk-label"><input type="radio" name="gineco_anticonceptivos" checked={accumulatedData.pagina_1.gineco_anticonceptivos === 'Si'} onChange={() => onUpdate('pagina_1', { gineco_anticonceptivos: 'Si' })} /> Sí<input type="text" className="line-input" style={{ width: '110px', marginLeft: '6px' }} value={accumulatedData.pagina_1.gineco_anticonceptivos_cual || ''} onChange={(e) => handleInputChange(e, 'gineco_anticonceptivos_cual')} /></label>
                </div>
              </div>
            </div>
          </div>

          <div className="box" style={{ flexGrow: 1, marginTop: '8px' }}>
            <div className="box-title">Motivo de consulta</div>
            <div className="motivo-container">
              <div className="motivo-lines">
                {[...Array(7)].map((_, i) => <input key={i} type="text" className="line-input" value={accumulatedData.pagina_1[`motivo_${i}`] || ''} onChange={(e) => handleInputChange(e, `motivo_${i}`)} />)}
              </div>
              <div className="alicia-box">
                <p className="alicia-title">Recordando, dolor (ALICIA),<br />donde:</p>
                <ul>
                  <li><b>A</b>ntigüedad</li>
                  <li><b>L</b>ugar: Zona</li>
                  <li><b>I</b>ncidencia: # episodios / frecuencia</li>
                  <li><b>C</b>aracterísticas</li>
                  <li><b>I</b>ntensidad</li>
                  <li><b>A</b>gravantes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer">
            <p>ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.<br />
            Aa: abuela; Ao: abuelo; Mat: materno (a); Pat: paterno (a); Qx: Cirugías; Tx: Tratamientos; Gestas: P: Partos; C: Cesárea; A: Abortos; FUM: Fecha de última menstruación; SDG: Semanas de Gestación</p>
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
  onNext,
  isReadOnly,
}) => {
  const { containerRef, addMarker, normalizeMarkers } = useBodyMarkers();
  // Los marcadores se guardan en % (xPct/yPct) desde la captura en vivo
  // (BodyMarkerDiagram/useBodyMarkers) — normalizeMarkers también convierte
  // el formato legado en px absolutos ({x,y}) usando el tamaño real ya
  // montado del contenedor. Sin esto, un marcador en % se renderizaba con
  // `left`/`top` en `undefined` (CSS los ignora) y caía en la esquina del
  // contenedor en vez de en el punto marcado.
  const [normalizedMarkersP2, setNormalizedMarkersP2] = useState<BodyMarkerPct[] | null>(null);
  useEffect(() => {
    // Recalcula cada vez que cambian los marcadores de origen (no solo la
    // primera vez): el estado inicial del formulario ya trae
    // `pagina_2.markers = []` (arreglo vacío, "truthy") antes de que llegue
    // el expediente real desde la API — un guard de "solo una vez" se
    // quedaría fijo en ese `[]` transitorio y nunca reflejaría los
    // marcadores reales una vez cargados.
    const raw = accumulatedData.pagina_2.markers;
    setNormalizedMarkersP2(raw && raw.length > 0 ? normalizeMarkers(raw) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accumulatedData.pagina_2.markers]);
  const displayMarkersP2 = normalizedMarkersP2 ?? [];

  // Lógica de marcadores (X) adaptada para persistencia global en accumulatedData
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    // Evita marcar si se hace clic en el botón de borrar
    if ((e.target as HTMLElement).closest('.btn-clear-as-icon')) return;

    const marker = addMarker(e);
    if (marker) {
      const currentMarkers = displayMarkersP2;
      const next = [...currentMarkers, marker];
      setNormalizedMarkersP2(next);
      onUpdate('pagina_2', { markers: next });
    }
  };

  const clearAllMarkers = () => {
    setNormalizedMarkersP2([]);
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
            /* display:block (no flex): centrar con flexbox (align-items) un
               hijo con zoom aplicado da resultados inconsistentes en
               Chromium — el hijo terminaba centrado según su ancho SIN
               zoom, pero pintado ya reducido, desalineándolo y desbordando
               el viewport real en móvil. .page-p2 ya tiene
               margin-left/right:auto, que sí centra de forma correcta y
               estable con zoom en un contenedor de bloque normal. */
            display: block;
            padding: 20px 180px;
            min-height: 100vh;
        }
        /* Ver .hc-body en Page1 para la explicación completa. */
        @media (max-width: 1023px) {
          .hc-body-p2 { padding: 20px 8px; }
        }
        /* Zoom cosmético SOLO para pantalla — ver .hc-body arriba. Se anula
           en @media print más abajo. Restringido a >=1024px por la misma
           razón que .hc-body (desbordaba el viewport real en portrait de
           tablet y en móvil). */
        @media (min-width: 1024px) {
          .hc-body-p2 { zoom: 1.5; }
        }

        .controls-bar-p2 {
            width: 100%;
            max-width: calc(100% - 20px);
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
            zoom: var(--screen-scale, 1);
            background-color: #fff;
            width: var(--screen-width, 215.9mm);
            flex-shrink: 0;
            margin-left: auto;
            margin-right: auto;
            min-height: 279.4mm;
            /* Padding y proporciones replicadas de la referencia de diseño
               (misma geometría que la página 1). */
            padding: 10mm 5mm 8mm 5mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            color: var(--utc-blue);
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            overflow: hidden;
            z-index: 1;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .page-p2::before {
            content: "utc";
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 280px;
            font-weight: 900;
            color: rgba(230, 235, 240, 0.3);
            z-index: -1;
            pointer-events: none;
            letter-spacing: -15px;
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
            padding: 4px 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        input.line-input-p2 {
            border: none;
            border-bottom: 1.2px solid var(--utc-blue);
            background: transparent;
            font-size: 11px;
            color: #333;
            height: 16px;
            outline: none;
            width: 100%;
            font-family: Arial, sans-serif;
            padding-left: 4px;
        }

        .free-text-p2 {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            font-size: 10px;
            color: #333;
            outline: none !important;
            resize: none;
            overflow: hidden;
            width: 100%;
            height: 100%;
            min-height: 18px;
            font-family: Arial, sans-serif;
            padding: 3px 6px;
            box-sizing: border-box;
            display: block;
        }

        .chk-group-p2 { display: flex; align-items: center; gap: 30px; flex-wrap: wrap;}
        .chk-label-p2 { display: flex; align-items: center; cursor: pointer; font-size: 11px; color: var(--utc-blue);}

        input[type="checkbox"] {
            appearance: none; -webkit-appearance: none;
            width: 12px; height: 12px;
            border: 1.5px solid var(--utc-blue);
            margin-right: 5px; position: relative; cursor: pointer;
            display: inline-grid; place-content: center;
            background-color: #fff;
        }
        input[type="checkbox"]:checked::before {
            content: '✓';
            font-size: 11px; color: var(--utc-blue); font-weight: bold;
        }

        .smart-content { display: flex; flex-grow: 1; min-height: 380px; }
        .smart-left { width: 28%; border-right: 2px solid var(--utc-blue); padding: 12px; display: flex; flex-direction: column; }
        .smart-right { width: 72%; display: flex; flex-direction: column; padding: 12px 12px 0 12px; }
        .lines-container { display: flex; flex-direction: column; gap: 13px; margin-top: 6px; flex-grow: 1; }

        .smart-reminder { font-size: 10px; color: var(--utc-blue); margin-top: 12px; line-height: 1.45; }
        .smart-reminder ul { list-style: none; padding-left: 0; margin-top: 5px;}

        .plazos-wrapper { width: 100%; display: flex; flex-direction: column; flex-grow: 1; }
        .plazos-header {
            display: flex;
            background-color: var(--utc-blue);
            color: white;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 12px;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        .plazos-header div { flex: 1; text-align: center; font-size: 12px; font-weight: bold; padding: 5px 0; border-right: 1px solid white; }
        .plazos-header div:last-child { border-right: none; }
        .plazos-columns { display: flex; flex-grow: 1; margin-top: 6px; }
        .plazos-columns textarea { flex: 1; border: none; border-right: 1px solid var(--utc-blue); background: transparent; resize: none; outline: none; overflow: hidden; padding: 10px; font-size: 12px; font-family: Arial, sans-serif; color: #000; }
        .plazos-columns textarea:last-child { border-right: none; }

        /* Exploración física — tres bloques independientes (Observación /
           Inspección / Palpación), cada uno con su propia pila de filas.
           No es una <table> porque el PDF oficial no alinea las líneas
           horizontales entre bloques (cada bloque agrupa sus campos con
           alturas propias, ver rowSpans que tenía la tabla anterior). */
        .exploracion-p2-cols { display: flex; width: 100%; text-align: center; }
        .exploracion-p2-col { flex: 1 1 33.333%; display: flex; flex-direction: column; border-right: 1px solid var(--utc-blue); }
        .exploracion-p2-col:last-child { border-right: none; }
        .exploracion-p2-col-title { color: var(--utc-blue); font-size: 12px; font-weight: bold; padding: 4px; border-bottom: 1px solid var(--utc-blue); }
        .exploracion-p2-row { display: flex; border-bottom: 1px solid var(--utc-blue); min-height: 24px; }
        .exploracion-p2-row:last-child { border-bottom: none; }
        .exploracion-p2-input { flex: 1 1 64%; }
        .lbl-col-p2 { color: var(--utc-blue); font-size: 11px; text-align: center; padding: 4px; flex: 0 0 36%; border-right: 1px solid var(--utc-blue); display: flex; align-items: center; justify-content: center; }

        .zona-content { display: flex; padding: 14px 16px; }
        .zona-left { width: 35%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-right: 1px dashed #ccc; padding-right: 12px; }
        .zona-right { width: 65%; padding-left: 22px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }

        /* aspect-ratio fijo al de Humano_1.png (585/521) — ver el comentario
           equivalente en .image-marker-container-p3 más abajo. Este caso en
           particular ya medía bien (inline-block se ajusta al tamaño real de
           la imagen), pero depende de que ningún ancestro fuerce un ancho
           distinto; fijar el aspect-ratio lo hace robusto sin depender de eso. */
        .image-marker-container-p2 {
            position: relative;
            width: 100%;
            aspect-ratio: 585 / 521;
            cursor: crosshair;
        }
        .image-marker-container-p2 img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .marker-p2 {
            position: absolute;
            color: red;
            font-weight: bold;
            font-size: 20px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            text-shadow: 1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white;
        }

        .form-row-zona { display: flex; align-items: center; flex-wrap: wrap; }
        .form-row-zona .lbl { width: 90px; font-weight: bold; font-size: 11px; color: var(--utc-blue); }
        .otros-row { display: flex; align-items: flex-end; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
        .otros-row .lbl { font-weight: bold; font-size: 11px; color: var(--utc-blue); }

        /* margin-top fijo — ver comentario equivalente en .footer (página 1). */
        .footer-p2 { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; font-size: 9px; color: var(--utc-blue); border-top: 1px solid var(--utc-light-blue); padding-top: 4px; }
        .page-num-p2 { font-size: 14px; font-weight: bold; }

        @media print {
            @page { size: 215.9mm 279.4mm; margin: 0; }
            .hc-body-p2 { padding: 0; background: white; zoom: 1 !important; }
            .controls-bar-p2, .btn-anterior-fixed, .btn-siguiente-fixed { display: none !important; }
            .eraser-container { display: none !important; }
            .page-p2 {
                box-shadow: none !important;
                /* Salto hacia la página 3 — misma razón que en .page. */
                page-break-after: always;
                width: var(--print-width, 215.9mm) !important;
                min-height: 279.4mm !important;
                padding: 10mm 5mm 8mm 5mm !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
                /* Escala calculada en tiempo real por usePrintFitScale — NUNCA
                   un valor fijo. */
                zoom: var(--print-scale, 1) !important;
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
          <div className="box-p2" style={{ marginTop: '8px' }}>
            <div className="box-header-p2">Exploración física</div>
            <div className="exploracion-p2-cols">
              <div className="exploracion-p2-col">
                <div className="exploracion-p2-col-title">Observación</div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Marcha</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_marcha || ''} onChange={(e) => handleLocalInputChange(e, 'obs_marcha')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Movilidad</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_movilidad || ''} onChange={(e) => handleLocalInputChange(e, 'obs_movilidad')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Agilidad</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.obs_agilidad || ''} onChange={(e) => handleLocalInputChange(e, 'obs_agilidad')} />
                  </div>
                </div>
              </div>

              <div className="exploracion-p2-col">
                <div className="exploracion-p2-col-title">Inspección</div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Cicatriz</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_cicatriz || ''} onChange={(e) => handleLocalInputChange(e, 'ins_cicatriz')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Hematoma</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_hematoma || ''} onChange={(e) => handleLocalInputChange(e, 'ins_hematoma')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Edema</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_edema || ''} onChange={(e) => handleLocalInputChange(e, 'ins_edema')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Tumefacción</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_tumefaccion || ''} onChange={(e) => handleLocalInputChange(e, 'ins_tumefaccion')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Otro</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.ins_otro || ''} onChange={(e) => handleLocalInputChange(e, 'ins_otro')} />
                  </div>
                </div>
              </div>

              <div className="exploracion-p2-col">
                <div className="exploracion-p2-col-title">Palpación</div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Temperatura</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_temp || ''} onChange={(e) => handleLocalInputChange(e, 'pal_temp')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Contractura</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_contractura || ''} onChange={(e) => handleLocalInputChange(e, 'pal_contractura')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Dolor</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_dolor || ''} onChange={(e) => handleLocalInputChange(e, 'pal_dolor')} />
                  </div>
                </div>
                <div className="exploracion-p2-row" style={{ flex: 1 }}>
                  <div className="lbl-col-p2">Otro</div>
                  <div className="exploracion-p2-input">
                    <textarea className="free-text-p2" value={accumulatedData.pagina_2.pal_otro || ''} onChange={(e) => handleLocalInputChange(e, 'pal_otro')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ESTADO DE LA ZONA (CON MARCADORES X) */}
          <div className="box-p2" style={{ marginTop: '8px' }}>
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
                  {displayMarkersP2.map((marker, index) => (
                    <div
                      key={marker.id ?? index}
                      className="marker-p2"
                      style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
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
  isSaving,
  isYaGuardado,
  onFinalizarDirecto,
  isReadOnly,
}) => {
  const { containerRef, addMarker: addMarkerPct, normalizeMarkers } = useBodyMarkers();
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Ver el comentario equivalente en PhysiotherapyPage2Component: los
  // marcadores se guardan en % (xPct/yPct), normalizeMarkers también
  // convierte el formato legado en px absolutos.
  const [normalizedMarkersP3, setNormalizedMarkersP3] = useState<BodyMarkerPct[] | null>(null);
  useEffect(() => {
    // Ver el comentario equivalente en PhysiotherapyPage2Component.
    const raw = accumulatedData.pagina_3.markers;
    setNormalizedMarkersP3(raw && raw.length > 0 ? normalizeMarkers(raw) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accumulatedData.pagina_3.markers]);
  const displayMarkersP3 = normalizedMarkersP3 ?? [];

  // --- LÓGICA DE MARCADORES (P3 - Dermatomas) ---
  const addMarker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    if ((e.target as HTMLElement).closest('.btn-clear-as-icon')) return;

    const marker = addMarkerPct(e, true);
    if (marker) {
      const next = [...displayMarkersP3, marker];
      setNormalizedMarkersP3(next);
      onUpdate('pagina_3', { markers: next });
    }
  };

  const clearMarkers = () => {
    setNormalizedMarkersP3([]);
    onUpdate('pagina_3', { markers: [] });
  };

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, id: string) => {
    onUpdate('pagina_3', { [id]: e.target.value });
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
            /* display:block (no flex) — ver .hc-body-p2 para la explicación
               completa: centrar con align-items un hijo con zoom aplicado
               desalineaba y desbordaba el viewport real en móvil.
               .page-p3 ya tiene margin-left/right:auto para centrarse. */
            display: block;
            padding: 20px 180px;
            min-height: 100vh;
        }
        /* Ver .hc-body en Page1 para la explicación completa. */
        @media (max-width: 1023px) {
          .hc-body-p3 { padding: 20px 8px; }
        }
        /* Zoom cosmético SOLO para pantalla — ver .hc-body arriba. Se anula
           en @media print más abajo. Restringido a >=1024px por la misma
           razón que .hc-body (desbordaba el viewport real en portrait de
           tablet y en móvil). */
        @media (min-width: 1024px) {
          .hc-body-p3 { zoom: 1.5; }
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
            zoom: var(--screen-scale, 1);
            background-color: #fff;
            width: var(--screen-width, 215.9mm);
            flex-shrink: 0;
            margin-left: auto;
            margin-right: auto;
            min-height: 279.4mm;
            /* Padding y proporciones replicadas de la referencia de diseño
               (misma geometría que las páginas 1 y 2). */
            padding: 10mm 5mm 8mm 5mm;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            color: #1F4287;
            display: flex;
            flex-direction: column;
            gap: 8px;
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
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            padding: 4px 0;
            border-bottom: 1.5px solid #1F4287;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .free-text-p3 {
            border: none !important;
            background: transparent !important;
            font-size: 10px;
            color: #333;
            outline: none !important;
            resize: none;
            overflow: hidden;
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            padding: 3px 6px;
            display: block;
        }

        .tabla-p3 { width: 100%; border-collapse: collapse; text-align: center; height: 100%; }
        .tabla-p3 th { color: #1F4287; font-size: 9px; font-weight: bold; padding: 3px; border: 1px solid #1F4287; }
        .tabla-p3 td { border: 1px solid #1F4287; padding: 0; vertical-align: middle; }

        .movilidad-box-p3 th, .movilidad-box-p3 td, .movilidad-box-p3 textarea, .movilidad-box-p3 span {
            font-size: 8.5px !important;
        }
        .movilidad-box-p3 td { height: 15px !important; }
        .movilidad-box-p3 td.movilidad-nota { height: auto !important; }

        /*
          aspect-ratio fijo al de Humano_2.png (636/601, medido del archivo)
          en vez de height/min-height + flex-centrado: con eso, si la
          imagen no llenaba el contenedor en algún eje quedaba una franja
          vacía ("letterbox"), y los marcadores (guardados como % del
          CONTENEDOR) se veían desplazados respecto a la imagen — mismo
          bug que en BodyMarkerDiagram.tsx (captura), corregido igual aquí
          para que contenedor% === imagen% siempre.
        */
        .image-marker-container-p3 {
            position: relative;
            width: 100%;
            aspect-ratio: 636 / 601;
            cursor: crosshair;
            background-color: #fff;
        }
        .image-marker-container-p3 img { width: 100%; height: 100%; object-fit: contain; }
        .marker-p3 {
            position: absolute;
            color: #e74c3c;
            font-weight: bold;
            font-size: 18px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            text-shadow: 1px 1px 0px white;
        }

        .signatures-area-p3 { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding: 0 30px; margin-bottom: 10px; }
        .signature-line-p3 { border-top: 1.5px solid #1F4287; width: 42%; text-align: center; font-size: 11px; color: #1F4287; font-weight: bold; padding-top: 6px; }

        /* margin-top fijo — ver comentario equivalente en .footer (página 1). */
        .footer-p3 { display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #1F4287; margin-top: 12px; border-top: 1px solid #1F4287; padding-top: 4px; }

        @media print {
            @page { size: 215.9mm 279.4mm; margin: 0; }
            .hc-body-p3 { padding: 0; background: white; zoom: 1 !important; }
            .btn-anterior-p3, .btn-finalizar-p3, .eraser-container-p3 { display: none !important; }
            /* Escala calculada en tiempo real por usePrintFitScale — NUNCA un
               valor fijo. */
            .page-p3 { box-shadow: none !important; width: var(--print-width, 215.9mm) !important; min-height: 279.4mm !important; padding: 10mm 5mm 8mm 5mm !important; margin: 0 auto !important; zoom: var(--print-scale, 1) !important; }
        }
      `}</style>

      <div className="hc-body-p3">
        <button className="btn-anterior-p3" onClick={onBack}>Anterior</button>
        {/* En modo solo lectura no se renderiza — consistente con
            HojaEvolutiva.tsx y NutritionMasterForm.tsx: un botón "Guardar"
            visible sobre un documento ya finalizado es una señal engañosa,
            aunque hoy ya se muestre atenuado vía :disabled. */}
        {!isReadOnly && (
          <button
            className="btn-finalizar-p3"
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
                    onFinalizarDirecto?.();
                  }}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#27AE60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Sí, guardar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="page-p3">
          <div className="flex gap-3 w-full" style={{ marginTop: '8px' }}>
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
                  {displayMarkersP3.map((marker, index) => (
                    <div key={marker.id ?? index} className="marker-p3" style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}>✖</div>
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
                      <td className="font-bold p-1 bg-gray-50" style={{ color: '#5575B3' }}>{ref}</td>
                      <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`ref_${ref}`] || ''} onChange={(e)=>handleLocalInputChange(e, `ref_${ref}`)}></textarea></td>
                      {i === 0 && <td rowSpan={4}><textarea className="free-text-p3" value={accumulatedData.pagina_3.valoracion_tono || ''} onChange={(e)=>handleLocalInputChange(e, 'valoracion_tono')}></textarea></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="box-p3 movilidad-box-p3" style={{ marginTop: '8px' }}>
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
                  <td className="font-bold text-left" style={{ padding: '0 8px', color: '#1F4287' }}>Zona a valorar:</td>
                  <td colSpan={4} className="border-r-2 border-blue-900"><textarea className="free-text-p3" value={accumulatedData.pagina_3.zona_der || ''} onChange={(e)=>handleLocalInputChange(e, 'zona_der')}></textarea></td>
                  <td className="font-bold text-left" style={{ padding: '0 8px', color: '#1F4287' }}>Zona a valorar:</td>
                  <td colSpan={4}><textarea className="free-text-p3" value={accumulatedData.pagina_3.zona_izq || ''} onChange={(e)=>handleLocalInputChange(e, 'zona_izq')}></textarea></td>
                </tr>
                {['Flexión', 'Extensión', 'Abducción', 'Rot. Interna', 'Rot. Externa', 'Desv. Radial', 'Desv. Cubital'].map((mov) => (
                  <tr key={mov}>
                    <td className="font-bold" style={{ color: '#5575B3' }}>{mov}</td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_fza1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_fza1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_fza2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_fza2_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_arc1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_arc1_${mov}`)}></textarea></td>
                    <td className="border-r-2 border-blue-900"><textarea className="free-text-p3" value={accumulatedData.pagina_3[`d_arc2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `d_arc2_${mov}`)}></textarea></td>
                    <td className="font-bold" style={{ color: '#5575B3' }}>{mov}</td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_fza1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_fza1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_fza2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_fza2_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_arc1_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_arc1_${mov}`)}></textarea></td>
                    <td><textarea className="free-text-p3" value={accumulatedData.pagina_3[`i_arc2_${mov}`] || ''} onChange={(e)=>handleLocalInputChange(e, `i_arc2_${mov}`)}></textarea></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="text-left border-r-2 border-blue-900" style={{ padding: '4px 8px' }}>
                    <span className="font-bold" style={{ color: '#5575B3' }}>Observaciones:</span>
                    <textarea className="free-text-p3 h-8" value={accumulatedData.pagina_3.obs_der || ''} onChange={(e)=>handleLocalInputChange(e, 'obs_der')}></textarea>
                  </td>
                  <td colSpan={5} className="text-left" style={{ padding: '4px 8px' }}>
                    <span className="font-bold" style={{ color: '#5575B3' }}>Observaciones:</span>
                    <textarea className="free-text-p3 h-8" value={accumulatedData.pagina_3.obs_izq || ''} onChange={(e)=>handleLocalInputChange(e, 'obs_izq')}></textarea>
                  </td>
                </tr>
                <tr>
                  <td colSpan={10} className="movilidad-nota text-left" style={{ padding: '4px 8px', color: '#5575B3' }}>
                    MMSS: Miembros superiores MMII: Miembros inferiores CV: columna vertebral. Especificar la zona a valorar ejemplo: MMSS Hombro / CV cervical / MMII tobillo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="box-p3" style={{ marginTop: '8px' }}>
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
export default PhysiotherapyMasterForm;
