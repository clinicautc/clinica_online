const datos = require('./historial_72_datos_verbose.json');
(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const payload = {
    paciente_id: 7,
    paciente_nombre: 'Enrique Rezentiz',
    tipo: 'nutricion',
    datos,
    creado_por: 22,
    creado_por_nombre: 'Carlos Nutri',
    appointment_id: 72,
  };
  const res = await fetch('http://localhost:3001/api/historiales/10', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  console.log('PUT status:', res.status);
})();
