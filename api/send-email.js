import nodemailer from 'nodemailer';

// Create transporter using environment variables
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text, attachments } = req.body;

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, and either html or text are required' 
      });
    }

    // Email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Demo Public School'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments || [],
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Success response
    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      response: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}
