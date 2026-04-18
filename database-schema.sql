-- ============================================================================
-- ESQUEMA DE BASE DE DATOS - SISTEMA CLÍNICA UTC
-- ============================================================================
-- Autor: Sistema UTC
-- Versión: 1.0
-- Fecha: Abril 2026
-- Base de Datos: PostgreSQL (Supabase)
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: EXTENSIONES
-- ============================================================================

-- Habilitar extensión para UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECCIÓN 2: TIPOS ENUMERADOS (ENUMS)
-- ============================================================================

-- Tipo de rol de usuario
CREATE TYPE user_role AS ENUM ('paciente', 'practicante', 'admin');

-- Área de especialización (solo para practicantes)
CREATE TYPE specialty_area AS ENUM ('nutricion', 'fisioterapia');

-- Tipo de cita/servicio
CREATE TYPE appointment_type AS ENUM ('nutricion', 'fisioterapia');

-- Estado de cita
CREATE TYPE appointment_status AS ENUM ('programada', 'completada', 'cancelada');

-- Categoría de notas
CREATE TYPE note_category AS ENUM ('general', 'nutricion', 'fisioterapia');

-- Estado de practicante
CREATE TYPE practitioner_status AS ENUM ('activo', 'inactivo');

-- ============================================================================
-- SECCIÓN 3: TABLAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: users
-- Almacena todos los usuarios del sistema (pacientes, practicantes, admin)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- En producción: usar bcrypt/argon2
  role user_role NOT NULL,
  area specialty_area, -- Solo requerido si role = 'practicante'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Validación: practicantes deben tener área
  CONSTRAINT check_practitioner_area CHECK (
    role != 'practicante' OR area IS NOT NULL
  )
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_area ON users(area);

-- ----------------------------------------------------------------------------
-- TABLA: appointments
-- Almacena todas las citas médicas
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL, -- Desnormalizado para rendimiento
  type appointment_type NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status appointment_status DEFAULT 'programada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Validación: el paciente debe tener rol 'paciente'
  CONSTRAINT check_patient_role CHECK (
    patient_id IN (SELECT id FROM users WHERE role = 'paciente')
  )
);

-- Índices
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_type ON appointments(type);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ----------------------------------------------------------------------------
-- TABLA: medical_histories
-- Almacena historiales clínicos (evaluaciones médicas)
-- ----------------------------------------------------------------------------
CREATE TABLE medical_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL, -- Desnormalizado
  type appointment_type NOT NULL,
  date DATE NOT NULL,
  data JSONB NOT NULL, -- Almacena los datos del formulario (flexible)
  created_by VARCHAR(255) NOT NULL, -- Nombre del practicante que lo creó
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_medical_histories_patient ON medical_histories(patient_id);
CREATE INDEX idx_medical_histories_type ON medical_histories(type);
CREATE INDEX idx_medical_histories_date ON medical_histories(date);
CREATE INDEX idx_medical_histories_data ON medical_histories USING GIN(data); -- Buscar dentro del JSON

-- ----------------------------------------------------------------------------
-- TABLA: notes
-- Almacena avisos/notas publicadas por administradores
-- ----------------------------------------------------------------------------
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category note_category DEFAULT 'general',
  created_by VARCHAR(255) NOT NULL, -- Nombre del admin
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_created_date ON notes(created_date);

-- ----------------------------------------------------------------------------
-- TABLA: practitioners
-- Almacena practicantes autorizados (gestión de accesos)
-- ----------------------------------------------------------------------------
CREATE TABLE practitioners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  area specialty_area NOT NULL,
  status practitioner_status DEFAULT 'activo',
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_practitioners_area ON practitioners(area);
CREATE INDEX idx_practitioners_status ON practitioners(status);

-- ============================================================================
-- SECCIÓN 4: FUNCIONES AUXILIARES
-- ============================================================================

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_histories_updated_at BEFORE UPDATE ON medical_histories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practitioners_updated_at BEFORE UPDATE ON practitioners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECCIÓN 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLÍTICAS: users
-- ----------------------------------------------------------------------------

