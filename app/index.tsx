import { Redirect } from 'expo-router'
import SplashScreen from './splash'
import { useAuth } from '../contexts/AuthContext'

export default function Index() {
  const { initializing, user, offlineMode } = useAuth()

  if (initializing) {
    return <SplashScreen />
  }

  if (user || offlineMode) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/login" />
}



