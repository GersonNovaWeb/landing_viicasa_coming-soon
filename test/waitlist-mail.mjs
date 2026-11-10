import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {renderWaitlistNotification,waitlistNotificationRecipient} from '../src/lib/waitlist-mail.ts';

const hash=value=>createHash('sha256').update(value).digest('hex');
const enabled=process.env.RUN_WAITLIST_EMULATOR==='true';
let db,saveUnverified,saveVerified,registrationSchema,dispatchWelcome,defaultWelcome;
if(enabled){
  Object.assign(process.env,{NODE_ENV:'test',FIREBASE_MODE:'emulator',FIREBASE_PROJECT_ID:'demo-viicasa-comingsoon',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8086',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9096',SITE_URL:'http://127.0.0.1:3012',MAIL_MODE:'disabled',MAIL_DAILY_LIMIT:'1000'});
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  ({db}=(await import('../src/server/firebase.ts')).firebase());
  ({saveUnverified,saveVerified,registrationSchema}=await import('../src/server/leads.ts'));
  ({dispatchWelcome}=await import('../src/server/welcome-mail.ts'));
  ({defaultWelcome}=await import('../src/lib/welcome-mail.ts'));
}
after(async()=>{if(db)await db.terminate();});

test('internal notification uses the branded frame, English copy, all interests and exact visitor data',()=>{
  const mail=renderWaitlistNotification({name:'Jane {servicio} <script>alert(1)</script>',email:'jane@example.invalid',city:'Kelowna',locale:'es',source:'home'},['shop','viiconcierge','viilife'],'2026-11-09T18:00:00.000Z','https://viicasa.com/admin');
  assert.equal(waitlistNotificationRecipient,'accounts@viicasa.com');
  assert.equal(mail.subject,'New waitlist registration · VIICASA');
  for(const value of ['Jane {servicio}','jane@example.invalid','ViiShop, ViiConcierge, ViiLife','Spanish','Kelowna','2026-11-09T18:00:00.000Z','https://viicasa.com/admin'])assert.ok(mail.text.includes(value),value);
  assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>'));assert.ok(mail.html.includes('https://viicasa.com/images/logo-email.png'));assert.ok(mail.html.includes('<html lang="en">'));
  assert.throws(()=>renderWaitlistNotification({},[],'',''));
});

const input=(changes={})=>registrationSchema.parse({name:'Waitlist Visitor',email:`notice-${randomUUID()}@example.invalid`,locale:'en',interests:['shop','viilife','viiconcierge'],kind:'waitlist',privacy:true,marketing:true,source:'home',...changes});
const row=id=>db.collection('cs_mail_outbox').doc(id);

test('one grouped accounts notification is atomic, deduplicated under concurrent retries and independent of welcome activation',{skip:!enabled},async()=>{
  const data=input(),saved=await Promise.all([saveUnverified(data),saveUnverified(data)]);
  assert.equal(saved.flatMap(value=>value.notificationIds).length,1);
  const id=saved.flatMap(value=>value.notificationIds)[0],notice=(await row(id).get()).data();
  assert.equal(notice.type,'waitlist_notification');assert.equal(notice.email,'accounts@viicasa.com');assert.equal(notice.subscriber_email,data.email);assert.equal(notice.contact_id,hash(data.email));assert.equal(notice.state,'pending');
  assert.deepEqual(notice.services,['shop','viiconcierge','viilife']);assert.ok(notice.mail.text.includes(data.email));
  assert.equal((await saveVerified(data,'test-uid')).notificationIds.length,0);
  let sends=0;
  const sender=async(to,mail)=>{sends++;assert.equal(to,'accounts@viicasa.com');assert.equal(mail.subject,'New waitlist registration · VIICASA');};
  const states=await Promise.all([dispatchWelcome(id,sender),dispatchWelcome(id,sender)]);
  assert.ok(states.includes('sent'));assert.equal(sends,1);assert.equal((await row(id).get()).data().state,'sent');
  await dispatchWelcome(id,sender);assert.equal(sends,1);
});

