/**
 * Transformer Predictor for React Native
 * 
 * This module provides transformer-based symptom analysis using ONNX Runtime.
 * It processes text symptoms and returns disease probabilities.
 * 
 * Note: ONNX Runtime is loaded lazily to prevent errors if native modules
 * are not properly linked. The app will use fallback predictions if ONNX
 * Runtime is unavailable.
 */

import * as FileSystem from 'expo-file-system'
import { ensureModelCached, getModelById } from './runtime'
import { createTokenizer, SimpleTokenizer } from './tokenizer'

// Lazy load ONNX Runtime to prevent errors during module initialization
// This is necessary because onnxruntime-react-native requires native modules
// that may not be properly linked in Expo
let InferenceSession: any = null
let Tensor: any = null
let onnxLoadAttempted = false

/**
 * Lazy loads ONNX Runtime only when needed
 * This prevents the "Cannot read property 'install' of null" error
 * by only requiring the module when actually used
 */
function loadOnnxRuntime(): boolean {
  if (onnxLoadAttempted) {
    return InferenceSession !== null && Tensor !== null
  }
  
  onnxLoadAttempted = true
  
  try {
    // Use dynamic require inside function to prevent module load errors
    const onnx = require('onnxruntime-react-native')
    InferenceSession = onnx.InferenceSession
    Tensor = onnx.Tensor
    return true
  } catch (error) {
    console.warn('ONNX Runtime not available, transformer will use fallback:', error)
    return false
  }
}

const { cacheDirectory } = FileSystem

// eslint-disable-next-line @typescript-eslint/no-var-requires
const idxToDisease = require('../models/symptom/idx_to_disease.json')

let session: InferenceSession | null = null
let tokenizer: SimpleTokenizer | null = null
let modelPath: string | null = null

const MAX_LENGTH = 256

/**
 * Initializes the transformer model and tokenizer
 * This should be called once at app startup
 */
export async function initializeTransformer(): Promise<void> {
  try {
    // Try to load ONNX Runtime lazily
    if (!loadOnnxRuntime()) {
      console.warn('ONNX Runtime not available, transformer will use fallback predictions')
      tokenizer = createTokenizer(MAX_LENGTH)
      return
    }

    // Get model info from manifest
    const modelInfo = getModelById('symptom-transformer')
    if (!modelInfo) {
      throw new Error('symptom-transformer model not found in manifest')
    }

    // Cache the model file
    modelPath = await ensureModelCached(modelInfo)
    
    // Load ONNX model
    session = await InferenceSession.create(modelPath)
    console.log('Transformer ONNX model loaded successfully')

    // Load tokenizer
    // Use our custom React Native-compatible tokenizer
    // This avoids import.meta issues with @xenova/transformers
    tokenizer = createTokenizer(MAX_LENGTH)
    console.log('Tokenizer loaded (using custom React Native tokenizer)')
  } catch (error) {
    console.warn('Failed to initialize transformer, will use fallback:', error)
    // Don't throw - allow app to continue with fallback
    tokenizer = createTokenizer(MAX_LENGTH)
  }
}

/**
 * Predicts disease probabilities using the transformer model
 * @param textSymptoms Text description of symptoms (can be from notes or concatenated symptom names)
 * @returns Array of { disease: string, probability: number } sorted by probability
 */
