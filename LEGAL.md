# Legal & Compliance — Void Vendor

This document outlines our data handling practices, security posture, and legal considerations for operating Void Vendor.

---

## 1. Active Defense Posture

Void Vendor operates a custom active defense system called **VoidTrap**. This section documents its design and our legal position.

### What VoidTrap Does

VoidTrap is a server-side middleware layer that protects Void Vendor's infrastructure from automated attacks. It is entirely reactive — it only takes action after a request reaches our server.

**Detection mechanisms:**
- Known attacker user-agent blocking (sqlmap, nikto, nuclei, gobuster, etc.)
- Rate limiting and brute-force detection
- Low-and-slow directory enumeration detection
- IP rotation / automated fingerprint detection
- POST body injection scanning (SQLi, XSS, SSTI, command injection)
- PHP/ASP/JSP extension blocking and path traversal detection

**Response mechanisms:**
- **Honeypot paths**: Fake but convincing responses (`.env`, `wp-login.php`, phpMyAdmin, Kubernetes API, etc.) that attract and identify automated scanners
- **Deception layering**: 15% of honeypot hits return `503 Service Temporarily Unavailable`; trap paths cycle rotating status codes (403, 404, 401, 200) so automated scanners cannot fingerprint valid endpoints; certain trap paths issue infinite 302 redirect cycles to waste scanner threads
- **Fake credential success**: 30% of POST attempts to the WordPress login honeypot receive a fabricated `302` redirect with a bogus authentication cookie, inducing the attacker to waste time attempting to use a non-functional token against real endpoints
- **Credential harvesting from attackers**: WordPress login form captures credentials submitted by attackers — passwords are partially masked and stored in-memory only (reset on restart); displayed in a clearable admin dashboard log for security analysis and never used to access third-party systems
- **robots.txt honeypot bait**: Tempting `Disallow` paths are listed in `robots.txt` to attract scanners; any request to those paths triggers the same honeypot response and ban as direct trap path hits
- **Fake token pivot detection**: Fake API credentials served in honeypot responses are tracked; any subsequent request using those credentials triggers instant ban
- **HTTP method abuse detection**: Unusual HTTP methods (`TRACE`, `CONNECT`) and REST-probing methods (`PUT`, `DELETE`, `PATCH`) on non-API paths indicate automated scanning and trigger instant ban
- **Hidden form honeypot field**: A CSS-invisible form field (`_void`) in the login/registration form catches bots that auto-fill all fields; human users never see or interact with it
- **Content-type mismatch detection**: Requests claiming `application/json` with an unparseable body — a scanner tell — trigger instant ban
- **AbuseIPDB reputation pre-check**: First requests from new IPs are checked against AbuseIPDB's reputation database (confidence score ≥ 80% triggers instant ban); results cached 24 hours to minimize API usage. The cache is also checked **synchronously** on every subsequent request from the same IP — so already-cached high-score IPs are blocked immediately without waiting for a new async lookup
- **Slow-drip tarpit**: Banned connections are held open (1 byte/3 seconds, max 10 minutes) to exhaust scanner connection pools — this is a passive resource consumption technique applied only to already-banned IPs
- **Smart alerting**: Automated detection of credential stuffing attacks, ban evasion attempts, IP rotation campaigns, and admin IP anomalies — alerts are surfaced in the admin dashboard for human review
- **Escalating bans**: Repeat offenders face progressively longer bans up to permanent
- **iptables integration**: Bans are enforced at the kernel level, not just application level
- **AbuseIPDB reporting**: Confirmed attackers are automatically reported to the global AbuseIPDB database with appropriate category codes; reports include attacker IP, geo location (city/country/ISP via ipinfo.io), user agent string, and requested path
- **Geo location lookup**: At the moment of ban, the attacker's IP is resolved to city/region/country/ISP via ipinfo.io and stored in `ip_bans.location` for display in the admin dashboard and inclusion in AbuseIPDB reports

### Legal Basis

All active defense measures are applied only to traffic that first contacts **our own servers**. We do not:
- Conduct offensive operations against attacker infrastructure
- Access any third-party systems
- Perform port scans or reconnaissance against external IPs
- Execute any code on attacker machines

**Honeypots are lawful.** Deploying fake endpoints on your own server to detect unauthorized access attempts is a widely accepted and legal practice. Courts in the US and EU have consistently held that honeypots on your own infrastructure do not constitute entrapment or unauthorized computer access.

**Tarpitting is lawful.** Deliberately slowing responses to already-banned IPs to waste attacker resources is a passive defensive technique applied to traffic already directed at our servers. This is analogous to a firewall DROP rule with added friction.

**Deceptive responses are lawful.** Serving `503` errors, redirect loops, or rotating status codes to scanners probing our own infrastructure is a well-established defensive technique (analogous to a firewall sending TCP RST or ICMP port unreachable). We are not misrepresenting anything to good-faith users — these responses only trigger in response to requests for paths that no legitimate user would access.

**Fake credential success responses are lawful.** Returning a fabricated authentication response (fake cookie, fake redirect) to an attacker who has already submitted credentials to a honeypot endpoint on our own infrastructure constitutes counter-deception against an already-identified hostile actor. No legitimate user submits credentials to `/wp-login.php` on a non-WordPress site. The fake token is inert and cannot be used to access any real resource.

