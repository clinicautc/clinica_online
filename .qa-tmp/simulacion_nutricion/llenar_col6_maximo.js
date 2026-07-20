const fs = require('fs');
const path = require('path');

const cap = JSON.parse(fs.readFileSync(path.join(__dirname, 'capacidad_col6.json'), 'utf8'));
const cortar = (txt, max) => (max == null ? txt : txt.length <= max ? txt : txt.slice(0, max));

const FECHA = '18/07/2026';
const COL = 6;

// Fuente de texto clínico real más largo que la caja, para que al recortarlo
// se vea exactamente dónde está el límite medido (ocupando el máximo).
const psiSrc = [
  'Muy contento con el resultado final de estas seis semanas de tratamiento nutricional',
  'Motivacion total, el cambio de habitos alimenticios ya es permanente en mi rutina',
  'El plan se convirtio en mi forma normal de comer, sin esfuerzo ni estres adicional',
  'Si, mucho, cerre con seis kilogramos de perdida total y habitos consolidados',
  'Animo excelente, mejoro mi confianza y calidad de vida en general notablemente',
];
const sintSrc = [
  'No presenta actualmente ningun sintoma gastrointestinal relevante',
  'No refiere colitis ni molestias digestivas en las ultimas semanas',
  'No presenta reflujo gastroesofagico en el periodo evaluado',
  'No refiere episodios de diarrea durante el seguimiento',
  'No refiere estrenimiento en las ultimas consultas registradas',
  'No presenta vomito ni nauseas durante el tratamiento',
  'No refiere nauseas en ninguna de las consultas recientes',
  'No presenta disfagia ni dificultad para tragar alimentos',
  'No refiere hiperfagia ni episodios de atracon alimentario',
  'No presenta flatulencias excesivas en el periodo evaluado',
  'No refiere distension abdominal en las ultimas semanas',
  'No presenta hiporexia, mantiene apetito normal y estable',
  'Escala de Bristol tipo tres, consistencia normal y saludable',
];
const ejerSrc = [
  'Si realiza ejercicio de forma constante y regular cada semana',
  'Combina entrenamiento aerobico y anaerobico de fuerza muscular',
  'Trote, bicicleta y pesas de fuerza como actividades principales',
  'Frecuencia de cinco veces por semana de forma consistente',
  'Intensidad alta, bien tolerada segun reporte del paciente',
  'Tiempo de cincuenta a sesenta minutos por sesion de entrenamiento',
  'Volumen alto, acorde a su condicion fisica actual mejorada',
  'Progresion consolidada tras seis semanas de entrenamiento',
];
const dietSrc = [
  'Tres comidas principales mas una colacion a media manana',
  'No requiere dieta especial ni restriccion alimentaria adicional',
  'No hace uso de laxantes en ningun momento del tratamiento',
  'No utiliza medicamentos para bajar de peso durante el seguimiento',
];
const cualSrc = [
  'Si, la alimentacion actual es completa en todos los grupos',
  'Si, se mantiene equilibrada en proporciones nutrimentales',
  'Si, los alimentos consumidos son inocuos y seguros siempre',
  'Si, variada dentro de cada grupo alimenticio semanalmente',
  'Si, adecuada a sus gustos, cultura y disponibilidad economica',
];
const eqSrc = ['4 raciones diarias recomendadas', '4 raciones diarias recomendadas', '5 raciones diarias recomendadas', '1 racion diaria recomendada', '5 raciones diarias recomendadas', '1 racion diaria recomendada', '3 raciones diarias recomendadas', '1 racion diaria recomendada', '0 raciones diarias recomendadas', '1 racion diaria recomendada'];
const cnSrc = ['1700 kcal de mantenimiento diario', '50 por ciento de hidratos de carbono', '22 por ciento de proteina total', '28 por ciento de lipidos totales'];
const intSrc = ['Suficiente segun requerimiento energetico', 'Adecuado segun requerimiento proteico', 'Adecuado segun requerimiento de hidratos', 'Adecuado segun requerimiento de lipidos'];
const sigSrc = ['Ciento catorce sobre setenta y cuatro mmHg', 'Quince respiraciones por minuto normal', 'Setenta pulsaciones por minuto en reposo', 'Treinta y seis punto cuatro grados centigrados', 'Noventa y ocho por ciento de saturacion'];
const bioqSrc = ['Ochenta y seis miligramos por decilitro', 'Ciento setenta y dos miligramos por decilitro', 'Cuarenta y siete miligramos por decilitro', 'Cien miligramos por decilitro de LDL', 'Ciento ocho miligramos por decilitro', 'Catorce punto nueve gramos por decilitro', 'Cuarenta y cuatro por ciento de hematocrito', 'Cero punto nueve miligramos por decilitro', 'Cinco punto dos miligramos por decilitro', 'Uno punto ocho microUI por mililitro'];
const explorSrc = [
  'Sin alteraciones aparentes en la exploracion general realizada',
  'Distribucion de adiposidad normal tras el tratamiento completo',
  'Estructura osea sin hallazgos relevantes durante la exploracion',
  'Sistema cardiovascular y respiratorio sin alteraciones aparentes',
  'Sistema digestivo explorado y sin alteraciones relevantes',
  'Sin edema en ninguna extremidad durante la exploracion fisica',
  'Extremidades sin alteraciones aparentes en la exploracion',
  'Ojos sin alteraciones aparentes durante la valoracion clinica',
  'Pelo con buena densidad y sin alteraciones aparentes',
  'Cabeza sin alteraciones aparentes en la exploracion fisica',
  'Manos y unas sin alteraciones aparentes en la exploracion',
  'Boca sin alteraciones aparentes durante la valoracion',
  'Musculos con buen tono tras el tratamiento nutricional',
  'Cuello sin alteraciones aparentes en la exploracion fisica',
  'Piel con buena hidratacion y sin alteraciones aparentes',
  'Dientes sin alteraciones aparentes durante la exploracion',
  'Garganta y deglucion sin alteraciones aparentes registradas',
  'Lengua sin alteraciones aparentes durante la valoracion',
];
const firmaSrc = ['PLN. Enrique Reyes Garcia', '123654852 numero de matricula', 'Enrique Reyes firma digital', 'LN. Monica Amanche Torres', 'NUT12345 cedula profesional'];

