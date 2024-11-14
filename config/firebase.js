const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

const firebaseConfig = {
    apiKey: `${process.env.API_KEY}`,
    authDomain: `${process.env.AUTH_DOMAIN}`,
    projectId: `${process.env.PROJECT_ID}`,
    storageBucket: `${process.env.STORAGE_BUCKET}`,
    messagingSenderId: `${process.env.MSG_SNDR_ID}`,
    appId: `${process.env.APP_ID}`,
    measurementId: `${process.env.MEASUREMENT_ID}`
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { app, db, auth };