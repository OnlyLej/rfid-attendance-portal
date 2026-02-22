// ============================================
// FILE: pages/api/proxy.js
// ============================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, X-Session-Token'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  try {
    if (req.method === 'POST') {
      // For POST requests (logout, etc.) — forward as POST to doPost
      // No session token required for logout (it's in the body)
      const body = req.body;

      // For non-logout POST actions, still validate session token
      if (body.action !== 'logout') {
        const sessionToken = req.headers['x-session-token'];
        if (!sessionToken) {
          return res.status(401).json({ success: false, message: 'No session token provided' });
        }
        body.sessionToken = sessionToken;
      }

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        redirect: 'follow',
      });

      const data = await response.json();
      return res.status(200).json(data);
    }

    // GET requests
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'No session token provided' });
    }

    const { action, ...params } = req.query;
    let url = `${GOOGLE_SCRIPT_URL}?action=${action}&sessionToken=${sessionToken}`;
    Object.keys(params).forEach(key => {
      if (params[key] && key !== 'sessionToken') {
        url += `&${key}=${encodeURIComponent(params[key])}`;
      }
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success && data.message && data.message.includes('Session')) {
      return res.status(401).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
