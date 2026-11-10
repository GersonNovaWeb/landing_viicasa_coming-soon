import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
// Explicit opt-in; this suite never uses application-default credentials.
const enabled=process.env.RUN_WAITLIST_EMULATOR==='true';
let db,saveUnverified,saveVerified,registrationSchema;
if(enabled){
  Object.assign(process.env,{NODE_ENV:'test',FIREBASE_MODE:'emulator',FIREBASE_PROJECT_ID:'demo-viicasa-comingsoon',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8086',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9096',MAIL_MODE:'disabled'});
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  ({db}=(await import('../src/server/firebase.ts')).firebase());
  ({saveUnverified,saveVerified,registrationSchema}=await import('../src/server/leads.ts'));
}
after(async()=>{if(db)await db.terminate();});
test('anonymous HTTP registration reaches Firestore; missing consent and cross-origin requests fail; admin list stays protected',{skip:!enabled||!process.env.WAITLIST_HTTP_BASE},async()=>{
  const base=process.env.WAITLIST_HTTP_BASE,origin=new URL(base).origin;
  assert.equal(new URL(base).hostname,'127.0.0.1');
  const config=await(await fetch(base+'/api/comingsoon/config')).json();assert.equal(config.mode,'emulator');assert.equal(config.email,true);
  const email=`http-${randomUUID()}@example.invalid`;
  for(const service of ['viilife','shop','viiconcierge']){
    const input={name:'HTTP Test Visitor',email,locale:'es',interests:[service],kind:'waitlist',privacy:true,marketing:true,source:service,website:''};
    const request=(body,requestOrigin=origin)=>fetch(base+'/api/comingsoon/register',{method:'POST',headers:{origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await request({...input,privacy:false})).status,400);
    assert.equal((await request({...input,notificationRecipient:'other@example.invalid'})).status,400);
    assert.equal((await request(input,'https://wrong.invalid')).status,403);
    const response=await request(input);assert.equal(response.status,200,await response.text());
    const id=createHash('sha256').update(`${email}:${service}`).digest('hex');
    const saved=(await db.collection('cs_waitlist').doc(id).get()).data();assert.equal(saved.service,service);assert.equal(saved.locale,'es');
    const noticeId=createHash('sha256').update(`waitlist-notification:${email}:${service}`).digest('hex');
    const notice=(await db.collection('cs_mail_outbox').doc(noticeId).get()).data();assert.equal(notice.email,'accounts@viicasa.com');assert.equal(notice.type,'waitlist_notification');assert.ok(notice.mail.text.includes(email));assert.equal(notice.state,'pending','emulated HTTP never sends real email');
  }
  assert.equal((await fetch(base+'/api/comingsoon/admin/waitlist')).status,401);
});
test('waitlist saves separate service memberships, deduplicates, preserves verified identity and follow-up',{skip:!enabled},async()=>{
  const email=`waitlist-${randomUUID()}@example.invalid`,key=service=>createHash('sha256').update(`${email}:${service}`).digest('hex');
  const input=service=>registrationSchema.parse({name:'Test Visitor',email,locale:'en',interests:[service],kind:'waitlist',privacy:true,marketing:true,source:service});
  await saveVerified(input('shop'),'test-uid');await saveUnverified(input('viilife'));await saveUnverified(input('viiconcierge'));
  const first=db.collection('cs_waitlist').doc(key('shop'));await first.update({status:'contacted',notes:'Keep this decision'});
  await saveUnverified({...input('shop'),name:'Untrusted replacement'});
  for(const service of ['shop','viilife','viiconcierge']){const row=(await db.collection('cs_waitlist').doc(key(service)).get()).data();assert.equal(row.service,service);assert.equal(row.name,'Test Visitor');assert.equal(row.marketing,true);assert.ok(row.privacy_version);
    const mailId=createHash('sha256').update(`welcome:${email}:${service}`).digest('hex');assert.equal((await db.collection('cs_mail_outbox').doc(mailId).get()).exists,true,'each newly selected service has its own welcome plan');
  }
  assert.equal((await first.get()).data().status,'contacted');
  const contact=(await db.collection('cs_contacts').doc(createHash('sha256').update(email).digest('hex')).get()).data();assert.equal(contact.verified,true);assert.equal(contact.uid,'test-uid');assert.equal(contact.name,'Test Visitor');
  assert.equal(registrationSchema.safeParse({...input('shop'),privacy:false}).success,false);
  assert.equal(registrationSchema.safeParse({...input('shop'),marketing:false}).success,false);
});
