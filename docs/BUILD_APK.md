# Building APK for Android

This guide explains how to export your alaga.ai app as an APK file for Android.

## Option 1: EAS Build (Recommended - Cloud Build)

EAS Build is Expo's cloud-based build service. It's the easiest and most reliable method.

### Prerequisites
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project:
   ```bash
   eas build:configure
   ```

### Build APK

**For testing/internal distribution:**
```bash
eas build --platform android --profile preview
```

**For production:**
```bash
eas build --platform android --profile production
```

The build will run in the cloud. You'll get a download link when it's complete (usually 10-20 minutes).

### Download APK
- Check your email or visit: https://expo.dev/accounts/[your-account]/builds
- Download the APK file
- Install on Android devices

---

## Option 2: Local Build (Using Gradle)

Since you've already run `npx expo prebuild`, you can build locally.

### Prerequisites
1. **Android Studio** installed
2. **Java Development Kit (JDK)** 17 or higher
3. **Android SDK** configured

### Build Steps

1. **Navigate to Android folder:**
   ```bash
   cd android
   ```

2. **Build APK (Debug - for testing):**
   ```bash
   ./gradlew assembleDebug
   ```
   
   The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Build APK (Release - for production):**
   ```bash
   ./gradlew assembleRelease
   ```
   
   The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Signing Release APK (Required for Production)

For release builds, you need to sign the APK:

1. **Generate a keystore** (first time only):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore alaga-keystore.p12 -alias alaga-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/keystore.properties`:**
   ```properties
   storePassword=your-store-password
   keyPassword=your-key-password
   keyAlias=alaga-key
   storeFile=../alaga-keystore.p12
   ```

3. **Update `android/app/build.gradle`** to use signing config (if not already configured)

4. **Build signed release:**
   ```bash
   ./gradlew assembleRelease
   ```

---

## Option 3: Using Expo CLI (Simpler Local Build)

If you want a simpler local build without dealing with Gradle directly:

```bash
npx expo run:android --variant release
```

This will build and install the release APK. The APK file will be in:
`android/app/build/outputs/apk/release/app-release.apk`

---

## Which Method to Use?

- **EAS Build**: Best for production, handles signing automatically, no local setup needed
- **Local Build (Gradle)**: Good for quick testing, requires Android Studio setup
- **Expo CLI**: Simplest local option, but still requires Android SDK

## Notes

- **Debug APK**: Larger file size, includes debugging symbols, not suitable for Play Store
- **Release APK**: Optimized, smaller, ready for distribution (needs signing for Play Store)
- **APK Size**: Expect 30-50MB for your app (includes AI models)

## Troubleshooting

1. **"SDK not found"**: Install Android SDK via Android Studio
2. **"Gradle build failed"**: Check `android/gradle.properties` and ensure all dependencies are installed
3. **"Signing error"**: Make sure keystore file exists and passwords are correct

