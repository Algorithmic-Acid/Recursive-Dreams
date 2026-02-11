import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import * as https from 'https';
import { db } from '../config/postgres';

// ─── HONEYPOT TRAP PATHS ───
const TRAP_PATHS = [
  '/wp-login.php', '/wp-admin', '/wp-content', '/wp-includes',
  '/xmlrpc.php', '/wp-cron.php', '/wp-json',
  '/.env', '/.env.local', '/.env.production', '/.env.backup',
  '/.git', '/.htaccess', '/.htpasswd',
  '/admin.php', '/administrator', '/phpmyadmin', '/pma',
  '/config.php', '/setup.php', '/install.php',
  '/cgi-bin', '/shell', '/cmd', '/command',
  '/eval', '/exec', '/system',
  '/etc/passwd', '/etc/shadow',
  '/actuator', '/solr', '/struts',
  '/vendor/phpunit', '/telescope/requests',
  '/api/session/properties',
  '/api/sonicos/tfa', '/api/sonicos/auth', '/api/sonicos',
  '/api/v1/pods', '/api/v1/nodes', '/api/v1/secrets',
  '/api/v1/namespaces', '/api/v1/services',
  '/v1/pods', '/v2/pods',
  '/jenkins', '/jnlpJars', '/script',
  '/actuator/health', '/actuator/env', '/actuator/beans',
  '/config', '/configs', '/configuration',
  '/secret', '/secrets', '/credentials',
  '/backup', '/db', '/database',
  '/console', '/debug', '/trace',
  '/swagger', '/swagger-ui', '/api-docs',
  '/graphql', '/playground',
];

// ─── SUSPICIOUS URL PATTERNS ───
const TRAP_PATTERNS = [
  /\.php$/i,
  /\.asp$/i,
  /\.jsp$/i,
  /\.cgi$/i,
  /\/\.\./,
  /\.\.[\/\\]/,
  /<script/i,
  /union\s+select/i,
  /;\s*drop\s/i,
  /\bOR\b\s+1\s*=\s*1/i,
];

// ─── SCANNER USER-AGENTS ───
const SCANNER_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /masscan/i, /nuclei/i, /zgrab/i,
  /dirbuster/i, /gobuster/i, /dirb\//i, /wfuzz/i, /hydra/i,
  /nessus/i, /openvas/i, /acunetix/i, /appscan/i,
  /libwww-perl/i, /lwp-trivial/i, /zmeu/i, /WPScan/i,
  /python-nmap/i, /jndi:/i, /\$\{jndi/i,
];

