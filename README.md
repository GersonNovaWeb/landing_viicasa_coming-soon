# VIICASA · Coming Soon

Implementación de **Immersive Luxury** con Next.js, Firebase Authentication y Firestore. Proyecto independiente del backend de la plataforma completa. Destino previsto: aplicación Node.js en Hostinger para `viicasa.com`.

## Actualización — registro directo (25 septiembre 2026)

El registro público ya no exige Google ni SMTP. Al enviar el formulario, nombre, correo e intereses se guardan inmediatamente en `cs_contacts`, con `verified: false` si no hay sesión válida de Google. No se envía correo ni se crea una cuenta de acceso. El administrador ve el estado de verificación. Los enlaces de confirmación antiguos siguen siendo compatibles.

Mantener Firebase real, `SITE_URL` correcto, `REGISTRATION_ENABLED=true` y privacidad aprobada. `MAIL_MODE=disabled` es suficiente; las variables SMTP no se utilizan para registrar interesados. No subir contraseñas al repositorio. Este cambio requiere desplegar el nuevo código; no modifica Hostinger ni datos reales automáticamente.

## Estado histórico — 13 septiembre 2026

Implementado y probado localmente: landing, páginas ViiLife/ViiConcierge/Shop, registro con Google, intereses, solicitudes, confirmación por correo y dashboard protegido con seguimiento. El envío SMTP y Google real requieren configuración y pruebas externas; no se han validado en producción. Shop es una página de presentación, no una tienda con pagos.

**No está desplegado.** Se configuró localmente la credencial privada aportada por el cliente, fuera del repositorio. Firestore y Authentication reales pasaron las comprobaciones de lectura, sin crear usuarios ni escribir datos, y Google está habilitado. Se confirmó también la autorización de `127.0.0.1`, además de `localhost`, `viicasa.firebaseapp.com` y `viicasa.web.app`. El inicio de sesión real en el navegador aún requiere la prueba del cliente. El registro público permanece cerrado y SMTP desactivado. Sin configuración local, el modo predeterminado sigue desactivando Firebase. El dominio existente tiene WordPress/WooCommerce: no reemplazarlo antes de acordar la migración y comprobar un respaldo restaurable.

Administrador autorizado en el servidor: `viicasa.database@gmail.com`. Los usuarios no pueden asignarse permisos. No hay contraseña administrativa predeterminada.

## Desarrollo

Usar Node.js 22 o posterior y npm. Instalar desde el lockfile:

```sh
npm ci
npm run dev
```

Vista previa: `http://127.0.0.1:3010`. Sin `.env.local` queda en modo visual seguro. Configuración en `.env.example`; copiarla a `.env.local` y mantener ese archivo fuera de Git. Las variables `NEXT_PUBLIC_*` se incorporan al navegador durante el build, por lo que requieren reconstrucción al cambiarlas.

Rutas: `/`, `/viilife`, `/viiconcierge`, `/shop`, `/cuenta`, `/admin`, `/privacidad`, `/confirmar`. `/comingsoon` y `/commingsoon` redirigen al inicio. Los prototipos de propiedades/reservas se conservan en `src/legacy/`, fuera del enrutador. No son módulos operativos de esta entrega.

## Idiomas

Selector Español / English en la cabecera, acceso administrativo y dashboard; también disponible en móvil. Inglés es el idioma predeterminado para nuevas visitas; se conserva la elección previa de español o inglés. La cookie de preferencia `viicasa_language` dura un año, es exclusiva del sitio y no contiene identidad ni permisos. El servidor lee esa preferencia para renderizar contenido y metadatos coherentes; cambiar de idioma refresca el contenido sin navegar a otra ruta ni reiniciar los campos del formulario.

Las traducciones están centralizadas en `src/lib/i18n.ts`; `src/components/language.tsx` y `src/server/locale.ts` comparten el idioma. Los nombres, correos y notas del cliente no se traducen. Las fechas del dashboard usan la configuración regional seleccionada. Los registros guardan `locale` (`es` por defecto para compatibilidad) y las futuras confirmaciones SMTP usan ese idioma; SMTP continúa deshabilitado hasta su configuración.

