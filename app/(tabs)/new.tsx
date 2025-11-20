import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useMemo, useState } from 'react'
import { createPatient } from '../../services/patientService'
import { PatientFormInput } from '../../types/patient'
import { useAuth } from '../../contexts/AuthContext'
import { runAssessment, AssessmentResult } from '../../ai/engine'
import { createAssessmentRecord } from '../../services/assessmentService'
import { AssessmentPayload } from '../../types/assessment'
import { SymptomSelector } from '../../components/SymptomSelector'
import { extractSymptomsFromText } from '../../data/symptoms'
import {
  getRegions,
  getProvincesByRegion,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from '../../data/philippines-new'
import { Dropdown } from '../../components/Dropdown'

const initialForm: PatientFormInput = {
  fullName: '',
  age: '',
  gender: '',
  contactNumber: '',
  region: '',
  province: '',
  municipality: '',
  barangay: '',
}

const initialVitals = {
  bloodPressure: '120/80',
  temperature: '36.5',
  heartRate: '75',
  oxygenLevel: '98',
}

type Step = 1 | 2 | 3 | 'loading'

export default function NewAssessmentEntryScreen() {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [patientId, setPatientId] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [vitals, setVitals] = useState(initialVitals)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [photoUri, setPhotoUri] = useState<string>()
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [language, setLanguage] = useState<'English' | 'Tagalog'>('English')
  const [savingAssessment, setSavingAssessment] = useState(false)
  const detectedSymptoms = useMemo(() => extractSymptomsFromText(notes), [notes])
  const suggestedSymptoms = useMemo(
    () => detectedSymptoms.filter((symptom) => !symptoms.includes(symptom)),
    [detectedSymptoms, symptoms],
  )

  // Geographic data
  const regions = useMemo(() => getRegions(), [])
  const availableProvinces = useMemo(
    () => (form.region ? getProvincesByRegion(form.region) : []),
    [form.region],
  )
  const availableMunicipalities = useMemo(
    () =>
      form.region && form.province
        ? getMunicipalitiesByProvince(form.region, form.province)
        : [],
    [form.region, form.province],
  )
  const availableBarangays = useMemo(
    () =>
      form.region && form.province && form.municipality
        ? getBarangaysByMunicipality(form.region, form.province, form.municipality)
        : [],
    [form.region, form.province, form.municipality],
  )

  const updateField = (key: keyof PatientFormInput, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }
      // Cascade updates: clear dependent fields when parent changes
      if (key === 'region') {
        updated.province = ''
        updated.municipality = ''
        updated.barangay = ''
      } else if (key === 'province') {
        updated.municipality = ''
        updated.barangay = ''
      } else if (key === 'municipality') {
        updated.barangay = ''
      }
      return updated
    })
  }

  const canSubmitStep1 =
    form.fullName &&
    form.age &&
    form.gender &&
    form.region &&
    form.province &&
    form.municipality &&
    form.barangay &&
    user

  const updateVitals = (key: keyof typeof initialVitals, value: string) => {
    setVitals((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((item) => item !== symptom)
        : [...prev, symptom],
    )
  }

  const handlePhotoCapture = useCallback(async () => {
    const permissions = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissions.granted) {
      Alert.alert(
        'Camera permission needed',
        'Please enable camera access to attach a photo.',
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    })

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri)
    }
  }, [])

  const handleSavePatient = () => {
    // Just move to next step - patient will be saved after all steps complete
    setCurrentStep(2)
  }

  const handleAnalyze = async () => {
    if (!patientId) {
      Alert.alert(
        'Patient required',
        'Complete patient information before running assessment.',
      )
      return
    }

    setCurrentStep('loading')
    try {
      const parsedVitals = {
        bloodPressure: vitals.bloodPressure,
        temperature: Number(vitals.temperature),
        heartRate: Number(vitals.heartRate),
        oxygenLevel: Number(vitals.oxygenLevel),
      }

      const aiResult = await runAssessment({
        patientName: form.fullName,
        vitals: parsedVitals,
        symptoms,
        notes,
      })

      setResult(aiResult)
      setCurrentStep(3)
    } catch (error) {
      Alert.alert(
        'AI assessment failed',
        'Unable to run the diagnostic models right now.',
      )
      setCurrentStep(2)
    }
  }

  const handleSaveAssessment = async () => {
    if (!user || !result) return
    setSavingAssessment(true)
    try {
      // Save patient first if not already saved
      let finalPatientId = patientId
      if (!finalPatientId) {
        finalPatientId = await createPatient(form, user.uid)
        setPatientId(finalPatientId)
      }

      const payload: AssessmentPayload = {
        patientId: finalPatientId,
        createdBy: user.uid,
        vitals: {
          bloodPressure: vitals.bloodPressure,
          temperature: Number(vitals.temperature),
          heartRate: Number(vitals.heartRate),
          oxygenLevel: Number(vitals.oxygenLevel),
        },
        symptoms,
        notes,
        triageLevel: result.triageLevel,
        probableConditions: result.probableConditions,
        summary: result.explanation,
        simplifiedSummary: result.simplifiedSummary,
        recommendedActions: result.recommendedActions,
        photoUri,
      }

      await createAssessmentRecord(payload)
      Alert.alert(
        'Assessment saved',
        'Patient and assessment have been stored locally and will sync when online.',
      )
    } catch (error) {
      Alert.alert(
        'Save failed',
        'Unable to store this assessment right now. Please try again shortly.',
      )
    } finally {
      setSavingAssessment(false)
    }
  }

  const handleShareSummary = async () => {
    if (!result) return
    const message = `Alaga.ai Assessment for ${form.fullName}\nTriage: ${result.triageLevel}\nSummary: ${language === 'Tagalog' ? result.simplifiedSummary : result.explanation}\nRecommended Actions: ${result.recommendedActions.join('; ')}`
    try {
      await Share.share({ message })
    } catch (error) {
      Alert.alert('Sharing failed', 'Unable to open share sheet.')
    }
  }

  const resetAssessment = () => {
    setForm(initialForm)
    setVitals(initialVitals)
    setSymptoms([])
    setNotes('')
    setPhotoUri(undefined)
    setResult(null)
    setPatientId(undefined)
    setLanguage('English')
    setCurrentStep(1)
  }

  const stepIndicator = useMemo(
    () => (
      <View className="mt-4 flex-row items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            className={`h-2 rounded-full ${currentStep === step ? 'bg-[#b39ddb]' : 'bg-gray-200'}`}
            style={{ width: currentStep === step ? 32 : 16 }}
          />
        ))}
      </View>
    ),
    [currentStep],
  )

  const renderStepHeader = (
    title: string,
    subtitle: string,
    stepLabel: string,
  ) => (
    <View>
      <Text className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
        {stepLabel}
      </Text>
      <Text className="mt-2 text-2xl font-semibold text-gray-900">{title}</Text>
      <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>
      {stepIndicator}
    </View>
  )

  const renderStep1 = () => (
    <ScrollView
      className="flex-1 px-6 pt-6"
      keyboardShouldPersistTaps="handled"
    >
      {renderStepHeader(
        'Patient Information',
        'Collect basic demographic details before recording vitals.',
        'Step 1 of 3',
      )}
      <View className="mt-8 space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700">
            Patient Full Name *
          </Text>
          <TextInput
            placeholder="Juan Dela Cruz"
            className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            value={form.fullName}
            onChangeText={(value) => updateField('fullName', value)}
          />
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700">Age *</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="25"
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={form.age}
              onChangeText={(value) => updateField('age', value)}
            />
          </View>
          <View className="flex-1">
            <Dropdown
              label="Gender"
              placeholder="Select Gender"
              options={['Male', 'Female', 'Other']}
              value={form.gender}
              onSelect={(value) => updateField('gender', value)}
              required
            />
          </View>
        </View>
        <View>
          <Text className="text-sm font-medium text-gray-700">
            Contact Number
          </Text>
          <TextInput
            placeholder="0912 345 6789"
            keyboardType="phone-pad"
            className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
            value={form.contactNumber}
            onChangeText={(value) => updateField('contactNumber', value)}
          />
        </View>
        <View>
          <Dropdown
            label="Region"
            placeholder="Select Region"
            options={regions}
            value={form.region}
            onSelect={(value) => updateField('region', value)}
            required
          />
        </View>
        <View>
          <Dropdown
            label="Province"
            placeholder="Select Province"
            options={availableProvinces}
            value={form.province}
            onSelect={(value) => updateField('province', value)}
            disabled={!form.region}
            required
          />
        </View>
        <View>
          <Dropdown
            label="Municipality/City"
            placeholder="Select Municipality or City"
            options={availableMunicipalities}
            value={form.municipality}
            onSelect={(value) => updateField('municipality', value)}
            disabled={!form.province}
            required
          />
        </View>
        <View>
          <Dropdown
            label="Barangay"
            placeholder="Select Barangay"
            options={availableBarangays}
            value={form.barangay}
            onSelect={(value) => updateField('barangay', value)}
            disabled={!form.municipality}
            required
          />
        </View>
      </View>
    </ScrollView>
  )

  const renderPhotoSection = () => (
    <View className="mt-6">
      <Text className="text-sm font-medium text-gray-700">
        Photo documentation
      </Text>
      {photoUri ? (
        <View className="mt-3 rounded-3xl border border-dashed border-gray-300 p-4">
          <Image
            source={{ uri: photoUri }}
            className="h-40 w-full rounded-2xl"
            resizeMode="cover"
          />
          <View className="mt-4 flex-row justify-between">
            <TouchableOpacity
              className="rounded-full border border-gray-300 px-4 py-2"
              onPress={() => setPhotoUri(undefined)}
            >
              <Text className="text-sm text-gray-600">Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-full border border-[#4fc3f7] px-4 py-2"
              onPress={handlePhotoCapture}
            >
              <Text className="text-sm text-[#4fc3f7]">Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="mt-3 rounded-3xl border border-dashed border-gray-300 p-6"
          onPress={handlePhotoCapture}
        >
          <Text className="text-center text-sm text-gray-500">
            Take Photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderStep2 = () => (
    <ScrollView
      className="flex-1 px-6 pt-6"
      keyboardShouldPersistTaps="handled"
    >
      {renderStepHeader(
        'Patient Vitals & Symptoms',
        'Record accurate measurements and current symptoms.',
        'Step 2 of 3',
      )}
      <View className="mt-8 space-y-4">
        {(
          [
            { label: 'Blood Pressure (mmHg)', key: 'bloodPressure' },
            { label: 'Temperature (°C)', key: 'temperature' },
            { label: 'Heart Rate (bpm)', key: 'heartRate' },
            { label: 'Oxygen Level (%)', key: 'oxygenLevel' },
          ] as const
        ).map(({ label, key }) => (
          <View key={key}>
            <Text className="text-sm font-medium text-gray-700">
              {label}
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
              value={vitals[key]}
              onChangeText={(value) => updateVitals(key, value)}
            />
          </View>
        ))}
      </View>

      <SymptomSelector value={symptoms} onChange={setSymptoms} />

      {!!suggestedSymptoms.length && (
        <View className="mt-4 rounded-2xl border border-dashed border-[#d8b4fe] p-4">
          <Text className="text-sm font-semibold text-[#6d28d9]">
            Suggested from notes
          </Text>
          <Text className="text-xs text-[#6b7280]">
            Tap to confirm if these symptoms apply.
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            {suggestedSymptoms.map((symptom) => (
              <TouchableOpacity
                key={`suggest-${symptom}`}
                onPress={() => toggleSymptom(symptom)}
                className="mr-2 mb-2 rounded-full border border-[#d8b4fe] bg-[#f5f3ff] px-4 py-2"
              >
                <Text className="text-xs font-semibold text-[#6d28d9]">
                  {symptom.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View className="mt-6">
        <Text className="text-sm font-medium text-gray-700">
          Additional Details
        </Text>
        <TextInput
          placeholder="Describe symptoms in detail..."
          multiline
          numberOfLines={4}
          className="mt-2 rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <View className="mt-4 flex-row gap-4">
        <TouchableOpacity className="flex-1 rounded-2xl border border-gray-200 py-3">
          <Text className="text-center text-sm font-semibold text-gray-400">
            Voice Input (soon)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-2xl border border-[#4fc3f7] py-3"
          onPress={handlePhotoCapture}
        >
          <Text className="text-center text-sm font-semibold text-[#4fc3f7]">
            {photoUri ? 'Photo Attached' : 'Take Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderPhotoSection()}
    </ScrollView>
  )

  const renderStep3 = () => {
    if (!result) return null
    return (
      <ScrollView className="flex-1 px-6 pt-6">
        {renderStepHeader(
          'AI Results',
          'Recommendations generated from the embedded AI models.',
          'Step 3 of 3',
        )}
        <View className="mt-8 rounded-3xl bg-gray-900 p-5">
          <Text className="text-sm text-gray-300">Triage Level</Text>
          <Text className="mt-2 text-3xl font-semibold text-white">
            {result.triageLevel}
          </Text>
          <Text className="mt-2 text-sm text-gray-400">
            {result.explanation}
          </Text>
        </View>
        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
          <Text className="text-base font-semibold text-gray-900">
            Probable Conditions
          </Text>
          <View className="mt-4 gap-4">
            {result.probableConditions.map((condition) => (
              <View key={condition.name}>
                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-gray-700">
                    {condition.name}
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {(condition.probability * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className="mt-2 h-2 rounded-full bg-gray-100">
                  <View
                    className="h-full rounded-full bg-[#4fc3f7]"
                    style={{ width: `${condition.probability * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-6 rounded-3xl border border-gray-200 p-5">
          <Text className="text-base font-semibold text-gray-900">
            Recommended Actions
          </Text>
          <View className="mt-4 gap-3">
            {result.recommendedActions.map((action) => (
              <Text key={action} className="text-sm text-gray-600">
                • {action}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            className="mt-4 rounded-2xl border border-[#4fc3f7] py-3"
            onPress={handleShareSummary}
          >
            <Text className="text-center text-sm font-semibold text-[#4fc3f7]">
              Share Summary
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm shadow-black/5">
          <Text className="text-base font-semibold text-gray-900">
            Translation & Simplification
          </Text>
          <View className="mt-4 flex-row gap-3">
            {(['English', 'Tagalog'] as const).map((lang) => {
              const selected = language === lang
              return (
                <TouchableOpacity
                  key={lang}
                  className={`flex-1 rounded-2xl border py-3 ${selected ? 'border-[#b39ddb]' : 'border-gray-200'}`}
                  onPress={() => setLanguage(lang)}
                >
                  <Text
                    className="text-center text-sm font-semibold"
                    style={{
                      color: selected ? '#b39ddb' : '#6b7280',
                    }}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <Text className="mt-4 text-sm text-gray-500">
            {language === 'Tagalog'
              ? result.simplifiedSummary
              : result.explanation}
          </Text>
        </View>
      </ScrollView>
    )
  }

  const renderLoading = () => (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator size="large" color="#4fc3f7" />
      <Text className="mt-4 text-lg font-semibold text-gray-900">
        Analyzing Symptoms
      </Text>
      <Text className="mt-2 text-center text-sm text-gray-500">
        Our AI is processing vitals, symptoms, and notes using multiple
        diagnostic models…
      </Text>
    </View>
  )

  const renderContent = () => {
    if (currentStep === 1) return renderStep1()
    if (currentStep === 2) return renderStep2()
    if (currentStep === 3) return renderStep3()
    return renderLoading()
  }

  const renderFooterButton = () => {
    if (currentStep === 1) {
      return (
        <TouchableOpacity
          className="rounded-2xl bg-[#b39ddb] py-4"
          disabled={!canSubmitStep1}
          onPress={handleSavePatient}
        >
          <Text className="text-center text-base font-semibold text-white">
            Next Step
          </Text>
        </TouchableOpacity>
      )
    }
    if (currentStep === 2) {
      return (
        <TouchableOpacity
          className="rounded-2xl bg-[#4fc3f7] py-4"
          onPress={handleAnalyze}
        >
          <Text className="text-center text-base font-semibold text-white">
            Run AI Assessment
          </Text>
        </TouchableOpacity>
      )
    }
    if (currentStep === 3) {
      return (
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 rounded-2xl border border-gray-200 py-4"
            onPress={resetAssessment}
          >
            <Text className="text-center text-base font-semibold text-gray-600">
              New Assessment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-2xl bg-[#b39ddb] py-4"
            onPress={handleSaveAssessment}
            disabled={savingAssessment}
          >
            <Text className="text-center text-base font-semibold text-white">
              {savingAssessment ? 'Saving…' : 'Save Summary'}
            </Text>
          </TouchableOpacity>
        </View>
      )
    }
    return null
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        className="flex-1"
      >
        {renderContent()}
        {currentStep !== 'loading' ? (
          <View className="border-t border-gray-100 px-6 py-4">
            {renderFooterButton()}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}