const cuadro = {};
cuadro[`psi_fecha_${COL}`] = FECHA;
psiSrc.forEach((s, i) => { cuadro[`psi_q${i}_col${COL}`] = cortar(s, cap[`psi_q${i}_col${COL}`]); });

cuadro[`sint_fecha_${COL}`] = FECHA;
sintSrc.forEach((s, i) => { cuadro[`sint_${i}_col${COL}`] = cortar(s, cap[`sint_${i}_col${COL}`]); });

cuadro[`ejer_fecha_${COL}`] = FECHA;
ejerSrc.forEach((s, i) => { cuadro[`ejer_${i}_col${COL}`] = cortar(s, cap[`ejer_${i}_col${COL}`]); });

cuadro[`diet_fecha_${COL}`] = FECHA;
dietSrc.forEach((s, i) => { cuadro[`diet_${i}_col${COL}`] = cortar(s, cap[`diet_${i}_col${COL}`]); });

cuadro[`cual_fecha_${COL}`] = FECHA;
cualSrc.forEach((s, i) => { cuadro[`cual_${i}_col${COL}`] = cortar(s, cap[`cual_${i}_col${COL}`]); });

cuadro[`p3_fecha_${COL}`] = FECHA;
eqSrc.forEach((s, i) => { cuadro[`eq_${i}_col${COL}`] = cortar(s, cap[`eq_${i}_col${COL}`]); });
cnSrc.forEach((s, i) => { cuadro[`cn_${i}_col${COL}`] = cortar(s, cap[`cn_${i}_col${COL}`]); });
intSrc.forEach((s, i) => { cuadro[`int_${i}_col${COL}`] = cortar(s, cap[`int_${i}_col${COL}`]); });

