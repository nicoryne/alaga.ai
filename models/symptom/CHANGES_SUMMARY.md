# Changes Summary - Hybrid Symptom Analysis Model Integration

## ✅ Completed Changes

### 1. Manifest Updates (`models/manifest.json`)
- ✅ Updated transformer model path from `model-symptom.onnx` to `transformer_model.onnx`
- ✅ Added new XGBoost model entry (`symptom-xgboost`) with JSON type
- ✅ Updated descriptions to reflect hybrid architecture
- ✅ Split single model entry into two separate entries (transformer + xgboost)

### 2. Runtime Updates (`ai/runtime.ts`)
- ✅ Updated model asset paths to match new file names
- ✅ Added support for JSON model type (XGBoost)
- ✅ Updated `ModelEntry` type to include `'json'` as valid type

### 3. Assessment Document
- ✅ Created `IMPLEMENTATION_ASSESSMENT.md` with detailed analysis
- ✅ Documented current state, required changes, and implementation phases

## ⏳ Pending Implementation

### Phase 2: Model Inference Integration

#### Required Dependencies
```bash
npm install onnxruntime-react-native
# OR for web-based (no native code):
npm install onnxruntime-web

# For tokenization:
npm install @xenova/transformers
# OR
npm install bert-tokenizer
```

#### Files to Update
1. **`ai/engine.ts`** - Implement actual model inference:
   - Load models (transformer ONNX, XGBoost JSON)
   - Map symptom IDs to binary feature vector (133 features)
   - Tokenize symptom text for transformer
   - Run transformer inference (ONNX)
   - Run XGBoost inference (JSON → needs JS library or ONNX conversion)
   - Apply fusion layer (weighted average)
   - Map disease indices to names
   - Load precautions from CSV
   - Format as `AssessmentResult`

2. **`ai/runtime.ts`** - Add helper functions:
   - Load metadata files (fusion_weights.json, idx_to_disease.json)
   - Load precautions from CSV
   - Helper to create binary feature vector from symptom IDs

#### Key Implementation Notes

**Symptom ID Mapping:**
- UI uses `SymptomId` from `data/symptoms.ts` (e.g., `"fever"`, `"cough"`)
- Model expects indices in `possible_symptoms.json` array (sorted alphabetically)
- Need to map: `symptomId → index in possible_symptoms.json → binary vector`

**Transformer Input:**
- Convert symptom IDs to comma-separated string: `"fever,cough,headache"`
- Tokenize using DistilBERT tokenizer (max_length=256)
- Input: `input_ids` and `attention_mask` (int64, shape [1, 256])

**XGBoost Input:**
- Create binary vector (133 features) where 1.0 = symptom present, 0.0 = absent
- Order must match `possible_symptoms.json` (sorted alphabetically)
- Input: `float_input` (float32, shape [1, 133])

**Fusion:**
- Load weights from `fusion_weights.json`
- Formula: `final_probs = xgb_weight * xgb_probs + transformer_weight * transformer_probs`
- Apply softmax to transformer logits before fusion

**Output Mapping:**
- Get top 5 disease indices from final probabilities
- Map indices to disease names using `idx_to_disease.json`
- Load precautions from `disease_sympts_prec_full.csv` (first match per disease)
- Format as `AssessmentResult` with:
  - `probableConditions`: Top 5 diseases with confidence
  - `recommendedActions`: Precautions for top disease
  - `triageLevel`: Based on confidence and disease severity
  - `simplifiedSummary`: Tagalog translation (to be implemented)

## 📋 Model File Checklist

### ✅ Present Files
- [x] `transformer_model.onnx` - Transformer ONNX model
- [x] `xgboost_model.json` - XGBoost model (JSON format)
- [x] `fusion_weights.json` - Fusion layer weights
- [x] `idx_to_disease.json` - Disease index to name mapping
- [x] `possible_symptoms.json` - Symptom list (133 symptoms)
- [x] `disease_sympts_prec_full.csv` - Disease precautions
- [x] `tokenizer/` - DistilBERT tokenizer files

### ⚠️ Considerations
- **XGBoost JSON**: Currently in JSON format. Options:
  1. Convert to ONNX (recommended) - use Python script with `onnxmltools`
  2. Use JS library - `ml-xgboost` or similar
  3. Implement XGBoost inference in JS (complex)

## 🔄 Next Steps

1. **Install Dependencies** (when ready to implement):
   ```bash
   npm install onnxruntime-react-native @xenova/transformers
   ```

2. **Convert XGBoost to ONNX** (recommended):
   - Create Python script to convert `xgboost_model.json` → `xgboost_model.onnx`
   - Use `onnxmltools` or `skl2onnx`
   - Update manifest to use ONNX type

3. **Implement Engine** (`ai/engine.ts`):
   - Create helper functions for:
     - Binary vector creation
     - Tokenization
     - Model inference
     - Fusion
     - Output mapping
   - Integrate with existing `runAssessment` function
   - Add error handling and fallback to stub logic

4. **Testing**:
   - Test with sample symptom inputs
   - Verify output format matches `AssessmentResult`
   - Test error handling (missing models, invalid inputs)

## 📝 Notes

- Current `ai/engine.ts` uses stub/deterministic logic - this is fine for now
- Model files are large (~255MB total) - ensure they're in `.gitignore`
- Tokenizer files are in `tokenizer/` subfolder - ensure they're accessible
- CSV file has multiple rows per disease - use first match for precautions


