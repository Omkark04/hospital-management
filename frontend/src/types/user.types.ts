import type { Role } from '@/config/roles'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: Role
  branch: string | null
  branch_name: string | null
  avatar: string
  date_joined: string
}
