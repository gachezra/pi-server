const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const admin = require("firebase-admin");
const serviceAccount = require("./pijiji-admin-sdk.json");
require('dotenv').config();

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.DB_URL}`
});

const rt = getDatabase(app);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { app, db, auth, rt };