-- Los admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Solo admins pueden crear usuarios
CREATE POLICY "Only admins can create users" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- POLÍTICAS: appointments
-- ----------------------------------------------------------------------------

-- Pacientes pueden ver sus propias citas
CREATE POLICY "Patients can view their own appointments" ON appointments
  FOR SELECT
  USING (patient_id = auth.uid());

-- Practicantes pueden ver citas de su área
CREATE POLICY "Practitioners can view appointments in their area" ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND u.role = 'practicante'
        AND u.area::text = appointments.type::text
    )
  );

-- Admins pueden ver todas las citas
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Pacientes pueden crear citas
CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (patient_id = auth.uid());

-- Practicantes y admins pueden actualizar citas
CREATE POLICY "Practitioners and admins can update appointments" ON appointments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND (u.role = 'practicante' OR u.role = 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- POLÍTICAS: medical_histories
-- ----------------------------------------------------------------------------

-- Pacientes pueden ver sus propios historiales
CREATE POLICY "Patients can view their own medical histories" ON medical_histories
  FOR SELECT
  USING (patient_id = auth.uid());

-- Practicantes pueden ver historiales de su área
CREATE POLICY "Practitioners can view histories in their area" ON medical_histories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND u.role = 'practicante'
        AND u.area::text = medical_histories.type::text
    )
  );

-- Admins pueden ver todos los historiales
CREATE POLICY "Admins can view all medical histories" ON medical_histories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Solo practicantes y admins pueden crear historiales
CREATE POLICY "Practitioners and admins can create medical histories" ON medical_histories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND (u.role = 'practicante' OR u.role = 'admin')
    )
  );

