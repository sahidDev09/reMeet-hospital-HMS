export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export type DoctorVerificationRequest = {
  id: string
  fullName: string
  designation: string
  idNumber: string
  email: string
  idImageUrl?: string
  status: VerificationStatus
  otp?: string
  otpExpiresAt?: number
  isVerified?: boolean
  createdAt: string
}

// Initial mock data with 1 pending verification request
let verificationRequests: DoctorVerificationRequest[] = [
  {
    id: 'ver_01',
    fullName: 'Aris Thorne',
    designation: 'Senior Cardiologist',
    idNumber: 'BMDC-98421',
    email: 'dr.thorne@remeet.health',
    idImageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
]

let admin2FAStore: Record<string, { otp: string; expiresAt: number }> = {}

export async function getVerificationRequests(): Promise<DoctorVerificationRequest[]> {
  return verificationRequests
}

export async function getVerificationByEmail(email: string): Promise<DoctorVerificationRequest | undefined> {
  return verificationRequests.find((v) => v.email.toLowerCase() === email.toLowerCase())
}

export async function createVerificationRequest(input: Omit<DoctorVerificationRequest, 'id' | 'status' | 'createdAt'>): Promise<DoctorVerificationRequest> {
  const newReq: DoctorVerificationRequest = {
    ...input,
    id: `ver_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  // Replace existing if same email
  const idx = verificationRequests.findIndex((v) => v.email.toLowerCase() === input.email.toLowerCase())
  if (idx >= 0) {
    verificationRequests[idx] = newReq
  } else {
    verificationRequests.unshift(newReq)
  }
  return newReq
}

export async function approveVerificationRequest(id: string): Promise<{ request: DoctorVerificationRequest; otp: string } | null> {
  const req = verificationRequests.find((v) => v.id === id)
  if (!req) return null

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Valid for 2 days (48 hours)
  const otpExpiresAt = Date.now() + 48 * 60 * 60 * 1000

  req.status = 'approved'
  req.otp = otp
  req.otpExpiresAt = otpExpiresAt

  return { request: req, otp }
}

export async function verifyDoctorOtp(email: string, otpInput: string): Promise<{ success: boolean; message: string }> {
  const req = verificationRequests.find((v) => v.email.toLowerCase() === email.toLowerCase())
  if (!req) {
    return { success: false, message: 'No verification record found for this email.' }
  }
  if (req.status !== 'approved') {
    return { success: false, message: 'Your account has not been approved by administration yet.' }
  }
  if (!req.otp || req.otp !== otpInput.trim()) {
    return { success: false, message: 'Invalid OTP code. Please check your email.' }
  }
  if (req.otpExpiresAt && Date.now() > req.otpExpiresAt) {
    return { success: false, message: 'OTP has expired (valid for 2 days). Please contact admin for re-issuance.' }
  }

  req.isVerified = true
  return { success: true, message: 'OTP verified successfully! Unlocking Doctor Dashboard...' }
}

export async function generateAdmin2FACode(email: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  admin2FAStore[email.toLowerCase()] = {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
  }
  return otp
}

export async function verifyAdmin2FACode(email: string, otpInput: string): Promise<boolean> {
  // Allow master backup code 123456 as well for developer testing convenience
  if (otpInput.trim() === '123456') return true

  const record = admin2FAStore[email.toLowerCase()]
  if (!record) return false
  if (Date.now() > record.expiresAt) return false
  return record.otp === otpInput.trim()
}
