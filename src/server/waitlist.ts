import 'server-only';
import type {Transaction} from 'firebase-admin/firestore';
import type {Registration} from './leads.ts';
import {firebase,configuration} from './firebase.ts';
import {digest,timestamp} from './security.ts';
import {renderWaitlistNotification,waitlistNotificationRecipient} from '../lib/waitlist-mail.ts';

// Consent and the internal notification are reserved atomically with the contact.
// Repeated or concurrent form submissions cannot duplicate a service membership.
export async function planWaitlist(tx:Transaction,data:Registration,privacyVersion:string){
  if(data.kind!=='waitlist')return {hasNew:false,write:()=>[] as string[]};
  const {db}=firebase();
  const rows=await Promise.all(data.interests.map(async service=>{
    const ref=db.collection('cs_waitlist').doc(digest(`${data.email}:${service}`));
    return {ref,service,exists:(await tx.get(ref)).exists};
  }));
  const services=rows.filter(row=>!row.exists).map(row=>row.service).sort();
  const id=digest(`waitlist-notification:${data.email}:${services.join(',')}`);
  const notice=services.length?db.collection('cs_mail_outbox').doc(id):null;
  const exists=notice?(await tx.get(notice)).exists:false;
  return {hasNew:services.length>0,write(){
    const created=timestamp();
    for(const {ref,service,exists} of rows)if(!exists)tx.create(ref,{name:data.name,email:data.email,locale:data.locale,service,interests:[service],source:data.source,status:'new',notes:'',marketing:true,privacy_version:privacyVersion,created_at:created,updated_at:created});
    if(!notice||exists)return [];
    tx.create(notice,{type:'waitlist_notification',contact_id:digest(data.email),email:waitlistNotificationRecipient,subscriber_email:data.email,services,service:services[0],locale:'en',kind:'waitlist',
      mail:renderWaitlistNotification(data,services,created,`${configuration().origin}/admin`),state:'pending',reason:'',created_at:created,updated_at:created});
    return [id];
  }};
}
