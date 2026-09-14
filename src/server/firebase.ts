import 'server-only';
import {applicationDefault,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
export class AppError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status}}
export function configuration(){
  const mode=process.env.FIREBASE_MODE||'disabled';
  const projectId=process.env.FIREBASE_PROJECT_ID||'viicasa';
  const origin=new URL(process.env.SITE_URL||'http://127.0.0.1:3010').origin;
  if(!['disabled','emulator','live'].includes(mode))throw new AppError(503,'Configuración del servicio no disponible.');
  if(mode==='emulator'&&(!projectId.startsWith('demo-')||![process.env.FIRESTORE_EMULATOR_HOST,process.env.FIREBASE_AUTH_EMULATOR_HOST].every(h=>!!h&&/^(127\.0\.0\.1|localhost):\d+$/.test(h))))throw new AppError(503,'Configuración local incompleta.');
  if(mode==='live'&&(projectId.startsWith('demo-')||process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST))throw new AppError(503,'No se pueden mezclar servicios reales y emulados.');
  if(process.env.NODE_ENV==='production'&&mode!=='disabled'&&(mode!=='live'||!origin.startsWith('https://')))throw new AppError(503,'Producción requiere Firebase real y HTTPS.');
  return{mode,projectId,origin};
}
export function firebase(){
  const{mode,projectId}=configuration();
  if(mode==='disabled')throw new AppError(503,'Estamos preparando el registro. Inténtalo de nuevo más adelante.');
  const name=`comingsoon-${mode}-${projectId}`;
  const app=getApps().find(a=>a.name===name)||initializeApp({projectId,...(mode==='live'?{credential:applicationDefault()}:{})},name);
  return{db:getFirestore(app),auth:getAuth(app)};
}
export function registrationOpen(){return configuration().mode!=='disabled'&&process.env.REGISTRATION_ENABLED==='true'&&process.env.PRIVACY_APPROVED==='true'}
export function requireRegistration(){if(!registrationOpen())throw new AppError(503,'El registro aún no está disponible. Vuelve pronto.');}
export function isAdmin(email:string){return(process.env.ADMIN_EMAILS||'viicasa.database@gmail.com').split(',').map(e=>e.trim().toLowerCase()).includes(email.toLowerCase());}