`npm run test:i18n` comprueba traducciones, textos de correo y ocho rutas en ambos idiomas mediante lecturas de la vista previa en el puerto 3010. `npm run test:integration` comprueba también registros en inglés y el dashboard con emuladores exclusivamente.

## Configuración de producción pendiente

1. Verificar que `viicasa` tiene Firestore, base `(default)`, y Authentication con proveedor Google habilitado.
2. Configurar los dominios autorizados de Authentication para el dominio final y las pruebas aprobadas.
3. Proporcionar una credencial **de servidor** mediante la variable privada `FIREBASE_SERVICE_ACCOUNT_JSON` en Hostinger, o `GOOGLE_APPLICATION_CREDENTIALS` con ruta absoluta a un JSON privado fuera de `public`, del repositorio y del artefacto publicado. La variable JSON tiene prioridad; se valida tipo y proyecto, y un error no expone su contenido. No pegar el JSON en el chat ni incluirlo en variables `NEXT_PUBLIC_*`. La configuración web proporcionada es pública y no reemplaza esta credencial.
4. Conceder al servidor solo los permisos necesarios para Firestore y las sesiones de Authentication; validar IAM antes de usar datos reales.
5. Revisar las reglas actuales antes de aplicar `firestore.rules` o los índices. El archivo incluido deniega acceso directo desde el navegador a toda la base. **No desplegarlo sobre otras aplicaciones sin fusionar sus políticas.** Firebase Admin accede mediante IAM.
6. Ajustar `FIREBASE_MODE=live`, `NEXT_PUBLIC_FIREBASE_MODE=live`, proyecto real y `SITE_URL` con origen HTTPS exacto; eliminar variables de emuladores. `npm run check:firebase` realiza solo lecturas y no imprime usuarios.
7. Completar y aprobar el aviso de privacidad: responsable, contacto, finalidades, conservación y procedimiento para ejercer derechos. La página actual es un borrador. Establecer `PRIVACY_CONTACT_EMAIL`; habilitar `PRIVACY_APPROVED=true` y `REGISTRATION_ENABLED=true` solo después de aprobar el texto.
8. El registro directo sin Google no requiere SMTP. Probar una entrada ficticia autorizada y verificar nombre, correo y etiqueta de correo no verificado en Clientes interesados.

No introducir usuarios de prueba en producción sin autorización. El diagnóstico de conexión no prueba el popup Google, correo, permisos de escritura ni Hostinger.

## Datos y protección

Con Google, el formulario completa y bloquea únicamente el correo verificado. El visitante debe escribir su nombre completo (se conserva si ya lo escribió antes del acceso); no se usa automáticamente el nombre de Google. El nombre indicado se guarda con el interesado y sus solicitudes, sin cambiar la identidad de acceso.

El formulario de interesados prioriza nombre y correo, con Google como alternativa opcional desplegable. El registro directo aparece inmediatamente en Clientes interesados, sin SMTP ni contraseña. Los envíos anónimos no sobrescriben contactos existentes, preferencias o seguimiento; las consultas nuevas se guardan por separado como no verificadas. La API responde igual para altas y duplicados, sin revelar cuentas. Un registro posterior con Google puede verificar el contacto, pero no hereda intereses ni consentimiento de una entrada no verificada. Mi cuenta ofrece un acceso al formulario sin Google; el administrador sigue protegido con Google.

En Clientes interesados, el administrador puede borrar un contacto tras confirmar su nombre/correo. La eliminación es definitiva: borra `cs_contacts` y su confirmación pendiente en `cs_pending` en una transacción, y registra la operación en `cs_audit`. No elimina la cuenta de acceso ni las solicitudes de servicios. La API exige sesión administrativa, origen válido y confirmación explícita; no hay borrado masivo. Un nuevo registro voluntario puede volver a agregar el contacto.

| Colección | Uso |
| --- | --- |
| `cs_accounts` | Accesos con Google, no implica suscripción |
| `cs_contacts` | Contactos, estado de verificación, intereses y consentimiento |
| `cs_inquiries` | Solicitudes, estado y notas privadas |
| `cs_pending` | Confirmaciones pendientes, hash del token y caducidad |
| `cs_rate_limits` | Contadores con expiración |
| `cs_audit` | Cambios de seguimiento del administrador |

