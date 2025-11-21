import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToPatients } from '../services/patientService'
import { PatientRecord } from '../types/patient'

export function usePatients() {
  const { user, profile } = useAuth()
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || profile?.role !== 'healthworker') {
      setPatients([])
      setLoading(false)
      return
    }
    const unsubscribe = subscribeToPatients(
      { healthWorkerId: user.uid },
      (records) => {
        setPatients(records)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [user, user?.uid, profile?.role])

  return { patients, loading }
}
