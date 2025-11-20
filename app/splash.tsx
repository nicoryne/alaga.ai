import { View, ActivityIndicator, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../theme'

export default function SplashScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <View className="items-center">
        <Text
          style={{
            fontSize: 32,
            fontWeight: '600',
            color: theme.colors.neutralDark,
          }}
        >
          alaga.ai
        </Text>
        <Text className="mt-2 text-gray-500">Loading health worker portal…</Text>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          className="mt-6"
        />
      </View>
    </SafeAreaView>
  )
}



