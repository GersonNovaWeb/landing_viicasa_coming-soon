import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultWelcome,renderWelcome,mailServices,mailNames} from '../src/lib/welcome-mail.ts';

for(const service of mailServices)for(const locale of ['es','en']){
 test(`approved HTML frame is preserved for ${service}/${locale}`,()=>{
  const copy={...defaultWelcome(service)[locale],body:'Hello {nombre}, welcome to {servicio}.',signature:'Team signature',footer:'Closing note'};
  const {html,text,subject}=renderWelcome(copy,service,locale,'Gerson');
  assert.ok(html.includes('max-width:720px'));
  assert.ok(html.includes('https://i.postimg.cc/rwSr9Qvj/Imagen-de-Chat-GPT-29-sept-2026-02-25-11-p-m.png'));
  assert.equal((html.match(/<img /g)||[]).length,1);
  assert.ok(html.includes('alt="VIICASA" width="145"'));
  for(const value of ['Kelowna, British Columbia, Canada','This email may contain confidential or privileged information intended exclusively for the recipient.','© 2026 VIICASA. All rights reserved.']){
   assert.ok(html.includes(value));assert.ok(text.includes(value));
  }
  assert.ok(html.includes('href="mailto:contact@viicasa.com"'));
  assert.ok(html.includes('https://www.instagram.com/viiconcierge?stkn=MXUzdnhrZjBrdDY2Zg%3D%3D&amp;utm_source=qr'));
  assert.ok(html.includes('https://www.facebook.com/profile.php?id=61594619251265&amp;mibextid=wwXIfr'));
  assert.ok(html.includes('<span style="color:#ffffff;">LinkedIn</span>'));
  assert.ok(html.includes(`Hello Gerson, welcome to ${mailNames[service]}.`));
  assert.ok(html.indexOf('Hello Gerson')<html.indexOf('Team signature'));
  assert.ok(html.indexOf('Team signature')<html.indexOf('Closing note'));
  assert.ok(html.indexOf('Closing note')<html.indexOf('Kelowna'));
  assert.ok(subject.includes(mailNames[service]));
  assert.ok(text.includes('Canada\nhttps://viicasa.com'));assert.ok(!text.includes('\\n'));
 });
}
test('untrusted content cannot alter the fixed HTML or add images/scripts',()=>{
 const injected='<img src=x onerror=alert(1)><script>alert(1)</script>';
 const {html}=renderWelcome({subject:'Hello {nombre}',body:injected,signature:injected,footer:injected},'shop','en',injected);
 assert.equal((html.match(/<img /g)||[]).length,1);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
test('long content grows the white cell without clipping or a fixed overflowing width',()=>{
 const {html}=renderWelcome({...defaultWelcome('viilife').en,body:'Long message '.repeat(200)+'END-OF-MESSAGE'},'viilife','en','Gerson');
 assert.ok(html.includes('END-OF-MESSAGE'));assert.ok(!html.includes('overflow:hidden'));assert.ok(!html.includes('width="720"'));
});
test('test delivery has a server-owned recipient, independent of logged-in admin',()=>{
 const server=readFileSync(new URL('../src/server/welcome-mail.ts',import.meta.url),'utf8');
 const route=readFileSync(new URL('../src/app/api/comingsoon/[...path]/route.ts',import.meta.url),'utf8');
 assert.ok(server.includes("welcomeTestRecipient='gerson@novaweb-agency.com'"));
 assert.ok(server.includes('smtpSend(welcomeTestRecipient,'));
 assert.ok(!route.includes('sendWelcomeTest(user.email'));
});
