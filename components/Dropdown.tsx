import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native'

interface DropdownProps {
  label: string
  placeholder: string
  options: string[]
  value: string
  onSelect: (value: string) => void
  disabled?: boolean
  required?: boolean
}

export function Dropdown({
  label,
  placeholder,
  options,
  value,
  onSelect,
  disabled = false,
  required = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => !disabled && setIsOpen(true)}
        className={`mt-2 rounded-2xl border border-gray-200 px-4 py-3 ${
          disabled ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        <Text
          className={`text-base ${
            value ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-lg font-semibold text-gray-900">
                {label}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text className="text-base font-semibold text-[#4fc3f7]">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item)
                    setIsOpen(false)
                  }}
                  className={`px-4 py-3 ${
                    value === item ? 'bg-[#4fc3f7]/10' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`text-base ${
                      value === item ? 'font-semibold text-[#4fc3f7]' : 'text-gray-900'
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
})

