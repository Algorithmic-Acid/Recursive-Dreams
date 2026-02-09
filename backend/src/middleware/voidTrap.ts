import { Request, Response, NextFunction } from 'express';
import { db } from '../config/postgres';

// ─── HONEYPOT TRAP PATHS ───
// Any request to these is 100% malicious (we don't run WordPress, PHP, etc.)
const TRAP_PATHS = [
  '/wp-login.php', '/wp-admin', '/wp-content', '/wp-includes',
  '/xmlrpc.php', '/wp-cron.php', '/wp-json',
  '/.env', '/.git', '/.htaccess', '/.htpasswd',
  '/admin.php', '/administrator', '/phpmyadmin', '/pma',
  '/config.php', '/setup.php', '/install.php',
  '/cgi-bin', '/shell', '/cmd', '/command',
  '/eval', '/exec', '/system',
  '/etc/passwd', '/etc/shadow',
  '/actuator', '/solr', '/struts',
  '/vendor/phpunit', '/telescope/requests',
];

// Suspicious path patterns (regex)
const TRAP_PATTERNS = [
  /\.php$/i,           // No PHP on this server
  /\.asp$/i,           // No ASP
  /\.jsp$/i,           // No Java
  /\.cgi$/i,           // No CGI
  /\/\.\./,            // Path traversal attempts
  /\.\.[\/\\]/,        // Path traversal
  /<script/i,          // XSS in URL
  /union\s+select/i,   // SQL injection
  /;\s*drop\s/i,       // SQL injection
  /\bOR\b\s+1\s*=\s*1/i, // SQL injection
];

// ─── IN-MEMORY BLACKLIST ───
interface BannedIP {
  bannedAt: number;
  reason: string;
  hits: number;
}

const blacklist = new Map<string, BannedIP>();

// ─── RATE TRACKING ───
interface RateEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 10_000; // 10 second window
const RATE_MAX_REQUESTS = 50;  // Max 50 requests per 10s (5/sec average)
const BAN_DURATION_MS = 30 * 60_000; // 30 minute ban

// ─── CLEANUP ───
// Purge expired bans and stale rate entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, ban] of blacklist) {
    if (now - ban.bannedAt > BAN_DURATION_MS) {
      blacklist.delete(ip);
    }
  }
  for (const [ip, entry] of rateLimits) {
    if (now - entry.windowStart > RATE_WINDOW_MS * 2) {
      rateLimits.delete(ip);
    }
  }
}, 5 * 60_000);