cuadro[`antro_fecha_${COL}`] = FECHA; // sin cambios de contenido (type=number, sin riesgo)

cuadro[`sig_fecha_${COL}`] = FECHA;
sigSrc.forEach((s, i) => { cuadro[`sig_${i}_col${COL}`] = cortar(s, cap[`sig_${i}_col${COL}`]); });

cuadro[`diag_fecha_${COL}`] = FECHA;
cuadro[`diag_matriz_${COL}`] = cortar('Sano, metabolicamente funcional, sin diagnosticos previos registrados, cierre del ciclo de seguimiento nutricional con resultados favorables', cap[`diag_matriz_${COL}`]);
cuadro[`diag_interp_${COL}`] = cortar('Composicion corporal normalizada tras seis semanas de tratamiento. Indice cintura-cadera dentro de rango saludable. Se cierra el ciclo de seguimiento con evolucion clinica y antropometrica favorable en todos los parametros evaluados durante el proceso.', cap[`diag_interp_${COL}`]);

cuadro[`bioq_fecha_${COL}`] = FECHA;
bioqSrc.forEach((s, i) => { cuadro[`bioq_${i}_col${COL}`] = cortar(s, cap[`bioq_${i}_col${COL}`]); });

cuadro[`int_bioq_fecha_${COL}`] = FECHA;
cuadro[`int_bioq_desc_${COL}`] = cortar('Perfil bioquimico completamente normal en todos los parametros evaluados al cierre del tratamiento. Se resuelve el riesgo cardiometabolico inicial detectado en la valoracion de ingreso, con mejoria sostenida en cada consulta de seguimiento realizada durante el proceso.', cap[`int_bioq_desc_${COL}`]);

cuadro[`explor_fecha_${COL}`] = FECHA;
explorSrc.forEach((s, i) => { cuadro[`explor_${i}_col${COL}`] = cortar(s, cap[`explor_${i}_col${COL}`]); });

cuadro[`interv_fecha_${COL}`] = FECHA;
cuadro[`interv_ind_col${COL}`] = cortar('Plan de mantenimiento a largo plazo con educacion nutricional ya consolidada', cap[`interv_ind_col${COL}`]);
cnSrc.forEach((s, i) => { cuadro[`interv_macro_${i}_col${COL}`] = cortar(s, cap[`interv_macro_${i}_col${COL}`]); });
eqSrc.forEach((s, i) => { cuadro[`interv_eq_${i}_col${COL}`] = cortar(s, cap[`interv_eq_${i}_col${COL}`]); });

cuadro[`firma_fecha_col${COL}`] = FECHA;
firmaSrc.forEach((s, i) => { cuadro[`firma_${i}_col${COL}`] = cortar(s, cap[`firma_${i}_col${COL}`]); });
cuadro[`firma_final_col${COL}`] = cortar('Enrique Reyes firma digital validada', cap[`firma_final_col${COL}`]);

fs.writeFileSync(path.join(__dirname, 'payload_col6.json'), JSON.stringify(cuadro, null, 2));

(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'docente.nutricion@edu.utc.mx', password: 'admin123' }),
  });
  const { accessToken } = await loginRes.json();

  const putRes = await fetch('http://localhost:3001/api/seguimiento-nutricional/78', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ cuadro_evolucion: cuadro }),
  });
  const result = await putRes.json();
  console.log('PUT status:', putRes.status);
  console.log('Campos enviados:', Object.keys(cuadro).length);
  if (!putRes.ok) console.error(result);
  else console.log('OK, columna 6 actualizada ocupando el máximo medido.');
})();
