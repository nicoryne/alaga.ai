import symptomSource from '../models/symptom/possible_symptoms.json'

export type SymptomId = string

export interface SymptomDefinition {
  id: SymptomId
  label: string
  keywords: string[]
  group: string
}

const snakeToTitle = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const rawSymptoms: SymptomId[] = symptomSource.symptoms

const synonymMap: Record<string, SymptomId> = {
  'shortness of breath': 'breathlessness',
  breathless: 'breathlessness',
  'skin rash': 'skin_rash',
  rash: 'skin_rash',
  fever: 'high_fever',
  'low grade fever': 'mild_fever',
  nausea: 'nausea',
  vomiting: 'vomiting',
  'stomach ache': 'belly_pain',
  diarrhea: 'diarrhoea',
  diarrhoea: 'diarrhoea',
  cough: 'cough',
  headache: 'headache',
  dizziness: 'dizziness',
  fatigue: 'fatigue',
}

export const symptomList: SymptomDefinition[] = rawSymptoms.map((id) => {
  const label = snakeToTitle(id)
  const keywords = [
    id.replace(/_/g, ' '),
    label,
    label.toLowerCase(),
    id,
  ]
  const group = label[0].toUpperCase()
  return { id, label, keywords, group }
})

export const groupMap = symptomList.reduce<Record<string, SymptomDefinition[]>>(
  (acc, symptom) => {
    if (!acc[symptom.group]) {
      acc[symptom.group] = []
    }
    acc[symptom.group].push(symptom)
    return acc
  },
  {},
)

Object.keys(groupMap).forEach((group) => {
  groupMap[group].sort((a, b) => a.label.localeCompare(b.label))
})

export const groups = Object.keys(groupMap).sort()

export const normalizeSymptom = (input: string): SymptomId | null => {
  if (!input) return null
  const cleaned = input.trim().toLowerCase()
  if (synonymMap[cleaned]) {
    return synonymMap[cleaned]
  }
  const normalized = cleaned.replace(/\s+/g, '_')
  if (rawSymptoms.includes(normalized)) return normalized
  return null
}

export const extractSymptomsFromText = (text: string): SymptomId[] => {
  if (!text) return []
  const matches = new Set<SymptomId>()
  const lowerText = text.toLowerCase()
  Object.entries(synonymMap).forEach(([phrase, id]) => {
    if (lowerText.includes(phrase)) {
      matches.add(id)
    }
  })
  rawSymptoms.forEach((id) => {
    const plain = id.replace(/_/g, ' ')
    if (lowerText.includes(plain)) {
      matches.add(id)
    }
  })
  return Array.from(matches)
}

export const searchSymptoms = (query: string) => {
  if (!query.trim()) return symptomList
  const cleaned = query.trim().toLowerCase()
  return symptomList.filter((symptom) =>
    symptom.keywords.some((keyword) => keyword.includes(cleaned)),
  )
}


