// Vercel Function for Nodemailer SMTP
// File: api/send-email.js

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { to, subject, html, from } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const smtpHost = process.env.VITE_SMTP_HOST;
    const smtpPortRaw = process.env.VITE_SMTP_PORT;
    const smtpSecureRaw = process.env.VITE_SMTP_SECURE;
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({
        success: false,
        error: 'SMTP env vars are not configured on the server',
        message: 'Failed to send email'
      });
    }

    const smtpPort = smtpPortRaw ? Number(smtpPortRaw) : 587;
    const smtpSecure = smtpSecureRaw === 'true' || smtpSecureRaw === '1';

    // Create Nodemailer transporter with your SMTP config
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number.isFinite(smtpPort) ? smtpPort : 587,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // Verify transporter connection
    await transporter.verify();

    // Send email
    const mailOptions = {
      from: from || process.env.VITE_EMAIL_FROM || smtpUser,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Vercel Function Error:', error);
    
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error',
      message: 'Failed to send email'
    });
  }
}
