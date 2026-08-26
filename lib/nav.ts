import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Pill,
  Receipt,
  ScanLine,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/lib/data/types'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

export type NavGroup = {
  /** Groups are labelled by what the person is doing, not by system area. */
  label: string
  items: NavItem[]
}

const ALL: Role[] = ['admin', 'doctor', 'staff']

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'staff'],
      },
      { href: '/portal', label: 'My clinic', icon: Activity, roles: ['doctor'] },
      { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
    ],
  },
  {
    label: 'Care',
    items: [
      { href: '/appointments', label: 'Appointments', icon: CalendarDays, roles: ALL },
      { href: '/patients', label: 'Patients', icon: Users, roles: ALL },
      { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList, roles: ALL },
      { href: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Counter',
    items: [
      { href: '/pharmacy', label: 'Pharmacy', icon: Pill, roles: ['admin', 'staff'] },
      { href: '/pos', label: 'Point of sale', icon: ScanLine, roles: ['admin', 'staff'] },
      { href: '/billing', label: 'Billing', icon: Receipt, roles: ['admin', 'staff'] },
    ],
  },
]

/** The nav a given role actually sees — empty groups drop out entirely. */
export function navFor(role: Role): NavGroup[] {
  return NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}
