# ONNX Model Specifications - Hybrid Symptom Analysis Engine

## Overview

This document specifies the input/output formats, architecture, and technical requirements for the Hybrid Symptom Analysis ONNX models. The system consists of three ONNX models that work together: XGBoost, Transformer (DistilBERT), and a Fusion layer.

## Model Architecture

### System Components

1. **XGBoost ONNX Model** (`xgboost_model.onnx`)
   - Handles structured binary symptom features
   - Input: Binary feature vector (133 symptoms)
   - Output: Probability distribution over 41 diseases

2. **Transformer ONNX Model** (`transformer_model.onnx`)
   - Handles unstructured symptom text
   - Input: Tokenized symptom text
   - Output: Probability distribution over 41 diseases

3. **Fusion Layer** (Python-based or ONNX)
   - Combines outputs from both models
   - Input: Two probability vectors (82 features total)
   - Output: Final probability distribution over 41 diseases

## Input Specifications

### 1. XGBoost Model Input

**Model Name**: `xgboost_model.onnx`

**Input Name**: `float_input`

**Input Shape**: `[batch_size, 133]`

**Input Type**: `float32`

**Input Format**: Binary feature vector
- Each element represents presence (1.0) or absence (0.0) of a symptom
- Order matches `possible_symptoms.json` (sorted alphabetically)
- Example: `[0.0, 1.0, 0.0, 1.0, ...]` where 1.0 indicates symptom present

**Input Example**:
```python
import numpy as np

# Symptoms: ["fever", "cough", "headache"]
# Create binary vector (133 features)
symptoms_list = sorted(load_symptoms("possible_symptoms.json"))
symptom_to_idx = {s: i for i, s in enumerate(symptoms_list)}

input_vector = np.zeros(133, dtype=np.float32)
input_vector[symptom_to_idx["fever"]] = 1.0
input_vector[symptom_to_idx["cough"]] = 1.0
input_vector[symptom_to_idx["headache"]] = 1.0

# Reshape for batch: [1, 133]
input_vector = input_vector.reshape(1, -1)
```

**Input Constraints**:
- Values must be 0.0 or 1.0 (binary)
- All 133 features must be provided
- Batch size can be 1 or more (for batch inference)

### 2. Transformer Model Input

**Model Name**: `transformer_model.onnx`

**Input Names**: 
- `input_ids`: Token IDs
- `attention_mask`: Attention mask

**Input Shapes**:
- `input_ids`: `[batch_size, max_length]` where `max_length = 256`
- `attention_mask`: `[batch_size, max_length]` where `max_length = 256`

**Input Types**: `int64`

**Input Format**: Tokenized symptom text
- Symptoms should be comma-separated string
- Example: `"fever,cough,headache"`
- Tokenized using DistilBERT tokenizer
- Padded/truncated to max_length=256

**Input Example**:
```python
from transformers import AutoTokenizer
import numpy as np

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

# Symptoms as comma-separated string
symptom_text = "fever,cough,headache"

# Tokenize
encoding = tokenizer(
    symptom_text,
    return_tensors="np",
    padding="max_length",
    truncation=True,
    max_length=256
)

input_ids = encoding["input_ids"].astype(np.int64)  # [1, 256]
attention_mask = encoding["attention_mask"].astype(np.int64)  # [1, 256]
```

**Input Constraints**:
- Text must be tokenized using DistilBERT tokenizer
- Max sequence length: 256 tokens
- Padding: `max_length` (pad to 256)
- Truncation: `True` (truncate if > 256 tokens)

### 3. Fusion Layer Input

**Input Format**: Two probability vectors
- XGBoost probabilities: `[batch_size, 41]` (float32)
- Transformer probabilities: `[batch_size, 41]` (float32)

**Fusion Weights**: Loaded from `fusion_weights.json`
```json
{
  "xgb_weight": 0.52,
  "transformer_weight": 0.48
}
```

**Fusion Formula**:
```python
final_probs = xgb_weight * xgb_probs + transformer_weight * transformer_probs
```

