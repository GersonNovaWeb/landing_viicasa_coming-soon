import 'server-only';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import type {Transaction} from 'firebase-admin/firestore';
import {firebase,AppError,configuration} from './firebase.ts';
import {digest,timestamp} from './security.ts';
import {confirmationMail} from '../lib/mail-copy.ts';
export const interestSchema=z.enum(['viilife','viiconcierge','shop']);
export const registrationSchema=z.object({name:z.string().trim().min(2).max(120),email:z.email().max(254).transform(e=>e.toLowerCase()),locale:z.enum(['es','en']).default('es'),interests:z.array(interestSchema).min(1).max(3).transform(a=>[...new Set(a)]),phone:z.string().trim().max(30).default(''),message:z.string().trim().max(2000).default(''),kind:z.enum(['waitlist','inquiry']),privacy:z.literal(true),marketing:z.boolean(),source:z.enum(['home','viilife','viiconcierge','shop']),website:z.string().max(0).default('')}).strict().refine(v=>v.kind!=='waitlist'||v.marketing,{message:'Autoriza las novedades para unirte a la lista.'});
export type Registration=z.infer<typeof registrationSchema>;
export const statusSchema=z.object({status:z.enum(['new','contacted','closed']),notes:z.string().trim().max(3000)}).strict();
export const consentVersion='comingsoon-2026-09-v1';
export type Person={uid:string,email:string,name:string,admin:boolean};
export async function saveProfile(user:Person){const {db}=firebase(),ref=db.collection('cs_accounts').doc(user.uid);await db.runTransaction(async tx=>{const existing=(await tx.get(ref)).data();tx.set(ref,{uid:user.uid,email:user.email,name:user.name,created_at:existing?.created_at||timestamp(),last_login_at:timestamp(),provider:'google.com'});});}
// Separate identity, marketing consent and service requests. Anonymous submissions never modify a verified record.
export async function saveVerified(data:Registration,uid:string|null){
  const{db}=firebase();return db.runTransaction(tx=>persistVerified(tx,data,uid));
}
// Public interest capture is not authentication. Never overwrite an existing
// contact, consent, follow-up or verified identity using an unverified email.
export async function saveUnverified(data:Registration){
  const{db}=firebase(),key=digest(data.email),ref=db.collection('cs_contacts').doc(key);
  await db.runTransaction(async tx=>{
    const previous=await tx.get(ref);
    const inquiry=data.kind==='inquiry'?db.collection('cs_inquiries').doc(digest(`${key}:${data.source}:${data.message}`)):null;
    const old=inquiry?await tx.get(inquiry):null;
    const created=timestamp();
    if(!previous.exists)tx.create(ref,{email:data.email,name:data.name,locale:data.locale,phone:data.phone,uid:null,interests:data.interests,verified:false,
      marketing:data.marketing,marketing_consent_at:data.marketing?created:null,privacy_version:consentVersion,created_at:created,updated_at:created,status:'new',notes:'',source:data.source});
    if(inquiry&&!old?.exists)tx.create(inquiry,{contact_id:key,email:data.email,name:data.name,phone:data.phone,service:data.source,interests:data.interests,message:data.message,
      verified:false,created_at:created,updated_at:created,status:'new',notes:'',privacy_version:consentVersion});
  });
}
async function persistVerified(tx:Transaction,data:Registration,uid:string|null){
    const{db}=firebase(),key=digest(data.email),ref=db.collection('cs_contacts').doc(key),created=timestamp();
    const previous=(await tx.get(ref)).data();
    const trusted=previous?.verified===true?previous:undefined;
    const inquiry=data.kind==='inquiry'?db.collection('cs_inquiries').doc(digest(`${key}:${data.source}:${data.message}`)):null;
    const old=inquiry?(await tx.get(inquiry)).data():null;
    const interests=[...new Set([...(trusted?.interests||[]),...data.interests])];
    tx.set(ref,{email:data.email,name:data.name,locale:data.locale,phone:data.phone||trusted?.phone||'',uid:uid||trusted?.uid||null,interests,verified:true,marketing:trusted?.marketing===true||data.marketing,
      marketing_consent_at:data.marketing?created:trusted?.marketing_consent_at||null,privacy_version:consentVersion,created_at:previous?.created_at||created,updated_at:created,status:previous?.status||'new',notes:previous?.notes||'',source:trusted?.source||data.source});
    if(inquiry){
      tx.set(inquiry,{contact_id:key,email:data.email,name:data.name,phone:data.phone,service:data.source,interests:data.interests,message:data.message,verified:true,created_at:old?.created_at||created,updated_at:created,status:old?.status||'new',notes:old?.notes||'',privacy_version:consentVersion});
    }
    return key;
}
export function mailEnabled(){return process.env.MAIL_MODE==='smtp'&&!!process.env.SMTP_HOST&&!!process.env.MAIL_FROM;}
export async function requestEmailConfirmation(data:Registration){
  if(!mailEnabled())throw new AppError(503,'El registro por correo aún no está disponible. Puedes usar Google cuando el acceso esté habilitado.');
  const{db}=firebase(),id=digest(data.email),secret=randomBytes(32).toString('base64url');
  const ref=db.collection('cs_pending').doc(id),now=timestamp();
  await db.runTransaction(async tx=>{const old=(await tx.get(ref)).data();if(old?.requested_at&&Date.now()-Date.parse(old.requested_at)<60000)throw new AppError(429,'Espera un minuto antes de solicitar otro correo.');tx.set(ref,{...data,requested_at:now,token_hash:digest(secret),expires_at:new Date(Date.now()+86400000).toISOString(),cleanup_at:new Date(Date.now()+172800000)});});
  // Fragment keeps the one-time secret out of access logs and referrer headers; GET never consumes it.
  const url=`${configuration().origin}/confirmar#${id}.${secret}`;
  const nodemailer=await import('nodemailer');
  const mailer=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined,connectionTimeout:10000,socketTimeout:20000});
  try{await mailer.sendMail({from:process.env.MAIL_FROM,to:data.email,...confirmationMail(data.locale,url)});}
  catch{throw new AppError(503,'No pudimos enviar la confirmación. Inténtalo más tarde.');}
  finally{mailer.close();}
}
export async function confirmEmail(value:string){
  if(!/^[a-f0-9]{64}\.[A-Za-z0-9_-]{43}$/.test(value))throw new AppError(400,'Enlace inválido.');
  const[id,secret]=value.split('.'),{db}=firebase(),ref=db.collection('cs_pending').doc(id);
  await db.runTransaction(async tx=>{
    const row=(await tx.get(ref)).data();if(!row||row.token_hash!==digest(secret)||row.expires_at<timestamp())throw new AppError(400,'El enlace venció. Solicita uno nuevo.');if(row.confirmed_at)return;
    const fields=['name','email','locale','interests','phone','message','kind','privacy','marketing','source','website'];
    const data=registrationSchema.parse(Object.fromEntries(fields.map(k=>[k,row[k]])));
    await persistVerified(tx,data,null);tx.update(ref,{confirmed_at:timestamp()});
  });
}
