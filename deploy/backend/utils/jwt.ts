import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  id: string;
  email: string;
  roleId: string;
  firstName: string;
  lastName: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

/**
 * Generate a secure random string for tokens
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate access and refresh token pair
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'type'>): TokenPair => {
  const accessTokenExpiry = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes
  const refreshTokenExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

  const accessTokenPayload: JWTPayload = {
    ...payload,
    type: 'access'
  };

  const refreshTokenPayload: JWTPayload = {
    ...payload,
    type: 'refresh'
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: '15m',
      issuer: 'keralagiftsonline',
      audience: 'keralagiftsonline-users'
    }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'keralagiftsonline',
      audience: 'keralagiftsonline-users'
    }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry,
    refreshTokenExpiry
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'keralagiftsonline',
      audience: 'keralagiftsonline-users'
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      issuer: 'keralagiftsonline',
      audience: 'keralagiftsonline-users'
    }) as JWTPayload;

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = (refreshToken: string): TokenPair | null => {
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    return null;
  }

  // Generate new token pair
  const { type, ...payload } = decoded;
  return generateTokenPair(payload);
};

/**
 * Decode token without verification (for logging purposes only)
 */
export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
