(async () => {
  const cuadro = {
    psi_fecha_6: '18/07/2026',
    psi_q0_col6: 'Muy contento con el resultado final',
    psi_q1_col6: 'Motivación total, cambio permanente',
    psi_q2_col6: 'El plan ya es mi forma normal de comer',
    psi_q3_col6: 'Sí, mucho, cerré con 6 kg de pérdida',
    psi_q4_col6: 'Ánimo excelente, mejoró mi confianza',
  };

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
  console.log('PUT status:', putRes.status);
  if (!putRes.ok) console.error(await putRes.json());
  else console.log('OK, A. Psicológicos columna 6 actualizado con texto natural.');
})();
