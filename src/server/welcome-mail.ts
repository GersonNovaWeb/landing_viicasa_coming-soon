import 'server-only';
import {z} from 'zod';
import type {Transaction} from 'firebase-admin/firestore';
import {firebase,configuration,AppError} from './firebase.ts';
import {digest,timestamp} from './security.ts';
import {mailServices,defaultWelcome,welcomeTemplateSchema,welcomeTestRecipientSchema,renderWelcome,type MailService,type WelcomeTemplate} from '../lib/welcome-mail.ts';
import type {Registration} from './leads.ts';

// Initial suggestion only; authenticated administrators choose each test recipient.
export const welcomeTestRecipient='gerson@novaweb-agency.com';

export function smtpStatus(){
  const port=Number(process.env.SMTP_PORT||587);
  const configured=process.env.MAIL_MODE==='smtp'&&!!process.env.SMTP_HOST&&!!process.env.SMTP_USER&&!!process.env.SMTP_PASSWORD&&z.email().safeParse(process.env.MAIL_FROM).success&&[465,587].includes(port)&&((port===465)===(process.env.SMTP_SECURE==='true'));
  return {ready:!!configured&&configuration().mode==='live',dailyLimit:Math.min(1000,Math.max(1,Number(process.env.MAIL_DAILY_LIMIT)||90))};
}
export async function getWelcomeSettings(){
  const{db}=firebase();
  const docs=await db.getAll(...mailServices.map(s=>db.collection('cs_mail_templates').doc(s)));
  return {templates:Object.fromEntries(docs.map((doc,i)=>[mailServices[i],{template:welcomeTemplateSchema.safeParse(doc.data()?.template).data??defaultWelcome(mailServices[i]),revision:doc.data()?.revision||0}])),smtp:smtpStatus(),testRecipient:welcomeTestRecipient};
}
export async function saveWelcomeTemplate(service:MailService,template:WelcomeTemplate,revision:number,actor:string){
  const{db}=firebase(),ref=db.collection('cs_mail_templates').doc(service);
  return db.runTransaction(async tx=>{
    const old=(await tx.get(ref)).data();
    if((old?.revision||0)!==revision)throw new AppError(409,'La plantilla cambió. Recarga antes de guardar.');
    tx.set(ref,{template,revision:revision+1,updated_at:timestamp(),updated_by:actor});
    tx.create(db.collection('cs_audit').doc(),{actor_uid:actor,action:'mail.template.update',record_id:service,created_at:timestamp()});
    return revision+1;
  });
}
// Read before any transaction writes. Capture the template at registration time,
// and reserve one welcome per email/service, even when disabled (no backfill).
export async function planWelcome(tx:Transaction,data:Registration,eligible:boolean){
  if(!eligible)return ()=>[] as string[];
  const{db}=firebase();
  const services=data.source==='home'?data.interests:[data.source];
  const plans=await Promise.all(services.map(async service=>{
    const id=digest(`welcome:${data.email}:${service}`),ref=db.collection('cs_mail_outbox').doc(id);
    const [existing,setting]=await tx.getAll(ref,db.collection('cs_mail_templates').doc(service));
    const template=welcomeTemplateSchema.safeParse(setting.data()?.template).data??defaultWelcome(service);
    return {service,id,ref,exists:existing.exists,template};
  }));
  return ()=>{
    const ids:string[]=[];
    for(const plan of plans){
      if(plan.exists)continue;
      const state=plan.template.enabled?'pending':'skipped';
      tx.create(plan.ref,{service:plan.service,contact_id:digest(data.email),email:data.email,locale:data.locale,kind:data.kind,
        ...(state==='pending'?{mail:renderWelcome(plan.template[data.locale],plan.service,data.locale,data.name)}:{}),
        state,reason:state==='skipped'?'template_disabled':'',created_at:timestamp(),updated_at:timestamp()});
      if(state==='pending')ids.push(plan.id);
    }
    return ids;
  };
}
type Delivery={subject:string;text:string;html:string};
type Sender=(to:string,mail:Delivery,id:string)=>Promise<void>;
export async function smtpSend(to:string,mail:Delivery,id:string){
  if(!smtpStatus().ready)throw new AppError(503,'SMTP no está configurado. El registro sigue funcionando.');
  const {createTransport}=await import('nodemailer');
  const transport=createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',requireTLS:true,
    auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000,
    disableFileAccess:true,disableUrlAccess:true});
  try{
    const result=await transport.sendMail({from:{name:'VIICASA',address:process.env.MAIL_FROM!},to,...mail,messageId:`<${id}@${process.env.MAIL_FROM!.split('@')[1]}>`});
    if(!result.accepted?.length)throw new Error('SMTP_REJECTED');
  }finally{transport.close();}
}
async function reserveQuota(tx:Transaction){
  const{db}=firebase(),ref=db.collection('cs_mail_limits').doc('rolling24h');
  const now=Date.now(),old=(await tx.get(ref)).data();
  const sends: number[]=(old?.sends||[]).filter((n:number)=>n>now-86400000);
  if(sends.length>=smtpStatus().dailyLimit)return null;
  return ()=>tx.set(ref,{sends:[...sends,now],updated_at:timestamp()});
}
// Claim once before SMTP. If SMTP's result is ambiguous, never auto-resend.
// A server crash after acceptance can leave 'sending'; the admin must investigate.
export async function dispatchWelcome(id:string,sender?:Sender){
  if(sender&&configuration().mode!=='emulator')throw new Error('Test sender requires emulator');
  if(!sender&&!smtpStatus().ready)return 'unconfigured';
  const{db}=firebase(),ref=db.collection('cs_mail_outbox').doc(id);
  const row=await db.runTransaction(async tx=>{
    const snapshot=await tx.get(ref),data=snapshot.data();
    if(!data||data.state!=='pending')return null;
    const contact=(await tx.get(db.collection('cs_contacts').doc(data.contact_id))).data();
    const setting=(await tx.get(db.collection('cs_mail_templates').doc(data.service))).data();
    const reserve=await reserveQuota(tx);
    if(!contact||setting?.template?.enabled!==true||(data.kind==='waitlist'&&contact.marketing!==true)){
      tx.update(ref,{state:'skipped',reason:'disabled_or_removed',updated_at:timestamp()});return null;
    }
    if(!reserve)return null;
    reserve();tx.update(ref,{state:'sending',updated_at:timestamp()});return data;
  });
  if(!row)return 'not_claimed';
  try{await (sender||smtpSend)(row.email,row.mail,id);}
  catch{await ref.update({state:'unknown',reason:'smtp_error_check_provider',updated_at:timestamp()});return 'unknown';}
  // Do not catch a database failure as an SMTP error. 'sending' remains ambiguous.
  await ref.update({state:'sent',updated_at:timestamp()});return 'sent';
}
export async function sendWelcomeTest(recipient:string,copy:Delivery){
  const email=welcomeTestRecipientSchema.parse(recipient);
  if(!smtpStatus().ready)throw new AppError(503,'SMTP no está configurado. El registro sigue funcionando.');
  const{db}=firebase();
  await db.runTransaction(async tx=>{const reserve=await reserveQuota(tx);if(!reserve)throw new AppError(429,'Se alcanzó el límite de envíos. Inténtalo más tarde.');reserve();});
  try{await smtpSend(email,{...copy,subject:`[TEST] ${copy.subject}`},db.collection('cs_mail_outbox').doc().id);}
  catch{throw new AppError(503,'No se pudo confirmar el envío. Revisa SMTP antes de repetir la prueba.');}
}
