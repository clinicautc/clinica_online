(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'docente.nutricion@edu.utc.mx', password: 'admin123' }),
  });
  const { accessToken } = await loginRes.json();
  const res = await fetch('http://localhost:3001/api/seguimiento-nutricional/78', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  const cuadro = data.cuadro_evolucion || data;
  for (const [k, v] of Object.entries(cuadro)) {
    if (typeof v === 'string' && v.includes('Adiposidad central')) {
      console.log(k, '=>', v);
    }
  }
})();
