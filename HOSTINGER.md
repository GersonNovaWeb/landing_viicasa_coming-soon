# Publicar desde GitHub en Hostinger

Esta guía prepara el despliegue; no significa que el sitio ya esté publicado.
Requiere un plan con capacidad disponible para aplicaciones Node.js.

## Importación

En hPanel: Sitios web → Añadir sitio web → Deploy Web App → Importar repositorio Git.
Conectar la cuenta de GitHub y seleccionar:

| Campo | Valor |
| --- | --- |
| Repositorio | `GersonNovaWeb/landing_viicasa_coming-soon` |
| Rama | `main` (no `gh-pages`) |
| Framework | Next.js |
| Directorio raíz | Raíz del repositorio (`.` si solicita un valor) |
| Node.js | 24.x |
| Instalación, si se solicita | `npm ci` |
| Compilación | `npm run build` |
| Directorio de salida, si se solicita | `.next` |

Usar el despliegue administrado de Next.js y sus ajustes de arranque detectados.
No seleccionar exportación estática ni `out`. Si el panel pide un archivo de
entrada personalizado, revisar su configuración antes de desplegar: la salida
standalone usa `.next/standalone/server.js` y necesita copiar también `public`
y `.next/static` dentro del artefacto, como indica README.

## Primera vista previa, sin datos reales

Elegir un dominio temporal de pruebas, sin cambiar los DNS de `viicasa.com`.
En las variables de entorno del panel establecer:

```dotenv
FIREBASE_MODE=disabled
NEXT_PUBLIC_FIREBASE_MODE=disabled
SITE_URL=https://DOMINIO-TEMPORAL-ASIGNADO
REGISTRATION_ENABLED=false
PRIVACY_APPROVED=false
MAIL_MODE=disabled
```

Sustituir el dominio de ejemplo por el origen HTTPS exacto asignado. Esta fase
permite revisar diseño e idiomas; el acceso y los registros reales están desactivados.

## Conectar Firebase

Configurar en el panel, no en GitHub ni en el chat:

- `FIREBASE_MODE=live` y `NEXT_PUBLIC_FIREBASE_MODE=live`.
- `FIREBASE_PROJECT_ID=viicasa` y `ADMIN_EMAILS=viicasa.database@gmail.com`.
- Las cuatro variables públicas `NEXT_PUBLIC_FIREBASE_API_KEY`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` y
  `NEXT_PUBLIC_FIREBASE_APP_ID` de `.env.example`.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: contenido completo del JSON privado de la
  cuenta de servicio. Pegar JSON válido como valor, sin comillas envolventes
  adicionales. Conservar los `\n` de la clave tal como aparecen en el archivo.
  No usar prefijo `NEXT_PUBLIC_`; no compartir capturas del valor.

Dejar `GOOGLE_APPLICATION_CREDENTIALS` sin definir en Hostinger: la ruta del
escritorio de Windows no existe allí. La variable JSON tiene prioridad si ambas
están configuradas; un JSON inválido o de otro proyecto se rechaza sin mostrarlo.
La configuración local por archivo continúa funcionando.

En Firebase Authentication → Configuración → Dominios autorizados, añadir solo
el hostname temporal usado para las pruebas (sin `https://` ni rutas).
Reconstruir y desplegar después de cambiar variables públicas: Next.js las
incorpora durante la compilación. Mantener el registro público desactivado
hasta aprobar privacidad. Después habilitar `REGISTRATION_ENABLED=true` y
`PRIVACY_APPROVED=true`. El registro directo no requiere SMTP: se puede dejar
`MAIL_MODE=disabled`; los interesados se guardan de inmediato como no verificados.

## Verificación y dominio final

1. Comprobar despliegue exitoso y commit correcto en el panel.
2. Revisar inicio, servicios, imágenes y selector de idioma.
3. Probar acceso Google y dashboard con el administrador autorizado; comprobar
   que otra cuenta no accede al dashboard. Estas pruebas requieren autorización
   para crear cuentas/datos reales; no están incluidas en los tests locales.
4. No conectar `viicasa.com` hasta tener aprobación y respaldo restaurable del
   sitio WordPress actual. Conservar los registros DNS del correo.
5. Al conectar el dominio final, actualizar `SITE_URL`, autorizar el hostname en
   Firebase y repetir pruebas. El dominio puede permanecer en Namecheap.

La integración GitHub permite despliegues tras cada push a la rama conectada.
Un push exitoso no confirma un despliegue exitoso: revisar siempre los logs.
Nunca subir `.env.local`, claves JSON ni `node_modules` de Windows.

Referencia: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
