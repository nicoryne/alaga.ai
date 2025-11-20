import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native'
import { waitForPendingWrites } from 'firebase/firestore'
import { useMemo } from 'react'
import { db } from '../../lib/firebase'
import { useConnectivity } from '../../contexts/ConnectivityContext'
import { usePatients } from '../../hooks/usePatients'
import { useAssessments } from '../../hooks/useAssessments'
import { Header } from '../../components/Header'

export default function SyncScreen() {
  const { isOnline, connectionType } = useConnectivity()
  const { patients } = usePatients()
  const { assessments } = useAssessments()

  const pendingUploads = useMemo(
    () => [
      ...patients
        .filter((patient) => patient.syncStatus !== 'synced')
        .map((patient) => ({
          id: `patient-${patient.id}`,
          title: patient.fullName,
          subtitle: 'Patient record',
          timestamp: patient.updatedAt,
        })),
      ...assessments
        .filter((assessment) => assessment.syncStatus !== 'synced')
        .map((assessment) => ({
          id: `assessment-${assessment.id}`,
          title: `${assessment.triageLevel} assessment`,
          subtitle: 'Assessment summary',
          timestamp: assessment.updatedAt,
        })),
    ],
    [patients, assessments],
  )

  const syncHistory = useMemo(
    () =>
      assessments
        .filter((assessment) => assessment.syncStatus === 'synced')
        .slice(0, 5),
    [assessments],
  )

  const localUsageMb = (patients.length * 0.2 + assessments.length * 0.35).toFixed(1)
  const usagePercentage = Math.min(
    (Number(localUsageMb) / 512) * 100,
    100,
  )

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'Connect to the internet to sync pending records.',
      )
      return
    }
    await waitForPendingWrites(db)
    Alert.alert('Sync queued', 'Outstanding writes are being synchronized.')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1 bg-[#f8fafc] px-6 pt-6">
        <View className="rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-base font-semibold text-gray-900">
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {isOnline
            ? 'We will sync automatically in the background.'
            : `Waiting for connection (${connectionType}).`}
        </Text>
        <View className="mt-4">
          <Text className="text-xs uppercase text-gray-400">Local Storage</Text>
          <Text className="mt-1 text-lg font-semibold text-gray-900">
            {localUsageMb} MB / 512 MB
          </Text>
          <View className="mt-2 h-2 rounded-full bg-gray-100">
            <View
              className="h-full rounded-full bg-[#4fc3f7]"
              style={{ width: `${usagePercentage}%` }}
            />
          </View>
        </View>
        <TouchableOpacity
          className="mt-4 rounded-2xl bg-[#4fc3f7] py-3"
          onPress={handleSyncNow}
        >
          <Text className="text-center text-sm font-semibold text-white">
            Sync Now
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-base font-semibold text-gray-900">
          Pending Uploads
        </Text>
        {pendingUploads.length === 0 ? (
          <Text className="mt-4 text-sm text-gray-400">
            No pending uploads. You are all synced up!
          </Text>
        ) : (
          <View className="mt-4 gap-3">
            {pendingUploads.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-amber-800">
                  {item.title}
                </Text>
                <Text className="text-xs text-amber-600">{item.subtitle}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-base font-semibold text-gray-900">
          Sync History
        </Text>
        {syncHistory.length === 0 ? (
          <Text className="mt-4 text-sm text-gray-400">
            No sync events yet.
          </Text>
        ) : (
          <View className="mt-4 gap-3">
            {syncHistory.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-emerald-800">
                  {item.triageLevel} case synced
                </Text>
                <Text className="text-xs text-emerald-700">
                  {new Date(item.updatedAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  )
}




