const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const piNetwork = require('../services/piNetwork');

router.post('/signin', async (req, res) => {
  try {
    const { accessToken, user: piUser } = req.body.authResult;
    
    // Verify Pi Network token
    await piNetwork.verifyUser(accessToken);
    
    // Create or update Firebase user
    const userRecord = await auth.createUser({
      uid: piUser.uid,
      displayName: piUser.username,
    }).catch(async (error) => {
      if (error.code === 'auth/uid-already-exists') {
        return auth.updateUser(piUser.uid, {
          displayName: piUser.username,
        });
      }
      throw error;
    });
    
    // Store user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      username: piUser.username,
      piUid: piUser.uid,
      roles: piUser.roles,
      accessToken,
      lastLogin: new Date().toISOString()
    }, { merge: true });
    
    // Create custom token for Firebase authentication
    const firebaseToken = await auth.createCustomToken(userRecord.uid);

    // Store user info in session
    req.session.user = userRecord;
    
    res.json({ token: firebaseToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to sign out' });
    }
    res.json({ message: 'Successfully signed out' });
  });
});

module.exports = router;