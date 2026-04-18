export function appointmentConfirmationEmail({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  return {
    subject: `✅ Appointment Confirmed — MediLink`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #5B84FA, #3B5FCC); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">MediLink</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">Appointment Confirmation</p>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${patientName}</strong>,</p>
          <p>Your appointment has been successfully booked:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #6b7280;">Doctor / Service</td><td style="padding: 8px; font-weight: 600;">${doctorOrService || 'General'}</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Date</td><td style="padding: 8px; font-weight: 600;">${appointmentDate}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280;">Time</td><td style="padding: 8px; font-weight: 600;">${appointmentTime}</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">If you need to reschedule, please log in to your MediLink account.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}

export function appointmentReminderEmail({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  return {
    subject: `⏰ Appointment Reminder — Tomorrow at ${appointmentTime}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Reminder</h1>
          <p style="margin: 4px 0 0; opacity: 0.9;">Your appointment is tomorrow!</p>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${patientName}</strong>,</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #6b7280;">Doctor / Service</td><td style="padding: 8px; font-weight: 600;">${doctorOrService || 'General'}</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Date</td><td style="padding: 8px; font-weight: 600;">${appointmentDate}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280;">Time</td><td style="padding: 8px; font-weight: 600;">${appointmentTime}</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Please arrive 10 minutes early. If you can't make it, log in to MediLink to reschedule.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}

export function followUpReminderEmail({ patientName, doctorOrService, originalDate }) {
  return {
    subject: `📋 Follow-Up Reminder — MediLink`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📋 Follow-Up Reminder</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${patientName}</strong>,</p>
          <p>Based on your consultation on <strong>${originalDate}</strong> with <strong>${doctorOrService || 'your doctor'}</strong>, it's time to schedule a follow-up appointment.</p>
          <p>Please log in to MediLink to book your follow-up appointment at your convenience.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}

export function followUpApprovedEmail({ patientName, doctorOrService, originalDate }) {
  return {
    subject: `✅ Follow-Up Approved — MediLink`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #5B84FA, #3B5FCC); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Follow-Up Approved</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${patientName}</strong>,</p>
          <p>Your follow-up request for the consultation on <strong>${originalDate}</strong> with <strong>${doctorOrService || 'your doctor'}</strong> has been <strong style="color: #059669;">approved</strong>.</p>
          <p>Please log in to MediLink to schedule your follow-up appointment.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}

export function followUpRequestNotifyDoctorEmail({ patientName, originalDate, reason }) {
  return {
    subject: `📋 New Follow-Up Request from ${patientName}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Follow-Up Request</h1>
        </div>
        <div style="padding: 24px;">
          <p>A patient has requested a follow-up appointment:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #6b7280;">Patient</td><td style="padding: 8px; font-weight: 600;">${patientName}</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Original Consultation</td><td style="padding: 8px; font-weight: 600;">${originalDate}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280;">Reason</td><td style="padding: 8px; font-weight: 600;">${reason}</td></tr>
          </table>
          <p>Please log in to your MediLink Doctor Dashboard to review and approve/reject this request.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}

export function medicationAlertEmail({ patientName, medicationName, dosage, time }) {
  return {
    subject: `💊 Medication Reminder — ${medicationName}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">💊 Medication Time</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${patientName}</strong>,</p>
          <p>It's time to take your medication:</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #6D28D9;">${medicationName}</p>
            <p style="margin: 4px 0 0; color: #6b7280;">Dosage: ${dosage} &bull; Scheduled: ${time}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Always take medication as prescribed by your doctor.</p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; MediLink Healthcare &bull; Automated message, do not reply
        </div>
      </div>
    `,
  }
}
