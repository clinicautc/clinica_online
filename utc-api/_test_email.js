require('dotenv').config();
const { notificarReasignacion } = require('./services/notificationService');

(async () => {
  await notificarReasignacion(
    'Enrique Reséndiz',
    'enriquejesusresendiz@hotmail.com',
    '2026-07-02',
    '10:00',
    'Dr. Practicante de Prueba',
    'fisioterapia'
  );
  console.log('Correo enviado.');
  process.exit(0);
})();