-- Solo practicantes y admins pueden actualizar historiales
CREATE POLICY "Practitioners and admins can update medical histories" ON medical_histories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
        AND (u.role = 'practicante' OR u.role = 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- POLÍTICAS: notes
-- ----------------------------------------------------------------------------

-- Todos los usuarios autenticados pueden leer notas
CREATE POLICY "Authenticated users can read notes" ON notes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo admins pueden crear notas
CREATE POLICY "Only admins can create notes" ON notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Solo admins pueden actualizar notas
CREATE POLICY "Only admins can update notes" ON notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Solo admins pueden eliminar notas
CREATE POLICY "Only admins can delete notes" ON notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- POLÍTICAS: practitioners
-- ----------------------------------------------------------------------------

-- Todos los usuarios autenticados pueden ver practicantes
CREATE POLICY "Authenticated users can view practitioners" ON practitioners
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo admins pueden gestionar practicantes
CREATE POLICY "Only admins can manage practitioners" ON practitioners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================================
-- SECCIÓN 6: DATOS DE PRUEBA (SEED DATA)
-- ============================================================================

-- NOTA: Los IDs se generan automáticamente, pero los guardamos en variables
-- para poder referenciarlos en las relaciones

-- Insertar usuarios de prueba
DO $$
DECLARE
  admin_id UUID;
  prac_nutri_id UUID;
  prac_fisio_id UUID;
  pac1_id UUID;
  pac2_id UUID;
  pac3_id UUID;
BEGIN
  -- Admin
  INSERT INTO users (name, email, password, role) VALUES
    ('Dr. Carlos Administrador', 'admin@utc.edu.mx', 'admin123', 'admin')
    RETURNING id INTO admin_id;

  -- Practicantes
  INSERT INTO users (name, email, password, role, area) VALUES
    ('Estudiante Ana Nutrición', 'practicante1@utc.edu.mx', 'prac123', 'practicante', 'nutricion')
    RETURNING id INTO prac_nutri_id;

  INSERT INTO users (name, email, password, role, area) VALUES
    ('Estudiante Luis Fisioterapia', 'practicante2@utc.edu.mx', 'prac123', 'practicante', 'fisioterapia')
    RETURNING id INTO prac_fisio_id;

  -- Pacientes
  INSERT INTO users (name, email, password, role) VALUES
    ('Juan Pérez García', 'paciente1@gmail.com', 'pac123', 'paciente')
    RETURNING id INTO pac1_id;

  INSERT INTO users (name, email, password, role) VALUES
    ('María López Hernández', 'paciente2@gmail.com', 'pac123', 'paciente')
    RETURNING id INTO pac2_id;

  INSERT INTO users (name, email, password, role) VALUES
    ('Pedro Ramírez Torres', 'paciente3@gmail.com', 'pac123', 'paciente')
    RETURNING id INTO pac3_id;

  -- Insertar practitioners (registro de autorizados)
  INSERT INTO practitioners (user_id, name, email, area, status) VALUES
    (prac_nutri_id, 'Estudiante Ana Nutrición', 'practicante1@utc.edu.mx', 'nutricion', 'activo'),
    (prac_fisio_id, 'Estudiante Luis Fisioterapia', 'practicante2@utc.edu.mx', 'fisioterapia', 'activo');

  -- Insertar citas de ejemplo
  INSERT INTO appointments (patient_id, patient_name, type, date, time, status) VALUES
    (pac1_id, 'Juan Pérez García', 'nutricion', '2026-04-05', '09:00', 'programada'),
    (pac2_id, 'María López Hernández', 'fisioterapia', '2026-04-05', '10:00', 'programada'),
    (pac3_id, 'Pedro Ramírez Torres', 'nutricion', '2026-04-03', '14:00', 'completada');

  -- Insertar historiales de ejemplo
  INSERT INTO medical_histories (patient_id, patient_name, type, date, data, created_by, created_by_id) VALUES
    (pac1_id, 'Juan Pérez García', 'nutricion', '2026-03-25',
     '{"peso": "75", "altura": "1.75", "presionArterial": "120/80", "diagnostico": "Evaluación nutricional inicial", "objetivo": "Reducción de peso gradual"}'::jsonb,
     'Estudiante Ana Nutrición', prac_nutri_id),
    (pac2_id, 'María López Hernández', 'fisioterapia', '2026-03-28',
     '{"motivoConsulta": "Dolor lumbar crónico", "diagnostico": "Lumbalgia mecánica", "tratamiento": "Ejercicios de fortalecimiento"}'::jsonb,
     'Estudiante Luis Fisioterapia', prac_fisio_id);

  -- Insertar notas de ejemplo
  INSERT INTO notes (title, content, category, created_by, created_by_id) VALUES
    ('Nuevo protocolo de atención', 'Se les recuerda a todos los practicantes que deben seguir el nuevo protocolo de atención al paciente según las directrices de la coordinación.', 'general', 'Dr. Carlos Administrador', admin_id),
    ('Actualización de formatos nutricionales', 'Los estudiantes de nutrición deben usar los nuevos formatos digitalizados para el registro de historiales clínicos.', 'nutricion', 'Dr. Carlos Administrador', admin_id),
    ('Capacitación en fisioterapia deportiva', 'Se llevará a cabo una capacitación el próximo viernes sobre técnicas avanzadas de fisioterapia deportiva. Asistencia obligatoria.', 'fisioterapia', 'Dr. Carlos Administrador', admin_id);

END $$;

-- ============================================================================
-- SECCIÓN 7: VISTAS ÚTILES (OPCIONAL)
-- ============================================================================

-- Vista de citas con información del paciente
CREATE OR REPLACE VIEW appointments_with_patient_info AS
SELECT
  a.*,
  u.email AS patient_email,
  u.role AS patient_role
FROM appointments a
JOIN users u ON a.patient_id = u.id;

-- Vista de historiales con información completa
CREATE OR REPLACE VIEW medical_histories_complete AS
SELECT
  mh.*,
  p.email AS patient_email,
  c.email AS created_by_email,
  c.area AS practitioner_area
FROM medical_histories mh
JOIN users p ON mh.patient_id = p.id
LEFT JOIN users c ON mh.created_by_id = c.id;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================

-- Para verificar que todo se creó correctamente:
SELECT 'Tables created:' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'Row counts:' AS status;
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'medical_histories', COUNT(*) FROM medical_histories
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'practitioners', COUNT(*) FROM practitioners;
