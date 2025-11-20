import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, FlatList } from 'react-native'
import { useMemo } from 'react'
import { usePatients } from '../../hooks/usePatients'
import { useAssessments } from '../../hooks/useAssessments'
import { useConnectivity } from '../../contexts/ConnectivityContext'

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function HomeScreen() {
  const { patients } = usePatients()
  const { assessments } = useAssessments()
  const { isOnline } = useConnectivity()

  const todayCounts = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const todays = assessments.filter(
      (assessment) =>
        assessment.createdAt >= start.getTime() &&
        assessment.createdAt <= end.getTime(),
    )

    const byTriage = {
      Mild: todays.filter((a) => a.triageLevel === 'Mild').length,
      Moderate: todays.filter((a) => a.triageLevel === 'Moderate').length,
      Critical: todays.filter((a) => a.triageLevel === 'Critical').length,
    }

    return {
      total: todays.length,
      ...byTriage,
    }
  }, [assessments])

  const pendingItems = useMemo(() => {
    const pendingPatients = patients
      .filter((p) => p.syncStatus !== 'synced')
      .map((p) => ({
        id: `patient-${p.id}`,
        title: p.fullName,
        type: 'Patient',
        timestamp: p.updatedAt,
      }))
    const pendingAssessments = assessments
      .filter((a) => a.syncStatus !== 'synced')
      .map((a) => ({
        id: `assessment-${a.id}`,
        title: `${a.triageLevel} case`,
        type: 'Assessment',
        timestamp: a.updatedAt,
      }))

    return [...pendingPatients, ...pendingAssessments].sort(
      (a, b) => b.timestamp - a.timestamp,
    )
  }, [patients, assessments])

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc] px-6 pt-6">
      <View>
        <Text className="text-lg font-semibold text-gray-900">
          Today&apos;s Summary
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          {isOnline ? 'Connected' : 'Offline mode'} ·{' '}
          {todayCounts.total} assessments today
        </Text>
      </View>

      <View className="mt-4 flex-row gap-4">
        {[
          { label: 'Total', value: todayCounts.total, color: '#111827' },
          { label: 'Mild', value: todayCounts.Mild, color: '#10b981' },
          { label: 'Moderate', value: todayCounts.Moderate, color: '#f59e0b' },
          { label: 'Critical', value: todayCounts.Critical, color: '#ef4444' },
        ].map((stat) => (
          <View
            key={stat.label}
            className="flex-1 rounded-3xl bg-white p-4 shadow-sm shadow-black/5"
          >
            <Text
              className="text-xs font-medium uppercase tracking-wide text-gray-400"
            >
              {stat.label}
            </Text>
            <Text
              className="mt-2 text-2xl font-semibold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            Pending Sync
          </Text>
          <Text className="text-xs font-medium text-gray-400">
            {pendingItems.length} items
          </Text>
        </View>
        {pendingItems.length === 0 ? (
          <Text className="mt-4 text-sm text-gray-400">
            All caught up! Records will sync automatically when online.
          </Text>
        ) : (
          <View className="mt-4 gap-3">
            {pendingItems.slice(0, 3).map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-amber-800">
                  {item.title}
                </Text>
                <Text className="text-xs text-amber-600">
                  {item.type} · {formatTime(item.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="mt-6 flex-1 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-base font-semibold text-gray-900">
          Recent Assessments
        </Text>
        <FlatList
          className="mt-4"
          data={assessments.slice(0, 5)}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-sm text-gray-400">
              No assessments yet. Create a new one to get started.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-4 rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-900">
                  {item.triageLevel} case
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="mt-2 text-sm text-gray-500">
                {item.summary}
              </Text>
              <Text className="mt-1 text-xs text-gray-400">
                Sync: {item.syncStatus}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}




