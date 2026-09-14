'use client';
import {createContext, useContext, useEffect, useMemo, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Globe2} from 'lucide-react';
import {localeCookie, normalizeLocale, translator, type Locale} from '@/lib/i18n';

const LanguageContext = createContext<Locale>('es');
export function LanguageProvider({locale, children}: {locale: Locale; children: React.ReactNode}) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const locale = useContext(LanguageContext);
  const t = useMemo(() => translator(locale), [locale]);
  return {locale, t};
}
export function LanguageSelector() {
  const {locale, t} = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <label className="language-selector"><Globe2 size={16} aria-hidden="true"/><span className="sr-only">{t('Idioma')}</span>
    <select aria-label={t('Idioma')} value={locale} disabled={pending} onChange={event => {
      const next = normalizeLocale(event.target.value);
      document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      startTransition(() => router.refresh());
    }}><option value="es" lang="es">Español</option><option value="en" lang="en">English</option></select>
  </label>;
}
