'use client';
export type User={uid:string;name:string;email:string;admin:boolean};
export type Availability={auth:boolean;google:boolean;email:boolean;mode:string};
export async function api<T>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T>{
  const response=await fetch(`/api/comingsoon/${path}`,{method,credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'No pudimos completar la operación.');return data;
}
export async function googleLogin(){
  const mode=process.env.NEXT_PUBLIC_FIREBASE_MODE||'disabled';
  if(mode==='disabled')throw new Error('El acceso con Google está pendiente de activación.');
  const[{initializeApp,getApps},{getAuth,GoogleAuthProvider,signInWithPopup,setPersistence,inMemoryPersistence,signOut,connectAuthEmulator}]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
  const projectId=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||'viicasa';
  if(mode==='emulator'&&(!projectId.startsWith('demo-')||!['127.0.0.1','localhost'].includes(window.location.hostname)))throw new Error('El emulador solo puede usarse localmente.');
  if(mode==='live'&&projectId.startsWith('demo-'))throw new Error('Configuración de acceso inválida.');
  const name=`comingsoon-web-${mode}`,existing=getApps().find(a=>a.name===name);
  const app=existing||initializeApp({apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||'AIzaSyDBDhdmpSlfUAeGYZ8UPKkE2A3S70dvEY8',authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||'viicasa.firebaseapp.com',projectId,appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||'1:159084480889:web:f193adc5bcde06897fc7a8'},name);
  const emulatorUrl=process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL||'http://127.0.0.1:9096';
  if(mode==='emulator'&&!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(emulatorUrl))throw new Error('El emulador debe ser local.');
  const auth=getAuth(app);if(mode==='emulator'&&!existing)connectAuthEmulator(auth,emulatorUrl,{disableWarnings:true});
  auth.languageCode=document.documentElement.lang==='en'?'en':'es';
  await setPersistence(auth,inMemoryPersistence);
  try{const result=await signInWithPopup(auth,new GoogleAuthProvider());return(await api<{user:User}>('session',{idToken:await result.user.getIdToken(),privacy:true})).user;}
  catch(e){if(e instanceof Error&&e.message.startsWith('Firebase:'))throw new Error('No se pudo completar el acceso con Google. Revisa que las ventanas emergentes estén permitidas e inténtalo de nuevo.');throw e;}
  finally{await signOut(auth);}
}
