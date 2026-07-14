# Estrategia de Responsive Design — Clínica UTC

Documento de estrategia oficial. Ninguna modificación de responsive design debe hacerse sin
seguir las reglas de este documento. Basado en auditoría completa del código realizada el
2026-07-12 (16 páginas, ~15 componentes compartidos, ~19,700 líneas).

## 1. Filosofía responsive

Una sola base de código, un solo árbol de componentes, comportamiento funcional idéntico en
cualquier tamaño de pantalla. La adaptación es de **distribución**, nunca de **contenido**: lo
que cambia entre un teléfono y un monitor es cómo se acomodan los elementos en el espacio
disponible, no qué elementos existen.

Dos mecanismos, en este orden de preferencia:

1. **CSS-first (por defecto, ~90% de los casos).** Reflow puro con breakpoints de Tailwind:
   grids que reducen columnas, flex que cambia de dirección, texto que se apila. No requiere
   JavaScript ni detectar el dispositivo. Es el mecanismo por defecto porque las primitivas base
   (`Card`, `Input`, `Select`) ya son fluidas (`w-full`, sin anchos fijos) — la mayoría del
   trabajo real está en cómo las páginas arman sus `grid`/`flex` alrededor de ellas, no en las
   primitivas.
2. **JS-conditional (excepción, solo donde CSS no basta).** Tras la decisión de la sección 9
   (separación de captura y representación documental), el único caso real que queda en esta
   categoría es agregar handlers táctiles a `TimeScrollPicker` — que ni siquiera es detección de
   dispositivo, es soporte de evento faltante. Los 3 formularios clínicos grandes **dejan de ser
   una excepción**: su interfaz de captura pasa a construirse igual que cualquier otra página del
   sistema (100% CSS-first, sección 6), porque deja de depender del layout en milímetros de la
   hoja impresa. No se usa JS-conditional para decisiones de layout que sí se pueden resolver con
   breakpoints.

Regla madre: **reorganizar, nunca remover.** Si una solución implica `display: none` en móvil
para algo que no es puramente decorativo, o "resumir" una tabla a menos columnas, esa solución
está descartada por definición — hay que buscar otra (scroll horizontal, apilado, etc.).

## 2. Guía oficial de breakpoints

El proyecto usa Tailwind v4 con los breakpoints por defecto (no hay `tailwind.config` que los
sobreescriba): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Mobile-first:
las clases sin prefijo son la base (la más pequeña), los prefijos agregan comportamiento hacia
arriba — nunca al revés.

Reglas de uso por breakpoint, válidas para todo el proyecto (ninguna página decide esto por su
cuenta):

| Breakpoint | Dispositivo típico | Regla |
|---|---|---|
| base (sin prefijo) | Teléfono, <640px | 1 columna en grids de formulario y de tarjetas. Botones apilados (`flex-col`) o en wrap. Tablas con scroll horizontal. Diálogos a ancho completo menos margen (ya es el comportamiento por defecto de `DialogContent`). |
| `sm:` 640px+ | Teléfono grande / tablet chica en vertical | Formularios de campos cortos pueden pasar a 2 columnas. Diálogos ganan `max-w`. |
| `md:` 768px+ | Tablet / laptop chica | Grids de tarjetas de dashboard pasan a 2 columnas. `TabsList` puede mostrar etiquetas completas sin scroll si caben. |
| `lg:` 1024px+ | Laptop | Grids de tarjetas a 3–4 columnas. `ConsultaWorkspace` pasa a su grid de 3 columnas (`lg:grid-cols-3`, ya implementado). |
| `xl:`/`2xl:` 1280/1536px+ | Monitor grande | Contener el ancho máximo del contenido (`max-w-7xl mx-auto`, patrón ya usado en `ConsultaWorkspace.tsx:523`) en vez de estirar todo borde a borde — evita líneas de texto y tablas absurdamente anchas. |

