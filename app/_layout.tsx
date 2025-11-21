import '@/global.css'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ConnectivityProvider } from '../contexts/ConnectivityContext'
import { initializeModels } from '../ai/model-initializer'

export default function AppLayout() {
  useEffect(() => {
    // Initialize AI models in the background
    initializeModels().catch((error) => {
      console.error('Failed to initialize AI models:', error)
    })
  }, [])

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