test('new interests notify once for both Google and public registration; inquiries do not create a waitlist alert',{skip:!enabled},async()=>{
  const data=input({interests:['shop']}),first=await saveVerified(data,'test-uid');assert.equal(first.notificationIds.length,1);
  const extra=await saveUnverified({...data,interests:['shop','viilife']});assert.equal(extra.notificationIds.length,1);
  assert.deepEqual((await row(extra.notificationIds[0]).get()).data().services,['viilife']);
  assert.equal((await saveUnverified({...data,interests:['viilife','shop']})).notificationIds.length,0);
  const inquiry=await saveUnverified(input({kind:'inquiry',marketing:false,message:'Please contact me'}));assert.deepEqual(inquiry.notificationIds,[]);
});

test('customer welcome keeps its customer recipient and template; internal alert cannot redirect it',{skip:!enabled},async()=>{
  const ref=db.collection('cs_mail_templates').doc('shop'),original=await ref.get();
  try{
    const template=defaultWelcome('shop');template.enabled=true;await ref.set({template,revision:1});
    const data=input({interests:['shop']}),saved=await saveUnverified(data),recipients=[];
    assert.equal(saved.mailIds.length,1);assert.equal(saved.notificationIds.length,1);
    for(const id of [...saved.notificationIds,...saved.mailIds])await dispatchWelcome(id,async(to)=>{recipients.push(to);});
    assert.deepEqual(recipients,['accounts@viicasa.com',data.email]);
    assert.equal((await row(saved.mailIds[0]).get()).data().mail.subject,template.en.subject);
  }finally{if(original.exists)await ref.set(original.data());else await ref.delete();}
});

test('SMTP failure preserves the registration and uncertain notices are not automatically resent',{skip:!enabled},async()=>{
  const data=input(),saved=await saveUnverified(data),id=saved.notificationIds[0];let sends=0;
  const sender=async()=>{sends++;throw Error('Provider secret must not be stored');};
  assert.equal(await dispatchWelcome(id,sender),'unknown');assert.equal(await dispatchWelcome(id,sender),'not_claimed');assert.equal(sends,1);
  assert.equal((await db.collection('cs_contacts').doc(hash(data.email)).get()).exists,true);
  assert.equal((await row(id).get()).data().reason,'smtp_error_check_provider');assert.ok(!JSON.stringify((await row(id).get()).data()).includes('Provider secret'));
});

test('unconfigured SMTP retains a pending alert for the admin; removed registrations suppress delivery',{skip:!enabled},async()=>{
  const data=input(),saved=await saveUnverified(data),id=saved.notificationIds[0];
  assert.equal(await dispatchWelcome(id),'unconfigured');assert.equal((await row(id).get()).data().state,'pending');
  await db.collection('cs_contacts').doc(hash(data.email)).delete();let sends=0;
  await dispatchWelcome(id,async()=>{sends++;});assert.equal(sends,0);assert.equal((await row(id).get()).data().state,'skipped');
});

test('a closed claim transaction can restart before SMTP without sending twice; validation errors are not retried',{skip:!enabled},async()=>{
  const saved=await saveUnverified(input()),id=saved.notificationIds[0],original=db.runTransaction;
  let claims=0,sends=0;
  try{
    db.runTransaction=function(...args){claims++;if(claims===1)return Promise.reject(Object.assign(Error('3 INVALID_ARGUMENT: Transaction is invalid or closed.'),{code:3}));return original.apply(this,args);};
    assert.equal(await dispatchWelcome(id,async()=>{sends++;}),'sent');assert.equal(claims,2);assert.equal(sends,1);
    await dispatchWelcome(id,async()=>{sends++;});assert.equal(sends,1);
    db.runTransaction=original;
    const another=await saveUnverified(input());claims=0;
    db.runTransaction=function(){claims++;return Promise.reject(Object.assign(Error('Invalid field path.'),{code:3}));};
    await assert.rejects(dispatchWelcome(another.notificationIds[0],async()=>{sends++;}),/Invalid field path/);assert.equal(claims,1);assert.equal(sends,1);
  }finally{db.runTransaction=original;}
});
