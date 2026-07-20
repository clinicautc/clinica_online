// Script de simulación real end-to-end: 7 citas de nutrición (1 primera + 6 seguimiento)
// para el paciente Enrique Rezentiz (id 7), hoy, más una 8a cita programada para mañana 9am.
// Usa la API HTTP real del backend (localhost:3001), respetando toda la lógica de negocio
// real (asignación automática, restricción de hora, bloqueo de columnas, etc).

const BASE = 'http://localhost:3001/api';

const CRED = {
  paciente: { email: 'enriquejesusresendiz@hotmail.com', password: 'Paciente1*', id: 7, nombre: 'Enrique Rezentiz' },
  master: { email: 'master@edu.utc.mx', password: 'master123' },
  practicantes: {
    22: { email: 'carlos.nutri@edu.utc.mx', password: 'practicante123', nombre: 'Carlos Nutri' },
    24: { email: 'e.resendiz.r688@edu.utc.mx', password: 'Practicante1*', nombre: 'Enrique Reyes' },
  },
};

function log(...args) { console.log(new Date().toISOString().substring(11, 19), ...args); }

async function api(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function login(email, password) {
  const r = await api('POST', '/auth/login', null, { email, password });
  return r.accessToken;
}

function hoyMexico() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}
function hoyMexicoDDMM() {
  return new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });
}
function mananaMexico() {
  const d = new Date();
  const hoy = new Date(d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  hoy.setDate(hoy.getDate() + 1);
  const yyyy = hoy.getFullYear(), mm = String(hoy.getMonth() + 1).padStart(2, '0'), dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function horaMexicoHHMM() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });
}
function horaMexicoHHMMSS() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ---------------------------------------------------------------------------
// Listas reales (copiadas de src/app/pages/captura/NutricionPrimeraConsultaCaptura.tsx)
// ---------------------------------------------------------------------------
const ENFERMEDADES_HEREDO = ['Diabetes Mellitus', 'Obesidad o sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales'];
const COLS_HEREDO = ['Madre', 'Padre', 'Aa Mat', 'Ao Mat', 'Aa Pat', 'Ao Pat'];
const ENFERMEDADES_PERSONALES = ['Diabetes Mellitus', 'Obesidad o Sobrepeso', 'Cáncer', 'Hipertensión', 'Enfermedades Renales',
  'Enfermedades Endocrinas', 'Enfermedad Tiroidea', 'Enfermedades Psiquiátricas',
  'Enfermedades Neurológicas', 'Enfermedades Autoinmunes', 'Enfermedades Gastrointestinales'];
const SINTOMAS = ['Gastritis', 'Colitis', 'Reflujo gastroesofágico', 'Diarrea', 'Estreñimiento', 'Vómito',
  'Náuseas', 'Disfagia', 'Hiperfagia', 'Flatulencias', 'Distensión abdominal', 'Hiporexia'];
const NO_PATOLOGICOS = ['Hábito tabáquico', 'Consumo de alcohol', 'Consumo de drogas'];
const ALIMENTOS_FRECUENCIA = ['Verduras', 'Frutas', 'Cereal sin grasa', 'Pan dulce natural', 'Pan dulce UP', 'Galletas', 'Leguminosas',
  'Carne de res', 'Carne de cerdo', 'Carne de pollo', 'Pavo', 'Pescados', 'Mariscos', 'Huevo',
  'Prod. animal UP', 'Quesos blancos', 'Quesos amarillos', 'Embutidos', 'Leche sin sabor', 'Yogurt sin sabor',
  'Leche UP', 'Yogurt UP', 'Oleaginosas', 'Aceites', 'Mantequilla', 'Margarina', 'Refresco',
  'Agua de sabor UP', 'Jugos naturales', 'Jugos UP', 'Helado', 'Nieve', 'Gelatinas', 'Aguas de frutas', 'Té',
  'Café', 'Agua natural', 'Papas fritas', 'Garnachas a comal', 'Garnachas fritas'];
const ANTROPOMETRIA = [
  { label: 'Talla (m)', n: 'talla', d: false }, { label: 'Peso (kg)', n: 'peso', d: false },
  { label: 'IMC (kg/m²)', n: 'imc', d: true }, { label: 'Peso ideal/PAO (kg)', n: 'peso_fao', d: false },
  { label: 'Circ. Muñeca (cm)', n: 'muneca', d: true }, { label: 'Diámetro de codo (cm)', n: 'codo', d: true },
  { label: 'Circ. Brazo (cm)', n: 'brazo', d: true }, { label: 'Circ. Abdominal (cm)', n: 'abd', d: true },
  { label: 'Circ. Cintura (cm)', n: 'cintura', d: false }, { label: 'Circ. Cadera (cm)', n: 'cadera', d: false },
  { label: 'ICC', n: 'icc', d: true }, { label: 'PCB (mm)', n: 'pcb', d: true },
  { label: 'PCT (mm)', n: 'pct', d: true }, { label: 'PCSe (mm)', n: 'pcse', d: true },
  { label: 'PCSi (mm)', n: 'pcsi', d: true }, { label: '% Grasa, Siri (%/kg)', n: 'grasa_siri', d: true },
  { label: '% Grasa, InBody (%/kg)', n: 'grasa_inb', d: true }, { label: 'IMG, con InBody (kgMG/m²)', n: 'img_inb', d: true },
  { label: 'MLG (kg)', n: 'mlg', d: false }, { label: 'IMLG, con (kgMLG/m²)', n: 'imlg', d: true },
  { label: 'cAMB (cm²)', n: 'camb', d: true }, { label: 'MMT, InBody (%/kg)', n: 'mmt_inb', d: true },
  { label: 'IMEA, con InBody (kgMM/m²)', n: 'imea_inb', d: true }, { label: 'ACT (L)', n: 'act', d: false },
  { label: 'Grasa visceral (L)', n: 'grasa_visc', d: true },
];
const SIGNOS_VITALES = ['Tensión arterial (mmHg)', 'Frecuencia respiratoria (rpm)', 'Frecuencia cardiaca (lpm)', 'Temperatura (°C)', 'SO₂'];
const HALLAZGOS_FISICOS = ['Hallazgos generales', 'Adiposidad', 'Huesos', 'Sistema cardiovascular-respiratorio', 'Sistema digestivo',
  'Edema', 'Extremidades', 'Ojos', 'Pelo', 'Cabeza', 'Manos y uñas', 'Boca', 'Músculos', 'Cuello',
  'Piel', 'Dientes', 'Garganta y deglución', 'Lengua'];
