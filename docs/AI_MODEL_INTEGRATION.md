# AI Model Integration Guide

This document describes the AI model integration for the Alaga.AI symptom analysis system.

## Overview

The system uses a **hybrid AI approach** combining:
1. **XGBoost** - For structured symptom features (binary symptom presence)
2. **Transformer (DistilBERT)** - For text-based symptom analysis
3. **Fusion Layer** - Combines both model outputs using weighted averaging

## Installed Packages

- `onnxruntime-react-native` - ONNX Runtime for React Native (transformer inference)
- `@xenova/transformers` - Tokenizer for text preprocessing
- `xgboost-scorer` - XGBoost model inference

## Model Files

### Transformer Model
- **Path**: `models/symptom/transformer_model.onnx`
- **Type**: DistilBERT fine-tuned for disease classification
- **Input**: Tokenized text (input_ids, attention_mask)
- **Output**: Logits for 41 disease classes
- **Tokenizer**: Uses base DistilBERT tokenizer (compatible with fine-tuned model)

### XGBoost Model
- **Path**: `models/symptom/xgboost_model.json`
- **Type**: XGBoost gradient boosting model
- **Input**: Binary feature vector (131 symptoms)
- **Output**: Probabilities for 41 disease classes

### Supporting Files
- `models/symptom/idx_to_disease.json` - Maps class indices to disease names
- `models/symptom/possible_symptoms.json` - List of all possible symptoms (131 total)

## Architecture

```
Patient Input (Symptoms + Notes)
    │
    ├─→ XGBoost Predictor (Structured Features)
    │   └─→ Disease Probabilities
    │
    ├─→ Transformer Predictor (Text Analysis)
    │   └─→ Disease Probabilities
    │
    └─→ Fusion Layer
        ├─→ Weighted Averaging (60% XGBoost, 40% Transformer)
        ├─→ Temperature Scaling (optional)
        └─→ Top-N Selection
            └─→ Final Predictions
```

## Key Modules

### `ai/model-initializer.ts`
Initializes all models at app startup. Call `initializeModels()` once when the app loads.

### `ai/xgboost-predictor.ts`
- `initializeXGBoost()` - Loads XGBoost model
- `predictXGBoost(symptoms)` - Predicts from symptom list
- `createFeatureVector()` - Converts symptoms to binary vector

### `ai/transformer-predictor.ts`
- `initializeTransformer()` - Loads ONNX model and tokenizer
- `predictTransformer(text)` - Predicts from text input
- `combineSymptomsToText()` - Converts symptoms + notes to text

### `ai/fusion-layer.ts`
- `fusePredictions()` - Combines XGBoost and Transformer outputs
- `getTopPredictions()` - Returns top N predictions
- `filterByThreshold()` - Filters low-probability predictions
- `applyTemperatureScaling()` - Calibrates probabilities

### `ai/engine.ts`
Main assessment function that:
1. Runs both models in parallel
2. Fuses their predictions
3. Determines triage level
4. Generates recommendations
5. Creates simplified summaries

## Usage

### Initialization

Models are automatically initialized when the app starts (see `app/_layout.tsx`):

```typescript
import { initializeModels } from '../ai/model-initializer'

useEffect(() => {
  initializeModels().catch(console.error)
}, [])
```

### Running Assessment

```typescript
import { runAssessment } from '../ai/engine'

const result = await runAssessment({
  patientName: 'John Doe',
  vitals: {
    bloodPressure: '120/80',
    temperature: 37.5,
    heartRate: 75,
    oxygenLevel: 98,
  },
  symptoms: ['fever', 'cough', 'headache'],
  notes: 'Patient reports feeling unwell for 2 days',
})
```

### Direct Model Usage

```typescript
// XGBoost only
import { predictXGBoost } from './ai/xgboost-predictor'
const xgbResults = await predictXGBoost(['fever', 'cough'])

// Transformer only
import { predictTransformer } from './ai/transformer-predictor'
const transResults = await predictTransformer('fever, cough, headache')

// Fusion
import { fusePredictions } from './ai/fusion-layer'
const fused = fusePredictions(xgbResults, transResults)
```

## Fusion Weights

Current weights (tunable in `ai/fusion-layer.ts`):
- **XGBoost**: 60% (higher weight for structured data)
- **Transformer**: 40% (lower weight for text analysis)

These can be adjusted based on validation performance.

## Triage Levels

The system determines triage level based on:
1. **Vital signs** (heart rate, oxygen, temperature)
2. **Top predicted disease** (critical diseases trigger Critical level)
3. **Probability thresholds**

### Critical Diseases
- Heart attack
- Paralysis (brain hemorrhage)
- AIDS
- Tuberculosis

### Moderate Indicators
- High temperature (≥38.5°C)
- Pneumonia
- Bronchial Asthma

## Error Handling

All model functions include error handling:
- Falls back to the other model if one fails
- Provides default predictions if both fail
- Logs warnings for debugging

## Performance Considerations

- Models are loaded once at startup
- Inference runs in parallel for both models
- ONNX Runtime is optimized for mobile devices
- XGBoost scorer is pure JavaScript (no native dependencies)

## Future Improvements

1. **Model Optimization**
   - Quantize ONNX model for smaller size
   - Optimize XGBoost JSON format
   - Cache tokenizer locally

2. **Fusion Tuning**
   - Learn optimal weights from validation data
   - Implement stacked generalization
   - Add confidence calibration

3. **Additional Features**
   - Image-based diagnosis (TFLite model)
   - Translation/simplification (translator model)
   - Real-time model updates

## Troubleshooting

### Models Not Loading
- Check that model files exist in `models/symptom/`
- Verify `models/manifest.json` has correct paths
- Check console for initialization errors

### Tokenizer Issues
- Falls back to base DistilBERT tokenizer
- Should work with fine-tuned models (same vocabulary)

### ONNX Runtime Errors
- Ensure `onnxruntime-react-native` is installed
- Check model file is valid ONNX format
- Verify input tensor shapes match model expectations

### XGBoost Errors
- Model format may need conversion for `xgboost-scorer`
- Fallback predictor provides basic functionality
- Consider exporting model in compatible format

