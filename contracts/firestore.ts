import { PatientRecord } from '../types/patient'
import { AssessmentRecord } from '../types/assessment'

export const COLLECTIONS = {
  patients: 'patients',
  assessments: 'assessments',
}

export type PatientDTO = Omit<
  PatientRecord,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus'
> & {
  createdAt: number
  updatedAt: number
  syncStatus: 'pending' | 'synced' | 'error'
}

export type AssessmentDTO = Omit<
  AssessmentRecord,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus'
> & {
  createdAt: number
  updatedAt: number
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface SyncEnvelope {
  patients: PatientDTO[]
  assessments: AssessmentDTO[]
  lastSyncedAt: number
}


