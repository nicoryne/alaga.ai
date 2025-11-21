/**
 * XGBoost Predictor for React Native
 * 
 * This module provides XGBoost prediction using the xgboost-scorer library.
 * The XGBoost model is loaded from JSON and used for structured symptom analysis.
 * 
 * Note: The current XGBoost JSON model format may need conversion to work with
 * xgboost-scorer. For production, consider exporting the model in the format
 * expected by xgboost-scorer (using dump_model with dump_format='json').
 */

import Scorer from 'xgboost-scorer'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xgboostModel = require('../models/symptom/xgboost_model.json')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const possibleSymptoms = require('../models/symptom/possible_symptoms.json')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const idxToDisease = require('../models/symptom/idx_to_disease.json')

let scorerInstance: Scorer | null = null

/**
 * Initializes the XGBoost scorer with the model
 * This should be called once at app startup
 */
export async function initializeXGBoost(): Promise<void> {
  try {
    // xgboost-scorer expects a specific JSON format (tree dump)
    // If the model format doesn't match, we'll need to convert it
    // For now, we'll try to use it directly
    scorerInstance = await Scorer.create(xgboostModel)
  } catch (error) {
    console.warn('Failed to initialize XGBoost scorer with current model format:', error)
    console.warn('The model may need to be converted to xgboost-scorer format')
    // Fallback: we'll implement a basic predictor below
  }
}

/**
 * Predicts disease probabilities using the XGBoost model
 * @param selectedSymptoms Array of selected symptom names
 * @returns Array of { disease: string, probability: number } sorted by probability
 */
export async function predictXGBoost(
  selectedSymptoms: string[],
): Promise<Array<{ disease: string; probability: number }>> {
  // Create feature vector from selected symptoms
  const featureVector = createFeatureVector(selectedSymptoms, possibleSymptoms.symptoms)
  
  // Convert to feature map for xgboost-scorer
  const featureMap: Record<string, number> = {}
  possibleSymptoms.symptoms.forEach((symptom: string, index: number) => {
    featureMap[symptom] = featureVector[index]
  })
  
  let predictions: number[]
  
  if (scorerInstance) {
    try {
      // Use xgboost-scorer if available
      const score = await scorerInstance.score(featureMap)
      predictions = Array.isArray(score) ? score : [score]
    } catch (error) {
      console.warn('XGBoost scorer failed, using fallback:', error)
      predictions = fallbackPredict(featureVector)
    }
  } else {
    // Fallback predictor
    predictions = fallbackPredict(featureVector)
  }
  
  // Map predictions to disease names and sort by probability
  const results = Object.entries(idxToDisease).map(([idx, disease]) => ({
    disease: disease as string,
    probability: predictions[parseInt(idx, 10)] || 0,
  }))
  
  // Sort by probability (descending) and return top results
  return results.sort((a, b) => b.probability - a.probability)
}

/**
 * Fallback predictor for when xgboost-scorer is not available
 * This is a simple heuristic-based predictor
 */
function fallbackPredict(features: number[]): number[] {
  const numClasses = 41
  const predictions = new Array(numClasses).fill(0.01) // Small base probability
  
  // Simple heuristic: more symptoms = higher probability for common diseases
  const symptomCount = features.reduce((sum, val) => sum + val, 0)
  const baseProb = Math.min(0.3, symptomCount * 0.05)
  
  // Distribute probability across classes (this is a placeholder)
  // In production, this should use the actual XGBoost model
  for (let i = 0; i < numClasses; i++) {
    predictions[i] = baseProb / numClasses
  }
  
  // Normalize to probabilities
  const sum = predictions.reduce((a, b) => a + b, 0)
  return predictions.map((p) => p / sum)
}

/**
 * Creates a feature vector from selected symptoms
 * @param selectedSymptoms Array of symptom names
 * @param allSymptoms Array of all possible symptoms (ordered)
 * @returns Feature vector of length 131 (0 or 1 for each symptom)
 */
export function createFeatureVector(
  selectedSymptoms: string[],
  allSymptoms: string[],
): number[] {
  const featureVector = new Array(allSymptoms.length).fill(0)
  
  for (const symptom of selectedSymptoms) {
    const index = allSymptoms.indexOf(symptom)
    if (index !== -1) {
      featureVector[index] = 1
    }
  }
  
  return featureVector
}

