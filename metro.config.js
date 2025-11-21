const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver.unstable_enablePackageExports = true

// Add .onnx and .tflite as asset extensions
config.resolver.assetExts.push('onnx', 'tflite')

module.exports = withNativeWind(config, { input: './global.css' })
