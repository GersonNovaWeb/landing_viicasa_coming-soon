import 'server-only';
import {cookies} from 'next/headers';
import {localeCookie, normalizeLocale, translator} from '../lib/i18n';
export async function getLocale() { return normalizeLocale((await cookies()).get(localeCookie)?.value); }
export async function getT() { return translator(await getLocale()); }
