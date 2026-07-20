import React from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useSeguimientoNutricionalData } from '../hooks/formClinico/useSeguimientoNutricionalData';
import { useAuth } from '../contexts/AuthContext';
import { usePrintFitScale } from '../hooks/usePrintFitScale';
import { useScreenFitScale } from '../hooks/useScreenFitScale';
import { formatExpediente } from '../lib/formatExpediente';
import logoUtc from './logo_historiales.jpg';

/**
 * Representación documental del Seguimiento Nutricional — hoja impresa en
 * mm, solo lectura. EXCLUSIVO de nutrición (fisioterapia conserva
 * HojaEvolutiva.tsx sin este bloqueo por columna). La captura en vivo vive
 * en captura/SeguimientoNutricionalCaptura.tsx; este componente ya no
 * implementa FormClinicoHandle ni persiste cambios, solo muestra los datos
 * ya guardados vía useSeguimientoNutricionalData — el mismo hook que usa la
 * captura, así que carga correctamente el documento acumulado sin importar
 * cuál de las 6 consultas (appointment_id) se haya usado para llegar aquí.
 */
const SeguimientoNutricional = () => {
  const navigate = useNavigate();
  const { appointmentId, formData, isLoading } = useSeguimientoNutricionalData({});
  const { user } = useAuth();
  const puedeEditar = user?.rol === 'admin' || user?.rol === 'master';

  const handleVolver = () => navigate(-1);
  const handleImprimir = () => window.print();
  const handleEditar = () => navigate(`/forms/seguimiento-nutricional/${appointmentId}`);

  // Los inputs se dejan readOnly (ver más abajo) — estos manejadores nunca se
  // disparan por interacción del usuario; se conservan sin efecto para no
  // tener que tocar cada uno de los ~150 elementos que los referencian.
  const handleInputChange = () => {};
  const handleDateInput = () => {};
  const handleNumberInput = () => {};
  const handleDaysInput = () => {};

  // Regla de impresión única para todos los documentos clínicos del sistema
  // (ver src/app/hooks/usePrintFitScale.ts para la explicación completa del
  // mecanismo). Validado en este componente y reutilizado tal cual en
  // NutritionMasterForm.tsx y PhysiotherapyMasterForm.tsx.
  usePrintFitScale(['.page', '.page2', '.page3', '.page4', '.page5', '.page6']);
  // Ajuste de pantalla en móvil (no impresión) — ver useScreenFitScale.ts.
  useScreenFitScale(['.page', '.page2', '.page3', '.page4', '.page5', '.page6']);

  // Lista dinámica para la página 2
  const alimentos: string[] = [
    "Verduras", "Frutas", "Cereal sin grasa", "Pan dulce natural", "Pan dulce UP", "Galletas", 
    "Leguminosas", "Carne de res", "Carne de cerdo", "Carne de pollo", "Pavo", "Pescados", 
    "Mariscos", "Huevo", "Prod. animal UP", "Quesos blancos", "Quesos amarillos", "Embutidos", 
    "Leche sin sabor", "Yogurt sin sabor", "Leche UP", "Yogurt UP", "Oleaginosas", "Aceites", 
    "Mantequilla", "Margarina", "Refresco", "Agua de sabor UP", "Jugos naturales", "Jugos UP", 
    "Helado", "Nieve", "Gelatinas", "Aguas de frutas", "Té", "Café", "Agua natural", 
    "Papas fritas", "Garnachas a comal", "Garnachas fritas"
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* BOTONERA FLOTANTE — solo lectura: Volver / Imprimir / Editar */}
      {/* Fuera de .hoja-evolutiva-wrapper a propósito: ese wrapper trae
          un reset `* { padding: 0 }` para las celdas de la hoja impresa
          que, si estos botones quedaran dentro, también les comía el
          padding de Tailwind y los aplastaba. */}
      {/* ========================================================= */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-1.5 sm:gap-2 print:hidden">
        <button
          onClick={handleVolver}
          className="bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
        <button
          onClick={handleImprimir}
          className="bg-blue-900 hover:bg-blue-800 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
          </svg>
          Imprimir
        </button>
        {appointmentId && puedeEditar && (
          <button
            onClick={handleEditar}
            className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
            Editar
          </button>
        )}
      </div>

    <div className="hoja-evolutiva-wrapper">
      {/* LOADER PRINCIPAL */}
     {isLoading && (
         <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loader2 className="animate-spin w-12 h-12 text-blue-900" />
         </div>
      )}

      {/* ========================================================= */}
      {/* ESTILOS CSS (¡AQUÍ FALTABA LA ETIQUETA STYLE!) */}
      {/* ========================================================= */}
      <style>
        {`
         

         /* ==========================================================
             ESTILOS GENERALES Y PÁGINA 1
             ========================================================== */
          .hoja-evolutiva-wrapper * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Arial', sans-serif; }
          .hoja-evolutiva-wrapper {
              --azul-utc: #26549A;
              --azul-claro: #E8EFF7;
              --texto-label: #26549A;
              --borde-grueso: 2px solid #26549A;
              --borde-fino: 1px solid #26549A;
          }
          .hoja-evolutiva-wrapper {
              background-color: #525659;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              min-height: 100vh;
          }
          .page {
              zoom: var(--screen-scale, 1);
              background-color: #ffffff;
              width: 215.9mm;
              min-height: 279.4mm;
              padding: 10mm 12mm;
              margin-bottom: 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              
          }
          .wave-bg { position: absolute; top: -20px; right: -20px; width: 180px; height: 120px; background-color: var(--azul-utc); border-bottom-left-radius: 100%; z-index: 1; }
          .wave-bg-light { position: absolute; top: -20px; right: 80px; width: 140px; height: 80px; background-color: #517BB6; border-bottom-left-radius: 100%; z-index: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; position: relative; z-index: 2; }
          .logo { color: var(--azul-utc); line-height: 1; }
          .logo h1 { font-size: 42px; font-weight: 900; letter-spacing: -2px; margin-bottom: 2px; text-transform: lowercase; }
          .logo p { font-size: 10px; font-weight: bold; }
          .header-title { flex-grow: 1; text-align: center; margin-left: 20px; }
          .pill-title { background-color: var(--azul-utc); color: #ffffff; font-size: 28px; font-weight: bold; padding: 6px 40px; border-radius: 30px; display: inline-block; margin-bottom: 5px; }
          .address { color: var(--azul-utc); font-size: 9px; font-weight: bold; }
          .datos-wrapper { position: relative; margin-bottom: 12px; margin-top: 15px; }
          .tab-horizontal { position: absolute; top: -12px; left: 15px; background-color: var(--azul-utc); color: white; font-size: 12px; font-weight: bold; padding: 4px 20px; border-radius: 15px; z-index: 2; }
          .datos-box { border: var(--borde-grueso); border-radius: 10px; padding: 18px 15px 8px 15px; display: flex; justify-content: space-between; gap: 15px; }
          .input-group { display: flex; align-items: flex-end; color: var(--azul-utc); font-size: 10px; font-weight: bold; width: 100%; }
          .input-group span { white-space: nowrap; margin-right: 5px; }
          .datos-box .input-group input[type="text"] { border: none !important; border-bottom: 1px solid var(--azul-utc) !important; flex-grow: 1; font-family: inherit; font-size: 11px; background: transparent; outline: none; color: #000; text-align: left; }
          .section-row { display: flex; margin-bottom: 10px; align-items: stretch; position: relative; }
          .tab-vertical { background-color: var(--azul-utc); color: white; width: 25px; border-radius: 25px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; align-self: center; height: auto; min-height: 60px; padding: 10px 0; }
          .tab-vertical span { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; }
          .table-wrap { flex-grow: 1; border: var(--borde-grueso); border-radius: 0 8px 8px 0; overflow: hidden; background-color: white; }
          .page table, .page2 table, .page3 table, .page4 table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .page th, .page td { border: var(--borde-fino); padding: 0; vertical-align: middle; height: 100%; }
          .page tr:first-child th, .page tr:first-child td { border-top: none; }
          .page tr:last-child td { border-bottom: none; }
          .page tr td:first-child, .page tr th:first-child { border-left: none; }
          .page tr td:last-child, .page tr th:last-child { border-right: none; }
          .th-fecha { color: var(--azul-utc); font-size: 11px; font-weight: bold; text-align: center; padding: 4px; }
          .td-label { color: var(--azul-utc); font-size: 8px; font-weight: bold; text-align: left; padding: 3px 6px; line-height: 1.2; }
          .td-label.psi-label { font-size: 6.5px; padding: 5px 8px; line-height: 1.35; }
          .hoja-evolutiva-wrapper input[type="text"], .hoja-evolutiva-wrapper input[type="number"], .hoja-evolutiva-wrapper textarea { width: 100%; height: 100%; min-height: 12px; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 8px; color: #000; text-align: center; outline: none; resize: none; padding: 2px; box-sizing: border-box; display: block; }
          .hoja-evolutiva-wrapper textarea { text-align: left; min-height: 20px; padding: 3px; }
          .hoja-evolutiva-wrapper input:focus, .hoja-evolutiva-wrapper textarea:focus { background-color: var(--azul-claro) !important; }
          /* Fecha por columna — cada columna es una consulta distinta, la fecha
             completa se escribe de arriba hacia abajo, un carácter por línea,
             con cada carácter en posición vertical normal (no rotado de lado). */
          .hoja-evolutiva-wrapper .fecha-vertical { writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 1px; text-align: start; margin: 0 auto; height: auto !important; width: auto !important; min-height: 0 !important; max-height: 100%; }
          .page-content { flex-grow: 1; }
          .footer { margin-top: auto; display: flex; justify-content: space-between; font-size: 7px; color: var(--azul-utc); font-weight: bold; padding-top: 5px; }

          /* ==========================================================
             ESTILOS - PÁGINA 2
             ========================================================== */
          .page2 { zoom: var(--screen-scale, 1); width: 215.9mm; min-height: 279.4mm; background-color: #ffffff; padding: 30px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border-radius: 4px; display: flex; flex-direction: column; margin-bottom: 20px;}
          .page2 .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 280px; font-weight: 900; color: rgba(155, 179, 214, 0.12); z-index: 0; pointer-events: none; letter-spacing: -10px; font-family: 'Arial Black', Impact, sans-serif; }
          .page2 .content { position: relative; z-index: 1; flex-grow: 1; }
          .page2 .section { position: relative; margin-left: 28px; margin-bottom: 25px; }
          .page2 .v-tab { position: absolute; left: -28px; top: 20px; width: 28px; height: auto; min-height: 60px; padding: 10px 0; background-color: #2b5696; color: white; border-radius: 28px; display: flex; align-items: center; justify-content: center; }
          .page2 .v-tab span { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; font-weight: bold; letter-spacing: 0.5px; white-space: nowrap; }
          .page3 .section { position: relative; margin-left: 28px; margin-bottom: 15px; }
          .page3 .v-tab { position: absolute; left: -28px; top: 20px; width: 28px; height: auto; min-height: 60px; padding: 10px 0; background-color: #2b5696; color: white; border-radius: 28px; display: flex; align-items: center; justify-content: center; }
          .page3 .v-tab span { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; font-weight: bold; letter-spacing: 0.5px; white-space: nowrap; }
          .page2 .table-wrap { border: 2px solid #2b5696; border-radius: 8px; background-color: transparent; position: relative; }
          .page2 .table-mask { border-radius: 6px; overflow: hidden; }
          .page2 td { border: 1px solid #9bb3d6; height: 14px; padding: 1px 8px; font-size: 11px; vertical-align: middle; color: #2b5696; }
          .page2 tr:first-child td { border-top: none; }
          .page2 tr:last-child td { border-bottom: none; }
          .page2 tr td:first-child { border-left: none; width: 28%; }
          .page2 tr td:last-child { border-right: none; }
          .page2 .empty-cell { width: 12%; text-align: center; color: #5a81b8; font-size: 10.5px;} 
          .page2 .text-right { text-align: right; }
          .page2 .bold { font-weight: bold; }
          .page2 .t2-row td:first-child { font-size: 9px; line-height: 1.1; padding: 4px 6px; word-wrap: break-word;}
          .page-num { font-size: 18px; font-weight: bold; color: #2b5696; margin-right: 15px;}
          .footer-text { font-weight: bold; letter-spacing: 0.2px; text-align: right; flex-grow: 1;}
          .page2 .text-input:focus { outline: none; background-color: rgba(43, 86, 150, 0.1) !important; }
          .page2 .days-input { width: 12px; border: none !important; background: transparent !important; color: inherit; font-family: inherit; font-size: inherit; text-align: right; padding: 0; outline: none; }
          .page2 .days-input:focus { background-color: rgba(43, 86, 150, 0.1) !important; }

          /* ==========================================================
             ESTILOS - PÁGINA 3
             ========================================================== */
          .page3 { zoom: var(--screen-scale, 1); width: 215.9mm; min-height: 279.4mm; background-color: #ffffff; padding: 30px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border-radius: 4px; margin-bottom: 20px; display: flex; flex-direction: column;}
          .page3 .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 280px; font-weight: 900; color: rgba(155, 179, 214, 0.12); z-index: 0; pointer-events: none; font-family: 'Arial Black', Impact, sans-serif; }
          .page3 td, .page3 th { border: 1px solid #9bb3d6; height: 18px; padding: 1px 8px; font-size: 11px; color: #2b5696; }
          .page3 .section-header td { font-weight: bold; background-color: #f8f9fa; }
          .page3 .t2-header { background-color: #2b5696; color: white; font-weight: bold; text-align: center; font-size: 9px; }
          .page3 .t2-first-cell { font-weight: bold; border-right: 2px solid #2b5696; width: 32%; }

         /* ==========================================================
             ESTILOS - PÁGINA 4 (Diseño Flexbox pag4.html)
             ========================================================== */
          .page4 {
              zoom: var(--screen-scale, 1);
              width: 215.9mm;
              height: 279.4mm; /* Altura fija estricta para A4 */
              background-color: #ffffff;
              padding: 12mm;
              margin-bottom: 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              position: relative;
              display: flex;
              flex-direction: column;
              overflow: hidden;
          }
          .page4::before {
              content: "utc";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 350px;
              font-weight: 900;
              color: rgba(38, 84, 154, 0.04);
              z-index: 0;
              pointer-events: none;
              letter-spacing: -25px;
          }
          .page4 .page-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 12px;
              z-index: 1;
          }
          .page4 .table-rounded {
              border: var(--borde-grueso);
              border-radius: 8px;
              overflow: hidden;
              background: white;
              display: flex;
              flex-direction: column;
          }
          .page4 .section-row {
              display: flex;
              align-items: stretch;
              background: white;
          }
          .page4 .tab-vertical {
              background-color: var(--azul-utc);
              color: white;
              width: 28px;
              border-radius: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              align-self: center;
              height: auto;
              min-height: 60px;
              padding: 10px 0;
          }
          .page4 .tab-vertical span {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              font-weight: bold;
              font-size: 12px;
              letter-spacing: 0.5px;
          }
          .page4 .table-main {
              flex: 1;
              border: var(--borde-grueso);
              border-radius: 0 8px 8px 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
          }
          .page4 table {
              width: 100%;
              height: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              flex: 1;
          }
          .page4 th, .page4 td {
              border: var(--borde-fino);
              padding: 1px;
              vertical-align: middle;
          }
          .page4 tr:first-child th, .page4 tr:first-child td { border-top: none; }
          .page4 tr:last-child td { border-bottom: none; }
          .page4 tr td:first-child, .page4 tr th:first-child { border-left: none; }
          .page4 tr td:last-child, .page4 tr th:last-child { border-right: none; }
          
          .page4 .header-azul {
              background-color: var(--azul-utc) !important;
              color: white !important;
              font-size: 11px;
              font-weight: bold;
              text-align: center;
              padding: 4px;
              border: 1px solid white !important;
          }
          .page4 .header-azul-borderless {
              background-color: var(--azul-utc) !important;
              color: white !important;
              font-size: 11px;
              font-weight: bold;
              text-align: center;
              padding: 4px;
              border-right: none !important;
          }
          .page4 .th-fecha {
              color: var(--azul-utc);
              font-size: 11px;
              font-weight: bold;
          }
          .page4 .td-label {
              color: var(--azul-utc);
              font-size: 10px;
              font-weight: normal;
              text-align: left;
              padding-left: 8px;
          }
          .page4 input, .page4 textarea {
              width: 100%;
              height: 100%;
              border: none !important;
              background-color: transparent !important;
              font-family: inherit;
              font-size: 8px;
              color: #000;
              text-align: center;
              outline: none;
              resize: none;
              padding: 1px;
              display: block;
              line-height: 1.15;
          }
          .page4 textarea { text-align: left; padding: 2px; }
          .page4 input:focus, .page4 textarea:focus { background-color: var(--azul-claro) !important; }
          
          .page4 .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 10px;
              z-index: 1;
          }
          .page4 .footer-left { font-size: 16px; font-weight: bold; color: var(--azul-utc); }
          .page4 .footer-right { font-size: 7px; color: var(--azul-utc); font-weight: bold; text-align: right; line-height: 1.2; }
          
          /* Alturas Flexibles Proporcionales */
          .page4 .tabla-t1 { flex: 0 0 26%; }
          .page4 .tabla-t2 { flex: 0 0 18%; }
          .page4 .tabla-t3 { flex: 1; }
          .page4 .tabla-t4 { flex: 0 0 19%; }
          .page4 .tabla-t1 input, .page4 .tabla-t1 textarea,
          .page4 .tabla-t4 input, .page4 .tabla-t4 textarea {
              font-size: 8px;
              padding: 0px;
              line-height: 1.05;
          }
          .page4 .tabla-t1 textarea, .page4 .tabla-t4 textarea { padding: 1px; }
          .page4 .tabla-t1 thead tr, .page4 .tabla-t4 thead tr { height: 18px !important; }


            /* ==========================================================
             ESTILOS - PÁGINA 5
             ========================================================== */
          .page5 {
              zoom: var(--screen-scale, 1);
              width: 215.9mm;
              height: 279.4mm;
              background-color: #ffffff;
              padding: 12mm;
              margin-bottom: 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              position: relative;
              display: flex;
              flex-direction: column;
              overflow: hidden;
          }
          .page5::before {
              content: "utc";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 350px;
              font-weight: 900;
              color: rgba(38, 84, 154, 0.04);
              z-index: 0;
              pointer-events: none;
              letter-spacing: -25px;
          }
          .page5 .page-content { flex: 1; display: flex; flex-direction: column; gap: 18px; z-index: 1; }
          .page5 .section-row { display: flex; flex: 1; align-items: stretch; }
          .page5 .section-col { display: flex; flex-direction: column; flex: 1.2; position: relative; }
          
          .page5 .tab-vertical { background-color: var(--azul-utc); color: white; width: 28px; border-radius: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: center; height: auto; min-height: 60px; padding: 10px 0; }
          .page5 .tab-vertical span { writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 12px; letter-spacing: 0.5px; }
          .page5 .tab-horizontal { position: absolute; top: -13px; left: 15px; background-color: var(--azul-utc); color: white; font-size: 13px; font-weight: bold; padding: 4px 20px; border-radius: 12px 12px 0 0; z-index: 2; border: var(--borde-grueso); border-bottom: none; }
          
          .page5 .table-main { flex: 1; border: var(--borde-grueso); border-radius: 0 8px 8px 0; overflow: hidden; display: flex; flex-direction: column; }
          .page5 .table-rounded { flex: 1; border: var(--borde-grueso); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; margin-top: 10px; }
          .page5 table { width: 100%; border-collapse: collapse; table-layout: fixed; flex: 1; display: table; height: 100%; }
          .page5 th, .page5 td { border: var(--borde-fino); padding: 2px; vertical-align: middle; text-align: center; }
          
          .page5 tr:first-child th, .page5 tr:first-child td { border-top: none; }
          .page5 tr:last-child td { border-bottom: none; }
          .page5 tr td:first-child, .page5 tr th:first-child { border-left: none; }
          .page5 tr td:last-child, .page5 tr th:last-child { border-right: none; }
          
          .page5 .header-vacio { border-top: none !important; border-left: none !important; background-color: transparent !important; }
          .page5 .header-azul { background-color: var(--azul-utc) !important; color: white !important; font-size: 10px; font-weight: bold; border: 1px solid white !important; }
          .page5 .th-fecha { color: var(--azul-utc); font-size: 11px; font-weight: bold; }
          .page5 .td-label { color: var(--azul-utc); font-size: 9.5px; font-weight: normal; text-align: left; padding-left: 8px; }
          .page5 .estado-label { color: var(--azul-utc); font-size: 10.5px; text-align: left; padding-left: 6px; }
          
          .page5 input, .page5 textarea { width: 100%; height: 100%; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 8px; color: #000; text-align: center; outline: none; resize: none; padding: 2px; display: block; }
          .page5 textarea { text-align: left; padding: 4px; }
          .page5 input:focus, .page5 textarea:focus { background-color: var(--azul-claro) !important; }
          .page5 input[type="checkbox"] { width: 12px; height: 12px; max-width: 12px; max-height: 12px; margin: 0 auto; appearance: none; border: 1px solid var(--azul-utc) !important; cursor: default; }
          .page5 input[type="checkbox"]:checked { background-color: var(--azul-utc) !important; }
          
          .page5 .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; z-index: 1; }
          .page5 .footer-left { font-size: 7px; color: var(--azul-utc); font-weight: bold; line-height: 1.2; text-align: left; }
          .page5 .footer-right { font-size: 16px; font-weight: bold; color: var(--azul-utc); }
          
          .page5 .t1-col1 { width: 10%; } .page5 .t1-cols { width: 15%; }
          .page5 .t2-col1 { width: 54%; } .page5 .t2-col2 { width: 10%; } .page5 .t2-cols { width: 6%; }
          .page5 thead .t2-cols { padding: 0 !important; }
          .page5 .t2-cols input.fecha-vertical { height: 64.5px !important; }


            /* ==========================================================
             ESTILOS - PÁGINA 6
             ========================================================== */
          .page6 {
              zoom: var(--screen-scale, 1);
              width: 215.9mm;
              height: 279.4mm;
              background-color: #ffffff;
              padding: 12mm;
              margin-bottom: 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
              position: relative;
              display: flex;
              flex-direction: column;
              overflow: hidden;
          }
          .page6::before {
              content: "utc";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 350px;
              font-weight: 900;
              color: rgba(38, 84, 154, 0.04);
              z-index: 0;
              pointer-events: none;
              letter-spacing: -25px;
          }
          .page6 .page-content { flex: 1; display: flex; flex-direction: column; gap: 11px; z-index: 1; }
          .page6 .section-row { display: flex; align-items: stretch; position: relative; background: white; }
          .page6 .section-col { display: flex; flex-direction: column; position: relative; }
          
          .page6 .tab-vertical { background-color: var(--azul-utc); color: white; width: 28px; border-radius: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: center; height: auto; min-height: 60px; padding: 10px 0; }
          .page6 .tab-vertical span { writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 12px; letter-spacing: 0.5px; }
          .page6 .tab-horizontal { position: absolute; top: -14px; left: 15px; background-color: var(--azul-utc); color: white; font-size: 12px; font-weight: bold; padding: 4px 20px; border-radius: 12px 12px 0 0; z-index: 2; border: var(--borde-grueso); border-bottom: none; }
          
          .page6 .table-wrap { flex: 1; border: var(--borde-grueso); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
          .page6 table { width: 100%; border-collapse: collapse; table-layout: fixed; flex: 1; display: table; height: 100%; }
          .page6 th, .page6 td { border: var(--borde-fino); padding: 0; vertical-align: middle; text-align: center; }
          
          .page6 tr:first-child th, .page6 tr:first-child td { border-top: none; }
          .page6 tr:last-child td { border-bottom: none; }
          .page6 tr td:first-child, .page6 tr th:first-child { border-left: none; }
          .page6 tr td:last-child, .page6 tr th:last-child { border-right: none; }
          
          .page6 .header-azul { background-color: var(--azul-utc) !important; color: white !important; font-size: 10px; font-weight: bold; text-align: center; padding: 3px; }
          .page6 .th-fecha { color: var(--azul-utc); font-size: 10px; font-weight: bold; }
          .page6 .td-label { color: var(--azul-utc); font-size: 9px; font-weight: normal; text-align: left; padding-left: 8px; word-break: break-word; }
          .page6 .subtitulo-p6 { font-size: 10px; font-weight: bold; color: var(--azul-utc); padding-left: 8px !important; background-color: transparent !important; text-align: left; }
          
          .page6 .cell-flex-col { display: flex; flex-direction: column; height: 100%; width: 100%; }
          .page6 .cell-half { flex: 1; display: flex; flex-direction: column; border-bottom: var(--borde-fino); }
          .page6 .cell-half:last-child { border-bottom: none; }
          .page6 .cell-half textarea { flex: 1; }
          .page6 .text-mini { font-size: 8px; color: var(--azul-utc); text-align: left; padding: 2px 4px 0 4px; flex-shrink: 0; }
          .page6 .estado-label { color: var(--azul-utc); font-size: 10px; text-align: left; padding-left: 6px; }
          
          .page6 input, .page6 textarea { width: 100%; height: 100%; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 8px; color: #000; text-align: center; outline: none; resize: none; padding: 0px; display: block; line-height: 1.1; }
          .page6 textarea { text-align: left; padding: 1px 3px; min-height: 0 !important; }
          .page6 input:focus, .page6 textarea:focus { background-color: var(--azul-claro) !important; }
          .page6 input[type="checkbox"] { width: 12px; height: 12px; max-width: 12px; max-height: 12px; margin: 0 auto; appearance: none; border: 1px solid var(--azul-utc) !important; cursor: default; }
          .page6 input[type="checkbox"]:checked { background-color: var(--azul-utc) !important; }
          .page6 .fecha-alta input { font-size: 4.8px !important; padding: 1px 0 !important; letter-spacing: -0.3px; height: 64.5px !important; }
          
          .page6 .footer { display: flex; justify-content: flex-end; align-items: center; margin-top: 10px; z-index: 1; }
          .page6 .footer-num { font-size: 16px; font-weight: bold; color: var(--azul-utc); }
          
          .page6 .flex-t1 { flex: 0 0 auto; }
          .page6 .flex-t2 { flex: 0 0 auto; }
          .page6 .flex-t3 { flex: 1; }



          /* ==========================================================
             REGLAS DE IMPRESIÓN
             ========================================================== */
        @page { size: 215.9mm 279.4mm; margin: 0; }
        @media print {
              .hoja-evolutiva-wrapper { background: none; padding: 0; }
              .hoja-evolutiva-wrapper .page,
              .hoja-evolutiva-wrapper .page2,
              .hoja-evolutiva-wrapper .page3,
              .hoja-evolutiva-wrapper .page4,
              .hoja-evolutiva-wrapper .page5 {
                  page-break-after: always;
              }
              .hoja-evolutiva-wrapper .page,
              .hoja-evolutiva-wrapper .page2,
              .hoja-evolutiva-wrapper .page3,
              .hoja-evolutiva-wrapper .page4,
              .hoja-evolutiva-wrapper .page5,
              .hoja-evolutiva-wrapper .page6 {
                  box-shadow: none; margin: 0 auto; min-height: 279.4mm; width: var(--print-width, 215.9mm);
                  /* Escala calculada en tiempo real (ver useEffect de escala de
                     impresión, más abajo en este componente) — NUNCA un valor
                     fijo. Si la hoja cabe al 100%, --print-scale vale 1 y no
                     pasa nada; solo se reduce si el contenido real excede el
                     alto físico de la hoja. */
                  zoom: var(--print-scale, 1) !important;
              }
              input:focus, textarea:focus { background-color: transparent !important; }
              .header-azul, .page3 .t2-header, .page4 .tab-vertical { background-color: #2b5a9e !important; color: white !important; }
              /* Forzar TODOS los colores/fondos a imprimirse — antes solo estaba
                 puesto en 3 selectores, así que el resto (píldoras, encabezados
                 de página 2/5/6, marcas de agua) se veía sin color si el usuario
                 no activaba manualmente "Gráficos de fondo" en el diálogo. */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      {/* ========================================================================= */}
      {/* PÁGINA 1 */}
      {/* ========================================================================= */}
      <div className="page">
        <div className="wave-bg"></div>
        <div className="wave-bg-light"></div>
        
        <div className="header">
          <div className="logo">
            <img src={logoUtc} alt="Universidad Tres Culturas" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="header-title">
            <div className="pill-title">Seguimiento Nutricional</div><br/>
            <span className="address">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</span>
          </div>
        </div>

        <div className="page-content">
          <div className="datos-wrapper" style={{ marginTop: 0 }}>
            <div className="tab-horizontal">Datos personales</div>
            <div className="datos-box">
              <div className="input-group" style={{ flex: 2 }}>
                <span>Nombre completo</span>
                <input type="text" name="paciente_nombre" value={(formData.paciente_nombre as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <span>Expediente</span>
                <input type="text" value={formatExpediente(typeof formData.paciente_id === 'string' ? formData.paciente_id : undefined)} readOnly tabIndex={-1} />
              </div>
            </div>
          </div>

          {/* A. Psicológicos */}
          <div className="section-row">
            <div className="tab-vertical"><span>A. Psicologicos</span></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ width: '14%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={{ width: '14.33%' }}>
                        <input type="text" name={`psi_fecha_${i}`} value={(formData[`psi_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "¿Cómo te sentiste emocionalmente al iniciar el plan de alimentación que te propusimos?",
                    "Durante la aplicación del plan, ¿experimentaste motivación, frustración o alguna otra emoción predominante?",
                    "¿Qué tanto sentiste que el plan se adaptaba a tu estilo de vida y te generaba tranquilidad o estrés?",
                    "¿Hubo momentos en los que te sentiste orgulloso(a) o satisfecho(a) por seguir el plan?",
                    "¿De qué manera el plan de alimentación influyó en tu estado de ánimo o en tu percepción personal durante estos días?"
                  ].map((pregunta, idx) => (
                    <tr key={idx}>
                      <td className="td-label psi-label" style={{ height: '56px' }}>{pregunta}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col} style={{ height: '56px' }}><textarea name={`psi_q${idx}_col${col}`} value={(formData[`psi_q${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} style={{ height: '56px' }}></textarea></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sintomatología */}
          <div className="section-row">
            <div className="tab-vertical"><span>Sintomatología</span></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ width: '14%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={{ width: '14.33%' }}>
                        <input type="text" name={`sint_fecha_${i}`} value={(formData[`sint_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Gastritis", "Colitis", "Reflujo gastroesofágico", "Diarrea", "Estreñimiento", "Vómito", "Náuseas", "Disfagia", "Hiperfagia", "Flatulencias", "Distensión abdominal", "Hiporexia", "Escala de Bristol"].map((sintoma, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{sintoma}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col}><input type="text" name={`sint_${idx}_col${col}`} value={(formData[`sint_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ejercicio */}
          <div className="section-row">
            <div className="tab-vertical"><span>Ejercicio</span></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ width: '14%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={{ width: '14.33%' }}>
                        <input type="text" name={`ejer_fecha_${i}`} value={(formData[`ejer_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Si/No", "Anaerobico/Aeróbico", "¿Cual?", "Frecuencia", "Intensidad", "Tiempo", "Volumen", "Progresion"].map((param, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{param}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col}><input type="text" name={`ejer_${idx}_col${col}`} value={(formData[`ejer_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* A. Dietéticos */}
          <div className="section-row">
            <div className="tab-vertical"><span>A. Dietéticos</span></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ width: '14%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={{ width: '14.33%' }}>
                        <input type="text" name={`diet_fecha_${i}`} value={(formData[`diet_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Comidas al día", "Dieta especial", "Uso de laxantes", "Medicamentos ↓ peso"].map((param, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{param}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col}><input type="text" name={`diet_${idx}_col${col}`} value={(formData[`diet_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="footer" style={{ marginTop: '5px' }}>
          <div className="page-num">1</div>
          <div className="footer-text" style={{ fontSize: '8px' }}>ESA: Explorado y sin alteraciones, N/A: No Aplica; PN: Preguntado y negado; ✓: Adecuado.</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 2 */}
      {/* ========================================================================= */}
      <div className="page2">
        <div className="content">
          
          {/* Frecuencia de consumo */}
          <div className="section" style={{ marginBottom: '15px' }}>
            <div className="v-tab" style={{ top: '22px', bottom: 0 }}>
              <span>Frecuencia de consumo</span>
            </div>
            <div className="table-wrap">
              <div className="table-mask">
                <table>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td className="text-right bold" style={{ width: '25%', padding: '4px', fontSize: '11px' }}>Fecha</td>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <td key={i} className="empty-cell" style={{ padding: '2px' }}>
                          <input type="text" name={`freq_fecha_${i}`} value={(formData[`freq_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alimentos.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '1px 4px', fontSize: '9px' }}>{item}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => (
                          <td key={col} className="empty-cell" style={{ padding: '1px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1px', fontSize: '9px', whiteSpace: 'nowrap' }}>
                              <input type="text" className="days-input" name={`freq_${idx}_col${col}`} value={(formData[`freq_${idx}_col${col}`] as string) || ''} onChange={handleDaysInput} readOnly tabIndex={-1} maxLength={1} style={{ width: '8px', flexShrink: 0 }} />
                              <span style={{ color: '#999', fontSize: '6px' }}>/7 días</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Análisis cualitativo */}
          <div className="section" style={{ marginBottom: '15px' }}>
            <div className="v-tab" style={{ top: '22px', bottom: 0 }}>
              <span>Análisis cualitativo</span>
            </div>
            <div className="table-wrap">
              <div className="table-mask">
                <table>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <td className="text-right bold" style={{ width: '25%', padding: '4px', fontSize: '11px' }}>Fecha</td>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <td key={i} className="empty-cell" style={{ padding: '2px' }}>
                          <input type="text" name={`cual_fecha_${i}`} value={(formData[`cual_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { q: "¿Incluye todos los nutrimentos esenciales?", r: "→ Completa" },
                      { q: "¿Los nutrimentos están en proporciones adecuadas?", r: "→ Equilibrada" },
                      { q: "¿Los alimentos están libres de patógenos?", r: "→ Inocua" },
                      { q: "¿No se consumen en cantidades excesivas?", r: "→ Equilibrada" },
                      { q: "¿Cubre los requerimientos según edad/sexo?", r: "→ Suficiente" }
                    ].map((item, idx) => (
                      <tr key={idx} className="t2-row">
                        <td>{item.q}<br/><b>{item.r}</b></td>
                        {[1, 2, 3, 4, 5, 6].map(col => (
                          <td key={col}><input type="text" name={`cual_${idx}_col${col}`} value={(formData[`cual_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="footer" style={{ marginTop: '5px' }}>
            <div className="page-num">2</div>
            <div className="footer-text" style={{ fontSize: '8px' }}>ESA: Explorado sin alteraciones; N/A: No Aplica; PN: Preguntado negado; ✓: Adecuado.</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 3 */}
      {/* ========================================================================= */}
      <div className="page3">
        <div className="watermark">UTC</div>
        <div className="content">
          <div className="section">
            <div className="v-tab" style={{ top: '25px' }}>
              <span>Parámetros dietéticos</span>
            </div>
            <div className="table-wrap">
              <div className="table-mask">
                <table>
                  <thead>
                    <tr>
                      <th className="th-fecha" style={{ width: '20%', border: '1px solid #9bb3d6', height: '20px', fontSize: '11px', padding: '3px 8px', color: '#2b5696' }}>Fecha</th>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <th key={i} style={{ width: '13%', padding: 0 }}>
                          <input type="text" name={`p3_fecha_${i}`} value={(formData[`p3_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="section-header"><td colSpan={7}>Equivalentes (rac)</td></tr>
                    {["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"].map((row, idx) => (
                      <tr key={`eq_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`eq_${idx}_col${col}`} value={(formData[`eq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                      </tr>
                    ))}

                    <tr className="section-header"><td colSpan={7}>Contenido Nutrimental</td></tr>
                    {["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"].map((row, idx) => (
                      <tr key={`cn_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`cn_${idx}_col${col}`} value={(formData[`cn_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                      </tr>
                    ))}

                    <tr className="section-header"><td colSpan={7}>Interpretación de la ingestión actual (Dieta)</td></tr>
                    {["Energía", "Proteína", "HCO", "Lípidos"].map((row, idx) => (
                      <tr key={`int_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`int_${idx}_col${col}`} value={(formData[`int_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="v-tab" style={{ top: '25px' }}>
              <span>Antropometría</span>
            </div>
            <div className="table-wrap">
              <div className="table-mask">
                <table>
                  <thead>
                    <tr>
                      <td className="t2-first-cell">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', gap: '6px' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>Talla: <input type="text" name="antro_talla" value={(formData.antro_talla as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} style={{ width: '30px', display: 'inline-block', borderBottom: '1px solid #2b5696' }} /> m</span>
                          <span>fecha</span>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map(i => <td key={i} className="t2-header">vo (✓ ↑ ↓)</td>)}
                    </tr>
                    <tr>
                      <th className="th-fecha" style={{ width: '20%', border: '1px solid #9bb3d6' }}></th>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <th key={i} style={{ padding: 0 }}>
                          <input type="text" name={`antro_fecha_${i}`} value={(formData[`antro_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} maxLength={10} placeholder="DD/MM/AAAA" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { l: "Peso (kg)" }, { l: "IMC (kg/m²)", isHtml: true, h: "IMC (kg/m<sup>2</sup>)" }, { l: "Peso ideal/PAO (kg)" }, 
                      { l: "Circ. Muñeca (cm)" }, { l: "Circ. Brazo (cm)" }, { l: "Circ. Abdominal (cm)" }, 
                      { l: "Circ. Cintura (cm)" }, { l: "Circ. Cadera (cm)" }, { l: "ICC" }, 
                      { l: "PCB (mm)" }, { l: "PCT (mm)" }, { l: "PCSe (mm)" }, { l: "PCSi (mm)" }, 
                      { l: "% Grasa, Siri (%/kg)" }, { l: "% Grasa, InBody (%/kg)" }, 
                      { l: "IMG, con InBody (kgMG/m²)", isHtml: true, h: "IMG, con InBody (kgMG/m<sup>2</sup>)" }, 
                      { l: "MLG (kg)" }, { l: "IMLG, con (kgMLG/m²)", isHtml: true, h: "IMLG, con (kgMLG/m<sup>2</sup>)" }, 
                      { l: "cAMB (cm²)", isHtml: true, h: "cAMB (cm<sup>2</sup>)" }, { l: "MMT, InBody (%/kg)" }, 
                      { l: "IMEA, con InBody (kgMM/m²)", isHtml: true, h: "IMEA, con InBody (kgMM/m<sup>2</sup>)" }, 
                      { l: "ACT (L)" }, { l: "Grasa visceral (L)" }
                    ].map((row, idx) => (
  <tr key={idx}>
    {/* AQUÍ ESTÁ EL CAMBIO */}
    {row.isHtml ? (
      <td dangerouslySetInnerHTML={{ __html: row.h! }} />
    ) : (
      <td>{row.l}</td>
    )}
    {/* FIN DEL CAMBIO */}
    {[1, 2, 3, 4, 5, 6].map(col => (
      <td key={col}>
        <input type="number" step="any" name={`antro_${idx}_col${col}`} value={(formData[`antro_${idx}_col${col}`] as string) || ''} onChange={handleNumberInput} readOnly tabIndex={-1} />
      </td>
    ))}
  </tr>
))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="footer" style={{ marginTop: '5px' }}>
            <div className="page-num">3</div>
            <div className="footer-text" style={{ fontSize: '8px' }}>ESA: Explorado sin alteraciones; N/A: No Aplica; PN: Preguntado negado; ✓: Adecuado.</div>
          </div>
        </div>
      </div>

{/* ========================================================================= */}
      {/* PÁGINA 4 */}
      {/* ========================================================================= */}
      <div className="page4">
        <div className="page-content">
          
          {/* TABLA 1: Diagnóstico */}
          <div className="table-rounded tabla-t1">
            <table>
              <thead>
                <tr style={{ height: '25px' }}>
                  <th className="header-azul" style={{ width: '7%' }}>Fecha</th>
                  <th className="header-azul" style={{ width: '25%' }}>Diagnóstico Matriz IMG/IMLG</th>
                  <th className="header-azul" style={{ width: '68%', borderRight: 'none !important' }}>Interpretación antropométrica</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map(row => (
                  <tr key={row}>
                    <td><input type="text" name={`diag_fecha_${row}`} value={(formData[`diag_fecha_${row}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} /></td>
                    <td><textarea name={`diag_matriz_${row}`} value={(formData[`diag_matriz_${row}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></td>
                    <td><textarea name={`diag_interp_${row}`} value={(formData[`diag_interp_${row}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLA 2: Signos Vitales */}
          <div className="section-row tabla-t2">
            <div className="tab-vertical"><span>Signos Vitales</span></div>
            <div className="table-main">
              <table>
                <thead>
                  <tr style={{ height: '18px' }}>
                    <th style={{ width: '14%', borderRight: 'none' }}></th>
                    {[1, 2, 3, 4, 5].map(i => <th key={i} className="header-azul" style={{ width: '14.33%' }}>vo (✓ ↑ ↓)</th>)}
                    <th className="header-azul-borderless" style={{ width: '14.33%' }}>vo (✓ ↑ ↓)</th>
                  </tr>
                  <tr style={{ height: '18px' }}>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={i === 6 ? { borderRight: 'none' } : {}}>
                        <input type="text" name={`sig_fecha_${i}`} value={(formData[`sig_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Tensión arterial (mmHg)", "Frecuencia respiratoria (rpm)", "Frecuencia cardiaca (lpm)", "Temperatura (°C)", "SO₂"].map((sig, idx) => (
                    <tr key={idx} style={{ height: '27px' }}>
                      <td className="td-label">{sig}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col} style={col === 6 ? { borderRight: 'none' } : {}}>
                          <input type="text" name={`sig_${idx}_col${col}`} value={(formData[`sig_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 3: P. Bioquímicos */}
          <div className="section-row tabla-t3">
            <div className="tab-vertical"><span>P. Bioquímicos</span></div>
            <div className="table-main">
              <table>
                <thead>
                  <tr style={{ height: '18px' }}>
                    <th style={{ width: '35%', borderRight: 'none' }}></th>
                    {[1, 2, 3, 4, 5].map(i => <th key={i} className="header-azul" style={{ width: '10.8%' }}>vo (✓ ↑ ↓)</th>)}
                    <th className="header-azul-borderless" style={{ width: '10.8%' }}>vo (✓ ↑ ↓)</th>
                  </tr>
                  <tr style={{ height: '18px' }}>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={i === 6 ? { borderRight: 'none' } : {}}>
                        <input type="text" name={`bioq_fecha_${i}`} value={(formData[`bioq_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, idx) => (
                    <tr key={idx}>
                      <td><input type="text" name={`bioq_param_${idx}`} value={(formData[`bioq_param_${idx}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col} style={col === 6 ? { borderRight: 'none' } : {}}>
                          <input type="text" name={`bioq_${idx}_col${col}`} value={(formData[`bioq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 4: Interpretación bioquímica */}
          <div className="table-rounded tabla-t4">
            <table>
              <thead>
                <tr style={{ height: '25px' }}>
                  <th className="header-azul" style={{ width: '12%' }}>Fecha</th>
                  <th className="header-azul" style={{ width: '88%', borderRight: 'none !important' }}>Interpretación bioquímica</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map(row => (
                  <tr key={row}>
                    <td><input type="text" name={`int_bioq_fecha_${row}`} value={(formData[`int_bioq_fecha_${row}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} /></td>
                    <td><textarea name={`int_bioq_desc_${row}`} value={(formData[`int_bioq_desc_${row}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
        
        <div className="footer">
          <div className="footer-left">4</div>
          <div className="footer-right">
            ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado;<br/>
            VO: Valor Obtenido; ✓: Adecuado; ↑: Valor en exceso; ↓: Valor disminuido.
          </div>
        </div>
      </div> {/* <-- Este cierra el div de "page4" */}
      


        {/* ========================================================================= */}
      {/* PÁGINA 5 */}
      {/* ========================================================================= */}
      <div className="page5">
        <div className="page-content">
          
          {/* TABLA 1: Exploración física */}
          <div className="section-row">
            <div className="tab-vertical"><span>Exploración física</span></div>
            <div className="table-main">
              <table>
                <thead>
                  <tr>
                    <th className="header-vacio t1-col1"></th>
                    {[1, 2, 3, 4, 5].map(i => <th key={i} className="header-azul t1-cols">Hallazgo (Def/Ex)</th>)}
                    <th className="header-azul t1-cols" style={{ borderRight: 'none !important' }}>Hallazgo (Def/Ex)</th>
                  </tr>
                  <tr>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px', borderLeft: 'none !important' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={i === 6 ? { borderRight: 'none !important' } : {}}>
                        <input type="text" name={`explor_fecha_${i}`} value={(formData[`explor_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Hallazgos generales", "Adiposidad", "Huesos", "Sistema CV-respiratorio", 
                    "Sistema digestivo", "Edema", "Extremidades", "Ojos", "Pelo", "Cabeza", 
                    "Manos y uñas", "Boca", "Músculos", "Cuello", "Piel", "Dientes", 
                    "Garganta y deglución", "Lengua"
                  ].map((hallazgo, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <tr key={idx}>
                        <td className="td-label" style={isLast ? { borderBottom: 'none !important' } : {}}>{hallazgo}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => (
                          <td key={col} style={{
                            ...(isLast ? { borderBottom: 'none !important' } : {}),
                            ...(col === 6 ? { borderRight: 'none !important' } : {})
                          }}>
                            <input type="text" name={`explor_${idx}_col${col}`} value={(formData[`explor_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: Diagnósticos Nutricios */}
          <div className="section-col">
            <div className="tab-horizontal">Diagnósticos Nutricios</div>
            <div className="table-rounded">
              <table>
              <thead>
                  <tr>
                    <th className="t2-col1" style={{ backgroundColor: 'var(--azul-utc)', borderRight: '1px solid white' }}></th>
                    <th className="th-fecha t2-col2">Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} className="t2-cols" style={i === 6 ? { borderRight: 'none !important' } : {}}>
                        <input
                          type="text"
                          className="fecha-vertical"
                          name={`diag_nutri_fecha_${i}`}
                          value={(formData[`diag_nutri_fecha_${i}`] as string) || ''}
                          onChange={handleDateInput} readOnly tabIndex={-1}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          style={{ fontSize: '4.8px', padding: '1px 0', letterSpacing: '-0.3px' }} /* <-- ESTO LO HACE PEQUEÑO */
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((diagGroup, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <React.Fragment key={diagGroup}>
                        <tr>
                          <td rowSpan={3} style={isLast ? { borderBottom: 'none !important' } : {}}>
                            <textarea name={`diag_nutri_txt_${diagGroup}`} value={(formData[`diag_nutri_txt_${diagGroup}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea>
                          </td>
                          <td className="estado-label">Nuevo</td>
                          {[1, 2, 3, 4, 5, 6].map(col => (
                            <td key={`nuevo_${col}`} style={col === 6 ? { borderRight: 'none !important' } : {}}>
                              <input type="checkbox" name={`diag_nutri_${diagGroup}_nuevo_col${col}`} checked={!!formData[`diag_nutri_${diagGroup}_nuevo_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="estado-label">Continuo</td>
                          {[1, 2, 3, 4, 5, 6].map(col => (
                            <td key={`cont_${col}`} style={col === 6 ? { borderRight: 'none !important' } : {}}>
                              <input type="checkbox" name={`diag_nutri_${diagGroup}_cont_col${col}`} checked={!!formData[`diag_nutri_${diagGroup}_cont_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="estado-label" style={isLast ? { borderBottom: 'none !important' } : {}}>Resuelto</td>
                          {[1, 2, 3, 4, 5, 6].map(col => (
                            <td key={`resuelto_${col}`} style={{
                              ...(isLast ? { borderBottom: 'none !important' } : {}),
                              ...(col === 6 ? { borderRight: 'none !important' } : {})
                            }}>
                              <input type="checkbox" name={`diag_nutri_${diagGroup}_res_col${col}`} checked={!!formData[`diag_nutri_${diagGroup}_res_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} />
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        <div className="footer">
          <div className="footer-left">
            ESA: Explorado y sin alteraciones; N/A: No Aplica; PN: Preguntado y negado;<br/>
            VO: Valor Obtenido; ✓: Adecuado; ↑: Valor en exceso; ↓: Valor disminuido.
          </div>
          <div className="footer-right">5</div>
        </div>
      </div>



        {/* ========================================================================= */}
      {/* PÁGINA 6 */}
      {/* ========================================================================= */}
      <div className="page6">
        <div className="page-content">
          
          {/* SECCIÓN 1: Intervención Nutricia */}
          <div className="section-col flex-t1" style={{ marginTop: '15px' }}>
            <div className="tab-horizontal">Intervención Nutricia</div>
            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  {[1, 2, 3, 4, 5, 6].map(i => <col key={i} style={{ width: '14.33%' }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={i === 6 ? { borderRight: 'none !important' } : {}}>
                        <input type="text" name={`interv_fecha_${i}`} value={(formData[`interv_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} style={{ fontSize: '8px' }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ height: '40px' }}>
                    <td className="td-label" style={{ fontSize: '8.5px' }}>Indicación de<br/>Alimentos/Nutrimentos</td>
                    {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={col === 6 ? { borderRight: 'none !important' } : {}}><textarea name={`interv_ind_col${col}`} value={(formData[`interv_ind_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></td>)}
                  </tr>
                  <tr><td colSpan={7} className="subtitulo-p6">Contenido Nutrimental</td></tr>
                  {["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"].map((macro, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{macro}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={col === 6 ? { borderRight: 'none !important' } : {}}><input type="text" name={`interv_macro_${idx}_col${col}`} value={(formData[`interv_macro_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                    </tr>
                  ))}
                  <tr><td colSpan={7} className="subtitulo-p6">Equivalentes (rac)</td></tr>
                  {["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"].map((eq, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{eq}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={col === 6 ? { borderRight: 'none !important' } : {}}><input type="text" name={`interv_eq_${idx}_col${col}`} value={(formData[`interv_eq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 2: Educación Nutricional y Consejería */}
          <div className="section-row flex-t2">
            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '10%' }} />
                  {[1, 2, 3, 4, 5, 6].map(i => <col key={i} style={{ width: '3.33%' }} />)}
                </colgroup>
                <thead>
                  <tr className="fecha-alta" style={{ height: '64.5px' }}>
                    <th className="header-azul">Educación Nutricional</th>
                    <th className="header-azul">Consejería Nutricional</th>
                    <th className="th-fecha" style={{ backgroundColor: 'white', borderBottom: 'var(--borde-fino)' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={{ backgroundColor: 'white', borderBottom: 'var(--borde-fino)', ...(i === 6 ? { borderRight: 'none !important' } : {}) }}>
                        <input type="text" className="fecha-vertical" name={`edu_fecha_${i}`} value={(formData[`edu_fecha_${i}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((rowBlock, idx, arr) => {
                    const isLastBlock = idx === arr.length - 1;
                    return (
                      <React.Fragment key={rowBlock}>
                        <tr>
                          <td rowSpan={3} style={{ padding: 0, borderTop: 'var(--borde-grueso) !important', borderRight: 'var(--borde-grueso) !important', ...(isLastBlock ? { borderBottom: 'none !important' } : { borderBottom: 'var(--borde-grueso) !important' }) }}>
                            <div className="cell-flex-col">
                              <div className="cell-half"><span className="text-mini">Contenido (E-1___)</span><textarea name={`edu_cont_${rowBlock}`} value={(formData[`edu_cont_${rowBlock}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></div>
                              <div className="cell-half"><span className="text-mini">Aplicación (E-2___)</span><textarea name={`edu_apl_${rowBlock}`} value={(formData[`edu_apl_${rowBlock}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></div>
                            </div>
                          </td>
                          <td rowSpan={3} style={{ padding: 0, borderTop: 'var(--borde-grueso) !important', borderLeft: 'var(--borde-grueso) !important', borderRight: 'var(--borde-grueso) !important', ...(isLastBlock ? { borderBottom: 'none !important' } : { borderBottom: 'var(--borde-grueso) !important' }) }}>
                            <div className="cell-flex-col">
                              <div className="cell-half"><span className="text-mini">Bases/Acercamiento Teórico (C-1___)</span><textarea name={`cons_base_${rowBlock}`} value={(formData[`cons_base_${rowBlock}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></div>
                              <div className="cell-half"><span className="text-mini">Estrategias (C-2___)</span><textarea name={`cons_est_${rowBlock}`} value={(formData[`cons_est_${rowBlock}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1}></textarea></div>
                            </div>
                          </td>
                          <td className="estado-label" style={{ borderTop: 'var(--borde-grueso) !important', borderLeft: 'var(--borde-grueso) !important' }}>Logrado</td>
                          {[1, 2, 3, 4, 5, 6].map(col => <td key={`log_${col}`} style={{ borderTop: 'var(--borde-grueso) !important', ...(col === 6 ? { borderRight: 'none !important' } : {}) }}><input type="checkbox" name={`edu_${rowBlock}_log_col${col}`} checked={!!formData[`edu_${rowBlock}_log_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                        </tr>
                        <tr>
                          <td className="estado-label" style={{ borderLeft: 'var(--borde-grueso) !important' }}>Suspendida</td>
                          {[1, 2, 3, 4, 5, 6].map(col => <td key={`sus_${col}`} style={col === 6 ? { borderRight: 'none !important' } : {}}><input type="checkbox" name={`edu_${rowBlock}_sus_col${col}`} checked={!!formData[`edu_${rowBlock}_sus_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                        </tr>
                        <tr>
                          <td className="estado-label" style={{ borderLeft: 'var(--borde-grueso) !important', ...(isLastBlock ? { borderBottom: 'none !important' } : { borderBottom: 'var(--borde-grueso) !important' }) }}>No lograda</td>
                          {[1, 2, 3, 4, 5, 6].map(col => <td key={`nol_${col}`} style={{ ...(isLastBlock ? { borderBottom: 'none !important' } : { borderBottom: 'var(--borde-grueso) !important' }), ...(col === 6 ? { borderRight: 'none !important' } : {}) }}><input type="checkbox" name={`edu_${rowBlock}_nol_col${col}`} checked={!!formData[`edu_${rowBlock}_nol_col${col}`]} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 3: Firmas */}
          <div className="section-row flex-t3">
            <div className="tab-vertical"><span>Firmas</span></div>
            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: '7%' }} />
                  {[1, 2, 3, 4, 5, 6].map(i => <col key={i} style={{ width: '15.5%' }} />)}
                </colgroup>
                <tbody>
                  <tr>
                    <td className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</td>
                    {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={col === 6 ? { borderRight: 'none !important' } : {}}><input type="text" name={`firma_fecha_col${col}`} value={(formData[`firma_fecha_col${col}`] as string) || ''} onChange={handleDateInput} readOnly tabIndex={-1} placeholder="DD/MM/AAAA" maxLength={10} style={{ fontSize: '8px' }} /></td>)}
                  </tr>
                  {["PLN.", "Matrícula", "Firma", "LN.", "Céd. Prof."].map((label, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{label}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={col === 6 ? { borderRight: 'none !important' } : {}}><input type="text" name={`firma_${idx}_col${col}`} value={(formData[`firma_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                    </tr>
                  ))}
                  <tr>
                    <td className="td-label" style={{ borderBottom: 'none !important' }}>Firma</td>
                    {[1, 2, 3, 4, 5, 6].map(col => <td key={col} style={{ borderBottom: 'none !important', ...(col === 6 ? { borderRight: 'none !important' } : {}) }}><input type="text" name={`firma_final_col${col}`} value={(formData[`firma_final_col${col}`] as string) || ''} onChange={handleInputChange} readOnly tabIndex={-1} /></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="footer">
          <div className="footer-num">6</div>
        </div>
      </div>



    </div>
    </>
    );
};

export default SeguimientoNutricional;
