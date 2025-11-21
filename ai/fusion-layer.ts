/**
 * Fusion Layer for Hybrid AI Model
 * 
 * Combines predictions from XGBoost (structured features) and Transformer (text)
 * using weighted averaging and stacked generalization.
 */

export type DiseasePrediction = {
  disease: string
  probability: number
}

/**
 * Fusion weights for combining model outputs
 * These can be tuned based on validation performance
 */
const FUSION_WEIGHTS = {
  xgboost: 0.6, // Higher weight for structured symptom data
  transformer: 0.4, // Lower weight for text analysis
}

/**
 * Fuses predictions from XGBoost and Transformer models
 * @param xgboostPredictions Predictions from XGBoost model
 * @param transformerPredictions Predictions from Transformer model
 * @returns Fused predictions sorted by probability
 */
export function fusePredictions(
  xgboostPredictions: DiseasePrediction[],
  transformerPredictions: DiseasePrediction[],
): DiseasePrediction[] {
  // Create a map of disease -> probability for efficient lookup
  const xgboostMap = new Map<string, number>()
  xgboostPredictions.forEach((pred) => {
    xgboostMap.set(pred.disease, pred.probability)
  })

  const transformerMap = new Map<string, number>()
  transformerPredictions.forEach((pred) => {
    transformerMap.set(pred.disease, pred.probability)
  })

  // Get all unique diseases
  const allDiseases = new Set([
    ...xgboostPredictions.map((p) => p.disease),
    ...transformerPredictions.map((p) => p.disease),
  ])

  // Combine predictions using weighted average
  const fusedPredictions: DiseasePrediction[] = Array.from(allDiseases).map((disease) => {
    const xgbProb = xgboostMap.get(disease) || 0
    const transProb = transformerMap.get(disease) || 0

    // Weighted average
    const fusedProb =
      xgbProb * FUSION_WEIGHTS.xgboost + transProb * FUSION_WEIGHTS.transformer

    return {
      disease,
      probability: fusedProb,
    }
  })

  // Normalize probabilities to sum to 1
  const sum = fusedPredictions.reduce((acc, pred) => acc + pred.probability, 0)
  if (sum > 0) {
    fusedPredictions.forEach((pred) => {
      pred.probability = pred.probability / sum
    })
  }

  // Sort by probability (descending)
  return fusedPredictions.sort((a, b) => b.probability - a.probability)
}

/**
 * Applies temperature scaling for calibration
 * @param predictions Array of predictions
 * @param temperature Temperature parameter (default: 1.0)
 * @returns Calibrated predictions
 */
export function applyTemperatureScaling(
  predictions: DiseasePrediction[],
  temperature: number = 1.0,
): DiseasePrediction[] {
  if (temperature === 1.0) {
    return predictions
  }

  const scaled = predictions.map((pred) => ({
    ...pred,
    probability: Math.pow(pred.probability, 1.0 / temperature),
  }))

  // Renormalize
  const sum = scaled.reduce((acc, pred) => acc + pred.probability, 0)
  if (sum > 0) {
    scaled.forEach((pred) => {
      pred.probability = pred.probability / sum
    })
  }

  return scaled
}

/**
 * Filters predictions by minimum probability threshold
 * @param predictions Array of predictions
 * @param threshold Minimum probability (default: 0.01)
 * @returns Filtered predictions
 */
export function filterByThreshold(
  predictions: DiseasePrediction[],
  threshold: number = 0.01,
): DiseasePrediction[] {
  return predictions.filter((pred) => pred.probability >= threshold)
}

/**
 * Gets top N predictions
 * @param predictions Array of predictions (should be sorted)
 * @param topN Number of top predictions to return (default: 5)
 * @returns Top N predictions
 */
export function getTopPredictions(
  predictions: DiseasePrediction[],
  topN: number = 5,
): DiseasePrediction[] {
  return predictions.slice(0, topN)
}

