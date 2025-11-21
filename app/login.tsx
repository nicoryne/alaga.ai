import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, enableOfflineMode, initializing, user, offlineMode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const handleSignIn = async () => {
    setSubmitting(true)
    setError(undefined)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      if (err instanceof Error && err.message === 'ROLE_NOT_ALLOWED') {
        setError('Only health workers can sign in to the mobile app.')
      } else if (err instanceof Error && err.message === 'PROFILE_NOT_FOUND') {
        setError('Your account is missing a role assignment. Contact an administrator.')
      } else {
        setError('Unable to sign in. Check your credentials and connection.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOffline = async () => {
    setSubmitting(true)
    setError(undefined)
    try {
      await enableOfflineMode()
    } catch (err) {
      setError('No cached profile available for offline mode.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if ((user || offlineMode) && !initializing) {
      router.replace('/(tabs)')
    }
  }, [user, offlineMode, initializing, router])

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        className="flex-1"
      >
        <View className="mt-16">
          <Text className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Health Worker Portal
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-neutral-900">
            Welcome Back
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            Sign in to access the health diagnostic system.
          </Text>
        </View>

        <View className="mt-10 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-700">Username</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Enter your username"
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700">Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <Text className="text-sm text-red-500">{error}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          disabled={submitting || !email || !password || initializing}
          className="mt-8 rounded-2xl bg-[#4fc3f7] py-4"
          onPress={handleSignIn}
        >
          <Text className="text-center text-base font-semibold text-white">
            {submitting ? 'Signing in…' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View className="my-6 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-3 text-xs font-medium uppercase tracking-widest text-gray-400">
            OR
          </Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <View className="gap-3">
          <TouchableOpacity
            className="rounded-2xl border border-[#b39ddb] py-4"
            onPress={handleOffline}
            disabled={submitting}
          >
            <Text className="text-center text-base font-semibold text-[#b39ddb]">
              Use Offline Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl border border-dashed border-gray-300 py-4"
            disabled
          >
            <Text className="text-center text-base font-semibold text-gray-400">
              Use Biometric (soon)
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-6 text-center text-sm text-gray-400">
          Offline mode available · Your last synced profile will be used.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}



