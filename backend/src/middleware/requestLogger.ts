import { Request, Response, NextFunction } from 'express';
import { db } from '../config/postgres';
import { verifyToken } from '../utils/jwt';

// Cleanup old traffic logs (older than 3 months)
export const cleanupOldTrafficLogs = async (): Promise<number> => {
  try {
    const result = await db.query(
      `DELETE FROM traffic_logs WHERE timestamp < NOW() - INTERVAL '3 months' RETURNING id`
    );
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} traffic logs older than 3 months`);
    }
    return deletedCount;
  } catch (err: any) {
    console.error('Traffic log cleanup failed:', err.message);
    return 0;
  }
};

// Schedule periodic cleanup (runs every 24 hours)
let cleanupInterval: NodeJS.Timeout | null = null;
export const startTrafficLogCleanup = () => {
  // Run cleanup on startup (after a short delay to ensure DB is ready)
  setTimeout(() => cleanupOldTrafficLogs(), 5000);

  // Schedule daily cleanup (every 24 hours)
  cleanupInterval = setInterval(() => {
    cleanupOldTrafficLogs();
  }, 24 * 60 * 60 * 1000);

  console.log('📅 Traffic log cleanup scheduled (every 24 hours, keeping 3 months)');
};

export const stopTrafficLogCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: string;
}

// Circular buffer to store last 100 requests in memory
const MAX_LOGS = 100;
const requestLogs: RequestLog[] = [];
let logCounter = 0;

export const getRequestLogs = (): RequestLog[] => {
  return [...requestLogs].reverse(); // Most recent first
};

export const clearRequestLogs = (): void => {
  requestLogs.length = 0;
};

export const getLogStats = () => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const fiveMinutesAgo = now - 300000;

  const recentLogs = requestLogs.filter(log => new Date(log.timestamp).getTime() > oneMinuteAgo);
  const last5MinLogs = requestLogs.filter(log => new Date(log.timestamp).getTime() > fiveMinutesAgo);

  const methodCounts: Record<string, number> = {};
  const pathCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  requestLogs.forEach(log => {
    methodCounts[log.method] = (methodCounts[log.method] || 0) + 1;

    // Group similar paths (strip IDs)
    const simplePath = log.path.replace(/\/[a-f0-9-]{36}/g, '/:id').replace(/\/\d+/g, '/:id');
    pathCounts[simplePath] = (pathCounts[simplePath] || 0) + 1;

    const statusGroup = `${Math.floor(log.statusCode / 100)}xx`;
    statusCounts[statusGroup] = (statusCounts[statusGroup] || 0) + 1;
  });

  const avgResponseTime = requestLogs.length > 0
    ? requestLogs.reduce((sum, log) => sum + log.responseTime, 0) / requestLogs.length
    : 0;

  return {
    totalLogged: requestLogs.length,
    requestsLastMinute: recentLogs.length,
    requestsLast5Minutes: last5MinLogs.length,
    avgResponseTime: Math.round(avgResponseTime),
    methodCounts,
    topPaths: Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    statusCounts,
  };
};

// Enhanced IP extraction - handles proxies, cloudflare, and nginx
const getClientIP = (req: Request): string => {
  // Priority order for IP detection:
  // 1. CF-Connecting-IP (Cloudflare)
  // 2. X-Real-IP (nginx proxy)
  // 3. X-Forwarded-For (general proxy, take first IP)
  // 4. req.ip (Express default)
  // 5. req.socket.remoteAddress (direct connection)

  const cfIP = req.headers['cf-connecting-ip'] as string;
  if (cfIP) return cfIP.trim();

  const realIP = req.headers['x-real-ip'] as string;
  if (realIP) return realIP.trim();

  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (actual client)
    return forwardedFor.split(',')[0].trim();
  }

  if (req.ip) return req.ip;

  const socketIP = (req.socket as any)?.remoteAddress;
  if (socketIP) return socketIP;

  return 'unknown';
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  // Capture the original URL before routing modifies req.path
  const originalUrl = req.originalUrl || req.url;

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to capture response data
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const responseTime = Date.now() - startTime;

    // Log ALL requests now (including /downloads/ for piracy tracking)
    // Only skip truly static assets like images, CSS, JS
    if (originalUrl.match(/\.(jpg|jpeg|png|gif|css|js|ico|svg|woff|woff2|ttf)$/i)) {
      return originalEnd.call(this, chunk, encoding, callback);
    }

    const clientIP = getClientIP(req);
    const log: RequestLog = {
      id: `req-${++logCounter}`,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: originalUrl, // Use originalUrl instead of req.path
      statusCode: res.statusCode,
      responseTime,
      ip: clientIP,
      userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 200),
      userId: (req as any).user?.userId,
    };

    // Detect admin from JWT directly so it works on ALL routes,
    // including public endpoints and the login request itself
    const detectAdmin = (): { isAdmin: boolean; email: string | null; userId: string | null } => {
      // First check if protect middleware already decoded the user
      const protectedUser = (req as any).user;
      if (protectedUser?.role === 'admin') {
        return { isAdmin: true, email: protectedUser.email, userId: protectedUser.userId };
      }
      // Fall back to decoding the token from the Authorization header directly
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (decoded?.role === 'admin') {
          return { isAdmin: true, email: decoded.email, userId: decoded.userId };
        }
      }
      return { isAdmin: false, email: null, userId: null };
    };

    const { isAdmin, email: adminEmail, userId: adminUserId } = detectAdmin();

    // Add to circular buffer (exclude admin traffic to keep monitoring clean)
    if (!isAdmin) {
      if (requestLogs.length >= MAX_LOGS) {
        requestLogs.shift(); // Remove oldest
      }
      requestLogs.push(log);
    }

    // Persist to database (async, don't block the response)
    // Separate admin traffic from regular user/guest traffic
    setImmediate(() => {

      if (isAdmin) {
        // Log admin traffic to separate table
        db.query(
          `INSERT INTO admin_traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent, user_id, admin_email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            new Date(log.timestamp),
            log.method,
            log.path,
            log.statusCode,
            log.responseTime,
            log.ip,
            log.userAgent,
            adminUserId || log.userId || null,
            adminEmail || null
          ]
        ).catch(err => {
          console.error('Admin traffic log DB insert failed:', err.message);
        });
      } else {
        // Log regular user/guest traffic
        db.query(
          `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            new Date(log.timestamp),
            log.method,
            log.path,
            log.statusCode,
            log.responseTime,
            log.ip,
            log.userAgent,
            log.userId || null
          ]
        ).catch(err => {
          console.error('Traffic log DB insert failed:', err.message);
        });
      }
    });

    return originalEnd.call(this, chunk, encoding, callback);
  } as any;

  next();
};
