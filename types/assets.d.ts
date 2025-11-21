// Type declarations for binary model assets
declare module '*.onnx' {
  const value: any
  export default value
}

declare module '*.tflite' {
  const value: any
  export default value
}

declare module '*.json' {
  const content: any
  export default content
}

declare module '*.txt' {
  const content: string
  export default content
}


