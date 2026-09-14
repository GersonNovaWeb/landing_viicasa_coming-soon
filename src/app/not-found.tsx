import {LanguageSelector} from '@/components/language';
import {getT} from '@/server/locale';
import Link from'next/link';export default async function NotFound(){const t = await getT();return <main id="main" className="account-page container"><section className="account-card"><LanguageSelector/><p className="eyebrow">VIICASA · 404</p><h1>{t("Este espacio aún no existe.")}</h1><Link className="button" href="/">{t("Volver al inicio")}</Link></section></main>}
