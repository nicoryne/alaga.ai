import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

export default function Home() {
  const signOut = async () => {
    router.replace('/(auth)/sign-in')
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Protected Home</Text>
      <Pressable
        onPress={signOut}
        style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#eee', borderRadius: 8 }}
      >
        <Text>Sign Out</Text>
      </Pressable>
    </View>
  )
}
