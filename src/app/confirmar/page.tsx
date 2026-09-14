import {getT} from '@/server/locale';
import{Header,Footer}from'@/components/shell';import{Confirmation}from'@/components/confirmation';
export async function generateMetadata(){const t=await getT();return {title:t('Confirma tu correo'),robots:{index:false,follow:false},referrer:'no-referrer' as const};}
export default function Page(){return <><Header/><main id="main" className="account-page container"><Confirmation/></main><Footer/></>}
