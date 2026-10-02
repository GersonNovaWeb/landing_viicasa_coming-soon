import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
Object.assign(process.env,{NODE_ENV:'test',FIREBASE_MODE:'emulator',FIREBASE_PROJECT_ID:'demo-viicasa-comingsoon',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8086',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9096',SITE_URL:'http://127.0.0.1:3012'});
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const {firebase,configuration}=await import('../src/server/firebase.ts');
const {db,auth}=firebase(),base='http://127.0.0.1:3012',hash=s=>createHash('sha256').update(s).digest('hex');
const email=`visitor-${randomUUID()}@example.com`;
const input={name:'Visitante de prueba',email,interests:['viilife'],kind:'waitlist',privacy:true,marketing:true,source:'home',phone:'',message:'',website:''};
let visitor,admin,visitorUid;
async function req(path,body,session,method=body===undefined?'GET':'POST',origin=base){const r=await fetch(`${base}/api/comingsoon/${path}`,{method,headers:{origin,...(body===undefined?{}:{'Content-Type':'application/json'}),...(session?{cookie:session}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();return{status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function google(email){
 const sub=hash(email),jwt=[{alg:'none',typ:'JWT'},{sub,email,email_verified:true,name:'Persona de prueba',iss:'https://accounts.google.com',aud:'fake-client'}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.';
 const r=await fetch('http://127.0.0.1:9096/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postBody:new URLSearchParams({id_token:jwt,providerId:'google.com'}).toString(),requestUri:base,returnSecureToken:true})});
 const token=await r.json();assert.ok(token.idToken,JSON.stringify(token));const result=await req('session',{idToken:token.idToken,privacy:true});assert.equal(result.status,200,JSON.stringify(result.data));return{cookie:result.cookie,user:result.data.user};
}
before(async()=>{const v=await google(email);visitor=v.cookie;visitorUid=v.user.uid;admin=(await google('viicasa.database@gmail.com')).cookie;});
after(async()=>{await db.terminate();});
test('public routes render and legacy comingsoon redirects',async()=>{for(const p of ['/','/viilife','/viiconcierge','/shop','/admin','/cuenta','/privacidad','/confirmar'])assert.equal((await fetch(base+p)).status,200,p);const r=await fetch(base+'/comingsoon',{redirect:'manual'});assert.equal(r.status,308);});
test('legacy property and reservation prototypes are not public routes',async()=>{for(const path of ['/properties','/reservations','/unknown-service'])assert.equal((await fetch(base+path)).status,404,path);});
test('Google identity creates one account, not a mailing subscription',async()=>{assert.equal((await db.collection('cs_accounts').doc(visitorUid).get()).data().email,email);assert.equal((await db.collection('cs_contacts').doc(hash(email)).get()).exists,false);assert.equal((await req('session',undefined,visitor)).data.user.admin,false);});
test('anonymous and non-admin users cannot access dashboard data',async()=>{assert.equal((await req('admin/summary')).status,401);assert.equal((await req('admin/accounts',undefined,visitor)).status,403);assert.equal((await req('admin/summary',undefined,admin)).status,200);});
test('forged tokens, forged roles, identity changes and missing consent rejected',async()=>{assert.equal((await req('session',{idToken:'invalid',privacy:true})).status,401);assert.equal((await req('register',{...input,role:'admin'},visitor)).status,400);assert.equal((await req('register',{...input,email:'other@example.com'},visitor)).status,400);assert.equal((await req('register',{...input,privacy:false},visitor)).status,400);});
test('cross-origin writes and oversized requests rejected',async()=>{assert.equal((await req('register',input,visitor,'POST','https://example.net')).status,403);assert.equal((await req('session',{idToken:'x'.repeat(20000),privacy:true})).status,413);});
test('concurrent subscriptions deduplicate contact and preserve multiple interests',async()=>{const r=await Promise.all([req('register',input,visitor),req('register',{...input,interests:['shop']},visitor)]);r.forEach(x=>assert.equal(x.status,200,JSON.stringify(x.data)));const row=(await db.collection('cs_contacts').doc(hash(email)).get()).data();assert.deepEqual(row.interests.sort(),['shop','viilife']);assert.equal(row.marketing,true);});
test('service inquiry persists once on retry and admin saves followup',async()=>{const data={...input,kind:'inquiry',source:'viilife',message:'Quiero conocer el servicio',marketing:false};assert.equal((await req('register',data,visitor)).status,200);assert.equal((await req('register',data,visitor)).status,200);const id=hash(`${hash(email)}:viilife:${data.message}`),row=(await db.collection('cs_inquiries').doc(id).get()).data();assert.equal(row.message,data.message);assert.equal((await req(`admin/inquiries/${id}`,{status:'contacted',notes:'Nota privada'},visitor,'PATCH')).status,403);assert.equal((await req(`admin/inquiries/${id}`,{status:'contacted',notes:'Nota privada'},admin,'PATCH')).status,200);assert.equal((await db.collection('cs_inquiries').doc(id).get()).data().notes,'Nota privada');});
test('unsubscribe is effective and direct Firestore access is denied',async()=>{assert.equal((await req('preferences',undefined,visitor,'DELETE')).status,200);assert.equal((await db.collection('cs_contacts').doc(hash(email)).get()).data().marketing,false);const r=await fetch('http://127.0.0.1:8086/v1/projects/demo-viicasa-comingsoon/databases/(default)/documents/cs_contacts');assert.equal(r.status,403);});
test('email confirmation is one-time, atomic and does not create a Google account',async()=>{const address=`email-${randomUUID()}@example.com`,id=hash(address),secret=randomBytes(32).toString('base64url');await db.collection('cs_pending').doc(id).set({...input,email:address,token_hash:hash(secret),requested_at:new Date().toISOString(),expires_at:new Date(Date.now()+60000).toISOString()});const r=await Promise.all([req('confirm',{token:`${id}.${secret}`}),req('confirm',{token:`${id}.${secret}`})]);r.forEach(x=>assert.equal(x.status,200,JSON.stringify(x.data)));const contact=(await db.collection('cs_contacts').doc(id).get()).data();assert.equal(contact.verified,true);assert.equal(contact.uid,null);assert.equal((await req('confirm',{token:`${id}.${'x'.repeat(43)}`})).status,400);await db.collection('cs_contacts').doc(id).update({marketing:false});await req('confirm',{token:`${id}.${secret}`});assert.equal((await db.collection('cs_contacts').doc(id).get()).data().marketing,false);});
test('direct registration works without Google or SMTP and immediately appears in the admin list',async()=>{
 const address=`direct-${randomUUID()}@example.com`,id=hash(address);
 assert.equal((await req('config')).data.email,true);
 const r=await req('register',{...input,name:'Contacto sin Google',email:address,locale:'en'});
 assert.equal(r.status,200);assert.equal(r.data.state,'saved');assert.equal(r.cookie,undefined);
 const row=(await db.collection('cs_contacts').doc(id).get()).data();
 assert.equal(row.name,'Contacto sin Google');assert.equal(row.email,address);assert.equal(row.verified,false);assert.equal(row.uid,null);assert.equal(row.locale,'en');
 assert.equal((await db.collection('cs_pending').doc(id).get()).exists,false);
 assert.equal((await db.collection('cs_accounts').where('email','==',address).get()).size,0);
 assert.ok((await req('admin/contacts',undefined,admin)).data.rows.some(row=>row.id===id&&row.verified===false));
});
test('direct submissions deduplicate without overwriting names, consent or admin follow-up',async()=>{
 const address=`duplicate-${randomUUID()}@example.com`,id=hash(address),data={...input,email:address};
 const results=await Promise.all([req('register',data),req('register',data)]);
 results.forEach(r=>assert.equal(r.status,200));
 await db.collection('cs_contacts').doc(id).update({notes:'Private followup',status:'contacted',marketing:false});
 const before=(await db.collection('cs_contacts').doc(id).get()).data();
 assert.equal((await req('register',{...data,name:'Untrusted change',interests:['shop']})).status,200);
 assert.deepEqual((await db.collection('cs_contacts').doc(id).get()).data(),before);
});
test('anonymous submissions cannot overwrite a verified contact or resubscribe them',async()=>{
 const address=`protected-${randomUUID()}@example.com`,person=await google(address),id=hash(address);
 assert.equal((await req('register',{...input,email:address},person.cookie)).status,200);
 assert.equal((await req('preferences',undefined,person.cookie,'DELETE')).status,200);
 const before=(await db.collection('cs_contacts').doc(id).get()).data();
 assert.equal((await req('register',{...input,email:address,name:'Impersonation',interests:['shop']})).status,200);
 assert.deepEqual((await db.collection('cs_contacts').doc(id).get()).data(),before);
});
test('direct service inquiries are recorded as unverified and Google can later verify its own submission',async()=>{
 const address=`inquiry-${randomUUID()}@example.com`,id=hash(address);
 const anonymous={...input,email:address,kind:'inquiry',source:'viilife',message:'Consulta directa',marketing:true,phone:'5551112222'};
 const inquiryId=hash(`${id}:viilife:${anonymous.message}`);
 assert.equal((await req('register',anonymous)).status,200);
 assert.equal((await db.collection('cs_inquiries').doc(inquiryId).get()).data().verified,false);
 const person=await google(address);
 const verified={...anonymous,name:'Nombre verificado',interests:['shop'],marketing:false,phone:''};
 assert.equal((await req('register',verified,person.cookie)).status,200);
 const contact=(await db.collection('cs_contacts').doc(id).get()).data();
 assert.equal(contact.verified,true);assert.equal(contact.uid,person.user.uid);assert.equal(contact.marketing,false);assert.equal(contact.phone,'');assert.deepEqual(contact.interests,['shop']);
 assert.equal((await db.collection('cs_inquiries').doc(inquiryId).get()).data().verified,true);
});
test('anonymous registration still enforces consent, validation, honeypot, origin and rate limits',async()=>{
 const address=`safety-${randomUUID()}@example.com`,data={...input,email:address};
 for(const changed of [{name:''},{email:'invalid'},{privacy:false},{marketing:false},{website:'spam'},{verified:true},{uid:'forged'}]){
  assert.equal((await req('register',{...data,...changed})).status,400);
 }
 assert.equal((await req('register',data,undefined,'POST','https://example.net')).status,403);
 assert.equal((await db.collection('cs_contacts').doc(hash(address)).get()).exists,false);
 for(let i=0;i<4;i++)assert.equal((await req('register',data)).status,200);
 assert.equal((await req('register',data)).status,429);
});
test('a stale session does not block public capture or confer verified status',async()=>{
 const address=`stale-${randomUUID()}@example.com`;
 assert.equal((await req('register',{...input,email:address},'viicasa_session=invalid')).status,200);
 assert.equal((await db.collection('cs_contacts').doc(hash(address)).get()).data().verified,false);
 assert.equal((await req('admin/contacts',undefined,'viicasa_session=invalid')).status,401);
});
test('invalid cursors are rejected and authorized lists are paginated',async()=>{assert.equal((await req('admin/contacts?cursor=broken',undefined,admin)).status,400);const r=await req('admin/accounts',undefined,admin);assert.equal(r.status,200);assert.ok(Array.isArray(r.data.rows));assert.ok(r.data.rows.length<=50);});
test('disabled account invalidates existing server session',async()=>{await auth.updateUser(visitorUid,{disabled:true});assert.equal((await req('session',undefined,visitor)).status,401);await auth.updateUser(visitorUid,{disabled:false});});

test('English registration preserves locale and invalid locales are rejected',async()=>{
 const address=`english-${randomUUID()}@example.com`,person=await google(address);
 assert.equal((await req('register',{...input,email:address,locale:'fr'},person.cookie)).status,400);
 assert.equal((await req('register',{...input,email:address,locale:'en'},person.cookie)).status,200);
 assert.equal((await db.collection('cs_contacts').doc(hash(address)).get()).data().locale,'en');
});
test('authenticated dashboard renders in English without changing permissions',async()=>{
 const response=await fetch(base+'/admin',{headers:{cookie:`${admin}; viicasa_language=en`}});
 assert.equal(response.status,200);
 const html=(await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 assert.ok(html.includes('Registered users'));
 assert.ok(html.includes('Interested clients'));
 assert.ok(html.includes('lang="en"'));
});
test('contact deletion requires admin, same origin, valid ID and explicit confirmation',async()=>{
 const id=hash(`delete-permissions-${randomUUID()}@example.com`),path=`admin/contacts/${id}`;
 await db.collection('cs_contacts').doc(id).set({...input,created_at:new Date().toISOString()});
 assert.equal((await req(path,{confirm:true},undefined,'DELETE')).status,401);
 assert.equal((await req(path,{confirm:true},visitor,'DELETE')).status,403);
 assert.equal((await req(path,{confirm:true},admin,'DELETE','https://example.net')).status,403);
 for(const body of [{},{confirm:false},{confirm:true,extra:true}])assert.equal((await req(path,body,admin,'DELETE')).status,400);
 assert.equal((await req('admin/contacts/invalid',{confirm:true},admin,'DELETE')).status,400);
 assert.equal((await req(`admin/accounts/${visitorUid}`,{confirm:true},admin,'DELETE')).status,404);
 assert.equal((await req(`admin/inquiries/${id}`,{confirm:true},admin,'DELETE')).status,404);
 assert.equal((await db.collection('cs_contacts').doc(id).get()).exists,true);
});
test('admin deletion removes only the contact and pending confirmation, updates lists and records an audit',async()=>{
 const address=`delete-${randomUUID()}@example.com`,id=hash(address),secret=randomBytes(32).toString('base64url');
 const contact={...input,email:address,uid:visitorUid,created_at:new Date().toISOString()};
 await db.collection('cs_contacts').doc(id).set(contact);
 await db.collection('cs_pending').doc(id).set({...contact,token_hash:hash(secret),expires_at:new Date(Date.now()+60000).toISOString()});
 await db.collection('cs_inquiries').doc(id).set({contact_id:id,message:'Keep this service request'});
 const beforeSummary=(await req('admin/summary',undefined,admin)).data;
 const path=`admin/contacts/${id}`;
 assert.equal((await req(path,{confirm:true},admin,'DELETE')).status,200);
 assert.equal((await db.collection('cs_contacts').doc(id).get()).exists,false);
 assert.equal((await db.collection('cs_pending').doc(id).get()).exists,false);
 assert.equal((await req('confirm',{token:`${id}.${secret}`})).status,400);
 assert.equal((await db.collection('cs_accounts').doc(visitorUid).get()).exists,true);
 assert.equal((await db.collection('cs_inquiries').doc(id).get()).exists,true);
 const afterSummary=(await req('admin/summary',undefined,admin)).data;
 assert.equal(afterSummary.contacts,beforeSummary.contacts-1);
 assert.equal(afterSummary.marketing,beforeSummary.marketing-1);
 const list=(await req('admin/contacts',undefined,admin)).data.rows;
 assert.equal(list.some(row=>row.id===id),false);
 const audit=await db.collection('cs_audit').where('record_id','==',id).get();
 assert.equal(audit.size,1);assert.equal(audit.docs[0].data().action,'contact.delete');
 assert.equal((await req(path,{confirm:true},admin,'DELETE')).status,404);
 assert.equal((await db.collection('cs_audit').where('record_id','==',id).get()).size,1);
});
test('Google registration requires a supplied name and saves it with the verified Google email',async()=>{
 const address=`named-${randomUUID()}@example.com`,person=await google(address);
 const data={...input,email:address};
 for(const name of ['', '   '])assert.equal((await req('register',{...data,name},person.cookie)).status,400);
 assert.equal((await db.collection('cs_contacts').doc(hash(address)).get()).exists,false);
 assert.equal((await req('register',{...data,name:'  Nombre elegido por cliente  '},person.cookie)).status,200);
 const saved=(await db.collection('cs_contacts').doc(hash(address)).get()).data();
 assert.equal(saved.name,'Nombre elegido por cliente');assert.equal(saved.email,address);assert.equal(saved.uid,person.user.uid);
 const list=(await req('admin/contacts',undefined,admin)).data.rows;
 assert.ok(list.some(row=>row.id===hash(address)&&row.name==='Nombre elegido por cliente'&&row.email===address));
});
test('live mode refuses emulator environment',()=>{process.env.FIREBASE_MODE='live';assert.throws(configuration,/mezclar/);process.env.FIREBASE_MODE='emulator';});

test('service welcome templates and delivery lifecycle (emulated, no real emails)',async t=>{
 const {defaultWelcome,renderWelcome,welcomeTemplateSchema,mailServices}=await import('../src/lib/welcome-mail.ts');
 const {dispatchWelcome,smtpStatus}=await import('../src/server/welcome-mail.ts');
 const {saveUnverified,registrationSchema}=await import('../src/server/leads.ts');
 const refs=mailServices.map(s=>db.collection('cs_mail_templates').doc(s));
 const originals=await db.getAll(...refs);let firstIds;
 const fresh=()=>`mail-${randomUUID()}@example.com`;
 try{
  await t.test('rendering escapes markup, substitutes names, rejects header injection and unknown tokens',()=>{
   const copy=defaultWelcome('shop').en;const rendered=renderWelcome({...copy,body:'Hi {nombre}, welcome to {servicio}.'},'shop','en','<img src=x onerror=alert(1)>');
   assert.ok(rendered.html.includes('&lt;img'));assert.equal((rendered.html.match(/<img /g)||[]).length,1);assert.ok(!rendered.html.includes('<img src=x'));assert.ok(rendered.text.includes('welcome to Shop'));
   assert.equal(welcomeTemplateSchema.safeParse({...defaultWelcome('shop'),en:{...copy,subject:'Hi\r\nBcc: x@example.com'}}).success,false);
   assert.equal(welcomeTemplateSchema.safeParse({...defaultWelcome('shop'),en:{...copy,body:'Hi {password}'}}).success,false);
  });
  await t.test('only admins can read/edit/test/process templates, with origin and schema validation',async()=>{
   assert.equal((await req('admin/mail')).status,401);assert.equal((await req('admin/mail',undefined,visitor)).status,403);
   for(const path of ['admin/mail/log','admin/mail/test','admin/mail/process'])assert.equal((await req(path,path.endsWith('log')?undefined:{},visitor)).status,403);
   const s=await req('admin/mail',undefined,admin);assert.equal(s.status,200);assert.equal(s.data.smtp.ready,false);assert.equal(s.data.testRecipient,'gerson@novaweb-agency.com');assert.equal(JSON.stringify(s.data).includes('SMTP_PASSWORD'),false);
   const payload={template:defaultWelcome('shop'),revision:s.data.templates.shop.revision};
   assert.equal((await req('admin/mail/shop',payload,admin,'PATCH','https://evil.example')).status,403);
   assert.equal((await req('admin/mail/shop',{...payload,to:'other@example.com'},admin,'PATCH')).status,400);
   assert.equal((await req('admin/mail/test',{service:'shop',locale:'en',template:payload.template,to:'other@example.com'},admin)).status,400);
   const testPayload={service:'shop',locale:'en',template:payload.template,recipient:'another@example.com'};
   assert.equal((await req('admin/mail/test',testPayload)).status,401);
   assert.equal((await req('admin/mail/test',testPayload,visitor)).status,403);
   assert.equal((await req('admin/mail/test',testPayload,admin,'POST','https://evil.example')).status,403);
   assert.equal((await req('admin/mail/test',{service:'shop',locale:'en',template:payload.template},admin)).status,400);
   for(const recipient of ['', 'not-email','one@example.com,two@example.com','one@example.com\r\nBcc: two@example.com'])assert.equal((await req('admin/mail/test',{...testPayload,recipient},admin)).status,400);
   for(const key of ['to','from','cc','bcc'])assert.equal((await req('admin/mail/test',{...testPayload,[key]:'extra@example.com'},admin)).status,400);
   // Valid arbitrary recipient reaches the SMTP guard. Emulators never send real mail.
   assert.equal((await req('admin/mail/test',testPayload,admin)).status,503);
  });
  await t.test('saves both languages per service; stale editors cannot overwrite newer changes',async()=>{
   for(const service of mailServices){const s=(await req('admin/mail',undefined,admin)).data;const template=defaultWelcome(service);template.enabled=true;template.es.body='Hola {nombre}, recibimos tu interés en {servicio}.';template.en.body='Hello {nombre}, we received your interest in {servicio}.';
    const body={template,revision:s.templates[service].revision};assert.equal((await req(`admin/mail/${service}`,body,admin,'PATCH')).status,200);assert.equal((await req(`admin/mail/${service}`,body,admin,'PATCH')).status,409);
   }
  });
  await t.test('multi-interest registration snapshots three localized templates; duplicates cannot resend',async()=>{
   const address=fresh(),data={...input,email:address,name:'María prueba',locale:'es',interests:[...mailServices]};
   const responses=await Promise.all([req('register',data),req('register',data)]);responses.forEach(r=>assert.equal(r.status,200,JSON.stringify(r.data)));
   firstIds=mailServices.map(s=>hash(`welcome:${address}:${s}`));
   for(const id of firstIds){const row=(await db.collection('cs_mail_outbox').doc(id).get()).data();assert.equal(row.state,'pending');assert.equal(row.locale,'es');assert.ok(row.mail.text.includes('Hola María prueba'));}
   const template=defaultWelcome('viilife');template.enabled=true;template.es.body='CAMBIADO';const s=(await req('admin/mail',undefined,admin)).data;
   assert.equal((await req('admin/mail/viilife',{template,revision:s.templates.viilife.revision},admin,'PATCH')).status,200);
   assert.ok(!(await db.collection('cs_mail_outbox').doc(firstIds[0]).get()).data().mail.text.includes('CAMBIADO'));
  });
  await t.test('concurrent dispatch claims once; accepted messages are not resent',async()=>{
   let sent=0;const sender=async(to,mail)=>{sent++;assert.ok(to.endsWith('@example.com'));assert.ok(mail.html.includes('VIICASA'));};
   await Promise.all([dispatchWelcome(firstIds[0],sender),dispatchWelcome(firstIds[0],sender)]);assert.equal(sent,1);
   assert.equal((await db.collection('cs_mail_outbox').doc(firstIds[0]).get()).data().state,'sent');await dispatchWelcome(firstIds[0],sender);assert.equal(sent,1);
  });
  await t.test('SMTP error does not lose contact and ambiguous outcomes are not retried',async()=>{
   let attempts=0;const fail=async()=>{attempts++;throw Error('fake SMTP timeout with secret detail');};
   assert.equal(await dispatchWelcome(firstIds[1],fail),'unknown');await dispatchWelcome(firstIds[1],fail);assert.equal(attempts,1);
   const row=(await db.collection('cs_mail_outbox').doc(firstIds[1]).get()).data();assert.equal(row.reason,'smtp_error_check_provider');assert.equal(JSON.stringify(row).includes('secret detail'),false);assert.equal((await db.collection('cs_contacts').doc(row.contact_id).get()).exists,true);
  });
  await t.test('rolling budget defers extra messages without contacting SMTP',async()=>{
   const before=process.env.MAIL_DAILY_LIMIT;process.env.MAIL_DAILY_LIMIT='1';let sent=0;
   try{await dispatchWelcome(firstIds[2],async()=>{sent++;});assert.equal(sent,0);assert.equal((await db.collection('cs_mail_outbox').doc(firstIds[2]).get()).data().state,'pending');}finally{if(before===undefined)delete process.env.MAIL_DAILY_LIMIT;else process.env.MAIL_DAILY_LIMIT=before;}
  });
  await t.test('each service page queues its own English acknowledgement without marketing opt-in',async()=>{
   for(const service of mailServices){const data={...input,email:fresh(),locale:'en',source:service,interests:[service],kind:'inquiry',marketing:false};assert.equal((await req('register',data)).status,200);const row=(await db.collection('cs_mail_outbox').doc(hash(`welcome:${data.email}:${service}`)).get()).data();assert.equal(row.service,service);assert.equal(row.locale,'en');assert.ok(row.mail.text.includes('Hello'));
   }
  });
  await t.test('disabled templates reserve a skipped welcome and enabling does not backfill duplicates',async()=>{
   const template=defaultWelcome('shop');await refs[2].set({template,revision:1});const data=registrationSchema.parse({...input,email:fresh(),interests:['shop']});await saveUnverified(data);
   const ref=db.collection('cs_mail_outbox').doc(hash(`welcome:${data.email}:shop`));assert.equal((await ref.get()).data().state,'skipped');template.enabled=true;await refs[2].set({template,revision:2});await saveUnverified(data);assert.equal((await ref.get()).data().state,'skipped');
  });
  await t.test('deleted contacts, unsubscribe and disabled service suppress pending mail',async()=>{
   for(const scenario of ['deleted','unsubscribed','disabled']){
    const template=defaultWelcome('shop');template.enabled=true;await refs[2].set({template,revision:2});const data=registrationSchema.parse({...input,email:fresh(),interests:['shop']});const saved=await saveUnverified(data);
    const ref=db.collection('cs_contacts').doc(hash(data.email));if(scenario==='deleted')await ref.delete();if(scenario==='unsubscribed')await ref.update({marketing:false});if(scenario==='disabled')await refs[2].update({'template.enabled':false});
    let sent=0;await dispatchWelcome(saved.mailIds[0],async()=>{sent++;});assert.equal(sent,0);assert.equal((await db.collection('cs_mail_outbox').doc(saved.mailIds[0]).get()).data().state,'skipped');
   }
  });
  await t.test('admin log shows safe metadata only and emulator cannot open SMTP even with credentials',async()=>{
   const r=await req('admin/mail/log',undefined,admin);assert.equal(r.status,200);assert.ok(r.data.rows.length);assert.ok(r.data.rows.every(row=>!('mail'in row)));
   const old={MAIL_MODE:process.env.MAIL_MODE,SMTP_HOST:process.env.SMTP_HOST,SMTP_USER:process.env.SMTP_USER,SMTP_PASSWORD:process.env.SMTP_PASSWORD,MAIL_FROM:process.env.MAIL_FROM};
   try{Object.assign(process.env,{MAIL_MODE:'smtp',SMTP_HOST:'smtp.example.com',SMTP_USER:'test',SMTP_PASSWORD:'fake',MAIL_FROM:'test@example.com'});assert.equal(smtpStatus().ready,false);}finally{for(const[k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
  });
 }finally{for(let i=0;i<refs.length;i++){if(originals[i].exists)await refs[i].set(originals[i].data());else await refs[i].delete();}}
});
