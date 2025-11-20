import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { Home, Users, PlusCircle, RefreshCcw, UserRound } from 'lucide-react-native'
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
        <Text onPress={disableOfflineMode} className="mt-1 text-xs font-semibold text-amber-800 underline">
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
          tabBarActiveTintColor: '#4fc3f7',
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
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, focused }) => (
              <Users color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="new"
          options={{
            title: 'New',
            tabBarIcon: ({ color, focused }) => (
              <PlusCircle color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: 'Sync',
            tabBarIcon: ({ color, focused }) => (
              <RefreshCcw color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <UserRound color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}
