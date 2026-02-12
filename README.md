# Bit Archive – Android Build

Get your personal private image vault with cloud support to store old or less frequently used images such as screenshots, memes, and more. You can also use it to securely store your private images. 

<a href="https://github.com/rachit9876/bitArchive/releases/latest/download/bitArchive.apk">
  <img src="https://cdn-public.pages.dev/public/7306f2977d10.png" width="60">
</a>

[![Download](https://img.shields.io/badge/Download-APK-purple?style=for-the-badge&logo=github)](https://github.com/rachit9876/bitArchive/releases/latest/download/bitArchive.apk)

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
