/**
 * Transformer Predictor for React Native
 * 
 * This module provides transformer-based symptom analysis using ONNX Runtime.
 * It processes text symptoms and returns disease probabilities.
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native'
import { AutoTokenizer } from '@xenova/transformers'
import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'
import { ensureModelCached, getModelById } from './runtime'

const { cacheDirectory } = FileSystem

// eslint-disable-next-line @typescript-eslint/no-var-requires
const idxToDisease = require('../models/symptom/idx_to_disease.json')

let session: InferenceSession | null = null
let tokenizer: any = null
let modelPath: string | null = null

const MAX_LENGTH = 256

/**
 * Initializes the transformer model and tokenizer
 * This should be called once at app startup
 */
export async function initializeTransformer(): Promise<void> {
  try {
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
    // For React Native, @xenova/transformers works best with a base model
    // The fine-tuned model should use the same tokenizer as the base model
    try {
      // Try to use the base DistilBERT tokenizer (compatible with fine-tuned models)
      // This is more reliable in React Native than loading custom tokenizer files
      tokenizer = await AutoTokenizer.from_pretrained('distilbert-base-uncased')
      console.log('Tokenizer loaded (using base DistilBERT tokenizer)')
    } catch (error) {
      console.error('Failed to load tokenizer:', error)
      throw new Error('Tokenizer initialization failed')
    }
  } catch (error) {
    console.error('Failed to initialize transformer:', error)
    throw error
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
  if (!session || !tokenizer) {
    throw new Error('Transformer model not initialized. Call initializeTransformer() first.')
  }

  try {
    // Tokenize input text
    const encoded = await tokenizer(textSymptoms, {
      padding: true,
      truncation: true,
      max_length: MAX_LENGTH,
    })

    // Extract input_ids and attention_mask
    // @xenova/transformers returns arrays directly, not tensors
    const inputIds = Array.isArray(encoded.input_ids)
      ? encoded.input_ids
      : Array.isArray(encoded.input_ids.data)
      ? encoded.input_ids.data
      : Array.from(encoded.input_ids.data || [])
    const attentionMask = Array.isArray(encoded.attention_mask)
      ? encoded.attention_mask
      : Array.isArray(encoded.attention_mask.data)
      ? encoded.attention_mask.data
      : Array.from(encoded.attention_mask.data || [])

    // Ensure they are numbers and properly shaped
    const inputIdsNum = inputIds.map((v: any) => Number(v))
    const attentionMaskNum = attentionMask.map((v: any) => Number(v))

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
    console.error('Transformer prediction failed:', error)
    throw error
  }
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

