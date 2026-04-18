/**
 * ============================================================================
 * ARCHIVO: mockData.ts
 * PROPÓSITO: Almacenar datos de prueba (mock) para desarrollo y testing
 * UBICACIÓN: src/app/lib/mockData.ts
 * ============================================================================
 *
 * Este archivo contiene todos los datos simulados que usa la aplicación
 * antes de conectarse a una base de datos real. Incluye usuarios, citas,
 * historiales médicos, notas, etc.
 */

/**
 * ============================================================================
 * SECCIÓN 1: TIPOS DE DATOS (INTERFACES)
 * ============================================================================
 */

/**
 * TIPO: User
 * Representa un usuario del sistema (paciente, practicante o admin)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'paciente' | 'practicante' | 'admin';
  area?: 'nutricion' | 'fisioterapia'; // Para practicantes y admins/docentes
}

/**
 * TIPO: Appointment
 * Representa una cita médica programada
 */
export interface Appointment {
  id: string;
  patientId: string; // ID del paciente
  patientName: string; // Nombre del paciente
  type: 'fisioterapia' | 'nutricion'; // Tipo de servicio
  date: string; // Fecha en formato YYYY-MM-DD
  time: string; // Hora en formato HH:MM
  status: 'programada' | 'completada' | 'cancelada'; // Estado de la cita
}

/**
 * TIPO: MedicalHistory
 * Representa un historial clínico (evaluación médica guardada)
 */
export interface MedicalHistory {
  id: string;
  patientId: string;
  patientName: string;
  type: 'fisioterapia' | 'nutricion';
  date: string; // Fecha de creación
  data: Record<string, any>; // Datos del formulario (flexible)
  createdBy: string; // Quién creó el registro
}

/**
 * TIPO: Note
 * Representa una nota o aviso publicado por administradores
 */
export interface Note {
  id: string;
  title: string; // Título del aviso
  content: string; // Contenido del mensaje
  category: 'general' | 'nutricion' | 'fisioterapia'; // A quién va dirigido
  createdBy: string; // Quién lo publicó
  createdDate: string; // Fecha de publicación
}

/**
 * TIPO: Practitioner (para gestión de practicantes)
 * Representa un practicante autorizado en el sistema
 */
export interface Practitioner {
  id: string;
  name: string;
  email: string;
  area: 'nutricion' | 'fisioterapia';
  status: 'activo' | 'inactivo';
  dateAdded: string;
}

/**
 * TIPO: NutritionPlan
 * Representa un plan de alimentación asignado a un paciente
 */
export interface NutritionPlan {
  id: string;
  patientId: string;
  patientName: string;
  createdBy: string;
  createdDate: string;
  title: string;
  description: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  recommendations: string[];
  calories: string;
  duration: string;
}

/**
 * TIPO: PhysiotherapyPlan
 * Representa un plan de ejercicios asignado a un paciente
 */
export interface PhysiotherapyPlan {
  id: string;
  patientId: string;
  patientName: string;
  createdBy: string;
  createdDate: string;
  title: string;
  description: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
    notes: string;
  }[];
  recommendations: string[];
  duration: string;
  frequency: string;
}

/**
 * ============================================================================
 * SECCIÓN 2: DATOS MOCK
 * ============================================================================
 */

/**
 * USUARIOS DE PRUEBA
 * Incluye 2 admins/docentes (nutrición y fisioterapia), 2 practicantes y 3 pacientes
 */
export const mockUsers: User[] = [
  // ADMINISTRADORES/DOCENTES
  {
    id: 'admin1',
    name: 'Dr. Carlos Docente Nutrición',
    email: 'docente.nutricion@utc.edu.mx',
    password: 'admin123',
    role: 'admin',
    area: 'nutricion',
  },
/* docente.nutricion@utc.edu.mx ,docente.fisioterapia@utc.edu.mx */
  {
    id: 'admin2',
    name: 'Dra. María Docente Fisioterapia',
    email: 'docente.fisioterapia@utc.edu.mx',
    password: 'admin123',
    role: 'admin',
    area: 'fisioterapia',
  },

  // PRACTICANTES
  {
    id: 'prac1',
    name: 'Estudiante Ana Nutrición',
    email: 'practicante1@utc.edu.mx',
    password: 'prac123',
    role: 'practicante',
    area: 'nutricion',
  },
  {
    id: 'prac2',
    name: 'Estudiante Luis Fisioterapia',
    email: 'practicante2@utc.edu.mx',
    password: 'prac123',
    role: 'practicante',
    area: 'fisioterapia',
  },

  // PACIENTES
  {
    id: 'pac1',
    name: 'Juan Pérez García',
    email: 'paciente1@gmail.com',
    password: 'pac123',
    role: 'paciente',
  },
  {
    id: 'pac2',
    name: 'María López Hernández',
    email: 'paciente2@gmail.com',
    password: 'pac123',
    role: 'paciente',
  },
  {
    id: 'pac3',
    name: 'Pedro Ramírez Torres',
    email: 'paciente3@gmail.com',
    password: 'pac123',
    role: 'paciente',
  },
];

