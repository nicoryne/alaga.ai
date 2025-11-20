import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { theme } from '../../theme'
import { useAuth } from '../../contexts/AuthContext'
import { useConnectivity } from '../../contexts/ConnectivityContext'

function OfflineBanner() {
  const { offlineMode, disableOfflineMode } = useAuth()
  const { isOnline, connectionType } = useConnectivity()

  if (isOnline && !offlineMode) return null

  return (
    <View className="w-full items-center bg-amber-50 py-2">
      <Text className="text-xs text-amber-700">
        {isOnline
          ? 'Offline mode active · Tap Sync to reconnect when available'
          : `No internet connection (${connectionType}). App running offline.`}
      </Text>
      {offlineMode ? (
        <Text
          onPress={disableOfflineMode}
          className="mt-1 text-xs font-semibold text-amber-800 underline"
        >
          Exit offline mode
        </Text>
      ) : null}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0.5,
            borderTopColor: '#e5e7eb',
          },
          tabBarLabelStyle: {
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="patients" options={{ title: 'Patients' }} />
        <Tabs.Screen name="new" options={{ title: 'New' }} />
        <Tabs.Screen name="sync" options={{ title: 'Sync' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  )
}


