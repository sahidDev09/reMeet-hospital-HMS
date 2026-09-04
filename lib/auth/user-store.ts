import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { AuthUser } from '@/lib/auth/types'
import type { Role } from '@/lib/data/types'

export interface StoredUser extends AuthUser {
  passwordHash?: string
  passwordSalt?: string
  createdAt: string
  updatedAt: string
  isFirstLogin?: boolean
}

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

/**
 * Hash password with PBKDF2
 */
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

/**
 * Verify password against stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
}

/**
 * Default Seed Users
 */
function getDefaultUsers(): StoredUser[] {
  const adminCreds = hashPassword('remeet2026', 'admin_salt_8472')
  const doctorCreds = hashPassword('remeet2026', 'doc_salt_9182')
  const staffCreds = hashPassword('remeet2026', 'staff_salt_1294')
  const patientCreds = hashPassword('remeet2026', 'patient_salt_3821')

  const now = new Date().toISOString()

  return [
    {
      id: 'usr_admin_01',
      name: 'Hospital Administrator',
      email: 'iambotforwork72@gmail.com',
      role: 'admin',
      provider: 'credentials',
      image: '/images/doctors/doc_02.jpg',
      designation: 'Chief Medical Director',
      department: 'Hospital Administration',
      passwordHash: adminCreds.hash,
      passwordSalt: adminCreds.salt,
      createdAt: now,
      updatedAt: now,
      isFirstLogin: false,
    },
    {
      id: 'doc_01',
      name: 'Dr. Eleanor Vance',
      email: 'dr.eleanor@remeet.health',
      role: 'doctor',
      provider: 'credentials',
      image: '/images/doctors/doc_01.jpg',
      designation: 'Senior Cardiologist',
      department: 'Cardiology',
      passwordHash: doctorCreds.hash,
      passwordSalt: doctorCreds.salt,
      createdAt: now,
      updatedAt: now,
      isFirstLogin: false,
    },
    {
      id: 'usr_staff_01',
      name: 'Sarah Jenkins',
      email: 'staff@remeet.health',
      role: 'staff',
      provider: 'credentials',
      image: '/images/doctors/doc_03.jpg',
      designation: 'Lead Reception Coordinator',
      department: 'Front Desk & Triage',
      passwordHash: staffCreds.hash,
      passwordSalt: staffCreds.salt,
      createdAt: now,
      updatedAt: now,
      isFirstLogin: false,
    },
    {
      id: 'usr_patient_01',
      name: 'Michael Ross',
      email: 'patient@remeet.health',
      role: 'patient',
      provider: 'credentials',
      image: '/images/doctors/doc_04.jpg',
      designation: 'Verified Patient',
      department: 'Outpatient Care',
      passwordHash: patientCreds.hash,
      passwordSalt: patientCreds.salt,
      createdAt: now,
      updatedAt: now,
      isFirstLogin: false,
    },
  ]
}

/**
 * Ensures data directory and users.json exist
 */
function ensureStorage(): StoredUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (!fs.existsSync(USERS_FILE)) {
      const initialUsers = getDefaultUsers()
      fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8')
      return initialUsers
    }

    const raw = fs.readFileSync(USERS_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoredUser[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initialUsers = getDefaultUsers()
      fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8')
      return initialUsers
    }

    return parsed
  } catch (error) {
    console.error('Error loading users.json:', error)
    return getDefaultUsers()
  }
}

/**
 * Saves users array to users.json
 */
function saveStorage(users: StoredUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving users.json:', error)
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const users = ensureStorage()
  const cleanEmail = email.toLowerCase().trim()
  return users.find((u) => u.email.toLowerCase().trim() === cleanEmail) || null
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = ensureStorage()
  return users.find((u) => u.id === id) || null
}

/**
 * Register a new user with email and password
 */
