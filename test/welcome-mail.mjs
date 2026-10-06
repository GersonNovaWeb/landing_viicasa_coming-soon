import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultWelcome,approvedWelcomeEnglish,renderWelcome,mailServices,mailNames,welcomeTestRecipientSchema,welcomeTemplateSchema} from '../src/lib/welcome-mail.ts';

for(const service of mailServices)test(`James Harper copy is editable, valid and specific to ${service}`,()=>{
 const template=defaultWelcome(service),copy=approvedWelcomeEnglish(service);
 assert.equal(template.enabled,false);assert.deepEqual(template.en,copy);
 assert.equal(welcomeTemplateSchema.safeParse(template).success,true);
 const rendered=renderWelcome(copy,service,'en','  James   Harper  ');
 assert.ok(rendered.text.includes('Hi James,'));assert.ok(!rendered.text.includes('Hi James Harper'));
 assert.ok(rendered.text.includes(`You told us ${mailNames[service]} caught your eye`));
 const descriptions={shop:'ViiShop is where the lifestyle',viilife:'ViiLife brings hotel-standard',viiconcierge:'ViiConcierge is full-service'};
 for(const other of mailServices)assert.equal(rendered.text.includes(descriptions[other]),other===service);
 for(const text of ["You're officially on the list",'Are you a maker, supplier or brand?',"We'll be in touch soon with your first look.",'Warmly,\nJames Harper\nFounder, VIICasa','info@viicasa.com · 1 (866) 623-9889'])assert.ok(rendered.text.includes(text));
 assert.ok(!/[{}]/.test(rendered.text));assert.equal(copy.footer,'');
 const edited={...template,en:{...copy,body:'Hello {first_name}, this is an edited message for {servicio}.'}};
 assert.equal(welcomeTemplateSchema.safeParse(edited).success,true);
 assert.ok(renderWelcome(edited.en,service,'en','Mary Smith').text.includes('Hello Mary, this is an edited message'));
 assert.equal(defaultWelcome(service).en.body,copy.body);
});
test('first-name variable is escaped and does not recursively expand customer tokens',()=>{
 const copy={...approvedWelcomeEnglish('shop'),body:'Hi {first_name}; full name: {nombre}; {servicio}'};
 const rendered=renderWelcome(copy,'shop','en','<script> Doe');
 assert.ok(rendered.html.includes('Hi &lt;script&gt;'));assert.ok(!rendered.html.includes('<script>'));
 assert.ok(renderWelcome(copy,'shop','en','{servicio} Doe').text.includes('Hi {servicio}; full name: {servicio} Doe; ViiShop'));
});

for(const service of mailServices)for(const locale of ['es','en']){
 test(`approved HTML frame is preserved for ${service}/${locale}`,()=>{
  const copy={...defaultWelcome(service)[locale],body:'Hello {nombre}, welcome to {servicio}.',signature:'Team signature',footer:'Closing note'};
  const {html,text,subject}=renderWelcome(copy,service,locale,'Gerson');
  assert.ok(html.includes('max-width:720px'));
  assert.ok(html.includes('src="https://viicasa.com/images/logo-email.png"'));
  assert.ok(!html.includes('postimg.cc'));
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
test('email logo is included as a public PNG in the deployment',()=>{
 const png=readFileSync(new URL('../public/images/logo-email.png',import.meta.url));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(png.length>0&&png.length<300000);
});

test('untrusted content cannot alter the fixed HTML or add images/scripts',()=>{
 const injected='<img src=x onerror=alert(1)><script>alert(1)</script>';
 const {html}=renderWelcome({subject:'Hello {nombre}',body:injected,signature:injected,footer:injected},'shop','en',injected);
 assert.equal((html.match(/<img /g)||[]).length,1);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
test('long content grows the white cell without clipping or a fixed overflowing width',()=>{
 const {html}=renderWelcome({...defaultWelcome('viilife').en,body:'Long message '.repeat(200)+'END-OF-MESSAGE'},'viilife','en','Gerson');
 assert.ok(html.includes('END-OF-MESSAGE'));assert.ok(!html.includes('overflow:hidden'));assert.ok(!html.includes('width="720"'));
});
test('test recipient can be a different single mailbox and is normalized',()=>{
 assert.equal(welcomeTestRecipientSchema.parse('  Another+Test@Example.com  '),'another+test@example.com');
 assert.equal(welcomeTestRecipientSchema.parse('gerson@novaweb-agency.com'),'gerson@novaweb-agency.com');
});
test('test recipient rejects missing, multiple, malformed or header-injected addresses',()=>{
 for(const value of [undefined,null,[],['one@example.com'],'','invalid','one@example.com,two@example.com','one@example.com;two@example.com','Name <one@example.com>','one@example.com\r\nBcc: two@example.com','one@example.com\n','a'.repeat(255)+'@example.com']){
  assert.equal(welcomeTestRecipientSchema.safeParse(value).success,false,JSON.stringify(value));
 }
});
