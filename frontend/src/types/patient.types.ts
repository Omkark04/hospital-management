export interface Patient {
  id: string
  uhid: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  blood_group: string
  phone: string
  email: string
  address: string
  branch: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicalHistory {
  id: string
  patient: string
  condition: string
  notes: string
  diagnosed_at: string | null
  is_chronic: boolean
  created_at: string
}
