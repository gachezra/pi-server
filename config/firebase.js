const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const admin = require("firebase-admin");
const Buffer = require('buffer');
require('dotenv').config();
const base64Key = process.env.GOOGLE_SERVICE_KEY;

if (!base64Key) {
  throw new Error("Service account key is not set in environment variables");
}

const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf8'));


const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.DB_URL}`
});

const rt = getDatabase(app);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { app, db, auth, rt };