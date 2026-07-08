import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { notasAPI, historialesAPI } from '../lib/api';
import type { FormClinicoHandle, FormClinicoCallbacks } from '../lib/types/formClinico';

type FormDataState = Record<string, string | boolean>;

const HojaEvolutiva = forwardRef<FormClinicoHandle, Partial<FormClinicoCallbacks>>((props, ref) => {
  // 1. CAMBIO CLAVE: Copiamos la lógica infalible del NutritionMasterForm
  const params = useParams();
  const appointmentId = params.id || params.appointmentId; 
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormDataState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notaId, setNotaId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [yaGuardado, setYaGuardado] = useState(false);

  useEffect(() => {
    // 2. Usar appointmentId en la validación (¡PROTEGIDO CONTRA TEXTO "null" y "undefined"!)
    if (!appointmentId || appointmentId === 'null' || appointmentId === 'undefined') {
      console.warn("⚠️ No se detectó el appointmentId en la URL.");
      toast.error("Este historial no tiene una cita vinculada, no se pueden cargar datos.");
      setIsLoading(false);
      return;
    }

    if (!user) return;

    // En modo workspace el borrador se restaura vía restoreDraft(); saltamos la carga de BD.
    if (props.formKey) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await notasAPI.getEvolucion(appointmentId as string);

        if (data && data.id) {
          setNotaId(data.id);
        }

        // 👈 HIDRATACIÓN INTELIGENTE (COMO EN NUTRITION MASTER FORM)
        // Combinamos los datos previos con el JSON de la BD y rescatamos las columnas principales
        if (data) {
           setFormData((prev) => ({
              ...prev,
              ...(data.cuadro_evolucion || {}),
              // Rescatamos los datos del auto-completado de Node.js
              paciente_nombre: data.cuadro_evolucion?.paciente_nombre || data.nombre_completo || '',
              paciente_expediente: data.cuadro_evolucion?.paciente_expediente || data.numero_expediente || ''
           }));
           toast.success("Datos de evolución cargados correctamente");
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [appointmentId, user]);

  // --- FUNCIÓN PARA SALIR CON CONFIRMACIÓN (modo standalone) ---
  const handleVolver = () => {
    const confirmar = window.confirm("¿Deseas salir sin guardar los cambios?");
    if (confirmar) navigate(-1);
  };

// --- 2. GUARDAR DATOS EN LA BASE DE DATOS ---
 const doSave = async () => {
    setIsSaving(true);
    try {
      const aId = appointmentId ? parseInt(appointmentId as string, 10) : null;

      if (props.formKey === 'seguimiento_nutricion') {
        // Nutrición subsecuente: debe guardarse en historiales_nutricion
        // para que getDocumentosExistentes lo encuentre y permita finalizar la consulta.
        await historialesAPI.guardar(null, {
          paciente_id: props.pacienteId ?? null,
          paciente_nombre: props.pacienteNombre || (formData.paciente_nombre as string) || 'Sin nombre',
          tipo: 'nutricion',
          datos: formData,
          creado_por: user?.id,
          creado_por_nombre: user?.nombre,
          appointment_id: aId,
        });
      } else {
        // Fisioterapia subsecuente (nota_evolutiva) y modo standalone
        const payload = {
          paciente_id: props.pacienteId ?? null,
          practicante_id: user?.id,
          appointment_id: aId,
          nombre_completo: props.pacienteNombre || (formData.paciente_nombre as string) || 'Sin nombre',
          numero_expediente: (formData.paciente_expediente as string) || 'S/N',
          edad: null,
          fecha_elaboracion: new Date().toISOString(),
          cuadro_evolucion: formData,
          area: user?.area || 'fisioterapia'
        };
        if (notaId) {
          await notasAPI.updateEvolucion(notaId, payload);
        } else {
          await notasAPI.createEvolucion(payload);
        }
      }

      toast.success("¡Expediente guardado correctamente!");
      setYaGuardado(true);

      if (props.onSaveSuccess) {
        props.onSaveSuccess(props.formKey ?? '');
      } else {
        setTimeout(() => { navigate(-1); }, 1000);
      }

   } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(`Error al guardar: ${error.message}`);
      props.onSaveFailure?.(props.formKey ?? '', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    triggerSave: doSave,
    canSave: !!(props.pacienteNombre?.trim() || (formData.paciente_nombre as string)?.trim()),
    restoreDraft: (draft) => setFormData((draft as FormDataState) ?? {}),
  }));

  useEffect(() => {
    props.onStateChange?.(props.formKey ?? '', formData);
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- MANEJADORES DE EVENTOS CON TIPADO ESTricto ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  // Máscara inteligente para fechas (DD/MM/AAAA)
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, '');
    if (val.length === 8 && !val.includes('/')) {
      val = val.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    e.target.value = val;
    handleInputChange(e);
  };

  // Máscara para números y decimales
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    handleInputChange(e);
  };

  // Máscara para días de la semana (1-7)
  const handleDaysInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^1-7]/g, '');
    handleInputChange(e);
  };

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
    <div className="hoja-evolutiva-wrapper">
      
      {/* ========================================================= */}
      {/* BOTONERA FLOTANTE DE ACCIÓN (¡AHORA SÍ FUERA DEL STYLE!) */}
      {/* ========================================================= */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 50, display: 'flex', gap: '10px' }}>
        {!props.formKey && (
          <button
            onClick={handleVolver}
            style={{ padding: '12px 20px', borderRadius: '50px', backgroundColor: '#64748b', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            Volver
          </button>
        )}

        <button
          onClick={() => !yaGuardado && setShowConfirm(true)}
          disabled={isSaving || yaGuardado}
          style={{ padding: '12px 25px', borderRadius: '50px', backgroundColor: yaGuardado ? '#27AE60' : 'var(--azul-utc)', color: 'white', border: 'none', fontWeight: 'bold', cursor: (isSaving || yaGuardado) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', opacity: yaGuardado ? 0.8 : 1 }}
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {yaGuardado ? 'Guardado ✓' : isSaving ? 'Guardando...' : 'Guardar Hoja'}
        </button>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', fontSize: '18px' }}>¿Guardar expediente?</h3>
            <p style={{ color: '#555', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
              Al confirmar, el expediente quedará guardado para esta consulta. Podrás revisarlo o editarlo antes de dar por finalizada la sesión.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: 'white', fontWeight: '500' }}>Cancelar</button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  if (props.formKey) {
                    setYaGuardado(true);
                    props.onBack?.();
                  } else {
                    doSave();
                  }
                }}
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#27AE60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >Sí, guardar</button>
            </div>
          </div>
        </div>
      )}

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
          .input-group input { border: none; border-bottom: 1px solid var(--azul-utc); flex-grow: 1; font-family: inherit; font-size: 11px; background: transparent; outline: none; color: #000; }
          .section-row { display: flex; margin-bottom: 10px; align-items: stretch; position: relative; }
          .tab-vertical { background-color: var(--azul-utc); color: white; width: 25px; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; border: var(--borde-grueso); border-right: none; }
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
          .hoja-evolutiva-wrapper input[type="text"], .hoja-evolutiva-wrapper input[type="number"], .hoja-evolutiva-wrapper textarea { width: 100%; height: 100%; min-height: 16px; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 10px; color: #000; text-align: center; outline: none; resize: none; padding: 2px; box-sizing: border-box; display: block; }
          .hoja-evolutiva-wrapper textarea { text-align: left; min-height: 35px; padding: 4px; }
          .hoja-evolutiva-wrapper input:focus, .hoja-evolutiva-wrapper textarea:focus { background-color: var(--azul-claro) !important; }
          .page-content { flex-grow: 1; }
          .footer { margin-top: auto; display: flex; justify-content: space-between; font-size: 7px; color: var(--azul-utc); font-weight: bold; padding-top: 5px; }

          /* ==========================================================
             ESTILOS - PÁGINA 2
             ========================================================== */
          .page2 { width: 215.9mm; min-height: 279.4mm; background-color: #ffffff; padding: 30px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border-radius: 4px; display: flex; flex-direction: column; margin-bottom: 20px;}
          .page2 .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 280px; font-weight: 900; color: rgba(155, 179, 214, 0.12); z-index: 0; pointer-events: none; letter-spacing: -10px; font-family: 'Arial Black', Impact, sans-serif; }
          .page2 .content { position: relative; z-index: 1; flex-grow: 1; }
          .page2 .section { position: relative; margin-left: 28px; margin-bottom: 25px; }
          .page2 .v-tab { position: absolute; left: -28px; top: 25px; bottom: -1px; width: 28px; background-color: #2b5696; color: white; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; box-shadow: 1px 0 0 #2b5696; }
          .page2 .v-tab span { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; font-weight: bold; letter-spacing: 0.5px; white-space: nowrap; }
          .page2 .table-wrap { border: 2px solid #2b5696; border-radius: 8px; background-color: transparent; position: relative; }
          .page2 .table-mask { border-radius: 6px; overflow: hidden; }
          .page2 td { border: 1px solid #9bb3d6; height: 18px; padding: 2px 8px; font-size: 11px; vertical-align: middle; color: #2b5696; }
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
          .page3 { width: 215.9mm; min-height: 279.4mm; background-color: #ffffff; padding: 30px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; border-radius: 4px; margin-bottom: 20px; display: flex; flex-direction: column;}
          .page3 .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 280px; font-weight: 900; color: rgba(155, 179, 214, 0.12); z-index: 0; pointer-events: none; font-family: 'Arial Black', Impact, sans-serif; }
          .page3 td, .page3 th { border: 1px solid #9bb3d6; height: 20px; padding: 2px 8px; font-size: 11px; color: #2b5696; }
          .page3 .section-header td { font-weight: bold; background-color: #f8f9fa; }
          .page3 .t2-header { background-color: #2b5696; color: white; font-weight: bold; text-align: center; font-size: 9px; }
          .page3 .t2-first-cell { font-weight: bold; border-right: 2px solid #2b5696; width: 32%; }

         /* ==========================================================
             ESTILOS - PÁGINA 4 (Diseño Flexbox pag4.html)
             ========================================================== */
          .page4 {
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
              border-radius: 8px 0 0 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: var(--borde-grueso);
              border-right: none;
              flex-shrink: 0;
          }
          .page4 .tab-vertical span {
              writing-mode: vertical-rl;
              transform: rotate(180deg);
              font-weight: bold;
              font-size: 13px;
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
              border-collapse: collapse;
              table-layout: fixed;
              flex: 1;
          }
          .page4 th, .page4 td {
              border: var(--borde-fino);
              padding: 2px;
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
              font-size: 11px;
              color: #000;
              text-align: center;
              outline: none;
              resize: none;
              padding: 2px;
              display: block;
          }
          .page4 textarea { text-align: left; padding: 4px; }
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
          .page4 .tabla-t1 { flex: 0 0 16%; }
          .page4 .tabla-t2 { flex: 0 0 18%; }
          .page4 .tabla-t3 { flex: 1; }
          .page4 .tabla-t4 { flex: 0 0 20%; }


            /* ==========================================================
             ESTILOS - PÁGINA 5
             ========================================================== */
          .page5 {
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
          
          .page5 .tab-vertical { background-color: var(--azul-utc); color: white; width: 28px; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; border: var(--borde-grueso); border-right: none; flex-shrink: 0; }
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
          
          .page5 input, .page5 textarea { width: 100%; height: 100%; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 11px; color: #000; text-align: center; outline: none; resize: none; padding: 2px; display: block; }
          .page5 textarea { text-align: left; padding: 4px; }
          .page5 input:focus, .page5 textarea:focus { background-color: var(--azul-claro) !important; }
          
          .page5 .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; z-index: 1; }
          .page5 .footer-left { font-size: 7px; color: var(--azul-utc); font-weight: bold; line-height: 1.2; text-align: left; }
          .page5 .footer-right { font-size: 16px; font-weight: bold; color: var(--azul-utc); }
          
          .page5 .t1-col1 { width: 28%; } .page5 .t1-cols { width: 12%; }
          .page5 .t2-col1 { width: 54%; } .page5 .t2-col2 { width: 10%; } .page5 .t2-cols { width: 6%; }


            /* ==========================================================
             ESTILOS - PÁGINA 6
             ========================================================== */
          .page6 {
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
          .page6 .page-content { flex: 1; display: flex; flex-direction: column; gap: 15px; z-index: 1; }
          .page6 .section-row { display: flex; align-items: stretch; position: relative; background: white; }
          .page6 .section-col { display: flex; flex-direction: column; position: relative; }
          
          .page6 .tab-vertical { background-color: var(--azul-utc); color: white; width: 28px; border-radius: 8px 0 0 8px; display: flex; align-items: center; justify-content: center; border: var(--borde-grueso); border-right: none; flex-shrink: 0; }
          .page6 .tab-vertical span { writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 13px; letter-spacing: 0.5px; }
          .page6 .tab-horizontal { position: absolute; top: -14px; left: 15px; background-color: var(--azul-utc); color: white; font-size: 12px; font-weight: bold; padding: 4px 20px; border-radius: 12px 12px 0 0; z-index: 2; border: var(--borde-grueso); border-bottom: none; }
          
          .page6 .table-wrap { flex: 1; border: var(--borde-grueso); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
          .page6 .table-wrap-right { border-radius: 0 8px 8px 0; }
          .page6 table { width: 100%; border-collapse: collapse; table-layout: fixed; flex: 1; display: table; height: 100%; }
          .page6 th, .page6 td { border: var(--borde-fino); padding: 0; vertical-align: middle; text-align: center; }
          
          .page6 tr:first-child th, .page6 tr:first-child td { border-top: none; }
          .page6 tr:last-child td { border-bottom: none; }
          .page6 tr td:first-child, .page6 tr th:first-child { border-left: none; }
          .page6 tr td:last-child, .page6 tr th:last-child { border-right: none; }
          
          .page6 .header-azul { background-color: var(--azul-utc) !important; color: white !important; font-size: 11px; font-weight: bold; text-align: center; padding: 4px; }
          .page6 .th-fecha { color: var(--azul-utc); font-size: 11px; font-weight: bold; }
          .page6 .td-label { color: var(--azul-utc); font-size: 9.5px; font-weight: normal; text-align: left; padding-left: 8px; }
          .page6 .subtitulo-p6 { font-size: 10px; font-weight: bold; color: var(--azul-utc); padding-left: 8px !important; background-color: transparent !important; text-align: left; }
          
          .page6 .cell-flex-col { display: flex; flex-direction: column; height: 100%; width: 100%; }
          .page6 .cell-half { flex: 1; display: flex; flex-direction: column; border-bottom: var(--borde-fino); }
          .page6 .cell-half:last-child { border-bottom: none; }
          .page6 .text-mini { font-size: 8px; color: var(--azul-utc); text-align: left; padding: 2px 4px 0 4px; }
          .page6 .estado-label { color: var(--azul-utc); font-size: 10px; text-align: left; padding-left: 6px; }
          
          .page6 input, .page6 textarea { width: 100%; height: 100%; border: none !important; background-color: transparent !important; font-family: inherit; font-size: 10px; color: #000; text-align: center; outline: none; resize: none; padding: 2px; display: block; }
          .page6 textarea { text-align: left; padding: 2px 4px; }
          .page6 input:focus, .page6 textarea:focus { background-color: var(--azul-claro) !important; }
          
          .page6 .footer { display: flex; justify-content: flex-start; align-items: center; margin-top: 10px; z-index: 1; }
          .page6 .footer-num { font-size: 16px; font-weight: bold; color: var(--azul-utc); }
          
          .page6 .flex-t1 { flex: 0 0 42%; }
          .page6 .flex-t2 { flex: 0 0 40%; }
          .page6 .flex-t3 { flex: 1; }



          /* ==========================================================
             REGLAS DE IMPRESIÓN
             ========================================================== */
        @media print {
              .hoja-evolutiva-wrapper { background: none; padding: 0; }
              .hoja-evolutiva-wrapper .page, 
              .hoja-evolutiva-wrapper .page2, 
              .hoja-evolutiva-wrapper .page3, 
              .hoja-evolutiva-wrapper .page4, 
              .hoja-evolutiva-wrapper .page5, 
              .hoja-evolutiva-wrapper .page6 { 
                  box-shadow: none; margin: 0; page-break-after: always; height: 279.4mm; width: 215.9mm; 
              }
              input:focus, textarea:focus { background-color: transparent !important; }
              .header-azul, .page3 .t2-header, .page4 .tab-vertical { background-color: #2b5a9e !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
            <h1>utc</h1>
            <p>Universidad<br/>Tres Culturas</p>
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
                <input type="text" name="paciente_nombre" value={(formData.paciente_nombre as string) || ''} onChange={handleInputChange} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <span>Expediente</span>
                <input type="text" name="paciente_expediente" value={(formData.paciente_expediente as string) || ''} onChange={handleInputChange} />
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
                    <th className="th-fecha" style={{ width: '35%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={{ width: '13%' }}>
                        <input type="text" name={`psi_fecha_${i}`} value={(formData[`psi_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
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
                      <td className="td-label">{pregunta}</td>
                      {[1, 2, 3, 4, 5].map(col => (
                        <td key={col}><textarea name={`psi_q${idx}_col${col}`} value={(formData[`psi_q${idx}_col${col}`] as string) || ''} onChange={handleInputChange}></textarea></td>
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
                    <th className="th-fecha" style={{ width: '35%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={{ width: '13%' }}>
                        <input type="text" name={`sint_fecha_${i}`} value={(formData[`sint_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Gastritis", "Colitis", "Reflujo gastroesofágico", "Diarrea", "Estreñimiento", "Vómito", "Náuseas", "Disfagia", "Hiperfagia", "Flatulencias", "Distensión abdominal", "Hiporexia", "Escala de Bristol"].map((sintoma, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{sintoma}</td>
                      {[1, 2, 3, 4, 5].map(col => (
                        <td key={col}><input type="text" name={`sint_${idx}_col${col}`} value={(formData[`sint_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>
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
                    <th className="th-fecha" style={{ width: '35%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={{ width: '13%' }}>
                        <input type="text" name={`ejer_fecha_${i}`} value={(formData[`ejer_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Si/No", "Anaerobico/Aeróbico", "¿Cual?", "Frecuencia", "Intensidad", "Tiempo", "Volumen", "Progresion"].map((param, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{param}</td>
                      {[1, 2, 3, 4, 5].map(col => (
                        <td key={col}><input type="text" name={`ejer_${idx}_col${col}`} value={(formData[`ejer_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>
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
                    <th className="th-fecha" style={{ width: '35%' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={{ width: '13%' }}>
                        <input type="text" name={`diet_fecha_${i}`} value={(formData[`diet_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Comidas al día", "Dieta especial", "Uso de laxantes", "Medicamentos ↓ peso"].map((param, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{param}</td>
                      {[1, 2, 3, 4, 5].map(col => (
                        <td key={col}><input type="text" name={`diet_${idx}_col${col}`} value={(formData[`diet_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>
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
        <div className="watermark">inco</div>
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
                          <input type="text" name={`freq_fecha_${i}`} value={(formData[`freq_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
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
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px', fontSize: '9px' }}>
                              <input type="text" className="days-input" name={`freq_${idx}_col${col}`} value={(formData[`freq_${idx}_col${col}`] as string) || ''} onChange={handleDaysInput} maxLength={1} />
                              <span style={{ color: '#999' }}>/7</span>
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
                          <input type="text" name={`cual_fecha_${i}`} value={(formData[`cual_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
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
                          <td key={col}><input type="text" name={`cual_${idx}_col${col}`} value={(formData[`cual_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>
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
                          <input type="text" name={`p3_fecha_${i}`} value={(formData[`p3_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="section-header"><td colSpan={7}>Equivalentes (rac)</td></tr>
                    {["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"].map((row, idx) => (
                      <tr key={`eq_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`eq_${idx}_col${col}`} value={(formData[`eq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                      </tr>
                    ))}

                    <tr className="section-header"><td colSpan={7}>Contenido Nutrimental</td></tr>
                    {["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"].map((row, idx) => (
                      <tr key={`cn_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`cn_${idx}_col${col}`} value={(formData[`cn_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                      </tr>
                    ))}

                    <tr className="section-header"><td colSpan={7}>Interpretación de la ingestión actual (Dieta)</td></tr>
                    {["Energía", "Proteína", "HCO", "Lípidos"].map((row, idx) => (
                      <tr key={`int_${idx}`}>
                        <td>{row}</td>
                        {[1, 2, 3, 4, 5, 6].map(col => <td key={col}><input type="text" name={`int_${idx}_col${col}`} value={(formData[`int_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Talla: <input type="text" name="antro_talla" value={(formData.antro_talla as string) || ''} onChange={handleInputChange} style={{ width: '40px', borderBottom: '1px solid #2b5696' }} /> m</span>
                          <span>fecha</span>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map(i => <td key={i} className="t2-header">vo (✓ ↑ ↓)</td>)}
                    </tr>
                    <tr>
                      <th className="th-fecha" style={{ width: '20%', border: '1px solid #9bb3d6' }}></th>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <th key={i} style={{ padding: 0 }}>
                          <input type="text" name={`antro_fecha_${i}`} value={(formData[`antro_fecha_${i}`] as string) || ''} onChange={handleDateInput} maxLength={10} placeholder="DD/MM/AAAA" />
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
        <input type="number" step="any" name={`antro_${idx}_col${col}`} value={(formData[`antro_${idx}_col${col}`] as string) || ''} onChange={handleNumberInput} />
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
                  <th className="header-azul" style={{ width: '12%' }}>Fecha</th>
                  <th className="header-azul" style={{ width: '25%' }}>Diagnóstico Matriz<br/>IMG/IMLG</th>
                  <th className="header-azul" style={{ width: '63%', borderRight: 'none !important' }}>Interpretación antropométrica</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map(row => (
                  <tr key={row}>
                    <td><input type="text" name={`diag_fecha_${row}`} value={(formData[`diag_fecha_${row}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} /></td>
                    <td><textarea name={`diag_matriz_${row}`} value={(formData[`diag_matriz_${row}`] as string) || ''} onChange={handleInputChange}></textarea></td>
                    <td><textarea name={`diag_interp_${row}`} value={(formData[`diag_interp_${row}`] as string) || ''} onChange={handleInputChange}></textarea></td>
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
                    <th style={{ width: '35%', borderRight: 'none' }}></th>
                    {[1, 2, 3, 4, 5].map(i => <th key={i} className="header-azul" style={{ width: '10.8%' }}>vo (✓ ↑ ↓)</th>)}
                    <th className="header-azul-borderless" style={{ width: '10.8%' }}>vo (✓ ↑ ↓)</th>
                  </tr>
                  <tr style={{ height: '18px' }}>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</th>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} style={i === 6 ? { borderRight: 'none' } : {}}>
                        <input type="text" name={`sig_fecha_${i}`} value={(formData[`sig_fecha_${i}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Tensión arterial (mmHg)", "Frecuencia respiratoria (rpm)", "Frecuencia cardiaca (lpm)", "Temperatura (°C)", "SO₂"].map((sig, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{sig}</td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col} style={col === 6 ? { borderRight: 'none' } : {}}>
                          <input type="text" name={`sig_${idx}_col${col}`} value={(formData[`sig_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} />
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
                        <input type="text" name={`bioq_fecha_${i}`} value={(formData[`bioq_fecha_${i}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, idx) => (
                    <tr key={idx}>
                      <td><input type="text" name={`bioq_param_${idx}`} value={(formData[`bioq_param_${idx}`] as string) || ''} onChange={handleInputChange} /></td>
                      {[1, 2, 3, 4, 5, 6].map(col => (
                        <td key={col} style={col === 6 ? { borderRight: 'none' } : {}}>
                          <input type="text" name={`bioq_${idx}_col${col}`} value={(formData[`bioq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} />
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
                {[1, 2, 3, 4, 5].map(row => (
                  <tr key={row}>
                    <td><input type="text" name={`int_bioq_fecha_${row}`} value={(formData[`int_bioq_fecha_${row}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} /></td>
                    <td><textarea name={`int_bioq_desc_${row}`} value={(formData[`int_bioq_desc_${row}`] as string) || ''} onChange={handleInputChange}></textarea></td>
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
                        <input type="text" name={`explor_fecha_${i}`} value={(formData[`explor_fecha_${i}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} />
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
                            <input type="text" name={`explor_${idx}_col${col}`} value={(formData[`explor_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} />
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
                          name={`diag_nutri_fecha_${i}`} 
                          value={(formData[`diag_nutri_fecha_${i}`] as string) || ''} 
                          onChange={handleDateInput} 
                          placeholder="DD/MM/AAAA" 
                          maxLength={10} 
                          style={{ fontSize: '7.5px', padding: '0' }} /* <-- ESTO LO HACE PEQUEÑO */
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((diagGroup, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <React.Fragment key={diagGroup}>
                        <tr>
                          <td rowSpan={3} style={isLast ? { borderBottom: 'none !important' } : {}}>
                            <textarea name={`diag_nutri_txt_${diagGroup}`} value={(formData[`diag_nutri_txt_${diagGroup}`] as string) || ''} onChange={handleInputChange}></textarea>
                          </td>
                          <td className="estado-label">Nuevo</td>
                          {[1, 2, 3, 4, 5, 6].map(col => (
                            <td key={`nuevo_${col}`} style={col === 6 ? { borderRight: 'none !important' } : {}}>
                              <input type="text" name={`diag_nutri_${diagGroup}_nuevo_col${col}`} value={(formData[`diag_nutri_${diagGroup}_nuevo_col${col}`] as string) || ''} onChange={handleInputChange} />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="estado-label">Continuo</td>
                          {[1, 2, 3, 4, 5, 6].map(col => (
                            <td key={`cont_${col}`} style={col === 6 ? { borderRight: 'none !important' } : {}}>
                              <input type="text" name={`diag_nutri_${diagGroup}_cont_col${col}`} value={(formData[`diag_nutri_${diagGroup}_cont_col${col}`] as string) || ''} onChange={handleInputChange} />
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
                              <input type="text" name={`diag_nutri_${diagGroup}_res_col${col}`} value={(formData[`diag_nutri_${diagGroup}_res_col${col}`] as string) || ''} onChange={handleInputChange} />
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
                  <col style={{ width: '35%' }} />
                  {[1, 2, 3, 4, 5].map(i => <col key={i} style={{ width: '13%' }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={i === 5 ? { borderRight: 'none !important' } : {}}>
                        <input type="text" name={`interv_fecha_${i}`} value={(formData[`interv_fecha_${i}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} style={{ fontSize: '8px' }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="td-label">Indicación de<br/>Alimentos/Nutrimentos</td>
                    {[1, 2, 3, 4, 5].map(col => <td key={col} style={col === 5 ? { borderRight: 'none !important' } : {}}><textarea name={`interv_ind_col${col}`} value={(formData[`interv_ind_col${col}`] as string) || ''} onChange={handleInputChange}></textarea></td>)}
                  </tr>
                  <tr><td colSpan={6} className="subtitulo-p6">Contenido Nutrimental</td></tr>
                  {["Energía (kcal y kcal/kg)", "Hidrato de carbono (%/g)", "Proteína (%/g y g/kg/d)", "Lípidos (%/g)"].map((macro, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{macro}</td>
                      {[1, 2, 3, 4, 5].map(col => <td key={col} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`interv_macro_${idx}_col${col}`} value={(formData[`interv_macro_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                    </tr>
                  ))}
                  <tr><td colSpan={6} className="subtitulo-p6">Equivalentes (rac)</td></tr>
                  {["Frutas", "Verduras", "Cereales", "Leguminosas", "POAs _ _ _", "POAs _ _ _", "Lácteos", "Aceites s/p", "Aceites c/p", "Azúcares"].map((eq, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{eq}</td>
                      {[1, 2, 3, 4, 5].map(col => <td key={col} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`interv_eq_${idx}_col${col}`} value={(formData[`interv_eq_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
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
                  {[1, 2, 3, 4, 5].map(i => <col key={i} style={{ width: '4%' }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th className="header-azul">Educación Nutricional</th>
                    <th className="header-azul">Consejería Nutricional</th>
                    <th className="th-fecha" style={{ backgroundColor: 'white', borderBottom: 'var(--borde-fino)' }}>Fecha</th>
                    {[1, 2, 3, 4, 5].map(i => (
                      <th key={i} style={{ backgroundColor: 'white', borderBottom: 'var(--borde-fino)', ...(i === 5 ? { borderRight: 'none !important' } : {}) }}>
                        <input type="text" name={`edu_fecha_${i}`} value={(formData[`edu_fecha_${i}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM" maxLength={5} style={{ fontSize: '7px', padding: '0' }} />
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
                          <td rowSpan={3} style={{ padding: 0, ...(isLastBlock ? { borderBottom: 'none !important' } : {}) }}>
                            <div className="cell-flex-col">
                              <div className="cell-half"><span className="text-mini">Contenido (E-1___)</span><textarea name={`edu_cont_${rowBlock}`} value={(formData[`edu_cont_${rowBlock}`] as string) || ''} onChange={handleInputChange}></textarea></div>
                              <div className="cell-half"><span className="text-mini">Aplicación (E-2___)</span><textarea name={`edu_apl_${rowBlock}`} value={(formData[`edu_apl_${rowBlock}`] as string) || ''} onChange={handleInputChange}></textarea></div>
                            </div>
                          </td>
                          <td rowSpan={3} style={{ padding: 0, ...(isLastBlock ? { borderBottom: 'none !important' } : {}) }}>
                            <div className="cell-flex-col">
                              <div className="cell-half"><span className="text-mini">Bases/Acercamiento Teórico (C-1___)</span><textarea name={`cons_base_${rowBlock}`} value={(formData[`cons_base_${rowBlock}`] as string) || ''} onChange={handleInputChange}></textarea></div>
                              <div className="cell-half"><span className="text-mini">Estrategias (C-2___)</span><textarea name={`cons_est_${rowBlock}`} value={(formData[`cons_est_${rowBlock}`] as string) || ''} onChange={handleInputChange}></textarea></div>
                            </div>
                          </td>
                          <td className="estado-label">Logrado</td>
                          {[1, 2, 3, 4, 5].map(col => <td key={`log_${col}`} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`edu_${rowBlock}_log_col${col}`} value={(formData[`edu_${rowBlock}_log_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                        </tr>
                        <tr>
                          <td className="estado-label">Suspendida</td>
                          {[1, 2, 3, 4, 5].map(col => <td key={`sus_${col}`} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`edu_${rowBlock}_sus_col${col}`} value={(formData[`edu_${rowBlock}_sus_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                        </tr>
                        <tr>
                          <td className="estado-label" style={isLastBlock ? { borderBottom: 'none !important' } : {}}>No lograda</td>
                          {[1, 2, 3, 4, 5].map(col => <td key={`nol_${col}`} style={{ ...(isLastBlock ? { borderBottom: 'none !important' } : {}), ...(col === 5 ? { borderRight: 'none !important' } : {}) }}><input type="text" name={`edu_${rowBlock}_nol_col${col}`} value={(formData[`edu_${rowBlock}_nol_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
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
            <div className="table-wrap table-wrap-right">
              <table>
                <colgroup>
                  <col style={{ width: '35%' }} />
                  {[1, 2, 3, 4, 5].map(i => <col key={i} style={{ width: '13%' }} />)}
                </colgroup>
                <tbody>
                  <tr>
                    <td className="th-fecha" style={{ textAlign: 'right', paddingRight: '15px' }}>Fecha</td>
                    {[1, 2, 3, 4, 5].map(col => <td key={col} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`firma_fecha_col${col}`} value={(formData[`firma_fecha_col${col}`] as string) || ''} onChange={handleDateInput} placeholder="DD/MM/AAAA" maxLength={10} style={{ fontSize: '8px' }} /></td>)}
                  </tr>
                  {["PLN.", "Matrícula", "Firma", "LN.", "Céd. Prof."].map((label, idx) => (
                    <tr key={idx}>
                      <td className="td-label">{label}</td>
                      {[1, 2, 3, 4, 5].map(col => <td key={col} style={col === 5 ? { borderRight: 'none !important' } : {}}><input type="text" name={`firma_${idx}_col${col}`} value={(formData[`firma_${idx}_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
                    </tr>
                  ))}
                  <tr>
                    <td className="td-label" style={{ borderBottom: 'none !important' }}>Firma</td>
                    {[1, 2, 3, 4, 5].map(col => <td key={col} style={{ borderBottom: 'none !important', ...(col === 5 ? { borderRight: 'none !important' } : {}) }}><input type="text" name={`firma_final_col${col}`} value={(formData[`firma_final_col${col}`] as string) || ''} onChange={handleInputChange} /></td>)}
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
    );
});

export default HojaEvolutiva;