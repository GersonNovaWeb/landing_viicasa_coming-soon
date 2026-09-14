import 'server-only';
import {cert, type Credential} from 'firebase-admin/app';

// Server-only secret, supplied at runtime by the hosting provider.
export function credentialFromJson(raw: string | undefined, projectId: string): Credential | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const value = JSON.parse(raw);
    if (!value || value.type !== 'service_account' || value.project_id !== projectId ||
        typeof value.client_email !== 'string' || !value.client_email.includes('@') ||
        typeof value.private_key !== 'string') throw new Error();
    return cert({
      projectId: value.project_id,
      clientEmail: value.client_email,
      privateKey: value.private_key,
    });
  } catch {
    // JSON/parser/SDK errors can contain input. Never forward those details.
    throw new Error('Credencial del servidor inválida. Revisa FIREBASE_SERVICE_ACCOUNT_JSON y el proyecto.');
  }
}
