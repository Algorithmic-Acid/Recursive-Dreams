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
  // Session/analytics scanners
  '/api/session/properties',
  // SonicWall firewall scanners
  '/api/sonicos/tfa', '/api/sonicos/auth', '/api/sonicos',
  // Kubernetes/container scanners
  '/api/v1/pods', '/api/v1/nodes', '/api/v1/secrets',
  '/api/v1/namespaces', '/api/v1/services',
  // General API version scanners
  '/v1/pods', '/v2/pods',
  // Jenkins/CI scanners
  '/jenkins', '/jnlpJars', '/script',
  // Spring Boot actuators
  '/actuator/health', '/actuator/env', '/actuator/beans',
  // Config/secrets scanners
  '/config', '/configs', '/configuration',
  '/secret', '/secrets', '/credentials',
  '/backup', '/db', '/database',
  // Common exploit paths
  '/console', '/debug', '/trace',
  '/swagger', '/swagger-ui', '/api-docs',
  '/graphql', '/playground',
];

// ─── SUSPICIOUS PATH PATTERNS ───
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

// ─── SCANNER USER-AGENT PATTERNS ───
// These tools are never used by legitimate visitors to a VST store
const SCANNER_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nuclei/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
  /dirb\//i,
  /wfuzz/i,
  /hydra/i,
  /nessus/i,
  /openvas/i,
  /acunetix/i,
  /appscan/i,
  /libwww-perl/i,
  /lwp-trivial/i,
  /zmeu/i,
  /WPScan/i,
  /python-nmap/i,
  /jndi:/i,           // Log4Shell probe UA
  /\$\{jndi/i,        // Log4Shell in UA
];

