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
test('SMTP disabled never pretends an email has been sent',async()=>{const r=await req('register',{...input,email:`mail-${randomUUID()}@example.com`});assert.equal(r.status,503);});
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
test('live mode refuses emulator environment',()=>{process.env.FIREBASE_MODE='live';assert.throws(configuration,/mezclar/);process.env.FIREBASE_MODE='emulator';});
