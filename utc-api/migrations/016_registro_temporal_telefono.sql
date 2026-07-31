-- Añade teléfono opcional (máx. 10 dígitos) al registro de pacientes.
-- usuarios.telefono ya existía (alimentado hoy por el endpoint de "editar
-- perfil"); esto permite capturarlo también desde el registro inicial.
ALTER TABLE registro_temporal ADD COLUMN IF NOT EXISTS telefono VARCHAR(10);
