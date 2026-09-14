import type { Metadata } from 'next';
import {Bodoni_Moda,Hanken_Grotesk} from 'next/font/google';
import './globals.css';
import {LanguageProvider} from '@/components/language';
import {getLocale, getT} from '@/server/locale';
const serif=Bodoni_Moda({subsets:['latin'],variable:'--font-editorial',display:'swap'});
const sans=Hanken_Grotesk({subsets:['latin'],variable:'--font-interface',display:'swap'});
export async function generateMetadata():Promise<Metadata>{const t=await getT();return {metadataBase:new URL('https://viicasa.com'),title:{default:t('VIICASA · Algo extraordinario está por comenzar'),template:'%s · VIICASA'},description:t('Descubre ViiLife, ViiConcierge y Shop. Conoce los servicios de VIICASA y recibe novedades de nuestro lanzamiento.')};}
export default async function Layout({children}:{children:React.ReactNode}){const locale=await getLocale(),t=await getT();return <html lang={locale} className={`${serif.variable} ${sans.variable}`}><body><LanguageProvider locale={locale}><a className="skip-link" href="#main">{t('Saltar al contenido')}</a>{children}</LanguageProvider></body></html>}
