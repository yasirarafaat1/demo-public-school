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
  createdAt,
  portalLink,
  schoolName,
  schoolAddress,
  schoolContact,
  schoolEmail,
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
      🔗 <strong>School Portal:</strong> <a href="${escapeHtml(
        portalLink
      )}" target="_blank" rel="noreferrer">${escapeHtml(portalLink)}</a>
    </p>

    <p>If you have already completed the payment, please ignore this message.</p>

    <p style="margin-top:18px">
      Thank you for your cooperation.<br />
      Warm regards,<br />
      <strong>${escapeHtml(schoolName)}</strong><br />
      📍 ${escapeHtml(schoolAddress)}<br />
      📞 ${escapeHtml(schoolContact)}<br />
      ✉️ ${escapeHtml(schoolEmail)}
    </p>
  </div>
  `;
};

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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
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
    } = req.body || {};

    if (!to) {
      res.status(400).json({ error: "Missing recipient email (to)" });
      return;
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      res.status(500).json({ error: "SMTP configuration is missing" });
      return;
    }

    const fromEmail = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || schoolName || "Demo Public School";

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
      portalLink: portalLink || process.env.SCHOOL_PORTAL_LINK || "",
      schoolName: schoolName || process.env.SCHOOL_NAME || "Demo Public School",
      schoolAddress: schoolAddress || process.env.SCHOOL_ADDRESS || "",
      schoolContact: schoolContact || process.env.SCHOOL_CONTACT || "",
      schoolEmail: schoolEmail || process.env.SCHOOL_EMAIL || "",
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      response: 'Fee email sent successfully' 
    });
  } catch (error) {
    console.error('Fee email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send fee email', 
      details: error.message 
    });
  }
}
