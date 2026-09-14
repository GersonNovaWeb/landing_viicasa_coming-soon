'use client';
import {useLanguage} from '@/components/language';

import{useState}from'react';import{api}from'@/lib/client';
export function AccountPreferences({initial}:{initial:boolean}){const {t} = useLanguage();const[active,setActive]=useState(initial),[error,setError]=useState(''),[busy,setBusy]=useState(false);return <div className="preference-box"><p>{active?t('Estás suscrito a novedades de VIICASA.'):t('No tienes una suscripción activa a novedades.')}</p>{active&&<button className="text-link" disabled={busy} onClick={async()=>{setBusy(true);try{await api('preferences',undefined,'DELETE');setActive(false);}catch(e){setError(e instanceof Error?e.message:t('No se pudo guardar.'));}finally{setBusy(false);}}}>{t("Dejar de recibir novedades")}</button>}{error&&<p className="error-message" role="alert">{t(error)}</p>}</div>}