const hallazgoKey = (h) => h.replace(/\s+/g, '_').replace(/\//g, '_').toLowerCase();
const GRUPOS_PORCIONES_P3 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA ___', 'Lácteo ___', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP3 = (g) => g.replace(/\s+/g, '_').replace(/___/g, '').toLowerCase();
const GRUPOS_CALC_P4 = ['Verduras', 'Frutas', 'Cereales s/g', 'Leguminosas', 'POA', 'Lácteo', 'Aceites s/p', 'Aceites c/p', 'Azúcares'];
const grupoKeyP4 = (g) => g.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
const CALC_COLS = ['des', 'cm', 'com', 'cv', 'cena', 'rac', 'kcal', 'prot', 'lip', 'hco'];

// ---------------------------------------------------------------------------
// Construcción del payload de la Historia Clínica (cita 1, primera consulta)
// ---------------------------------------------------------------------------
function construirHistoriaClinica() {
  const p1 = {
    fecha: hoyMexicoDDMM(), nombre: 'Enrique Rezentiz', edad: 24, sexo: 'Mas', civil: 'Soltero',
    ocupacion: 'Desarrollador de software', fn: '15/03/2002', telefono: '5544332211',
    direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
    motivos: 'Acude a consulta por sobrepeso leve y deseo de mejorar hábitos alimenticios. Refiere cansancio frecuente y dificultad para mantener una rutina de ejercicio constante en los últimos meses.',
    qx: 'Sin cirugías previas relevantes. Sin tratamientos médicos activos distintos a los referidos en este historial.',
    otrasHeredo: '', otrasPersCheck: false, otrasPers: '',
    bristol: 4,
    'diag-med-0': 'Sobrepeso grado I', 'diag-med-1': '', 'diag-med-2': '', 'diag-med-3': '', 'diag-med-4': '',
    'med-nom-0': '', 'med-dos-0': '', 'med-nom-1': '', 'med-dos-1': '', 'med-nom-2': '', 'med-dos-2': '',
    'med-nom-3': '', 'med-dos-3': '', 'med-nom-4': '', 'med-dos-4': '',
    ejercicio_realiza_no: false, ejercicio_realiza_si: true, ejercicio_aerobico: true, ejercicio_anaerobico: false,
    ejercicioCual: 'Caminata y trote', frecuencia: '3 veces por semana', intensidad: 'Moderada', tiempo: '30-40 min',
    volumen: 'Bajo-moderado', progresion: 'Constante, sin incremento reciente',
    g: '', p: '', c: '', a: '', fum: '', embarazo_no: true, embarazo_si: false, sdg: '',
    hormo_no: true, hormo_si: false, hormo: '', anti_no: true, anti_si: false, anti: '',
  };
  ENFERMEDADES_HEREDO.forEach((enf) => COLS_HEREDO.forEach((_, i) => { p1[`heredo-${enf}-${i}`] = false; }));
  p1[`heredo-Obesidad o sobrepeso-0`] = true; // Madre
  p1[`heredo-Diabetes Mellitus-1`] = true; // Padre
  p1[`heredo-Hipertensión-5`] = true; // Ao Pat
  ENFERMEDADES_HEREDO.forEach((_, i) => { p1[`heredo-otras-${i}`] = false; });
  ENFERMEDADES_PERSONALES.forEach((enf) => { p1[`pers-${enf}`] = false; });
  SINTOMAS.forEach((s) => { p1[`sintoma-check-${s}`] = false; p1[`sintoma-val-${s}`] = ''; });
  p1['sintoma-check-Distensión abdominal'] = true;
  p1['sintoma-val-Distensión abdominal'] = 'Ocasional, después de comidas copiosas';
  NO_PATOLOGICOS.forEach((n) => { p1[`nopato-check-${n}`] = false; p1[`nopato-freq-${n}`] = ''; p1[`nopato-cant-${n}`] = ''; });
  p1['nopato-check-Consumo de alcohol'] = true;
  p1['nopato-freq-Consumo de alcohol'] = 'Social';
  p1['nopato-cant-Consumo de alcohol'] = '1-2 copas/semana';

  const p2 = {
    alergias_no: true, alergias_si: false, alergias_txt: '',
    intolerancias_no: true, intolerancias_si: false, intolerancias_txt: '',
    preferencias_no: false, preferencias_si: true, preferencias_txt: 'Pollo, verduras verdes, frutas cítricas',
    desagrados: 'Hígado, pescado muy graso',
    comidas_dia: 3, comidas_fuertes: 3, comidas_col: 1, quien_prepara: 'Él mismo / su pareja',
    modifico_alim_no: false, modifico_alim_si: true, modifico_alim_txt: 'Redujo refrescos y comida rápida en el último mes',
    dieta_previa_no: true, dieta_previa_si: false, dieta_previa_txt: '',
    alim_animo_no: false, alim_animo_si: true, alim_animo_txt: 'Come más cuando está estresado por el trabajo',
    laxantes_no: true, laxantes_si: false, laxantes_txt: '',
    meds_peso_no: true, meds_peso_si: false, meds_peso_txt: '',
    int_antrop: 'Paciente con sobrepeso grado I (IMC 28.7), adiposidad central aumentada (ICC 0.94), masa muscular dentro de rango normal-bajo.',
    int_bioq: 'Perfil lipídico limítrofe con triglicéridos ligeramente elevados; glucosa en ayuno normal.',
    'sol_Química Sanguínea': true, 'sol_EGO': false, 'sol_Biometría hemática': true, sol_otro: false, sol_otro_txt: '',
  };
  const freqValores = [5, 4, 2, 1, 0, 1, 3, 3, 1, 4, 1, 2, 1, 5, 0, 3, 1, 0, 4, 2, 0, 0, 2, 5, 2, 1, 3, 1, 2, 0, 1, 0, 1, 2, 3, 1, 7, 2, 1, 1];
  ALIMENTOS_FRECUENCIA.forEach((a, i) => { p2[`freq_${a}`] = freqValores[i] ?? 1; });
  const antropVals = {
    talla: 1.75, peso: 88, imc: 28.7, peso_fao: 74, muneca: 17, codo: 7, brazo: 33, abd: 98,
    cintura: 96, cadera: 102, icc: 0.94, pcb: 12, pct: 15, pcse: 20, pcsi: 18, grasa_siri: 26,
    grasa_inb: 27, img_inb: 8.5, mlg: 64, imlg: 20.9, camb: 45, mmt_inb: 42, imea_inb: 8.9, act: 38, grasa_visc: 9,
  };
  const antropInt = {
    imc: 'Sobrepeso grado I', muneca: 'Normal', codo: 'Complexión mediana', brazo: 'Ligeramente aumentado',
    abd: 'Aumentado', icc: 'Riesgo cardiovascular alto', pcb: 'Normal', pct: 'Normal', pcse: 'Normal', pcsi: 'Ligeramente aumentado',
    grasa_siri: 'Sobre rango saludable', grasa_inb: 'Sobre rango saludable', img_inb: 'Elevado', imlg: 'Normal',
    camb: 'Normal', mmt_inb: 'Normal', imea_inb: 'Normal', grasa_visc: 'Ligeramente elevada',
  };
  ANTROPOMETRIA.forEach(({ n, d }) => { p2[`antrop_${n}_vo`] = antropVals[n]; if (d) p2[`antrop_${n}_int`] = antropInt[n] || 'Dentro de rango'; });
  const svVals = { 'Tensión arterial (mmHg)': '120/80', 'Frecuencia respiratoria (rpm)': '16', 'Frecuencia cardiaca (lpm)': '76', 'Temperatura (°C)': '36.5', 'SO₂': '98' };
  SIGNOS_VITALES.forEach((s) => { p2[`sv_${s}_vo`] = svVals[s]; p2[`sv_${s}_int`] = 'Normal'; });
  const bioq = [
    ['Glucosa (mg/dL)', '92', 'Normal'], ['Colesterol Total (mg/dL)', '198', 'Limítrofe'],
    ['HDL (mg/dL)', '42', 'Bajo'], ['LDL (mg/dL)', '124', 'Limítrofe'],
    ['Triglicéridos (mg/dL)', '168', 'Elevado'], ['Hemoglobina (g/dL)', '15.2', 'Normal'],
    ['Hematocrito (%)', '45', 'Normal'], ['Creatinina (mg/dL)', '0.9', 'Normal'],
  ];
  bioq.forEach(([nom, vo, int], i) => { p2[`bq_${i}_nom`] = nom; p2[`bq_${i}_vo`] = vo; p2[`bq_${i}_int`] = int; });
  for (let i = bioq.length; i < 28; i++) { p2[`bq_${i}_nom`] = ''; p2[`bq_${i}_vo`] = ''; p2[`bq_${i}_int`] = ''; }

  const p3 = { diag_matriz_imlo_img: 'Sano metabólicamente funcional / persona físicamente activa, con obesidad preclínica leve (sin diagnósticos previos)' };
  HALLAZGOS_FISICOS.forEach((h) => {
    const k = hallazgoKey(h);
    p3[`hallazgo_${k}_desc`] = h === 'Adiposidad' ? 'Aumentada en región abdominal' : 'Sin alteraciones aparentes';
    p3[`hallazgo_${k}_den`] = h === 'Adiposidad' ? 'Exceso' : 'ESA';
  });
  p3.rec_fecha = hoyMexicoDDMM(); p3.rec_hora = '';
  const rec = [
    ['07:30', 'Avena con leche descremada y plátano (1 taza + 1 pza)'],
    ['10:30', 'Manzana (1 pza) + 10 almendras'],
    ['14:00', 'Pechuga de pollo asada, arroz, ensalada, 2 tortillas, agua natural'],
    ['17:30', 'Yogurt natural con granola'],
    ['20:30', 'Quesadillas de queso panela con salsa verde, agua de jamaica'],
  ];
  rec.forEach(([h, c], i) => { p3[`rec_hora_${i + 1}`] = h; p3[`rec_contenido_${i + 1}`] = c; });
  const porcionVals = {
    Verduras: [3, 75, 6, 0, 15], Frutas: [3, 180, 0, 0, 45], 'Cereales s/g': [6, 690, 18, 0, 138],
    Leguminosas: [1, 120, 8, 1, 20], 'POA ___': [5, 275, 35, 15, 0], 'Lácteo ___': [1, 110, 9, 6, 12],
    'Aceites s/p': [4, 180, 0, 20, 0], 'Aceites c/p': [1, 70, 3, 5, 3], Azúcares: [1, 40, 0, 0, 10],
  };
  let totE = 0, totP = 0, totL = 0, totH = 0;
  GRUPOS_PORCIONES_P3.forEach((g) => {
    const [porc, e, pr, li, hc] = porcionVals[g];
    const k = grupoKeyP3(g);
    p3[`porcion_${k}_porciones`] = porc; p3[`porcion_${k}_energia`] = e; p3[`porcion_${k}_proteina`] = pr;
    p3[`porcion_${k}_lipidos`] = li; p3[`porcion_${k}_hco`] = hc;
    totE += e; totP += pr; totL += li; totH += hc;
  });
  p3.porcion_total_porciones = 25; p3.porcion_total_energia = totE; p3.porcion_total_proteina = totP;
  p3.porcion_total_lipidos = totL; p3.porcion_total_hco = totH;

  const p4 = {
    diag: 'Sobrepeso grado I (IMC 28.7 kg/m²) con adiposidad central aumentada, sin comorbilidades metabólicas evidentes. Riesgo cardiovascular moderado por ICC elevado y triglicéridos limítrofes-altos.',
    objetivo: 'Specific: Reducir el porcentaje de grasa corporal y el perímetro de cintura. Measurable: Disminuir 5 kg de peso corporal y 4 cm de cintura en 6 consultas de seguimiento. Achievable: Plan de alimentación hipocalórico moderado + actividad física 4x/semana, factible según disponibilidad del paciente. Relevant: Reduce el riesgo cardiometabólico asociado a la obesidad central. Time-bound: Reevaluación en cada consulta de seguimiento semanal durante 6 semanas.',
    edu_cont_num: '1', edu_contenido: 'Grupos de alimentos y tamaño de porciones adecuado según el Plato del Bien Comer.',
    edu_app_num: '1', edu_aplicacion: 'Aplicar el conteo de porciones en las comidas principales usando el método del plato.',
    cons_bases_num: '1', cons_bases: 'Modelo transteórico del cambio — etapa de contemplación/preparación.',
    cons_est_num: '1', cons_estrategias: 'Establecimiento de metas SMART semanales y automonitoreo mediante diario de alimentos.',
    indicacion_1: 'Aumentar el consumo de verduras a 5 porciones al día.',
    indicacion_2: 'Sustituir refresco por agua natural o té sin azúcar.',
    indicacion_3: 'Preferir cereales integrales sobre refinados.',
    indicacion_4: 'Controlar las porciones de grasas añadidas (aceites, mantequilla).',
    req_ec_pred: false, req_ec_pred_nombre: '', req_ec_rapida: true, req_ec_rapida_peso: '74', req_ec_rapida_kcal_kg: '25', req_total_kcal: '1850',
    proteina_porc: '20', proteina_kcal: '370', proteina_g: '92', proteina_g_kg: '1.2',
    hco_porc: '50', hco_kcal: '925', hco_g: '231', hco_g_kg: '3.1',
    lipidos_porc: '30', lipidos_kcal: '555', lipidos_g: '62', lipidos_g_kg: '0.8',
    total_kcal: '1850', total_g: '385',
    menu_desayuno: 'Avena con leche descremada, plátano y canela',
    menu_cm: 'Manzana con 10 almendras',
    menu_comida: 'Pechuga de pollo asada, arroz integral, ensalada verde, 2 tortillas de maíz',
    menu_cv: 'Yogurt natural con granola sin azúcar',
    menu_cena: 'Quesadillas de queso panela con salsa verde y agua de jamaica sin azúcar',
    firma_alumno: 'Enrique Reyes — Matrícula 123654852',
    firma_docente: 'Mónica Amanche — Docente responsable de Nutrición',
  };
  const calcDist = {
    Verduras: [1, 1, 1, 0, 0], Frutas: [1, 0, 1, 1, 0], 'Cereales s/g': [1, 1, 2, 0, 1],
    Leguminosas: [0, 0, 1, 0, 0], POA: [1, 0, 2, 1, 1], Lácteo: [1, 0, 0, 1, 0],
    'Aceites s/p': [1, 1, 1, 1, 1], 'Aceites c/p': [0, 0, 1, 0, 0], Azúcares: [0, 0, 0, 0, 1],
  };
  const calcNutr = { Verduras: [75, 6, 0, 15], Frutas: [180, 0, 0, 45], 'Cereales s/g': [690, 18, 0, 138], Leguminosas: [120, 8, 1, 20], POA: [275, 35, 15, 0], Lácteo: [110, 9, 6, 12], 'Aceites s/p': [180, 0, 20, 0], 'Aceites c/p': [70, 3, 5, 3], Azúcares: [40, 0, 0, 10] };
  GRUPOS_CALC_P4.forEach((g) => {
    const k = grupoKeyP4(g);
    const [des, cm, com, cv, cena] = calcDist[g];
    const rac = des + cm + com + cv + cena;
    const [kcal, prot, lip, hco] = calcNutr[g];
    const vals = { des, cm, com, cv, cena, rac, kcal, prot, lip, hco };
    CALC_COLS.forEach((c) => { p4[`calc_${k}_${c}`] = vals[c]; });
  });
  p4.calc_total_kcal = '1850'; p4.calc_total_prot = '92'; p4.calc_total_lip = '62'; p4.calc_total_hco = '231';
  p4.calc_adec_kcal = '100'; p4.calc_adec_prot = '99'; p4.calc_adec_lip = '101'; p4.calc_adec_hco = '99';

  return { pagina_1: p1, pagina_2: p2, pagina_3: p3, pagina_4: p4 };
}

// ---------------------------------------------------------------------------
// Construcción del payload de Seguimiento Nutricional (columna N, citas 2-7)
// ---------------------------------------------------------------------------
const BIOQ_PARAMS = ['Glucosa (mg/dL)', 'Colesterol Total (mg/dL)', 'HDL (mg/dL)', 'LDL (mg/dL)', 'Triglicéridos (mg/dL)', 'Hemoglobina (g/dL)', 'Hematocrito (%)', 'Creatinina (mg/dL)', 'Ácido úrico (mg/dL)', 'TSH (uUI/mL)'];

function construirSeguimiento(col, visita) {
  const c = {};
  const fecha = hoyMexicoDDMM();
  c.paciente_nombre = 'Enrique Rezentiz';
  c.antro_talla = '1.75';
  BIOQ_PARAMS.forEach((p, i) => { c[`bioq_param_${i}`] = p; });

  c[`psi_fecha_${col}`] = fecha;
  visita.psi.forEach((v, i) => { c[`psi_q${i}_col${col}`] = v; });

  c[`sint_fecha_${col}`] = fecha;
  visita.sint.forEach((v, i) => { c[`sint_${i}_col${col}`] = v; });

  c[`ejer_fecha_${col}`] = fecha;
  visita.ejer.forEach((v, i) => { c[`ejer_${i}_col${col}`] = v; });

  c[`diet_fecha_${col}`] = fecha;
  visita.diet.forEach((v, i) => { c[`diet_${i}_col${col}`] = v; });

  c[`freq_fecha_${col}`] = fecha;
  visita.freq.forEach((v, i) => { c[`freq_${i}_col${col}`] = v; });

  c[`cual_fecha_${col}`] = fecha;
  visita.cual.forEach((v, i) => { c[`cual_${i}_col${col}`] = v; });

  c[`p3_fecha_${col}`] = fecha;
  visita.eq.forEach((v, i) => { c[`eq_${i}_col${col}`] = v; });
  visita.cn.forEach((v, i) => { c[`cn_${i}_col${col}`] = v; });
  visita.interp.forEach((v, i) => { c[`int_${i}_col${col}`] = v; });

  c[`antro_fecha_${col}`] = fecha;
  visita.antro.forEach((v, i) => { c[`antro_${i}_col${col}`] = v; });

  c[`sig_fecha_${col}`] = fecha;
  visita.sig.forEach((v, i) => { c[`sig_${i}_col${col}`] = v; });

  c[`diag_fecha_${col}`] = fecha;
  c[`diag_matriz_${col}`] = visita.diagMatriz;
  c[`diag_interp_${col}`] = visita.diagInterp;

  c[`bioq_fecha_${col}`] = fecha;
  visita.bioq.forEach((v, i) => { c[`bioq_${i}_col${col}`] = v; });

  c[`int_bioq_fecha_${col}`] = fecha;
  c[`int_bioq_desc_${col}`] = visita.intBioq;

  c[`explor_fecha_${col}`] = fecha;
  visita.explor.forEach((v, i) => { c[`explor_${i}_col${col}`] = v; });

  c[`diag_nutri_fecha_${col}`] = fecha;
  visita.diagNutri.forEach((estado, i) => {
    c[`diag_nutri_${i + 1}_nuevo_col${col}`] = estado === 'nuevo';
    c[`diag_nutri_${i + 1}_cont_col${col}`] = estado === 'cont';
    c[`diag_nutri_${i + 1}_res_col${col}`] = estado === 'res';
  });
  c.diag_nutri_txt_1 = 'Sobrepeso grado I (IMC inicial 28.7 kg/m²), en tratamiento nutricional activo.';
  c.diag_nutri_txt_2 = 'Adiposidad central aumentada (ICC elevado al inicio del tratamiento).';
  c.diag_nutri_txt_3 = ''; c.diag_nutri_txt_4 = ''; c.diag_nutri_txt_5 = '';

  c[`interv_fecha_${col}`] = fecha;
  c[`interv_ind_col${col}`] = visita.intervInd;
  visita.intervMacro.forEach((v, i) => { c[`interv_macro_${i}_col${col}`] = v; });
  visita.eq.forEach((v, i) => { c[`interv_eq_${i}_col${col}`] = v; });

  c[`edu_fecha_${col}`] = fecha;
  visita.edu.forEach((estado, i) => {
    c[`edu_${i + 1}_log_col${col}`] = estado === 'log';
    c[`edu_${i + 1}_sus_col${col}`] = estado === 'sus';
    c[`edu_${i + 1}_nol_col${col}`] = estado === 'nol';
  });
  c.edu_cont_1 = 'Grupos de alimentos y tamaño de porciones adecuado según el Plato del Bien Comer.';
  c.edu_apl_1 = 'Aplicar el conteo de porciones en las comidas principales usando el método del plato.';
  c.cons_base_1 = 'Modelo transteórico del cambio.';
  c.cons_est_1 = 'Metas SMART semanales y automonitoreo con diario de alimentos.';
  c.edu_cont_2 = ''; c.edu_apl_2 = ''; c.cons_base_2 = ''; c.cons_est_2 = '';
  c.edu_cont_3 = ''; c.edu_apl_3 = ''; c.cons_base_3 = ''; c.cons_est_3 = '';
  c.edu_cont_4 = ''; c.edu_apl_4 = ''; c.cons_base_4 = ''; c.cons_est_4 = '';
  c.edu_cont_5 = ''; c.edu_apl_5 = ''; c.cons_base_5 = ''; c.cons_est_5 = '';

  c[`firma_fecha_col${col}`] = fecha;
  c[`firma_0_col${col}`] = 'PLN. Enrique Reyes';
  c[`firma_1_col${col}`] = '123654852';
  c[`firma_2_col${col}`] = 'Enrique Reyes';
  c[`firma_3_col${col}`] = 'LN. Mónica Amanche';
  c[`firma_4_col${col}`] = 'NUT12345';
  c[`firma_final_col${col}`] = 'Enrique Reyes';

  return c;
}

// Narrativa de 6 visitas de seguimiento — pérdida de peso progresiva coherente.
const VISITAS = [
  { // columna 1
    psi: ['Me sentí motivado pero un poco ansioso por los cambios en mi rutina.', 'Sentí más motivación que frustración; me costó al principio dejar el refresco.', 'El plan se adaptó razonablemente bien, aunque generó algo de estrés en comidas fuera de casa.', 'Sí, me sentí orgulloso de reducir el refresco casi por completo.', 'Mejoró un poco mi ánimo al ver los primeros cambios en energía.'],
    sint: ['No', 'No', 'No', 'No', 'Ocasional', 'No', 'No', 'No', 'No', 'No', 'Leve, después de comidas copiosas', 'No', '4'],
    ejer: ['Sí', 'Aeróbico', 'Caminata/Trote', '3x/semana', 'Moderada', '30-40 min', 'Bajo-moderado', 'Inicial'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [5, 4, 2, 1, 0, 1, 3, 3, 1, 4, 1, 2, 1, 5, 0, 3, 1, 0, 4, 2, 0, 0, 2, 5, 2, 1, 2, 2, 2, 0, 1, 0, 1, 2, 3, 1, 7, 1, 1, 1],
    cual: ['Sí', 'Sí', 'Sí', 'Parcial', 'Sí'],
    eq: [3, 3, 6, 1, 5, 1, 4, 1, 1, 1], cn: ['1850 kcal / 21 kcal/kg', '50% / 231g', '20% / 92g / 1.2 g/kg/d', '30% / 62g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 88, 28.7, 74, 17, 33, 98, 96, 102, 0.94, 12, 15, 20, 18, 26, 27, 8.5, 64, 20.9, 45, 42, 8.9, 38],
    sig: ['120/80', '16', '76', '36.5', '98'],
    diagMatriz: 'Obesidad preclínica (sin Dx previos)', diagInterp: 'Adiposidad central aumentada, riesgo cardiovascular moderado.',
    bioq: [92, 198, 42, 124, 168, 15.2, 45, 0.9, 5.8, 2.1],
    intBioq: 'Perfil lipídico limítrofe, triglicéridos ligeramente elevados. Glucosa normal.',
    explor: ['ESA', 'Adiposidad aumentada en abdomen', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['nuevo', 'nuevo', '', '', ''],
    intervInd: 'Plan hipocalórico moderado (1850 kcal), aumentar verduras, reducir azúcares simples.',
    intervMacro: ['1850 kcal / 21 kcal/kg', '50% / 231g', '20% / 92g', '30% / 62g'],
    edu: ['nol', '', '', '', ''],
  },
  { // columna 2
    psi: ['Me sentí más tranquilo esta semana, ya con la rutina establecida.', 'Predominó la motivación al ver resultados en la báscula.', 'Se adaptó mejor a mi estilo de vida, menos estrés que la semana pasada.', 'Sí, orgulloso de mantener el ejercicio 3 veces por semana.', 'Mi ánimo mejoró notablemente, más energía durante el día.'],
    sint: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', '4'],
    ejer: ['Sí', 'Aeróbico', 'Caminata/Trote', '4x/semana', 'Moderada', '40 min', 'Moderado', 'Ascendente'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [5, 5, 3, 1, 0, 1, 3, 3, 1, 4, 1, 2, 1, 5, 0, 3, 1, 0, 5, 3, 0, 0, 2, 5, 2, 1, 1, 2, 3, 0, 0, 0, 1, 2, 3, 1, 7, 1, 0, 0],
    cual: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'],
    eq: [3, 4, 6, 1, 5, 1, 4, 1, 1, 1], cn: ['1800 kcal / 20.5 kcal/kg', '50% / 225g', '21% / 94g / 1.2 g/kg/d', '29% / 58g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 86.5, 28.2, 74, 17, 32.5, 96, 95, 101, 0.93, 12, 14.5, 19, 17.5, 25.3, 26, 8.2, 63.5, 20.5, 44, 42.5, 8.7, 37, 8.7],
    sig: ['118/78', '16', '74', '36.5', '98'],
    diagMatriz: 'Obesidad preclínica (sin Dx previos)', diagInterp: 'Ligera mejoría en adiposidad central respecto a la valoración inicial.',
    bioq: [90, 195, 43, 120, 155, 15.1, 44, 0.9, 5.7, 2.0],
    intBioq: 'Triglicéridos en descenso, resto del perfil dentro de rango.',
    explor: ['ESA', 'Ligeramente disminuida', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['cont', 'cont', '', '', ''],
    intervInd: 'Se mantiene plan hipocalórico, se incrementa ligeramente la actividad física a 4x/semana.',
    intervMacro: ['1800 kcal / 20.5 kcal/kg', '50% / 225g', '21% / 94g', '29% / 58g'],
    edu: ['log', '', '', '', ''],
  },
  { // columna 3
    psi: ['Semana estable, sin cambios emocionales notables.', 'Motivación sostenida, ya es parte de mi rutina.', 'Buena adaptación, ya no genera estrés.', 'Sí, cumplí el 100% de mis comidas planeadas.', 'Ánimo estable y positivo.'],
    sint: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', '4'],
    ejer: ['Sí', 'Aeróbico', 'Trote/Bicicleta', '4x/semana', 'Moderada-alta', '45 min', 'Moderado', 'Ascendente'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [6, 5, 3, 1, 0, 0, 3, 3, 1, 4, 1, 2, 1, 5, 0, 2, 1, 0, 5, 3, 0, 0, 2, 5, 1, 1, 1, 1, 3, 0, 0, 0, 0, 2, 3, 1, 7, 0, 0, 0],
    cual: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'],
    eq: [3, 4, 6, 1, 5, 1, 3, 1, 1, 1], cn: ['1750 kcal / 20 kcal/kg', '50% / 219g', '21% / 92g / 1.2 g/kg/d', '29% / 56g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 85, 27.8, 74, 16.8, 32, 94, 93.5, 100.5, 0.93, 11.5, 14, 18.5, 17, 24.6, 25.2, 7.9, 63, 20.2, 43.5, 43, 8.6, 37.5, 8.6],
    sig: ['118/78', '15', '72', '36.4', '98'],
    diagMatriz: 'Obesidad preclínica en resolución', diagInterp: 'Continúa la reducción de adiposidad central, ICC en descenso.',
    bioq: [89, 190, 44, 116, 140, 15.0, 44, 0.9, 5.6, 2.0],
    intBioq: 'Triglicéridos casi normalizados, perfil lipídico en mejora sostenida.',
    explor: ['ESA', 'En disminución', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['cont', 'cont', '', '', ''],
    intervInd: 'Se mantiene plan; se introduce variedad de cereales integrales.',
    intervMacro: ['1750 kcal / 20 kcal/kg', '50% / 219g', '21% / 92g', '29% / 56g'],
    edu: ['log', '', '', '', ''],
  },
  { // columna 4
    psi: ['Muy motivado, notando cambios físicos visibles.', 'Motivación alta, ya casi no hay frustración.', 'El plan ya es parte natural de mi día a día.', 'Sí, orgulloso de haber bajado 3 kg acumulados.', 'Ánimo notablemente mejor, más seguridad en mí mismo.'],
    sint: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', '4'],
    ejer: ['Sí', 'Aeróbico', 'Trote/Bicicleta', '4x/semana', 'Alta', '45-50 min', 'Moderado-alto', 'Ascendente'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [6, 5, 3, 0, 0, 0, 3, 3, 1, 4, 1, 2, 1, 5, 0, 2, 1, 0, 5, 3, 0, 0, 2, 5, 1, 0, 1, 1, 3, 0, 0, 0, 0, 2, 3, 1, 7, 0, 0, 0],
    cual: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'],
    eq: [4, 4, 6, 1, 5, 1, 3, 1, 0, 1], cn: ['1700 kcal / 19.7 kcal/kg', '51% / 217g', '22% / 94g / 1.2 g/kg/d', '28% / 53g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 83.8, 27.4, 74, 16.6, 31.5, 92, 92, 99.5, 0.92, 11, 13.5, 17.5, 16.5, 23.9, 24.5, 7.6, 62.8, 19.8, 43, 43.3, 8.6, 38, 8.4],
    sig: ['116/76', '15', '72', '36.4', '98'],
    diagMatriz: 'Sano, metabólicamente funcional (mejora sostenida)', diagInterp: 'Adiposidad central en descenso continuo, ICC cerca del rango normal.',
    bioq: [88, 185, 45, 112, 130, 14.9, 44, 0.9, 5.5, 1.9],
    intBioq: 'Perfil lipídico dentro de rango normal, mejora consistente respecto al basal.',
    explor: ['ESA', 'En disminución notable', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['cont', 'cont', '', '', ''],
    intervInd: 'Ajuste calórico leve a la baja acorde a nuevo peso; se mantiene distribución de macronutrimentos.',
    intervMacro: ['1700 kcal / 19.7 kcal/kg', '51% / 217g', '22% / 94g', '28% / 53g'],
    edu: ['log', '', '', '', ''],
  },
  { // columna 5
    psi: ['Muy satisfecho con el progreso, rutina totalmente consolidada.', 'Motivación alta y constante.', 'El plan se adapta perfectamente a mi estilo de vida actual.', 'Sí, mucho, ya llevo 4.5 kg de pérdida acumulada.', 'Ánimo muy positivo, mejor autoestima.'],
    sint: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', '3'],
    ejer: ['Sí', 'Aeróbico', 'Trote/Bicicleta/Pesas', '5x/semana', 'Alta', '50 min', 'Alto', 'Ascendente'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [6, 5, 3, 0, 0, 0, 3, 3, 1, 4, 1, 2, 1, 5, 0, 2, 1, 0, 5, 3, 0, 0, 2, 4, 1, 0, 0, 1, 3, 0, 0, 0, 0, 2, 3, 1, 7, 0, 0, 0],
    cual: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'],
    eq: [4, 4, 5, 1, 5, 1, 3, 1, 0, 1], cn: ['1650 kcal / 19.5 kcal/kg', '51% / 210g', '22% / 91g / 1.2 g/kg/d', '27% / 50g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 82.6, 27.0, 74, 16.5, 31, 90, 90.5, 99, 0.91, 10.5, 13, 17, 16, 23.3, 23.9, 7.3, 62.7, 19.5, 42.5, 43.5, 8.6, 38.3, 8.2],
    sig: ['116/76', '15', '70', '36.4', '98'],
    diagMatriz: 'Sano, metabólicamente funcional', diagInterp: 'ICC dentro de rango normal-alto, adiposidad central casi resuelta.',
    bioq: [87, 178, 46, 105, 118, 14.9, 44, 0.9, 5.3, 1.9],
    intBioq: 'Perfil lipídico normal en todos los parámetros evaluados.',
    explor: ['ESA', 'Distribución normal', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['cont', 'cont', '', '', ''],
    intervInd: 'Transición gradual a fase de mantenimiento con leve incremento calórico controlado.',
    intervMacro: ['1650 kcal / 19.5 kcal/kg', '51% / 210g', '22% / 91g', '27% / 50g'],
    edu: ['log', '', '', '', ''],
  },
  { // columna 6 — cierre de ciclo, diagnóstico resuelto
    psi: ['Muy contento con el resultado final de estas 6 semanas.', 'Motivación total, el cambio de hábitos ya es permanente.', 'El plan se convirtió en mi forma normal de comer, sin esfuerzo ni estrés.', 'Sí, mucho, cerré con 6 kg de pérdida total y hábitos consolidados.', 'Ánimo excelente, mejoró mi confianza y calidad de vida en general.'],
    sint: ['No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No', '3'],
    ejer: ['Sí', 'Aeróbico', 'Trote/Bicicleta/Pesas', '5x/semana', 'Alta', '50-60 min', 'Alto', 'Consolidado'],
    diet: ['3 comidas + 1 colación', 'No', 'No', 'No'],
    freq: [6, 5, 3, 0, 0, 0, 3, 3, 1, 4, 1, 2, 1, 5, 0, 2, 1, 0, 5, 3, 0, 0, 2, 4, 1, 0, 0, 0, 3, 0, 0, 0, 0, 2, 3, 1, 7, 0, 0, 0],
    cual: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'],
    eq: [4, 4, 5, 1, 5, 1, 3, 1, 0, 1], cn: ['1700 kcal (mantenimiento) / 20.6 kcal/kg', '50% / 213g', '22% / 94g / 1.2 g/kg/d', '28% / 53g'],
    interp: ['Suficiente', 'Adecuado', 'Adecuado', 'Adecuado'],
    antro: [1.75, 82, 26.8, 74, 16.5, 30.5, 89, 89.5, 98.5, 0.90, 10.5, 12.5, 16.5, 15.5, 22.8, 23.4, 7.1, 62.9, 19.3, 42.3, 43.8, 8.7, 38.5, 8.0],
    sig: ['114/74', '15', '70', '36.4', '98'],
    diagMatriz: 'Sano, metabólicamente funcional (sin Dx previos)', diagInterp: 'Composición corporal normalizada, ICC dentro de rango saludable. Cierre de ciclo de seguimiento.',
    bioq: [86, 172, 47, 100, 108, 14.9, 44, 0.9, 5.2, 1.8],
    intBioq: 'Perfil bioquímico normal en todos los parámetros; resolución del riesgo cardiometabólico inicial.',
    explor: ['ESA', 'Distribución normal', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA', 'ESA'],
    diagNutri: ['res', 'res', '', '', ''],
    intervInd: 'Plan de mantenimiento a largo plazo; educación nutricional consolidada, alta del ciclo de seguimiento intensivo.',
    intervMacro: ['1700 kcal (mantenimiento) / 20.6 kcal/kg', '50% / 213g', '22% / 94g', '28% / 53g'],
    edu: ['log', '', '', '', ''],
  },
];

// ---------------------------------------------------------------------------
// Orquestación principal
// ---------------------------------------------------------------------------
async function main() {
  log('== Simulación real de 8 citas de nutrición para Enrique Rezentiz (id 7) ==');

  const tokenMaster = await login(CRED.master.email, CRED.master.password);
  const hoy = hoyMexico();
  log('Fecha hoy (México):', hoy);

  log('Registrando asistencia de practicantes de nutrición (con variación de faltas)...');
  await api('POST', '/asistencia', tokenMaster, {
    fecha: hoy,
    registros: [
      { usuario_id: 22, estado: 'presente' }, // Carlos Nutri
      { usuario_id: 24, estado: 'presente' }, // Enrique Reyes
      { usuario_id: 12, estado: 'ausente' },  // David Alejandro
      { usuario_id: 28, estado: 'ausente' },  // Abraham Alejandro
    ],
  });
  log('Asistencia registrada: Carlos y Enrique presentes; David y Abraham ausentes.');

  const resultados = [];

  for (let n = 1; n <= 7; n++) {
    const tokenPaciente = await login(CRED.paciente.email, CRED.paciente.password);
    const hora = horaMexicoHHMM();
    log(`--- Cita ${n}: agendando para hoy ${hora} ---`);

    const citaCreada = await api('POST', '/citas', tokenPaciente, {
      paciente_id: CRED.paciente.id,
      paciente_nombre: CRED.paciente.nombre,
      tipo: 'nutricion',
      fecha: hoy,
      hora,
    });
    const citaId = citaCreada.id;
    const practicanteId = citaCreada.practicante_id;
    log(`Cita ${citaId} creada. Auto-asignada a practicante_id=${practicanteId} (${citaCreada.practicante_nombre})`);

    const cred = CRED.practicantes[practicanteId];
    if (!cred) throw new Error(`No tengo credenciales para el practicante_id ${practicanteId}. Asistencia no filtró correctamente.`);

    const tokenPract = await login(cred.email, cred.password);

    const iniciada = await api('PATCH', `/citas/${citaId}/iniciar`, tokenPract);
    log(`Cita ${citaId} iniciada. tipo_consulta=${iniciada.tipo_consulta}`);

    if (iniciada.tipo_consulta === 'primera') {
      log('Subiendo consentimiento informado (PDF real)...');
      const fs = require('fs');
      const b64 = fs.readFileSync('C:/Users/thega/AppData/Local/Temp/claude/C--Users-thega-Documents-Projects-clinica-online/7eba86f8-f937-405c-b022-85a94c274ca3/scratchpad/consentimiento_b64.txt', 'utf8');
      await api('POST', `/citas/${citaId}/consentimiento`, tokenPract, { archivo: b64, mimeType: 'application/pdf' });

      log('Guardando Historia Clínica Nutricional completa...');
      const datos = construirHistoriaClinica();
      await api('POST', '/historiales', tokenPract, {
        paciente_id: CRED.paciente.id,
        paciente_nombre: CRED.paciente.nombre,
        tipo: 'nutricion',
        datos,
        creado_por: practicanteId,
        creado_por_nombre: cred.nombre,
        appointment_id: citaId,
        duracion_carga: 1200,
        timestamp_inicio: new Date().toISOString(),
      });
    } else {
      const { columnaActual } = await api('GET', `/seguimiento-nutricional/${citaId}`, tokenPract);
      log(`Columna calculada por el sistema: ${columnaActual}`);
      const visita = VISITAS[columnaActual - 1];
      const cuadro = construirSeguimiento(columnaActual, visita);
      log('Guardando Seguimiento Nutricional (columna ' + columnaActual + ')...');
      await api('PUT', `/seguimiento-nutricional/${citaId}`, tokenPract, { cuadro_evolucion: cuadro });
    }

    await api('PATCH', `/citas/${citaId}/finalizar`, tokenPract);
    log(`Cita ${citaId} finalizada (completada).`);

    resultados.push({ n, citaId, practicanteId, practicanteNombre: cred.nombre, tipo_consulta: iniciada.tipo_consulta });
  }

  // Cita 8: mañana 9am, solo programada, sin atender.
  const tokenPaciente = await login(CRED.paciente.email, CRED.paciente.password);
  const manana = mananaMexico();
  log(`--- Cita 8: agendando para mañana ${manana} 09:00, queda solo programada ---`);
  const cita8 = await api('POST', '/citas', tokenPaciente, {
    paciente_id: CRED.paciente.id,
    paciente_nombre: CRED.paciente.nombre,
    tipo: 'nutricion',
    fecha: manana,
    hora: '09:00',
  });
  log(`Cita 8 (id ${cita8.id}) creada para mañana 09:00, auto-asignada a ${cita8.practicante_nombre || 'pendiente'}, estado=${cita8.estado}`);

  log('\n== RESUMEN ==');
  resultados.forEach((r) => log(`Cita ${r.n} (id ${r.citaId}) — ${r.tipo_consulta} — atendida por ${r.practicanteNombre}`));
  log(`Cita 8 (id ${cita8.id}) — programada para ${manana} 09:00, sin atender`);
  log('Listo.');
}

main().catch((err) => { console.error('FALLO:', err); process.exit(1); });
