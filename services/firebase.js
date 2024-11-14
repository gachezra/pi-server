const { db } = require('../config/firebase');
const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    this.db = db;
  }

  async createSessionToken(uid, customClaims = {}) {
    return admin.auth().createCustomToken(uid, customClaims);
  }

  async verifySessionToken(token) {
    return admin.auth().verifyIdToken(token);
  }

  // Transaction handling
  async executeTransaction(callback) {
    try {
      return await this.db.runTransaction(callback);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToPaymentUpdates(paymentId, callback) {
    return this.db.collection('payments')
      .doc(paymentId)
      .onSnapshot(callback);
  }

  // User session management
  async getUserSession(uid) {
    const userDoc = await this.db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    return userDoc.data();
  }

  async updateUserSession(uid, sessionData) {
    return this.db.collection('users').doc(uid).update({
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      ...sessionData
    });
  }
}

module.exports = new FirebaseService();