export const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Body Pain',
  'Sore Throat',
  'Dizziness',
  'Nausea',
  'Fatigue',
  'Runny Nose',
  'Chills',
  'Shortness of Breath',
  'Diarrhea',
] as const

export type CommonSymptom = (typeof COMMON_SYMPTOMS)[number]