/**
 * HORARIOS DISPONIBLES
 * Slots de tiempo para agendar citas (formato 24h)
 */
export const availableTimeSlots = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00',
];

/**
 * CITAS DE PRUEBA
 * Algunas citas ya programadas para testing
 */
export const mockAppointments: Appointment[] = [
  {
    id: 'apt1',
    patientId: 'pac1',
    patientName: 'Juan Pérez García',
    type: 'nutricion',
    date: '2026-04-05',
    time: '09:00',
    status: 'programada',
  },
  {
    id: 'apt2',
    patientId: 'pac2',
    patientName: 'María López Hernández',
    type: 'fisioterapia',
    date: '2026-04-05',
    time: '10:00',
    status: 'programada',
  },
  {
    id: 'apt3',
    patientId: 'pac3',
    patientName: 'Pedro Ramírez Torres',
    type: 'nutricion',
    date: '2026-04-03',
    time: '14:00',
    status: 'completada',
  },
];

/**
 * HISTORIALES MÉDICOS DE PRUEBA
 * Ejemplos de evaluaciones guardadas
 */
export const mockMedicalHistories: MedicalHistory[] = [
  {
    id: 'hist1',
    patientId: 'pac1',
    patientName: 'Juan Pérez García',
    type: 'nutricion',
    date: '2026-03-25',
    createdBy: 'Estudiante Ana Nutrición',
    data: {
      peso: '75',
      altura: '1.75',
      presionArterial: '120/80',
      diagnostico: 'Evaluación nutricional inicial',
      objetivo: 'Reducción de peso gradual',
    },
  },
  {
    id: 'hist2',
    patientId: 'pac2',
    patientName: 'María López Hernández',
    type: 'fisioterapia',
    date: '2026-03-28',
    createdBy: 'Estudiante Luis Fisioterapia',
    data: {
      motivoConsulta: 'Dolor lumbar crónico',
      diagnostico: 'Lumbalgia mecánica',
      tratamiento: 'Ejercicios de fortalecimiento',
    },
  },
];

/**
 * NOTAS UNIVERSITARIAS DE PRUEBA
 * Avisos publicados por administradores para practicantes
 */
export const mockNotes: Note[] = [
  {
    id: 'note1',
    title: 'Nuevo protocolo de atención',
    content: 'Se les recuerda a todos los practicantes que deben seguir el nuevo protocolo de atención al paciente según las directrices de la coordinación.',
    category: 'general',
    createdBy: 'Dr. Carlos Administrador',
    createdDate: '2026-03-28',
  },
  {
    id: 'note2',
    title: 'Actualización de formatos nutricionales',
    content: 'Los estudiantes de nutrición deben usar los nuevos formatos digitalizados para el registro de historiales clínicos.',
    category: 'nutricion',
    createdBy: 'Dra. María González',
    createdDate: '2026-03-29',
  },
  {
    id: 'note3',
    title: 'Capacitación en fisioterapia deportiva',
    content: 'Se llevará a cabo una capacitación el próximo viernes sobre técnicas avanzadas de fisioterapia deportiva. Asistencia obligatoria.',
    category: 'fisioterapia',
    createdBy: 'Dr. Carlos Administrador',
    createdDate: '2026-03-30',
  },
];

/**
 * PRACTICANTES AUTORIZADOS DE PRUEBA
 * Lista de estudiantes con acceso al sistema
 */
export const mockPractitioners: Practitioner[] = [
  {
    id: 'prac1',
    name: 'Estudiante Ana Nutrición',
    email: 'practicante1@utc.edu.mx',
    area: 'nutricion',
    status: 'activo',
    dateAdded: '2026-01-15',
  },
  {
    id: 'prac2',
    name: 'Estudiante Luis Fisioterapia',
    email: 'practicante2@utc.edu.mx',
    area: 'fisioterapia',
    status: 'activo',
    dateAdded: '2026-01-15',
  },
];

