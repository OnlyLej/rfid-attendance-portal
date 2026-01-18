export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const API_KEY = process.env.GOOGLE_APPS_SCRIPT_KEY;
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  const { username, password } = req.body;

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=authenticateUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&apiKey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      // Return API key to client on successful auth
      return res.status(200).json({
        ...data,
        apiKey: API_KEY
      });
    } else {
      return res.status(401).json(data);
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}
