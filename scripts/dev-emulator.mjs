import {spawn} from 'node:child_process';
// Requires the official Firestore and Auth emulators; no credentials or production data.
const env={...process.env,NODE_ENV:'development',NEXT_DIST_DIR:'.next-test',FIREBASE_MODE:'emulator',FIREBASE_PROJECT_ID:'demo-viicasa-comingsoon',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8086',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9096',SITE_URL:'http://127.0.0.1:3012',REGISTRATION_ENABLED:'true',PRIVACY_APPROVED:'true',NEXT_PUBLIC_FIREBASE_MODE:'emulator',NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-viicasa-comingsoon',NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'demo-viicasa-comingsoon.firebaseapp.com',NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL:'http://127.0.0.1:9096',MAIL_MODE:'disabled'};
delete env.GOOGLE_APPLICATION_CREDENTIALS;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3012'],{env,stdio:'inherit',windowsHide:true});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
