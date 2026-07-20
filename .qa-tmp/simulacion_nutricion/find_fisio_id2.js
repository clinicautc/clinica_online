(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const res = await fetch('http://localhost:3001/api/citas', { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  const fisio = (Array.isArray(data) ? data : data.citas || []).filter(c => c.tipo === 'fisioterapia' && c.estado === 'completada');
  console.log(fisio.slice(0, 10).map(c => ({ id: c.id, paciente_id: c.paciente_id, estado: c.estado })));
})();
