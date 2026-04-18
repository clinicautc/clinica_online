# 🗂️ DIAGRAMA DE BASE DE DATOS - Sistema Clínica UTC

---

## 📐 ESQUEMA VISUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS UTC CLÍNICA                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│         USERS                │  ◄───┐
├──────────────────────────────┤      │
│ PK  id (UUID)                │      │
│     name                     │      │
│     email (unique)           │      │
│     password                 │      │
│     role (enum)              │      │
│     area (enum, nullable)    │      │
│     created_at               │      │
│     updated_at               │      │
└──────────────────────────────┘      │
         │                            │
         │ FK                         │ FK
         ▼                            │
┌──────────────────────────────┐      │
│      APPOINTMENTS            │      │
├──────────────────────────────┤      │
│ PK  id (UUID)                │      │
│ FK  patient_id ──────────────┼──────┘
│     patient_name             │
│     type (enum)              │
│     date                     │
│     time                     │
│     status (enum)            │
│     created_at               │
│     updated_at               │
└──────────────────────────────┘

         │
         │ FK
         ▼
┌──────────────────────────────┐
│    MEDICAL_HISTORIES         │
├──────────────────────────────┤
│ PK  id (UUID)                │
│ FK  patient_id ──────────────┼───┐
│     patient_name             │   │
│     type (enum)              │   │
│     date                     │   │
│     data (JSONB)             │   │  Referencia a USERS
│     created_by               │   │  (patient_id)
│ FK  created_by_id ───────────┼───┼───┐
│     created_at               │   │   │
│     updated_at               │   │   │
└──────────────────────────────┘   │   │
                                   │   │
         ┌─────────────────────────┘   │
         │                             │
         ▼                             │
┌──────────────────────────────┐      │
│          NOTES               │      │  Referencia a USERS
├──────────────────────────────┤      │  (created_by_id)
│ PK  id (UUID)                │      │
│     title                    │      │
│     content                  │      │
│     category (enum)          │      │
│     created_by               │      │
│ FK  created_by_id ───────────┼──────┘
│     created_date             │
│     created_at               │
│     updated_at               │
└──────────────────────────────┘

┌──────────────────────────────┐
│      PRACTITIONERS           │
├──────────────────────────────┤
│ PK  id (UUID)                │
│ FK  user_id (unique) ────────┼───┐
│     name                     │   │  Referencia a USERS
│     email                    │   │  (user_id)
│     area (enum)              │   │
│     status (enum)            │   │
│     date_added               │   │
│     created_at               │   │
│     updated_at               │   │
└──────────────────────────────┘   │
                                   │
         ┌─────────────────────────┘
         │
         ▼
    (Tabla USERS)
