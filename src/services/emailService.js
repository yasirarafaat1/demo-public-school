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
  // Temporarily disable email service due to deployment issues
  console.log('Fee email service temporarily disabled. Email data:', {
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
  });
  
  // Don't throw error to avoid breaking fee submission process
  return { success: false, message: 'Email service temporarily disabled' };
};
