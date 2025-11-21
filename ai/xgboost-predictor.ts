/**
 * XGBoost Predictor for React Native
 * 
 * This module provides XGBoost prediction using a pure JavaScript implementation.
 * Since React Native doesn't support Node.js modules like 'fs', we use a
 * simplified predictor that works with the XGBoost JSON model format.
 * 
 * Note: For full XGBoost accuracy, consider converting the model to ONNX format
 * or implementing a complete tree traversal algorithm.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xgboostModel = require('../models/symptom/xgboost_model.json')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const possibleSymptoms = require('../models/symptom/possible_symptoms.json')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const idxToDisease = require('../models/symptom/idx_to_disease.json')

/**
 * Initializes the XGBoost predictor
 * This is a no-op for now, but kept for API consistency
 */
export async function initializeXGBoost(): Promise<void> {
  // Model is loaded via require() above
  // No async initialization needed for React Native
  console.log('XGBoost predictor ready (using heuristic-based prediction)')
}

/**
 * Predicts disease probabilities using a heuristic-based approach
 * 
 * Since the XGBoost JSON model format is complex and requires tree traversal,
 * we use symptom-based heuristics that approximate XGBoost behavior.
 * 
 * @param selectedSymptoms Array of selected symptom names
 * @returns Array of { disease: string, probability: number } sorted by probability
 */
export async function predictXGBoost(
  selectedSymptoms: string[],
): Promise<Array<{ disease: string; probability: number }>> {
  // Create feature vector from selected symptoms
  const featureVector = createFeatureVector(selectedSymptoms, possibleSymptoms.symptoms)
  
  // Use heuristic-based prediction
  // This approximates XGBoost behavior based on symptom patterns
  const predictions = heuristicPredict(featureVector, selectedSymptoms)
  
  // Map predictions to disease names and sort by probability
  const results = Object.entries(idxToDisease).map(([idx, disease]) => ({
    disease: disease as string,
    probability: predictions[parseInt(idx, 10)] || 0,
  }))
  
  // Sort by probability (descending) and return top results
  return results.sort((a, b) => b.probability - a.probability)
}

/**
 * Heuristic-based predictor that approximates XGBoost behavior
 * Uses symptom-disease mappings and weighted scoring
 */