## Output Specifications

### 1. XGBoost Model Output

**Output Name**: `probabilities` (or model-specific output name)

**Output Shape**: `[batch_size, 41]`

**Output Type**: `float32`

**Output Format**: Probability distribution
- Each element is a probability (0.0 to 1.0)
- Sum of all probabilities ≈ 1.0
- Index corresponds to disease class (see `idx_to_disease.json`)

**Output Example**:
```python
# Shape: [1, 41]
output = np.array([
    [0.05, 0.02, 0.01, ..., 0.85, 0.03, ...]  # 41 probabilities
], dtype=np.float32)

# Get top prediction
top_idx = np.argmax(output[0])  # e.g., 10
disease_name = idx_to_disease[str(top_idx)]  # e.g., "Common Cold"
confidence = output[0][top_idx]  # e.g., 0.85
```

### 2. Transformer Model Output

**Output Name**: `logits` (or model-specific output name)

**Output Shape**: `[batch_size, 41]`

**Output Type**: `float32`

**Output Format**: Logits (raw scores before softmax)
- Must apply softmax to get probabilities
- Each element is a logit score
- Index corresponds to disease class

**Output Example**:
```python
# Shape: [1, 41]
logits = np.array([
    [2.1, -1.5, 0.3, ..., 5.2, -0.8, ...]  # 41 logits
], dtype=np.float32)

# Apply softmax to get probabilities
probs = softmax(logits[0])  # Convert to probabilities
top_idx = np.argmax(probs)
```

**Softmax Function**:
```python
def softmax(x):
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()
```

### 3. Final System Output

**Output Format**: Top 5 predictions with metadata

**Output Structure**:
```json
{
  "input_symptoms": ["fever", "cough", "headache"],
  "predictions": [
    {
      "disease": "Common Cold",
      "confidence": 0.85,
      "precautions": "rest, stay hydrated, take over-the-counter medication",
      "rank": 1
    },
    {
      "disease": "Influenza",
      "confidence": 0.12,
      "precautions": "rest, see doctor if severe",
      "rank": 2
    },
    ...
  ]
}
```

**CSV Output Format** (matching `disease_sympts_prec_full.csv`):
```csv
disease,symptoms,precautions,confidence,rank
Common Cold,"fever,cough,headache","rest, stay hydrated",0.85,1
Influenza,"fever,cough,headache","rest, see doctor",0.12,2
...
```

**Output Fields**:
- `disease`: Disease name (string)
- `symptoms`: Input symptoms as comma-separated string
- `precautions`: Precaution text from training data
- `confidence`: Probability score (0.0 to 1.0)
- `rank`: Prediction rank (1 to 5)

## Model Metadata

### Disease Label Mapping

**File**: `models/idx_to_disease.json`

**Format**:
```json
{
  "0": "(vertigo) Paroymsal  Positional Vertigo",
  "1": "AIDS",
  "2": "Acne",
  ...
  "40": "hepatitis A"
}
```

**Usage**: Map output indices to disease names

### Disease Precautions

**Source**: `disease_sympts_prec_full.csv`

**Format**: Lookup table
- Key: Disease name
- Value: Precaution text

**Example**:
```python
precautions = {
    "Common Cold": "rest, stay hydrated, take over-the-counter medication",
    "Fungal infection": "bath twice, use detol or neem in bathing water, keep infected area dry, use clean cloths",
    ...
}
```

### Symptom List

**File**: `possible_symptoms.json`

**Format**: Sorted list of 133 symptoms
- Used to create binary feature vectors
- Order must match XGBoost input order

## ONNX Model Specifications

### XGBoost ONNX Model

**ONNX Opset Version**: 12 or higher (14 recommended)

**Inputs**:
- Name: `float_input`
- Type: `tensor(float)`
- Shape: `[batch_size, 133]`

**Outputs**:
- Name: `probabilities` (or auto-generated)
- Type: `tensor(float)`
- Shape: `[batch_size, 41]`

