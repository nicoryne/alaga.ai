import { Stack } from 'expo-router'
import { AuthProvider } from '../contexts/AuthContext'
import { ConnectivityProvider } from '../contexts/ConnectivityContext'

export default function AppLayout() {
  return (
    <ConnectivityProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Entry point decides between splash/login/app once auth state is known */}
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </ConnectivityProvider>
  )
}

