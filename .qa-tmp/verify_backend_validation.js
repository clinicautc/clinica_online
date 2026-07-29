const login = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' })
}).then(r => r.json());

const token = login.accessToken;

// Intento 1: hora 24:00 (invalida, deberia rechazarse ahora)
const r1 = await fetch('http://localhost:3001/api/citas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paciente_id: 7, paciente_nombre: 'Test', tipo: 'nutricion', fecha: '2026-09-15', hora: '24:00' })
});
console.log('Cita 24:00 ->', r1.status, JSON.stringify(await r1.json()));

// Intento 2: dia cerrado (domingo, dia_semana 7, inactivo segun horarios_atencion)
const r2 = await fetch('http://localhost:3001/api/citas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paciente_id: 7, paciente_nombre: 'Test', tipo: 'nutricion', fecha: '2026-09-13', hora: '10:00' }) // domingo
});
console.log('Cita domingo ->', r2.status, JSON.stringify(await r2.json()));

// Intento 3: hora valida (deberia aceptarse)
const r3 = await fetch('http://localhost:3001/api/citas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ paciente_id: 7, paciente_nombre: 'Test', tipo: 'nutricion', fecha: '2026-09-14', hora: '11:00' }) // lunes valido
});
const body3 = await r3.json();
console.log('Cita valida ->', r3.status, JSON.stringify(body3));
if (r3.status === 201) {
  // limpiar
  await fetch(`http://localhost:3001/api/citas/${body3.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  console.log('Cita de prueba eliminada.');
}
