import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Read at function call time to ensure env vars are loaded
const getJwtSecret = () => process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';
const getJwtExpire = () => process.env.JWT_EXPIRE || '7d';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as any, getJwtSecret() as any, {
    expiresIn: getJwtExpire(),
  } as any);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};
