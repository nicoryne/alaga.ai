export type TriageLevel = 'Mild' | 'Moderate' | 'Critical' | 'Unknown'

export type SyncStatus = 'pending' | 'synced' | 'error'

export type UserRole = 'superadmin' | 'doctor' | 'healthworker'

export interface PatientRecord {
  id: string
  healthWorkerId: string
  doctorId?: string
  fullName: string
  age: number
  gender: 'Male' | 'Female' | 'Other' | ''
  contactNumber?: string
  region: string
  province: string
  municipality: string
  barangay: string
  createdBy: string
  createdAt: number
  updatedAt: number
  latestAssessmentId?: string
  latestTriage?: TriageLevel
  syncStatus: SyncStatus
}

export interface PatientFormInput {
  fullName: string
  age: string
  gender: 'Male' | 'Female' | 'Other' | ''
  contactNumber: string
  region: string
  province: string
  municipality: string
  barangay: string
}
