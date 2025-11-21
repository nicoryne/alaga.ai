import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const USERS_COLLECTION = 'users'

/**
 * Updates the user's display name in their profile
 */
export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, {
    displayName: displayName.trim(),
    updatedAt: new Date().toISOString(),
  })
}

