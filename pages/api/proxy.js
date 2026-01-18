export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_KEY = process.env.GOOGLE_APPS_SCRIPT_KEY;
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  // Verify API key from client
  const clientKey = req.headers['x-api-key'];
  
  if (clientKey !== API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { action, ...params } = req.method === 'GET' ? req.query : req.body;

    let url = `${GOOGLE_SCRIPT_URL}?action=${action}&apiKey=${API_KEY}`;
    
    // Append query parameters
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url += `&${key}=${encodeURIComponent(params[key])}`;
      }
    });

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}