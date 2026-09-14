import {getT} from '@/server/locale';
import {cookies} from 'next/headers';
import Link from 'next/link';
import {Header,Footer} from '@/components/shell';
import {LoginPanel,LogoutButton} from '@/components/login-panel';
import {AccountPreferences} from '@/components/preferences';
import {cookieName,identity,digest} from '@/server/security';
import {firebase} from '@/server/firebase';
export const dynamic='force-dynamic';
export async function generateMetadata(){const t=await getT();return {title:t('Mi cuenta'),robots:{index:false,follow:false}};}
export default async function Account(){const t = await getT();let user=null;try{user=await identity((await cookies()).get(cookieName)?.value);}catch{}
let marketing=false,failed=false;if(user){try{marketing=(await firebase().db.collection('cs_contacts').doc(digest(user.email)).get()).data()?.marketing===true;}catch{failed=true;}}
return <><Header/><main id="main" className="account-page container">{user?<section className="account-card"><p className="eyebrow">{t("MI CUENTA")}</p><h1>{t("Hola, ")}{user.name}.</h1><p>{user.email}</p><p>{t("Crear tu cuenta no te suscribe automáticamente a novedades.")}</p>{failed?<p role="alert">{t("No se pudieron cargar tus preferencias.")}</p>:<AccountPreferences initial={marketing}/>}<Link className="button" href="/#registro">{t("Elegir mis intereses")}</Link>{user.admin&&<Link className="button outline-button" href="/admin">{t("Abrir dashboard")}</Link>}<LogoutButton/></section>:<LoginPanel/>}</main><Footer/></>}