**Conversion Requirements**:
- Use `onnxmltools` or `skl2onnx`
- Ensure XGBoost version compatibility
- Test inference equivalence

### Transformer ONNX Model

**ONNX Opset Version**: 14 or higher (required for scaled_dot_product_attention)

**Inputs**:
- Name: `input_ids`
  - Type: `tensor(int64)`
  - Shape: `[batch_size, 256]`
- Name: `attention_mask`
  - Type: `tensor(int64)`
  - Shape: `[batch_size, 256]`

**Outputs**:
- Name: `logits` (or auto-generated)
  - Type: `tensor(float)`
  - Shape: `[batch_size, 41]`

**Conversion Requirements**:
- Use `transformers.onnx.export` or `torch.onnx.export`
- Include tokenizer configuration
- Test with sample inputs

### Fusion Layer

**Implementation Options**:

1. **Python-based** (Recommended for flexibility):
   - Simple weighted averaging in Python
   - Load weights from JSON
   - Easy to adjust weights without re-exporting

2. **ONNX-based** (For full ONNX pipeline):
   - Create ONNX graph with Add/Mul operations
   - Weights embedded in model
   - Requires re-export to change weights

**ONNX Fusion Graph**:
```
Input: xgb_probs [batch, 41], transformer_probs [batch, 41]
  -> Mul(xgb_probs, xgb_weight) -> xgb_weighted
  -> Mul(transformer_probs, transformer_weight) -> transformer_weighted
  -> Add(xgb_weighted, transformer_weighted) -> final_probs
Output: final_probs [batch, 41]
```

## Inference Pipeline

### Step-by-Step Process

1. **Input Preparation**:
   ```python
   # Get symptoms from user
   symptoms = ["fever", "cough", "headache"]
   
   # Create binary vector
   binary_vec = create_binary_vector(symptoms)  # [133]
   binary_vec = binary_vec.reshape(1, -1)  # [1, 133]
   
   # Create text input
   symptom_text = ",".join(symptoms)
   tokenized = tokenize_text(symptom_text)  # input_ids, attention_mask
   ```

2. **XGBoost Inference**:
   ```python
   import onnxruntime as ort
   
   session_xgb = ort.InferenceSession("xgboost_model.onnx")
   xgb_output = session_xgb.run(None, {"float_input": binary_vec})
   xgb_probs = xgb_output[0]  # [1, 41]
   ```

3. **Transformer Inference**:
   ```python
   session_transformer = ort.InferenceSession("transformer_model.onnx")
   transformer_output = session_transformer.run(
       None,
       {
           "input_ids": tokenized["input_ids"],
           "attention_mask": tokenized["attention_mask"]
       }
   )
   transformer_logits = transformer_output[0]  # [1, 41]
   transformer_probs = softmax(transformer_logits[0])  # [41]
   transformer_probs = transformer_probs.reshape(1, -1)  # [1, 41]
   ```

4. **Fusion**:
   ```python
   # Load weights
   with open("fusion_weights.json") as f:
       weights = json.load(f)
   
   # Combine probabilities
   final_probs = (
       weights["xgb_weight"] * xgb_probs +
       weights["transformer_weight"] * transformer_probs
   )  # [1, 41]
   ```

5. **Top-5 Selection**:
   ```python
   # Get top 5 indices
   top5_indices = np.argsort(final_probs[0])[::-1][:5]
   
   # Map to disease names
   with open("idx_to_disease.json") as f:
       idx_to_disease = json.load(f)
   
   predictions = []
   for rank, idx in enumerate(top5_indices, 1):
       disease = idx_to_disease[str(idx)]
       confidence = float(final_probs[0][idx])
       precautions = get_precautions(disease)
       
       predictions.append({
           "disease": disease,
           "confidence": confidence,
           "precautions": precautions,
           "rank": rank
       })
   ```

## Performance Requirements

### Inference Speed
- **Target**: < 100ms per prediction (end-to-end)
- **XGBoost**: < 10ms
- **Transformer**: < 50ms
- **Fusion + Post-processing**: < 40ms

