// Read-only connectivity check. Never logs keys, tokens, or customer records.
import {configuration, firebase} from '../src/server/firebase.ts';
import {deleteApp, getApps} from 'firebase-admin/app';
import type {Firestore} from 'firebase-admin/firestore';

let stage = 'configuración';
let connection: Firestore | undefined;

try {
  const config = configuration();
  if (config.mode === 'disabled') {
    console.log('Firebase desactivado: la aplicación está en vista previa, sin registros reales.');
    process.exitCode = 1;
  } else {
    const {db, auth} = firebase();
    connection = db;
    stage = 'lectura Firestore';
    await db.collection('cs_health').doc('read-only-check').get();
    console.log('Lectura de Firestore correcta. No se escribió ningún dato.');
    // Empty result is fine; this checks Auth access without exposing user data.
    stage = 'lectura Authentication';
    await auth.listUsers(1);
    console.log(`Lectura de Firestore y acceso a Auth correctos (${config.mode}, ${config.projectId}). No se escribió ningún dato.`);
    console.log('Esto no verifica el inicio de sesión de Google en el navegador, SMTP ni el despliegue.');
  }
} catch (error) {
  const rawCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unavailable';
  const code = /^[a-zA-Z0-9/_-]{1,80}$/.test(rawCode) ? rawCode : 'unavailable';
  console.error(`No se pudo verificar Firebase (${stage}; código ${code}). Revisa modo, proyecto, credenciales del servidor, permisos IAM y disponibilidad de los servicios.`);
  process.exitCode = 1;
} finally {
  await connection?.terminate();
  await Promise.all(getApps().map(app => deleteApp(app)));
}
