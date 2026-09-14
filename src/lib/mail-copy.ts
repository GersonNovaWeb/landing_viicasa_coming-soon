import type {Locale} from './i18n';
export function confirmationMail(locale: Locale, url: string) {
  return locale === 'en' ? {
    subject: 'Confirm your email · VIICASA',
    text: `Confirm that you requested information from VIICASA by opening this link and pressing Confirm:\n\n${url}\n\nThis link expires in 24 hours. If you did not request this, ignore this message. We will not subscribe you without your confirmation.`,
  } : {
    subject: 'Confirma tu correo · VIICASA',
    text: `Confirma que solicitaste información de VIICASA abriendo este enlace y pulsando Confirmar:\n\n${url}\n\nCaduca en 24 horas. Si no lo solicitaste, ignora este mensaje. No te suscribiremos sin tu confirmación.`,
  };
}
