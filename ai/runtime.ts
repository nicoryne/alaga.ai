import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'

type ModelEntry = {
  id: string
  type: 'onnx' | 'tflite'
  path: string
  description: string
  input: string[]
  output: string[]
  sizeMB: number
}

type ModelManifest = {
  version: string
  models: ModelEntry[]
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const manifest: ModelManifest = require('../models/manifest.json')

const MODEL_ASSETS: Record<string, any> = {
  'models/symptom/model.onnx': require('../models/symptom/model.onnx'),
  'models/image/model.tflite': require('../models/image/model.tflite'),
  'models/translator/model.onnx': require('../models/translator/model.onnx'),
}

export const listModels = () => manifest.models

export const getModelById = (id: string) =>
  manifest.models.find((model) => model.id === id)

export const ensureModelCached = async (model: ModelEntry) => {
  const assetModule = MODEL_ASSETS[model.path]
  if (!assetModule) {
    throw new Error(
      `Model asset for ${model.id} not found. Verify manifest path ${model.path}`,
    )
  }
  const cacheDir = `${FileSystem.cacheDirectory}models`
  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(
    () => {},
  )
  const destination = `${cacheDir}/${model.id}`
  const existing = await FileSystem.getInfoAsync(destination)
  if (existing.exists) {
    return existing.uri
  }

  const asset = Asset.fromModule(assetModule)
  await asset.downloadAsync()
  if (!asset.localUri) {
    throw new Error(`Unable to cache asset for model ${model.id}`)
  }
  await FileSystem.copyAsync({
    from: asset.localUri,
    to: destination,
  })
  return destination
}