Sesiones en cookie HttpOnly, SameSite=Lax y Secure bajo HTTPS. El servidor verifica proveedor Google, correo verificado, revocación y origen de escrituras. Las respuestas privadas no se cachean. Consentimientos no preseleccionados; Google no suscribe automáticamente. Los registros anónimos se guardan como no verificados y nunca obtienen permisos de cuenta. Se mantienen validación, honeypot y límites de solicitudes. El dashboard no usa datos ficticios.

Confirmaciones: vencen en 24 horas, consumo transaccional por POST, no por abrir el enlace. `cleanup_at` solicita TTL de pendientes a las 48 horas; `expires_at` aplica TTL a contadores. Hay que activar/verificar esas políticas: no garantizan borrado inmediato; documentos antiguos sin el campo requieren revisión. Falta acordar retención de contactos, solicitudes y auditoría.

La baja desde `/cuenta` cambia el consentimiento. No hay campañas, envíos masivos, borrado automático de cuentas ni módulos de propiedades/pagos. Antes de introducir campañas, agregar baja por enlace para contactos registrados solo por correo.

## Pruebas sin producción

Emuladores oficiales con proyecto `demo-*`, nunca credenciales reales. Requiere Firebase CLI y Java compatible con Firestore. En terminales independientes desde esta carpeta:

```sh
firebase emulators:start --only auth,firestore --project demo-viicasa-comingsoon
npm run dev:emulator
npm run test:integration
```

Firebase usa puertos 8086/9096. Next de prueba usa `127.0.0.1:3012`, salida `.next-test`, registro abierto **solo para datos ficticios**, SMTP desactivado y sin credencial de producción. Google es simulado por el emulador, no una cuenta externa. Sin exportación, se pierden datos al reiniciar emuladores.

Cobertura: rutas, identidad, permisos, falsificación, consentimiento, CSRF, tamaño de solicitudes, registro directo sin SMTP, protección de contactos ante envíos anónimos, deduplicación concurrente, notas, baja, acceso directo bloqueado, confirmación antigua atómica, paginación y revocación.

```sh
npm run lint
npm run build
```

La compilación incluye TypeScript. El lint cubre el código activo y las pruebas; el generador antiguo `generateData.js` y el almacén simulado `src/lib/store.ts` conservan errores heredados fuera de ese alcance. La auditoría tras actualizar Next dejó dos avisos moderados transitivos de `uuid`/`gaxios`; revisar nuevamente antes de publicar. No se aplicaron actualizaciones mayores forzadas.

## Publicación prevista en Hostinger

Guía de importación, variables privadas y comprobaciones: [HOSTINGER.md](HOSTINGER.md).
Pruebas de credenciales sin conexión ni claves reales:
`node --conditions=react-server --experimental-strip-types --test test/credentials.mjs`.

Esta versión **requiere servidor Node.js**; no funciona como exportación estática en GitHub Pages. Se retiró el comando antiguo de publicación de `out`. No se modificaron DNS, WordPress ni el repositorio remoto.

Al desplegar, probar con Firebase real: registro directo sin Google ni SMTP, Google opcional, administrador y no administrador, escritura/lectura, solicitudes, baja y cierre de sesión. Comprobar que los registros directos aparecen con nombre, correo y estado no verificado en el dashboard. Confirmar navegación móvil y textos con el cliente.

En Linux de Hostinger, construir con variables públicas definitivas: `npm ci`, `npm run build`. Usar el flujo Node.js/Next.js del panel o `npm start`, según permita la cuenta. No subir `node_modules` de Windows.

También se genera `.next/standalone`. Si se utiliza ese artefacto, incluir `public` en `standalone/public` y `.next/static` en `standalone/.next/static`; iniciar `server.js` con `PORT`/`HOSTNAME` configurados por el alojamiento. No publicar `.env.local`, credenciales, pruebas ni emuladores.

Antes del cambio final: aprobación del cliente, respaldo de archivos/base WordPress y restauración, rutas/SEO existentes, HTTPS, DNS y registros de correo. Mantener registros cerrados hasta aprobar pruebas reales y aviso.