```

---

## 🔗 RELACIONES ENTRE TABLAS

### 1. **users** → **appointments** (1:N)
- Un usuario (paciente) puede tener **muchas** citas
- Cada cita pertenece a **un** paciente
- **Clave foránea**: `appointments.patient_id` → `users.id`
- **Cascada**: Si se borra un usuario, se borran sus citas (`ON DELETE CASCADE`)

### 2. **users** → **medical_histories** (1:N)
- Un usuario (paciente) puede tener **muchos** historiales
- Cada historial pertenece a **un** paciente
- **Clave foránea**: `medical_histories.patient_id` → `users.id`
- **Cascada**: Si se borra un usuario, se borran sus historiales (`ON DELETE CASCADE`)

### 3. **users** → **medical_histories** (creador) (1:N)
- Un usuario (practicante) puede crear **muchos** historiales
- Cada historial fue creado por **un** practicante
- **Clave foránea**: `medical_histories.created_by_id` → `users.id`
- **Cascada**: Si se borra un practicante, el campo se pone NULL (`ON DELETE SET NULL`)

### 4. **users** → **notes** (1:N)
- Un usuario (admin) puede crear **muchas** notas
- Cada nota fue creada por **un** admin
- **Clave foránea**: `notes.created_by_id` → `users.id`
- **Cascada**: Si se borra un admin, el campo se pone NULL (`ON DELETE SET NULL`)

### 5. **users** → **practitioners** (1:1)
- Un usuario (practicante) tiene **un** registro en practitioners
- Cada registro de practitioners pertenece a **un** usuario
- **Clave foránea**: `practitioners.user_id` → `users.id` (UNIQUE)
- **Cascada**: Si se borra un usuario, se borra su registro de practitioner (`ON DELETE CASCADE`)

---

## 📊 TIPOS DE DATOS ENUM

### **user_role**
```
┌────────────┐
│ paciente   │  → Paciente que recibe atención
│ practicante│  → Estudiante que brinda atención
│ admin      │  → Administrador del sistema
└────────────┘
```

### **specialty_area**
```
┌────────────┐
│ nutricion   │  → Área de nutrición
│ fisioterapia│  → Área de fisioterapia
└────────────┘
```

### **appointment_type**
```
┌────────────┐
│ nutricion   │  → Cita de nutrición
│ fisioterapia│  → Cita de fisioterapia
└────────────┘
```

### **appointment_status**
```
┌────────────┐
│ programada │  → Cita futura
│ completada │  → Cita realizada
│ cancelada  │  → Cita cancelada
└────────────┘
```

### **note_category**
```
┌────────────┐
│ general     │  → Para todos
│ nutricion   │  → Solo nutrición
│ fisioterapia│  → Solo fisioterapia
└────────────┘
```

### **practitioner_status**
```
┌────────────┐
│ activo     │  → Practicante activo
│ inactivo   │  → Practicante dado de baja
└────────────┘
```

---

## 🔐 POLÍTICAS RLS (ROW LEVEL SECURITY)

### Matriz de Acceso por Tabla

| Tabla              | Paciente | Practicante Nutri | Practicante Fisio | Admin |
|--------------------|----------|-------------------|-------------------|-------|
| **users**          |          |                   |                   |       |
| - Ver propio       | ✅       | ✅                | ✅                | ✅    |
| - Ver todos        | ❌       | ❌                | ❌                | ✅    |
| - Crear            | ❌       | ❌                | ❌                | ✅    |
| - Actualizar       | ✅ (yo)  | ✅ (yo)           | ✅ (yo)           | ✅    |
| **appointments**   |          |                   |                   |       |
| - Ver propias      | ✅       | -                 | -                 | -     |
| - Ver de área      | -        | ✅ (nutri)        | ✅ (fisio)        | ✅    |
| - Crear            | ✅       | ❌                | ❌                | ✅    |
| - Actualizar       | ❌       | ✅ (nutri)        | ✅ (fisio)        | ✅    |
| **medical_histories** |       |                   |                   |       |
| - Ver propios      | ✅       | -                 | -                 | -     |
| - Ver de área      | -        | ✅ (nutri)        | ✅ (fisio)        | ✅    |
| - Crear            | ❌       | ✅ (nutri)        | ✅ (fisio)        | ✅    |
| - Actualizar       | ❌       | ✅ (nutri)        | ✅ (fisio)        | ✅    |
| **notes**          |          |                   |                   |       |
| - Ver general      | ✅       | ✅                | ✅                | ✅    |
| - Ver de área      | -        | ✅ (nutri+gen)    | ✅ (fisio+gen)    | ✅    |
| - Crear            | ❌       | ❌                | ❌                | ✅    |
| - Actualizar       | ❌       | ❌                | ❌                | ✅    |
| - Eliminar         | ❌       | ❌                | ❌                | ✅    |
| **practitioners**  |          |                   |                   |       |
| - Ver              | ✅       | ✅                | ✅                | ✅    |
| - Crear            | ❌       | ❌                | ❌                | ✅    |
| - Actualizar       | ❌       | ❌                | ❌                | ✅    |
| - Eliminar         | ❌       | ❌                | ❌                | ✅    |

---

## 🎯 FLUJO DE DATOS

### Flujo 1: Paciente agenda cita
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│ Paciente │────►│ appointments │────►│ practicante │
│  (user)  │     │   (INSERT)   │     │   (VIEW)    │
└──────────┘     └──────────────┘     └─────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ patient_id│ = user.id
                  │ type      │ = 'nutricion' | 'fisioterapia'
                  │ status    │ = 'programada'
                  └──────────┘
```

### Flujo 2: Practicante crea historial
```
┌──────────────┐     ┌───────────────────┐     ┌──────────┐
│ Practicante  │────►│ medical_histories │────►│ Paciente │
│ (fisio/nutri)│     │     (INSERT)      │     │  (VIEW)  │
└──────────────┘     └───────────────────┘     └──────────┘
                            │
                            ▼
                      ┌──────────────┐
                      │ patient_id   │ = paciente.id
                      │ type         │ = practicante.area
                      │ created_by_id│ = practicante.id
                      │ data (JSONB) │ = formulario completo
                      └──────────────┘
```

