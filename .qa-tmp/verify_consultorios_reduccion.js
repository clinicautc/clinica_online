(async () => {
  const login = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' })
  }).then(r=>r.json());
  const token = login.accessToken;
  const auth = { 'Content-Type':'application/json', Authorization: 'Bearer ' + token };

  // 1) Configurar 3 consultorios en nutricion (aumento, siempre inmediato)
  const put1 = await fetch('http://localhost:3001/api/consultorios/nutricion', {
    method:'PUT', headers: auth, body: JSON.stringify({ cantidad: 3 })
  }).then(r=>r.json());
  console.log('1) Subir a 3 ->', JSON.stringify(put1));

  // 2) Crear 3 citas el mismo dia/hora (2026-09-10 11:00), usando 3 pacientes distintos
  const pacientes = [31, 26, 27];
  const ids = [];
  for (const pid of pacientes) {
    const r = await fetch('http://localhost:3001/api/citas', {
      method:'POST', headers: auth,
      body: JSON.stringify({ paciente_id: pid, paciente_nombre: 'Test Reduccion ' + pid, tipo:'nutricion', fecha:'2026-09-10', hora:'11:00' })
    });
    const b = await r.json();
    console.log('  cita paciente', pid, '->', r.status, b.id || b.error);
    if (b.id) ids.push(b.id);
  }

  // 3) Intentar reducir a 1 consultorio (deberia rechazarse con fechaSugerida = 2026-09-11)
  const putReducir = await fetch('http://localhost:3001/api/consultorios/nutricion', {
    method:'PUT', headers: auth, body: JSON.stringify({ cantidad: 1 })
  });
  const bodyReducir = await putReducir.json();
  console.log('3) Reducir a 1 sin fecha ->', putReducir.status, JSON.stringify(bodyReducir));

  // 4) Confirmar con la fecha sugerida
  if (bodyReducir.fechaSugerida) {
    const putConFecha = await fetch('http://localhost:3001/api/consultorios/nutricion', {
      method:'PUT', headers: auth, body: JSON.stringify({ cantidad: 1, vigenteDesde: bodyReducir.fechaSugerida })
    });
    console.log('4) Reducir a 1 con fecha sugerida ->', putConFecha.status, JSON.stringify(await putConFecha.json()));
  }

  // 5) Verificar estado actual (deberia seguir en 3 vigente, con pendiente=1 desde la fecha)
  const get1 = await fetch('http://localhost:3001/api/consultorios/nutricion', { headers: auth }).then(r=>r.json());
  console.log('5) GET tras programar ->', JSON.stringify(get1));

  // 6) Verificar que un 4to paciente SIGUE pudiendo agendar el mismo dia/hora antes de la fecha de corte (ya que sigue en 3... espera, ya hay 3, probar un dia despues de la fecha de corte con cantidad reducida)
  const r4 = await fetch('http://localhost:3001/api/citas', {
    method:'POST', headers: auth,
    body: JSON.stringify({ paciente_id: 8, paciente_nombre: 'Test Reduccion 8', tipo:'nutricion', fecha: bodyReducir.fechaSugerida, hora:'11:00' })
  });
  const b4 = await r4.json();
  console.log('6) Cita 1a en fecha de corte (deberia aceptarse, cabe en 1) ->', r4.status, b4.id || b4.error);
  if (b4.id) ids.push(b4.id);

  const r5 = await fetch('http://localhost:3001/api/citas', {
    method:'POST', headers: auth,
    body: JSON.stringify({ paciente_id: 19, paciente_nombre: 'Test Reduccion 19', tipo:'nutricion', fecha: bodyReducir.fechaSugerida, hora:'11:00' })
  });
  const b5 = await r5.json();
  console.log('7) Cita 2a en fecha de corte (deberia RECHAZARSE, ya reducido a 1 ese dia) ->', r5.status, b5.id || b5.error);
  if (b5.id) ids.push(b5.id);

  console.log('IDS_A_LIMPIAR', JSON.stringify(ids));
})();
