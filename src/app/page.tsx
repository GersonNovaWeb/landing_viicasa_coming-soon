import {getT} from '@/server/locale';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight,ArrowDown} from 'lucide-react';
import {Header,Footer} from '@/components/shell';
import {InterestForm} from '@/components/interest-form';
import {services,heroImage} from '@/lib/content';
export default async function Home(){const t = await getT();return <><Header/><main id="main">
  <section className="hero">
    <Image src={heroImage} alt={t("Residencia abierta al paisaje con materiales naturales y luz de atardecer")} fill priority sizes="100vw" className="hero-image"/>
    <div className="hero-shade"/><div className="hero-copy container">
      <p className="eyebrow light">{t("UNA NUEVA FORMA DE HABITAR · PRÓXIMAMENTE")}</p>
      <h1>{t("Algo extraordinario")}<br/>{t("está por ")}<em>{t("comenzar.")}</em></h1>
      <p>{t("El cuidado de tu hogar, los detalles que lo hacen único y una nueva manera de vivirlo. Bienvenido a VIICASA.")}</p>
      <a className="button light-button" href="#registro">{t("Quiero ser parte ")}<ArrowUpRight size={18}/></a>
    </div><a className="hero-scroll" href="#universo" aria-label={t("Descubrir los servicios")}><ArrowDown size={18}/></a>
  </section>
  <section className="waitlist-wrap container" id="registro"><InterestForm/></section>
  <section className="services-section container" id="universo">
    <div className="section-heading"><p className="eyebrow">{t("EL UNIVERSO VIICASA")}</p><h2>{t("Todo empieza")}<br/>{t("con sentirte ")}<em>{t("en casa.")}</em></h2><p>{t("Tres maneras de cuidar, transformar y disfrutar tus espacios.")}</p></div>
    <div className="service-grid">{services.map((s,i)=><Link href={`/${s.slug}`} key={s.slug} className={`service-card service-${i}`}>
      <Image src={s.image} alt={t(s.imageAlt)} fill sizes={i===2?'90vw':'(max-width: 760px) 90vw, 60vw'}/><div className="card-shade"/>
      <div className="service-card-copy"><span className="eyebrow light">0{i+1} / {s.name}</span><h3>{t(s.cardTitle)}</h3><p>{t(s.short)}</p><span className="card-link">{t("Descubrir ")}{s.name}<ArrowUpRight size={20}/></span></div>
    </Link>)}</div>
  </section>
  <section className="closing container"><p className="eyebrow">{t("LOS BUENOS COMIENZOS SE COMPARTEN")}</p><h2>{t("Tu próximo capítulo,")}<br/><em>{t("con VIICASA.")}</em></h2><a className="text-link" href="#registro">{t("Recibir novedades del lanzamiento ")}<ArrowUpRight size={18}/></a></section>
</main><Footer/></>}
