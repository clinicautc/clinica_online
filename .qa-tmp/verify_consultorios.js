(async () => {
  const login = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' })
  }).then(r=>r.json());
  const token = login.accessToken;
  const auth = { 'Content-Type':'application/json', Authorization: 'Bearer ' + token };

  const put = await fetch('http://localhost:3001/api/consultorios/nutricion', {
    method:'PUT', headers: auth, body: JSON.stringify({ cantidad: 2 })
  }).then(r=>r.json());
  console.log('PUT consultorios:', JSON.stringify(put));

  const get = await fetch('http://localhost:3001/api/consultorios/nutricion', { headers: auth }).then(r=>r.json());
  console.log('GET consultorios:', JSON.stringify(get));

  const r1 = await fetch('http://localhost:3001/api/citas', {
    method:'POST', headers: auth,
    body: JSON.stringify({ paciente_id: 31, paciente_nombre: 'Test Consultorio A', tipo:'nutricion', fecha:'2026-09-02', hora:'11:00' })
  });
  const b1 = await r1.json();
  console.log('Cita 1 ->', r1.status, JSON.stringify(b1));

  const r2 = await fetch('http://localhost:3001/api/citas', {
    method:'POST', headers: auth,
    body: JSON.stringify({ paciente_id: 26, paciente_nombre: 'Test Consultorio B', tipo:'nutricion', fecha:'2026-09-02', hora:'11:00' })
  });
  const b2 = await r2.json();
  console.log('Cita 2 (mismo horario, distinto paciente) ->', r2.status, JSON.stringify(b2));

  const r3 = await fetch('http://localhost:3001/api/citas', {
    method:'POST', headers: auth,
    body: JSON.stringify({ paciente_id: 27, paciente_nombre: 'Test Consultorio C', tipo:'nutricion', fecha:'2026-09-02', hora:'11:00' })
  });
  const b3 = await r3.json();
  console.log('Cita 3 (deberia rechazarse, ya lleno con 2 consultorios) ->', r3.status, JSON.stringify(b3));

  const disp = await fetch('http://localhost:3001/api/citas/disponibilidad?fecha=2026-09-02&tipo=nutricion', { headers: auth }).then(r=>r.json());
  console.log('Disponibilidad (deberia incluir 11:00:00 ya que llego a 2):', JSON.stringify(disp));

  global.__ids = [b1.id, b2.id].filter(Boolean);
  console.log('IDS_CREADOS', JSON.stringify(global.__ids));
})();
