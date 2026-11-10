import {mailNames,renderBrandedMail,type MailService} from './welcome-mail.ts';

// Internal recipient is fixed on the server; public form fields cannot replace it.
export const waitlistNotificationRecipient='accounts@viicasa.com';
export function renderWaitlistNotification(data:{name:string;email:string;locale:'en'|'es';city?:string;source:string},services:MailService[],createdAt:string,adminUrl:string){
  if(!services.length)throw Error('A waitlist notification requires a new service.');
  return renderBrandedMail({
    subject:'New waitlist registration · VIICASA',
    body:`A visitor has joined the VIICASA Coming Soon waitlist.\n\nName: ${data.name}\nEmail: ${data.email}\nNew interests: ${services.map(service=>mailNames[service]).join(', ')}\nPreferred language: ${data.locale==='es'?'Spanish':'English'}\nCity: ${data.city||'Not provided'}\nRegistration page: ${data.source==='home'?'Vii home':mailNames[data.source as MailService]}\nRegistered at (UTC): ${createdAt}\n\nReview the registration in your administrator dashboard:\n${adminUrl}`,
    signature:'VIICASA · Coming Soon',
    footer:'Internal notification. A waitlist registration is an expression of interest, not a purchase or reservation. Keep the visitor’s contact details private.',
  },services[0],'en');
}
