module.exports = async function handler(req, res) {
  try {
    // Test basic response
    res.status(200).json({ 
      success: true, 
      message: 'API is working',
      timestamp: new Date().toISOString(),
      environment: {
        hasSmtpHost: !!process.env.SMTP_HOST,
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasViteSmtpHost: !!process.env.VITE_SMTP_HOST,
        hasViteSmtpUser: !!process.env.VITE_SMTP_USER,
        hasViteSmtpPass: !!process.env.VITE_SMTP_PASS
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      error: 'Health check failed', 
      details: error.message 
    });
  }
}
