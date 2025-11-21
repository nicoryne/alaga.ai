import { CommonSymptom } from '../constants/symptoms'
import { predictXGBoost } from './xgboost-predictor'
import { predictTransformer, combineSymptomsToText } from './transformer-predictor'
import {
  fusePredictions,
  getTopPredictions,
  filterByThreshold,
  DiseasePrediction,
} from './fusion-layer'

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

/**
 * Determines triage level based on vitals and symptoms
 */
function determineTriageLevel(
  vitals: AssessmentInputs['vitals'],
  topCondition: DiseasePrediction | null,
): AssessmentResult['triageLevel'] {
  // Critical conditions
  if (
    vitals.heartRate >= TRIAGE_THRESHOLDS.criticalHeartRate ||
    vitals.oxygenLevel <= TRIAGE_THRESHOLDS.lowOxygen
  ) {
    return 'Critical'
  }

  // Check for critical diseases
  const criticalDiseases = [
    'Heart attack',
    'Paralysis (brain hemorrhage)',
    'AIDS',
    'Tuberculosis',
  ]
  if (topCondition && criticalDiseases.includes(topCondition.disease)) {
    return 'Critical'
  }

  // Moderate conditions
  if (
    vitals.temperature >= TRIAGE_THRESHOLDS.highTemperature ||
    topCondition?.disease === 'Pneumonia' ||
    topCondition?.disease === 'Bronchial Asthma'
  ) {
    return 'Moderate'
  }

  return 'Mild'
}

/**
 * Generates recommended actions based on triage level and top conditions
 */
function generateRecommendedActions(
  triageLevel: AssessmentResult['triageLevel'],
  topConditions: DiseasePrediction[],
): string[] {
  const actions: string[] = []

  if (triageLevel === 'Critical') {
    actions.push('Refer to nearest hospital immediately.')
    actions.push('Monitor airway, breathing, and circulation.')
    actions.push('Do not delay seeking emergency medical care.')
  } else if (triageLevel === 'Moderate') {
    actions.push('Schedule a clinic follow-up within 24 hours.')
    actions.push('Provide hydration and monitor vitals regularly.')
    if (topConditions[0]?.disease === 'Pneumonia') {
      actions.push('Monitor breathing and seek care if symptoms worsen.')
    }
  } else {
    actions.push('Advise rest and hydration.')
    actions.push('Reassess if symptoms persist beyond 48 hours.')
    if (topConditions[0]?.disease === 'Common Cold') {
      actions.push('Over-the-counter cold medications may help.')
    }
  }

  return actions
}

/**
 * Generates a simplified explanation in Filipino/Tagalog
 */
function generateSimplifiedSummary(
  triageLevel: AssessmentResult['triageLevel'],
  topCondition: DiseasePrediction | null,
): string {
  if (triageLevel === 'Critical') {
    return 'Kailangan ng agarang atensyong medikal. Pumunta sa pinakamalapit na ospital kaagad.'
  }

  if (triageLevel === 'Moderate') {
    return 'Kailangan ng pagsusuri sa loob ng 24 na oras. Bantayan ang sintomas at magpahinga.'
  }

  if (topCondition) {
    return `Mukhang ${topCondition.disease.toLowerCase()} ang kondisyon. Magpahinga, uminom ng tubig, at bantayan ang sintomas.`
  }

  return 'Mukhang mild ang kondisyon ngayon. Magpahinga, uminom ng tubig, at bantayan ang sintomas.'
}

/**
 * Main assessment function using hybrid AI models
 */
export async function runAssessment(
  inputs: AssessmentInputs,
): Promise<AssessmentResult> {
  try {
    // Run both models in parallel
    const [xgboostResults, transformerResults] = await Promise.all([
      // XGBoost: structured symptom features
      predictXGBoost(inputs.symptoms).catch((error) => {
        console.warn('XGBoost prediction failed:', error)
        return []
      }),
      // Transformer: text-based analysis
      predictTransformer(combineSymptomsToText(inputs.symptoms, inputs.notes)).catch(
        (error) => {
          console.warn('Transformer prediction failed:', error)
          return []
        },
      ),
    ])

    // Fuse predictions from both models
    let fusedPredictions: DiseasePrediction[] = []
    if (xgboostResults.length > 0 && transformerResults.length > 0) {
      fusedPredictions = fusePredictions(xgboostResults, transformerResults)
    } else if (xgboostResults.length > 0) {
      fusedPredictions = xgboostResults
    } else if (transformerResults.length > 0) {
      fusedPredictions = transformerResults
    } else {
      // Fallback if both models fail
      fusedPredictions = [
        { disease: 'Common Cold', probability: 0.3 },
        { disease: 'Viral Infection', probability: 0.2 },
        { disease: 'Allergy', probability: 0.1 },
      ]
    }

    // Filter and get top predictions
    const filtered = filterByThreshold(fusedPredictions, 0.01)
    const topConditions = getTopPredictions(filtered, 5)

    // Determine triage level
    const triageLevel = determineTriageLevel(inputs.vitals, topConditions[0] || null)

    // Generate recommendations
    const recommendedActions = generateRecommendedActions(triageLevel, topConditions)

    // Generate explanation
    const explanation = `Based on ${inputs.symptoms.length} symptom${
      inputs.symptoms.length !== 1 ? 's' : ''
    } and vital signs, the assessment suggests ${topConditions[0]?.disease || 'a condition'} with ${
      topConditions[0]?.probability
        ? `${(topConditions[0].probability * 100).toFixed(1)}%`
        : 'moderate'
    } confidence.`

    // Generate simplified summary
    const simplifiedSummary = generateSimplifiedSummary(triageLevel, topConditions[0] || null)

    return {
      triageLevel,
      explanation,
      probableConditions: topConditions.map((pred) => ({
        name: pred.disease,
        probability: pred.probability,
      })),
      recommendedActions,
      simplifiedSummary,
    }
  } catch (error) {
    console.error('Assessment failed:', error)
    // Fallback response
    return {
      triageLevel: 'Mild',
      explanation: 'Assessment could not be completed. Please try again.',
      probableConditions: [
        { name: 'Unable to assess', probability: 1.0 },
      ],
      recommendedActions: [
        'Please ensure all symptoms are entered correctly.',
        'Try again or consult a healthcare provider.',
      ],
      simplifiedSummary:
        'Hindi ma-assess ang kondisyon. Pakisubukan ulit o kumonsulta sa doktor.',
    }
  }
}


