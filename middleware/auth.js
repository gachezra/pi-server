const { auth } = require('../config/firebase');

const authenticateUser = async (req, res, next) => {
  try {
    // First check session
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Then check Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Store user in session
    req.session.user = decodedToken;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateUser };