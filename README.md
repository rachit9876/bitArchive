# 📱 Bit Archive - Android Build

## Prerequisites
- Node.js, JDK 17, Android Studio with SDK

## Build Commands

```bash
# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android

# Create local.properties (Linux/Mac)
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Create local.properties (Windows - replace path)
echo sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk > android\local.properties

# Build APK
cd android
chmod +x gradlew  # Linux/Mac only
./gradlew clean assembleRelease  # Linux/Mac
gradlew clean assembleRelease    # Windows
```

## Output
APK: `android/app/build/outputs/apk/release/app-release.apk`

## Install
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```
