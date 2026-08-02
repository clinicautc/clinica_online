-- Snapshot de esquema generado desde la BD real (columnas + constraints + indices)
-- Generado: 2026-08-02T05:37:43.382Z

-- ============================================================
-- TABLA: asistencia_practicantes
-- ============================================================
CREATE TABLE asistencia_practicantes (
  id integer NOT NULL DEFAULT nextval('asistencia_practicantes_id_seq'::regclass),
  usuario_id integer NOT NULL,
  fecha date NOT NULL,
  estado character varying(10) NOT NULL,
  registrado_por integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Constraints:
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_created_at_not_null NOT NULL created_at;
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_estado_not_null NOT NULL estado;
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_fecha_not_null NOT NULL fecha;
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_id_not_null NOT NULL id;
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_pkey PRIMARY KEY (id);
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES usuarios(id);
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_usuario_id_fecha_key UNIQUE (usuario_id, fecha);
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE asistencia_practicantes ADD CONSTRAINT asistencia_practicantes_usuario_id_not_null NOT NULL usuario_id;

-- Indices:
CREATE UNIQUE INDEX asistencia_practicantes_pkey ON public.asistencia_practicantes USING btree (id);
CREATE UNIQUE INDEX asistencia_practicantes_usuario_id_fecha_key ON public.asistencia_practicantes USING btree (usuario_id, fecha);
CREATE INDEX idx_asistencia_usuario ON public.asistencia_practicantes USING btree (usuario_id);


-- ============================================================
-- TABLA: cierres_clinicos
-- ============================================================
CREATE TABLE cierres_clinicos (
  id integer NOT NULL DEFAULT nextval('cierres_clinicos_id_seq'::regclass),
  area character varying(20) NOT NULL,
  fecha date NOT NULL,
  motivo character varying(200),
  creado_por integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Constraints:
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_area_check CHECK (((area)::text = ANY ((ARRAY['nutricion'::character varying, 'fisioterapia'::character varying])::text[])));
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_area_fecha_key UNIQUE (area, fecha);
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_area_not_null NOT NULL area;
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_created_at_not_null NOT NULL created_at;
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_fecha_not_null NOT NULL fecha;
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_id_not_null NOT NULL id;
ALTER TABLE cierres_clinicos ADD CONSTRAINT cierres_clinicos_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX cierres_clinicos_area_fecha_key ON public.cierres_clinicos USING btree (area, fecha);
CREATE UNIQUE INDEX cierres_clinicos_pkey ON public.cierres_clinicos USING btree (id);
CREATE INDEX idx_cierres_clinicos_fecha ON public.cierres_clinicos USING btree (fecha);


-- ============================================================
-- TABLA: citas
-- ============================================================
CREATE TABLE citas (
  id integer NOT NULL DEFAULT nextval('citas_id_seq'::regclass),
  paciente_id integer,
  paciente_nombre character varying(255) NOT NULL,
  tipo character varying(50) NOT NULL,
  fecha date NOT NULL,
  hora time without time zone NOT NULL,
  estado character varying(50) NOT NULL DEFAULT 'pendiente'::character varying,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  practicante_id integer,
  practicante_asignado_id integer,
  validada_por_admin boolean DEFAULT false,
  hora_validada time without time zone,
  indicaciones_admin text,
  practicante_nombre character varying(100),
  fecha_asignacion timestamp without time zone,
  tipo_consulta character varying(20),
  iniciada_en timestamp with time zone,
  finalizada_en timestamp with time zone,
  borrador jsonb,
  borrador_actualizado_en timestamp with time zone,
  timer_expira_en timestamp with time zone,
  recordatorio_enviado boolean NOT NULL DEFAULT false,
  conflicto_horario_notificado boolean NOT NULL DEFAULT false,
  asignacion_fallback boolean NOT NULL DEFAULT false
);

-- Constraints:
ALTER TABLE citas ADD CONSTRAINT citas_asignacion_fallback_not_null NOT NULL asignacion_fallback;
ALTER TABLE citas ADD CONSTRAINT citas_conflicto_horario_notificado_not_null NOT NULL conflicto_horario_notificado;
ALTER TABLE citas ADD CONSTRAINT citas_estado_not_null NOT NULL estado;
ALTER TABLE citas ADD CONSTRAINT citas_fecha_not_null NOT NULL fecha;
ALTER TABLE citas ADD CONSTRAINT citas_hora_not_null NOT NULL hora;
ALTER TABLE citas ADD CONSTRAINT citas_id_not_null NOT NULL id;
ALTER TABLE citas ADD CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE citas ADD CONSTRAINT citas_paciente_nombre_not_null NOT NULL paciente_nombre;
ALTER TABLE citas ADD CONSTRAINT citas_pkey PRIMARY KEY (id);
ALTER TABLE citas ADD CONSTRAINT citas_practicante_asignado_id_fkey FOREIGN KEY (practicante_asignado_id) REFERENCES usuarios(id);
ALTER TABLE citas ADD CONSTRAINT citas_practicante_id_fkey FOREIGN KEY (practicante_id) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE citas ADD CONSTRAINT citas_recordatorio_enviado_not_null NOT NULL recordatorio_enviado;
ALTER TABLE citas ADD CONSTRAINT citas_tipo_not_null NOT NULL tipo;

-- Indices:
CREATE UNIQUE INDEX citas_pkey ON public.citas USING btree (id);
CREATE INDEX idx_citas_paciente ON public.citas USING btree (paciente_id);
CREATE UNIQUE INDEX idx_citas_paciente_fecha_hora_activa ON public.citas USING btree (paciente_id, fecha, hora) WHERE ((estado)::text = ANY ((ARRAY['programada'::character varying, 'en_atencion'::character varying])::text[]));
CREATE INDEX idx_citas_practicante ON public.citas USING btree (practicante_id);
CREATE UNIQUE INDEX idx_citas_practicante_fecha_hora_activa ON public.citas USING btree (practicante_id, fecha, hora) WHERE (((estado)::text = ANY ((ARRAY['programada'::character varying, 'en_atencion'::character varying])::text[])) AND (practicante_id IS NOT NULL));


-- ============================================================
-- TABLA: citas_auditoria
-- ============================================================
CREATE TABLE citas_auditoria (
  id integer NOT NULL DEFAULT nextval('citas_auditoria_id_seq'::regclass),
  cita_id integer,
  estado_anterior character varying(30),
  estado_nuevo character varying(30) NOT NULL,
  usuario_id integer,
  usuario_nombre character varying(255),
  usuario_rol character varying(20),
  motivo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Constraints:
ALTER TABLE citas_auditoria ADD CONSTRAINT citas_auditoria_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE;
ALTER TABLE citas_auditoria ADD CONSTRAINT citas_auditoria_created_at_not_null NOT NULL created_at;
ALTER TABLE citas_auditoria ADD CONSTRAINT citas_auditoria_estado_nuevo_not_null NOT NULL estado_nuevo;
ALTER TABLE citas_auditoria ADD CONSTRAINT citas_auditoria_id_not_null NOT NULL id;
ALTER TABLE citas_auditoria ADD CONSTRAINT citas_auditoria_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX citas_auditoria_pkey ON public.citas_auditoria USING btree (id);
CREATE INDEX idx_citas_auditoria_cita_id ON public.citas_auditoria USING btree (cita_id);


-- ============================================================
-- TABLA: consentimientos_informados
-- ============================================================
CREATE TABLE consentimientos_informados (
  id integer NOT NULL DEFAULT nextval('consentimientos_informados_id_seq'::regclass),
  paciente_id integer NOT NULL,
  area character varying(20) NOT NULL,
  appointment_id integer,
  storage_provider character varying(20) NOT NULL DEFAULT 'postgres'::character varying,
  storage_key character varying(500),
  archivo bytea,
  mime_type character varying(50),
  nombre_archivo character varying(255),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Constraints:
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES citas(id) ON DELETE SET NULL;
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_area_not_null NOT NULL area;
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_created_at_not_null NOT NULL created_at;
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_id_not_null NOT NULL id;
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_paciente_id_not_null NOT NULL paciente_id;
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_pkey PRIMARY KEY (id);
ALTER TABLE consentimientos_informados ADD CONSTRAINT consentimientos_informados_storage_provider_not_null NOT NULL storage_provider;

-- Indices:
CREATE UNIQUE INDEX consentimientos_informados_pkey ON public.consentimientos_informados USING btree (id);
CREATE INDEX idx_consentimientos_appointment ON public.consentimientos_informados USING btree (appointment_id);


-- ============================================================
-- TABLA: consultorios_config
-- ============================================================
CREATE TABLE consultorios_config (
  area character varying(20) NOT NULL,
  cantidad smallint NOT NULL DEFAULT 1,
  cantidad_pendiente smallint,
  vigente_desde date
);

-- Constraints:
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_area_check CHECK (((area)::text = ANY ((ARRAY['nutricion'::character varying, 'fisioterapia'::character varying])::text[])));
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_area_not_null NOT NULL area;
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_cantidad_check CHECK (((cantidad >= 1) AND (cantidad <= 10)));
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_cantidad_not_null NOT NULL cantidad;
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_cantidad_pendiente_check CHECK (((cantidad_pendiente >= 1) AND (cantidad_pendiente <= 10)));
ALTER TABLE consultorios_config ADD CONSTRAINT consultorios_config_pkey PRIMARY KEY (area);

-- Indices:
CREATE UNIQUE INDEX consultorios_config_pkey ON public.consultorios_config USING btree (area);


-- ============================================================
-- TABLA: correos_especiales
-- ============================================================
CREATE TABLE correos_especiales (
  id integer NOT NULL DEFAULT nextval('correos_especiales_id_seq'::regclass),
  dominio character varying(100) NOT NULL,
  proveedor character varying(20) DEFAULT 'nodemailer'::character varying,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  origen character varying(50)
);

-- Constraints:
ALTER TABLE correos_especiales ADD CONSTRAINT correos_especiales_dominio_key UNIQUE (dominio);
ALTER TABLE correos_especiales ADD CONSTRAINT correos_especiales_dominio_not_null NOT NULL dominio;
ALTER TABLE correos_especiales ADD CONSTRAINT correos_especiales_id_not_null NOT NULL id;
ALTER TABLE correos_especiales ADD CONSTRAINT correos_especiales_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX correos_especiales_dominio_key ON public.correos_especiales USING btree (dominio);
CREATE UNIQUE INDEX correos_especiales_pkey ON public.correos_especiales USING btree (id);


-- ============================================================
-- TABLA: historiales_fisioterapia
-- ============================================================
CREATE TABLE historiales_fisioterapia (
  id integer NOT NULL DEFAULT nextval('historiales_fisioterapia_id_seq'::regclass),
  paciente_id integer,
  paciente_nombre character varying(100),
  tipo character varying(50),
  datos jsonb NOT NULL,
  creado_por integer,
  creado_por_nombre character varying(100),
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  appointment_id integer,
  duracion_carga integer,
  timestamp_inicio timestamp without time zone
);

-- Constraints:
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES citas(id);
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_datos_not_null NOT NULL datos;
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_id_not_null NOT NULL id;
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE historiales_fisioterapia ADD CONSTRAINT historiales_fisioterapia_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX historiales_fisioterapia_pkey ON public.historiales_fisioterapia USING btree (id);
CREATE INDEX idx_historiales_fisio_paciente ON public.historiales_fisioterapia USING btree (paciente_id);


-- ============================================================
-- TABLA: historiales_medicos
-- ============================================================
CREATE TABLE historiales_medicos (
  id integer NOT NULL DEFAULT nextval('historiales_medicos_id_seq'::regclass),
  paciente_id integer,
  paciente_nombre character varying(255) NOT NULL,
  tipo character varying(50) NOT NULL,
  datos jsonb NOT NULL,
  creado_por integer,
  creado_por_nombre character varying(255),
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  duracion_carga integer,
  timestamp_inicio timestamp without time zone
);

-- Constraints:
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_datos_not_null NOT NULL datos;
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_id_not_null NOT NULL id;
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_paciente_nombre_not_null NOT NULL paciente_nombre;
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_pkey PRIMARY KEY (id);
ALTER TABLE historiales_medicos ADD CONSTRAINT historiales_medicos_tipo_not_null NOT NULL tipo;

-- Indices:
CREATE UNIQUE INDEX historiales_medicos_pkey ON public.historiales_medicos USING btree (id);
CREATE INDEX idx_historiales_paciente ON public.historiales_medicos USING btree (paciente_id);


-- ============================================================
-- TABLA: historiales_nutricion
-- ============================================================
CREATE TABLE historiales_nutricion (
  id integer NOT NULL DEFAULT nextval('historiales_nutricion_id_seq'::regclass),
  paciente_id integer,
  paciente_nombre character varying(100),
  tipo character varying(50),
  datos jsonb NOT NULL,
  creado_por integer,
  creado_por_nombre character varying(100),
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  appointment_id integer,
  duracion_carga integer,
  timestamp_inicio timestamp without time zone
);

-- Constraints:
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES citas(id);
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_datos_not_null NOT NULL datos;
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_id_not_null NOT NULL id;
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE historiales_nutricion ADD CONSTRAINT historiales_nutricion_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX historiales_nutricion_pkey ON public.historiales_nutricion USING btree (id);
CREATE INDEX idx_historiales_nutri_paciente ON public.historiales_nutricion USING btree (paciente_id);


-- ============================================================
-- TABLA: horarios_atencion
-- ============================================================
CREATE TABLE horarios_atencion (
  id integer NOT NULL DEFAULT nextval('horarios_atencion_id_seq'::regclass),
  area character varying(20) NOT NULL,
  dia_semana smallint NOT NULL,
  hora_inicio time without time zone NOT NULL DEFAULT '08:00:00'::time without time zone,
  hora_fin time without time zone NOT NULL DEFAULT '24:00:00'::time without time zone,
  activo boolean NOT NULL DEFAULT false
);

-- Constraints:
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_activo_not_null NOT NULL activo;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_area_check CHECK (((area)::text = ANY ((ARRAY['nutricion'::character varying, 'fisioterapia'::character varying])::text[])));
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_area_dia_semana_key UNIQUE (area, dia_semana);
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_area_not_null NOT NULL area;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_dia_semana_check CHECK (((dia_semana >= 1) AND (dia_semana <= 7)));
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_dia_semana_not_null NOT NULL dia_semana;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_hora_fin_not_null NOT NULL hora_fin;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_hora_inicio_not_null NOT NULL hora_inicio;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_id_not_null NOT NULL id;
ALTER TABLE horarios_atencion ADD CONSTRAINT horarios_atencion_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX horarios_atencion_area_dia_semana_key ON public.horarios_atencion USING btree (area, dia_semana);
CREATE UNIQUE INDEX horarios_atencion_pkey ON public.horarios_atencion USING btree (id);


-- ============================================================
-- TABLA: horarios_practicas
-- ============================================================
CREATE TABLE horarios_practicas (
  id integer NOT NULL DEFAULT nextval('horarios_practicas_id_seq'::regclass),
  usuario_id integer NOT NULL,
  dia_semana smallint NOT NULL,
  hora_inicio time without time zone,
  hora_fin time without time zone,
  activo boolean NOT NULL DEFAULT false
);

-- Constraints:
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_activo_not_null NOT NULL activo;
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_dia_semana_not_null NOT NULL dia_semana;
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_id_not_null NOT NULL id;
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_pkey PRIMARY KEY (id);
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_usuario_id_dia_semana_key UNIQUE (usuario_id, dia_semana);
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE horarios_practicas ADD CONSTRAINT horarios_practicas_usuario_id_not_null NOT NULL usuario_id;

-- Indices:
CREATE UNIQUE INDEX horarios_practicas_pkey ON public.horarios_practicas USING btree (id);
CREATE UNIQUE INDEX horarios_practicas_usuario_id_dia_semana_key ON public.horarios_practicas USING btree (usuario_id, dia_semana);
CREATE INDEX idx_horarios_usuario ON public.horarios_practicas USING btree (usuario_id);


-- ============================================================
-- TABLA: logs_sistema
-- ============================================================
CREATE TABLE logs_sistema (
  id integer NOT NULL DEFAULT nextval('logs_sistema_id_seq'::regclass),
  tipo character varying(50),
  descripcion text,
  fecha timestamp without time zone DEFAULT now(),
  usuario_id integer,
  area character varying(50),
  metadata jsonb
);

-- Constraints:
ALTER TABLE logs_sistema ADD CONSTRAINT logs_sistema_id_not_null NOT NULL id;
ALTER TABLE logs_sistema ADD CONSTRAINT logs_sistema_pkey PRIMARY KEY (id);
ALTER TABLE logs_sistema ADD CONSTRAINT logs_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

-- Indices:
CREATE UNIQUE INDEX logs_sistema_pkey ON public.logs_sistema USING btree (id);


-- ============================================================
-- TABLA: metricas
-- ============================================================
CREATE TABLE metricas (
  id integer NOT NULL DEFAULT nextval('metricas_id_seq'::regclass),
  tipo_evento character varying(50) NOT NULL,
  area character varying(50),
  paciente_id integer,
  practicante_id integer,
  valor_numerico numeric DEFAULT 0,
  metadata jsonb,
  fecha_registro timestamp without time zone DEFAULT now()
);

-- Constraints:
ALTER TABLE metricas ADD CONSTRAINT metricas_id_not_null NOT NULL id;
ALTER TABLE metricas ADD CONSTRAINT metricas_pkey PRIMARY KEY (id);
ALTER TABLE metricas ADD CONSTRAINT metricas_tipo_evento_not_null NOT NULL tipo_evento;

-- Indices:
CREATE INDEX idx_metricas_tipo_evento ON public.metricas USING btree (tipo_evento);
CREATE UNIQUE INDEX metricas_pkey ON public.metricas USING btree (id);


-- ============================================================
-- TABLA: notas_evolucion
-- ============================================================
CREATE TABLE notas_evolucion (
  id integer NOT NULL DEFAULT nextval('notas_evolucion_id_seq'::regclass),
  paciente_id integer,
  practicante_id integer,
  appointment_id integer,
  nombre_completo character varying(255),
  numero_expediente character varying(100),
  edad integer,
  fecha_elaboracion timestamp without time zone,
  cuadro_evolucion jsonb,
  formato_edime text,
  area character varying(50) DEFAULT 'nutricion'::character varying,
  fecha_creacion timestamp without time zone DEFAULT now()
);

-- Constraints:
ALTER TABLE notas_evolucion ADD CONSTRAINT notas_evolucion_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES citas(id) ON DELETE CASCADE;
ALTER TABLE notas_evolucion ADD CONSTRAINT notas_evolucion_id_not_null NOT NULL id;
ALTER TABLE notas_evolucion ADD CONSTRAINT notas_evolucion_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE notas_evolucion ADD CONSTRAINT notas_evolucion_pkey PRIMARY KEY (id);
ALTER TABLE notas_evolucion ADD CONSTRAINT notas_evolucion_practicante_id_fkey FOREIGN KEY (practicante_id) REFERENCES usuarios(id);

-- Indices:
CREATE UNIQUE INDEX notas_evolucion_pkey ON public.notas_evolucion USING btree (id);


-- ============================================================
-- TABLA: notas_universitarias
-- ============================================================
CREATE TABLE notas_universitarias (
  id integer NOT NULL DEFAULT nextval('notas_universitarias_id_seq'::regclass),
  titulo character varying(255) NOT NULL,
  contenido text NOT NULL,
  categoria character varying(50) NOT NULL,
  creado_por integer,
  creado_por_nombre character varying(255),
  fecha_creacion timestamp with time zone NOT NULL,
  fecha_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  respuesta text,
  fecha_respuesta timestamp without time zone,
  destinatario_especifico character varying(255),
  creado_por_email character varying(255),
  destinatario_id integer,
  destinatario_rol character varying(20) DEFAULT 'todos'::character varying
);

-- Constraints:
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_categoria_not_null NOT NULL categoria;
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_contenido_not_null NOT NULL contenido;
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES usuarios(id);
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_fecha_creacion_not_null NOT NULL fecha_creacion;
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_id_not_null NOT NULL id;
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_pkey PRIMARY KEY (id);
ALTER TABLE notas_universitarias ADD CONSTRAINT notas_universitarias_titulo_not_null NOT NULL titulo;

-- Indices:
CREATE UNIQUE INDEX notas_universitarias_pkey ON public.notas_universitarias USING btree (id);


-- ============================================================
-- TABLA: password_resets
-- ============================================================
CREATE TABLE password_resets (
  id integer NOT NULL DEFAULT nextval('password_resets_id_seq'::regclass),
  email character varying(255) NOT NULL,
  codigo_verificacion character varying(6) NOT NULL,
  expira_en timestamp without time zone NOT NULL,
  creado_en timestamp without time zone DEFAULT now()
);

-- Constraints:
ALTER TABLE password_resets ADD CONSTRAINT password_resets_codigo_verificacion_not_null NOT NULL codigo_verificacion;
ALTER TABLE password_resets ADD CONSTRAINT password_resets_email_key UNIQUE (email);
ALTER TABLE password_resets ADD CONSTRAINT password_resets_email_not_null NOT NULL email;
ALTER TABLE password_resets ADD CONSTRAINT password_resets_expira_en_not_null NOT NULL expira_en;
ALTER TABLE password_resets ADD CONSTRAINT password_resets_id_not_null NOT NULL id;
ALTER TABLE password_resets ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX password_resets_email_key ON public.password_resets USING btree (email);
CREATE UNIQUE INDEX password_resets_pkey ON public.password_resets USING btree (id);


-- ============================================================
-- TABLA: practicantes_autorizados
-- ============================================================
CREATE TABLE practicantes_autorizados (
  id integer NOT NULL DEFAULT nextval('practicantes_autorizados_id_seq'::regclass),
  usuario_id integer,
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  area character varying(50) NOT NULL,
  estado character varying(50) NOT NULL,
  fecha_autorizacion date NOT NULL,
  fecha_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Constraints:
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_area_not_null NOT NULL area;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_email_not_null NOT NULL email;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_estado_not_null NOT NULL estado;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_fecha_autorizacion_not_null NOT NULL fecha_autorizacion;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_id_not_null NOT NULL id;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_nombre_not_null NOT NULL nombre;
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_pkey PRIMARY KEY (id);
ALTER TABLE practicantes_autorizados ADD CONSTRAINT practicantes_autorizados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Indices:
CREATE UNIQUE INDEX practicantes_autorizados_pkey ON public.practicantes_autorizados USING btree (id);


-- ============================================================
-- TABLA: recomendaciones_nutricion
-- ============================================================
CREATE TABLE recomendaciones_nutricion (
  id integer NOT NULL DEFAULT nextval('recomendaciones_nutricion_id_seq'::regclass),
  paciente_id integer NOT NULL,
  paciente_nombre character varying(255) NOT NULL,
  area character varying(50) NOT NULL,
  contenido text NOT NULL,
  creado_por_id integer NOT NULL,
  creado_por_nombre character varying(255) NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Constraints:
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_area_not_null NOT NULL area;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_contenido_not_null NOT NULL contenido;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_creado_por_id_not_null NOT NULL creado_por_id;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_creado_por_nombre_not_null NOT NULL creado_por_nombre;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_id_not_null NOT NULL id;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_paciente_id_not_null NOT NULL paciente_id;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_paciente_nombre_not_null NOT NULL paciente_nombre;
ALTER TABLE recomendaciones_nutricion ADD CONSTRAINT recomendaciones_nutricion_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX recomendaciones_nutricion_pkey ON public.recomendaciones_nutricion USING btree (id);


-- ============================================================
-- TABLA: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
  id integer NOT NULL DEFAULT nextval('refresh_tokens_id_seq'::regclass),
  usuario_id integer NOT NULL,
  token_hash text NOT NULL,
  expira_en timestamp with time zone NOT NULL,
  revocado boolean NOT NULL DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now()
);

-- Constraints:
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_creado_en_not_null NOT NULL creado_en;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_expira_en_not_null NOT NULL expira_en;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_id_not_null NOT NULL id;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_revocado_not_null NOT NULL revocado;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_token_hash_not_null NOT NULL token_hash;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_usuario_id_not_null NOT NULL usuario_id;

-- Indices:
CREATE INDEX idx_refresh_tokens_usuario_id ON public.refresh_tokens USING btree (usuario_id);
CREATE UNIQUE INDEX refresh_tokens_pkey ON public.refresh_tokens USING btree (id);
CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


-- ============================================================
-- TABLA: registro_temporal
-- ============================================================
CREATE TABLE registro_temporal (
  id integer NOT NULL DEFAULT nextval('registro_temporal_id_seq'::regclass),
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  password_hash text NOT NULL,
  codigo_verificacion character varying(6) NOT NULL,
  expira_en timestamp without time zone NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT now(),
  telefono character varying(10)
);

-- Constraints:
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_codigo_verificacion_not_null NOT NULL codigo_verificacion;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_email_key UNIQUE (email);
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_email_not_null NOT NULL email;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_expira_en_not_null NOT NULL expira_en;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_id_not_null NOT NULL id;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_nombre_not_null NOT NULL nombre;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_password_hash_not_null NOT NULL password_hash;
ALTER TABLE registro_temporal ADD CONSTRAINT registro_temporal_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX registro_temporal_email_key ON public.registro_temporal USING btree (email);
CREATE UNIQUE INDEX registro_temporal_pkey ON public.registro_temporal USING btree (id);


-- ============================================================
-- TABLA: respuestas_comunicados
-- ============================================================
CREATE TABLE respuestas_comunicados (
  id integer NOT NULL DEFAULT nextval('respuestas_comunicados_id_seq'::regclass),
  nota_id integer NOT NULL,
  autor_id integer NOT NULL,
  contenido text NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT now()
);

-- Constraints:
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES usuarios(id);
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_autor_id_not_null NOT NULL autor_id;
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_contenido_not_null NOT NULL contenido;
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_id_not_null NOT NULL id;
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_nota_id_fkey FOREIGN KEY (nota_id) REFERENCES notas_universitarias(id) ON DELETE CASCADE;
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_nota_id_not_null NOT NULL nota_id;
ALTER TABLE respuestas_comunicados ADD CONSTRAINT respuestas_comunicados_pkey PRIMARY KEY (id);

-- Indices:
CREATE UNIQUE INDEX respuestas_comunicados_pkey ON public.respuestas_comunicados USING btree (id);


-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  nombre character varying(255) NOT NULL,
  email character varying(255) NOT NULL,
  password character varying(255) NOT NULL,
  rol character varying(50) NOT NULL,
  area character varying(50),
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  matricula character varying(20),
  telefono character varying(50),
  status character varying(50) DEFAULT 'activo'::character varying,
  primer_inicio boolean DEFAULT false,
  numero_empleado character varying(20)
);

-- Constraints:
ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_not_null NOT NULL email;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_not_null NOT NULL id;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_matricula_key UNIQUE (matricula);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombre_not_null NOT NULL nombre;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_password_not_null NOT NULL password;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_not_null NOT NULL rol;

-- Indices:
CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);
CREATE UNIQUE INDEX usuarios_matricula_key ON public.usuarios USING btree (matricula);
CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id);


