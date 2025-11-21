# React Native On-Device Integration

## Quick Setup

```bash
npm install onnxruntime-react-native
# or
yarn add onnxruntime-react-native
```

## Model Files

Copy all files from `deployment/` to your React Native project:
- Models: `assets/models/`
- Data: `assets/data/`
- Tokenizer: `assets/tokenizer/`

## Usage Example

```javascript
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

class SymptomAnalyzer {
  async loadModels() {
    // Load Transformer ONNX
    const modelPath = 'assets/models/transformer_model.onnx';
    this.transformerSession = await InferenceSession.create(modelPath);
    
    // Load metadata
    this.fusionWeights = require('./assets/data/fusion_weights.json');
    this.idxToDisease = require('./assets/data/idx_to_disease.json');
    this.symptomsList = require('./assets/data/possible_symptoms.json').symptoms;
  }

  createBinaryVector(symptoms) {
    const vector = new Array(133).fill(0);
    symptoms.forEach(symptom => {
      const idx = this.symptomsList.indexOf(symptom);
      if (idx !== -1) vector[idx] = 1.0;
    });
    return Float32Array.from(vector);
  }

  async predict(symptoms, topK = 5) {
    // 1. XGBoost prediction (implement or use xgboost-js)
    const binaryVec = this.createBinaryVector(symptoms);
    const xgbProbs = await this.runXGBoost(binaryVec);

    // 2. Tokenize text
    const symptomText = symptoms.join(',');
    const tokenized = this.tokenizeText(symptomText); // Use bert-tokenizer

    // 3. Transformer ONNX inference
    const inputs = {
      input_ids: new Tensor('int64', tokenized.inputIds, [1, 256]),
      attention_mask: new Tensor('int64', tokenized.attentionMask, [1, 256])
    };
    const outputs = await this.transformerSession.run(inputs);
    const logits = Array.from(outputs.logits.data);
    const transformerProbs = this.softmax(logits);

    // 4. Fusion
    const finalProbs = xgbProbs.map((xgb, i) => 
      this.fusionWeights.xgb_weight * xgb + 
      this.fusionWeights.transformer_weight * transformerProbs[i]
    );

    // 5. Top-K results
    const topIndices = finalProbs
      .map((prob, idx) => ({ prob, idx }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, topK);

    return topIndices.map((item, rank) => ({
      disease: this.idxToDisease[item.idx.toString()],
      confidence: item.prob,
      rank: rank + 1
    }));
  }

  softmax(logits) {
    const max = Math.max(...logits);
    const exp = logits.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }
}
```

## Input/Output

**Input**: `["fever", "cough", "headache"]`

**Output**:
```json
[
  {
    "disease": "Common Cold",
    "confidence": 0.85,
    "rank": 1
  },
  ...
]
```

## Model Specs

- **Transformer**: ONNX opset 14, input `[1, 256]` int64, output `[1, 41]` float32
- **XGBoost**: JSON format, input `[1, 133]` float32, output `[1, 41]` float32
- **Classes**: 41 diseases
- **Symptoms**: 133 possible symptoms

## Tokenization

Install: `npm install bert-tokenizer`

Use vocab.txt from `tokenizer/` folder.

## Performance

- **Inference**: ~50-100ms per prediction
- **Model Size**: ~255MB total
- **Memory**: ~300MB runtime
