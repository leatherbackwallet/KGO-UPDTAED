const { verifyAccessToken } = require('../utils/jwt');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      error: { 
        message: 'No authorization header provided', 
        code: 'NO_AUTH_HEADER' 
      } 
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: { 
        message: 'No token provided', 
        code: 'NO_TOKEN' 
      } 
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({ 
      success: false,
      error: { 
        message: 'Server configuration error', 
        code: 'SERVER_CONFIG_ERROR' 
      } 
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        error: { 
          message: 'Invalid or expired token', 
          code: 'INVALID_TOKEN' 
        } 
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ 
      success: false,
      error: { 
        message: 'Token verification failed', 
        code: 'TOKEN_VERIFICATION_FAILED' 
      } 
    });
  }
}; 