**AbuseIPDB reporting** is performed in good faith under their [Terms of Service](https://www.abuseipdb.com/terms). We report only IPs that have demonstrated hostile behavior against our infrastructure. Reports include category codes, attacker IP, geo location, user agent, and the path that triggered the ban. voidvendor.com is a registered webmaster on AbuseIPDB.

**Geo location lookups** against ipinfo.io are performed solely for security purposes (ban records and abuse reporting). Only attacker IPs are looked up — never user or customer IPs. ipinfo.io's [privacy policy](https://ipinfo.io/privacy-policy) governs their handling of these requests.

---

## 2. Data Collected and Retention

### Traffic Logs (`traffic_logs` table)

Collected for: Operational monitoring, anomaly detection, performance analysis.

| Field | Value | Notes |
|-------|-------|-------|
| IP Address | **Anonymized** (last octet zeroed) | e.g., `192.168.1.0` — individual is not identifiable |
| User Agent | Stored as-is | Browser/OS signature only |
| Path + Method | Stored | URL path and HTTP method |
| Status Code | Stored | HTTP response code |
| Response Time | Stored | Milliseconds |
| User ID | Stored if authenticated | Internal ID only |
| Timestamp | Stored | Time of request |

**Retention**: Automatically deleted after **90 days** (configurable via `LOG_RETENTION_DAYS`).

### Security Logs (`ip_bans` table)

Collected for: Active defense, repeat offender tracking, legal evidence preservation.

Full IP addresses are retained here because:
1. They are required for iptables enforcement
2. They represent evidence of hostile activity against our infrastructure
3. Legitimate security operations require precise identification of threat actors

**Retention**: Permanent for repeat/serious offenders; auto-expires for first-time short bans.

### Admin Traffic Logs (`admin_traffic_logs` table)

Collected for: Internal audit trail of administrative actions.

Full IPs retained (admin IPs are known/trusted). **Retention**: 90 days (same `LOG_RETENTION_DAYS`).

### Honeypot Logs (`trapped_requests` in `ip_bans`)

Records of attacker attempts (honeypot hits, injected credentials, etc.) are retained permanently as security evidence.

---

## 3. GDPR / Privacy Compliance

Void Vendor processes the personal data of users in the EU/EEA. We comply with the General Data Protection Regulation (GDPR).

### Legal Bases for Processing

| Purpose | Legal Basis |
|---------|------------|
| User account and authentication | Contractual necessity (Art. 6(1)(b)) |
| Order processing and fulfillment | Contractual necessity (Art. 6(1)(b)) |
| Traffic logging for site operation | Legitimate interests (Art. 6(1)(f)) — IPs are anonymized |
| Security ban records (full IPs) | Legitimate interests (Art. 6(1)(f)) — necessary for infrastructure defense |
| AbuseIPDB reporting | Legitimate interests (Art. 6(1)(f)) — public interest in combating cybercrime |

### Privacy-by-Design Measures

- **IP anonymization**: General traffic logs store anonymized IPs (last octet zeroed for IPv4, first 3 groups only for IPv6). Individual visitors cannot be identified from these logs.
- **Data minimization**: We collect only what is necessary for operation and security.
- **Retention limits**: Traffic logs are automatically purged after 90 days.
- **Separation of purpose**: Security ban records (full IPs) are stored separately from general traffic logs and are used only for active defense.

### User Rights

Users may request:
- **Access** to their personal data
- **Deletion** of their account and associated data
- **Correction** of inaccurate data
- **Portability** of their data

Requests can be submitted to the site administrator. Note: security ban records for IPs that attacked our infrastructure may be retained under the legitimate interests basis regardless of deletion requests.

---

## 4. Terms of Service Summary (Security Provisions)

By accessing Void Vendor, users agree that:

1. Automated scanning, scraping, or probing of our infrastructure is prohibited.
2. Attempts to exploit vulnerabilities, inject malicious code, or brute-force authentication will result in permanent banning and reporting to AbuseIPDB and/or law enforcement.
3. VoidTrap honeypots are active. Any credentials entered into any form on our site are logged. Do not enter real credentials into forms you reach by automated scanning.
4. We reserve the right to preserve and share evidence of attacks with law enforcement, hosting providers, and abuse reporting services.

---

## 5. Responsible Disclosure

If you discover a genuine security vulnerability in Void Vendor:

1. **Do not** exploit it or use it to access user data.
2. Contact us through the site's contact page or GitHub issues with a description of the vulnerability.
3. Give us reasonable time to fix it before public disclosure.
4. We will credit researchers who responsibly disclose valid vulnerabilities.

Automated scanning or brute-force testing of production infrastructure is **not** responsible disclosure — it will result in a ban and AbuseIPDB report.

---

## 6. Applicable Law

Void Vendor is operated in accordance with:
- **United States**: Computer Fraud and Abuse Act (CFAA) — our honeypots and active defense measures are defensive responses to unauthorized access attempts
- **European Union**: GDPR (data protection), NIS2 Directive (security measures for digital services)
- **General**: Our AbuseIPDB reporting is consistent with good-faith abuse reporting practices recognized globally

---

*Last updated: 2026-02-13 — Added AbuseIPDB sync pre-check, HttpOnly JWT cookies, signed download URLs, session invalidation on password reset, MIME magic byte validation on uploads, IPv6 normalization, Nginx security headers*
