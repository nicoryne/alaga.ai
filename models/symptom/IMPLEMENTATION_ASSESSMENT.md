# Implementation Assessment - Hybrid Symptom Analysis Model

## Current State Analysis

### Model Files Present ✅
- `transformer_model.onnx` - DistilBERT transformer model (ONNX format)
- `xgboost_model.json` - XGBoost model (JSON format, not ONNX)
- `fusion_weights.json` - Fusion layer weights (xgb_weight: 0.5, transformer_weight: 0.5)
- `idx_to_disease.json` - Maps 41 disease indices to names
- `possible_symptoms.json` - List of 133 symptoms (matches `data/symptoms.ts`)
- `disease_sympts_prec_full.csv` - Disease names and precautions
- `tokenizer/` - DistilBERT tokenizer files (config, vocab, special tokens)

### Current Implementation Status
- ❌ `ai/engine.ts` - Still using stub/deterministic logic
- ❌ `models/manifest.json` - Points to old `model-symptom.onnx` path
- ❌ `ai/runtime.ts` - References old model paths
- ❌ No ONNX Runtime integration
- ❌ No tokenizer integration
- ❌ No XGBoost inference (JSON format needs JS library or ONNX conversion)

## Required Changes

### 1. Update Manifest (`models/manifest.json`)
- ✅ Update transformer model path: `transformer_model.onnx`
- ✅ Add XGBoost model entry (note: JSON format, may need conversion)
- ✅ Update descriptions to reflect hybrid architecture

### 2. Update Runtime (`ai/runtime.ts`)
- ✅ Update model asset paths
- ✅ Add support for JSON model files (XGBoost)
- ✅ Load metadata files (fusion_weights, idx_to_disease, possible_symptoms)

### 3. Implement Engine (`ai/engine.ts`)
- ✅ Map symptom IDs from UI to model format
- ✅ Create binary feature vector (133 features) for XGBoost
- ✅ Tokenize symptom text for Transformer
- ✅ Run Transformer ONNX inference
- ✅ Run XGBoost inference (requires JS library or ONNX conversion)
- ✅ Apply fusion layer (weighted average)
- ✅ Map outputs to disease names with precautions
- ✅ Convert to `AssessmentResult` format

### 4. Package Dependencies
- ⚠️ `onnxruntime-react-native` - Required for ONNX inference (native module)
- ⚠️ Tokenizer library - `bert-tokenizer` or `@xenova/transformers` for tokenization
- ⚠️ XGBoost inference - Options:
  - Convert XGBoost JSON to ONNX (recommended)
  - Use `ml-xgboost` or similar JS library
  - Use `onnxruntime` with converted model

## Implementation Phases

### Phase 1: Configuration Updates (Low Risk)
- Update manifest.json
- Update runtime.ts asset paths
- Load metadata files

### Phase 2: Transformer Integration (Medium Risk)
- Install `onnxruntime-react-native` or use web-based ONNX Runtime
- Implement tokenization
- Run Transformer ONNX inference
- Apply softmax to logits

### Phase 3: XGBoost Integration (High Risk)
- **Option A (Recommended)**: Convert XGBoost JSON to ONNX
  - Use Python script to convert `xgboost_model.json` to `xgboost_model.onnx`
  - Use same ONNX Runtime for both models
- **Option B**: Use JS library
  - Install `ml-xgboost` or similar
  - Parse JSON model structure
  - Implement inference in JS

### Phase 4: Fusion & Output Mapping
- Implement fusion layer (weighted average)
- Map disease indices to names
- Load precautions from CSV
- Format as `AssessmentResult`

## Recommendations

1. **XGBoost Conversion**: Convert `xgboost_model.json` to `xgboost_model.onnx` for consistency
   - Use `onnxmltools` or `skl2onnx` in Python
   - Ensures both models use same runtime

2. **Tokenizer**: Use `@xenova/transformers` (pure JS, no native code)
   - Supports DistilBERT tokenization
   - Works in React Native without native modules

3. **ONNX Runtime**: Consider `onnxruntime-web` for React Native
   - Pure JS implementation
   - No native module compilation needed
   - Slightly slower but more portable

4. **Fallback Strategy**: Keep stub implementation as fallback
   - If models fail to load, use deterministic logic
   - Log errors for debugging

## Next Steps

1. ✅ Update manifest and runtime paths
2. ⏳ Install required dependencies
3. ⏳ Implement tokenization helper
4. ⏳ Implement Transformer inference
5. ⏳ Convert or implement XGBoost inference
6. ⏳ Implement fusion layer
7. ⏳ Map outputs to AssessmentResult format
8. ⏳ Add error handling and fallbacks


