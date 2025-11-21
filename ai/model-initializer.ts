/**
 * Model Initializer
 * 
 * Initializes all AI models at app startup.
 * This should be called once when the app loads.
 */

import { initializeXGBoost } from './xgboost-predictor'
import { initializeTransformer } from './transformer-predictor'

let initialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Initializes all AI models
 * This function is idempotent - it can be called multiple times safely
 */
export async function initializeModels(): Promise<void> {
  if (initialized) {
    return
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      console.log('Initializing AI models...')
      
      // Initialize models in parallel for faster startup
      await Promise.all([
        initializeXGBoost().catch((error) => {
          console.warn('XGBoost initialization failed:', error)
        }),
        initializeTransformer().catch((error) => {
          console.warn('Transformer initialization failed:', error)
        }),
      ])

      initialized = true
      console.log('AI models initialized successfully')
    } catch (error) {
      console.error('Model initialization failed:', error)
      throw error
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Checks if models are initialized
 */
export function areModelsInitialized(): boolean {
  return initialized
}