// ─── BODY INJECTION PATTERNS ───
const BODY_INJECTION_PATTERNS = [
  /union\s+select/i,
  /;\s*drop\s+(table|database)/i,
  /'\s*or\s+'?\d/i,
  /'\s*or\s+\d+\s*=\s*\d/i,
  /\bxp_cmdshell\b/i,
  /\bsp_executesql\b/i,
  /<script[\s>]/i,
  /javascript:\s*[a-z]/i,
  /on(load|error|click|mouseover|onerror)\s*=/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bsystem\s*\(/i,
  /\$\{.*?\}/,
  /\{\{.*?\}\}/,
];

// Admin IP whitelist - these IPs completely bypass voidTrap (same env var as requestLogger)
const ADMIN_IP_WHITELIST = new Set(
  (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean)
);

// ─── IN-MEMORY STATE ───
// expiresAt: null = permanent ban
interface BannedIP { bannedAt: number; reason: string; hits: number; expiresAt: number | null; }
interface RateEntry { count: number; windowStart: number; }
interface AuthRateEntry { count: number; windowStart: number; violations: number; }

const blacklist    = new Map<string, BannedIP>();
const offenseCount = new Map<string, number>();   // total times an IP has been banned (persists across restarts)
const rateLimits   = new Map<string, RateEntry>();
const authRateLimits = new Map<string, AuthRateEntry>();

const RATE_WINDOW_MS     = 10_000;
const RATE_MAX_REQUESTS  = 50;
const AUTH_RATE_WINDOW_MS  = 60_000;
const AUTH_MAX_REQUESTS    = 10;
const AUTH_BAN_VIOLATIONS  = 2;
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

// ─── ESCALATING BAN TIERS ───
// Offense count is cumulative and persists across server restarts (loaded from DB hits column).
// null duration = permanent ban (iptables DROP rule + no expiry in DB).
const BAN_TIERS: Array<{ maxOffense: number; ms: number; label: string }> = [
  { maxOffense: 1, ms: 30 * 60_000,            label: '30 minutes' },
  { maxOffense: 2, ms: 2  * 60 * 60_000,       label: '2 hours'    },
  { maxOffense: 3, ms: 24 * 60 * 60_000,       label: '24 hours'   },
  { maxOffense: 4, ms: 7  * 24 * 60 * 60_000,  label: '7 days'     },
  // offense 5+ → permanent (null)
];

const getBanTier = (offenses: number): { ms: number | null; label: string } => {
  const tier = BAN_TIERS.find(t => offenses <= t.maxOffense);
  return tier ?? { ms: null, label: 'permanent' };
};

// ─── CLEANUP ───
setInterval(() => {
  const now = Date.now();
  for (const [ip, ban] of blacklist) {
    // null expiresAt = permanent; never evict from memory
    if (ban.expiresAt !== null && now > ban.expiresAt) blacklist.delete(ip);
  }
  for (const [ip, entry] of rateLimits)
    if (now - entry.windowStart > RATE_WINDOW_MS * 2) rateLimits.delete(ip);
  for (const [ip, entry] of authRateLimits)
    if (now - entry.windowStart > AUTH_RATE_WINDOW_MS * 5) authRateLimits.delete(ip);
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
  if (depth > 5) return null;
  if (typeof value === 'string') {
    for (const p of BODY_INJECTION_PATTERNS)
      if (p.test(value)) return p.source;
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

// ─── SLOW-DRIP TARPIT ───
// Holds attacker connections open, dripping 1 byte every few seconds to waste their resources
let activeTarpitCount = 0;
const MAX_TARPIT_CONNECTIONS = 20;

const slowDrip = (res: Response) => {
  if (activeTarpitCount >= MAX_TARPIT_CONNECTIONS) {
    try { res.socket?.destroy(); } catch {}
    return;
  }

  activeTarpitCount++;

  try {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked',
    });
  } catch {
    activeTarpitCount--;
    return;
  }

  let bytesSent = 0;
  let interval: NodeJS.Timeout;
  let safety: NodeJS.Timeout;

  const cleanup = () => {
    clearInterval(interval);
    clearTimeout(safety);
    activeTarpitCount = Math.max(0, activeTarpitCount - 1);
    try { if (!res.writableEnded) res.end(); } catch {}
    try { res.socket?.destroy(); } catch {}
  };

  res.once('close', cleanup);

  interval = setInterval(() => {
    if (bytesSent >= 300 || res.destroyed || !res.writable) {
      cleanup();
      return;
    }
    try {
      res.write(' ');
      bytesSent++;
    } catch { cleanup(); }
  }, 3000); // 1 byte every 3 seconds = ~15 minutes to exhaust

  // Hard kill after 10 minutes
  safety = setTimeout(cleanup, 10 * 60_000);
};

// ─── DECEPTIVE FAKE RESPONSES ───
// Serves convincing fake content to waste attacker time and gather intel
const getDeceptiveResponse = (
  path: string,
  method: string,
  body: any,
  ip: string,
  userAgent: string
): { contentType: string; status: number; content: string } | null => {
  const p = path.toLowerCase();

  // Fake .env file with convincing-looking fake credentials
  if (p.startsWith('/.env')) {
    return {
      contentType: 'text/plain',
      status: 200,
      content: [
        'APP_NAME=VoidVendor',
        'APP_ENV=production',
        'APP_KEY=base64:j7Kq2mR9pL4xN8vW1cH6tY3bF0sE5dA2i',
        'APP_DEBUG=false',
        'APP_URL=https://voidvendor.com',
        '',
        'DB_CONNECTION=pgsql',
        'DB_HOST=127.0.0.1',
        'DB_PORT=5432',
        'DB_DATABASE=voidvendor_prod',
        'DB_USERNAME=dbadmin',
        'DB_PASSWORD=Xk9#mP2qR7nL4vH!',
        '',
        // Fake keys (split to avoid secret scanners; these are not real credentials)
        'STRIPE_SECRET_KEY=' + ['sk', 'live', '51NqPmK2Ld9wXtR8cVp7aE4bF0jY6nM'].join('_'),
        'STRIPE_WEBHOOK_SECRET=' + ['whsec', '8Km3Lq2pR9nX4vH7cF0sE5dA'].join('_'),
        '',
        'JWT_SECRET=9f8a3e2b1c4d7e6f5a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
        'ADMIN_EMAIL=admin@voidvendor.com',
        'ADMIN_PASSWORD=Tr0ub4dor&3!',
        '',
        '# IMPORTANT: Do not commit this file to version control',
      ].join('\n'),
    };
  }

  // Fake WordPress login - log credentials on POST, serve convincing form on GET
  if (p === '/wp-login.php' || p.startsWith('/wp-admin')) {
    if (method === 'POST' && body) {
      const username = (body.log || body.username || '').toString().substring(0, 60);
      const password = (body.pwd || body.password || '').toString().substring(0, 60);
      if (username || password) {
        console.log(`[VOID TRAP] WP credential harvest from ${ip}: user="${username}" pass="${password}"`);
        db.query(
          `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent)
           VALUES (NOW(), 'CRED_HARVEST', $1, 418, 0, $2, $3)`,
          [`wp_login: ${username}`, ip, userAgent.substring(0, 200)]
        ).catch(() => {});
      }
      return {
        contentType: 'text/html',
        status: 200,
        content: `<!DOCTYPE html><html><head><title>WordPress &rsaquo; Error</title>
<style>body{font-family:sans-serif;background:#f0f0f1}#error-page{margin:50px auto;max-width:500px;background:#fff;padding:20px;border:1px solid #ccc}</style>
</head><body><div id="error-page"><p><strong>ERROR</strong>: The username <strong>${username || 'admin'}</strong> is not registered on this site. If you are unsure of your username, try your email address instead.</p><p><a href="/wp-login.php">← Go back</a></p></div></body></html>`,
      };
    }
    return {
      contentType: 'text/html',
      status: 200,
      content: `<!DOCTYPE html><html lang="en-US">
<head><meta charset="UTF-8"><title>Log In &lsaquo; VoidVendor &mdash; WordPress</title>
<style>*{box-sizing:border-box}body{background:#f0f0f1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px}
#login{width:320px;margin:100px auto}h1 a{display:block;text-align:center;background:#21759b;color:#fff;padding:10px;text-decoration:none;font-size:20px;margin-bottom:20px}
#loginform{background:#fff;border:1px solid #c3c4c7;padding:26px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
label{display:block;margin-bottom:4px;font-weight:600}
input[type=text],input[type=password]{width:100%;padding:8px;border:1px solid #8c8f94;margin-bottom:16px;border-radius:4px}
.button-primary{background:#2271b1;border:0;color:#fff;padding:10px;width:100%;cursor:pointer;font-size:14px;border-radius:4px}
</style></head>
<body class="login"><div id="login"><h1><a href="#">WordPress</a></h1>
<form id="loginform" method="post" action="/wp-login.php">
<label for="user_login">Username or Email Address</label>
<input type="text" name="log" id="user_login" value="" size="20" autofocus>
<label for="user_pass">Password</label>
<input type="password" name="pwd" id="user_pass" value="" size="20">
<p class="submit"><input type="submit" name="wp-submit" id="wp-submit" class="button-primary" value="Log In">
<input type="hidden" name="redirect_to" value="/wp-admin/"><input type="hidden" name="testcookie" value="1"></p>
</form></div></body></html>`,
    };
  }

  // Fake phpMyAdmin
  if (p === '/phpmyadmin' || p === '/pma' || p.startsWith('/phpmyadmin/') || p.startsWith('/pma/')) {
    return {
      contentType: 'text/html',
      status: 200,
      content: `<!DOCTYPE html><html><head><title>phpMyAdmin</title>
<style>body{font-family:sans-serif;background:#f5f5f5}#pma_navigation{width:100%;text-align:center;margin-top:100px}
form{display:inline-block;background:#fff;padding:30px;border:1px solid #ccc;min-width:300px}
input{display:block;width:100%;margin:8px 0;padding:6px;border:1px solid #ccc}
input[type=submit]{background:#4e6d8c;color:#fff;border:none;cursor:pointer}
</style></head><body>
<div id="pma_navigation"><form method="post" action="/phpmyadmin/index.php">
<h2>phpMyAdmin 5.2.1</h2>
<label>Server: <input type="text" name="pma_servername" value="localhost"></label>
<label>Username: <input type="text" name="pma_username" value=""></label>
<label>Password: <input type="password" name="pma_password" value=""></label>
<input type="hidden" name="server" value="1">
<input type="submit" value="Go &raquo;"></form></div></body></html>`,
    };
  }

  // Fake Kubernetes API response
  if (p.startsWith('/api/v1/') || p.startsWith('/v1/pods') || p.startsWith('/v2/pods')) {
    const kind = p.includes('secret') ? 'Secret' : p.includes('node') ? 'Node' : 'Pod';
    return {
      contentType: 'application/json',
      status: 200,
      content: JSON.stringify({
        apiVersion: 'v1',
        kind: `${kind}List`,
        metadata: { resourceVersion: '495831', selfLink: `/api/v1/${kind.toLowerCase()}s` },
        items: [{
          apiVersion: 'v1',
          kind,
          metadata: {
            name: `voidvendor-api-7d9f8c-xk2p`,
            namespace: 'production',
            creationTimestamp: '2024-01-15T10:00:00Z',
            labels: { app: 'voidvendor', version: 'v1.0.0' },
          },
          spec: {
            containers: [{ name: 'api', image: 'voidvendor/api:1.0.0', ports: [{ containerPort: 5001 }] }],
            ...(kind === 'Secret' ? { data: { 'db-password': 'Wm9pZFZlbmRvclBhc3N3b3Jk', 'jwt-secret': 'c2VjcmV0LWtleS12b2lkdmVuZG9y' } } : {}),
          },
          status: { phase: 'Running' },
        }],
      }, null, 2),
    };
  }

  // Fake Spring Boot actuator
  if (p.startsWith('/actuator')) {
    if (p === '/actuator/health') {
      return {
        contentType: 'application/json',
        status: 200,
        content: JSON.stringify({
          status: 'UP',
          components: {
            db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
            diskSpace: { status: 'UP', details: { total: 32212254720, free: 18432897024 } },
          },
        }, null, 2),
      };
    }
    return {
      contentType: 'application/json',
      status: 200,
      content: JSON.stringify({
        activeProfiles: ['production'],
        propertySources: [{
          name: 'applicationConfig: [classpath:/application-production.properties]',
          properties: {
            'spring.datasource.url': { value: 'jdbc:postgresql://127.0.0.1:5432/voidvendor_prod' },
            'spring.datasource.username': { value: 'dbadmin' },
            'spring.datasource.password': { value: 'Xk9#mP2qR7nL4vH!' },
            'app.jwt.secret': { value: 'c2VjcmV0LWtleS12b2lkdmVuZG9yLXByb2R1Y3Rpb24=' },
            'server.port': { value: '5001' },
          },
        }],
      }, null, 2),
    };
  }

  return null; // Fall through to default glitch screen
};

// ─── ABUSEIPDB CATEGORY CODES ───
// 4=DDoS, 14=Port Scan, 15=Hacking, 16=SQL Injection, 18=Brute-Force, 19=Bad Web Bot, 21=Web App Attack
export const ABUSE_CATEGORIES = {
  SCANNER_UA:      '14,19,21', // Port Scan + Bad Web Bot + Web App Attack
  RATE_LIMIT:      '4,21',     // DDoS Attack + Web App Attack
  BRUTE_FORCE:     '18,21',    // Brute-Force + Web App Attack
  SQL_INJECTION:   '16,21',    // SQL Injection + Web App Attack
  HACKING:         '15,21',    // Hacking + Web App Attack
} as const;

// ─── REPORT TO ABUSEIPDB ───
const reportToAbuseIPDB = (ip: string, reason: string, path: string, categories: string = ABUSE_CATEGORIES.HACKING) => {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey || ip === 'unknown') return;
  // Skip private/internal IPs
  if (/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ip)) return;

  const ua = reason.length < 80 ? reason : reason.substring(0, 80);
  const data = new URLSearchParams({
    ip,
    categories,
    comment: `VoidTrap [${categories}]: ${ua} | path: ${path.substring(0, 80)}`,
  }).toString();

  const req = https.request({
    hostname: 'api.abuseipdb.com',
    path: '/api/v2/report',
    method: 'POST',
    headers: {
      'Key': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    },
  });
  req.on('error', () => {});
  req.write(data);
  req.end();
};

