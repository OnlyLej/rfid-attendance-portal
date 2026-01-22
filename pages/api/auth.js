// ============================================
// FILE: pages/api/auth.js
// SECURE AUTHENTICATION ENDPOINT
// Returns session token ONLY, never API keys
// ============================================

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  try {
    // Call Google Apps Script authentication endpoint
    const url = `${GOOGLE_SCRIPT_URL}?action=authenticateUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      // Return ONLY safe data to client
      // NEVER return API keys, studentId, or assignedClasses
      return res.status(200).json({
        success: true,
        message: data.message,
        sessionToken: data.sessionToken,  // This is what client needs
        userType: data.userType,          // 'teacher' or 'parent'
        fullName: data.fullName,          // Display name
        username: data.username           // Username for display
        // Note: Sensitive data stays server-side in Google Sheets
      });
    } else {
      // Authentication failed
      return res.status(401).json({
        success: false,
        message: data.message || 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error. Please try again.' 
    });
  }
}
