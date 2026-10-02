'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/client';
import {useLanguage} from './language';
import {mailServices,mailNames,renderWelcome,approvedWelcomeEnglish,welcomeTestRecipientSchema,type MailService,type WelcomeTemplate,type MailCopy} from '@/lib/welcome-mail';

type Settings={templates:Record<MailService,{template:WelcomeTemplate;revision:number}>;smtp:{ready:boolean;dailyLimit:number};testRecipient:string};
type Log={id:string;email:string;service:MailService;locale:string;state:string;created_at:string};
export function MailEditor({onDirtyChange}:{onDirtyChange:(dirty:boolean)=>void}){
  const{locale,t}=useLanguage();const tr=(es:string,en:string)=>locale==='en'?en:es;
  const[settings,setSettings]=useState<Settings|null>(null),[service,setService]=useState<MailService>('viilife'),[language,setLanguage]=useState<'es'|'en'>('en');
  const[draft,setDraft]=useState<WelcomeTemplate|null>(null),[logs,setLogs]=useState<Log[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const[testRecipient,setTestRecipient]=useState('');
  const dirty=!!(settings&&draft&&JSON.stringify(draft)!==JSON.stringify(settings.templates[service].template));
  useEffect(()=>{onDirtyChange(dirty);return()=>onDirtyChange(false);},[dirty,onDirtyChange]);
  useEffect(()=>{let active=true;Promise.all([api<Settings>('admin/mail'),api<{rows:Log[]}>('admin/mail/log')]).then(([s,l])=>{if(active){setSettings(s);setDraft(s.templates.viilife.template);setLogs(l.rows);setTestRecipient(s.testRecipient);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
  function changeService(next:MailService){if(!settings||busy)return;if(dirty&&!window.confirm(tr('¿Descartar los cambios sin guardar?','Discard unsaved changes?')))return;setService(next);setDraft(settings.templates[next].template);setNotice('');setError('');}
  function loadApprovedMessage(){
    if(!draft||busy)return;
    if(!window.confirm(tr('¿Reemplazar el borrador en inglés de este servicio por el mensaje de James Harper? Podrás editarlo antes de guardar.','Replace this service’s English draft with James Harper’s message? You can edit it before saving.')))return;
    setDraft({...draft,en:approvedWelcomeEnglish(service)});setLanguage('en');setError('');
    setNotice(tr('Mensaje cargado en inglés. Revisa la vista previa y guarda los cambios para aplicarlo.','English message loaded. Review the preview and save changes to apply it.'));
  }
  async function action(kind:'save'|'test'){
    if(!draft||!settings)return;setBusy(true);setError('');setNotice('');
    try{
      if(kind==='save'){
        const result=await api<{revision:number}>(`admin/mail/${service}`,{template:draft,revision:settings.templates[service].revision},'PATCH');
        setSettings({...settings,templates:{...settings.templates,[service]:{template:draft,revision:result.revision}}});
        setNotice(tr('Guardado. Se aplicará a los próximos registros; no envía correos a registros anteriores.','Saved. Applies to future registrations; no email is sent to earlier contacts.'));
      }else{
        const parsed=welcomeTestRecipientSchema.safeParse(testRecipient);
        if(!parsed.success){setError(tr('Escribe un solo correo válido para la prueba.','Enter one valid email address for the test.'));return;}
        const result=await api<{recipient:string}>('admin/mail/test',{service,locale:language,template:draft,recipient:parsed.data});
        setTestRecipient(result.recipient);
        setNotice(tr(`SMTP aceptó la prueba para ${result.recipient}. Revisa la bandeja y spam; no se modificó la plantilla guardada.`,`SMTP accepted the test for ${result.recipient}. Check the inbox and spam; the saved template was not changed.`));
      }
    }catch(e){setError(e instanceof Error?e.message:'Error');}finally{setBusy(false);}
  }
  async function refresh(){setBusy(true);setError('');try{const data=await api<{rows:Log[]}>('admin/mail/log');setLogs(data.rows);}catch(e){setError(e instanceof Error?e.message:'Error');}finally{setBusy(false);}}
  async function process(id:string){
    if(!window.confirm(tr('¿Intentar enviar este correo pendiente con el mensaje guardado al registrarse?','Send this pending email using the message saved at registration?')))return;
    setBusy(true);setError('');setNotice('');
    try{const r=await api<{state:string}>('admin/mail/process',{id});setNotice(tr('Resultado del intento: ','Attempt result: ')+stateLabel(r.state));setLogs((await api<{rows:Log[]}>('admin/mail/log')).rows);}catch(e){setError(e instanceof Error?e.message:'Error');}finally{setBusy(false);}
  }
  const stateLabel=(state:string)=>({pending:tr('Pendiente','Pending'),sent:tr('Aceptado por SMTP','Accepted by SMTP'),sending:tr('En proceso: revisar si persiste','Processing: review if it persists'),unknown:tr('Resultado incierto: revisar proveedor','Uncertain outcome: check provider'),skipped:tr('Omitido','Skipped'),unconfigured:tr('SMTP sin configurar','SMTP not configured'),not_claimed:tr('No enviado: revisar estado y límite','Not sent: check status and limit')}[state]||state);
  if(!settings||!draft)return <div className="dashboard-panel"><p role={error?'alert':'status'}>{error||tr('Cargando plantillas…','Loading templates…')}</p><button className="text-link" onClick={()=>window.location.reload()}>{tr('Recargar','Reload')}</button></div>;
  const copy=draft[language],preview=renderWelcome(copy,service,language,language==='es'?'María':'Mary');
  const edit=(field:keyof MailCopy,value:string)=>setDraft({...draft,[language]:{...copy,[field]:value}});
  return <div className="mail-admin">
    <p className="notice">{settings.smtp.ready?tr('SMTP configurado. Falta comprobar la recepción mediante un envío de prueba.','SMTP configured. Confirm delivery with a test email.'):tr('SMTP aún no está listo. Puedes guardar mensajes; los registros siguen funcionando. En local no se envían correos reales.','SMTP is not ready yet. You can save messages; registrations still work. Local mode never sends real email.')} {tr('Límite interno por 24 horas: ','Internal limit per 24 hours: ')}{settings.smtp.dailyLimit}.</p>
    <p>{tr('Una bienvenida por correo y servicio. Si seleccionan varios servicios, recibirán un mensaje por cada uno habilitado. Solo se acusa recibo del registro; las campañas promocionales no están incluidas.','One welcome per email and service. Multiple interests receive one message per enabled service. These emails acknowledge registration; promotional campaigns are not included.')}</p>
    <div className="mail-service-tabs" aria-label={tr('Servicio del correo','Email service')}>{mailServices.map(s=><button type="button" key={s} aria-pressed={s===service} disabled={busy} className={`button ${s===service?'':'outline-button'}`} onClick={()=>changeService(s)}>{mailNames[s]}</button>)}</div>
    <div className="mail-editor-grid"><section className="dashboard-panel">
      <h2>{mailNames[service]}</h2>
      <form className="interest-form" onSubmit={e=>{e.preventDefault();void action('save');}}>
        <fieldset disabled={busy} className="mail-fields">
          <label className="check-label"><input type="checkbox" checked={draft.enabled} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/><span>{tr('Activar bienvenida automática para este servicio','Enable automatic welcome for this service')}</span></label>
          <label>{tr('Idioma del mensaje','Message language')}<select value={language} onChange={e=>setLanguage(e.target.value as 'es'|'en')}><option value="en">English</option><option value="es">Español</option></select></label>
          <p className="form-note">{tr('Edita las dos versiones. Se usa el idioma del formulario. Variables: {first_name} (primer nombre), {nombre} (nombre completo) y {servicio}. Texto plano, sin HTML.','Edit both versions. The form language determines the email language. Variables: {first_name} (first name), {nombre} (full name) and {servicio}. Plain text, no HTML.')}</p>
          <div><button type="button" className="text-link" onClick={loadApprovedMessage}>{tr('Cargar mensaje de James Harper (inglés)','Load James Harper’s message (English)')}</button><p className="form-note">{tr('Carga el texto aprobado para este servicio. No modifica la versión en español ni activa envíos.','Loads the approved copy for this service. Does not change the Spanish version or enable sending.')}</p></div>
          <label>{tr('Asunto','Subject')}<input value={copy.subject} maxLength={160} required onChange={e=>edit('subject',e.target.value)}/></label>
          <label>{tr('Mensaje de bienvenida','Welcome message')}<textarea value={copy.body} maxLength={3000} required rows={9} onChange={e=>edit('body',e.target.value)}/></label>
          <label>{tr('Firma','Signature')}<textarea value={copy.signature} maxLength={300} rows={3} onChange={e=>edit('signature',e.target.value)}/></label>
          <label>{tr('Nota final del mensaje','Message closing note')}<textarea value={copy.footer} maxLength={500} rows={3} onChange={e=>edit('footer',e.target.value)}/></label>
          <p className="form-note">{tr('La firma y la nota se muestran en el espacio blanco. El encabezado y el pie negro permanecen fijos, con sus textos en inglés.','The signature and note appear in the white area. The header and black footer remain fixed, with their text in English.')}</p>
        </fieldset>
        <div className="mail-buttons"><button className="button" disabled={busy||!dirty}>{busy?tr('Procesando…','Working…'):tr('Guardar cambios','Save changes')}</button></div>
        {dirty&&<p className="form-note">{tr('Tienes cambios sin guardar.','You have unsaved changes.')}</p>}
      </form>
      <form className="interest-form mail-test" onSubmit={e=>{e.preventDefault();void action('test');}}>
        <h3>{tr('Correo de prueba','Test email')}</h3>
        <label>{tr('Enviar prueba a','Send test to')}<input type="email" name="testRecipient" value={testRecipient} onChange={e=>{setTestRecipient(e.target.value);setNotice('');}} required maxLength={254} autoComplete="email" spellCheck={false} disabled={busy} aria-describedby="mail-test-note"/></label>
        <p id="mail-test-note" className="form-note">{tr('Escribe un solo correo. Se enviará el borrador del servicio e idioma seleccionados, sin guardar ni activar la plantilla. Este destinatario solo se usa para la prueba; no cambia los correos de los clientes.','Enter one email address. Sends the draft for the selected service and language without saving or enabling the template. This recipient is only used for the test; customer emails are not changed.')}</p>
        <div className="mail-buttons"><button className="button outline-button" disabled={busy||!settings.smtp.ready}>{busy?tr('Procesando…','Working…'):tr('Enviar prueba','Send test')}</button></div>
      </form>
      {error&&<p role="alert" className="error-message">{t(error)} <button type="button" className="text-link" onClick={()=>{if(!dirty||window.confirm(tr('¿Descartar los cambios sin guardar?','Discard unsaved changes?')))window.location.reload();}}>{tr('Recargar','Reload')}</button></p>}{notice&&<p role="status" className="notice">{notice}</p>}
    </section><section className="dashboard-panel mail-preview"><h2>{tr('Vista previa','Preview')}</h2><p><strong>{preview.subject}</strong></p><iframe title={tr('Vista previa del correo','Email preview')} sandbox="" referrerPolicy="no-referrer" srcDoc={preview.html}/><p className="form-note">{tr('El encabezado de VIICASA permanece fijo. La apariencia puede variar según la aplicación de correo.','The VIICASA header stays fixed. Appearance may vary by email application.')}</p></section></div>
    <section className="dashboard-panel"><div className="detail-heading"><h2>{tr('Últimos 30 correos','Latest 30 emails')}</h2><button className="text-link" disabled={busy} onClick={()=>void refresh()}>{tr('Actualizar','Refresh')}</button></div>
      <p className="form-note">{tr('Aceptar SMTP no garantiza recepción. Si un envío tiene resultado incierto, revisa el proveedor antes de repetirlo; no lo reenviamos automáticamente. Los pendientes conservan el mensaje original.','SMTP acceptance does not guarantee delivery. Check the provider for uncertain outcomes; these are not automatically resent. Pending messages retain their original content.')}</p>
      <div className="table-scroll"><table><thead><tr><th>{tr('Correo','Email')}</th><th>{tr('Servicio','Service')}</th><th>{tr('Fecha','Date')}</th><th>{tr('Estado','Status')}</th><th>{tr('Acción','Action')}</th></tr></thead><tbody>{logs.map(log=><tr key={log.id}><td>{log.email}</td><td>{mailNames[log.service]} · {log.locale.toUpperCase()}</td><td>{new Date(log.created_at).toLocaleString(locale==='en'?'en-US':'es-MX')}</td><td>{stateLabel(log.state)}</td><td>{log.state==='pending'&&<button className="text-link" disabled={busy||!settings.smtp.ready} onClick={()=>void process(log.id)}>{tr('Procesar pendiente','Process pending')}</button>}</td></tr>)}</tbody></table>{!logs.length&&<p>{tr('Todavía no hay correos registrados.','No email activity yet.')}</p>}</div>
    </section>
  </div>;
}
