import { View, Text, Image } from 'react-native'
import { Wifi, WifiOff } from 'lucide-react-native'
import { useConnectivity } from '../contexts/ConnectivityContext'

export function Header() {
  const { isOnline } = useConnectivity()

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      {/* Left: Logo and Branding */}
      <View className="flex-row items-center">
        <Image
          source={require('../assets/images/logo-transparent.png')}
          style={{ width: 40, height: 40 }}
          className="mr-3"
          resizeMode="contain"
        />
        <View>
          <Text className="text-lg font-semibold text-gray-900">alaga.ai</Text>
          <Text className="text-xs text-gray-500">Health Worker Portal</Text>
        </View>
      </View>

      {/* Right: Connectivity Status */}
      <View className="flex-row items-center">
        {isOnline ? (
          <>
            <Wifi color="#2ecc71" size={20} strokeWidth={2} />
            <Text className="ml-2 text-sm font-medium text-emerald-600">
              Online
            </Text>
          </>
        ) : (
          <>
            <WifiOff color="#ef4444" size={20} strokeWidth={2} />
            <Text className="ml-2 text-sm font-medium text-red-500">
              Offline
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

