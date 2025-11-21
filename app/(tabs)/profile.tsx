import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useState, useEffect } from 'react'
import { Header } from '../../components/Header'
import { useAuth } from '../../contexts/AuthContext'
import { updateUserDisplayName } from '../../services/userService'
import { User, LogOut, Mail, Shield, MapPin, Edit2, Check, X } from 'lucide-react-native'

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [saving, setSaving] = useState(false)

  // Update display name when profile changes
  useEffect(() => {
    setDisplayName(profile?.displayName || '')
  }, [profile?.displayName])

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      await updateUserDisplayName(user.uid, displayName.trim())
      await refreshProfile() // Refresh profile to show updated name
      setIsEditing(false)
      Alert.alert('Success', 'Name updated successfully')
    } catch (error) {
      console.error('Failed to update name:', error)
      Alert.alert(
        'Error',
        `Failed to update name: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setDisplayName(profile?.displayName || '')
    setIsEditing(false)
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut()
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out')
          }
        },
      },
    ])
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'healthworker':
        return 'Health Worker'
      case 'doctor':
        return 'Doctor'
      case 'superadmin':
        return 'Super Admin'
      default:
        return 'Unknown'
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'HW'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header />
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Profile Header */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-[#4fc3f7] items-center justify-center mb-4">
            <Text className="text-3xl font-bold text-white">
              {getInitials(profile?.displayName || user?.displayName)}
            </Text>
          </View>
          {isEditing ? (
            <View className="w-full max-w-xs">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                className="text-center text-xl font-semibold text-gray-900 border-b-2 border-[#4fc3f7] pb-2"
                autoFocus
              />
              <View className="flex-row justify-center gap-4 mt-4">
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={saving}
                  className="flex-row items-center gap-2 rounded-full bg-[#4fc3f7] px-6 py-2"
                >
                  {saving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Check color="white" size={18} />
                      <Text className="text-white font-semibold">Save</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  disabled={saving}
                  className="flex-row items-center gap-2 rounded-full border border-gray-300 px-6 py-2"
                >
                  <X color="#6b7280" size={18} />
                  <Text className="text-gray-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-2xl font-semibold text-gray-900">
                {profile?.displayName || user?.displayName || 'Health Worker'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="flex-row items-center gap-2 mt-2"
              >
                <Edit2 color="#4fc3f7" size={16} />
                <Text className="text-[#4fc3f7] text-sm font-medium">Edit Name</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Profile Information Cards */}
        <View className="gap-4 mb-6">
          {/* Email */}
          <View className="rounded-2xl border border-gray-200 p-4">
            <View className="flex-row items-center gap-3">
              <Mail color="#6b7280" size={20} />
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Email
                </Text>
                <Text className="mt-1 text-base text-gray-900">
                  {user?.email || profile?.email || 'Not available'}
                </Text>
              </View>
            </View>
          </View>

          {/* Role */}
          <View className="rounded-2xl border border-gray-200 p-4">
            <View className="flex-row items-center gap-3">
              <Shield color="#6b7280" size={20} />
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Role
                </Text>
                <Text className="mt-1 text-base text-gray-900">
                  {getRoleLabel(profile?.role)}
                </Text>
              </View>
            </View>
          </View>

          {/* Region */}
          {profile?.region && (
            <View className="rounded-2xl border border-gray-200 p-4">
              <View className="flex-row items-center gap-3">
                <MapPin color="#6b7280" size={20} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Region
                  </Text>
                  <Text className="mt-1 text-base text-gray-900">{profile.region}</Text>
                </View>
              </View>
            </View>
          )}

          {/* User ID (for reference) */}
          <View className="rounded-2xl border border-gray-200 p-4">
            <View className="flex-row items-center gap-3">
              <User color="#6b7280" size={20} />
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  User ID
                </Text>
                <Text className="mt-1 text-xs text-gray-500 font-mono" numberOfLines={1}>
                  {user?.uid || 'Not available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mt-6 mb-8 flex-row items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-4"
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="text-base font-semibold text-red-600">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}



