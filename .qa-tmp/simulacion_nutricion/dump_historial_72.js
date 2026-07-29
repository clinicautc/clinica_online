const fs = require('fs');
(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const detRes = await fetch('http://localhost:3001/api/historiales-nutricion/detalle/72', { headers: { Authorization: `Bearer ${accessToken}` } });
  const det = await detRes.json();
  fs.writeFileSync('historial_72_full.json', JSON.stringify(det, null, 2));
  console.log('paginas:', Object.keys(det.datos));
  for (const p of Object.keys(det.datos)) {
    console.log(p, '->', Object.keys(det.datos[p]).length, 'campos');
  }
})();
