const fs = require('fs');
(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const detRes = await fetch('http://localhost:3001/api/historiales-nutricion/detalle/72', { headers: { Authorization: `Bearer ${accessToken}` } });
  const det = await detRes.json();
  fs.writeFileSync('historial_72_current_full.json', JSON.stringify(det, null, 2));
  const empty = {};
  for (const pagina of Object.keys(det.datos)) {
    empty[pagina] = [];
    for (const [k, v] of Object.entries(det.datos[pagina])) {
      if (v === '' || v === null || v === undefined) empty[pagina].push(k);
    }
  }
  fs.writeFileSync('campos_vacios.json', JSON.stringify(empty, null, 2));
  for (const p of Object.keys(empty)) console.log(p, empty[p].length, empty[p]);
})();
