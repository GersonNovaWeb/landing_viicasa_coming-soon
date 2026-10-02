# Correos de bienvenida — 1 octubre 2026

## Activación

1. Desplegar este código en la landing (no en el repositorio de la plataforma).
2. Configurar las variables **privadas del servidor** en Hostinger: `MAIL_MODE=smtp`, `MAIL_FROM` (una sola dirección, sin nombre ni comillas), `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_PORT` y `SMTP_SECURE`. Usar los datos de conexión del proveedor elegido. Puerto 465 requiere `SMTP_SECURE=true`; puerto 587 requiere `SMTP_SECURE=false` y STARTTLS. La contraseña es del buzón. Nunca subir credenciales a Git ni introducirlas en el editor de mensajes.
3. Configurar `MAIL_DAILY_LIMIT` según el proveedor. Por defecto: 90 intentos en una ventana móvil de 24 horas, compartidos entre bienvenidas y pruebas. Esto deja margen pero NO conoce los correos manuales ni otros sistemas que usen el mismo buzón. Revisar DNS SPF/DKIM/DMARC y probar recepción, spam y respuestas.
4. Entrar a `/admin` con el administrador autorizado → **Correos automáticos / Automatic emails**.
5. Seleccionar ViiLife, ViiConcierge o Shop. Editar ambas versiones ES/EN: asunto, mensaje, firma y nota final del mensaje. Se permiten `{nombre}` y `{servicio}`. Texto plano; el HTML de encabezado y pie negro suministrado por VIICASA permanece fijo, con el logo remoto de Postimg y sus textos en inglés. Mensaje, firma y nota final se insertan escapados en el área blanca. No se inserta automáticamente la firma del Webmail.
6. **Enviar prueba** envía el borrador del idioma visible exclusivamente a `gerson@novaweb-agency.com`, dirección fija en el servidor. Para la prueba acordada, seleccionar English; el nombre de ejemplo es Gerson. No guarda ni activa el borrador. El resultado indica aceptación SMTP, no recepción garantizada. Comprobar la bandeja antes de activar.
7. Marcar **Activar bienvenida** y guardar cada servicio que se quiera habilitar. Por defecto, todos están desactivados. Guardar no envía correos a contactos anteriores.
8. Probar un registro autorizado nuevo en cada servicio y verificar el dashboard y la recepción. El registro no exige Google ni confirmar el correo y nunca se revierte por fallos SMTP.

## Comportamiento

- Formulario principal: una bienvenida por cada servicio elegido y habilitado (hasta tres). Página de servicio: solo el servicio de esa página. El idioma se toma del formulario.
- Un envío máximo por combinación normalizada correo/servicio, incluso ante reintentos simultáneos, ediciones de plantilla o borrado y recreación del contacto. Las plantillas desactivadas dejan un registro omitido; habilitarlas después no reenvía esa bienvenida.
- La cola se crea en la misma transacción que el contacto. Guarda una copia del texto vigente en ese momento. Ediciones posteriores afectan solo registros nuevos; no cambian mensajes ya pendientes.
- Next `after` intenta enviar tras responder al formulario. SMTP tiene tiempos máximos; las credenciales jamás llegan al navegador. El modo emulador bloquea SMTP real incluso si hay variables locales.
- El historial muestra los últimos 30 mensajes. Los pendientes por configuración, límite o interrupción antes del envío pueden procesarse individualmente desde el panel. **No hay trabajador periódico ni reintento automático de pendientes** en esta versión.
- `Aceptado por SMTP` no garantiza entrega. Un error SMTP puede ser ambiguo: queda `Resultado incierto`, sin botón de reenvío automático para evitar duplicados. Si el servidor se interrumpe durante SMTP, puede quedar `En proceso`; revisar al proveedor antes de intervenir. SMTP no permite garantizar exactamente una entrega.
- Desactivar el servicio, eliminar el contacto o dar de baja las novedades antes de reclamar una bienvenida de lista impide enviar el pendiente. No se puede retirar un mensaje ya aceptado por SMTP.
- Los mensajes son acuses de registro, no campañas publicitarias ni correos de verificación. No utilizar las plantillas para campañas a personas sin consentimiento. No hay avisos al administrador por cada registro en esta entrega.

## Datos y permisos

Colecciones nuevas en el proyecto Firebase existente: `cs_mail_templates`, `cs_mail_outbox`, `cs_mail_limits`; auditoría en `cs_audit`. Solo las rutas del servidor autorizadas para administrador leen o editan plantillas, estados y pruebas. No se necesita abrir las reglas de Firestore. Las consultas usan índices simples predeterminados. Los registros de la cola conservan correo y contenido para seguimiento; deben incluirse en la política de retención/eliminación de datos, sin confundir borrar un interesado con eliminar todo su historial de comunicaciones.

## Verificación local

`npm run dev:emulator` con Auth/Firestore locales; `npm run test:integration`, `I18N_TEST_BASE=http://127.0.0.1:3012 npm run test:i18n`, `npm run lint`, `npm run build`. Las pruebas de SMTP usan un remitente simulado únicamente en emulador. La recepción real requiere las credenciales y prueba del buzón del cliente; no se valida con pruebas simuladas.

El remitente se obtiene de `MAIL_FROM=accounts@viicasa.com`; el enlace `contact@viicasa.com` del pie se conserva según el HTML aprobado y no cambia el remitente. LinkedIn es solo texto, sin URL. La imagen se carga desde Postimg: algunas aplicaciones pueden bloquear imágenes remotas hasta que el destinatario las permita. Los mensajes pendientes ya guardados conservan su HTML original; usar una prueba nueva para validar este diseño. No se migran documentos existentes ni se activan servicios automáticamente.

