import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {firebase,configuration,AppError,registrationOpen,requireRegistration} from '@/server/firebase';
import {cookieName,identity,validateIdentity,jsonBody,requireSameOrigin,rateLimit,digest,timestamp} from '@/server/security';
import {saveProfile,saveVerified,requestEmailConfirmation,confirmEmail,registrationSchema,statusSchema,mailEnabled} from '@/server/leads';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
async function handle(request:Request,context:Context){try{
  const {path}=await context.params,key=path.join('/'),method=request.method;
  if(key==='config'&&method==='GET')return response({auth:configuration().mode!=='disabled',google:registrationOpen(),email:registrationOpen()&&mailEnabled(),mode:configuration().mode});
  const jar=await cookies();
  if(key==='session'&&method==='GET'){
    if(!jar.get(cookieName))return response({user:null});
    return response({user:await identity(jar.get(cookieName)?.value)});
  }
  if(method!=='GET')requireSameOrigin(request);
  if(key==='session'&&method==='DELETE'){jar.set(cookieName,'',{httpOnly:true,secure:configuration().origin.startsWith('https://'),sameSite:'lax',path:'/',maxAge:0});return response({ok:true});}
  if(key==='session'&&method==='POST'){
    const body=z.object({idToken:z.string().max(10000),privacy:z.literal(true)}).strict().parse(await jsonBody(request));
    const{auth}=firebase();let decoded;
    try{decoded=await auth.verifyIdToken(body.idToken,true);}catch{throw new AppError(401,'No se pudo verificar la cuenta de Google.');}
    const user=validateIdentity(decoded);if(!user.admin)requireRegistration();
    if(Date.now()/1000-decoded.auth_time>300)throw new AppError(401,'Vuelve a iniciar sesión con Google.');
    await rateLimit(`login:${user.uid}`,10);await saveProfile(user);
    const expiresIn=8*60*60*1000,session=await auth.createSessionCookie(body.idToken,{expiresIn});
    jar.set(cookieName,session,{httpOnly:true,secure:configuration().origin.startsWith('https://'),sameSite:'lax',path:'/',maxAge:expiresIn/1000});return response({user});
  }
  if(key==='register'&&method==='POST'){
    requireRegistration();const data=registrationSchema.parse(await jsonBody(request));
    await rateLimit('registration-global',120);await rateLimit(`email:${digest(data.email)}`,4,10);
    const session=jar.get(cookieName)?.value;
    if(session){const user=await identity(session);if(user.email!==data.email)throw new AppError(400,'Usa el correo de tu cuenta de Google.');await saveVerified(data,user.uid);return response({state:'saved',message:data.kind==='inquiry'?'Recibimos tu solicitud.':'Ya formas parte de nuestra lista.'});}
    await requestEmailConfirmation(data);return response({state:'confirmation_required',message:'Revisa tu correo y confirma el enlace para completar tu registro.'},202);
  }
  if(key==='confirm'&&method==='POST'){requireRegistration();const body=z.object({token:z.string().max(150)}).strict().parse(await jsonBody(request));await rateLimit('confirm-global',120);await confirmEmail(body.token);return response({ok:true});}
  if(key==='preferences'&&method==='DELETE'){
    const user=await identity(jar.get(cookieName)?.value),{db}=firebase(),ref=db.collection('cs_contacts').doc(digest(user.email));
    await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)tx.update(ref,{marketing:false,unsubscribed_at:timestamp()});});return response({ok:true});
  }
  if(path[0]==='admin'){
    const user=await identity(jar.get(cookieName)?.value,true),{db}=firebase();
    if(key==='admin/summary'&&method==='GET'){
      const counts=await Promise.all(['cs_accounts','cs_contacts','cs_inquiries'].map(c=>db.collection(c).count().get()));
      const marketing=await db.collection('cs_contacts').where('marketing','==',true).count().get();
      const interests=await Promise.all(['viilife','viiconcierge','shop'].map(async service=>({service,count:(await db.collection('cs_contacts').where('interests','array-contains',service).count().get()).data().count})));
      return response({accounts:counts[0].data().count,contacts:counts[1].data().count,inquiries:counts[2].data().count,marketing:marketing.data().count,interests});
    }
    const collection=({accounts:'cs_accounts',contacts:'cs_contacts',inquiries:'cs_inquiries'} as Record<string,string>)[path[1]];
    if(!collection)throw new AppError(404,'No encontrado.');
    if(method==='GET'&&path.length===2){
      const params=new URL(request.url).searchParams,cursor=params.get('cursor');let query=db.collection(collection).orderBy('created_at','desc').orderBy('__name__','desc').limit(51);
      if(cursor){let c;try{c=z.tuple([z.iso.datetime(),z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)]).parse(JSON.parse(Buffer.from(cursor,'base64url').toString()));}catch{throw new AppError(400,'Paginación inválida.');}query=query.startAfter(...c);}
      const docs=(await query.get()).docs,rows=docs.slice(0,50).map(d=>({id:d.id,...d.data()}));const last=docs[49];
      return response({rows,next:docs.length>50?Buffer.from(JSON.stringify([last.data().created_at,last.id])).toString('base64url'):null});
    }
    if(method==='PATCH'&&path.length===3&&path[1]!=='accounts'){
      const id=z.string().regex(/^[a-f0-9]{64}$/).parse(path[2]),data=statusSchema.parse(await jsonBody(request)),ref=db.collection(collection).doc(id);
      await db.runTransaction(async tx=>{if(!(await tx.get(ref)).exists)throw new AppError(404,'No encontrado.');tx.update(ref,{...data,updated_at:timestamp()});tx.create(db.collection('cs_audit').doc(),{actor_uid:user.uid,action:'followup.update',collection,record_id:id,created_at:timestamp()});});return response({ok:true});
    }
  }
  throw new AppError(404,'No encontrado.');
}catch(error){if(error instanceof z.ZodError)return response({error:'Revisa los campos y las autorizaciones del formulario.'},400);if(error instanceof AppError)return response({error:error.message},error.status);console.error('Coming Soon request failed',{name:error instanceof Error?error.name:'unknown'});return response({error:'El servicio no está disponible en este momento. Tu registro no se ha confirmado.'},503);}}
export const GET=handle;export const POST=handle;export const DELETE=handle;export const PATCH=handle;
