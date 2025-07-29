import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;


//before local wlaa
// import admin from 'firebase-admin';
// import path from 'path';
// import { readFileSync } from 'fs';

// const serviceAccountPath = path.resolve('F:/PromptGuru/prompguru-firebase-adminsdk-fbsvc-749f5b5eb0.json');
// const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export default admin;