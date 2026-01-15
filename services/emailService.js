// Email service for sending emails via Vercel serverless function

const API_BASE_URL = 'https://schooldemo.akamify.com';

// Send email function
export const sendEmail = async (emailData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send email');
        }

        return result;
    } catch (error) {
        console.error('Email service error:', error);
        throw error;
    }
};

// Send fee payment email
export const sendFeeAddedEmail = async (studentData, feeData) => {
    try {
        await sendEmail(emailTemplates.feePayment(studentData, feeData));
        console.log("Fee payment email sent successfully");
    } catch (error) {
        console.error("Failed to send fee payment email:", error);
        // Don't throw error to avoid breaking the fee submission process
    }
};

// Email templates
export const emailTemplates = {
    // Student registration confirmation
    studentRegistration: (studentData) => ({
        to: studentData.email,
        subject: 'Welcome to Demo Public School - Registration Confirmation',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #007bff; text-align: center;">Welcome to Demo Public School!</h2>
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
          
          <p style="text-align: center; margin-top: 30px;">
            <strong>Next Steps:</strong> Please visit the school office with original documents for verification.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Demo Public School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    `,
    }),

    // Class assignment notification
    classAssignment: (studentData, classData, sessionData) => ({
        to: studentData.email,
        subject: 'Class Assignment - Demo Public School',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
          
          <p style="text-align: center; margin-top: 30px;">
            Please report to the class coordinator on the first day of the session.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Akamify School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    `,
    }),

    // Student profile update notification
    profileUpdate: (studentData) => ({
        to: studentData.email,
        subject: 'Profile Updated - Demo Public School',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ffc107; text-align: center;">Profile Updated</h2>
          <p>Dear <strong>${studentData.studentName}</strong>,</p>
          <p>Your profile information has been successfully updated in our system.</p>
          
          <p>If you did not make these changes, please contact the school administration immediately.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Demo Public School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    `,
    }),

    // Result notification
    resultNotification: (studentData, resultData) => ({
        to: studentData.email,
        subject: 'Academic Results - Demo Public School',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #17a2b8; text-align: center;">Academic Results</h2>
          <p>Dear <strong>${studentData.studentName}</strong>,</p>
          <p>Your academic results have been published.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Result Details:</h3>
            <p><strong>Class:</strong> ${resultData.className}</p>
            <p><strong>Session:</strong> ${resultData.sessionName}</p>
            <p><strong>Result Status:</strong> <span style="color: ${resultData.resultStatus === 'Pass' ? '#28a745' : '#dc3545'}; font-weight: bold;">${resultData.resultStatus}</span></p>
            <p><strong>Grade:</strong> <span style="color: #007bff; font-weight: bold;">${resultData.grade}</span></p>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            Please collect your detailed mark sheet from the school office.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0;">
              Demo Public School<br>
              Contact: ${process.env.REACT_APP_SCHOOL_PHONE || 'N/A'}<br>
              Email: ${process.env.REACT_APP_SCHOOL_EMAIL || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    `,
    }),
};
