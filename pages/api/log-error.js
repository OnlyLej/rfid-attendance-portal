/**
 * POST /api/log-error
 *
 * Server-side Discord webhook error logger.
 * - Webhook URL stays server-side only (never sent to client)
 * - Requires a shared CSRF-style token to reject random POST spam
 * - Rate-limited: max 6 reports per 10 minutes per IP
 * - Deduplication: identical error+digest within 60s is silently dropped
 * - Payload validated and sanitised before forwarding to Discord
 */

const WEBHOOK_URL  = process.env.DISCORD_WEBHOOK_URL;   // Full Discord webhook URL
const CLIENT_TOKEN = process.env.ERROR_REPORT_TOKEN;     // Any random secret string you choose
const MAX_PER_WINDOW = 6;    // max reports
const WINDOW_MS      = 10 * 60 * 1000; // per 10 minutes per IP
const DEDUP_TTL_MS   = 60 * 1000;      // identical errors suppressed for 60s

// In-memory stores (reset on serverless cold start — acceptable for rate limiting)
const rateLimitStore = new Map(); // ip → { count, windowStart }
const dedupStore     = new Map(); // hash → timestamp

function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function simpleHash(str) {
  // FNV-1a 32-bit — fast, non-cryptographic, good enough for dedup keys
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now };
  }
  entry.count++;
  rateLimitStore.set(ip, entry);
  // Prune old entries occasionally
  if (rateLimitStore.size > 500) {
    for (const [k, v] of rateLimitStore) {
      if (now - v.windowStart > WINDOW_MS) rateLimitStore.delete(k);
    }
  }
  return entry.count > MAX_PER_WINDOW;
}

function isDuplicate(hash) {
  const now = Date.now();
  const last = dedupStore.get(hash);
  if (last && now - last < DEDUP_TTL_MS) return true;
  dedupStore.set(hash, now);
  // Prune
  if (dedupStore.size > 1000) {
    for (const [k, v] of dedupStore) {
      if (now - v > DEDUP_TTL_MS) dedupStore.delete(k);
    }
  }
  return false;
}

function severityFromMessage(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('fatal') || m.includes('crash') || m.includes('unhandled'))
    return { label: '🔴 CRITICAL', color: 0xe11d48 };
  if (m.includes('auth') || m.includes('session') || m.includes('token') || m.includes('forbidden'))
    return { label: '🟠 HIGH',     color: 0xf97316 };
  if (m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('api'))
    return { label: '🟡 MEDIUM',   color: 0xf59e0b };
  return { label: '🔵 LOW',       color: 0x0ea5e9 };
}

function sanitise(str, maxLen = 1000) {
  if (typeof str !== 'string') return '';
  // Strip anything that looks like a webhook URL or secret in the payload
  return str
    .replace(/https:\/\/discord(app)?\.com\/api\/webhooks\/[^\s]*/gi, '[webhook redacted]')
    .replace(/Bearer\s+[^\s]*/gi, '[token redacted]')
    .slice(0, maxLen);
}

export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'method' });
  }

  // Webhook must be configured
  if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith('https://discord')) {
    return res.status(503).json({ ok: false, reason: 'not configured' });
  }

  // Validate client token (prevents random internet traffic from spamming your webhook)
  if (!CLIENT_TOKEN) {
    return res.status(503).json({ ok: false, reason: 'not configured' });
  }
  const authHeader = req.headers['x-error-token'];
  if (!authHeader || authHeader !== CLIENT_TOKEN) {
    return res.status(401).json({ ok: false, reason: 'unauthorized' });
  }

  // Rate limit by IP
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, reason: 'rate limited' });
  }

  // Parse + validate body
  const body = req.body || {};
  const message   = sanitise(String(body.message   || 'Unknown error'),  300);
  const stack     = sanitise(String(body.stack      || ''),               800);
  const digest    = sanitise(String(body.digest     || ''),               64);
  const url       = sanitise(String(body.url        || ''),               200);
  const userAgent = sanitise(String(body.userAgent  || ''),               200);
  const timestamp = sanitise(String(body.timestamp  || new Date().toISOString()), 40);

  // Dedup: same error message + digest within 60s → silently drop
  const dedupKey = simpleHash(message + digest);
  if (isDuplicate(dedupKey)) {
    return res.status(200).json({ ok: true, reason: 'deduplicated' });
  }

  const { label: severityLabel, color } = severityFromMessage(message);

  // Build Discord embed
  const embed = {
    title: `⚠️ Runtime Error — ${severityLabel}`,
    color,
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '📋 Message',
        value: `\`\`\`${message || 'No message'}\`\`\``,
        inline: false,
      },
      {
        name: '🌐 Page URL',
        value: url ? `\`${url}\`` : '_unknown_',
        inline: true,
      },
      {
        name: '🔑 Digest',
        value: digest ? `\`${digest}\`` : '_none_',
        inline: true,
      },
      {
        name: '🕐 Time (PH)',
        value: `\`${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}\``,
        inline: true,
      },
      ...(stack ? [{
        name: '🗂️ Stack Trace',
        value: `\`\`\`${stack.slice(0, 900)}\`\`\``,
        inline: false,
      }] : []),
      {
        name: '🖥️ User Agent',
        value: userAgent ? `\`${userAgent.slice(0, 120)}\`` : '_unknown_',
        inline: false,
      },
    ],
    footer: {
      text: `RIDAP Error Logger • made by lejel • IP hash: ${simpleHash(ip)}`,
    },
  };

  try {
    const discordRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'RIDAP Error Bot',
        avatar_url: 'https://ridap.qzz.io/favicon.ico',
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      console.error('[log-error] Discord rejected webhook:', discordRes.status);
      return res.status(502).json({ ok: false, reason: 'discord error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[log-error] Failed to send to Discord:', err);
    return res.status(500).json({ ok: false, reason: 'internal' });
  }
}
