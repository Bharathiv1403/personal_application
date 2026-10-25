# 👑 AAYON — Executive Personal Life OS Mobile Application

> **AAYON** is an executive-tier, local-first, offline-ready Personal Life Operating System mobile application built with **React Native 0.81**, **Expo SDK 54**, and **TypeScript**.

---

## 🌟 Key Architecture & Capabilities

### 1. 💼 CareerPilot Engine & Automated ATS
* **140+ Pre-Loaded Matching Remote Roles**: Direct integration with remote job databases.
* **Live Discovery Engine**: Real-time auto-search hitting live job boards (Arbeitnow & Jobicy).
* **Resume PDF Intake & Parser**: Upload and parse resume files with `expo-document-picker`.
* **Dynamic ATS Match Scoring**: Evaluates candidate fit (up to 99%) against target stack (React, React Native, Next.js, Vue, TypeScript).
* **1-Click Apply 🚀**: Directly opens official application URLs and advances pipeline to "Applied".
* **AI Tailored Cover Letter ✍️**: Generates 3-paragraph executive cover letters using Google Gemini AI.
* **Tech & HR Interview Coach**: Tailored technical questions (React 19 Fiber, RSC, Zustand, Hermes/FCM, OIDC) with instant AI feedback.
* **Corporate English Phrasebook**: Corporate idioms and polite phrasing with Tamil explanations.

### 2. 🔐 On-Device Privacy & Security Vault
* **Hardware Biometrics**: Local fingerprint & Face Unlock via `expo-local-authentication`.
* **Hardware Keystore**: 4-digit PIN stored in encrypted Android Keystore via `expo-secure-store`.
* **100% Local Storage**: All personal, health, and wealth records stored on-device via `AsyncStorage`.
* **Portable WhatsApp / Google Drive Backup**: 1-tap encrypted JSON export and import.

### 3. 🏃 Health & Vitality OS
* **Hardware Pedometer**: Real-time step tracking using `expo-sensors` hardware pedometer.
* **Active Metrics**: Computes Kcal burned, distance in km, and active move minutes.
* **Hydration Tracker**: 1-tap water intake tracking with daily progress.
* **Dynamic 7-Day Consistency**: Rolling movement consistency graphs.

### 4. 💰 Smart Wealth & Debt (Vatti) Engine
* **Tamil Nadu Vatti Calculator**: Monthly flat interest calculation (e.g. 2 rooba vatti).
* **Principal Part-Repayment Engine**: Automatically recalibrates remaining principal and future monthly interest.
* **Gold Portfolio**: Grams and Savaran (sovereign) net worth tracker with market valuations.
* **Trip Budget Splitwise**: Group expense tracker with member split breakdown.
* **Monthly Grocery Checklist**: Essential provisions checklist with pending expense totals.

### 5. ✅ Action Items & To-Do Engine
* **Categorized Lists**: Work, Tech, Health, Finance, Personal.
* **Priority Flags**: High, Medium, Low indicators.
* **Status Filtering**: Filter by Pending, Completed, or All with clear-completed action.

### 6. ⚙️ Executive Settings & Profile
* **Profile Management**: Name, Email, Auth Provider badge.
* **Career & Resume Vault**: View active resume, target roles, experience, notice period, and CTC.
* **PIN & Biometric Controls**: Change security PIN, toggle biometric lock.
* **One-Tap Portability**: WhatsApp / Google Drive backup and restore.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+
* Expo CLI (`npx expo`)
* Expo Go app on Android/iOS (or Android Emulator)

### Installation
```bash
git clone https://github.com/Bharathiv1403/personal_application.git
cd personal_application
npm install
```

### Environment Configuration (.env)
Create a `.env` file in the project root:
```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_WEATHER_API_KEY=your_openweather_api_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_oauth_client_id_here
```

### Running Locally
```bash
npx expo start -c
```

### Building & Downloading Standalone APK from GitHub 📦

#### Option 1: Automated GitHub Actions (Free & Direct APK Download)
1. **From GitHub Actions Artifacts:**
   - Go to your repository on GitHub: `https://github.com/Bharathiv1403/personal_application`
   - Click the **Actions** tab.
   - Click the **Build Android APK** workflow on the left.
   - Click **Run workflow** -> **Run workflow** (or simply push any commit to `main`).
   - Once completed, open the workflow run and scroll to **Artifacts** to download `aayon-v1.0.0-apk.zip` containing the installable `.apk`.

2. **From GitHub Releases (1-Click APK Download):**
   - In GitHub Actions -> **Build Android APK**, trigger with `Publish APK to GitHub Releases` set to `true` (or push a tag `git tag v1.0.0 && git push origin v1.0.0`).
   - Go to the **Releases** tab on GitHub and download `aayon-v1.0.0.apk` directly to your phone.

#### Option 2: EAS Cloud Build
```bash
# Preview standalone APK
npx eas build --profile preview --platform android

# Production Google Play Store App Bundle (.aab)
npx eas build --profile production --platform android
```

---

## 📜 License
Private personal project developed by **Bharathi V**.
