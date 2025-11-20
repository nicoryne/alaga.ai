import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useMemo, useState } from 'react'
import { usePatients } from '../../hooks/usePatients'
import { PatientRecord } from '../../types/patient'
import { Header } from '../../components/Header'

const triageColors: Record<string, string> = {
  Mild: '#2ecc71',
  Moderate: '#f5a524',
  Critical: '#ef4444',
  Unknown: '#9ca3af',
}

const SyncBadge = ({ status }: { status: string | undefined }) => {
  if (status === 'synced') {
    return (
      <Text className="text-xs text-emerald-600">Sync successful</Text>
    )
  }
  if (status === 'error') {
    return <Text className="text-xs text-red-500">Sync error</Text>
  }
  return <Text className="text-xs text-gray-400">Pending sync</Text>
}

const PatientRow = ({ patient }: { patient: PatientRecord }) => {
  const initials = patient.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <TouchableOpacity className="mb-4 flex-row items-center rounded-3xl bg-white p-4 shadow-sm shadow-black/5">
      <View
        className="mr-4 h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: '#f3f4f6' }}
      >
        <Text className="text-base font-semibold text-gray-700">
          {initials}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            {patient.fullName}
          </Text>
          <Text className="text-xs text-gray-400">
            {new Date(patient.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <Text className="mt-1 text-sm text-gray-500">
          {patient.gender}, {patient.age} years old
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <View
            className="rounded-full px-2 py-1"
            style={{
              backgroundColor: `${triageColors[patient.latestTriage ?? 'Unknown']}20`,
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: triageColors[patient.latestTriage ?? 'Unknown'] }}
            >
              {patient.latestTriage ?? 'Unknown'}
            </Text>
          </View>
          <SyncBadge status={patient.syncStatus} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function PatientsScreen() {
  const { patients, loading } = usePatients()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return patients
    return patients.filter((patient) =>
      patient.fullName.toLowerCase().includes(normalized),
    )
  }, [patients, search])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <View className="flex-1 bg-[#f8fafc] px-6 pt-6">
        <View>
          <Text className="text-lg font-semibold text-gray-900">
            Patient Records
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Review and manage all assessments for your barangay.
          </Text>
        </View>

      <TextInput
        placeholder="Search for patient records..."
        className="mt-4 rounded-3xl bg-white px-5 py-3 text-base text-gray-800 shadow-sm shadow-black/5"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        className="mt-4"
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-sm text-gray-400">
            {loading
              ? 'Loading patients...'
              : 'No patient records yet. Start a new assessment to create one.'}
          </Text>
        }
        renderItem={({ item }) => <PatientRow patient={item} />}
      />
      </View>
    </SafeAreaView>
  )
}



