import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const ensureConfig = () => {
  const missingKey = Object.entries(firebaseConfig).find(([, value]) => !value)
  if (missingKey) {
    console.warn(`Firebase config missing value for ${missingKey[0]}. Check your EXPO_PUBLIC_FIREBASE_* env vars.`)
  }
}

ensureConfig()

const createFirebaseApp = () => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig)
  }
  return getApp()
}

const app = createFirebaseApp()

let auth: ReturnType<typeof getAuth>
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
} catch (error) {
  auth = getAuth(app)
}

let db: ReturnType<typeof getFirestore>
try {
  db = getFirestore(app)
} catch (error) {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager(),
    }),
  })
}

export { app, auth, db }
