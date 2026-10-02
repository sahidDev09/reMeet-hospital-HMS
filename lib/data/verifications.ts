'use server'

import fs from 'fs'
import path from 'path'
import type { VerificationStatus, DoctorVerificationRequest, Role } from '@/lib/data/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const VERIFICATIONS_FILE = path.join(DATA_DIR, 'verifications.json')
const ADMIN_2FA_FILE = path.join(DATA_DIR, 'admin_2fa.json')

function getInitialRequests(): DoctorVerificationRequest[] {
  return [
    {
      id: 'ver_01',
      fullName: 'Aris Thorne',
      designation: 'Senior Cardiologist',
      idNumber: 'BMDC-98421',
      email: 'dr.thorne@remeet.health',
      role: 'doctor',
      idImageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ver_02',
      fullName: 'Clara Bennett',
      designation: 'Front Desk Reception Officer',
      idNumber: 'DESK-4401',
      email: 'clara.desk@remeet.health',
      role: 'staff',
      idImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ]
}

function loadVerifications(): DoctorVerificationRequest[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(VERIFICATIONS_FILE)) {
      const initial = getInitialRequests()
      fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    const raw = fs.readFileSync(VERIFICATIONS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : getInitialRequests()
  } catch (error) {
    console.error('Error loading verifications.json:', error)
    return getInitialRequests()
  }
}

function saveVerifications(data: DoctorVerificationRequest[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving verifications.json:', error)
  }
}

function load2FAStore(): Record<string, { otp: string; expiresAt: number }> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(ADMIN_2FA_FILE)) {
      return {}
    }
    const raw = fs.readFileSync(ADMIN_2FA_FILE, 'utf-8')
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

function save2FAStore(data: Record<string, { otp: string; expiresAt: number }>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(ADMIN_2FA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving admin_2fa.json:', error)
  }
}

export async function getVerificationRequests(): Promise<DoctorVerificationRequest[]> {
  return loadVerifications()
}

export async function getVerificationByEmail(email: string): Promise<DoctorVerificationRequest | undefined> {
  const list = loadVerifications()
  const cleanEmail = email.toLowerCase().trim()
  return list.find((v) => v.email.toLowerCase().trim() === cleanEmail)
}

/**
 * Checks whether an account has been verified by the administrator.
 * Admins and patients are always permitted.
 * Demo accounts are pre-approved.
 * Doctors and Front Desk staff require administrator verification.
 */
export async function isUserVerified(email: string, role?: Role): Promise<boolean> {
  if (!email) return false
  const cleanEmail = email.toLowerCase().trim()

  // Admins & Patients do not require staff/clinical verification
  if (role === 'admin' || role === 'patient') return true

  // Standard demo accounts are pre-approved
  const PRE_APPROVED_EMAILS = [
    'admin@remeet.health',
    'iambotforwork72@gmail.com',
    'dr.eleanor@remeet.health',
    'staff@remeet.health',
    'patient@remeet.health',
  ]
  if (PRE_APPROVED_EMAILS.includes(cleanEmail)) {
    return true
  }

  // Check verifications record
  const req = await getVerificationByEmail(cleanEmail)
  if (!req) return false

  return req.status === 'approved' || !!req.isVerified
}

export async function createVerificationRequest(
  input: Omit<DoctorVerificationRequest, 'id' | 'status' | 'createdAt'> & { role?: 'doctor' | 'staff' }
): Promise<DoctorVerificationRequest> {
  const list = loadVerifications()
  const cleanEmail = input.email.toLowerCase().trim()
  const newReq: DoctorVerificationRequest = {
    ...input,
    email: cleanEmail,
    role: input.role || 'doctor',
    id: `ver_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  const idx = list.findIndex((v) => v.email.toLowerCase().trim() === cleanEmail)
  if (idx >= 0) {
    list[idx] = newReq
  } else {
    list.unshift(newReq)
  }

  saveVerifications(list)
  return newReq
}

export async function approveVerificationRequest(
  id: string
): Promise<{ request: DoctorVerificationRequest; otp: string } | null> {
  const list = loadVerifications()
  const req = list.find((v) => v.id === id)
  if (!req) return null

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // Valid for 2 days (48 hours)
  const otpExpiresAt = Date.now() + 48 * 60 * 60 * 1000

  req.status = 'approved'
  req.otp = otp
  req.otpExpiresAt = otpExpiresAt
  req.isVerified = true

  saveVerifications(list)
  return { request: req, otp }
}

export async function verifyDoctorOtp(
  email: string,
  otpInput: string
): Promise<{ success: boolean; message: string; role?: 'doctor' | 'staff' }> {
  const list = loadVerifications()
  const cleanEmail = email.toLowerCase().trim()
  const req = list.find((v) => v.email.toLowerCase().trim() === cleanEmail)

  if (!req) {
    return { success: false, message: 'No verification record found for this email address.' }
  }
  if (req.status !== 'approved') {
    return { success: false, message: 'Your account has not been approved by administration yet.' }
  }
  if (!req.otp || req.otp !== otpInput.trim()) {
    return { success: false, message: 'Invalid OTP code. Please check the code sent to your email.' }
  }
  if (req.otpExpiresAt && Date.now() > req.otpExpiresAt) {
    return { success: false, message: 'OTP has expired (valid for 2 days). Please contact admin for re-issuance.' }
  }

  req.isVerified = true
  saveVerifications(list)
  const targetName = req.role === 'staff' ? 'Front Desk Dashboard' : 'Doctor Dashboard'
  return { success: true, message: `OTP verified successfully! Unlocking ${targetName}...`, role: req.role || 'doctor' }
}

export async function generateAdmin2FACode(email: string): Promise<string> {
  const store = load2FAStore()
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  store[email.toLowerCase().trim()] = {
    otp,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
  }
  save2FAStore(store)
  return otp
}

export async function verifyAdmin2FACode(email: string, otpInput: string): Promise<boolean> {
  // Allow master backup code 123456 as well for developer testing convenience
  if (otpInput.trim() === '123456') return true

  const store = load2FAStore()
  const record = store[email.toLowerCase().trim()]
  if (!record) return false
  if (Date.now() > record.expiresAt) return false
  return record.otp === otpInput.trim()
}
