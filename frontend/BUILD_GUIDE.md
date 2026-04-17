# 🎲 Claw & Order: Dice Unit - Build Guide

## Build an APK (Android) in 3 Steps

### Prerequisites
- Node.js 18+ installed → [nodejs.org](https://nodejs.org)
- A free Expo account → [expo.dev/signup](https://expo.dev/signup)

---

### Step 1: Install Tools
Open your terminal and paste:

```bash
npm install -g eas-cli expo-cli
```

### Step 2: Login & Setup
Navigate to the `frontend` folder and run:

```bash
cd frontend
npx expo login
```
Enter your Expo account email and password.

Then initialize your project:
```bash
eas init
```
This will link your project to your Expo account and fill in the `projectId` in `app.json`.

### Step 3: Build the APK
Paste this single command:

```bash
eas build --platform android --profile preview
```

**That's it!** EAS will build your APK in the cloud (~10 min). When done, you'll get a **download link** for the `.apk` file.

---

## Quick Reference

| What | Command |
|------|---------|
| **Android APK** (shareable) | `eas build --platform android --profile preview` |
| **Android AAB** (Play Store) | `eas build --platform android --profile production` |
| **iOS Simulator** | `eas build --platform ios --profile preview` |
| **iOS App Store** | `eas build --platform ios --profile production` |

---

## 📲 Install the APK

### On your Android phone:
1. Download the `.apk` from the link EAS gives you
2. Open the file on your phone
3. Allow "Install from unknown sources" if prompted
4. Tap Install → Done!

### Share with friends:
- Send them the APK download link directly
- Or upload to Google Drive and share the link

---

## 🍎 iOS Build (Optional)

Requires an **Apple Developer Account** ($99/year):

```bash
eas build --platform ios --profile production
```

---

## ⚠️ Important: Backend URL

Before building, update the backend URL in `frontend/.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://your-deployed-backend-url.com
```

If you deploy your backend on Emergent, use the deployed URL.
For local-only play (no leaderboard), the game works fully offline — no backend needed.

---

## 🚀 Full Copy-Paste Script (Android APK)

Open terminal, navigate to your downloaded project, and paste:

```bash
cd frontend
npm install -g eas-cli
npx expo login
eas init
yarn install
eas build --platform android --profile preview
```

Follow the prompts. Your APK download link will appear when the build completes!
