import { useMemo, useState } from 'react'
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { symptomList, groups, groupMap, searchSymptoms } from '../data/symptoms'

type SymptomSelectorProps = {
  value: string[]
  onChange: (next: string[]) => void
}

const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) => {
  const base =
    'mr-2 mb-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors'
  const selectedStyles = selected
    ? 'border-[#4fc3f7] bg-[#e0f5ff] text-[#0284c7]'
    : 'border-gray-200 bg-white text-gray-600'
  return (
    <TouchableOpacity onPress={onPress}>
      <Text className={`${base} ${selectedStyles}`}>{label}</Text>
    </TouchableOpacity>
  )
}

export function SymptomSelector({ value, onChange }: SymptomSelectorProps) {
  const [query, setQuery] = useState('')

  const filteredSections = useMemo(() => {
    if (!query.trim()) {
      return groups.map((group) => ({
        title: group,
        data: groupMap[group],
      }))
    }

    const filtered = searchSymptoms(query)
    const grouped = filtered.reduce<Record<string, typeof symptomList>>(
      (acc, symptom) => {
        if (!acc[symptom.group]) acc[symptom.group] = []
        acc[symptom.group].push(symptom)
        return acc
      },
      {},
    )
    return Object.keys(grouped)
      .sort()
      .map((group) => ({
        title: group,
        data: grouped[group],
      }))
  }, [query])

  const toggleSymptom = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((symptom) => symptom !== id))
    } else {
      onChange([...value, id])
    }
  }

  const selectedSymptomObjects = useMemo(
    () => symptomList.filter((symptom) => value.includes(symptom.id)),
    [value],
  )

  return (
    <View className="mt-6">
      <Text className="text-sm font-medium text-gray-700">
        Common Symptoms
      </Text>
      <TextInput
        placeholder="Search symptoms (e.g., rash, fever)…"
        value={query}
        onChangeText={setQuery}
        className="mt-3 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-800"
      />

      {selectedSymptomObjects.length ? (
        <View className="mt-4">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Selected
          </Text>
          <View className="mt-2 flex-row flex-wrap">
            {selectedSymptomObjects.map((symptom) => (
              <Chip
                key={`selected-${symptom.id}`}
                label={symptom.label}
                selected
                onPress={() => toggleSymptom(symptom.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-4">
        {filteredSections.length === 0 ? (
          <Text className="mt-6 text-center text-sm text-gray-400">
            No matching symptoms found.
          </Text>
        ) : (
          filteredSections.map((section) => (
            <View key={section.title} className="mb-6">
              <Text className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                {section.title}
              </Text>
              <View className="mt-2 flex-row flex-wrap">
                {section.data.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    selected={value.includes(item.id)}
                    onPress={() => toggleSymptom(item.id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  )
}


