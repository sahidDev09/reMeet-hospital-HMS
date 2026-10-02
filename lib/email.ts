'use server'

import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || ''
  return new Resend(apiKey)
}

const FROM_EMAIL = 'onboarding@resend.dev'
const ADMIN_EMAIL = 'iambotforwork72@gmail.com'

export async function sendDoctorVerificationEmailToAdmin(data: {
  fullName: string
  designation: string
  idNumber: string
  email: string
  idImageName?: string
}) {
  try {
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Doctor Verification Request - Dr. ${data.fullName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0d9488; margin-top: 0;">👨‍⚕️ New Doctor Verification Submitted</h2>
          <p>A new doctor has registered and submitted their details for verification:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Full Name:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${data.fullName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Designation:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${data.designation}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">ID Number:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${data.idNumber}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${data.email}</td></tr>
            ${data.idImageName ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Uploaded ID File:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${data.idImageName}</td></tr>` : ''}
          </table>
          <p style="margin-top: 20px;">Please log in to the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin-login" style="color: #0d9488; text-decoration: underline;">reMeet Admin Portal</a> to review and approve this verification request.</p>
        </div>
      `,
    })
    return { success: true, id: result.data?.id }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Failed to send doctor verification email to admin:', err)
    return { success: false, error: err.message }
  }
}

export async function sendDoctorApprovalOtpEmail(doctorEmail: string, doctorName: string, otp: string) {
  try {
    const resend = getResendClient()
    const targetEmail = doctorEmail?.trim() || ADMIN_EMAIL

    // Try sending directly to doctorEmail
    const sendDirect = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      subject: 'reMeet Hospital - Doctor Account Approved (Your OTP Code)',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0d9488; margin-top: 0;">🎉 Doctor Verification Approved!</h2>
          <p>Dear Dr. <strong>${doctorName}</strong>,</p>
          <p>Your verification details have been reviewed and approved by our administration team.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Your One-Time Password (OTP):</p>
            <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 6px; color: #0d9488; font-family: monospace;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #15803d;">⏱️ Note: This OTP is valid for <strong>2 days (48 hours)</strong>.</p>
          </div>
          <p>Use this OTP code on your next login to unlock your Doctor Dashboard.</p>
          <p>Best regards,<br/>reMeet Hospital Administration</p>
        </div>
      `,
    })

    if (!sendDirect.error) {
      return { success: true, id: sendDirect.data?.id }
    }

    // If Resend rejected sending due to unverified domain in free tier, fallback to verified ADMIN_EMAIL
    console.warn('Direct send to doctor email returned error, attempting fallback to admin:', sendDirect.error.message)
    const fallbackSend = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[For Dr. ${doctorName} (${targetEmail})] reMeet Hospital - Doctor Account Approved (OTP: ${otp})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px; color: #92400e;">
            <strong>Notice:</strong> Forwarded to admin because recipient domain (${targetEmail}) is not verified on your Resend account.
          </div>
          <h2 style="color: #0d9488; margin-top: 0;">🎉 Doctor Verification Approved!</h2>
          <p>Doctor: <strong>Dr. ${doctorName}</strong> (${targetEmail})</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Your One-Time Password (OTP):</p>
            <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 6px; color: #0d9488; font-family: monospace;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #15803d;">⏱️ Note: This OTP is valid for <strong>2 days (48 hours)</strong>.</p>
          </div>
          <p>Best regards,<br/>reMeet Hospital Administration</p>
        </div>
      `,
    })

    return { success: true, id: fallbackSend.data?.id, fallback: true }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Failed to send approval OTP email:', err)
    return { success: false, error: err.message }
  }
}

export async function sendAdmin2FAOtpEmail(adminEmail: string, otp: string) {
  try {
    const resend = getResendClient()
    const targetEmail = adminEmail?.trim() || ADMIN_EMAIL

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      subject: `reMeet Hospital Admin - 2FA Security Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0d9488; margin-top: 0;">🔐 Admin Two-Factor Authentication</h2>
          <p>You are attempting to log into the reMeet Hospital Administration Portal.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Your 2FA Verification Code:</p>
            <h1 style="margin: 10px 0; font-size: 32px; letter-spacing: 6px; color: #0d9488; font-family: monospace;">${otp}</h1>
            <p style="margin: 0; font-size: 12px; color: #15803d;">Valid for 15 minutes.</p>
          </div>
          <p>If you did not initiate this login request, please secure your account immediately.</p>
        </div>
      `,
    })
    return { success: true, id: result.data?.id }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Failed to send admin 2FA email:', err)
    return { success: false, error: err.message }
  }
}
