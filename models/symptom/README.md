# Symptom Analysis Model - Deployment Package

## Contents

This folder contains all files needed to deploy the Hybrid Symptom Analysis Model for on-device inference.

### Model Files
- `transformer_model.onnx` - DistilBERT transformer model (ONNX format)
- `xgboost_model.json` - XGBoost model (JSON format)
- `fusion_weights.json` - Weights for combining model outputs

### Metadata Files
- `idx_to_disease.json` - Maps disease indices to names
- `possible_symptoms.json` - List of 133 possible symptoms
- `disease_sympts_prec_full.csv` - Disease names and precautions

### Tokenizer Files
- `tokenizer/` - DistilBERT tokenizer files for text preprocessing

### Documentation
- `REACT_NATIVE_INTEGRATION.md` - Integration guide for React Native
- `ONNX_MODEL_SPECIFICATIONS.md` - Technical specifications

## Quick Start

1. Copy all files to your React Native project
2. Install `onnxruntime-react-native`
3. Follow `REACT_NATIVE_INTEGRATION.md` for implementation

## Model Specifications

- **Input**: List of symptoms (e.g., ["fever", "cough", "headache"])
- **Output**: Top 5 disease predictions with confidence scores
- **Format**: JSON with disease, confidence, precautions, rank

## File Sizes

- Transformer ONNX: ~250MB
- XGBoost JSON: ~5MB
- Metadata: <1MB
- **Total**: ~255MB

## Requirements

- ONNX Runtime for React Native
- XGBoost JavaScript library (or convert XGBoost to ONNX)
- Tokenizer library (bert-tokenizer or similar)

