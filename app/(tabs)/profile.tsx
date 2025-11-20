import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, ScrollView } from 'react-native'
import { Header } from '../../components/Header'

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1 px-6 pt-6">
        <View>
          <Text className="text-lg font-medium text-gray-900">Profile</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Health worker profile and settings will be configured here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}