### Memory Requirements
- **XGBoost Model**: ~5-10 MB
- **Transformer Model**: ~250-300 MB
- **Runtime Memory**: ~500 MB (with ONNX Runtime)

### Accuracy Targets
- **Top-1 Accuracy**: > 88%
- **Top-5 Accuracy**: > 96%
- **Per-class F1**: > 0.80 (average)

## ONNX Runtime Configuration

### Execution Providers

**Recommended Order**:
1. `CPUExecutionProvider` (default, always available)
2. `CUDAExecutionProvider` (if GPU available)
3. `TensorrtExecutionProvider` (for NVIDIA GPUs, optional)

**Example**:
```python
import onnxruntime as ort

# CPU only
session = ort.InferenceSession(
    "model.onnx",
    providers=["CPUExecutionProvider"]
)

# GPU if available
session = ort.InferenceSession(
    "model.onnx",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
```

### Session Options

```python
options = ort.SessionOptions()
options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
options.intra_op_num_threads = 4  # Adjust based on CPU cores

session = ort.InferenceSession(
    "model.onnx",
    sess_options=options,
    providers=["CPUExecutionProvider"]
)
```

## File Structure

```
models/
├── xgboost_model.onnx              # XGBoost ONNX model
├── transformer_model.onnx           # Transformer ONNX model
├── fusion_weights.json              # Fusion layer weights
├── idx_to_disease.json              # Disease label mapping
└── tokenizer/                       # Tokenizer files (if needed)
    ├── tokenizer_config.json
    ├── vocab.txt
    └── special_tokens_map.json
```

## Testing & Validation

### Unit Tests Required

1. **Input Validation**:
   - Binary vector shape and values
   - Tokenized input shape and format
   - Symptom name mapping

2. **Output Validation**:
   - Probability sum ≈ 1.0
   - Confidence scores in [0, 1]
   - Top-5 predictions sorted correctly
   - Disease names valid

3. **Model Equivalence**:
   - ONNX output matches original model
   - Fusion weights applied correctly
   - Top-5 selection works correctly

### Test Cases

**Test Case 1**: Single symptom
```python
Input: ["fever"]
Expected: Top-5 diseases with fever as symptom
```

**Test Case 2**: Multiple symptoms
```python
Input: ["fever", "cough", "headache"]
Expected: Common Cold, Influenza, etc.
```

**Test Case 3**: Rare symptom combination
```python
Input: ["yellowing_of_eyes", "dark_urine", "abdominal_pain"]
Expected: Hepatitis-related diseases
```

## Error Handling

### Input Errors
- **Invalid symptom names**: Map to closest match or skip
- **Empty symptom list**: Return error message
- **Malformed input**: Validate and return error

### Model Errors
- **Model file not found**: Clear error message
- **ONNX runtime errors**: Catch and provide context
- **Shape mismatches**: Validate before inference

### Output Errors
- **No predictions**: Handle edge cases
- **Low confidence**: Warn if all predictions < 0.1
- **Missing metadata**: Fallback to generic precautions

## Version Information

### Model Versions
- **XGBoost Model**: v1.0
- **Transformer Model**: v1.0
- **Fusion Weights**: v1.0

### ONNX Versions
- **ONNX Format**: 1.14+
- **ONNX Runtime**: 1.15+
- **Opset Version**: 14 (required for Transformer), 12+ for XGBoost

### Dependencies
- Python: 3.8+
- NumPy: 1.23+
- ONNX Runtime: 1.15+
- Transformers: 4.30+ (for tokenizer)

## Notes

1. **Batch Inference**: Models support batch inference, but typical use case is single prediction
2. **Tokenization**: Must use same tokenizer as training (DistilBERT)
3. **Preprocessing**: Binary vector creation must match training preprocessing exactly
4. **Post-processing**: Softmax required for transformer output (logits)
5. **Fusion Weights**: Can be adjusted without re-exporting models (if Python-based)

## Example Usage

See `inference.py` (to be created) for complete inference pipeline implementation.

