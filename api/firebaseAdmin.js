const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let app;
let db;

function getFirebaseApp() {
  if (app) return app;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.');
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return app;
}

function getDb() {
  if (db) return db;
  const appInstance = getFirebaseApp();
  db = getFirestore(appInstance);
  return db;
}

module.exports = {
  getDb,
};
