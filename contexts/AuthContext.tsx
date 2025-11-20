import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

type MinimalUser = Pick<User, 'uid' | 'email' | 'displayName'>

interface AuthContextState {
  user: MinimalUser | null
  initializing: boolean
  offlineMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  enableOfflineMode: () => Promise<void>
  disableOfflineMode: () => void
}

const AuthContext = createContext<AuthContextState | null>(null)

const LAST_USER_KEY = 'alaga:last_user'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<MinimalUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const minimalUser: MinimalUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }
        setUser(minimalUser)
        setOfflineMode(false)
        await AsyncStorage.setItem(
          LAST_USER_KEY,
          JSON.stringify(minimalUser),
        )
      } else {
        setUser(null)
      }
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    setOfflineMode(false)
    await firebaseSignOut(auth)
    await AsyncStorage.removeItem(LAST_USER_KEY)
  }

  const enableOfflineMode = async () => {
    if (user) {
      setOfflineMode(true)
      return
    }

    const cached = await AsyncStorage.getItem(LAST_USER_KEY)
    if (cached) {
      setUser(JSON.parse(cached))
      setOfflineMode(true)
    } else {
      throw new Error('No cached profile available for offline mode.')
    }
  }

  const disableOfflineMode = () => {
    setOfflineMode(false)
  }

  const value = useMemo(
    () => ({
      user,
      initializing,
      offlineMode,
      signIn,
      signOut,
      enableOfflineMode,
      disableOfflineMode,
    }),
    [user, initializing, offlineMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}