/**
 * PLANES DE NUTRICIÓN DE PRUEBA
 * Planes de alimentación asignados a pacientes
 */
export const mockNutritionPlans: NutritionPlan[] = [
  {
    id: 'nutr-plan-1',
    patientId: 'pac1',
    patientName: 'Juan Pérez García',
    createdBy: 'Estudiante Ana Nutrición',
    createdDate: '2026-03-25',
    title: 'Plan de Reducción de Peso Gradual',
    description: 'Plan alimenticio diseñado para reducción de peso de manera saludable y sostenible',
    meals: {
      breakfast: [
        '1 taza de avena con fruta',
        '2 huevos revueltos',
        '1 vaso de jugo de naranja natural',
      ],
      lunch: [
        'Ensalada verde con pollo a la plancha (150g)',
        '1 taza de arroz integral',
        'Verduras al vapor',
        'Agua natural',
      ],
      dinner: [
        'Pescado al horno (120g)',
        'Ensalada mixta',
        '1 rebanada de pan integral',
        'Té verde',
      ],
      snacks: [
        '1 manzana o pera',
        '10 almendras',
        '1 yogurt griego natural',
      ],
    },
    recommendations: [
      'Beber al menos 2 litros de agua al día',
      'Evitar alimentos procesados y azúcares refinados',
      'Realizar 30 minutos de ejercicio 5 días a la semana',
      'No saltarse comidas',
    ],
    calories: '1800 kcal/día',
    duration: '4 semanas',
  },
  {
    id: 'nutr-plan-2',
    patientId: 'pac3',
    patientName: 'Pedro Ramírez Torres',
    createdBy: 'Estudiante Ana Nutrición',
    createdDate: '2026-03-20',
    title: 'Plan de Alimentación Balanceada',
    description: 'Plan para mantener peso saludable y mejorar hábitos alimenticios',
    meals: {
      breakfast: [
        'Smoothie de frutas con espinaca',
        '2 tostadas integrales con aguacate',
        'Café o té sin azúcar',
      ],
      lunch: [
        'Pechuga de pollo asada (180g)',
        'Quinoa (1 taza)',
        'Brócoli al vapor',
        'Agua de jamaica sin azúcar',
      ],
      dinner: [
        'Sopa de verduras',
        'Tortilla de claras con champiñones',
        'Ensalada de espinaca',
      ],
      snacks: [
        'Zanahoria con hummus',
        '1 puñado de nueces',
        'Gelatina sin azúcar',
      ],
    },
    recommendations: [
      'Comer cada 3-4 horas para mantener metabolismo activo',
      'Incluir proteína en cada comida',
      'Limitar consumo de sal',
      'Dormir 7-8 horas diarias',
    ],
    calories: '2000 kcal/día',
    duration: '6 semanas',
  },
];

/**
 * PLANES DE FISIOTERAPIA DE PRUEBA
 * Planes de ejercicios asignados a pacientes
 */
