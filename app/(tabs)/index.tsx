import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useMemo } from 'react'
import { usePatients } from '../../hooks/usePatients'
import { useAssessments } from '../../hooks/useAssessments'
import { useConnectivity } from '../../contexts/ConnectivityContext'
import { useAuth } from '../../contexts/AuthContext'
import { Header } from '../../components/Header'
import { User, ClipboardList, TrendingUp, Clock, HelpCircle, Pencil } from 'lucide-react-native'
import { router } from 'expo-router'

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

const triageColors: Record<string, string> = {
  Mild: '#2ecc71',
  Moderate: '#f5a524',
  Critical: '#ef4444',
  Unknown: '#9ca3af',
}

export default function HomeScreen() {
  const { patients } = usePatients()
  const { assessments } = useAssessments()
  const { isOnline } = useConnectivity()
  const { user, profile } = useAuth()

  // Get user's display name or email
  const userName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Health Worker'
  const userInitials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Today's assessments
  const todayAssessments = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    return assessments.filter(
      (assessment) =>
        assessment.createdAt >= start.getTime() &&
        assessment.createdAt <= end.getTime(),
    )
  }, [assessments])

  // Yesterday's assessments for comparison
  const yesterdayAssessments = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setDate(end.getDate() - 1)
    end.setHours(23, 59, 59, 999)

    return assessments.filter(
      (assessment) =>
        assessment.createdAt >= start.getTime() &&
        assessment.createdAt <= end.getTime(),
    )
  }, [assessments])

  const patientCount = patients.length
  const patientCountDiff = patientCount - (yesterdayAssessments.length > 0 ? yesterdayAssessments.length : 0)

  // Pending sync assessments
  const pendingSyncAssessments = useMemo(() => {
    return assessments.filter((a) => a.syncStatus !== 'synced')
  }, [assessments])

  // Recent assessments with patient info
  const recentAssessments = useMemo(() => {
    return assessments
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((assessment) => {
        const patient = patients.find((p) => p.id === assessment.patientId)
        return {
          ...assessment,
          patient,
        }
      })
      .filter((item) => item.patient) // Only show if patient exists
  }, [assessments, patients])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1 bg-[#f8fafc] px-6" showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View className="mt-6 flex-row items-center">
          <View
            className="mr-4 h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: '#4fc3f7' }}
          >
            <Text className="text-lg font-semibold text-white">
              {userInitials}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              Hello, {userName}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500">
              Barangay Health Worker
            </Text>
          </View>
        </View>

        {/* Today's Summary Section */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-gray-900">
            Today&apos;s Summary
          </Text>
        </View>

        <View className="mt-4 flex-row gap-4">
          {/* Patients Card */}
          <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center justify-between">
              <User color="#4fc3f7" size={20} strokeWidth={2} />
            </View>
            <Text className="mt-3 text-3xl font-semibold text-gray-900">
              {patientCount}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">total patients</Text>
            {patientCountDiff !== 0 && (
              <View className="mt-3 flex-row items-center">
                <TrendingUp color="#2ecc71" size={14} strokeWidth={2} />
                <Text className="ml-1 text-xs font-medium text-emerald-600">
                  {patientCountDiff > 0 ? '+' : ''}{patientCountDiff} from yesterday
                </Text>
              </View>
            )}
          </View>

          {/* Assessments Card */}
          <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center justify-between">
              <ClipboardList color="#4fc3f7" size={20} strokeWidth={2} />
            </View>
            <Text className="mt-3 text-3xl font-semibold text-gray-900">
              {todayAssessments.length}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">completed</Text>
            {pendingSyncAssessments.length > 0 && (
              <View className="mt-3 flex-row items-center">
                <Clock color="#f5a524" size={14} strokeWidth={2} />
                <Text className="ml-1 text-xs font-medium text-amber-600">
                  {pendingSyncAssessments.length} waiting to sync online
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pending Sync Alert */}
        {pendingSyncAssessments.length > 0 && (
          <View className="mt-6 flex-row items-start rounded-3xl bg-amber-50 px-4 py-4 shadow-sm shadow-black/5">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <HelpCircle color="#f59e0b" size={18} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-900">
                {pendingSyncAssessments.length} case assessment{pendingSyncAssessments.length > 1 ? 's' : ''} pending sync
              </Text>
              <Text className="mt-1 text-xs text-amber-700">
                Upload will automatically start once connection is available.
              </Text>
            </View>
          </View>
        )}

        {/* New Patient Assessment Button */}
        <TouchableOpacity
          className="mt-6 flex-row items-center justify-center rounded-3xl bg-[#4fc3f7] px-6 py-4 shadow-sm shadow-black/5"
          onPress={() => router.push('/(tabs)/new')}
        >
          <Pencil color="#ffffff" size={20} strokeWidth={2} />
          <Text className="ml-2 text-base font-semibold text-white">
            New Patient Assessment
          </Text>
        </TouchableOpacity>

        {/* Recent Assessments Section */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-gray-900">
            Recent Assessments
          </Text>
        </View>

        {recentAssessments.length === 0 ? (
          <View className="mt-4 rounded-3xl bg-white p-6 shadow-sm shadow-black/5">
            <Text className="text-center text-sm text-gray-400">
              No assessments yet. Create a new one to get started.
            </Text>
          </View>
        ) : (
          <View className="mt-4 gap-3">
            {recentAssessments.map((item) => {
              const patient = item.patient!
              const initials = patient.fullName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <View
                  key={item.id}
                  className="flex-row items-center rounded-3xl bg-white p-4 shadow-sm shadow-black/5"
                >
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
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-sm text-gray-500">
                      {patient.gender}, {patient.age} years old
                    </Text>
                    <View className="mt-2 flex-row items-center">
                      <View
                        className="mr-2 h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: triageColors[item.triageLevel] || triageColors.Unknown,
                        }}
                      />
                      <Text
                        className="text-xs font-medium"
                        style={{
                          color: triageColors[item.triageLevel] || triageColors.Unknown,
                        }}
                      >
                        {item.triageLevel}
                      </Text>
                      {item.summary && (
                        <>
                          <Text className="mx-2 text-xs text-gray-300">·</Text>
                          <Text className="flex-1 text-xs text-gray-500" numberOfLines={1}>
                            {item.summary}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}