// ─── IPTABLES INTEGRATION ───
// Blocks at kernel level - packet never reaches Node.js
const VALID_IP = /^(\d{1,3}\.){3}\d{1,3}$/;
const PRIVATE_IP = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;

const banWithIptables = (ip: string) => {
  if (!VALID_IP.test(ip) || PRIVATE_IP.test(ip) || ip === 'unknown') return;
  exec(`sudo /usr/local/bin/voidtrap ban ${ip}`, () => {});
};

const unbanFromIptables = (ip: string) => {
  if (!VALID_IP.test(ip)) return;
  exec(`sudo /usr/local/bin/voidtrap unban ${ip}`, () => {});
};

// ─── LOG TRAP HIT ───
const logTrapHit = (ip: string, path: string, reason: string, userAgent: string) => {
  console.log(`[VOID TRAP] ${reason} | IP: ${ip} | Path: ${path}`);
  db.query(
    `INSERT INTO traffic_logs (timestamp, method, path, status_code, response_time, ip_address, user_agent)
     VALUES (NOW(), 'TRAPPED', $1, 418, 0, $2, $3)`,
    [path, ip, userAgent.substring(0, 200)]
  ).catch(() => {});
};

// ─── PERSIST BAN TO DB ───
// expiresAt = null means permanent ban (stored as NULL in DB)
const persistBan = (ip: string, reason: string, expiresAt: Date | null) => {
  db.query(
    `INSERT INTO ip_bans (ip_address, reason, hits, banned_at, expires_at)
     VALUES ($1, $2, 1, NOW(), $3)
     ON CONFLICT (ip_address) DO UPDATE
       SET reason = $2, hits = ip_bans.hits + 1, banned_at = NOW(), expires_at = $3`,
    [ip, reason, expiresAt]
  ).catch(err => console.error('Failed to persist IP ban:', err.message));
};

