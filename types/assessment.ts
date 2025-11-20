import { SyncStatus, TriageLevel } from './patient'

export interface VitalsRecord {
  bloodPressure: string
  temperature: number
  heartRate: number
  oxygenLevel: number
}

export interface AssessmentRecord {
  id: string
  patientId: string
  createdBy: string
  createdAt: number
  updatedAt: number
  status: 'draft' | 'complete' | 'processing'
  triageLevel: TriageLevel
  probableConditions: Array<{ name: string; probability: number }>
  summary: string
  simplifiedSummary: string
  recommendedActions: string[]
  vitals: VitalsRecord
  symptoms: string[]
  notes: string
  photoUri?: string
  syncStatus: SyncStatus
}

export interface AssessmentPayload {
  patientId: string
  createdBy: string
  vitals: VitalsRecord
  symptoms: string[]
  notes: string
  triageLevel: TriageLevel
  probableConditions: Array<{ name: string; probability: number }>
  summary: string
  simplifiedSummary: string
  recommendedActions: string[]
  photoUri?: string
}




