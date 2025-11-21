import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { auth, db } from '../lib/firebase'
import { UserRole } from '../types/patient'

type MinimalUser = Pick<User, 'uid' | 'email' | 'displayName'>

export interface UserProfile {
  uid: string
  email?: string | null
  displayName?: string | null
  role: UserRole
  doctorId?: string | null
  region?: string
  assignedHealthWorkerIds?: string[]
}

interface CachedSession {
  user: MinimalUser
  profile: UserProfile
}

interface AuthContextState {
  user: MinimalUser | null
  profile: UserProfile | null
  initializing: boolean
  offlineMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  enableOfflineMode: () => Promise<void>
  disableOfflineMode: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextState | null>(null)

const LAST_USER_KEY = 'alaga:last_user'
const USERS_COLLECTION = 'users'

async function fetchUserProfile(uid: string): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    throw new Error('PROFILE_NOT_FOUND')
  }
  const data = snapshot.data() || {}
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    role: data.role ?? 'healthworker',
    doctorId: data.doctorId ?? null,
    region: data.region,
    assignedHealthWorkerIds: data.assignedHealthWorkerIds ?? [],
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<MinimalUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const minimalUser: MinimalUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          }
          const fetchedProfile = await fetchUserProfile(firebaseUser.uid)
          if (fetchedProfile.role !== 'healthworker') {
            throw new Error('ROLE_NOT_ALLOWED')
          }
          setUser(minimalUser)
          setProfile(fetchedProfile)
          setOfflineMode(false)
          const cachePayload: CachedSession = { user: minimalUser, profile: fetchedProfile }
          await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(cachePayload))
        } catch (error) {
          console.warn('Failed to hydrate profile', error)
          setUser(null)
          setProfile(null)
          await AsyncStorage.removeItem(LAST_USER_KEY)
          await firebaseSignOut(auth)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const fetchedProfile = await fetchUserProfile(credential.user.uid)
    if (fetchedProfile.role !== 'healthworker') {
      await firebaseSignOut(auth)
      throw new Error('ROLE_NOT_ALLOWED')
    }
  }

  const signOut = async () => {
    setOfflineMode(false)
    setUser(null)
    setProfile(null)
    await firebaseSignOut(auth)
    await AsyncStorage.removeItem(LAST_USER_KEY)
  }

  const enableOfflineMode = useCallback(async () => {
    if (user && profile?.role === 'healthworker') {
      setOfflineMode(true)
      return
    }

    const cached = await AsyncStorage.getItem(LAST_USER_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedSession
        if (parsed?.profile?.role !== 'healthworker') {
          throw new Error('Offline mode available for health workers only.')
        }
        setUser(parsed.user)
        setProfile(parsed.profile)
        setOfflineMode(true)
        return
      } catch (error) {
        console.warn('Failed to parse cached session', error)
      }
    }
    throw new Error('No cached profile available for offline mode.')
  }, [user, profile])

  const disableOfflineMode = () => {
    setOfflineMode(false)
  }

  const refreshProfile = useCallback(async () => {
    if (!user) return
    try {
      const fetchedProfile = await fetchUserProfile(user.uid)
      setProfile(fetchedProfile)
      // Update cached profile
      const minimalUser: MinimalUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
      const cachePayload: CachedSession = { user: minimalUser, profile: fetchedProfile }
      await AsyncStorage.setItem(LAST_USER_KEY, JSON.stringify(cachePayload))
    } catch (error) {
      console.warn('Failed to refresh profile:', error)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      initializing,
      offlineMode,
      signIn,
      signOut,
      enableOfflineMode,
      disableOfflineMode,
      refreshProfile,
    }),
    [user, profile, initializing, offlineMode, enableOfflineMode, refreshProfile]
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