### Flujo 3: Admin publica nota
```
┌───────┐     ┌────────┐     ┌──────────────────┐
│ Admin │────►│ notes  │────►│ Practicantes     │
│       │     │(INSERT)│     │ (VIEW por área)  │
└───────┘     └────────┘     └──────────────────┘
                  │
                  ▼
            ┌────────────┐
            │ category   │ = 'nutricion' | 'fisioterapia' | 'general'
            │ created_by │ = admin.name
            └────────────┘
```

---

## 📈 ÍNDICES Y OPTIMIZACIÓN

### Índices creados automáticamente:
- ✅ Primary Keys (todas las tablas: `id`)
- ✅ Unique Keys (`users.email`, `practitioners.user_id`)
- ✅ Foreign Keys (todas las relaciones)

### Índices adicionales para performance:
```sql
-- USERS
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_area ON users(area);

-- APPOINTMENTS
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_type ON appointments(type);
CREATE INDEX idx_appointments_status ON appointments(status);

-- MEDICAL_HISTORIES
CREATE INDEX idx_medical_histories_patient ON medical_histories(patient_id);
CREATE INDEX idx_medical_histories_type ON medical_histories(type);
CREATE INDEX idx_medical_histories_date ON medical_histories(date);
CREATE INDEX idx_medical_histories_data ON medical_histories USING GIN(data);

-- NOTES
CREATE INDEX idx_notes_category ON notes(category);
CREATE INDEX idx_notes_created_date ON notes(created_date);

-- PRACTITIONERS
CREATE INDEX idx_practitioners_area ON practitioners(area);
CREATE INDEX idx_practitioners_status ON practitioners(status);
```

---

## 🔄 TRIGGERS AUTOMÁTICOS

### Trigger: Actualizar `updated_at`
```sql
-- Se ejecuta automáticamente en TODAS las tablas
-- Actualiza el campo updated_at con la fecha/hora actual

BEFORE UPDATE ON users
BEFORE UPDATE ON appointments
BEFORE UPDATE ON medical_histories
BEFORE UPDATE ON notes
BEFORE UPDATE ON practitioners

Función: update_updated_at_column()
```

---

## 💾 TAMAÑO ESTIMADO DE DATOS

### Por 100 usuarios activos:

| Tabla              | Registros | Tamaño/Registro | Total  |
|--------------------|-----------|-----------------|--------|
| users              | ~100      | 500 bytes       | 50 KB  |
| appointments       | ~500      | 300 bytes       | 150 KB |
| medical_histories  | ~300      | 2 KB (JSONB)    | 600 KB |
| notes              | ~50       | 1 KB            | 50 KB  |
| practitioners      | ~10       | 400 bytes       | 4 KB   |
| **TOTAL**          |           |                 | ~854 KB|

### Límites del plan Free de Supabase:
- ✅ Base de datos: 500 MB (suficiente para ~50,000 usuarios)
- ✅ Storage: 1 GB
- ✅ Bandwidth: 5 GB/mes

---

## 📝 NOTAS IMPORTANTES

### 1. Desnormalización intencional
Algunos campos están duplicados para mejorar performance:
- `appointments.patient_name` (también en `users.name`)
- `medical_histories.patient_name` (también en `users.name`)

**¿Por qué?** Para evitar JOINs innecesarios en queries frecuentes.

### 2. Campo `data` (JSONB)
El campo `medical_histories.data` es flexible porque:
- Los formularios de nutrición y fisioterapia son diferentes
- Permite agregar campos sin alterar el schema
- Se puede buscar dentro del JSON con índices GIN

### 3. Soft delete vs Hard delete
Actualmente usamos **hard delete** (borrado permanente).
Si necesitas recuperar datos borrados, considera agregar:
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
```

---

## 🚀 RENDIMIENTO ESPERADO

### Consultas típicas:

| Query                           | Tiempo estimado |
|---------------------------------|-----------------|
| Buscar usuario por email        | <5ms            |
| Listar citas de un paciente     | <10ms           |
| Listar citas de hoy             | <15ms           |
| Buscar en historial JSONB       | <20ms           |
| Crear nueva cita                | <30ms           |
| Dashboard admin (todas las tabs)| <100ms          |

---

**Versión**: 1.0
**Última actualización**: Abril 2026
