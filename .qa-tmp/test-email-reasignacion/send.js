require('dotenv').config({ path: '../../utc-api/.env' });

const { notificarReasignacion } = require('../../utc-api/services/notificationService');

(async () => {
  await notificarReasignacion(
    'Enrique Reséndiz',
    'enriquejesusresendiz@hotmail.com',
    '2026-07-02',
    '10:00',
    'Dr. Practicante de Prueba',
    'nutricion'
  );
  console.log('Correo enviado.');
  process.exit(0);
})();
