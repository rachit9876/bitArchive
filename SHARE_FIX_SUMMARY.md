# bitArchive Share Fix - Summary

## Issue
When trying to share images from other apps (like Gallery, Chrome, etc.), bitArchive was not showing up as an option in the share menu.

## Root Cause
The AndroidManifest.xml file requires specific intent filters to register the app as a share target. Manual changes to `android/app/src/main/AndroidManifest.xml` can be overwritten during `expo prebuild` or `expo run:android`, causing the fix to disappear. Additionally, some apps might share images via text/links, requiring broader mime-type support.

## Solution: Implemented `app.config.js`

Instead of editing `AndroidManifest.xml` manually, a permanent configuration plugin has been added in `app.config.js`. This ensures the intent filters are automatically injected every time the app is built.

**New Configuration:**
- **Single Share (`SEND`)**: Supports `image/*` AND `text/plain` (for URL shares).
- **Multiple Share (`SEND_MULTIPLE`)**: Supports `image/*`.

## Changes Made
1.  **Created `app.config.js`**: Contains a custom Expo Config Plugin `withShareMenuIntent` that modifies the Android Manifest during build time.
2.  **Ran `npx expo prebuild`**: verified that the intent filters are correctly injected into `android/app/src/main/AndroidManifest.xml`.

## How to Apply Fix
You must rebuild the native Android app for these changes to take effect.

```bash
# 1. Rebuild the project (this will use the new app.config.js)
npx expo run:android

# OR if you just want to build the APK
cd android && ./gradlew assembleRelease
```

## Testing
1.  Install the new build on your device.
2.  Open Gallery or Google Photos.
3.  Share an image -> bitArchive should appear.
4.  Share a link to an image (from Chrome) -> bitArchive should appear.