// ─── IP EXTRACTION ───
const getIP = (req: Request): string => {
  const cf = req.headers['cf-connecting-ip'] as string;
  if (cf) return cf.trim();
  const real = req.headers['x-real-ip'] as string;
  if (real) return real.trim();
  const fwd = req.headers['x-forwarded-for'] as string;
  if (fwd) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// ─── LOG TRAP HIT TO DATABASE ───
const logTrapHit = (ip: string, path: string, reason: string, userAgent: string) => {
  console.log(`[VOID TRAP] ${reason} | IP: ${ip} | Path: ${path}`);
  // Store in traffic_logs with a special status code (418 = I'm a teapot / trapped)
  db.query(
    `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent)
     VALUES (NOW(), 'TRAPPED', $1, 418, 0, $2, $3)`,
    [path, ip, userAgent.substring(0, 200)]
  ).catch(() => {});
};

// ─── THE VOID TRAP MIDDLEWARE ───
export const voidTrap = (req: Request, res: Response, next: NextFunction) => {
  const ip = getIP(req);
  const userAgent = (req.headers['user-agent'] || '').toString();
  const path = req.path.toLowerCase();
  const now = Date.now();

  // 1. CHECK BLACKLIST - tarpit banned IPs
  const ban = blacklist.get(ip);
  if (ban) {
    ban.hits++;
    // Tarpit: hold the connection open, waste attacker resources, then kill it
    const delay = Math.min(ban.hits * 2000, 30000); // Escalating delay, max 30s
    setTimeout(() => {
      try { res.socket?.destroy(); } catch {}
    }, delay);
    return;
  }

  // 2. RATE LIMITING - ban IPs that flood
  const rateEntry = rateLimits.get(ip);
  if (rateEntry) {
    if (now - rateEntry.windowStart > RATE_WINDOW_MS) {
      // Reset window
      rateEntry.count = 1;
      rateEntry.windowStart = now;
    } else {
      rateEntry.count++;
      if (rateEntry.count > RATE_MAX_REQUESTS) {
        blacklist.set(ip, { bannedAt: now, reason: 'Rate limit exceeded', hits: 1 });
        logTrapHit(ip, req.path, 'RATE LIMIT BAN - flooding detected', userAgent);
        res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
        return;
      }
    }
  } else {
    rateLimits.set(ip, { count: 1, windowStart: now });
  }

  // 3. HONEYPOT - check exact trap paths
  if (TRAP_PATHS.some(trap => path === trap || path.startsWith(trap + '/'))) {
    blacklist.set(ip, { bannedAt: now, reason: `Honeypot: ${req.path}`, hits: 1 });
    logTrapHit(ip, req.path, 'HONEYPOT TRIGGERED', userAgent);
    // Serve fake glitch response to confuse scanners
    res.status(200).send(`<pre>
VOID_VENDOR SECURITY SYSTEM v6.6.6
===================================
> INTRUSION DETECTED
> TRACING ROUTE... ${ip}
> DEPLOYING COUNTERMEASURES...
> CONNECTION FLAGGED
> ================================
> ERROR: STACK OVERFLOW IN MODULE [REDACTED]
> CORE DUMP: 0x${Math.random().toString(16).slice(2, 10)}
> SEGFAULT AT ADDRESS 0x${Math.random().toString(16).slice(2, 10)}
</pre>`);
    return;
  }

  // 4. PATTERN MATCHING - check suspicious URL patterns
  const originalUrl = req.originalUrl || req.url;
  for (const pattern of TRAP_PATTERNS) {
    if (pattern.test(originalUrl)) {
      blacklist.set(ip, { bannedAt: now, reason: `Pattern: ${pattern.source}`, hits: 1 });
      logTrapHit(ip, req.path, `PATTERN MATCH: ${pattern.source}`, userAgent);
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }

  // 5. OVERSIZED BODY CHECK - block massive payloads before they hit JSON parser
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 5_000_000) { // 5MB max
    logTrapHit(ip, req.path, `OVERSIZED PAYLOAD: ${contentLength} bytes`, userAgent);
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  next();
};

// ─── ADMIN: Get current blacklist status ───
export const getBlacklistStatus = () => {
  const entries: Array<{ ip: string; reason: string; hits: number; bannedAt: string; expiresIn: string }> = [];
  const now = Date.now();
  for (const [ip, ban] of blacklist) {
    const remaining = BAN_DURATION_MS - (now - ban.bannedAt);
    if (remaining > 0) {
      entries.push({
        ip,
        reason: ban.reason,
        hits: ban.hits,
        bannedAt: new Date(ban.bannedAt).toISOString(),
        expiresIn: `${Math.round(remaining / 60_000)}m`,
      });
    }
  }
  return {
    totalBanned: entries.length,
    trackedIPs: rateLimits.size,
    banDuration: '30 minutes',
    rateLimit: `${RATE_MAX_REQUESTS} requests per ${RATE_WINDOW_MS / 1000}s`,
    entries,
  };
};

// ─── ADMIN: Manually ban an IP ───
export const manualBan = (ip: string, reason: string = 'Manual admin ban') => {
  blacklist.set(ip, { bannedAt: Date.now(), reason, hits: 0 });
};

// ─── ADMIN: Unban an IP ───
export const manualUnban = (ip: string): boolean => {
  return blacklist.delete(ip);
};
