const fs = require('fs');
const actual = require('./historial_72_current_full.json');

const nuevosP1 = {
  'med-nom-0': 'Complejo B',
  'med-dos-0': '1 tableta cada 24 h',
  'med-nom-1': 'Omega 3 (aceite de pescado)',
  'med-dos-1': '1000 mg cada 24 h',
  'med-nom-2': 'Vitamina D3',
  'med-dos-2': '2000 UI cada 24 h',
  'med-nom-3': 'Paracetamol (uso ocasional)',
  'med-dos-3': '500 mg cada 8 h PRN dolor',
  'med-nom-4': 'Loratadina (uso ocasional)',
  'med-dos-4': '10 mg cada 24 h PRN rinitis alérgica',
  'otrasPers': 'Sin otros antecedentes personales patológicos relevantes a los ya señalados.',
  'otrasHeredo': 'Abuela materna con hipotiroidismo diagnosticado en la quinta década de la vida.',
  'diag-med-3': 'Vitamina D sérica en rango insuficiente, a valorar con perfil bioquímico de control.',
  'diag-med-4': 'Sedentarismo relativo con actividad física por debajo de la recomendación semanal previa al inicio del plan.',
  'sintoma-val-Colitis': 'Niega',
  'sintoma-val-Diarrea': 'Niega, hábito intestinal regular',
  'sintoma-val-Vómito': 'Niega',
  'sintoma-val-Disfagia': 'Niega',
  'sintoma-val-Náuseas': 'Niega',
  'sintoma-val-Gastritis': 'Niega',
  'sintoma-val-Hiporexia': 'Niega, apetito conservado',
  'sintoma-val-Hiperfagia': 'Niega',
  'sintoma-val-Flatulencias': 'Ocasionales, sin relación aparente con alimentos',
  'sintoma-val-Estreñimiento': 'Niega',
  'sintoma-val-Reflujo gastroesofágico': 'Niega',
  'nopato-cant-Consumo de drogas': '0',
  'nopato-freq-Consumo de drogas': 'Negado',
  'nopato-cant-Hábito tabáquico': '0',
  'nopato-freq-Hábito tabáquico': 'Negado',
};

const bqExtra = [
  ['TSH (µUI/mL)', '2.8', 'Normal'],
  ['T4 Libre (ng/dL)', '1.2', 'Normal'],
  ['Sodio (mEq/L)', '140', 'Normal'],
  ['Potasio (mEq/L)', '4.2', 'Normal'],
  ['Cloro (mEq/L)', '102', 'Normal'],
  ['AST/TGO (U/L)', '22', 'Normal'],
  ['ALT/TGP (U/L)', '28', 'Normal'],
  ['Fosfatasa alcalina (U/L)', '78', 'Normal'],
  ['Bilirrubina total (mg/dL)', '0.6', 'Normal'],
  ['Urea (mg/dL)', '28', 'Normal'],
  ['Ácido úrico (mg/dL)', '5.8', 'Limítrofe'],
  ['BUN (mg/dL)', '13', 'Normal'],
  ['Proteínas totales (g/dL)', '7.1', 'Normal'],
  ['Albúmina (g/dL)', '4.3', 'Normal'],
  ['Vitamina D 25-OH (ng/mL)', '22', 'Insuficiente'],
  ['Vitamina B12 (pg/mL)', '410', 'Normal'],
  ['Ferritina (ng/mL)', '65', 'Normal'],
  ['Hierro sérico (µg/dL)', '85', 'Normal'],
  ['Insulina en ayuno (µU/mL)', '14.5', 'Elevada'],
  ['HOMA-IR', '3.3', 'Resistencia a la insulina'],
];
const nuevosP2 = {
  alergias_txt: 'No refiere alergias a medicamentos ni alimentos conocidas.',
  laxantes_txt: 'No refiere uso de laxantes ni suplementos para el tránsito intestinal.',
  sol_otro_txt: 'No se solicitan estudios adicionales por el momento.',
  meds_peso_txt: 'No ha utilizado medicamentos ni suplementos específicos para pérdida de peso previamente.',
  dieta_previa_txt: 'No ha seguido dietas o planes de alimentación estructurados previos a esta valoración.',
  intolerancias_txt: 'No refiere intolerancias alimentarias identificadas.',
};
bqExtra.forEach(([nom, vo, int], idx) => {
  const i = idx + 8;
  nuevosP2[`bq_${i}_nom`] = nom;
  nuevosP2[`bq_${i}_vo`] = vo;
  nuevosP2[`bq_${i}_int`] = int;
});

const nuevosP4 = {
  req_ec_pred_nombre: 'Mifflin-St Jeor',
};

const datos = actual.datos;
Object.assign(datos.pagina_1, nuevosP1);
Object.assign(datos.pagina_2, nuevosP2);
Object.assign(datos.pagina_4, nuevosP4);

fs.writeFileSync('historial_72_datos_completo.json', JSON.stringify(datos, null, 2));

// Verificación: ya no debe haber ningún vacío
let totalVacios = 0;
for (const p of Object.keys(datos)) {
  for (const [k, v] of Object.entries(datos[p])) {
    if (v === '' || v === null || v === undefined) { console.log('AUN VACIO:', p, k); totalVacios++; }
  }
}
console.log('Total campos aun vacios:', totalVacios);
console.log('Conteo por pagina:', Object.keys(datos).map(p => `${p}:${Object.keys(datos[p]).length}`));
