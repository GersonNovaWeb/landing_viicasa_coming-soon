import {test} from 'node:test';
import assert from 'node:assert/strict';
import {english, translator, normalizeLocale} from '../src/lib/i18n.ts';
import {services} from '../src/lib/content.ts';
import {confirmationMail} from '../src/lib/mail-copy.ts';

test('only es/en preferences are accepted; English is the default', () => {
  for(const value of [undefined,'','fr','EN','<script>']) assert.equal(normalizeLocale(value),'en');
  assert.equal(normalizeLocale('en'),'en');
  assert.equal(normalizeLocale('es'),'es');
});
test('all public service descriptions have English translations', () => {
  for(const service of services) for(const text of [service.cardTitle,service.short,service.imageAlt,service.intro,service.description,...service.items.flat()]) assert.ok(english[text],text);
});
test('translations preserve spacing, brand names and unrecognized user text', () => {
  assert.equal(translator('en')(' Volver al inicio '),' Back to home ');
  assert.equal(translator('es')('Nombre completo'),'Nombre completo');
  assert.equal(translator('en')('ViiLife'),'ViiLife');
  assert.equal(translator('en')('My personal note 123'),'My personal note 123');
});
test('confirmation email copy uses the submitted language without altering the link', () => {
  const url='https://example.com/confirmar#synthetic-token';
  for(const locale of ['es','en']) assert.ok(confirmationMail(locale,url).text.includes(url));
  assert.equal(confirmationMail('en',url).subject,'Confirm your email · VIICASA');
  assert.equal(confirmationMail('es',url).subject,'Confirma tu correo · VIICASA');
});
// HTTP checks only: no authentication, customer records or production writes.
const base=process.env.I18N_TEST_BASE||'http://127.0.0.1:3010';
for(const [path,es,en] of [
  ['/','Algo extraordinario','Something extraordinary'],
  ['/viilife','Menos pendientes en casa.','Less to do at home.'],
  ['/viiconcierge','La primera impresión','First impressions'],
  ['/shop','Objetos que se vuelven','Objects that become'],
  ['/admin','Administración','Administration'],
  ['/cuenta','Bienvenido a casa.','Welcome home.'],
  ['/privacidad','Información sobre tus datos','Information about your data'],
  ['/confirmar','Confirma tu correo.','Confirm your email.'],
]) test(`${path} renders Spanish and English on the server`, async () => {
  for(const [locale,expected] of [['es',es],['en',en]]) {
    const response=await fetch(base+path,{headers:{cookie:`viicasa_language=${locale}`},signal:AbortSignal.timeout(30000)});
    assert.equal(response.status,200);
    const html=await response.text();
    assert.ok(html.includes(`lang="${locale}"`),`html language: ${path}`);
    const rendered=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
    assert.ok(rendered.includes(expected),`${path}: ${expected}`);
    assert.ok(rendered.includes(locale==='en'?'Language':'Idioma'),'Language selector');
  }
});
test('an unsupported cookie safely renders English',async()=>{
  const r=await fetch(base,{headers:{cookie:'viicasa_language=fr'}});
  assert.ok((await r.text()).includes('lang="en"'));
});
test('a first visit without a language cookie renders English',async()=>{
  const r=await fetch(base);
  const html=(await r.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  assert.ok(html.includes('lang="en"'));
  assert.ok(html.includes('Something extraordinary'));
});
