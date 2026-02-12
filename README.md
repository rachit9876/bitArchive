# 📱 Android Build Setup Guide

This guide describes how to go from a downloaded ZIP of the source code to a fully built and installed Android APK.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js** (LTS version recommended) - [Download](https://nodejs.org/)
2.  **Java Development Kit (JDK 17)** - Required for Android builds.
    -   *Windows/Mac/Linux*: [Download temurin-17-jdk](https://adoptium.net/temurin/releases/?version=17)
3.  **Android Studio** - [Download](https://developer.android.com/studio)
    -   During installation, ensure **Android SDK**, **Android SDK Platform-Tools**, and **Android SDK Build-Tools** are selected.

---

## 🚀 Step 1: Extract and Initialize

1.  **Unzip the specific folder**: Extract the downloaded ZIP file to a location of your choice (e.g., `Downloads/MyProject`).
2.  **Open a Terminal**:
    -   *Windows*: Open PowerShell or Command Prompt.
    -   *Mac/Linux*: Open Terminal.
3.  **Navigate to the project directory**:
    ```bash
    cd path/to/extracted/folder
    ```
4.  **Install Dependencies**:
    Run the following command to install all necessary JavaScript libraries:
    ```bash
    npm install
    ```

---

## ⚙️ Step 2: Configure Android Environment

You must tell the build system where your Android SDK is located.

1.  **Find your Android SDK path**:
    -   *Windows*: Usually `C:\Users\<Username>\AppData\Local\Android\Sdk`
    -   *Mac*: Usually `/Users/<Username>/Library/Android/sdk`
    -   *Linux*: Usually `/home/<Username>/Android/Sdk`

2.  **Create `local.properties`**:
    -   Navigate to the `android` folder inside the project.
    -   Create a new file named `local.properties`.
    -   Open it with a text editor and add your SDK path.
    
    **Example (Windows):**
    ```properties
    sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
    ```
    *(Note the double backslashes on Windows)*

    **Example (Mac/Linux):**
    ```properties
    sdk.dir=/home/username/Android/Sdk
    ```

---

## 🏗️ Step 3: Build the APK

1.  **Navigate to the android directory** (if not already there):
    ```bash
    cd android
    ```

2.  **Clean the project** (optional but recommended to avoid cache issues):
    ```bash
    ./gradlew clean
    ```
    *(Windows users: run `gradlew clean` without `./`)*

3.  **Build the Release APK**:
    ```bash
    ./gradlew assembleRelease
    ```
    *(Windows users: run `gradlew assembleRelease`)*

    ⏳ **Note**: The first build may take 10-20 minutes as it downloads strict dependencies.

---

## 📲 Step 4: Install and Run

Once the build completes successfully (indicated by `BUILD SUCCESSFUL`), your APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

### Option A: Install via ADB (Command Line)
1.  Connect your Android device via USB.
2.  Ensure **USB Debugging** is enabled in *Developer Options*.
3.  Run:
    ```bash
    adb install -r app/build/outputs/apk/release/app-release.apk
    ```

### Option B: Manual Install
1.  Navigate to `android/app/build/outputs/apk/release/` in your file explorer.
2.  Copy `app-release.apk` to your phone (via USB, Drive, etc.).
3.  Tap the file on your phone to install.

---

## ❓ Troubleshooting

### "SDK location not found"
Ensure you created the `local.properties` file in the `android/` directory with the correct `sdk.dir` path.

### "JAVA_HOME is not set"
Ensure you have JDK 17 installed and your `JAVA_HOME` environment variable is set correctly.
-   *Verification*: Run `java -version` and `javac -version` in your terminal.

### "Execution failed for task ':app:compressReleaseAssets'"
This can happen if file paths are too long or contain spaces. Try moving the project to a shorter path (e.g., `C:\repo` or `~/repo`).

### "Permission denied" (Linux/Mac)
If you cannot run `./gradlew`, make it executable:
```bash
chmod +x gradlew
```
