import {getT} from '@/server/locale';
import {cookies} from 'next/headers';
import {cookieName,identity} from '@/server/security';
import {LoginPanel} from '@/components/login-panel';
import {Dashboard} from '@/components/dashboard';
export const dynamic='force-dynamic';
export async function generateMetadata(){const t=await getT();return {title:t('Administración'),robots:{index:false,follow:false}};}
export default async function Admin(){let user=null,message='';try{user=await identity((await cookies()).get(cookieName)?.value,true);}catch(e){if(e instanceof Error&&!e.message.includes('Inicia sesión'))message=e.message;}
return <main id="main">{user?<Dashboard user={user}/>:<div className="admin-login"><LoginPanel admin message={message}/></div>}</main>}