export async function predictTransformer(
  textSymptoms: string,
): Promise<Array<{ disease: string; probability: number }>> {
  // Ensure tokenizer is initialized
  if (!tokenizer) {
    tokenizer = createTokenizer(MAX_LENGTH)
  }
  
  // If ONNX Runtime is not available or session failed to load, use fallback
  if (!loadOnnxRuntime() || !session || !InferenceSession || !Tensor) {
    return fallbackTransformerPredict(textSymptoms)
  }

  try {
    // Tokenize input text using our custom tokenizer
    const encoded = tokenizer.encode(textSymptoms)
    
    // Extract input_ids and attention_mask (already arrays of numbers)
    const inputIdsNum = encoded.input_ids
    const attentionMaskNum = encoded.attention_mask

    // Create ONNX tensors
    // ONNX expects int64, but we need to ensure the array is properly sized
    const inputIdsArray = new BigInt64Array(inputIdsNum.length)
    const attentionMaskArray = new BigInt64Array(attentionMaskNum.length)
    
    for (let i = 0; i < inputIdsNum.length; i++) {
      inputIdsArray[i] = BigInt(inputIdsNum[i])
      attentionMaskArray[i] = BigInt(attentionMaskNum[i])
    }

    const inputIdsTensor = new Tensor('int64', inputIdsArray, [1, inputIdsNum.length])
    const attentionMaskTensor = new Tensor('int64', attentionMaskArray, [1, attentionMaskNum.length])

    // Run inference
    const feeds = {
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
    }

    const results = await session.run(feeds)
    const logits = results.logits as Tensor

    // Extract probabilities from logits
    const logitsData = logits.data as Float32Array
    const numClasses = logitsData.length

    // Apply softmax to convert logits to probabilities
    const probabilities = softmax(Array.from(logitsData))

    // Map to disease names
    const results_ = Object.entries(idxToDisease).map(([idx, disease]) => ({
      disease: disease as string,
      probability: probabilities[parseInt(idx, 10)] || 0,
    }))

    // Sort by probability (descending)
    return results_.sort((a, b) => b.probability - a.probability)
  } catch (error) {
    console.warn('Transformer prediction failed, using fallback:', error)
    return fallbackTransformerPredict(textSymptoms)
  }
}

/**
 * Fallback transformer prediction when ONNX Runtime is not available
 * Uses simple text-based heuristics
 */
function fallbackTransformerPredict(textSymptoms: string): Array<{ disease: string; probability: number }> {
  const numClasses = 41
  const predictions = new Array(numClasses).fill(0.01)
  
  const text = textSymptoms.toLowerCase()
  
  // Simple keyword matching
  const keywordDiseaseMap: Record<string, number[]> = {
    'fever': [10, 11, 29, 37], // Common Cold, Dengue, Malaria, Typhoid
    'cough': [10, 6, 34, 36], // Common Cold, Bronchial Asthma, Pneumonia, Tuberculosis
    'headache': [30, 10, 0], // Migraine, Common Cold, Vertigo
    'pain': [5, 7, 31], // Arthritis, Cervical spondylosis, Osteoarthristis
    'rash': [8, 15, 14, 35], // Chicken pox, Fungal infection, Drug Reaction, Psoriasis
    'breath': [6, 34, 18], // Bronchial Asthma, Pneumonia, Heart attack
    'chest': [18, 34, 23], // Heart attack, Pneumonia, Hypertension
    'nausea': [17, 11, 37], // Gastroenteritis, Dengue, Typhoid
    'vomit': [17, 11, 37], // Gastroenteritis, Dengue, Typhoid
    'diarrhea': [17, 11, 37], // Gastroenteritis, Dengue, Typhoid
  }
  
  for (const [keyword, diseaseIndices] of Object.entries(keywordDiseaseMap)) {
    if (text.includes(keyword)) {
      diseaseIndices.forEach((idx) => {
        predictions[idx] += 0.1
      })
    }
  }
  
  // Normalize
  const sum = predictions.reduce((a, b) => a + b, 0)
  const normalized = predictions.map((p) => p / sum)
  
  // Map to disease names
  const results = Object.entries(idxToDisease).map(([idx, disease]) => ({
    disease: disease as string,
    probability: normalized[parseInt(idx, 10)] || 0,
  }))
  
  return results.sort((a, b) => b.probability - a.probability)
}

/**
 * Applies softmax function to convert logits to probabilities
 */
function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const expLogits = logits.map((x) => Math.exp(x - maxLogit))
  const sumExp = expLogits.reduce((a, b) => a + b, 0)
  return expLogits.map((x) => x / sumExp)
}

/**
 * Combines symptom names into a text description for the transformer
 * @param symptoms Array of symptom names
 * @param notes Optional free-text notes
 * @returns Combined text description
 */
export function combineSymptomsToText(symptoms: string[], notes?: string): string {
  const symptomText = symptoms.join(', ')
  if (notes && notes.trim()) {
    return `${symptomText}. ${notes.trim()}`
  }
  return symptomText
}