export const mockPhysiotherapyPlans: PhysiotherapyPlan[] = [
  {
    id: 'physio-plan-1',
    patientId: 'pac2',
    patientName: 'María López Hernández',
    createdBy: 'Estudiante Luis Fisioterapia',
    createdDate: '2026-03-28',
    title: 'Programa de Rehabilitación Lumbar',
    description: 'Ejercicios específicos para fortalecer zona lumbar y reducir dolor',
    exercises: [
      {
        name: 'Estiramiento de gato-camello',
        sets: '3',
        reps: '10',
        notes: 'Mantener cada posición 5 segundos',
      },
      {
        name: 'Puente de glúteos',
        sets: '3',
        reps: '15',
        notes: 'Apretar glúteos en la parte superior',
      },
      {
        name: 'Plancha abdominal',
        sets: '3',
        reps: '30 segundos',
        notes: 'Mantener espalda recta, no curvar',
      },
      {
        name: 'Estiramiento de isquiotibiales',
        sets: '2',
        reps: '20 segundos cada pierna',
        notes: 'Sin rebotes, estiramiento suave',
      },
      {
        name: 'Rotaciones de cadera',
        sets: '3',
        reps: '10 cada lado',
        notes: 'Movimiento controlado y lento',
      },
    ],
    recommendations: [
      'Realizar ejercicios en superficie firme (colchoneta)',
      'Si hay dolor intenso, detener y consultar',
      'Respirar normalmente durante los ejercicios',
      'Calentar 5 minutos antes de iniciar',
      'Aplicar calor local después de la sesión',
    ],
    duration: '8 semanas',
    frequency: '3 veces por semana',
  },
  {
    id: 'physio-plan-2',
    patientId: 'pac1',
    patientName: 'Juan Pérez García',
    createdBy: 'Estudiante Luis Fisioterapia',
    createdDate: '2026-03-15',
    title: 'Programa de Movilidad General',
    description: 'Ejercicios para mejorar movilidad y prevenir lesiones',
    exercises: [
      {
        name: 'Marcha en el lugar',
        sets: '1',
        reps: '5 minutos',
        notes: 'Calentamiento inicial',
      },
      {
        name: 'Círculos de brazos',
        sets: '2',
        reps: '15 cada dirección',
        notes: 'Amplitud completa de movimiento',
      },
      {
        name: 'Sentadilla asistida',
        sets: '3',
        reps: '12',
        notes: 'Usar silla como apoyo si es necesario',
      },
      {
        name: 'Elevación de pantorrillas',
        sets: '3',
        reps: '15',
        notes: 'Apoyarse en pared para equilibrio',
      },
      {
        name: 'Estiramiento general',
        sets: '1',
        reps: '5 minutos',
        notes: 'Enfriamiento, todos los grupos musculares',
      },
    ],
    recommendations: [
      'Progresar gradualmente en dificultad',
      'Mantener buena hidratación',
      'Usar ropa cómoda y calzado adecuado',
      'Descansar 1 día entre sesiones',
    ],
    duration: '6 semanas',
    frequency: '2-3 veces por semana',
  },
];

/**
 * ============================================================================
 * SECCIÓN 3: FUNCIONES DE INICIALIZACIÓN
 * ============================================================================
 */

/**
 * FUNCIÓN: initializeMockData
 * Inicializa el localStorage con datos de prueba si está vacío
 * Esta función se debe llamar al inicio de la aplicación
 */
export function initializeMockData() {
  // Inicializar usuarios si no existen
  if (!localStorage.getItem('utc_users')) {
    localStorage.setItem('utc_users', JSON.stringify(mockUsers));
  }

  // Inicializar citas si no existen
  if (!localStorage.getItem('utc_appointments')) {
    localStorage.setItem('utc_appointments', JSON.stringify(mockAppointments));
  }

  // Inicializar historiales si no existen
  if (!localStorage.getItem('utc_medical_histories')) {
    localStorage.setItem('utc_medical_histories', JSON.stringify(mockMedicalHistories));
  }

  // Inicializar notas si no existen
  if (!localStorage.getItem('utc_notes')) {
    localStorage.setItem('utc_notes', JSON.stringify(mockNotes));
  }

  // Inicializar practicantes si no existen
  if (!localStorage.getItem('utc_practitioners')) {
    localStorage.setItem('utc_practitioners', JSON.stringify(mockPractitioners));
  }

  // Inicializar planes de nutrición si no existen
  if (!localStorage.getItem('utc_nutrition_plans')) {
    localStorage.setItem('utc_nutrition_plans', JSON.stringify(mockNutritionPlans));
  }

  // Inicializar planes de fisioterapia si no existen
  if (!localStorage.getItem('utc_physio_plans')) {
    localStorage.setItem('utc_physio_plans', JSON.stringify(mockPhysiotherapyPlans));
  }
}

/**
 * ============================================================================
 * NOTAS DE USO:
 * ============================================================================
 *
 * 1. Este archivo exporta interfaces (tipos) y datos de prueba
 * 2. Para usar los tipos: import { User, Appointment } from '@/lib/mockData'
 * 3. Para usar los datos: import { mockUsers } from '@/lib/mockData'
 * 4. Los datos se almacenan en localStorage con estas claves:
 *    - 'utc_users': Usuarios
 *    - 'utc_appointments': Citas
 *    - 'utc_medical_histories': Historiales
 *    - 'utc_notes': Notas/Avisos
 *    - 'utc_practitioners': Practicantes autorizados
 *    - 'utc_nutrition_plans': Planes de nutrición
 *    - 'utc_physio_plans': Planes de fisioterapia
 *
 * 5. Al conectar con PostgreSQL, estos mocks se reemplazarán con
 *    llamadas a la API que consulte la base de datos real
 *
 * ============================================================================
 */