Cualquier patrón nuevo de breakpoint que se necesite se agrega primero a esta tabla, y luego se
implementa — no al revés.

## 3. Componentes que se adaptan una sola vez (alto apalancamiento)

Estos cambios se hacen **una vez** en la primitiva compartida y benefician a todo el sistema.
Es la Fase 0 del plan (sección 8) y debe completarse antes de tocar páginas.

- **`table.tsx`** — Ya envuelve la tabla en `overflow-x-auto`. No requiere cambio; ya es el
  patrón canónico de "tabla completa con scroll horizontal" que usa todo el sistema. Referencia
  de implementación correcta: `AppointmentManager.tsx:117-118`.
- **`tabs.tsx` (`TabsList`)** — **Necesita cambio.** Hoy es `inline-flex w-fit` con altura fija,
  sin wrap ni scroll. Con 5+ tabs (varios dashboards los tienen) en pantalla angosta, el texto se
  corta o desborda. Fix: `overflow-x-auto` con scrollbar oculta (mismo patrón que ya usan
  `PatientDashboard.tsx:253` y `PatientPlans.tsx:33`: `overflow-x-auto -mx-4 px-4 sm:mx-0
  sm:px-0 scrollbar-hide`), nunca wrap ni recorte de etiquetas.
- **`dialog.tsx`** — Ya es el componente mejor preparado (`max-w-[calc(100%-2rem)] sm:max-w-lg`,
  footer que apila botones en móvil). Estandarizar `max-h-[90vh] overflow-y-auto` (patrón ya
  usado en `AppointmentManager.tsx`) como regla para **todo** Dialog con formularios largos, no
  solo ese. De paso, corregir la progresión de ancho anómala en el modal de reagendar
  (`AppointmentManager.tsx:221`: `max-w-2xl sm:max-w-xl md:max-w-2xl` — el máximo se reduce en
  `sm` y vuelve a crecer en `md`, casi seguro un descuido, no diseño intencional).
- **`badge.tsx`** — Agregar `truncate` + `title` (tooltip nativo) como salvaguarda; hoy es
  `whitespace-nowrap` sin límite, puede desbordar columnas angostas con texto largo (nombres de
  rol/área largos).
- **`calendar.tsx`** — Validar (no necesariamente cambiar) que la grilla de 7 columnas de
  `size-8.75` quepa en 320px de ancho — es el único punto de riesgo de layout en esta primitiva.
- **`TimeScrollPicker.tsx`** — **Bug funcional real, no solo de estilo.** El arrastre para girar
  horas/minutos solo tiene handlers de mouse (`mousedown/mousemove/mouseup`) y `wheel`; no hay
  `touchstart/touchmove/touchend`. En touch puro, el drag no responde — aunque quedan
  alternativas funcionales (botones ↑↓ e input de texto `HH:MM`), no es fidelidad total con
  desktop. Agregar handlers táctiles equivalentes a los de mouse. Se usa en `HorarioPracticas.tsx`
  y `AppointmentForm.tsx`, así que el fix beneficia ambos.
- **`DateFilterPicker.tsx` / `MonthFilterPicker.tsx`** — Ambos calculan la posición de su panel
  (portal a `document.body`) una sola vez al abrir (`PANEL_H`/`PANEL_W` fijos), y no la
  recalculan si el usuario rota el dispositivo o hace scroll con el panel abierto. Fix
  centralizado: recalcular en `resize`/`orientationchange` mientras el panel esté abierto.
- **`useIsMobile`** — No hay ningún hook de detección de viewport/mobile en el proyecto (se
  confirmó que no existe `src/app/hooks/`). Con la decisión de la sección 9, ya **no se necesita
  crear este hook**: el único caso que lo hubiera justificado (bifurcar la interfaz de los
  formularios clínicos según dispositivo) desaparece porque la nueva interfaz de captura es
  responsive por CSS igual que el resto del sistema. Si en el futuro aparece un caso real que
  requiera detección de viewport por JS, se agrega entonces — no antes.

