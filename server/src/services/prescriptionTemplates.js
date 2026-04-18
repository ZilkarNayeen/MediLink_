export function prescriptionEmailTemplate({ patientName, doctorOrService, medicationName, dosage, frequency, startDate, endDate, notes }) {
  return {
    subject: `📝 Your Prescription from ${doctorOrService || 'MediLink'}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📝 E-Prescription</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">Dr. ${doctorOrService || 'MediLink Physician'}</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #4B5563;">Your doctor has issued a new prescription for you. Please find the details below:</p>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 12px 0; color: #047857; font-size: 20px;">${medicationName}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;"><strong>Dosage</strong></td>
                <td style="padding: 8px 0; font-weight: 500; color: #111827;">${dosage}</td>
              </tr>
              <tr style="border-top: 1px solid #d1fae5;">
                <td style="padding: 8px 0; color: #6b7280;"><strong>Frequency</strong></td>
                <td style="padding: 8px 0; font-weight: 500; color: #111827;">${frequency}</td>
              </tr>
              <tr style="border-top: 1px solid #d1fae5;">
                <td style="padding: 8px 0; color: #6b7280;"><strong>Start Date</strong></td>
                <td style="padding: 8px 0; font-weight: 500; color: #111827;">${startDate}</td>
              </tr>
              ${endDate ? `
              <tr style="border-top: 1px solid #d1fae5;">
                <td style="padding: 8px 0; color: #6b7280;"><strong>End Date</strong></td>
                <td style="padding: 8px 0; font-weight: 500; color: #111827;">${endDate}</td>
              </tr>` : ''}
              ${notes ? `
              <tr style="border-top: 1px solid #d1fae5;">
                <td style="padding: 8px 0; color: #6b7280;"><strong>Additional Notes</strong></td>
                <td style="padding: 8px 0; font-weight: 500; color: #111827;">${notes}</td>
              </tr>` : ''}
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
            <strong>Important:</strong> Please take your medication exactly as prescribed. If you experience any severe side effects, please contact your doctor immediately or seek emergency medical care.
          </p>
          <center style="margin-top: 32px;">
            <a href="http://localhost:5173/dashboard" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in MediLink Portal</a>
          </center>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          &copy; MediLink Healthcare &bull; This is an automated message, please do not reply directly.
        </div>
      </div>
    `,
  }
}
