  /**
   * ============================================================================
   * ARCHIVO: NutritionMasterForm.tsx (Pestaña 1 de 4)
   * PROPÓSITO: Formulario Multi-pasos con persistencia de datos local.
   * ============================================================================
   */
  import React, { useEffect } from 'react';
  import { useNavigate } from 'react-router';
  import { useNutritionHistoriaData } from '../hooks/formClinico/useNutritionHistoriaData';
  import { usePrintFitScale } from '../hooks/usePrintFitScale';
  import { useScreenFitScale } from '../hooks/useScreenFitScale';
  import { useAuth } from '../contexts/AuthContext';
  import { formatExpediente } from '../lib/formatExpediente';
  // IMPORTACIÓN DE LA IMAGEN
  import bristolImg from './bristol.jpg';
  import logoUtc from './logo_historiales.jpg';

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
    onFinalizarDirecto?: () => void | Promise<void>;
  }

  const NutritionMasterForm = () => {
    const navigate = useNavigate();

    const {
      appointmentId, updateGlobalData, isSaving, yaGuardado, historialId, formData,
    } = useNutritionHistoriaData({});
    const { user } = useAuth();
    const puedeEditar = user?.rol === 'admin' || user?.rol === 'master';

    // Este componente ahora solo se monta cuando ya existe un historial
    // persistido (ver NutritionMasterFormRouteResolver.tsx) — es la
    // representación documental de solo lectura, nunca la interfaz de
    // captura en vivo (eso es NutricionPrimeraConsultaCaptura.tsx).
    const isReadOnly = true;

    // Los manejadores de edición ya no se disparan (fieldset disabled),
    // se conservan sin efecto para no tener que tocar cada referencia.
    const handleInputChange = (..._args: any[]) => {};

    // Regla de impresión única para todos los documentos clínicos del sistema
    // (ver src/app/hooks/usePrintFitScale.ts para la explicación completa del
    // mecanismo). Validado originalmente en HojaEvolutiva.tsx y reutilizado
    // tal cual aquí y en PhysiotherapyMasterForm.tsx.
    usePrintFitScale(['.p1-paper']);
    // Ajuste de pantalla en móvil (no impresión) — ver useScreenFitScale.ts.
    useScreenFitScale(['.p1-paper']);

    // useScreenFitScale solo ajusta por ANCHO (para que la hoja quepa en
    // móvil); nunca revisa el ALTO, a diferencia de usePrintFitScale, que sí
    // reduce la hoja si el contenido real excede el alto físico de una
    // página Carta (279.4mm). Si una hoja crece (más filas, más márgenes) y
    // pasa de esa medida, la impresión se reducía para caber pero la
    // pantalla seguía mostrando el 100% — pantalla e impresión dejaban de
    // coincidir. Este efecto agrega el mismo chequeo de alto en pantalla,
    // combinando el factor de alto con el de ancho que ya puso
    // useScreenFitScale (se toma el menor de los dos), para que ambas vistas
    // siempre coincidan. Se re-ejecuta con los mismos disparadores que
    // useScreenFitScale (resize/orientationchange) más los cambios de
    // formData (para recalcular una vez que el historial real ya cargó),
    // y corre después de ese hook en el mismo evento para tener la última
    // palabra sin pisarle su propio ajuste de ancho.
    useEffect(() => {
      const CARTA_ALTO_MM = 279.4;
      const CARTA_ANCHO_MM = 215.9;
      const PX_POR_MM = 96 / 25.4;
      const COLCHON_REDONDEO_PX = 6;
      const MARGEN_LATERAL_PX = 16; // debe coincidir con useScreenFitScale.ts
      const altoDisponiblePx = CARTA_ALTO_MM * PX_POR_MM - COLCHON_REDONDEO_PX;
      const anchoDisponiblePx = CARTA_ANCHO_MM * PX_POR_MM;

      // Igual que usePrintFitScale: si una hoja necesita reducirse más que
      // las demás por ALTO (más contenido, factor de alto menor que el de
      // ancho), se ensancha su --screen-width ANTES del zoom para que, tras
      // reducirla, el rectángulo final vuelva a medir el ancho Carta
      // completo — así todas las hojas se ven del mismo tamaño en pantalla
      // sin importar cuánto contenido tenga cada una. Usa su propia
      // variable (--screen-width, nunca --print-width) para que abrir/
      // cancelar Ctrl+P no dependa de ni dañe el tamaño en pantalla.
      //
      // Cuando en cambio el ANCHO es la restricción activa (viewport angosto
      // / móvil, factor puesto por useScreenFitScale), NO se ensancha: ahí
      // sí se busca que la hoja se achique de verdad para caber en la
      // pantalla, no que mantenga su footprint completo. Ensanchar también
      // en ese caso desbordaba el ancho real del documento y el navegador
      // terminaba reportando un viewport más ancho de lo real en móvil,
      // empujando los botones flotantes (Volver/Imprimir/Editar) fuera de
      // la pantalla visible.
      const ajustarPorAlto = () => {
        // Se recalcula el factor de ANCHO aquí mismo (misma fórmula que
        // useScreenFitScale.ts) en vez de leerlo de vuelta desde
        // --screen-scale: esa variable ya trae escrito el resultado
        // COMBINADO de la corrida anterior de este mismo efecto, así que
        // leerla de vuelta perdía la señal de "cuál factor puro puso
        // useScreenFitScale" en cuanto este efecto corría una segunda vez
        // (p. ej. al recargar datos del historial), y dejaba de ensanchar.
        const anchoViewportDisponible = document.documentElement.clientWidth - MARGEN_LATERAL_PX;
        const factorAncho = Math.min(1, anchoViewportDisponible / anchoDisponiblePx);
        // El ensanchado (igualar el tamaño visual de las 4 hojas) es una
        // mejora cosmética pensada solo para escritorio — igual que el zoom
        // de 1.5x. Se verificó que en portrait de tablet (hasta ~1023px) el
        // ensanchado también desbordaba el ancho real del documento y
        // empujaba los botones flotantes fuera de la pantalla, así que se
        // desactiva por debajo de 1024px: ahí cada hoja solo se ajusta a su
        // propio alto (factorAlto) sin ensanchar, priorizando que quepa en
        // la pantalla sobre que se vea del mismo tamaño que las demás.
        const permitirEnsanchado = document.documentElement.clientWidth >= 1024;

        document.querySelectorAll<HTMLElement>('.p1-paper').forEach(hoja => {
          const zoomPrevio = hoja.style.zoom;
          hoja.style.zoom = '1';
          hoja.style.removeProperty('--screen-width');
          const altoNatural = hoja.scrollHeight;
          const factorAlto = Math.min(1, altoDisponiblePx / altoNatural);

          let factor: number;
          if (permitirEnsanchado && factorAlto < factorAncho) {
            factor = factorAlto;
            hoja.style.setProperty('--screen-width', `${anchoDisponiblePx / factor}px`);
            const altoTrasEnsanchar = hoja.scrollHeight;
            factor = Math.min(1, altoDisponiblePx / altoTrasEnsanchar);
            hoja.style.setProperty('--screen-width', `${anchoDisponiblePx / factor}px`);
          } else {
            factor = Math.min(factorAncho, factorAlto);
          }

          hoja.style.zoom = zoomPrevio;
          hoja.style.setProperty('--screen-scale', String(factor));
        });
      };

      ajustarPorAlto();
      window.addEventListener('resize', ajustarPorAlto);
      window.addEventListener('orientationchange', ajustarPorAlto);
      return () => {
        window.removeEventListener('resize', ajustarPorAlto);
        window.removeEventListener('orientationchange', ajustarPorAlto);
      };
    }, [formData]);

    return (
      <>
      <style>{`
        @page { size: 215.9mm 279.4mm; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .p1-outer { background: white !important; padding: 0 !important; margin: 0 !important; zoom: 1 !important; }
          .p1-outer > div { margin-bottom: 0 !important; }
          .p1-paper {
            box-shadow: none !important;
            /* Escala calculada en tiempo real (ver useEffect de escala de
               impresión, más abajo en este componente) — NUNCA un valor
               fijo. Si la hoja cabe al 100%, --print-scale vale 1 y no pasa
               nada; solo se reduce si el contenido real excede el alto
               físico de la hoja. --print-width es exclusiva de impresión
               (nunca se usa en pantalla — ver --screen-width más abajo) para
               que abrir e imprimir/cancelar Ctrl+P no deje residuos que
               cambien el tamaño en pantalla después. */
            zoom: var(--print-scale, 1) !important;
            width: var(--print-width, 215.9mm) !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        /* Zoom cosmético SOLO para la vista en pantalla (se ve "muy lejos" a
           tamaño real 96dpi): agranda visualmente todo el documento como si
           el navegador estuviera a 150% de zoom. No toca --screen-scale (el
           factor de ajuste de cada hoja al alto físico Carta) ni
           --print-scale — se anula explícitamente arriba dentro de
           @media print, así que Ctrl+P nunca se ve afectado por esto.
           Restringido a >=1024px: en tablets y móvil, aplicar este zoom por
           encima del ajuste de useScreenFitScale desbordaba el ancho real
           de la hoja y el navegador terminaba reportando un viewport más
           ancho de lo real, empujando los botones flotantes
           (Volver/Imprimir/Editar) fuera de la pantalla visible.
           Verificado que en portrait de tablet (hasta ~1023px) el problema
           se reproduce igual que en móvil, mientras que en landscape/
           escritorio (1024px+) no. Mobile/tablet ya tienen su propio
           mecanismo de ajuste (--screen-scale), no necesitan este zoom
           extra. */
        @media (min-width: 1024px) {
          .p1-outer { zoom: 1.5; }
        }
        /* .p1-outer ya NO es un contenedor flex (era flex flex-col
           items-center): centrar con align-items un hijo con zoom aplicado
           da resultados inconsistentes en Chromium (el hijo se centraba
           según su ancho SIN zoom pero se pintaba ya reducido,
           desalineándolo y desbordando el viewport real en tablet/móvil).
           Los 4 hijos directos (uno por hoja) ya son bloques w-full, así
           que apilan solos; este margen reemplaza el gap-8 que traía el
           flex. */
        .p1-outer > div { margin-bottom: 32px; }
        .p1-outer > div:last-child { margin-bottom: 0; }
        /* Tamaño de hoja y escala igual a la vista de Seguimiento Nutricional
           (HojaEvolutiva.tsx): ancho/alto fijos en mm, sin escalado responsive,
           para que se vea como una hoja física real en pantalla.
           Centrado con left:50%+transform en vez de margin:0 auto: en
           Chromium, margin:auto sobre un elemento con zoom se resuelve de
           forma inconsistente según el factor de zoom exacto (confirmado con
           0.92/0.9075 rotos vs 0.745 correcto, con el mismo CSS), produciendo
           un margen derecho negativo y desbordando el viewport en tablet
           portrait. transform:translateX(-50%) se resuelve contra el ancho
           final ya renderizado del propio elemento, no contra su ancho
           previo al zoom, así que es estable para cualquier factor. En
           impresión se vuelve a margin:0 auto porque --print-width siempre
           es un valor fijo en mm (nunca queda en un factor de zoom
           intermedio problemático) y position:static es más simple/segura
           para el motor de impresión. */
        .p1-paper { zoom: var(--screen-scale, 1); width: var(--screen-width, 215.9mm) !important; min-height: 279.4mm !important; position: relative !important; left: 50% !important; transform: translateX(-50%) !important; margin: 0 !important; border-radius: 0 !important; }
        @media print {
          .p1-paper { position: static !important; left: auto !important; transform: none !important; margin: 0 auto !important; }
        }
        .p1-paper input:not([type="checkbox"]), .p1-paper textarea {
          word-break: break-word;
          overflow-wrap: break-word;
          padding-bottom: 2px;
          /* Mismo tamaño de fuente de datos que Seguimiento Nutricional (8px) en
             las 4 páginas — !important porque hay decenas de inputs/textareas
             con su propio text-[Npx] de Tailwind (7-9.5px) esparcidos en el JSX
             de las 4 páginas; forzarlo aquí es más simple y confiable que
             editar cada uno por separado. */
          font-size: 8px !important;
        }
        .p1-paper input, .p1-paper textarea, .p1-paper tr, .p1-paper td, .p1-paper th {
          border-color: #2c5697;
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
          font-size: 8px;
          line-height: 1.05;
          color: #333;
          display: block;
        }
        @media print {
          /* NO forzar overflow:visible/height:auto en <textarea> — Chromium
             ignora overflow:visible en textareas (siempre se comporta como
             auto/scrollable) y su height:auto no se ajusta al contenido real
             como en un <div>, cae a un alto intrínseco pequeño en vez de
             crecer — el resultado real era un textarea MÁS CHICO en
             impresión que en pantalla, no uno que mostrara más texto. Se
             elimina para que impresión use exactamente el mismo tamaño fijo
             que pantalla (mismo recorte, sin discrepancia). */
          .p1-paper tr, .p1-paper td { break-inside: avoid; }
        }
        /* Cada una de las 4 hojas (.p1-paper) ocupa su propia página impresa,
           en el mismo orden en que se muestran en pantalla (1, 2, 3, 4). Las
           4 son hijas directas de .p1-outer, una por página — se excluye la
           última (:last-child) para no dejar una hoja en blanco al final. */
        @media print {
          .p1-outer > div:not(:last-child) .p1-paper {
            break-after: page;
            page-break-after: always;
          }
        }
        /* Checkbox tipo "palomita" (igual a Historia Clínica Fisioterapéutica)
           — usado en todo el documento salvo en el encabezado de Datos
           personales (Sexo/Edo. civil), que conserva el estilo de cuadro
           relleno sólido (CustomCheckbox variant="square"). */
        input.chk-checkmark {
          appearance: none;
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border: 1.5px solid #2c5392;
          cursor: pointer;
          vertical-align: middle;
          position: relative;
          display: inline-grid;
          place-content: center;
          background-color: #fff;
          flex-shrink: 0;
        }
        input.chk-checkmark:checked::after {
          content: '✓';
          font-size: 10px;
          color: #2c5392;
          font-weight: bold;
        }
      `}</style>
      {/* Solo lectura: las 4 páginas se muestran apiladas (no hay wizard de
          pasos que navegar, no aplica a un documento ya finalizado). Botones
          "Volver" / "Imprimir" / "Editar", fuera del fieldset deshabilitado. */}
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
            onClick={() => navigate(`/forms/nutricion/${appointmentId}`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg font-bold shadow-2xl transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      {/* fieldset disabled bloquea todos los controles descendientes
          (páginas 1-4) sin tener que tocar cada input individualmente;
          display:contents lo hace invisible en el layout calibrado en mm. */}
      <fieldset disabled={isReadOnly} className="contents">
      <div className="p1-outer bg-zinc-600 min-h-screen px-2 pt-20 pb-24 font-sans sm:px-6 md:px-12 lg:px-24 xl:px-[220px] print:bg-white print:p-0 relative">

{/* --- PÁGINA 1 --- */}
        <div className="block w-full">

          {/* CONTENEDOR HOJA A4 (DISEÑO UNIFORME SIN SUPERPOSICIONES) */}
          <div className="p1-paper relative flex min-h-[297mm] print:min-h-[270mm] w-full flex-col justify-between overflow-hidden rounded-[15px] bg-white px-[10mm] pb-[6mm] pt-[6mm] text-[#2c5697] shadow-2xl print:m-0 print:shadow-none">
            
            {/* ENCABEZADO */}
            <svg className="pointer-events-none absolute right-0 top-0 z-0 h-[160px] w-[450px]" viewBox="0 0 450 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M 150 0 Q 220 80 320 60 T 450 100 L 450 0 Z" fill="#4a7ab5" opacity="0.3" />
              <path d="M 220 0 Q 280 100 360 80 T 450 130 L 450 0 Z" fill="#2c5697" opacity="0.6" />
              <path d="M 280 0 Q 340 120 400 100 T 450 160 L 450 0 Z" fill="#1d4d96" opacity="0.9" />
            </svg>
            <header className="relative z-10 mt-2 mb-1 flex items-center justify-between shrink-0">
              <div className="flex h-[80px] w-[100px] shrink-0 items-center justify-center bg-white">
                <img src={logoUtc} alt="Universidad Tres Culturas" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-grow flex-col items-center justify-center px-4 text-center">
                <div className="mb-1 flex w-full max-w-[550px] items-center justify-center rounded-[20px] bg-[#2c5697] py-1.5 text-[24px] font-extrabold uppercase tracking-wide text-white shadow-md">
                  Historia Clínica Nutricional
                </div>
                <p className="text-[9.5px] font-bold text-[#2c5697]">Av. Insurgentes Sur 92, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX</p>
              </div>
            </header>

            {/* FECHA — fuera del recuadro de Datos personales, solo unos px arriba */}
            <div className="relative z-10 flex justify-end mt-1 mb-2 pr-[95px]">
              <div className="flex items-end gap-1 text-[10px] font-bold text-[#2c5697] whitespace-nowrap">
                <span>Fecha</span>
                <input
                  type="text"
                  id="fecha"
                  value={formData.pagina_1.fecha || ''}
                  onChange={(e) => handleInputChange(e, 'fecha')}
                  className="w-28 border-b border-[#2c5697] outline-none px-1 h-4 bg-transparent text-center text-[10px] font-bold text-[#333]"
                />
              </div>
            </div>

            {/* DATOS PERSONALES */}
            <SectionBox
              title="Datos personales"
              marginTop="mt-0"
            >
              <div className="flex items-end gap-1 mb-0.5 text-[9.5px] font-bold w-full">
                <span className="shrink-0">Nombre completo</span>
      <input
    type="text"
    value={formData.pagina_1?.nombre || ''}
    onChange={(e) => handleInputChange(e, 'nombre')}
    disabled={isReadOnly}
    className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[9.5px] text-[#333]"
  />
                <span className="shrink-0 ml-2">Expediente</span>
                <input
                  type="text"
                  id="expediente"
                  value={formatExpediente(formData.pagina_1.paciente_id)}
                  onChange={(e) => handleInputChange(e, 'expediente')}
                  className="border-b-[1.5px] border-[#2c5392] w-24 outline-none px-1 h-3.5 bg-transparent text-center text-[9.5px] text-[#333]"
                />
              </div>

              <div className="flex items-end gap-2 text-[9.5px] font-bold overflow-hidden w-full mb-0.5">
                <div className="flex items-end gap-1 shrink-0">
                  <span>Edad</span>
                  <input
                    type="text"
                    id="edad"
                    value={formData.pagina_1.edad || ''}
                    onChange={(e) => handleInputChange(e, 'edad')}
                    className="border-b-[1.5px] border-[#2c5392] w-10 outline-none px-1 h-3.5 bg-transparent text-center text-[9.5px] text-[#333]"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span>Sexo</span>
                  <CustomCheckbox
                    label="Fem"
                    checked={formData.pagina_1.sexo === 'Fem'}
                    onChange={() => updateGlobalData('pagina_1', {sexo: 'Fem'})}
                    variant="square"
                  />
                  <CustomCheckbox
                    label="Mas"
                    checked={formData.pagina_1.sexo === 'Mas'}
                    onChange={() => updateGlobalData('pagina_1', {sexo: 'Mas'})}
                    variant="square"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span>Edo. civil</span>
                  <CustomCheckbox
                    label="Soltero"
                    checked={formData.pagina_1.civil === 'Soltero'}
                    onChange={() => updateGlobalData('pagina_1', {civil: 'Soltero'})}
                    variant="square"
                  />
                  <CustomCheckbox
                    label="Casado"
                    checked={formData.pagina_1.civil === 'Casado'}
                    onChange={() => updateGlobalData('pagina_1', {civil: 'Casado'})}
                    variant="square"
                  />
                </div>
                <div className="flex items-end gap-1 flex-grow ml-2">
                  <span className="shrink-0">Ocupación</span>
                  <input
                    type="text"
                    id="ocupacion"
                    value={formData.pagina_1.ocupacion || ''}
                    onChange={(e) => handleInputChange(e, 'ocupacion')}
                    className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[9.5px] text-[#333]"
                  />
                </div>
                <div className="flex items-end gap-1 shrink-0">
                  <span>F/N</span>
                  <input
                    type="text"
                    id="fn"
                    value={formData.pagina_1.fn || ''}
                    onChange={(e) => handleInputChange(e, 'fn')}
                    className="border-b-[1.5px] border-[#2c5392] w-20 outline-none px-1 h-3.5 bg-transparent text-center text-[9.5px] text-[#333]"
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
                  className="border-b-[1.5px] border-[#2c5392] w-48 outline-none px-1 h-3.5 bg-transparent text-[9.5px] text-[#333]"
                />
                <span className="shrink-0 ml-2">Dirección</span>
                <input
                  type="text"
                  id="direccion"
                  value={formData.pagina_1.direccion || ''}
                  onChange={(e) => handleInputChange(e, 'direccion')}
                  className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none px-1 h-3.5 bg-transparent text-[9.5px] text-[#333]"
                />
              </div>
            </SectionBox>

            {/* MOTIVOS Y QX */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <SectionBox title="Motivos de consulta" paddingX="px-2" marginTop="mt-[14px]">
                <LineTextarea
                  id="motivos"
                  value={formData.pagina_1.motivos || ''}
                  onChange={handleInputChange}
                  rows={5.36}
                  lineHeight={16}
                />
              </SectionBox>
              <SectionBox title="Qx o Tx previos" paddingX="px-2" marginTop="mt-[14px]">
                <LineTextarea
                  id="qx"
                  value={formData.pagina_1.qx || ''}
                  onChange={handleInputChange}
                  rows={5.36}
                  lineHeight={16}
                />
              </SectionBox>
            </div>

            {/* ANTECEDENTES GRID */}
            <div className="grid grid-cols-[1.6fr_1fr] items-start gap-4 shrink-0">
              <SectionBox title="Antecedentes patológicos heredofamiliares" paddingX="px-0" marginTop="mt-[14px]" style={{ height: '235px' }}>
                <div className="w-full h-full overflow-hidden rounded-b-md flex flex-col text-[8.5px] font-bold">
                  <div className="flex border-b-[1.5px] border-[#2c5392] bg-slate-50/50 shrink-0">
                    <div className="text-left pl-2 w-[40%] py-1">Enfermedades</div>
                    {['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'].map(h => <div key={h} className="w-[10%] text-[7.5px] py-1 text-center">{h}</div>)}
                  </div>
                  <div className="flex flex-col flex-1">
                    {['Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map((item) => (
                      <div key={item} className="flex flex-1 items-center border-b-[1.5px] border-[#2c5392]">
                        <div className="text-left pl-2 border-r-[1.5px] border-[#2c5392] w-[40%] h-full flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{item}</div>
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-[10%] border-r-[1.5px] border-[#2c5392] last:border-r-0 h-full flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={formData.pagina_1[`heredo-${item}-${i}`] || false}
                              onChange={(e) => updateGlobalData('pagina_1', {[`heredo-${item}-${i}`]: e.target.checked})}
                              disabled={isReadOnly}
                              className="chk-checkmark"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="flex flex-1 items-center border-b-[1.5px] border-[#2c5392]">
                      <div className="text-left pl-2 border-r-[1.5px] border-[#2c5392] w-[40%] h-full flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="flex items-center gap-1 w-full">
                          <span className="shrink-0">Otras:</span>
                          <input
                            type="text"
                            id="otrasHeredo"
                            value={formData.pagina_1.otrasHeredo || ''}
                            onChange={(e) => handleInputChange(e, 'otrasHeredo')}
                            className="w-full min-w-0 outline-none h-3.5 bg-transparent text-[8.5px] text-[#333]"
                          />
                        </div>
                      </div>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-[10%] border-r-[1.5px] border-[#2c5392] last:border-r-0 h-full flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={formData.pagina_1[`heredo-otras-${i}`] || false}
                            onChange={(e) => updateGlobalData('pagina_1', {[`heredo-otras-${i}`]: e.target.checked})}
                            disabled={isReadOnly}
                            className="chk-checkmark"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionBox>

              <SectionBox title="Antecedentes patológicos personales" marginTop="mt-[14px]" pill={false} style={{ height: '235px' }}>
                <div className="flex flex-col gap-1.5 text-[9px] font-bold px-1 py-1">
                  {['Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales', 'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas', 'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enferm. Gastrointestinales'].map(item => (
                    <CustomCheckbox
                      key={item}
                      label={item}
                      checked={formData.pagina_1[`pers-${item}`] || false}
                      onChange={(e:any) => updateGlobalData('pagina_1', {[`pers-${item}`]: e.target.checked})}
                      textSize="text-[9px]"
                    />
                  ))}
                  <div className="flex items-center gap-1">
                    <CustomCheckbox
                      label="Otras:"
                      checked={formData.pagina_1.otrasPersCheck || false}
                      onChange={(e:any) => updateGlobalData('pagina_1', { otrasPersCheck: e.target.checked })}
                      textSize="text-[9px]"
                    />
                    <input
                      type="text"
                      id="otrasPers"
                      value={formData.pagina_1.otrasPers || ''}
                      onChange={(e) => handleInputChange(e, 'otrasPers')}
                      className="flex-grow border-b-[1.5px] border-[#2c5392] outline-none h-3.5 bg-transparent text-[9px] text-[#333]"
                    />
                  </div>
                </div>
              </SectionBox>
            </div>

            <div className="grid grid-cols-[calc((100%-32px)/3)_1fr] gap-4 shrink-0">
              <SectionBox title="Sintomatología" paddingX="px-0" marginTop="mt-[11px]" pill={false}>
                <div className="flex flex-col w-full h-full text-[8.5px] font-bold">
                  <div className="flex shrink-0 border-b-[1.5px] border-[#2c5392] bg-slate-50/50">
                    <div className="text-left pl-2 border-r-[1.5px] border-[#2c5392] w-[53%] py-1">Enfermedades</div>
                    <div className="flex-1 py-1 text-center">Freq./Cant.</div>
                  </div>
                  <div className="flex flex-col flex-1">
                    {['Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito', 'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia'].map(item => (
                      <div key={item} className="flex flex-1 border-b-[1.5px] border-[#2c5392] last:border-b-0">
                        <div className="text-left pl-2 border-r-[1.5px] border-[#2c5392] w-[53%] flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={formData.pagina_1[`sintoma-check-${item}`] || false}
                            onChange={(e) => updateGlobalData('pagina_1', {[`sintoma-check-${item}`]: e.target.checked})}
                            className="chk-checkmark shrink-0"
                          />
                          <span className="truncate">{item}</span>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={formData.pagina_1[`sintoma-val-${item}`] || ''}
                            onChange={(e) => updateGlobalData('pagina_1', {[`sintoma-val-${item}`]: e.target.value})}
                            className="w-full h-full border-none outline-none px-1.5 bg-transparent text-left text-[#333]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionBox>

              {/* Sub-grid propio para Bristol/Antecedentes personales no patológicos/Diagnósticos
                  médicos/Medicamentos — separado de Sintomatología para poder reposicionar este
                  bloque como unidad sin afectarla (ver conversación: reubicar el hueco de mt-2 de
                  "antes del bloque" a "entre sus dos filas internas", sin mover nada más). */}
              <div className="grid grid-cols-2 gap-4">
              <SectionBox title="Escala de Bristol" className="text-center" marginTop="mt-[11px]" pill={false}>
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
                      <label
                        key={num}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-[1.5px] border-[#2c5392] text-[9px] font-bold text-[#2c5392] has-[:checked]:bg-[#2c5392] has-[:checked]:text-white"
                      >
                        <input
                          type="radio"
                          name="bristol_scale"
                          checked={formData.pagina_1.bristol === num}
                          onChange={() => updateGlobalData('pagina_1', {bristol: num})}
                          className="sr-only"
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                </div>
              </SectionBox>

              <SectionBox title="Antecedentes personales no patológicos" paddingX="px-0" marginTop="mt-[11px]" className="pb-0" pill={false} style={{ marginLeft: '-8px', width: 'calc(100% + 8px)' }} titleClassName="text-[8.5px]">
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
                            className="chk-checkmark shrink-0"
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

              <SectionBox title="Diagnósticos médicos" paddingX="px-0" marginTop="mt-0" pill={false}>
                <div className="flex flex-col">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="border-b-[1.5px] border-[#2c5392] last:border-b-0 flex items-center shrink-0 h-[28px]"
                    >
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
                <div className="flex w-full gap-2 px-2 text-[9px]"><span className="flex-1 text-center">Medicamentos</span><span className="flex-1 text-center">Dosis</span></div>
              } paddingX="px-1.5" marginTop="mt-0" pill={false} style={{ marginLeft: '-8px', width: 'calc(100% + 8px)' }}>
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
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0">
              <SectionBox title="Ejercicio" marginTop="mt-[14px]">
                <div className="flex flex-col gap-1 w-full h-full justify-center">
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full mb-1">
                    <span className="shrink-0">Realiza ejercicio</span>
                    <CustomCheckbox label="No" checked={formData.pagina_1.ejercicio_realiza_no || false} onChange={(e:any) => updateGlobalData('pagina_1', {ejercicio_realiza_no: e.target.checked})} />
                    <CustomCheckbox label="Sí" checked={formData.pagina_1.ejercicio_realiza_si || false} onChange={(e:any) => updateGlobalData('pagina_1', {ejercicio_realiza_si: e.target.checked})} />
                    <div className="flex gap-2 ml-auto">
                      <CustomCheckbox label="Aeróbico" checked={formData.pagina_1.ejercicio_aerobico || false} onChange={(e:any) => updateGlobalData('pagina_1', {ejercicio_aerobico: e.target.checked})} />
                      <CustomCheckbox label="Anaeróbico" checked={formData.pagina_1.ejercicio_anaerobico || false} onChange={(e:any) => updateGlobalData('pagina_1', {ejercicio_anaerobico: e.target.checked})} />
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

              <SectionBox title="Antecedentes gineco-obstétricos" marginTop="mt-[14px]">
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
                    <CustomCheckbox label="No" checked={formData.pagina_1.embarazo_no || false} onChange={(e:any) => updateGlobalData('pagina_1', {embarazo_no: e.target.checked})} />
                    <CustomCheckbox label="Sí" checked={formData.pagina_1.embarazo_si || false} onChange={(e:any) => updateGlobalData('pagina_1', {embarazo_si: e.target.checked})} />
                    <span className="ml-auto">SDG</span><input type="text" value={formData.pagina_1.sdg || ''} onChange={(e) => updateGlobalData('pagina_1', {sdg: e.target.value})} className="border-b-[1.5px] border-[#2c5392] w-12 outline-none text-center h-[13px] text-[#333]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full">
                    <span className="whitespace-nowrap shrink-0">Remplazo hormonal</span>
                    <CustomCheckbox label="No" checked={formData.pagina_1.hormo_no || false} onChange={(e:any) => updateGlobalData('pagina_1', {hormo_no: e.target.checked})} />
                    <CustomCheckbox label="Sí" checked={formData.pagina_1.hormo_si || false} onChange={(e:any) => updateGlobalData('pagina_1', {hormo_si: e.target.checked})} />
                    <input type="text" value={formData.pagina_1.hormo || ''} onChange={(e) => updateGlobalData('pagina_1', {hormo: e.target.value})} className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none h-[13px] text-[#333]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold w-full">
                    <span className="whitespace-nowrap shrink-0">Anticonceptivos</span>
                    <CustomCheckbox label="No" checked={formData.pagina_1.anti_no || false} onChange={(e:any) => updateGlobalData('pagina_1', {anti_no: e.target.checked})} />
                    <CustomCheckbox label="Sí" checked={formData.pagina_1.anti_si || false} onChange={(e:any) => updateGlobalData('pagina_1', {anti_si: e.target.checked})} />
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

        {/* --- PÁGINAS 2, 3 Y 4 --- */}
        <NutritionPage2Document
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly={isReadOnly}
        />

        <NutritionPage3Document
          accumulatedData={formData}
          onUpdate={updateGlobalData}
          onBack={() => {}}
          onNext={() => {}}
          isReadOnly={isReadOnly}
        />

        <NutritionPage4Document
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
      </div>
      </fieldset>
      </>
    );
  };

  /* --- COMPONENTES AUXILIARES --- */

  const SectionBox: React.FC<{
    title?: React.ReactNode,
    children: React.ReactNode,
    className?: string,
    paddingX?: string,
    marginTop?: string,
    /** false = encabezado completo (barra azul de ancho total, estilo original); true (default) = píldora tipo legend. */
    pill?: boolean,
    /** Override puntual (margin/width) para desplazar una caja dentro de su celda de grid sin tocar grid-template-columns — ver "Antecedentes personales no patológicos"/"Medicamentos". */
    style?: React.CSSProperties,
    /** Override puntual del tamaño de fuente del título (barra pill=false) para que quepa en una sola línea sin crecer la caja — ver "Antecedentes personales no patológicos". */
    titleClassName?: string,
  }> = ({ title, children, className = "", paddingX = "px-3", marginTop = "mt-3", pill = true, style, titleClassName = "text-[11px]" }) => (
    <section
      className={`relative rounded-[10px] border-[2px] border-[#2c5697] ${marginTop} flex w-full flex-col bg-white ${className}`}
      style={{ ...(title && pill ? { paddingTop: '11px' } : undefined), ...style }}
    >
      {title && (
        pill ? (
          <span className="absolute -top-[11px] left-3 inline-block rounded-full bg-[#2c5697] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
            {title}
          </span>
        ) : (
          <div className={`flex min-h-6 items-center whitespace-nowrap rounded-t-[8px] bg-[#2c5697] px-3 py-1 font-bold tracking-wide text-white ${titleClassName}`}>
            {title}
          </div>
        )
      )}
      <div className={`flex flex-1 flex-col justify-start overflow-hidden rounded-[8px] py-1 ${paddingX} w-full h-full min-h-0`}>
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
        className="w-full resize-none border-none outline-none text-[#333] text-[9px] bg-repeat-y bg-transparent px-1 m-0 p-0 block overflow-hidden box-border break-words"
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
        className="border-b-[1.5px] border-[#2c5392] flex-grow outline-none text-[9px] text-[#333] px-1 h-[13px] bg-transparent"
      />
    </div>
  );

  const CustomCheckbox: React.FC<{ label: string, checked?: boolean, onChange?: any, textSize?: string, variant?: 'checkmark' | 'square' }> = ({ label, checked, onChange, textSize = "text-[9px]", variant = 'checkmark' }) => (
    <label className={`flex items-center gap-1 cursor-pointer shrink-0 ${textSize} font-bold`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={variant === 'square'
          ? "appearance-none w-2.5 h-2.5 border-[1.5px] border-[#2c5392] checked:bg-[#2c5392] transition-colors relative cursor-pointer align-middle shrink-0"
          : "chk-checkmark"}
      />
      <span className="truncate leading-none pt-[1px]">{label}</span>
    </label>
  );
  
  /*
   * Las tres páginas siguientes son la versión documental de la maqueta UTC.
   * Los campos conservan los identificadores ya persistidos por el formulario
   * de captura; este bloque solo reorganiza su presentación para impresión.
   */
  const DocumentSection: React.FC<{
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    /** false = encabezado completo (barra azul de ancho total, estilo original); true (default) = píldora tipo legend. */
    pill?: boolean;
    /** Solo aplica cuando pill=false: centra el texto del encabezado completo en vez de alinearlo a la izquierda. */
    centerTitle?: boolean;
    /** Espacio reservado arriba para la píldora del título (por defecto 11px,
        pensado para un título de una sola línea). Si el título es largo y
        envuelve a 2 líneas (p. ej. "Hallazgos físicos Orientados a Nut...DEN"),
        subir este valor evita que la píldora se superponga a la fila de la
        tabla justo debajo — es una corrección de espacio, no de diseño. */
    titlePaddingTop?: string;
    /** Override puntual del tamaño de fuente del título (píldora pill=true) para que quepa en una sola línea sin crecer la caja — ver "Hallazgos físicos Orientados a Nut...DEN". */
    titleClassName?: string;
  }> = ({ title, children, className = '', contentClassName = 'p-2', pill = true, centerTitle = false, titlePaddingTop = '11px', titleClassName = 'text-[11px]' }) => (
    <section
      className={`relative rounded-[10px] border-[2px] border-[#2c5697] bg-white ${className}`}
      style={title && pill ? { paddingTop: titlePaddingTop } : undefined}
    >
      {title && (
        pill ? (
          <span className={`absolute -top-[11px] left-3 inline-block whitespace-nowrap rounded-full bg-[#2c5697] px-3 py-1 font-bold tracking-wide text-white ${titleClassName}`}>
            {title}
          </span>
        ) : (
          <div className={`flex min-h-6 items-center rounded-t-[8px] bg-[#2c5697] px-3 py-1 text-[11px] font-bold tracking-wide text-white ${centerTitle ? 'justify-center' : ''}`}>
            {title}
          </div>
        )
      )}
      <div className={`${contentClassName} overflow-hidden rounded-[8px]`}>{children}</div>
    </section>
  );

  const DocumentCheckbox: React.FC<{
    label?: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
  }> = ({ label, checked, onChange, className = '' }) => (
    <label className={`flex shrink-0 items-center gap-1 text-[9px] font-bold text-[#2c5697] ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="chk-checkmark"
      />
      {label && <span>{label}</span>}
    </label>
  );

  function NutritionPage2Document({ accumulatedData, onUpdate }: PageProps) {
    const p2 = accumulatedData.pagina_2 || {};
    const set = (name: string, value: string | boolean) => onUpdate('pagina_2', { [name]: value });
    const frecuencia = [
      'Verduras', 'Fruta²', 'Cereal s/g', 'Pan dulce nat', 'Pan dulce UP', 'Galletas', 'Leguminosas', 'Carne de res',
      'Carne de cerdo', 'Carne de pollo', 'Pavo', 'Pescados', 'Mariscos', 'Huevo', 'Prod. anim UP', 'Quesos bcos',
      'Quesos amr', 'Embutidos', 'Leche s/sab', 'Yogurt s/sab', 'Leche UP', 'Yogurt UP', 'Oleaginosas', 'Aceites',
      'Mantequilla', 'Margarina', 'Refresco', 'Agua sab UP', 'Jugos nat', 'Jugos UP', 'Helado', 'Nieve', 'Gelatinas',
      'Aguas frutas', 'Té', 'Café', 'Agua natural', 'Papas fritas', 'Garnachas com', 'Garnachas fri',
    ];
    const antropometria = [
      ['Talla (m)', 'talla', false], ['Peso (kg)', 'peso', false], ['IMC (kg/m²)', 'imc', true],
      ['Peso Ideal/FAO (kg)', 'peso_fao', false], ['Circ. Muñeca (cm)', 'muneca', true], ['Diámetro codo (cm)', 'codo', true],
      ['Circ. Brazo (cm)', 'brazo', true], ['Circ. Abd (cm)', 'abd', true], ['Circ. Cintura (cm)', 'cintura', false],
      ['Circ. Cadera (cm)', 'cadera', false], ['ICC', 'icc', true], ['PCB (mm)', 'pcb', true], ['PCT (mm)', 'pct', true],
      ['PCSe (mm)', 'pcse', true], ['PCSi (mm)', 'pcsi', true], ['% Grasa SIRI', 'grasa_siri', true],
      ['% Grasa InBody', 'grasa_inb', true], ['IMG InBody', 'img_inb', true], ['MLG (kg)', 'mlg', false],
      ['IMLG (kg/m²)', 'imlg', true], ['cAMB (cm²)', 'camb', true], ['MMT InBody', 'mmt_inb', true],
      ['IMEA InBody', 'imea_inb', true], ['ACT (L)', 'act', false], ['Grasa Visc (L)', 'grasa_visc', true],
    ] as const;
    // La clave real de guardado (segundo elemento) debe coincidir con la de
    // NutricionPrimeraConsultaCaptura.tsx (SIGNOS_VITALES) para que captura y
    // documento lean/escriban el mismo dato; la etiqueta (primer elemento) es
    // solo texto abreviado por espacio en la hoja impresa.
    const signos: Array<[string, string]> = [
      ['T. Arterial', 'ta'], ['F. Resp (rpm)', 'fr'], ['F. Card (lpm)', 'fc'], ['Temp (°C)', 'temp'], ['SO₂', 'so2'],
    ];
    const inputClass = 'h-full w-full min-w-0 border-0 bg-transparent px-1 text-[8.5px] text-[#333] outline-none';
    const pillHead = 'border-b border-r border-[#2c5697] bg-[#2c5697] px-1 py-1 text-center text-[8.5px] font-bold text-white last:border-r-0';
    const cell = 'h-[15px] border-b border-r border-[#2c5697] p-0 last:border-r-0';

    return (
      <div className="w-full">
        <div className="page p1-paper flex min-h-[297mm] w-full flex-col rounded-[15px] bg-white px-[10mm] pb-[8mm] pt-[8mm] text-[#2c5697] shadow-2xl">
          <DocumentSection title="Aspectos dietéticos">
            <div className="space-y-1 text-[9px] font-bold">
              {[
                ['Alergias alimentarias:', 'alergias'], ['Intolerancias alimentarias:', 'intolerancias'], ['Alimentos de preferencia:', 'preferencias'],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-[145px] shrink-0">{label}</span>
                  <DocumentCheckbox label="No" checked={!!p2[`${key}_no`]} onChange={e => set(`${key}_no`, e.target.checked)} />
                  <DocumentCheckbox label="Sí" checked={!!p2[`${key}_si`]} onChange={e => set(`${key}_si`, e.target.checked)} />
                  <span className="ml-2">Cuál</span>
                  <input value={p2[`${key}_txt`] || ''} onChange={e => set(`${key}_txt`, e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent px-1 text-[#333] outline-none" />
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="shrink-0">Alimentos que no le agradan o no acostumbre</span>
                <input value={p2.desagrados || ''} onChange={e => set('desagrados', e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent px-1 text-[#333] outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Comidas al día</span><input value={p2.comidas_dia || ''} onChange={e => set('comidas_dia', e.target.value)} className="h-4 w-8 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" />
                <span>Fuertes</span><input value={p2.comidas_fuertes || ''} onChange={e => set('comidas_fuertes', e.target.value)} className="h-4 w-8 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" />
                <span>Colaciones</span><input value={p2.comidas_col || ''} onChange={e => set('comidas_col', e.target.value)} className="h-4 w-8 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" />
                <span className="ml-2 shrink-0">¿Quién prepara sus alimentos?</span><input value={p2.quien_prepara || ''} onChange={e => set('quien_prepara', e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent px-1 text-[#333] outline-none" />
              </div>
              {[
                ['Ha modificado su alimentación en los últimos 6 meses', 'modifico_alim', 'Cómo (↓ ↑)'], ['Indicación de dieta especial/recomendada previamente', 'dieta_previa', 'Cuál'],
                ['Su alimentación dependiendo de su estado de ánimo', 'alim_animo', 'Cómo (↓ ↑)'], ['Uso de laxantes', 'laxantes', 'Cuál'], ['Uso de medicamentos para bajar de peso', 'meds_peso', 'Cuál'],
              ].map(([label, key, followup]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-[245px] shrink-0">{label}</span>
                  <DocumentCheckbox label="No" checked={!!p2[`${key}_no`]} onChange={e => set(`${key}_no`, e.target.checked)} />
                  <DocumentCheckbox label="Sí" checked={!!p2[`${key}_si`]} onChange={e => set(`${key}_si`, e.target.checked)} />
                  <span className="ml-2 shrink-0">{followup}</span>
                  <input value={p2[`${key}_txt`] || ''} onChange={e => set(`${key}_txt`, e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent px-1 text-[#333] outline-none" />
                </div>
              ))}
            </div>
          </DocumentSection>

          <DocumentSection title="Frecuencia de consumo" className="mt-3">
            <div className="grid grid-cols-4 gap-x-5 gap-y-0.5">
              {frecuencia.map(item => (
                <div key={item} className="flex items-end text-[7.5px] font-bold">
                  <span className="shrink-0 whitespace-nowrap">{item}</span>
                  <input value={p2[`freq_${item}`] || ''} onChange={e => set(`freq_${item}`, e.target.value)} className="mx-1 h-3 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent text-center text-[8px] text-[#333] outline-none" />
                  <span className="shrink-0">/7 días</span>
                </div>
              ))}
            </div>
          </DocumentSection>

          <div className="mt-3 grid flex-1 grid-cols-[1.1fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <DocumentSection contentClassName="p-0">
                <table className="w-full border-collapse table-fixed">
                  <thead><tr><th className={`${pillHead} text-left`}>Antropometría</th><th className={`${pillHead} w-[20%]`}>VO</th><th className={`${pillHead} w-[45%]`}>Interpretación</th></tr></thead>
                  <tbody>{antropometria.map(([label, key, interpretation]) => <tr key={key}>
                    <td className={`${cell} px-1.5 text-[8.5px] font-bold text-[#2c5697]`}>{label}</td>
                    <td className={cell}><input type="number" value={p2[`antrop_${key}_vo`] || ''} onChange={e => set(`antrop_${key}_vo`, e.target.value)} className={inputClass} /></td>
                    <td className={`${cell} ${!interpretation ? 'bg-[#2c5697]' : ''}`}>{interpretation && <input value={p2[`antrop_${key}_int`] || ''} onChange={e => set(`antrop_${key}_int`, e.target.value)} className={inputClass} />}</td>
                  </tr>)}</tbody>
                </table>
              </DocumentSection>
              <DocumentSection title="Interpretación antropométrica" className="mt-auto" contentClassName="p-1">
                <textarea value={p2.int_antrop || ''} onChange={e => set('int_antrop', e.target.value)} className="h-9 w-full resize-none overflow-hidden border-0 bg-transparent text-[9px] text-[#333] outline-none" />
              </DocumentSection>
              <DocumentSection contentClassName="p-0">
                <table className="w-full border-collapse table-fixed">
                  <thead><tr><th className={`${pillHead} text-left`}>Signos Vitales</th><th className={`${pillHead} w-[20%]`}>VO</th><th className={`${pillHead} w-[45%]`}>Interpretación</th></tr></thead>
                  <tbody>{signos.map(([label, key]) => <tr key={key}>
                    <td className={`${cell} px-1.5 text-[8.5px] font-bold text-[#2c5697]`}>{label}</td>
                    <td className={`${cell} w-[20%]`}><input value={p2[`sv_${key}_vo`] || ''} onChange={e => set(`sv_${key}_vo`, e.target.value)} className={inputClass} /></td>
                    <td className={`${cell} w-[45%]`}><input value={p2[`sv_${key}_int`] || ''} onChange={e => set(`sv_${key}_int`, e.target.value)} className={inputClass} /></td>
                  </tr>)}</tbody>
                </table>
              </DocumentSection>
            </div>
            <div className="flex flex-col gap-3">
              <DocumentSection contentClassName="p-0">
                <table className="w-full border-collapse table-fixed"><thead><tr><th className={`${pillHead} text-left`}>Parámetros bioquímicos</th><th className={`${pillHead} w-[20%]`}>VO</th><th className={`${pillHead} w-[45%]`}>Interpretación</th></tr></thead>
                  <tbody>{Array.from({ length: 28 }, (_, i) => <tr key={i}>
                    <td className={cell}><input value={p2[`bq_${i}_nom`] || ''} onChange={e => set(`bq_${i}_nom`, e.target.value)} className={`${inputClass} font-bold text-[#2c5697]`} /></td>
                    <td className={cell}><input value={p2[`bq_${i}_vo`] || ''} onChange={e => set(`bq_${i}_vo`, e.target.value)} className={inputClass} /></td>
                    <td className={cell}><input value={p2[`bq_${i}_int`] || ''} onChange={e => set(`bq_${i}_int`, e.target.value)} className={inputClass} /></td>
                  </tr>)}</tbody>
                </table>
              </DocumentSection>
              <DocumentSection title="Interpretación bioquímica" contentClassName="p-1">
                <textarea value={p2.int_bioq || ''} onChange={e => set('int_bioq', e.target.value)} className="h-9 w-full resize-none overflow-hidden border-0 bg-transparent text-[9px] text-[#333] outline-none" />
              </DocumentSection>
              <DocumentSection title="Solicitud de análisis" className="mt-auto">
                <div className="grid grid-cols-2 gap-2">{['Química Sanguínea', 'EGO', 'Biometría hemática'].map(label => <DocumentCheckbox key={label} label={label} checked={!!p2[`sol_${label}`]} onChange={e => set(`sol_${label}`, e.target.checked)} />)}
                  <div className="flex items-end gap-1"><DocumentCheckbox label="Otro:" checked={!!p2.sol_otro} onChange={e => set('sol_otro', e.target.checked)} /><input value={p2.sol_otro_txt || ''} onChange={e => set('sol_otro_txt', e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent text-[8px] text-[#333] outline-none" /></div>
                </div>
              </DocumentSection>
            </div>
          </div>
          <DocumentFooter page="2" />
        </div>
      </div>
    );
  }

  const DocumentFooter: React.FC<{ page: string }> = ({ page }) => (
    <footer className="mt-3 flex items-end justify-between border-t-2 border-[#2c5697] pt-1 text-[8px] font-bold italic text-[#555]">
      <span>ESA: Explorado y sin alteraciones; N/A: No aplica; PN: Preguntado y negado; ✔: Adecuado.</span>
      <span className="text-sm not-italic font-black text-[#2c5697]">{page}</span>
    </footer>
  );

  function NutritionPage3Document({ accumulatedData, onUpdate }: PageProps) {
    const p3 = accumulatedData.pagina_3 || {};
    const set = (name: string, value: string | boolean) => onUpdate('pagina_3', { [name]: value });
    // Debe coincidir exactamente (mismo texto, misma clave `key()`) con HALLAZGOS_FISICOS de
    // NutricionPrimeraConsultaCaptura.tsx — de lo contrario los datos guardados desde captura
    // no se reflejan aquí (mismo bug ya corregido en Signos Vitales).
    const hallazgos = ['Hallazgos generales', 'Adiposidad', 'Huesos', 'Sistema cardiovascular-respiratorio', 'Sistema digestivo', 'Edema', 'Extremidades', 'Ojos', 'Pelo', 'Cabeza', 'Manos y uñas', 'Boca', 'Músculos', 'Cuello', 'Piel', 'Dientes', 'Garganta y deglución', 'Lengua'];
    const grupos = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA ___', 'Lácteo ___', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
    const evaluacion = [
      ['¿Incluye todos los nutrimentos esenciales (HC, proteínas, lípidos, vitaminas, minerales y agua)?', 'Completa'], ['¿Los nutrimentos están en proporciones apropiadas entre sí?', 'Equilibrada'],
      ['¿Los alimentos están libres de microorganismos patógenos, toxinas o contaminantes?', 'Inocua'], ['¿No se consumen en cantidades excesivas ni contienen excesos de sodio, azúcares o grasas trans?', 'Equilibrada'],
      ['¿Cubre los requerimientos energéticos y nutrimentales según edad, sexo, actividad física y estado fisiológico?', 'Suficiente'], ['¿Incluye diferentes alimentos dentro de cada grupo alimenticio a lo largo del día o semana?', 'Variada'],
      ['¿Evita la monotonía alimentaria?', 'Variada'], ['¿Es acorde a los gustos, cultura, hábitos y disponibilidad económica?', 'Adecuada'], ['¿Está ajustada a su disponibilidad económica?', 'Adecuada'],
    ];
    const key = (label: string) => label.replace(/\s+/g, '_').replace(/\//g, '_').toLowerCase();
    const cell = 'h-[17px] border-b border-r border-[#2c5697] p-0 last:border-r-0';
    const input = 'h-full w-full min-w-0 border-0 bg-transparent px-1 text-center text-[8px] text-[#333] outline-none';

    return (
      <div className="w-full"><div className="page p1-paper flex min-h-[297mm] w-full flex-col rounded-[15px] bg-white px-[10mm] pb-[8mm] pt-[8mm] text-[#2c5697] shadow-2xl">
        <div className="grid grid-cols-[1.7fr_1.4fr] gap-3">
          <div>
            <DocumentSection title="Matriz IMG/IMLG" contentClassName="p-0">
              <table className="w-full border-collapse text-center text-[7.5px]"><thead><tr className="bg-[#f2f5f9] font-bold text-[#2c5697]">
                <th className="border-b border-r border-[#2c5697] p-1">IMLG (kgMG/est²)</th><th className="border-b border-r border-[#2c5697] p-1">IMG disminuido<br />(≤4 H / &lt;7 M)</th><th className="border-b border-r border-[#2c5697] p-1">IMG adecuado<br />(5-9 H / 7-11 M)</th><th className="border-b border-r border-[#2c5697] p-1">IMG adecuado<br />(5-8 H / 7-11 M)</th><th className="border-b border-[#2c5697] p-1">IMG elevado<br />(≥9 H / ≥12 M)</th>
              </tr></thead><tbody className="text-[#333]">
                {[
                  ['IMLG Bajo (&lt;17 H / &lt;15 M)', 'Caquexia', 'Desnutrición proteico-energética', 'Desnutrición proteico-energética', 'Obesidad preclínica / clínica'],
                  ['IMLG Normal (17-23 H / 15-21 M)', 'Bajo en grasa', 'Normalidad', 'Normalidad', 'Obesidad preclínica / clínica'],
                  ['IMLG Alto (23-25 H / 21-23 M)', 'Atletas', 'Físicamente activa', 'Físicamente activa', 'Sano metabólicamente / obesidad'],
                ].map(row => <tr key={row[0]}>{row.map((value, i) => <td key={i} className={`border-b border-r border-[#2c5697] p-1 last:border-r-0 ${i === 0 ? 'bg-[#f2f5f9] font-bold text-[#2c5697]' : ''}`}>{value}</td>)}</tr>)}
                <tr><td className="border-b border-r border-[#2c5697] bg-[#f2f5f9] p-1 font-bold text-[#2c5697]">IMLG Muy Alto (25-28 H / 23-25 M)</td><td colSpan={4} className="border-b border-[#2c5697] p-1 font-bold text-[#2c5697]">Sospecha de uso de esteroides / Obesidad mórbida</td></tr>
                <tr><td className="border-r border-[#2c5697] bg-[#f2f5f9] p-1 font-bold text-[#2c5697]">IMLG Muy Alto (&gt;28 H / &gt;25 M)</td><td colSpan={4} className="border-[#2c5697] p-1 font-bold text-[#2c5697]">Diagnóstico de uso de esteroides / Obesidad mórbida</td></tr>
              </tbody></table>
            </DocumentSection>
            <div className="mt-2 flex items-center text-[9px] font-bold"><span>Diagnóstico Matriz IMG/IMLG:</span><input value={p3.diag_matriz_imlo_img || ''} onChange={e => set('diag_matriz_imlo_img', e.target.value)} className="ml-2 h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent px-1 text-[#333] outline-none" /></div>
          </div>
          <DocumentSection title="Hallazgos físicos Orientados a Nut&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DEN" contentClassName="p-0" titleClassName="text-[8px]">
            <table className="w-full border-collapse text-[7.5px]"><tbody>
              {hallazgos.map(label => { const k = key(label); return <tr key={label}><td className="h-[11.56px] w-[38%] whitespace-nowrap border-b border-r border-[#2c5697] pl-1 text-[6.5px] font-bold">{label}</td><td className="border-b border-r border-[#2c5697] p-0"><input value={p3[`hallazgo_${k}_desc`] || ''} onChange={e => set(`hallazgo_${k}_desc`, e.target.value)} maxLength={36} className="h-full w-full border-0 bg-transparent px-1 text-[7px] text-[#333] outline-none" /></td><td className="w-[20%] border-b border-[#2c5697] p-0"><input value={p3[`hallazgo_${k}_den`] || ''} onChange={e => set(`hallazgo_${k}_den`, e.target.value)} maxLength={10} className="h-full w-full border-0 bg-transparent px-1 text-center text-[7px] text-[#333] outline-none" /></td></tr>; })}
            </tbody></table>
          </DocumentSection>
        </div>

        <DocumentSection title="Recordatorio de 24 horas" className="mt-3" contentClassName="p-0">
          <div className="grid min-h-[190px] grid-cols-[3fr_1.1fr]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 p-2 text-[9px] font-bold shrink-0"><span>Fecha</span><input value={p3.rec_fecha || ''} onChange={e => set('rec_fecha', e.target.value)} className="h-4 w-28 border-b border-[#2c5697] bg-transparent text-[#333] outline-none" /></div>
              <div className="flex border-b-2 border-[#2c5697] bg-[#f2f5f9] text-center text-[8px] font-bold shrink-0"><div className="w-[20%] py-1">Hora</div><div className="w-[80%] py-1">Contenido (platillo: cantidad y alimento)</div></div>
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-[20%] border-l-2 border-[#2c5697]" />
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className={`flex h-[24px] mb-1 last:mb-0 ${i % 2 === 0 ? 'bg-[#f2f5f9]' : ''}`}><input value={p3[`rec_hora_${i}`] || ''} onChange={e => set(`rec_hora_${i}`, e.target.value)} className="w-[20%] border-0 bg-transparent text-center text-[8px] text-[#333] outline-none" /><textarea value={p3[`rec_contenido_${i}`] || ''} onChange={e => set(`rec_contenido_${i}`, e.target.value)} maxLength={207} className="h-full w-[80%] resize-none overflow-hidden border-0 bg-transparent px-2 text-[8px] text-[#333] outline-none" /></div>)}
              </div>
            </div>
            <div className="relative p-2">
              <div className="pointer-events-none absolute -top-3 -bottom-px left-0 border-l-2 border-[#2c5697]" />
              <div className="mb-1 text-[10px] font-bold">Alimentos olvidados</div>
              <div className="grid grid-cols-1 gap-0.5 text-[8px] font-bold">{['Agua', 'Café / Té', 'Leche', 'Azúcar / Endulzante', 'Jugos / Refresco', 'Agua de sabor', 'Sal', 'Chile / Salsas', 'Caramelos / Chicle', 'Galletas / Pastel', 'Aguacate', 'Gelatina', 'Nieve / Helado', 'Oleaginosas', 'Chocolates', 'Papas / Palomitas', 'Frutas', 'TORTILLAS', 'Aceite / Crema', 'Mantequilla'].map(item => <span key={item}>• {item}</span>)}</div>
            </div>
          </div>
        </DocumentSection>

        <div className="mt-3 grid grid-cols-[1.6fr_1fr] items-start gap-3">
          <DocumentSection title="Consumo de porciones" contentClassName="p-0">
            <table className="w-full border-collapse text-center text-[8px]"><thead><tr className="bg-[#f2f5f9] text-[#2c5697]"><th className="border-b border-r border-[#2c5697] py-1 text-left">Grupo alimentario</th>{['Porciones', 'Energía', 'Proteína', 'Lípidos', 'HCO'].map(h => <th key={h} className="border-b border-r border-[#2c5697] py-1 last:border-r-0">{h}</th>)}</tr></thead><tbody>
              {grupos.map(label => { const k = label.replace(/\s+/g, '_').replace(/___/g, '').toLowerCase(); return <tr key={label}><td className={`${cell} pl-2 text-left font-bold text-[#2c5697]`}>{label}</td>{['porciones', 'energia', 'proteina', 'lipidos', 'hco'].map(col => <td key={col} className={cell}><input type="number" value={p3[`porcion_${k}_${col}`] || ''} onChange={e => set(`porcion_${k}_${col}`, e.target.value)} className={input} /></td>)}</tr>; })}
              <tr className="bg-[#f2f5f9]"><td className={`${cell} pr-2 text-right font-bold text-[#2c5697]`}>Total</td>{['porciones', 'energia', 'proteina', 'lipidos', 'hco'].map(col => <td key={col} className={cell}><input type="number" value={p3[`porcion_total_${col}`] || ''} onChange={e => set(`porcion_total_${col}`, e.target.value)} className={`${input} font-bold`} /></td>)}</tr>
            </tbody></table>
          </DocumentSection>
          <div className="flex flex-col gap-3">
            <DocumentSection title="Distribución nutrimental actual" contentClassName="p-0" pill={false}>
              <table className="w-full border-collapse text-center text-[8px]"><thead><tr className="bg-[#f2f5f9] text-[#2c5697]"><th className="border-b border-r border-[#2c5697] py-1 text-left">Macronutrimento</th>{['%', 'Kcal', 'Gramos', 'g/kg'].map(h => <th key={h} className="border-b border-r border-[#2c5697] py-1 last:border-r-0">{h}</th>)}</tr></thead><tbody>
                {['Proteína', 'HCO', 'Lípidos'].map(macro => { const k = macro.toLowerCase().replace('í', 'i'); return <tr key={macro}><td className={`${cell} pl-2 text-left font-bold text-[#2c5697]`}>{macro}</td>{['pct', 'kcal', 'g', 'gkg'].map(col => <td key={col} className={cell}><input type="number" value={p3[`dn_${k}_${col}`] || ''} onChange={e => set(`dn_${k}_${col}`, e.target.value)} className={input} /></td>)}</tr>; })}
                <tr className="bg-[#f2f5f9]"><td className={`${cell} font-bold text-[#2c5697]`}>Totales</td><td className={`${cell} font-bold text-[#2c5697]`}>100%</td><td className={cell}><input value={p3.dn_total_kcal || ''} onChange={e => set('dn_total_kcal', e.target.value)} className={input} /></td><td className={cell}><input value={p3.dn_total_g || ''} onChange={e => set('dn_total_g', e.target.value)} className={input} /></td><td className={`${cell} text-[6px] font-bold`}>kcal/kgPA/d</td></tr>
              </tbody></table>
            </DocumentSection>
            <DocumentSection title="Interpretación % IAN" contentClassName="p-0" pill={false}>
              <table className="w-full border-collapse text-[8px]"><tbody>{['Energía', 'Proteína', 'HCO', 'Lípidos'].map(item => { const k = item.toLowerCase().replace('í', 'i').replace('é', 'e'); return <tr key={item}><td className={`${cell} w-[40%] pl-2 font-bold text-[#2c5697]`}>{item}</td><td className={`${cell} px-1 text-center font-bold text-[#2c5697]`}>Dieta <input value={p3[`ian_${k}_dieta`] || ''} onChange={e => set(`ian_${k}_dieta`, e.target.value)} className="w-8 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" /></td><td className={cell}><input value={p3[`ian_${k}_pct`] || ''} onChange={e => set(`ian_${k}_pct`, e.target.value)} className="h-full w-9 bg-transparent text-center text-[#333] outline-none" />%</td></tr>; })}</tbody></table>
            </DocumentSection>
          </div>
        </div>

        <DocumentSection title="Evaluación Cualitativa" className="mt-3">
          <div className="space-y-1">{evaluacion.map(([text, result], index) => <div key={text} className="flex items-center gap-2 text-[8px]"><DocumentCheckbox label="No" checked={!!p3[`evalcual_${index}_no`]} onChange={e => set(`evalcual_${index}_no`, e.target.checked)} /><DocumentCheckbox label="Sí" checked={!!p3[`evalcual_${index}_si`]} onChange={e => set(`evalcual_${index}_si`, e.target.checked)} /><span>{text} → <b>{result}</b></span></div>)}</div>
        </DocumentSection>
        <DocumentFooter page="3" />
      </div></div>
    );
  }

  function NutritionPage4Document({ accumulatedData, onUpdate }: PageProps) {
    const p4 = accumulatedData.pagina_4 || {};
    const set = (name: string, value: string | boolean) => onUpdate('pagina_4', { [name]: value });
    const groups = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
    const cols = ['des', 'cm', 'com', 'cv', 'cena', 'rac', 'kcal', 'prot', 'lip', 'hco'];
    const colLabels = ['DES', 'CM', 'COM', 'CV', 'CENA', 'RAC', 'ENERGÍA', 'PROT.', 'LÍPIDOS', 'HCO'];
    const groupKey = (group: string) => group.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
    const cell = 'h-[16px] border-b border-r border-[#2c5697] p-0 last:border-r-0';
    const input = 'h-full w-full min-w-0 border-0 bg-transparent px-1 text-center text-[8px] text-[#333] outline-none';

    return (
      <div className="w-full"><div className="page p1-paper flex min-h-[297mm] w-full flex-col rounded-[15px] bg-white px-[10mm] pb-[8mm] pt-[8mm] text-[#2c5697] shadow-2xl">
        <div className="grid overflow-hidden rounded-[10px] border-[2px] border-[#2c5697] grid-cols-4">
          {['Diagnósticos Nutricios', 'Objetivo general', 'Educación Nutricia', 'Consejería Nutricia'].map((title, i) => <div key={title} className={`bg-[#2c5697] py-1.5 text-center text-[10px] font-bold uppercase text-white ${i < 3 ? 'border-r border-white' : ''}`}>{title}</div>)}
          <div className="min-h-[200px] border-r border-[#2c5697] p-2"><textarea value={p4.diag || ''} onChange={e => set('diag', e.target.value)} maxLength={679} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /></div>
          <div className="flex min-h-[200px] flex-col border-r border-[#2c5697] p-2"><textarea value={p4.objetivo || ''} onChange={e => set('objetivo', e.target.value)} maxLength={428} className="mb-1 min-h-[84px] w-full flex-1 resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /><ul className="shrink-0 list-none p-0 text-[7.5px] leading-tight"><li className="mb-1 font-bold">En formato SMART:</li><li>• <b>Specific:</b> Definición del fenómeno</li><li>• <b>Measurable:</b> Selección del indicador</li><li>• <b>Achievable:</b> Evaluación de factibilidad</li><li>• <b>Relevant:</b> Relación con el problema clínico</li><li>• <b>Time-bound:</b> Dinámica temporal</li></ul></div>
          <div className="flex min-h-[200px] flex-col border-r border-[#2c5697]"><div className="flex flex-1 flex-col border-b border-[#2c5697] p-2"><span className="mb-1 text-center text-[8.5px] font-bold">Contenido (E-1.<input value={p4.edu_cont_num || ''} onChange={e => set('edu_cont_num', e.target.value)} className="w-5 border-b border-[#2c5697] bg-transparent text-center outline-none" />)</span><textarea value={p4.edu_contenido || ''} onChange={e => set('edu_contenido', e.target.value)} maxLength={217} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /></div><div className="flex flex-1 flex-col p-2"><span className="mb-1 text-center text-[8.5px] font-bold">Aplicación (E-2.<input value={p4.edu_app_num || ''} onChange={e => set('edu_app_num', e.target.value)} className="w-5 border-b border-[#2c5697] bg-transparent text-center outline-none" />)</span><textarea value={p4.edu_aplicacion || ''} onChange={e => set('edu_aplicacion', e.target.value)} maxLength={214} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /></div></div>
          <div className="flex min-h-[200px] flex-col"><div className="flex flex-1 flex-col border-b border-[#2c5697] p-2"><span className="mb-1 text-center text-[8.5px] font-bold">Bases/Teórico (C-1.<input value={p4.cons_bases_num || ''} onChange={e => set('cons_bases_num', e.target.value)} className="w-5 border-b border-[#2c5697] bg-transparent text-center outline-none" />)</span><textarea value={p4.cons_bases || ''} onChange={e => set('cons_bases', e.target.value)} maxLength={213} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /></div><div className="flex flex-1 flex-col p-2"><span className="mb-1 text-center text-[8.5px] font-bold">Estrategias (C-2.<input value={p4.cons_est_num || ''} onChange={e => set('cons_est_num', e.target.value)} className="w-5 border-b border-[#2c5697] bg-transparent text-center outline-none" />)</span><textarea value={p4.cons_estrategias || ''} onChange={e => set('cons_estrategias', e.target.value)} maxLength={216} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent text-justify text-[9px] text-[#333] outline-none" /></div></div>
        </div>

        <DocumentSection title="Intervención" className="mt-3" pill={false} centerTitle>
          <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-3">
            <div className="flex min-h-[135px] flex-col overflow-hidden rounded-lg border border-[#2c5697]"><div className="bg-[#2c5697] py-1 text-center text-[9px] font-bold text-white">Indicación de Alimentos/Nutrimentos</div><div className="flex flex-1 flex-col gap-1 p-2">{['indicacion_1', 'indicacion_2', 'indicacion_3', 'indicacion_4'].map(name => <textarea key={name} value={p4[name] || ''} onChange={e => set(name, e.target.value)} maxLength={110} className="min-h-5 flex-1 resize-none overflow-hidden border-0 border-b border-[#2c5697] bg-transparent text-[8px] text-[#333] outline-none last:border-b-0" />)}</div></div>
            <div className="overflow-hidden rounded-lg border border-[#2c5697]"><div className="bg-[#2c5697] py-1 text-center text-[9px] font-bold text-white">Requerimiento calórico</div><div className="space-y-2 p-2 text-[8.5px] font-bold"><div className="flex gap-2"><DocumentCheckbox checked={!!p4.req_ec_pred} onChange={e => set('req_ec_pred', e.target.checked)} /><div className="flex-1">Ecuación predictiva<div className="mt-1 flex items-end gap-1 text-[7px] font-normal">Nombre:<input value={p4.req_ec_pred_nombre || ''} onChange={e => set('req_ec_pred_nombre', e.target.value)} className="h-3 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent text-[#333] outline-none" /></div></div></div><div className="flex gap-2"><DocumentCheckbox checked={!!p4.req_ec_rapida} onChange={e => set('req_ec_rapida', e.target.checked)} /><div className="flex-1">Ecuación rápida<div className="mt-1 flex items-end gap-1 text-[7px] font-normal">Peso:<input value={p4.req_ec_rapida_peso || ''} onChange={e => set('req_ec_rapida_peso', e.target.value)} className="h-3 w-8 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" /> kg</div><div className="mt-1 flex items-end gap-1 text-[7px] font-normal">Const. kcal:<input value={p4.req_ec_rapida_kcal_kg || ''} onChange={e => set('req_ec_rapida_kcal_kg', e.target.value)} className="h-3 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" /> kcal/kg/d</div></div></div><div className="flex items-end gap-1 pt-1 text-[10px]">Total<input value={p4.req_total_kcal || ''} onChange={e => set('req_total_kcal', e.target.value)} className="h-4 min-w-0 flex-1 border-b border-[#2c5697] bg-transparent text-center text-[#333] outline-none" />kcal</div></div></div>
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[#2c5697]"><div className="bg-[#2c5697] py-1 text-center text-[9px] font-bold text-white">Cuadro dietosintético</div><table className="h-full w-full border-collapse text-center text-[8px]"><thead><tr className="bg-[#f2f5f9]"><th className="border-b border-r border-[#2c5697] py-1">Macronutrimento</th>{['%', 'Kcal', 'Gramos', 'g/kg'].map(label => <th key={label} className="border-b border-r border-[#2c5697] py-1 last:border-r-0">{label}</th>)}</tr></thead><tbody>{['Proteína', 'HCO', 'Lípidos'].map(macro => { const k = macro.toLowerCase().replace('í', 'i'); return <tr key={macro}><td className={`${cell} pl-1 text-left font-bold text-[#2c5697]`}>{macro}</td>{['porc', 'kcal', 'g', 'g_kg'].map(col => <td key={col} className={cell}><input value={p4[`${k}_${col}`] || ''} onChange={e => set(`${k}_${col}`, e.target.value)} className={input} /></td>)}</tr>; })}<tr className="bg-[#f2f5f9]"><td className={`${cell} pl-1 text-left font-bold text-[#2c5697]`}>Totales</td><td className={`${cell} font-bold`}>100%</td><td className={cell}><input value={p4.total_kcal || ''} onChange={e => set('total_kcal', e.target.value)} className={input} /></td><td className={cell}><input value={p4.total_g || ''} onChange={e => set('total_g', e.target.value)} className={input} /></td><td className={`${cell} text-[6px] font-bold`}>kcal/kgPt/d</td></tr></tbody></table></div>
          </div>
        </DocumentSection>

        <DocumentSection title="Cálculo de porciones" className="mt-3" contentClassName="p-0">
          <table className="w-full border-collapse text-center text-[7px]"><thead><tr className="bg-[#f2f5f9]"><th className="border-b border-r border-[#2c5697] py-1 text-left pl-2">Grupo alimentario</th>{colLabels.map(label => <th key={label} className="border-b border-r border-[#2c5697] py-1 last:border-r-0">{label}</th>)}</tr></thead><tbody>
            {groups.map(group => { const k = groupKey(group); return <tr key={group}><td className={`${cell} pl-2 text-left font-bold text-[#2c5697]`}>{group}</td>{cols.map(col => <td key={col} className={cell}><input value={p4[`calc_${k}_${col}`] || ''} onChange={e => set(`calc_${k}_${col}`, e.target.value)} className={input} /></td>)}</tr>; })}
            <tr className="bg-[#f2f5f9]"><td className={`${cell} pl-2 text-left font-bold text-[#2c5697]`}>Total</td><td colSpan={6} className="border-b border-r border-[#2c5697]" />{['kcal', 'prot', 'lip', 'hco'].map(col => <td key={col} className={cell}><input value={p4[`calc_total_${col}`] || ''} onChange={e => set(`calc_total_${col}`, e.target.value)} className={input} /></td>)}</tr>
            <tr className="bg-[#f2f5f9]"><td className={`${cell} pl-2 text-left font-bold text-[#2c5697]`}>% Adecuación</td><td colSpan={6} className="border-b border-r border-[#2c5697]" />{['kcal', 'prot', 'lip', 'hco'].map(col => <td key={col} className={cell}><input value={p4[`calc_adec_${col}`] || ''} onChange={e => set(`calc_adec_${col}`, e.target.value)} className={input} /></td>)}</tr>
          </tbody></table>
        </DocumentSection>

        <DocumentSection title="Menú del día" className="mt-3" contentClassName="p-0"><table className="w-full border-collapse"><thead><tr className="bg-[#f2f5f9] text-center text-[9px] font-bold">{[['desayuno', 'Desayuno'], ['cm', 'CM'], ['comida', 'Comida'], ['cv', 'CV'], ['cena', 'Cena']].map(([key, label], i) => <th key={key} className={`border-b border-[#2c5697] py-1 ${i < 4 ? 'border-r' : ''}`}>{label}</th>)}</tr></thead><tbody><tr>{['desayuno', 'cm', 'comida', 'cv', 'cena'].map((meal, i) => <td key={meal} className={`h-[100px] p-0 align-top ${i < 4 ? 'border-r border-[#2c5697]' : ''}`}><textarea value={p4[`menu_${meal}`] || ''} onChange={e => set(`menu_${meal}`, e.target.value)} maxLength={219} className="h-full w-full resize-none overflow-hidden border-0 bg-transparent p-1 pb-3 text-justify text-[8px] text-[#333] outline-none" /></td>)}</tr></tbody></table></DocumentSection>

        <div className="mt-auto flex justify-around pt-6 text-center text-[9px] font-bold"><div className="w-[35%] border-t border-[#2c5697] pt-1"><input value={p4.firma_alumno || ''} onChange={e => set('firma_alumno', e.target.value)} className="mb-1 w-full border-0 bg-transparent text-center text-[8px] text-[#333] outline-none" />Nombre, matrícula y firma del alumno</div><div className="w-[35%] border-t border-[#2c5697] pt-1"><input value={p4.firma_docente || ''} onChange={e => set('firma_docente', e.target.value)} className="mb-1 w-full border-0 bg-transparent text-center text-[8px] text-[#333] outline-none" />Nombre, cédula y firma del docente responsable</div></div>
        <DocumentFooter page="4" />
      </div></div>
    );
  }

  export default NutritionMasterForm;
