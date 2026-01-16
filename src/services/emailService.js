export const sendFeeAddedEmail = async ({
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
}) => {
  const res = await fetch("/api/send-fee-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  const contentType = res.headers.get('content-type');
  let json;
  
  if (contentType && contentType.includes('application/json')) {
    json = await res.json().catch(() => null);
  } else {
    // If not JSON, get text and create error object
    const text = await res.text();
    json = { error: text || 'Unknown server error' };
  }

  if (!res.ok) {
    const msg = json?.error || `Failed to send email (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return json;
};
