import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToAssessments } from '../services/assessmentService'
import { AssessmentRecord } from '../types/assessment'

export function useAssessments() {
  const { user, profile } = useAuth()
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || profile?.role !== 'healthworker') {
      setAssessments([])
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToAssessments(
      { healthWorkerId: user.uid },
      (records) => {
        setAssessments(records)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, user?.uid, profile?.role])

  return { assessments, loading }
}