// ─── BODY INJECTION PATTERNS ───
// Scanned against all string values in the parsed request body
const BODY_INJECTION_PATTERNS = [
  /union\s+select/i,
  /;\s*drop\s+(table|database)/i,
  /'\s*or\s+'?\d/i,          // ' OR '1'='1
  /'\s*or\s+\d+\s*=\s*\d/i,  // ' OR 1=1
  /--\s*$/,                   // SQL comment terminator
  /\bxp_cmdshell\b/i,
  /\bsp_executesql\b/i,
  /<script[\s>]/i,
  /javascript:\s*[a-z]/i,
  /on(load|error|click|mouseover|onerror)\s*=/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bsystem\s*\(/i,
  /\$\{.*?\}/,               // Template injection ${...}
  /\{\{.*?\}\}/,             // SSTI {{...}}
];

// ─── IN-MEMORY BLACKLIST ───
interface BannedIP {
  bannedAt: number;
  reason: string;
  hits: number;
}

const blacklist = new Map<string, BannedIP>();

// ─── GLOBAL RATE TRACKING ───
interface RateEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 10_000;  // 10 second window
const RATE_MAX_REQUESTS = 50;   // Max 50 req/10s (5/sec)
const BAN_DURATION_MS = 30 * 60_000; // 30 minute ban

// ─── AUTH-SPECIFIC RATE TRACKING (much tighter) ───
interface AuthRateEntry {
  count: number;
  windowStart: number;
  violations: number; // How many times they've hit the limit
}

const authRateLimits = new Map<string, AuthRateEntry>();
const AUTH_RATE_WINDOW_MS = 60_000; // 1 minute window
const AUTH_MAX_REQUESTS = 10;       // 10 login attempts per minute
const AUTH_BAN_VIOLATIONS = 2;      // Ban after 2 violations (20+ attempts)
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

// ─── CLEANUP ───
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
  for (const [ip, entry] of authRateLimits) {
    if (now - entry.windowStart > AUTH_RATE_WINDOW_MS * 5) {
      authRateLimits.delete(ip);
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

// ─── RECURSIVE BODY SCANNER ───
const scanBodyValue = (value: any, depth = 0): string | null => {
  if (depth > 5) return null; // Prevent infinite recursion
  if (typeof value === 'string') {
    for (const pattern of BODY_INJECTION_PATTERNS) {
      if (pattern.test(value)) return pattern.source;
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      const hit = scanBodyValue(item, depth + 1);
      if (hit) return hit;
    }
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const hit = scanBodyValue(value[key], depth + 1);
      if (hit) return hit;
    }
  }
  return null;
};

// ─── LOG TRAP HIT TO DATABASE ───
const logTrapHit = (ip: string, path: string, reason: string, userAgent: string) => {
  console.log(`[VOID TRAP] ${reason} | IP: ${ip} | Path: ${path}`);
  db.query(
    `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent)
     VALUES (NOW(), 'TRAPPED', $1, 418, 0, $2, $3)`,
    [path, ip, userAgent.substring(0, 200)]
  ).catch(() => {});
};

// ─── PERSIST BAN TO DATABASE ───
const persistBan = (ip: string, reason: string, expiresAt: Date) => {
  db.query(
    `INSERT INTO ip_bans (ip_address, reason, hits, banned_at, expires_at)
     VALUES ($1, $2, 1, NOW(), $3)
     ON CONFLICT (ip_address) DO UPDATE
       SET reason = $2, hits = ip_bans.hits + 1, banned_at = NOW(), expires_at = $3`,
    [ip, reason, expiresAt]
  ).catch(err => {
    console.error('Failed to persist IP ban:', err.message);
  });
};

// ─── LOAD PERSISTED BANS ON STARTUP ───
export const loadPersistedBans = async (): Promise<void> => {
  try {
    // Clean up expired bans first
    await db.query(`DELETE FROM ip_bans WHERE expires_at < NOW()`);

    // Load active bans into memory
    const result = await db.query(
      `SELECT ip_address, reason, hits, banned_at FROM ip_bans WHERE expires_at > NOW()`
    );

    for (const row of result.rows) {
      blacklist.set(row.ip_address, {
        bannedAt: new Date(row.banned_at).getTime(),
        reason: row.reason,
        hits: row.hits,
      });
    }

    if (result.rowCount && result.rowCount > 0) {
      console.log(`🛡️ Loaded ${result.rowCount} persisted IP bans from database`);
    }
  } catch (err: any) {
    console.error('Failed to load persisted bans:', err.message);
  }
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
    // Update hits in DB asynchronously
    db.query(`UPDATE ip_bans SET hits = $1 WHERE ip_address = $2`, [ban.hits, ip]).catch(() => {});
    // Tarpit: hold connection, waste attacker resources, then kill
    const delay = Math.min(ban.hits * 2000, 30000);
    setTimeout(() => {
      try { res.socket?.destroy(); } catch {}
    }, delay);
    return;
  }

  // 2. SCANNER USER-AGENT CHECK - instant ban
  for (const pattern of SCANNER_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      const expiresAt = new Date(now + BAN_DURATION_MS);
      blacklist.set(ip, { bannedAt: now, reason: `Scanner UA: ${pattern.source}`, hits: 1 });
      persistBan(ip, `Scanner UA: ${userAgent.substring(0, 100)}`, expiresAt);
      logTrapHit(ip, req.path, `SCANNER UA BLOCKED: ${userAgent.substring(0, 80)}`, userAgent);
      res.status(403).send('Forbidden');
      return;
    }
  }

  // 3. GLOBAL RATE LIMITING - ban IPs that flood
  const rateEntry = rateLimits.get(ip);
  if (rateEntry) {
    if (now - rateEntry.windowStart > RATE_WINDOW_MS) {
      rateEntry.count = 1;
      rateEntry.windowStart = now;
    } else {
      rateEntry.count++;
      if (rateEntry.count > RATE_MAX_REQUESTS) {
        const expiresAt = new Date(now + BAN_DURATION_MS);
        blacklist.set(ip, { bannedAt: now, reason: 'Rate limit exceeded', hits: 1 });
        persistBan(ip, 'Rate limit exceeded', expiresAt);
        logTrapHit(ip, req.path, 'RATE LIMIT BAN - flooding detected', userAgent);
        res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
        return;
      }
    }
  } else {
    rateLimits.set(ip, { count: 1, windowStart: now });
  }

  // 4. AUTH ENDPOINT RATE LIMITING (login/register - much stricter)
  if (AUTH_PATHS.some(p => path === p || path.startsWith(p))) {
    const authEntry = authRateLimits.get(ip);
    if (authEntry) {
      if (now - authEntry.windowStart > AUTH_RATE_WINDOW_MS) {
        authEntry.count = 1;
        authEntry.windowStart = now;
      } else {
        authEntry.count++;
        if (authEntry.count > AUTH_MAX_REQUESTS) {
          authEntry.violations++;
          logTrapHit(ip, req.path, `AUTH RATE LIMIT (violation #${authEntry.violations})`, userAgent);
          if (authEntry.violations >= AUTH_BAN_VIOLATIONS) {
            const expiresAt = new Date(now + BAN_DURATION_MS);
            blacklist.set(ip, { bannedAt: now, reason: `Brute force: ${authEntry.violations} auth violations`, hits: 1 });
            persistBan(ip, `Brute force: ${authEntry.violations} auth violations`, expiresAt);
          }
          res.status(429).json({ error: 'Too many login attempts. Please wait and try again.' });
          return;
        }
      }
    } else {
      authRateLimits.set(ip, { count: 1, windowStart: now, violations: 0 });
    }
  }

  // 5. HONEYPOT - check exact trap paths
  if (TRAP_PATHS.some(trap => path === trap || path.startsWith(trap + '/'))) {
    const expiresAt = new Date(now + BAN_DURATION_MS);
    blacklist.set(ip, { bannedAt: now, reason: `Honeypot: ${req.path}`, hits: 1 });
    persistBan(ip, `Honeypot: ${req.path}`, expiresAt);
    logTrapHit(ip, req.path, 'HONEYPOT TRIGGERED', userAgent);
    // Fake glitch response to confuse scanners
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

  // 6. URL PATTERN MATCHING - check suspicious URL patterns
  const originalUrl = req.originalUrl || req.url;
  for (const pattern of TRAP_PATTERNS) {
    if (pattern.test(originalUrl)) {
      const expiresAt = new Date(now + BAN_DURATION_MS);
      blacklist.set(ip, { bannedAt: now, reason: `Pattern: ${pattern.source}`, hits: 1 });
      persistBan(ip, `Pattern match: ${pattern.source}`, expiresAt);
      logTrapHit(ip, req.path, `PATTERN MATCH: ${pattern.source}`, userAgent);
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }

  // 7. POST BODY INJECTION SCANNING
  if (req.body && typeof req.body === 'object') {
    const hit = scanBodyValue(req.body);
    if (hit) {
      const expiresAt = new Date(now + BAN_DURATION_MS);
      blacklist.set(ip, { bannedAt: now, reason: `Body injection: ${hit}`, hits: 1 });
      persistBan(ip, `Body injection: ${hit}`, expiresAt);
      logTrapHit(ip, req.path, `BODY INJECTION: ${hit}`, userAgent);
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }

  // 8. OVERSIZED BODY CHECK
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 5_000_000) {
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
    authRateLimit: `${AUTH_MAX_REQUESTS} auth requests per ${AUTH_RATE_WINDOW_MS / 1000}s`,
    entries,
  };
};

// ─── ADMIN: Manually ban an IP ───
export const manualBan = (ip: string, reason: string = 'Manual admin ban') => {
  const now = Date.now();
  const expiresAt = new Date(now + BAN_DURATION_MS);
  blacklist.set(ip, { bannedAt: now, reason, hits: 0 });
  persistBan(ip, reason, expiresAt);
};

// ─── ADMIN: Unban an IP ───
export const manualUnban = (ip: string): boolean => {
  db.query(`DELETE FROM ip_bans WHERE ip_address = $1`, [ip]).catch(() => {});
  return blacklist.delete(ip);
};
