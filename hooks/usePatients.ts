import { useEffect, useState } from 'react'
import { subscribeToPatients } from '../services/patientService'
import { PatientRecord } from '../types/patient'
import { useAuth } from '../contexts/AuthContext'

export function usePatients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPatients([])
      setLoading(false)
      return
    }
    const unsubscribe = subscribeToPatients(user.uid, (records) => {
      setPatients(records)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user?.uid])

  return { patients, loading }
}


