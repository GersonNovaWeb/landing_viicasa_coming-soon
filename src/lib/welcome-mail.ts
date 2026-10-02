import {z} from 'zod';

export const mailServices=['viilife','viiconcierge','shop'] as const;
export type MailService=typeof mailServices[number];
export const mailNames:Record<MailService,string>={viilife:'ViiLife',viiconcierge:'ViiConcierge',shop:'ViiShop'};
// Exactly one mailbox, never a display-name list or injected mail header.
export const welcomeTestRecipientSchema=z.string().regex(/^[^\r\n]*$/).trim().max(254).pipe(z.email()).transform(email=>email.toLowerCase());
const copySchema=z.object({
  subject:z.string().trim().min(1).max(160).regex(/^[^\r\n]+$/),
  body:z.string().trim().min(1).max(3000),
  signature:z.string().trim().max(300),
  footer:z.string().trim().max(500),
}).strict().refine(copy=>Object.values(copy).every(text=>!/[{}]/.test(text.replaceAll('{nombre}','').replaceAll('{servicio}','').replaceAll('{first_name}',''))),{message:'Solo se permiten {nombre}, {first_name} y {servicio}.'});
export const welcomeTemplateSchema=z.object({enabled:z.boolean(),es:copySchema,en:copySchema}).strict();
export type WelcomeTemplate=z.infer<typeof welcomeTemplateSchema>;
export type MailCopy=WelcomeTemplate['es'];
const approvedServiceCopy:Record<MailService,string>={
  shop:"ViiShop is where the lifestyle comes home with you. Every space you live in can be made special. The linens you sleep in, the throw on the sofa, the art on the wall, the kitchenware you cooked with. If you love it, you'll be able to take it home.",
  viilife:"ViiLife brings hotel-standard home care to your front door: the five-star treatment, minus the check-in. Our trained, insured and bonded crews take care of the cleaning, laundry, wash-and-fold, and the small finishing touches that make a home feel looked after. They apply the same exacting standard we hold in our hospitality properties. You set your schedule once and we handle the rest, so your evenings and weekends go back to the people and things you actually enjoy. It's simple, reliable care for busy households that want their home to feel like a retreat every day.",
  viiconcierge:"ViiConcierge is full-service short-term rental management for property owners who want the rewards of hosting without the work. We prepare and style your space, handle licensing and compliance, create and price your listing, welcome every guest, and keep the property spotless and maintained between stays. You keep full ownership of your home and share in the revenue it earns, while we run every part of the operation. Depending on the arrangement you choose, getting started might be easier than you expect. It's a professional, hands-off way to let your property work for you.",
};
export function approvedWelcomeEnglish(service:MailService):MailCopy{
  return {
    subject:`Welcome to ViiCasa — ${mailNames[service]}`,
    body:`Hi {first_name},
Welcome to ViiCasa.com. You're officially on the list, and we're glad you're here.

You told us {servicio} caught your eye, so here's what's coming.

${approvedServiceCopy[service]}

As a waitlist member, you'll be first to shop limited pieces, first to hear about new services and first to hear about early-member pricing when we open the doors.

Are you a maker, supplier or brand? We're always looking for partners whose products belong in beautiful, well-lived spaces. Reply to this email and tell us about what you make.

We'll be in touch soon with your first look.`,
    signature:'Warmly,\nJames Harper\nFounder, VIICasa\nviicasa.com/shop\ninfo@viicasa.com · 1 (866) 623-9889',
    footer:'',
  };
}
export function defaultWelcome(service:MailService):WelcomeTemplate{
  const name=mailNames[service];
  return {enabled:false,
    es:{subject:`Gracias por tu interés en ${name}`,body:`Hola, {nombre}:\n\nGracias por registrar tu interés en {servicio}. Recibimos tus datos y nos alegra que formes parte de este comienzo.\n\nEstamos preparando nuestra propuesta. Este mensaje no confirma una reserva ni genera ningún cobro.`,signature:'Con aprecio,\nEl equipo de VIICASA',footer:'Recibes este mensaje porque registraste tu interés en VIICASA. Si no fuiste tú, ignora este correo o responde para informarnos.'},
    en:approvedWelcomeEnglish(service)};
}
const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export function renderWelcome(copy:MailCopy,service:MailService,locale:'es'|'en',name:string){
  // Plain text only. Replace once so a customer's name cannot inject tokens or markup.
  const firstName=name.trim().split(/\s+/)[0]||'';
  const fill=(text:string)=>text.replace(/\{(nombre|first_name|servicio)\}/g,(_,key)=>key==='nombre'?name:key==='first_name'?firstName:mailNames[service]);
  const subject=fill(copy.subject).replace(/[\r\n]+/g,' ').slice(0,250);
  const body=fill(copy.body),signature=fill(copy.signature),footer=fill(copy.footer);
  const lines=(text:string)=>escape(text).replace(/\n/g,'<br>');
  // Fixed brand frame supplied by VIICASA. Only escaped copy enters the white area.
  // The remote logo remains at the exact user-provided URL; no tracking or attachments.
  const html=`<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:720px; margin:0 auto; padding:0; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif;">
    <tbody>
      <tr>
        <td align="center" style="background-color:#111111; padding:28px 20px 26px 20px; text-align:center;">
          <img src="https://i.postimg.cc/rwSr9Qvj/Imagen-de-Chat-GPT-29-sept-2026-02-25-11-p-m.png" alt="VIICASA" width="145" style="display:block; width:145px; max-width:60%; height:auto; margin:0 auto; padding:0; border:0; outline:none; text-decoration:none;">
          <br>
        </td>
      </tr>
      <tr>
        <td height="260" valign="top" style="height:260px; min-height:260px; background-color:#ffffff; color:#222222; padding:35px 40px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; text-align:left; vertical-align:top; overflow-wrap:anywhere; word-break:break-word;">
          ${lines(body)}
          ${signature?`<div style="margin-top:24px;">${lines(signature)}</div>`:''}
          ${footer?`<div style="margin-top:24px; color:#666666; font-size:12px; line-height:18px;">${lines(footer)}</div>`:''}
        </td>
      </tr>
      <tr>
        <td lang="en" align="center" style="background-color:#111111; padding:28px 20px 5px 20px; color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:21px; text-align:center;">Kelowna, British Columbia, Canada</td>
      </tr>
      <tr>
        <td align="center" style="background-color:#111111; padding:0 20px 20px 20px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:21px; text-align:center;">
          <a href="https://viicasa.com" style="color:#d2a72d; text-decoration:none;">viicasa.com</a>
          <span style="color:#777777; padding:0 12px;">|</span>
          <a href="mailto:contact@viicasa.com" style="color:#d2a72d; text-decoration:none;">contact@viicasa.com</a>
        </td>
      </tr>
      <tr>
        <td align="center" style="background-color:#111111; padding:4px 20px 30px 20px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; text-align:center;">
          <a href="https://www.instagram.com/viiconcierge?stkn=MXUzdnhrZjBrdDY2Zg%3D%3D&amp;utm_source=qr" style="color:#ffffff; text-decoration:none;">Instagram</a>
          <span style="color:#666666; padding:0 10px;">•</span>
          <a href="https://www.facebook.com/profile.php?id=61594619251265&amp;mibextid=wwXIfr&amp;rdid=qku4QPZqftw4Ezff&amp;share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ETHmdB3gS%2F%3Fmibextid%3DwwXIfr" style="color:#ffffff; text-decoration:none;">Facebook</a>
          <span style="color:#666666; padding:0 10px;">•</span>
          <span style="color:#ffffff;">LinkedIn</span>
        </td>
      </tr>
      <tr>
        <td style="background-color:#111111; padding:0 44px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; border-collapse:collapse;">
            <tbody><tr><td style="height:1px; background-color:#333333; font-size:1px; line-height:1px;">&nbsp;</td></tr></tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td lang="en" align="center" style="background-color:#111111; padding:26px 30px 0 30px; color:#777777; font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:16px; text-align:center;">This email may contain confidential or privileged information intended exclusively for the recipient.</td>
      </tr>
      <tr>
        <td lang="en" align="center" style="background-color:#111111; padding:18px 20px 25px 20px; color:#777777; font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:16px; text-align:center;">© 2026 VIICASA. All rights reserved.</td>
      </tr>
    </tbody>
  </table>
</div>
<div><br></div>
</body></html>`;
  const brandText="Kelowna, British Columbia, Canada\nhttps://viicasa.com | contact@viicasa.com\nInstagram: https://www.instagram.com/viiconcierge?stkn=MXUzdnhrZjBrdDY2Zg%3D%3D&utm_source=qr\nFacebook: https://www.facebook.com/profile.php?id=61594619251265&mibextid=wwXIfr&rdid=qku4QPZqftw4Ezff&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ETHmdB3gS%2F%3Fmibextid%3DwwXIfr\nLinkedIn\n\nThis email may contain confidential or privileged information intended exclusively for the recipient.\n© 2026 VIICASA. All rights reserved.";
  return {subject,text:`VIICASA | ${mailNames[service]}\n\n${body}\n\n${signature}\n\n${footer}\n\n${brandText}`,html};
}
