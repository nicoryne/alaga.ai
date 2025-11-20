import { CommonSymptom } from '../constants/symptoms'

export type AssessmentInputs = {
  patientName: string
  vitals: {
    bloodPressure: string
    temperature: number
    heartRate: number
    oxygenLevel: number
  }
  symptoms: CommonSymptom[]
  notes: string
}

export type AssessmentResult = {
  triageLevel: 'Mild' | 'Moderate' | 'Critical'
  explanation: string
  probableConditions: Array<{ name: string; probability: number }>
  recommendedActions: string[]
  simplifiedSummary: string
}

const TRIAGE_THRESHOLDS = {
  criticalHeartRate: 120,
  lowOxygen: 92,
  highTemperature: 38.5,
}

export async function runAssessment(
  inputs: AssessmentInputs,
): Promise<AssessmentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const { vitals, symptoms } = inputs
  let triageLevel: AssessmentResult['triageLevel'] = 'Mild'

  if (
    vitals.heartRate >= TRIAGE_THRESHOLDS.criticalHeartRate ||
    vitals.oxygenLevel <= TRIAGE_THRESHOLDS.lowOxygen
  ) {
    triageLevel = 'Critical'
  } else if (
    vitals.temperature >= TRIAGE_THRESHOLDS.highTemperature ||
    symptoms.includes('Shortness of Breath')
  ) {
    triageLevel = 'Moderate'
  }

  const probableConditions = [
    { name: 'Viral Infection', probability: triageLevel === 'Mild' ? 0.58 : 0.34 },
    {
      name: 'Respiratory Issue',
      probability: triageLevel === 'Critical' ? 0.66 : 0.28,
    },
    { name: 'Dehydration', probability: 0.18 },
  ]

  const recommendedActions: string[] = []
  if (triageLevel === 'Critical') {
    recommendedActions.push(
      'Refer to nearest hospital immediately.',
      'Monitor airway, breathing, and circulation.',
    )
  } else if (triageLevel === 'Moderate') {
    recommendedActions.push(
      'Schedule a clinic follow-up within 24 hours.',
      'Provide hydration and monitor vitals regularly.',
    )
  } else {
    recommendedActions.push(
      'Advise rest and hydration.',
      'Reassess if symptoms persist beyond 48 hours.',
    )
  }

  return {
    triageLevel,
    explanation: `Assessment generated for ${inputs.patientName}.`,
    probableConditions,
    recommendedActions,
    simplifiedSummary:
      'Mukhang mild ang kondisyon ngayon. Magpahinga, uminom ng tubig, at bantayan ang sintomas.',
  }
}