## 4. Tablas vs. tarjetas — veredicto por caso (CORREGIDO 2026-07-13)

**Decisión revertida.** La versión original de esta sección (scroll horizontal, sin conversión a
tarjetas) fue probada en el navegador real por Enrique y rechazada: una tabla con scroll horizontal
sin ninguna señal visual de que hay más columnas a la derecha se percibe — y de hecho *funciona*
para el usuario — como si el contenido hubiera desaparecido, aunque técnicamente siga alcanzable.
Eso viola la regla central del proyecto ("ningún contenido de la versión escritorio debe
desaparecer, por mínimo que sea") en la práctica, no solo en la letra.

**Patrón oficial, obligatorio para toda tabla de datos:** el mismo que ya existía en
`PatientList.tsx` (`block md:hidden` = vista de tarjetas apiladas en móvil/tablet, `hidden
md:block` = `<Table>` real en desktop) — **no** fue diseñado durante este proceso, ya estaba en el
código y es la referencia a copiar exactamente para el resto de las tablas. Cada fila de la tabla
se convierte en una tarjeta con pares etiqueta:valor apilados verticalmente, más los botones de
acción de esa fila. El scroll horizontal en tablas queda descartado como solución para datos
tabulares — se reserva únicamente para casos ya resueltos que no son objeto de esta sección (ej.
`TabsList`, sección 3).

| Tabla | Ubicación | Columnas | Veredicto |
|---|---|---|---|
| Docentes/practicantes | `MasterAdminDashboard.tsx` | 5 (Info, Rol, Área, Estado, Citas) | Convertir a patrón dual tarjeta/tabla |
| Personal (Nutrición) | `NutritionAdminDashboard.tsx` | 4 | Convertir a patrón dual tarjeta/tabla |
| Personal (Fisioterapia) | `PhysiotherapyAdminDashboard.tsx` | 4 | Convertir a patrón dual tarjeta/tabla |
| Personal (gestión completa) | `ManagePersonnelPage.tsx` | 8 (incl. 3 botones de acción) | Patrón dual tarjeta/tabla, pero con breakpoint `lg:` (1024px) en vez de `md:` (768px) — es la tabla más ancha del sistema y a 768px seguía apretada incluso en su propia vista de escritorio; confirmado en QA 2026-07-13 |
| Lista de pacientes | `PatientList.tsx:131-198` | 5–6 | Ya implementado — es la plantilla de referencia para las demás |
| Citas | `AppointmentManager.tsx:118` | 5 | Convertir a patrón dual tarjeta/tabla |

Los `grid grid-cols-N` que parecen "tablas" en `StatisticsPage.tsx`, `HorarioPracticas.tsx`,
`AppointmentForm.tsx`, `NotesViewer.tsx` y `MedicalHistoryViewer.tsx` no son datos tabulares — son
tarjetas KPI, grids de selección o campos de solo-lectura; su tratamiento correcto sigue siendo
colapsar a 1 columna en móvil (patrón de sección 6), no la disyuntiva tabla/tarjeta.

## 5. Navegación y modales — hallazgos que cambian el enunciado original

No existe un sidebar lateral fijo en el proyecto (se verificó que no hay ningún componente
`Sidebar`/`Nav` compartido). La navegación real son dos mecanismos ya existentes, duplicados a
propósito en los 6 dashboards:

1. **Tabs horizontales** (`TabsList`) como menú principal de cada dashboard — el punto de riesgo
   real está en la sección 3 (scroll horizontal, no un sidebar que convertir en drawer).
2. **Drawer lateral derecho** para perfil/cuenta — ya es un drawer (`fixed`, `translate-x-full` /
   `translate-x-0`), reimplementado igual en los 6 dashboards, cambiando solo el color de marca.
   No requiere rediseño, solo verificación de que el ancho (`max-w-sm`) se comporte bien en
   pantallas muy angostas.

Diálogos: conviven un `Dialog` real (Radix, 5 usos: `AppointmentManager`, ambos dashboards de
practicante, `ManagePersonnelPage` ×2) y un patrón de modal hecho a mano (`fixed inset-0
bg-black/60 ... flex items-center justify-center` con estado `isDeleteModalOpen`) repetido en los
6 dashboards para confirmaciones de borrado. Se mantienen ambos patrones — no hay necesidad de
migrar el modal hecho a mano a `Dialog`, pero si se toca, debe seguir la misma regla de
`max-h-[90vh] overflow-y-auto` de la sección 3.

## 6. Patrón general para dashboards y formularios (Tailwind estándar)

Aplica a los 6 dashboards, `StatisticsPage`, `ConsultaWorkspace`, todos los componentes
compartidos, y (tras la decisión de la sección 9) también a la nueva interfaz de captura de los
3 formularios clínicos — la hoja impresa en milímetros queda fuera de este patrón por diseño,
porque deja de ser una interfaz interactiva.

- **Grids de tarjetas KPI/resumen:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (ajustar el
  número final según cuántas tarjetas haya realmente — no forzar 4 si son 3).
- **Pares de campos de formulario** (ej. "Peso | Talla"): `grid grid-cols-1 sm:grid-cols-2
  gap-4`. Ya es el patrón correcto usado en los diálogos de edición de varios dashboards — se
  generaliza, no se inventa.
- **Filas de botones de acción:** `flex flex-wrap gap-2` o `flex-col sm:flex-row gap-2` — nunca
  asumir que caben en una línea.
- **Contenedores de scroll horizontal** (tablas, tabs, carruseles de tarjetas): el mismo patrón
  ya validado en `PatientDashboard.tsx`/`PatientPlans.tsx`: `overflow-x-auto -mx-4 px-4 sm:mx-0
  sm:px-0 scrollbar-hide`.
- **Container queries (`@container`)** — Tailwind v4 ya las usa en `card.tsx` (`@container/card-header`).
  Usarlas selectivamente cuando un mismo componente se reutiliza dentro de contenedores de ancho
  distinto (ej. una `Card` que a veces vive en un grid de 1 columna y a veces en uno de 4) y el
  breakpoint de *viewport* daría el tamaño equivocado según dónde esté montada.

## 7. Calendarios y selección de fecha/hora — estrategia

- `AppointmentForm.tsx` ya es la referencia correcta: grid de horarios `grid-cols-3 sm:grid-cols-4
  md:grid-cols-6` con `overflow-y-auto`, sin depender de mouse. Replicar este patrón, no
  reinventarlo, en cualquier otro selector de horario nuevo.
- `TimeScrollPicker`: agregar soporte táctil (sección 3) — es la única brecha funcional real de
  esta área.
- `DateFilterPicker`/`MonthFilterPicker`: recalcular posición del panel en resize/rotación
  (sección 3). El grid de 12 meses (4×3) dentro del panel de 280px de `MonthFilterPicker` es
  ajustado pero cabe incluso en un viewport de 320px — no requiere rediseño, solo la corrección
  de reposicionamiento.
- `HorarioPracticas.tsx` ya tiene su propio breakpoint (`grid-cols-2 sm:grid-cols-3`) y no
  requiere más cambios más allá de heredar el fix táctil de `TimeScrollPicker`.

## 8. Fases de trabajo

**Fase 0 — Fundamentos compartidos (bloquea todo lo demás).**
Cambios de la sección 3 completos: `TabsList` con scroll, estandarizar `max-h-[90vh]
overflow-y-auto` en Dialog, corregir el `max-w` anómalo del modal de reagendar, `truncate` en
Badge, soporte táctil en `TimeScrollPicker`, reposicionamiento en Date/MonthFilterPicker, crear
`useIsMobile`. Se prueba cada primitiva en **todos** sus call-sites conocidos antes de avanzar.

**Fase 1 — Autenticación.** `Login`, `Register`, `ForgotPassword`, `CambiarPasswordInicial`. Ya
tienen la mayor densidad de clases responsive existentes (12–14 usos cada uno) — validación
rápida, bajo riesgo.

**Fase 2 — Los 6 dashboards + `StatisticsPage`.** Aplicar sección 6 a cada uno. Como la
duplicación entre dashboards es intencional (decisión de arquitectura ya tomada, ver CLAUDE.md),
cada fix se replica manualmente en los 6 con checklist explícito — no se asume que arreglar uno
arregla los demás.

**Fase 3 — Componentes compartidos restantes.** `AppointmentForm`, `AppointmentManager`,
`PatientList`, `PatientPlans`, `NotesViewer`, `MedicalHistoryViewer`, `HorarioPracticas`,
`PractitionerManagement`, `ManagePersonnelPage`.

**Fase 4 — `ConsultaWorkspace`.** El de menor riesgo: ya usa Tailwind estándar y ya tiene la base
responsive (`grid-cols-1 lg:grid-cols-3`). Solo valida breakpoints y el header `sticky` en
pantallas chicas.

**Fase 5 — Separación de captura y representación documental (sección 9).** La fase más grande
del proyecto: extraer la lógica compartida (estado, validación, `FormClinicoHandle`, autoguardado
de borrador) de los 3 componentes actuales a hooks independientes; construir la nueva interfaz de
captura responsive sobre esos hooks; repuntar `ConsultaWorkspace.tsx` y las 4 rutas standalone
(`/forms/nutricion/:appointmentId`, `/forms/fisioterapia/:appointmentId`,
`/hoja-evolutiva/:appointmentId`, `/forms/seguimiento/:appointmentId`) a sus nuevos destinos;
dejar los 3 componentes de hoja impresa como renderizadores de solo lectura para impresión/PDF.
Por su tamaño (2 archivos >1500 líneas, uno >2500) merece su propia sesión de planeación detallada
(división en sub-fases por formulario) antes de escribir código — no se planea en detalle dentro
de este documento.

Cada fase se cierra probando visualmente en al menos **3 anchos**: 320px (móvil chico, ej. iPhone
SE), 768px (tablet), 1440px (desktop) — vía navegador real o Playwright, consistente con la
convención de verificación del CLAUDE.md del proyecto (no hay test runner automatizado).

## 9. Principio arquitectónico oficial: separación de captura y representación documental

**Estado: decisión cerrada (2026-07-12).** No se replantea sin autorización explícita — mismo
nivel de firmeza que la especificación del ciclo de vida clínico (`en_atencion`/`completada`/
`no_asistio`) ya cerrada en el proyecto.

### 9.1 El problema de origen

`HojaEvolutiva.tsx`, `NutritionMasterForm.tsx` y `PhysiotherapyMasterForm.tsx` **no están
construidos como formularios web** — son réplicas de documentos imprimibles de tamaño fijo:
contenedores en milímetros (`width: 215.9mm; min-height: 279.4mm`, `size: A4 portrait`), múltiples
bloques `@media print`/`@page` por archivo (hasta 6 en `NutritionMasterForm`), contenido dividido
en clases `.page`...`.page6` que representan páginas físicas, decenas de `<table>` HTML crudas con
`table-layout: fixed` y fuentes de 8.5–13px, y **cero** usos de `grid grid-cols-*` de Tailwind en
los tres archivos. El requisito "mismo formulario reorganizado, sin scroll horizontal" no se puede
cumplir agregando clases sobre esa geometría sin romperla.

### 9.2 Hallazgo de consistencia con la arquitectura existente (verificado en código)

Esto no es solo un problema de estilo — es un acoplamiento arquitectónico real que hay que
deshacer. Los 3 componentes hoy hacen **doble función** simultáneamente:

- Están cableados al contrato `FormClinicoHandle` (`triggerSave`, `canSave`, `restoreDraft`) y se
  montan directamente dentro de `ConsultaWorkspace.tsx` vía `formRef` — son la interfaz de
  captura interactiva durante la consulta en vivo (`ConsultaWorkspace.tsx:96,249,264`).
- Al mismo tiempo se montan como páginas standalone en 4 rutas (`routes.tsx:156-234`):
  `/forms/nutricion/:appointmentId`, `/forms/fisioterapia/:appointmentId`,
  `/hoja-evolutiva/:appointmentId`, `/forms/seguimiento/:appointmentId`.

Es decir: el mismo componente con layout en milímetros es, hoy, tanto la pantalla que usa el
practicante para capturar datos en vivo como el destino de las rutas standalone. Esta decisión
implica desacoplar esas dos funciones — no es un simple envoltorio responsive sobre el componente
existente, sino mover dónde vive la lógica de `FormClinicoHandle` y qué componente la implementa.
Esto confirma que la Opción A (ver historial de decisión abajo) es la única compatible con la
arquitectura ya cerrada del ciclo de vida clínico, y define el alcance real de la Fase 5.

### 9.3 Las dos responsabilidades (a partir de ahora, oficial)

**1. Captura de información clínica** — interfaz que usan los practicantes durante la consulta,
montada dentro de `ConsultaWorkspace` (reemplaza el montaje directo actual de los 3 componentes).
Completamente responsive (desktop, tablet, teléfono), construida con los patrones estándar de la
sección 6 (grids, cards, tabs, acordeones — cualquier patrón moderno de captura). No debe parecer
ni comportarse como una hoja impresa. Implementa ella misma el contrato `FormClinicoHandle`.

**2. Representación documental** — los 3 componentes actuales, con su formato institucional en
milímetros intacto sin modificar su apariencia. Su única responsabilidad pasa a ser: impresión,
generación de PDF, consulta del documento final, archivo clínico. Dejan de implementar
`FormClinicoHandle` como mecanismo de captura en vivo; pasan a ser renderizadores de solo lectura
alimentados por los datos ya persistidos.

### 9.4 Fuente única de información

Ambas vistas comparten exactamente la misma lógica — estado, validaciones, hooks, llamadas al
backend, reglas de negocio, persistencia y modelos se extraen a hooks compartidos (fuera de
cualquiera de las dos capas de presentación); solo cambia cómo se presenta la información. Flujo
de datos oficial, en un solo sentido:

```
Datos → Formulario de captura → Persistencia → Documento oficial
```

El documento impreso deja de ser el origen de la información; la captura hecha desde el Workspace
pasa a serlo. El sistema genera el documento oficial a partir de esos mismos datos persistidos —
nunca al revés.

### 9.5 Relación con el Workspace

`ConsultaWorkspace` sigue siendo el centro del flujo clínico: coordina, nunca conoce campos ni
validaciones del formulario (regla ya vigente, ver especificación del ciclo de vida clínico). El
formulario clínico (nueva interfaz de captura) es únicamente un módulo de captura de datos que el
Workspace monta; la hoja impresa es únicamente una representación documental, ya no se vuelve a
usar como interfaz interactiva de tamaño carta/A4.

### 9.6 Impresión, PDF y exportación — desacoplados de responsive

La impresión no depende del layout responsive de la captura. La hoja clínica impresa se genera
siempre desde el componente de representación documental, con el formato institucional existente
exactamente igual. Ningún cambio de responsive design en la interfaz de captura debe afectar PDF,
impresión o exportación — son dos caminos completamente desacoplados a partir de esta decisión.

### 9.7 Qué NO cambia

El formato institucional impreso/PDF permanece exactamente igual. La lógica de negocio, endpoints
de backend, y el contrato de persistencia no cambian. El ciclo de vida clínico
(`en_atencion`/`completada`/`no_asistio`), el mecanismo de borradores con autoguardado, y el patrón
de consentimiento informado (upload diferido) siguen funcionando igual — solo cambia dónde vive la
UI de captura, no cómo se guarda ni valida la información.

## 10. Riesgos

- **Riesgo de extracción de lógica compartida (Fase 5).** Mover `FormClinicoHandle`, validaciones
  y autoguardado de borrador desde los 3 componentes actuales a hooks independientes es un
  refactor de lógica clínica ya certificada en producción (ciclo de vida, borradores,
  consentimiento informado) — el riesgo no es de layout sino de comportamiento: hay que probar que
  guardar/recuperar borrador, validar campos requeridos y persistir siguen funcionando idéntico
  antes y después del split, no solo que la interfaz nueva se vea bien.
- **Ya no hay acoplamiento pantalla/impresión** (resuelto por la decisión de la sección 9): al
  desacoplar captura de representación documental, los cambios responsive en la interfaz de
  captura no pueden afectar el resultado impreso/exportado, porque dejan de compartir árbol de
  render. Aun así, cualquier cambio a los hooks compartidos de datos sí debe validarse contra el
  documento impreso, porque ambos consumen la misma fuente de datos.
- **Sin suite de pruebas automatizada.** Toda verificación es visual/manual; con ~19,700 líneas
  el riesgo de regresión es real si las fases no se cierran con validación explícita en los 3
  anchos de la sección 8.
- **Brecha táctil real en `TimeScrollPicker`.** No es un problema de CSS — sin el fix de la
  sección 3, "reorganizar" no basta para cumplir "sin perder funcionalidad" en dispositivos
  táctiles.
- **Reposicionamiento de paneles flotantes** (`DateFilterPicker`/`MonthFilterPicker`) en rotación
  de pantalla — edge case real bajo el requisito "cualquier dispositivo".
- **Duplicación en 6 dashboards.** Cada fix de la Fase 2 debe aplicarse 6 veces idénticamente;
  alto riesgo de que uno quede desfasado si no se sigue un checklist explícito por dashboard.
- **`whitespace-nowrap` en celdas de tabla es intencional**, no un bug — garantiza que cualquier
  tabla de 4+ columnas necesite scroll horizontal en pantallas chicas. Es el comportamiento
  esperado (sección 4), no algo que "arreglar" después reduciendo el texto.

## 11. Componentes que podrían romperse y cómo prevenirlo

| Riesgo | Prevención |
|---|---|
| `TabsList` con 5+ tabs desborda o corta texto | Scroll horizontal (sección 3), probar en cada dashboard con su set real de tabs |
| Grid de `Calendar` en viewports <340px | Validar manualmente a 320px en Fase 0 antes de dar por buena la primitiva |
| Panel de `MonthFilterPicker` (280×220px fijo) en viewport de 320px | Deja ~40px de margen — ajustado pero cabe; vigilar si se combina con padding adicional de la página |
| Modales anidados dentro de formularios largos + `max-h-[90vh] overflow-y-auto` | Revisar caso por caso que no se genere doble scroll (scroll trap) |
| `Badge` con texto largo dinámico (roles/áreas largas) | `truncate` + tooltip (sección 3) |

## 12. Reglas antes de modificar una sola línea de código

1. Mobile-first: clases sin prefijo son el caso base; los breakpoints agregan comportamiento
   hacia arriba, nunca al revés.
2. Ningún breakpoint nuevo se usa sin registrarse antes en la tabla de la sección 2.
3. Ninguna tabla pierde columnas — o se ve completa con scroll horizontal, o su conversión a
   tarjeta se justifica explícitamente por escrito (hoy, ninguna la amerita — sección 4).
4. Ningún dato funcional se oculta con `display:none`/`hidden` en móvil.
5. Cada fase se cierra con validación visual en 320px / 768px / 1440px antes de marcarse completa.
6. Los cambios a primitivas compartidas (Fase 0) se prueban en **todos** sus call-sites conocidos
   antes de pasar a fases de página.
7. Los 3 formularios clínicos grandes solo se tocan siguiendo el principio de la sección 9
   (captura y representación documental separadas, fuente única de información vía hooks
   compartidos) — nunca agregando clases responsive directamente sobre el componente de hoja
   impresa.
8. La duplicación entre los 6 dashboards se mantiene (decisión de arquitectura ya tomada); cada
   fix se replica manualmente en los 6 con checklist.
9. Ningún cambio debe alterar el resultado impreso/exportado de los formularios clínicos sin
   validarlo explícitamente.
10. Ningún cambio a los hooks compartidos extraídos en la Fase 5 debe alterar el contrato
    `FormClinicoHandle`, el mecanismo de autoguardado de borrador, ni el comportamiento de
    persistencia ya certificado — el refactor cambia dónde vive la lógica, nunca qué hace.

## 13. Recomendaciones de UX (funcionales, no estéticas)

Mejoras detectadas durante la auditoría que restauran o afinan funcionalidad — no son cambios
visuales por estética:

- Agregar soporte táctil a `TimeScrollPicker` (restaura paridad funcional real en touch, no es
  pulido opcional).
- Corregir la progresión de ancho anómala del modal de reagendar en `AppointmentManager.tsx:221`
  (bug funcional, no cosmético).
- Recalcular la posición de los paneles de `DateFilterPicker`/`MonthFilterPicker` en
  resize/rotación (previene que el panel quede mal ubicado tras rotar el dispositivo).
- `truncate` + tooltip en `Badge` (previene que texto largo rompa el layout de columnas angostas).

---

## Historial de decisiones

- **2026-07-12** — Aprobada la arquitectura general (fases, breakpoints, componentes compartidos,
  tratamiento de tablas/dashboards/navegación). Cerrada la sección 9: separación de captura y
  representación documental para los 3 formularios clínicos grandes (antes "Opción A", ahora
  principio arquitectónico oficial). Etapa de análisis del Responsive Design cerrada.
- **2026-07-13** — Enrique probó Fases 0–2 en el navegador y reportó 3 problemas reales que la
  validación automatizada no había atrapado:
  1. El panel de instrucciones de `Login`/`Register`/`ForgotPassword`/`CambiarPasswordInicial`
     (`hidden lg:flex`) desaparecía por completo en móvil — no era decorativo, tenía contenido
     funcional (pasos, requisitos). Corregido con `order-*` (se reordena, no se oculta).
  2. El botón de perfil/cerrar sesión en 5 de 6 dashboards tenía `hidden sm:flex` — invisible en
     cualquier celular, sin forma de cerrar sesión desde móvil. Bug preexistente, no introducido
     por este proceso, pero no detectado en la Fase 2 porque la validación buscaba elementos
     *recortados*, no elementos *ausentes*. Corregido quitando el `hidden`.
  3. Sección 4 revertida — ver esa sección para el detalle: las tablas de datos pasan de
     "scroll horizontal" a un patrón dual tarjeta/tabla, replicando `PatientList.tsx` que ya lo
     tenía resuelto correctamente.
  
  **Lección para todas las fases futuras:** verificar visualmente la *ausencia* de elementos
  interactivos esperados (botones de acción, navegación, perfil), no solo que los presentes no se
  corten — un `grep` de `hidden {breakpoint}:` en cada archivo antes de darlo por cerrado habría
  atrapado el bug del botón de perfil de inmediato.

**Siguiente paso:** completar la corrección de tablas (patrón dual tarjeta/tabla) antes de iniciar
Fase 3. Ninguna fase posterior debe comenzar sin que la anterior esté validada en los 3 anchos de
referencia (320px / 768px / 1440px) **y** sin un barrido explícito de clases `hidden` por
breakpoint para confirmar que nada quedó oculto sin justificación documentada.
