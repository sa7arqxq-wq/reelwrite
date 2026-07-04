/**
 * Security detection patterns and honeypot configuration.
 *
 * This module defines:
 * 1. HONEYPOT_PATHS — common scanner targets that no legitimate user would visit
 * 2. ATTACK_PATTERNS — regex patterns for SQLi, XSS, path traversal in query strings
 * 3. AUTO_BLOCK_THRESHOLD — how many honeypot hits trigger an auto-block
 *
 * All detection happens in proxy.ts BEFORE the request reaches your app.
 */

// Honeypot paths — these are paths that no legitimate visitor would request.
// Scanners and bots probe these constantly. Any hit = intrusion attempt.
// Matched as: path starts with one of these (case-insensitive).
export const HONEYPOT_PATHS: string[] = [
  // Environment / secrets
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.aws/credentials",
  "/.aws/config",
  "/.ssh/id_rsa",
  "/.ssh/id_ed25519",
  "/.git/config",
  "/.git/HEAD",
  "/.git/index",
  "/.gitignore",
  "/.npmrc",
  "/.dockerenv",

  // WordPress (we're not WordPress)
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/wp-includes",
  "/wp-config.php",
  "/xmlrpc.php",
  "/wp",

  // PHP admin tools
  "/phpmyadmin",
  "/phpMyAdmin",
  "/pma",
  "/adminer",
  "/admin.php",
  "/admin/login.php",
  "/administrator",
  "/phpinfo.php",
  "/info.php",
  "/test.php",

  // Common config/backup files
  "/config.php",
  "/config.json",
  "/config.yml",
  "/config.yaml",
  "/configuration.php",
  "/settings.php",
  "/settings.json",
  "/backup.sql",
  "/db.sql",
  "/database.sql",
  "/dump.sql",
  "/backup.zip",
  "/backup.tar.gz",
  "/site.zip",

  // CI/CD configs
  "/.github/workflows",
  "/.gitlab-ci.yml",
  "/Jenkinsfile",
  "/docker-compose.yml",
  "/Dockerfile",

  // Framework-specific (we're not these frameworks)
  "/cgi-bin/",
  "/vendor/phpunit",
  "/vendor/",
  "/node_modules/",
  "/symfony/",
  "/laravel/",
  "/django/",
  "/flask/",

  // Other common attack targets
  "/.well-known/security", // attackers probe this for vuln info
  "/server-status",
  "/server-info",
  "/manager/html", // Tomcat
  "/solr/",
  "/struts/",
  "/console/", // Python/Django debug
  "/actuator/", // Spring Boot
  "/api/swagger",
  "/api-docs",
  "/graphql", // if you don't run GraphQL
];

// Severity by honeypot category — used for the admin dashboard
export function honeypotSeverity(path: string): "HIGH" | "CRITICAL" {
  // Secret/credential probes are critical
  if (
    path.includes(".env") ||
    path.includes(".aws") ||
    path.includes(".ssh") ||
    path.includes(".git/config") ||
    path.includes("backup") ||
    path.includes("dump") ||
    path.includes("wp-config") ||
    path.includes("configuration.php")
  ) {
    return "CRITICAL";
  }
  return "HIGH";
}

// SQL injection patterns — checked against the full URL (path + query)
export const SQLI_PATTERNS: RegExp[] = [
  /union\s+select/i,
  /select\s+.*\s+from\s+/i,
  /insert\s+into\s+/i,
  /drop\s+table/i,
  /drop\s+database/i,
  /update\s+.*\s+set\s+/i,
  /delete\s+from\s+/i,
  /or\s+1\s*=\s*1/i,
  /or\s+'1'\s*=\s*'1'/i,
  /'\s*or\s*'/i,
  /--\s*$/i, // SQL comment at end
  /\bxp_cmdshell\b/i,
  /\bsp_executesql\b/i,
  /information_schema/i,
  /\bsleep\s*\(\s*\d+\s*\)/i,
  /\bbenchmark\s*\(/i,
  /0x[0-9a-f]{8,}/i, // hex-encoded payloads
];

// XSS patterns
export const XSS_PATTERNS: RegExp[] = [
  /<script/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=\s*["']?[^"']*["']?/i, // onerror=, onload=, etc.
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg\s+on/i,
  /document\.cookie/i,
  /document\.location/i,
  /window\.location/i,
  /eval\s*\(/i,
  /String\.fromCharCode/i,
];

// Path traversal patterns
export const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//i,
  /\.\.\\/i,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /%2e%2e/i,
  /etc\/passwd/i,
  /etc\/shadow/i,
  /windows\/system32/i,
  /boot\.ini/i,
  /win\.ini/i,
];

// Command injection patterns
export const CMD_INJECTION_PATTERNS: RegExp[] = [
  /;\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl)\s/i,
  /\|\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl)\s/i,
  /`[^`]+`/, // backticks
  /\$\([^)]+\)/, // $(...)
  /&&\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl)\s/i,
];

// Check a URL string for attack patterns
export interface AttackDetection {
  type: "SQL_INJECTION" | "XSS" | "PATH_TRAVERSAL" | "CMD_INJECTION" | null;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  pattern: string | null;
}

export function detectAttack(url: string): AttackDetection {
  // Decode URL-encoded characters so patterns match both raw and encoded payloads
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    // If decoding fails, use the raw URL
  }
  // Also replace + with space (common in query strings)
  decoded = decoded.replace(/\+/g, " ");
  const checks: { patterns: RegExp[]; type: AttackDetection["type"]; severity: AttackDetection["severity"] }[] = [
    { patterns: SQLI_PATTERNS, type: "SQL_INJECTION", severity: "CRITICAL" },
    { patterns: XSS_PATTERNS, type: "XSS", severity: "HIGH" },
    { patterns: PATH_TRAVERSAL_PATTERNS, type: "PATH_TRAVERSAL", severity: "HIGH" },
    { patterns: CMD_INJECTION_PATTERNS, type: "CMD_INJECTION", severity: "CRITICAL" },
  ];
  for (const check of checks) {
    for (const pattern of check.patterns) {
      if (pattern.test(decoded) || pattern.test(url)) {
        return { type: check.type, severity: check.severity, pattern: pattern.source };
      }
    }
  }
  return { type: null, severity: "MEDIUM", pattern: null };
}

// Check if a path is a honeypot
export function isHoneypot(path: string): boolean {
  const lower = path.toLowerCase();
  return HONEYPOT_PATHS.some((hp) => lower === hp || lower.startsWith(hp));
}

// Auto-block config
export const AUTO_BLOCK_THRESHOLD = 3; // 3 honeypot hits in the window...
export const AUTO_BLOCK_WINDOW_MS = 10 * 60 * 1000; // ...within 10 minutes...
export const AUTO_BLOCK_DURATION_MS = 60 * 60 * 1000; // ...blocks for 1 hour
