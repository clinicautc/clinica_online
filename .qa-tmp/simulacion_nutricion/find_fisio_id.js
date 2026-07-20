(async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' }),
  });
  const { accessToken } = await loginRes.json();
  const res = await fetch('http://localhost:3001/api/historiales-fisioterapia', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2).slice(0, 2000));
})();
