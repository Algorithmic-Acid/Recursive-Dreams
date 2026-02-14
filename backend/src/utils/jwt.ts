import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// ─── SIGNED DOWNLOAD TOKENS ───
// Short-lived HMAC tokens for secure file download links (not full JWTs)
// Format (base64url): userId:productId:expires:hmac
export const generateDownloadToken = (userId: string, productId: string, ttlMinutes = 60): string => {
  const expires = Date.now() + ttlMinutes * 60_000;
  const payload = `${userId}:${productId}:${expires}`;
  const sig = crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('hex').slice(0, 24);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
};

export const verifyDownloadToken = (token: string, productId: string): { userId: string } | null => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;
    const [userId, pid, expiresStr, sig] = parts;
    if (pid !== productId) return null;
    if (Date.now() > parseInt(expiresStr, 10)) return null;
    const payload = `${userId}:${pid}:${expiresStr}`;
    const expected = crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('hex').slice(0, 24);
    if (sig !== expected) return null;
    return { userId };
  } catch {
    return null;
  }
};
