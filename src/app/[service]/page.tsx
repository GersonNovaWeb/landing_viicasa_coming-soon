import {getT} from '@/server/locale';
import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';
import {services} from '@/lib/content';
import {Header,Footer} from '@/components/shell';
import {InterestForm} from '@/components/interest-form';
export function generateStaticParams(){return services.map(s=>({service:s.slug}));}
export async function generateMetadata({params}:{params:Promise<{service:string}>}):Promise<Metadata>{const t=await getT();const{service}=await params;const current=services.find(s=>s.slug===service);return{title:current?.name||t('No encontrado'),description:current?t(current.short):undefined};}
export default async function ServicePage({params}:{params:Promise<{service:string}>}){const t = await getT();const{service}=await params,s=services.find(s=>s.slug===service);if(!s)notFound();return <><Header/><main id="main"><section className="service-hero container"><div><Link className="back-link" href="/"><ArrowLeft size={16}/> {t(" Volver a VIICASA")}</Link><p className="eyebrow">{s.name} {t(" · PRÓXIMAMENTE")}</p><h1>{t(s.intro)}</h1><p>{t(s.description)}</p><a href="#registro" className="button">{s.slug==='shop'?t('Avisarme del lanzamiento'):t('Me interesa este servicio')}<ArrowUpRight size={18}/></a></div><div className="service-hero-image"><Image src={s.image} alt={t(s.imageAlt)} fill priority sizes="(max-width: 760px) 90vw, 50vw"/></div></section><section className="service-details container"><p className="eyebrow">{s.slug==='shop'?t('UN PRIMER VISTAZO'):t('PENSADO PARA TU HOGAR')}</p><div>{s.items.map(([title,description],i)=><article key={t(title)}><span className="eyebrow">0{i+1}</span><h2>{t(title)}</h2><p>{t(description)}</p></article>)}</div></section><section className="service-registration container" id="registro"><InterestForm service={s.slug}/></section></main><Footer/></>}
