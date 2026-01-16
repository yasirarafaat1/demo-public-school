// Vercel Function for Fee Email
// File: api/send-fee-email.js

import nodemailer from 'nodemailer';

const formatMoney = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN");
};

const escapeHtml = (unsafe) => {
  return String(unsafe ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const buildEmailHtml = ({
  studentName,
  month,
  year,
  totalAmount,
  paidAmount,
  dueAmount,
  status,
  receiptNumber,
  createdAt
}) => {
  const due = Number(dueAmount);
  const dueLine = due > 0 ? `₹${formatMoney(due)}` : "No Due Amount";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
    <p>Dear ${escapeHtml(studentName)},</p>

    <p>
      This is to inform you that the <strong>fee details for the month of ${escapeHtml(
    month
  )} ${escapeHtml(year)}</strong> have been successfully added to your account.
    </p>

    <p>Below are the fee details:</p>

    <div style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:8px;padding:12px 14px;max-width:560px">
      <p style="margin:6px 0"><strong>📅 Fee Month &amp; Year:</strong> ${escapeHtml(
    month
  )} ${escapeHtml(year)}</p>
      <p style="margin:6px 0"><strong>💰 Total Fee Amount:</strong> ₹${formatMoney(
    totalAmount
  )}</p>
      <p style="margin:6px 0"><strong>💳 Paid Amount:</strong> ₹${formatMoney(
    paidAmount
  )}</p>
      <p style="margin:6px 0"><strong>⏳ Due Amount:</strong> ${dueLine}</p>
      <p style="margin:6px 0"><strong>📌 Payment Status:</strong> ${escapeHtml(
    status
  )}</p>
      <p style="margin:6px 0"><strong>🧾 Receipt Number:</strong> ${escapeHtml(
    receiptNumber || "-"
  )}</p>
      <p style="margin:6px 0"><strong>🗓️ Record Created On:</strong> ${escapeHtml(
    createdAt
  )}</p>
    </div>

    <p>
      If there is any due amount, kindly ensure timely payment to avoid late fees or inconvenience.
    </p>

    <p>
      For detailed information or to download the receipt, please log in to the school portal.
    </p>

    <p>
      🔗 <strong>School Portal:</strong> <a href="https://schooldemo.akamify.com" target="_blank" rel="noreferrer">schooldemo.akamify.com</a>
    </p>

    <p>If you have already completed the payment, please ignore this message.</p>

    <p style="margin-top:18px">
      Thank you for your cooperation.<br />
      Warm regards,<br />
      <strong>Akamify School</strong><br />
      📍 123, street, Town, District, State, Country<br />
      📞 +91 79053 25078<br />
      ✉️ akamifyschool@gmail.com
    </p>
  </div>
  `;
};

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
    const {
      to,
      studentName,
      month,
      year,
      totalAmount,
      paidAmount,
      dueAmount,
      status,
      receiptNumber,
      createdAt,
      portalLink,
      schoolName,
      schoolAddress,
      schoolContact,
      schoolEmail,
    } = body;

    // Validate required fields
    if (!to) {
      return res.status(400).json({ error: 'Missing recipient email (to)' });
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

    const fromEmail = process.env.VITE_EMAIL_FROM || smtpUser;
    const fromName = schoolName || "Demo Public School";

    const subject = `Fee Details Added: ${month} ${year}`;

    const html = buildEmailHtml({
      studentName: studentName || "Student",
      month: month || "",
      year: year || "",
      totalAmount: totalAmount ?? 0,
      paidAmount: paidAmount ?? 0,
      dueAmount: dueAmount ?? 0,
      status: status || "pending",
      receiptNumber,
      createdAt: createdAt || new Date().toISOString(),
      portalLink: portalLink || "",
      schoolName: schoolName || "Demo Public School",
      schoolAddress: schoolAddress || "",
      schoolContact: schoolContact || "",
      schoolEmail: schoolEmail || "",
    });

    // Send email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Fee email sent successfully'
    });

  } catch (error) {
    console.error('Vercel Function Error:', error);

    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error',
      message: 'Failed to send fee email'
    });
  }
}
