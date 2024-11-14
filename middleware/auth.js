const { db, auth } = require('../config/firebase');

const firebaseSession = async (req, res, next) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get or create session in Firebase
    const sessionRef = db.ref(`sessions/${decodedToken.uid}`);
    const sessionSnapshot = await sessionRef.get();
    
    if (sessionSnapshot.exists()) {
      // Update last activity
      await sessionRef.update({
        lastActive: new Date().toISOString(),
      });
    } else {
      // Create new session
      await sessionRef.set({
        uid: decodedToken.uid,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    }
    
    req.user = decodedToken;
    req.sessionRef = sessionRef;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Session cleanup utility
const cleanupSessions = async () => {
  const sessionsRef = db.ref('sessions');
  const snapshot = await sessionsRef.get();
  const now = new Date();
  
  snapshot.forEach((childSnapshot) => {
    const session = childSnapshot.val();
    const lastActive = new Date(session.lastActive);
    
    // Remove sessions inactive for more than 24 hours
    if (now - lastActive > 24 * 60 * 60 * 1000) {
      childSnapshot.ref.remove();
    }
  });
};

// Run cleanup every 12 hours
setInterval(cleanupSessions, 12 * 60 * 60 * 1000);

module.exports = { authenticateUser: firebaseSession };