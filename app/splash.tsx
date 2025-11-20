import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SplashScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <View className="items-center">
        <Text className="text-4xl font-bold text-neutral-50">alaga.ai</Text>
        <Text className="mt-2 text-gray-500">Loading health worker portal…</Text>
        <ActivityIndicator size="large" className="mt-6" />
      </View>
    </SafeAreaView>
  )
}
