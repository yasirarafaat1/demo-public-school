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

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.error || `Failed to send email (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return json;
};
