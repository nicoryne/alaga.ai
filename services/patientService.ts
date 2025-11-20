import {
  QueryDocumentSnapshot,
  DocumentData,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { PatientFormInput, PatientRecord } from '../types/patient'

const PATIENTS_COLLECTION = 'patients'

const normalizePatient = (
  docSnap: QueryDocumentSnapshot<DocumentData>,
) => {
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
    fullName: data.fullName ?? '',
    age: data.age ?? 0,
    gender: data.gender ?? '',
    contactNumber: data.contactNumber,
    region: data.region ?? '',
    province: data.province ?? '',
    municipality: data.municipality ?? '',
    barangay: data.barangay ?? '',
    createdBy: data.createdBy ?? '',
    createdAt,
    updatedAt,
    latestAssessmentId: data.latestAssessmentId,
    latestTriage: data.latestTriage ?? 'Unknown',
    syncStatus: data.syncStatus ?? 'pending',
  } as PatientRecord
}

export const subscribeToPatients = (
  userId: string,
  callback: (patients: PatientRecord[]) => void,
) => {
  const patientQuery = query(
    collection(db, PATIENTS_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('updatedAt', 'desc'),
  )

  return onSnapshot(patientQuery, (snapshot) => {
    const records = snapshot.docs.map((docSnap) => {
      const record = normalizePatient(docSnap)
      const hasPendingWrites = docSnap.metadata.hasPendingWrites
      const syncStatus = hasPendingWrites ? 'pending' : 'synced'

      if (!hasPendingWrites && record.syncStatus !== 'synced') {
        setDoc(docSnap.ref, { syncStatus: 'synced' }, { merge: true }).catch(
          () => {},
        )
      }

      return { ...record, syncStatus }
    })
    callback(records)
  })
}

export const createPatient = async (
  input: PatientFormInput,
  userId: string,
) => {
  const payload = {
    fullName: input.fullName,
    age: Number(input.age),
    gender: input.gender,
    contactNumber: input.contactNumber,
    region: input.region,
    province: input.province,
    municipality: input.municipality,
    barangay: input.barangay,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    syncStatus: 'pending',
  }

  const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), payload)
  // Guarantee updatedAt exists for offline scenarios without serverTimestamp
  await setDoc(
    doc(db, PATIENTS_COLLECTION, docRef.id),
    { id: docRef.id },
    { merge: true },
  )
  return docRef.id
}