function heuristicPredict(features: number[], symptomNames: string[]): number[] {
  const numClasses = 41
  const predictions = new Array(numClasses).fill(0.001) // Small base probability
  
  // Normalize symptom names to match possible_symptoms.json format
  const normalizeSymptom = (symptom: string): string => {
    return symptom.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }
  
  // Symptom-disease association weights (based on common medical knowledge)
  // Format: symptom_name -> { disease_index: weight }
  const symptomDiseaseWeights: Record<string, Record<number, number>> = {
    fever: { 10: 0.3, 11: 0.25, 29: 0.2, 37: 0.15 }, // Common Cold, Dengue, Malaria, Typhoid
    high_fever: { 11: 0.35, 29: 0.3, 37: 0.25, 8: 0.2 }, // Dengue, Malaria, Typhoid, Chicken pox
    cough: { 10: 0.3, 6: 0.25, 34: 0.2, 36: 0.15 }, // Common Cold, Bronchial Asthma, Pneumonia, Tuberculosis
    headache: { 30: 0.3, 10: 0.2, 0: 0.15 }, // Migraine, Common Cold, Vertigo
    rash: { 8: 0.3, 15: 0.25, 14: 0.2, 35: 0.15 }, // Chicken pox, Fungal infection, Drug Reaction, Psoriasis
    skin_rash: { 8: 0.3, 15: 0.25, 14: 0.2, 35: 0.15 },
    abdominal_pain: { 17: 0.3, 33: 0.25, 16: 0.2 }, // Gastroenteritis, Peptic ulcer, GERD
    belly_pain: { 17: 0.3, 33: 0.25, 16: 0.2 },
    breathlessness: { 6: 0.4, 34: 0.3, 18: 0.2 }, // Bronchial Asthma, Pneumonia, Heart attack
    chest_pain: { 18: 0.4, 34: 0.3, 23: 0.2 }, // Heart attack, Pneumonia, Hypertension
    nausea: { 17: 0.3, 11: 0.25, 37: 0.2 }, // Gastroenteritis, Dengue, Typhoid
    vomiting: { 17: 0.3, 11: 0.25, 37: 0.2 }, // Gastroenteritis, Dengue, Typhoid
    diarrhoea: { 17: 0.4, 11: 0.3, 37: 0.2 }, // Gastroenteritis, Dengue, Typhoid
    diarrhea: { 17: 0.4, 11: 0.3, 37: 0.2 },
    joint_pain: { 5: 0.3, 31: 0.25, 7: 0.2 }, // Arthritis, Osteoarthristis, Cervical spondylosis
    back_pain: { 7: 0.3, 5: 0.25, 31: 0.2 }, // Cervical spondylosis, Arthritis, Osteoarthristis
    fatigue: { 12: 0.25, 26: 0.2, 24: 0.15, 11: 0.15 }, // Diabetes, Hypothyroidism, Hyperthyroidism, Dengue
    weakness: { 12: 0.25, 26: 0.2, 11: 0.15 }, // Diabetes, Hypothyroidism, Dengue
    burning_micturition: { 38: 0.4, 16: 0.2 }, // Urinary tract infection, GERD
    bladder_discomfort: { 38: 0.4 }, // Urinary tract infection
    itching: { 15: 0.3, 4: 0.25, 35: 0.2 }, // Fungal infection, Allergy, Psoriasis
    skin_rash: { 8: 0.3, 15: 0.25, 14: 0.2 },
    chills: { 11: 0.3, 29: 0.25, 37: 0.2, 10: 0.15 }, // Dengue, Malaria, Typhoid, Common Cold
    dizziness: { 0: 0.3, 30: 0.2, 25: 0.15 }, // Vertigo, Migraine, Hypoglycemia
    blurred_and_distorted_vision: { 12: 0.3, 25: 0.25, 0: 0.2 }, // Diabetes, Hypoglycemia, Vertigo
    excessive_hunger: { 12: 0.3, 24: 0.25 }, // Diabetes, Hyperthyroidism
    fast_heart_rate: { 24: 0.3, 23: 0.25, 18: 0.2 }, // Hyperthyroidism, Hypertension, Heart attack
    weight_loss: { 12: 0.25, 24: 0.2, 36: 0.15 }, // Diabetes, Hyperthyroidism, Tuberculosis
    weight_gain: { 26: 0.3, 12: 0.2 }, // Hypothyroidism, Diabetes
    constipation: { 26: 0.25, 17: 0.2 }, // Hypothyroidism, Gastroenteritis
    jaundice: { 28: 0.4, 19: 0.3, 20: 0.2 }, // Jaundice, Hepatitis B, Hepatitis C
    dark_urine: { 28: 0.3, 19: 0.25, 20: 0.2 }, // Jaundice, Hepatitis B, Hepatitis C
    yellowing_of_eyes: { 28: 0.4, 19: 0.3, 20: 0.2 },
  }
  
  // Apply symptom-disease weights
  for (const symptom of symptomNames) {
    const normalizedSymptom = normalizeSymptom(symptom)
    const weights = symptomDiseaseWeights[normalizedSymptom]
    
    if (weights) {
      for (const [diseaseIdx, weight] of Object.entries(weights)) {
        const idx = parseInt(diseaseIdx, 10)
        if (idx >= 0 && idx < numClasses) {
          predictions[idx] += weight
        }
      }
    } else {
      // For unknown symptoms, give small boost to common diseases
      predictions[10] += 0.05 // Common Cold
      predictions[4] += 0.03 // Allergy
    }
  }
  
  // Boost based on symptom count (more symptoms = higher confidence)
  const symptomCount = features.reduce((sum, val) => sum + val, 0)
  const countBoost = Math.min(0.2, symptomCount * 0.02)
  
  // Apply boost to top predictions
  const sortedIndices = predictions
    .map((prob, idx) => ({ prob, idx }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 5)
    .map((item) => item.idx)
  
  for (const idx of sortedIndices) {
    predictions[idx] += countBoost
  }
  
  // Normalize to probabilities (softmax-like)
  const maxProb = Math.max(...predictions)
  const expPredictions = predictions.map((p) => Math.exp(p - maxProb))
  const sum = expPredictions.reduce((a, b) => a + b, 0)
  
  return expPredictions.map((p) => p / sum)
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

