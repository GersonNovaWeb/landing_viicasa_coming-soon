import 'server-only';
import {createHash} from 'node:crypto';
import type {DecodedIdToken} from 'firebase-admin/auth';
import {AppError,configuration,firebase,isAdmin} from './firebase.ts';
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export const cookieName='viicasa_session';
export const timestamp=()=>new Date().toISOString();
export function requireSameOrigin(request:Request){if(request.headers.get('origin')!==configuration().origin)throw new AppError(403,'Origen no permitido.');}
export async function jsonBody(request:Request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AppError(415,'Se requiere JSON.');
  const reader=request.body?.getReader();if(!reader)throw new AppError(400,'Faltan datos.');let bytes=0;const parts:Uint8Array[]=[];
  for(;;){const{done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();throw new AppError(413,'Solicitud demasiado grande.');}parts.push(value);}
  try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw new AppError(400,'Datos inválidos.');}
}
export async function rateLimit(scope:string,limit:number,minutes=1){
  const{db}=firebase(),bucket=Math.floor(Date.now()/(minutes*60000));
  const ref=db.collection('cs_rate_limits').doc(digest(`${scope}:${bucket}`));
  await db.runTransaction(async tx=>{const row=(await tx.get(ref)).data();if((row?.count||0)>=limit)throw new AppError(429,'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.');tx.set(ref,{count:(row?.count||0)+1,expires_at:new Date((bucket+2)*minutes*60000)});});
}
export function validateIdentity(token:DecodedIdToken){if(!token.email||!token.email_verified||token.firebase?.sign_in_provider!=='google.com')throw new AppError(403,'Usa una cuenta de Google con correo verificado.');return{uid:token.uid,email:token.email.toLowerCase(),name:typeof token.name==='string'?token.name.slice(0,120):token.email.split('@')[0],admin:isAdmin(token.email)};}
export async function identity(session:string|undefined,admin=false){
  if(!session)throw new AppError(401,'Inicia sesión para continuar.');
  const {auth}=firebase();let token:DecodedIdToken;
  try{token=await auth.verifySessionCookie(session,true);}catch{throw new AppError(401,'Tu sesión terminó. Inicia sesión de nuevo.');}
  const user=validateIdentity(token);if(admin&&!user.admin)throw new AppError(403,'Esta cuenta no tiene acceso al panel.');return user;
}
