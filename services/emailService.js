// Email service for sending emails via Vercel serverless function

const API_BASE_URL = 'https://schooldemo.akamify.com';

// Send email function
export const sendEmail = async (emailData) => {
    // Temporarily disable email service due to deployment issues
    console.log('Email service temporarily disabled. Email data:', JSON.stringify(emailData, null, 2));
    
    throw new Error('Email service is temporarily under maintenance. Please try again later.');
};

// Send fee payment email
export const sendFeeAddedEmail = async (studentData, feeData) => {
    try {
        await sendEmail(emailTemplates.feePayment(studentData, feeData));
        console.log("Fee payment email sent successfully");
    } catch (error) {
        console.error("Failed to send fee payment email:", error);
        
        // Fallback: Log the email data locally for debugging
        const emailData = emailTemplates.feePayment(studentData, feeData);
        console.log("Email data (fallback):", JSON.stringify(emailData, null, 2));
        
        // Don't throw error to avoid breaking the fee submission process
    }
};

// Email templates
export const emailTemplates = {
    // Class assignment notification
    classAssignment: (studentData, classData, sessionData) => ({
        to: studentData.email,
        subject: 'Class Assignment - Demo Public School',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745; text-align: center;">Class Assignment Confirmation</h2>
          <p>Dear <strong>${studentData.studentName}</strong>,</p>
          <p>Thank you for registering at Demo Public School. Your registration has been successfully completed.</p>

           <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Registration Details:</h3>
            <p><strong>Student Name:</strong> ${studentData.studentName}</p>
            <p><strong>Father's Name:</strong> ${studentData.fatherName}</p>
            <p><strong>Mother's Name:</strong> ${studentData.motherName}</p>
            <p><strong>Registration Number:</strong> ${studentData.registrationNumber}</p>
            <p><strong>Date of Birth:</strong> ${new Date(studentData.dob).toLocaleDateString()}</p>
            <p><strong>Mobile Number:</strong> ${studentData.mobileNumber}</p>
            
            <h4 style="color: #333; margin-top: 20px;">Address Information:</h4>
            <p><strong>Street:</strong> ${studentData.street || 'N/A'}</p>
            <p><strong>City/Town/Village:</strong> ${studentData.cityTownVillage || 'N/A'}</p>
            <p><strong>District:</strong> ${studentData.district || 'N/A'}</p>
            <p><strong>State:</strong> ${studentData.state || 'N/A'}</p>
            <p><strong>Country:</strong> ${studentData.country || 'N/A'}</p>
            <p><strong>Pin Code:</strong> ${studentData.pinCode || 'N/A'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Assignment Details:</h3>
            <p><strong>Class:</strong> ${classData.class_number} (${classData.class_code})</p>
            <p><strong>Session:</strong> ${sessionData.session_year} (${sessionData.start_month}/${sessionData.start_year} - ${sessionData.end_month}/${sessionData.end_year})</p>
            <p><strong>Roll Number:</strong> ${classData.rollNumber || 'To be assigned'}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Demo Public School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>`,
    }),

    // Fee payment notification
    feePayment: (studentData, feeData) => ({
        to: studentData.email,
        subject: 'Fee Payment Confirmation - Demo Public School',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #28a745; text-align: center;">Fee Payment Confirmation</h2>
          <p>Dear <strong>${studentData.studentName}</strong>,</p>
          <p>We have received your fee payment. Thank you for keeping your account up to date.</p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Payment Details:</h3>
            <p><strong>Month:</strong> ${feeData.month}</p>
            <p><strong>Year:</strong> ${feeData.year}</p>
            <p><strong>Total Amount:</strong> ₹${feeData.amount}</p>
            <p><strong>Amount Paid:</strong> ₹${feeData.paidAmount}</p>
            <p><strong>Payment Status:</strong> <span style="color: ${feeData.status === 'paid' ? '#28a745' : '#ffc107'}; font-weight: bold;">${feeData.status}</span></p>
            ${feeData.receiptNumber ? `<p><strong>Receipt Number:</strong> ${feeData.receiptNumber}</p>` : ''}
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Demo Public School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>`,
    }),
};

// Test export to verify module works
export const testExport = 'emailService is working';