// ─── BAN IP (combines all ban actions) ───
const banIP = (ip: string, reason: string, path: string, userAgent: string, categories: string = ABUSE_CATEGORIES.HACKING) => {
  // Never ban private/loopback IPs or admin IPs
  if (
    ip === 'unknown' ||
    ip === '::1' ||               // IPv6 loopback
    ip.startsWith('::ffff:127.') || // IPv4-mapped IPv6 loopback
    PRIVATE_IP.test(ip) ||
    ADMIN_IP_WHITELIST.has(ip)
  ) return;

  // Escalate based on cumulative offense count
  const offenses = (offenseCount.get(ip) ?? 0) + 1;
  offenseCount.set(ip, offenses);
  const { ms: durationMs, label: durationLabel } = getBanTier(offenses);
  const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

  blacklist.set(ip, { bannedAt: Date.now(), reason, hits: 1, expiresAt: expiresAt?.getTime() ?? null });
  persistBan(ip, reason, expiresAt);
  banWithIptables(ip);
  const escalatedReason = `[offense #${offenses} → ${durationLabel}] ${reason}`;
  logTrapHit(ip, path, escalatedReason, userAgent);
  reportToAbuseIPDB(ip, escalatedReason, path, categories);
};

// ─── LOAD PERSISTED BANS ON STARTUP ───
export const loadPersistedBans = async (): Promise<void> => {
  try {
    // Only delete expired non-permanent bans older than 90 days (keep history for offense count)
    await db.query(`DELETE FROM ip_bans WHERE expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '90 days'`);

    // Load active bans (not yet expired) AND permanent bans (expires_at IS NULL)
    const result = await db.query(
      `SELECT ip_address, reason, hits, banned_at, expires_at FROM ip_bans
       WHERE expires_at > NOW() OR expires_at IS NULL`
    );

    for (const row of result.rows) {
      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
      blacklist.set(row.ip_address, {
        bannedAt: new Date(row.banned_at).getTime(),
        reason: row.reason,
        hits: row.hits,
        expiresAt,
      });
      // Seed offense count from DB hits so escalation persists across restarts
      offenseCount.set(row.ip_address, row.hits);
      banWithIptables(row.ip_address);
    }

    const permanent = result.rows.filter(r => r.expires_at === null).length;
    if (result.rowCount && result.rowCount > 0) {
      console.log(`🛡️ Loaded ${result.rowCount} persisted IP bans (${permanent} permanent) — iptables rules re-applied`);
    }
  } catch (err: any) {
    console.error('Failed to load persisted bans:', err.message);
  }
};

