import { useEffect, useState } from 'react'
import { subscribeToAssessments } from '../services/assessmentService'
import { AssessmentRecord } from '../types/assessment'
import { useAuth } from '../contexts/AuthContext'

export function useAssessments() {
  const { user } = useAuth()
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAssessments([])
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToAssessments(user.uid, (records) => {
      setAssessments(records)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  return { assessments, loading }
}


