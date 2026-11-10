# Avisos internos de la waitlist

El nuevo registro de interés reserva, en la misma transacción de Firestore,
un aviso en inglés a **accounts@viicasa.com** con los datos del interesado,
los servicios nuevos seleccionados, la fecha y el enlace a `/admin`.
El correo usa el encabezado y pie de VIICASA. Un formulario con varios servicios
genera un solo aviso interno; las inscripciones repetidas no lo duplican.
Las bienvenidas al interesado conservan su destinatario y activación por servicio.

El aviso utiliza el SMTP existente. No necesita una variable adicional:
`MAIL_MODE=smtp`, `MAIL_FROM=accounts@viicasa.com`, `SMTP_USER=accounts@viicasa.com`,
`SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_SECURE=true` y
`SMTP_PASSWORD` con la contraseña vigente del buzón, introducida de forma privada.
Firebase y el registro deben estar habilitados. Los avisos y las bienvenidas
comparten el presupuesto `MAIL_DAILY_LIMIT`.

En Administrador → Correos automáticos, la actividad distingue los avisos internos
de las bienvenidas. Un error SMTP no borra el registro. Los resultados ambiguos
quedan en `unknown` y no se reenvían automáticamente; primero se revisa el buzón
y el proveedor para evitar entregas duplicadas. No se envían avisos retroactivos
por el mero despliegue del código.

## Condición de publicación

El usuario pidió publicar en viicasa.com después de comprobar la entrega real.
La prueba de la demo `NW-WAITLIST-20261109-01`, realizada el 9 de noviembre de 2026,
guardó el registro y reservó el aviso, pero SMTP devolvió un resultado `unknown`
con motivo `smtp_error_check_provider`. La credencial configurada fue rechazada
también por el acceso a Webmail. El buzón existe y está activo.

El 10 de noviembre se comprobó que la credencial actualizada estaba aplicada
en **viicasa.com**. Webmail aceptó la contraseña y solicitó el segundo factor;
no se desactivó esta protección ni se modificaron credenciales.

La nueva prueba de la demo `NW-WAITLIST-20261110-01` siguió en `unknown`.
Como ambos alojamientos tienen configuraciones independientes, se comprobó
también el SMTP oficial mediante un registro de prueba de accounts en ViiLife:
`NW-WAITLIST-20261110-OFFICIAL-SMTP`, a las 18:55 UTC (12:55 de Ciudad de México).
El correo «Welcome to ViiCasa — ViiLife» quedó en `sent` y dirigido a
accounts@viicasa.com. Esta es una prueba del registro y del SMTP oficial, no
del aviso interno nuevo, que todavía requiere publicar este cambio.

Hostinger confirmó después la entrega del correo de prueba: registro de salida
del 10 de noviembre a las 12:55:26, remitente y destinatario accounts@viicasa.com,
estado **Entregado**, con resultado del servidor `250 2.0.0 Ok` a las 12:55:27.
La comprobación se hizo en los registros del proveedor; Webmail mantuvo la
verificación en dos pasos. La contraseña, el segundo factor y las plantillas
guardadas de los clientes no se cambiaron durante esta verificación.

Esta evidencia verifica el SMTP y su entrega al destinatario antes de publicar
la nueva notificación. Después del despliegue se debe repetir un registro nuevo
para comprobar el aviso automático con el código publicado. Ninguna credencial
debe entrar en Git.

La comprobación local del 10 de noviembre detectó transacciones cerradas por
contención al reservar el mismo correo simultáneamente. Se permite reiniciar
solo esa reserva pura, con un máximo de tres intentos y exclusivamente ante
el error específico de transacción cerrada. SMTP se ejecuta después de la
reserva confirmada; los envíos `unknown` no se reintentan. Otros errores de
validación siguen propagándose.

## Verificación local

```powershell
npm.cmd run test:waitlist-mail
# Con Firestore/Auth emulados en 127.0.0.1:8086 y :9096:
$env:RUN_WAITLIST_EMULATOR='true'
$env:WAITLIST_HTTP_BASE='http://127.0.0.1:3012'
node --conditions=react-server --experimental-strip-types --test --test-concurrency=1 test/waitlist-mail.mjs test/waitlist-emulator.mjs test/welcome-mail.mjs
```

La prueba local usa remitentes simulados y el proyecto `demo-viicasa-comingsoon`;
no confirma entrega real ni modifica datos de producción.

Verificación del 9 de noviembre de 2026: 59 pruebas locales aprobadas, sin omitir
pruebas; ESLint y TypeScript correctos; compilación de producción correcta.
Repetición del 10 de noviembre: 60 pruebas aprobadas, sin omisiones, incluidas
las de concurrencia y el reinicio de reservas cerradas; no se reintenta SMTP.
ESLint y la compilación de producción también se verifican antes del commit.