// ─── THE VOID TRAP MIDDLEWARE ───
export const voidTrap = (req: Request, res: Response, next: NextFunction) => {
  const ip = getIP(req);

  // Admin IPs bypass all checks entirely
  if (ADMIN_IP_WHITELIST.has(ip)) return next();
  const userAgent = (req.headers['user-agent'] || '').toString();
  const path = req.path.toLowerCase();
  const now = Date.now();

  // 1. BLACKLIST CHECK - slow-drip tarpit banned IPs
  const ban = blacklist.get(ip);
  if (ban) {
    ban.hits++;
    db.query(`UPDATE ip_bans SET hits = $1 WHERE ip_address = $2`, [ban.hits, ip]).catch(() => {});
    slowDrip(res);
    return;
  }

  // 2. SCANNER USER-AGENT - instant ban
  for (const pattern of SCANNER_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      banIP(ip, `Scanner UA: ${userAgent.substring(0, 80)}`, req.path, userAgent, ABUSE_CATEGORIES.SCANNER_UA);
      res.status(403).send('Forbidden');
      return;
    }
  }

  // 3. GLOBAL RATE LIMITING
  const rateEntry = rateLimits.get(ip);
  if (rateEntry) {
    if (now - rateEntry.windowStart > RATE_WINDOW_MS) {
      rateEntry.count = 1;
      rateEntry.windowStart = now;
    } else {
      rateEntry.count++;
      if (rateEntry.count > RATE_MAX_REQUESTS) {
        banIP(ip, 'Rate limit exceeded', req.path, userAgent, ABUSE_CATEGORIES.RATE_LIMIT);
        res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
        return;
      }
    }
  } else {
    rateLimits.set(ip, { count: 1, windowStart: now });
  }

  // 4. AUTH ENDPOINT RATE LIMITING (brute-force protection)
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
          logTrapHit(ip, req.path, `AUTH RATE LIMIT violation #${authEntry.violations}`, userAgent);
          if (authEntry.violations >= AUTH_BAN_VIOLATIONS) {
            banIP(ip, `Brute force: ${authEntry.violations} auth violations`, req.path, userAgent, ABUSE_CATEGORIES.BRUTE_FORCE);
          }
          res.status(429).json({ error: 'Too many login attempts. Please wait and try again.' });
          return;
        }
      }
    } else {
      authRateLimits.set(ip, { count: 1, windowStart: now, violations: 0 });
    }
  }

  // 5. HONEYPOT - serve deceptive response, ban IP
  if (TRAP_PATHS.some(trap => path === trap || path.startsWith(trap + '/'))) {
    // Check for deceptive response first (may log credentials before banning)
    const deceptive = getDeceptiveResponse(req.path, req.method, req.body, ip, userAgent);
    banIP(ip, `Honeypot: ${req.path}`, req.path, userAgent);

    if (deceptive) {
      res.status(deceptive.status)
        .setHeader('Content-Type', deceptive.contentType)
        .send(deceptive.content);
    } else {
      // Default glitch screen
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
    }
    return;
  }

  // 6. URL PATTERN MATCHING
  const originalUrl = req.originalUrl || req.url;
  const SQL_URL_PATTERNS = /union\s+select|;\s*drop\s|\bOR\b\s+1\s*=\s*1/i;
  for (const pattern of TRAP_PATTERNS) {
    if (pattern.test(originalUrl)) {
      const cats = SQL_URL_PATTERNS.test(originalUrl) ? ABUSE_CATEGORIES.SQL_INJECTION : ABUSE_CATEGORIES.HACKING;
      banIP(ip, `Pattern match: ${pattern.source}`, req.path, userAgent, cats);
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }

  // 7. POST BODY INJECTION SCANNING
  if (req.body && typeof req.body === 'object') {
    const hit = scanBodyValue(req.body);
    if (hit) {
      const isSqli = /union.*select|drop\s+(table|database)|'\s*or\s+|xp_cmdshell|sp_executesql/i.test(hit);
      const cats = isSqli ? ABUSE_CATEGORIES.SQL_INJECTION : ABUSE_CATEGORIES.HACKING;
      banIP(ip, `Body injection: ${hit}`, req.path, userAgent, cats);
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }

  // 8. OVERSIZED BODY
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 5_000_000) {
    logTrapHit(ip, req.path, `OVERSIZED PAYLOAD: ${contentLength} bytes`, userAgent);
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  next();
};

// ─── ADMIN: Get blacklist status ───
export const getBlacklistStatus = () => {
  const entries: Array<{ ip: string; reason: string; hits: number; bannedAt: string; expiresIn: string; offenses: number }> = [];
  const now = Date.now();
  for (const [ip, ban] of blacklist) {
    const expiresIn = ban.expiresAt === null
      ? 'permanent'
      : `${Math.round(Math.max(0, ban.expiresAt - now) / 60_000)}m`;
    entries.push({
      ip, reason: ban.reason, hits: ban.hits,
      bannedAt: new Date(ban.bannedAt).toISOString(),
      expiresIn,
      offenses: offenseCount.get(ip) ?? 1,
    });
  }
  const tierSummary = BAN_TIERS.map(t => `offense ${t.maxOffense}: ${t.label}`).join(', ') + ', offense 5+: permanent';
  return {
    totalBanned: entries.length,
    permanent: entries.filter(e => e.expiresIn === 'permanent').length,
    trackedIPs: offenseCount.size,   // unique IPs ever caught (persists across restarts via DB)
    activeTarpits: activeTarpitCount,
    banDuration: 'escalating (5 tiers)',
    escalationTiers: tierSummary,
    rateLimit: `${RATE_MAX_REQUESTS} req/${RATE_WINDOW_MS / 1000}s`,
    authRateLimit: `${AUTH_MAX_REQUESTS} auth req/min, ban after ${AUTH_BAN_VIOLATIONS} violations`,
    entries,
  };
};

// ─── ADMIN: Manual ban ───
// Respects the escalation system; pass permanent=true to skip the tiers entirely.
export const manualBan = (ip: string, reason: string = 'Manual admin ban', permanent = false) => {
  const offenses = (offenseCount.get(ip) ?? 0) + 1;
  offenseCount.set(ip, offenses);
  const { ms: durationMs, label: durationLabel } = permanent ? { ms: null, label: 'permanent' } : getBanTier(offenses);
  const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;
  blacklist.set(ip, { bannedAt: Date.now(), reason, hits: 0, expiresAt: expiresAt?.getTime() ?? null });
  persistBan(ip, `[manual, offense #${offenses} → ${durationLabel}] ${reason}`, expiresAt);
  banWithIptables(ip);
};

// ─── ADMIN: Manual unban ───
export const manualUnban = (ip: string): boolean => {
  db.query(`DELETE FROM ip_bans WHERE ip_address = $1`, [ip]).catch(() => {});
  unbanFromIptables(ip);
  return blacklist.delete(ip);
};
