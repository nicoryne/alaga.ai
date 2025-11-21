import {
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  AssessmentPayload,
  AssessmentRecord,
  VitalsRecord,
} from '../types/assessment'
import { db } from '../lib/firebase'

const ASSESSMENTS_COLLECTION = 'assessments'
const PATIENTS_COLLECTION = 'patients'

type AssessmentSubscriptionScope =
  | { healthWorkerId: string; doctorId?: undefined }
  | { doctorId: string; healthWorkerId?: undefined }

const normalizeAssessment = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
): AssessmentRecord => {
  const data = docSnap.data()
  const createdAt =
    typeof data.createdAt?.toMillis === 'function'
      ? data.createdAt.toMillis()
      : data.createdAt ?? Date.now()
  const updatedAt =
    typeof data.updatedAt?.toMillis === 'function'
      ? data.updatedAt.toMillis()
      : data.updatedAt ?? Date.now()

  return {
    id: docSnap.id,
    patientId: data.patientId,
    healthWorkerId: data.healthWorkerId ?? data.createdBy,
    doctorId: data.doctorId,
    createdBy: data.createdBy,
    createdAt,
    updatedAt,
    status: data.status ?? 'complete',
    triageLevel: data.triageLevel,
    probableConditions: data.probableConditions ?? [],
    summary: data.summary ?? '',
    simplifiedSummary: data.simplifiedSummary ?? '',
    recommendedActions: data.recommendedActions ?? [],
    vitals: data.vitals as VitalsRecord,
    symptoms: data.symptoms ?? [],
    notes: data.notes ?? '',
    photoUri: data.photoUri,
    syncStatus: data.syncStatus ?? 'pending',
  }
}

export const subscribeToAssessments = (
  scope: AssessmentSubscriptionScope,
  callback: (assessments: AssessmentRecord[]) => void,
) => {
  const constraints: QueryConstraint[] = []
  if ('healthWorkerId' in scope) {
    constraints.push(where('healthWorkerId', '==', scope.healthWorkerId))
  } else if ('doctorId' in scope) {
    constraints.push(where('doctorId', '==', scope.doctorId))
  } else {
    throw new Error('subscribeToAssessments requires a scope')
  }
  constraints.push(orderBy('createdAt', 'desc'))

  const assessmentQuery = query(
    collection(db, ASSESSMENTS_COLLECTION),
    ...constraints,
  )

  return onSnapshot(assessmentQuery, (snapshot) => {
    const records = snapshot.docs.map((docSnap) => {
      const record = normalizeAssessment(docSnap)
      const hasPendingWrites = docSnap.metadata.hasPendingWrites
      const syncStatus = hasPendingWrites ? 'pending' : 'synced'
      if (!hasPendingWrites && record.syncStatus !== 'synced') {
        updateDoc(docSnap.ref, { syncStatus: 'synced' }).catch(() => {})
      }
      return { ...record, syncStatus }
    })

    callback(records)
  })
}

export const createAssessmentRecord = async (payload: AssessmentPayload) => {
  const record = {
    ...payload,
    status: 'complete',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    syncStatus: 'pending',
  }

  const docRef = await addDoc(collection(db, ASSESSMENTS_COLLECTION), record)

  await updateDoc(doc(db, PATIENTS_COLLECTION, payload.patientId), {
    latestAssessmentId: docRef.id,
    latestTriage: payload.triageLevel,
    updatedAt: serverTimestamp(),
    syncStatus: 'pending',
  })

  return docRef.id
}


