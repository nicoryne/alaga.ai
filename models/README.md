# Local AI Model Onboarding

1. Export or download the latest ONNX/TFLite weights for the symptom classifier, image diagnostic CNN, and translator.
2. Drop the files into the folders under `models/` using the same filenames referenced in `models/manifest.json`.
3. Update `models/manifest.json` with the correct metadata (version, size, input/output signatures) whenever you swap in a new model.
4. On app boot, `ai/runtime.ts` reads the manifest and copies each model asset into the device cache so the inference engines can consume them.

> Tip: keep model sizes below ~100 MB to remain Expo-friendly. Use integer quantization before exporting. 

