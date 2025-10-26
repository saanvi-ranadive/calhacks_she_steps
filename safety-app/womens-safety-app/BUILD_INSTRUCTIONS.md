# Building the App with LiveKit Voice Agent

The LiveKit voice agent requires native modules, so you **cannot run it in Expo Go**. You need to create a development build.

## Quick Start (Recommended)

### For iOS (Mac only):

```bash
# 1. Install pods (first time only)
npx expo prebuild

# 2. Run on iOS simulator or device
npx expo run:ios
```

### For Android:

```bash
# 1. Prebuild native code (first time only)
npx expo prebuild

# 2. Run on Android emulator or device
npx expo run:android
```

## Detailed Setup

### Prerequisites

**For iOS:**
- macOS
- Xcode installed
- CocoaPods installed (`sudo gem install cocoapods`)

**For Android:**
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

### Step 1: Configure Environment Variables

Create `.env.local` file in the app root:

```bash
cd womens-safety-app
cp .env.local.example .env.local
```

Edit `.env.local`:
```
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
EXPO_PUBLIC_API_URL=http://localhost:5001
```

### Step 2: Prebuild Native Code

This generates the `ios/` and `android/` directories with native code:

```bash
npx expo prebuild
```

This will:
- Generate native iOS and Android projects
- Install LiveKit native dependencies
- Configure app permissions (camera, microphone)

### Step 3: Build and Run

**iOS:**
```bash
# Run on simulator
npx expo run:ios

# Run on specific device
npx expo run:ios --device
```

**Android:**
```bash
# Run on emulator
npx expo run:android

# Run on specific device
npx expo run:android --device
```

### Step 4: Start Backend Server

In a separate terminal, start your backend:

```bash
cd ../backend
source venv/bin/activate
python app.py
```

### Step 5: Configure LiveKit

Follow the `VOICE_AGENT_SETUP.md` guide to:
1. Get LiveKit credentials from https://cloud.livekit.io
2. Deploy a voice agent
3. Configure backend `.env` file

## Development Workflow

Once you have the development build:

1. **Make code changes** - Edit your React Native code
2. **See changes instantly** - The app will reload automatically
3. **Rebuild only when needed** - You only need to rebuild when:
   - Adding new native dependencies
   - Changing app.json configuration
   - Updating native code

## Troubleshooting

### "Unable to resolve module @livekit/react-native"

Run prebuild again:
```bash
npx expo prebuild --clean
```

### iOS Build Fails

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

### Android Build Fails

1. Open Android Studio
2. File → Open → Select the `android` folder
3. Let Gradle sync
4. Run from Android Studio or CLI

### "Expo Go" vs "Development Build"

- **Expo Go**: Quick prototyping, limited to Expo SDK modules only ❌ LiveKit won't work
- **Development Build**: Full native access, all modules work ✅ LiveKit works

## Alternative: EAS Build (Cloud Building)

If you don't want to set up local build tools:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile development

# Build for Android
eas build --platform android --profile development
```

Then install the build on your device and use Expo development server.

## Testing the Voice Agent

1. Make sure backend is running
2. Open the app on your device/simulator
3. Go to "Voice AI" tab
4. Tap "Start Voice Session"
5. Speak to test the voice agent

## Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [LiveKit Expo Setup](https://docs.livekit.io/home/quickstarts/expo)
- [LiveKit React Native SDK](https://github.com/livekit/client-sdk-react-native)
