declare module 'firebase/auth' {
  export type Auth = any
  export type User = {
    uid: string
    email?: string | null
    displayName?: string | null
  }
  export function getAuth(app?: any): Auth
  export function initializeAuth(app: any, options: any): Auth
  export function getReactNativePersistence(storage: any): any
  export function onAuthStateChanged(
    auth: Auth,
    callback: (user: User | null) => void,
  ): () => void
  export function signInWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string,
  ): Promise<void>
  export function signOut(auth: Auth): Promise<void>
}

declare module 'firebase/firestore' {
  export type Firestore = any
  export function getFirestore(app?: any): Firestore
  export function initializeFirestore(app: any, options: any): Firestore
  export function collection(db: Firestore, path: string): any
  export function addDoc(collectionRef: any, data: any): Promise<any>
  export function doc(db: Firestore, collectionPath: string, id: string): any
  export function setDoc(docRef: any, data: any, options?: any): Promise<void>
  export function onSnapshot(
    query: any,
    callback: (snapshot: any) => void,
  ): () => void
  export function serverTimestamp(): any
  export function query(...args: any[]): any
  export function where(field: string, op: any, value: any): any
  export function orderBy(field: string, direction?: 'asc' | 'desc'): any
  export type QueryDocumentSnapshot<T = any> = {
    id: string
    data(): T
  }
  export type DocumentData = Record<string, any>
  export function persistentLocalCache(options?: any): any
  export function persistentSingleTabManager(): any
}



