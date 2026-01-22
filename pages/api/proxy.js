// ============================================
// FILE: pages/api/proxy.js
// SECURE API PROXY - Session-based authentication
// ============================================

export default async function handler(req, res) {
  // CORS headers
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

  // IMPORTANT: Get session token from header (NOT API key)
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken) {
    return res.status(401).json({ 
      success: false, 
      message: 'No session token provided' 
    });
  }

  try {
    const { action, ...params } = req.method === 'GET' ? req.query : req.body;

    // Build request URL with session token
    let url = `${GOOGLE_SCRIPT_URL}?action=${action}&sessionToken=${sessionToken}`;
    
    // Append additional parameters
    Object.keys(params).forEach(key => {
      if (params[key] && key !== 'sessionToken') {
        url += `&${key}=${encodeURIComponent(params[key])}`;
      }
    });

    // Make request to Google Apps Script
    const response = await fetch(url);
    const data = await response.json();

    // Check if session is invalid
    if (!data.success && data.message && data.message.includes('Session')) {
      return res.status(401).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
