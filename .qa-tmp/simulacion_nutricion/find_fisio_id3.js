(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const res = await fetch('http://localhost:3001/api/citas', { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.citas || data.data || []);
  console.log('total:', list.length);
  console.log(list.slice(0, 3));
  const fisio = list.filter(c => (c.tipo_consulta === 'fisioterapia' || c.area === 'fisioterapia' || c.tipo === 'fisioterapia'));
  console.log('fisio count:', fisio.length);
  console.log(fisio.slice(0,10).map(c=>({id:c.id, estado:c.estado})));
})();
