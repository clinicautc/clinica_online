(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();

  const citaRes = await fetch('http://localhost:3001/api/citas/72', { headers: { Authorization: `Bearer ${accessToken}` } });
  console.log('cita 72 status:', citaRes.status);
  if (citaRes.ok) console.log(JSON.stringify(await citaRes.json(), null, 2));

  const detRes = await fetch('http://localhost:3001/api/historiales-nutricion/detalle/72', { headers: { Authorization: `Bearer ${accessToken}` } });
  console.log('detalle status:', detRes.status);
  const det = await detRes.json();
  console.log(Object.keys(det));
  console.log(JSON.stringify(det).slice(0, 500));
})();
