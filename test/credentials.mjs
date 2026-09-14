import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {credentialFromJson} from '../src/server/credentials.ts';

const {privateKey} = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
  publicKeyEncoding: {type: 'spki', format: 'pem'},
});
const fixture = {type: 'service_account', project_id: 'demo-hosting',
  client_email: 'test@demo-hosting.iam.gserviceaccount.com', private_key: privateKey};

test('missing/blank hosting secret preserves local credential fallback', () => {
  for (const value of [undefined, '', '  ']) assert.equal(credentialFromJson(value, 'demo-hosting'), undefined);
});
test('accepts valid service-account JSON without requesting a token', () => {
  assert.equal(typeof credentialFromJson(JSON.stringify(fixture), 'demo-hosting').getAccessToken, 'function');
});
test('accepts formatted JSON pasted from a file', () => {
  assert.ok(credentialFromJson(JSON.stringify(fixture, null, 2), 'demo-hosting'));
});
test('rejects another project and unsupported credential type', () => {
  assert.throws(() => credentialFromJson(JSON.stringify(fixture), 'another-project'));
  assert.throws(() => credentialFromJson(JSON.stringify({...fixture, type: 'authorized_user'}), 'demo-hosting'));
});
test('rejects incomplete and malformed credentials without revealing input', () => {
  for (const raw of ['SECRET_INVALID_JSON', 'null', '[]', '{}', JSON.stringify({...fixture, private_key: 'SECRET_BAD_KEY'})]) {
    assert.throws(() => credentialFromJson(raw, 'demo-hosting'), error => {
      assert.equal(error.message, 'Credencial del servidor inválida. Revisa FIREBASE_SERVICE_ACCOUNT_JSON y el proyecto.');
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