export async function registerUser(data: {
  name: string
  email: string
  password?: string
  role?: Role
}): Promise<{ user: AuthUser; isFirstLogin: boolean }> {
  const users = ensureStorage()
  const cleanEmail = data.email.toLowerCase().trim()

  const existing = users.find((u) => u.email.toLowerCase().trim() === cleanEmail)
  if (existing) {
    throw new Error('An account with this email already exists.')
  }

  const { hash, salt } = data.password ? hashPassword(data.password) : { hash: undefined, salt: undefined }
  const now = new Date().toISOString()
  const cleanRole: Role = data.role || 'staff'

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    email: cleanEmail,
    role: cleanRole,
    provider: 'credentials',
    image: '/images/doctors/doc_05.jpg',
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
    isFirstLogin: true,
  }

  users.push(newUser)
  saveStorage(users)

  const { passwordHash, passwordSalt, ...safeUser } = newUser
  return { user: safeUser, isFirstLogin: true }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password?: string
): Promise<{ user: AuthUser; isFirstLogin: boolean }> {
  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error('Account not found. Please create an account first.')
  }

  if (user.passwordHash && user.passwordSalt) {
    if (!password) {
      throw new Error('Password is required.')
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt)
    if (!isValid) {
      throw new Error('Incorrect password. Please try again.')
    }
  }

  const isFirst = !!user.isFirstLogin
  const { passwordHash, passwordSalt, ...safeUser } = user
  return { user: safeUser, isFirstLogin: isFirst }
}

/**
 * Find or create an OAuth user (Google / GitHub)
 */
export async function findOrCreateOAuthUser(data: {
  provider: 'google' | 'github'
  providerId: string
  email: string
  name: string
  image?: string
}): Promise<{ user: AuthUser; isNewUser: boolean }> {
  const users = ensureStorage()
  const cleanEmail = data.email.toLowerCase().trim()

  let user = users.find((u) => u.email.toLowerCase().trim() === cleanEmail)
  let isNewUser = false
  const now = new Date().toISOString()

  if (user) {
    // Update existing user with latest info
    user.updatedAt = now
    if (data.image && !user.image) {
      user.image = data.image
    }
  } else {
    // Create new OAuth user
    isNewUser = true
    const isAdmin = cleanEmail === 'iambotforwork72@gmail.com'
    user = {
      id: `${data.provider}_${data.providerId || Date.now()}`,
      name: data.name || (data.provider === 'google' ? 'Google User' : 'GitHub User'),
      email: cleanEmail,
      role: isAdmin ? 'admin' : 'staff',
      provider: data.provider,
      image: data.image || (data.provider === 'google' ? '/images/doctors/doc_02.jpg' : '/images/doctors/doc_03.jpg'),
      createdAt: now,
      updatedAt: now,
      isFirstLogin: true,
    }
    users.push(user)
  }

  saveStorage(users)

  const { passwordHash, passwordSalt, ...safeUser } = user
  return { user: safeUser, isNewUser: isNewUser || !!user.isFirstLogin }
}

/**
 * Update user role and mark onboarding complete
 */
export async function updateUserRole(userId: string, role: Role): Promise<AuthUser | null> {
  const users = ensureStorage()
  const user = users.find((u) => u.id === userId)
  if (!user) return null

  user.role = role
  user.isFirstLogin = false
  user.updatedAt = new Date().toISOString()

  saveStorage(users)

  const { passwordHash, passwordSalt, ...safeUser } = user
  return safeUser
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<StoredUser, 'name' | 'designation' | 'department' | 'image'>>
): Promise<AuthUser | null> {
  const users = ensureStorage()
  const user = users.find((u) => u.id === userId)
  if (!user) return null

  if (data.name) user.name = data.name
  if (data.designation) user.designation = data.designation
  if (data.department) user.department = data.department
  if (data.image) user.image = data.image
  user.updatedAt = new Date().toISOString()

  saveStorage(users)

  const { passwordHash, passwordSalt, ...safeUser } = user
  return safeUser
}
