# SKAAP — App Store & Play Store Submission Guide

This document is the step-by-step path from the current repo to a live
TestFlight build and a Google Play internal-testing release. Follow it in
order on a Mac (iOS) and on Mac/Linux/Windows (Android).

---

## 0 · One-time prerequisites

| You need | Where |
|---|---|
| Apple Developer Program ($99/yr) | https://developer.apple.com/programs |
| Google Play Console developer ($25 one-time) | https://play.google.com/console |
| Xcode 16+ (Mac only) | App Store |
| Android Studio Hedgehog+ | https://developer.android.com/studio |
| Node 20, Bun, JDK 17 | local dev |

App identity already set in `capacitor.config.ts`:

- **Bundle ID / Application ID**: `com.skaap.app`
- **App name**: `SKAAP`
- **App version** lives in `package.json` `version` field (bump per release)

---

## 1 · Switch the app from "live reload" to a production build

The current `capacitor.config.ts` includes a `server.url` that points at the
Lovable sandbox so iOS/Android simulators hot-reload during dev. **Apple and
Google will reject a build that loads its UI from an external URL.**

Before you archive a release:

1. Pull the repo locally (Lovable → Export to GitHub → `git clone`).
2. In `capacitor.config.ts`, **comment out or delete the entire `server`
   block**.
3. Build the web bundle and sync it into the native projects:

```bash
bun install
bun run build
npx cap sync
```

`cap sync` copies `dist/` into the iOS/Android projects and refreshes
native plugin pods/gradle deps.

---

## 2 · Store assets (already generated)

All of the marketing material below is in `/mnt/documents/store-assets/`:

```
store-assets/
├── ios/
│   ├── AppIcon-1024.png          ← App Store icon (required, no alpha)
│   ├── Splash-2732.png            ← Launch image (universal)
│   └── Splash-2732-Universal.png
├── android/
│   ├── ic_launcher-512.png        ← Play Console "high-res icon" (required)
│   ├── ic_launcher-192.png
│   └── feature-graphic-1024x500.png  ← Play Store feature graphic (required)
├── marketing/
└── screenshots/
    └── 01-home.png                ← seed screenshot; capture 5+ in step 5
```

> The `AppIcon-1024.png` file must have **no alpha channel** — Apple rejects
> transparent icons. It was exported flat for that reason.

---

## 3 · iOS — TestFlight pipeline

### 3.1 Set the app icon in Xcode

```bash
open ios/App/App.xcworkspace
```

In the left sidebar: **App ▸ Assets ▸ AppIcon**, then drag
`store-assets/ios/AppIcon-1024.png` into the **App Store iOS 1024pt** slot.
Xcode 16 will auto-generate the smaller sizes.

For the launch screen, replace the contents of
`ios/App/App/Assets.xcassets/Splash.imageset/` with the three files from
`store-assets/ios/Splash-2732*.png` (keep the same filenames Xcode expects:
`splash-2732x2732.png`, `splash-2732x2732-1.png`, `splash-2732x2732-2.png`).

### 3.2 Signing

Project navigator ▸ select the **App** target ▸ **Signing & Capabilities**:

- Team: your Apple Developer team
- Bundle Identifier: `com.skaap.app`
- Automatic signing: ON

### 3.3 Capabilities to add (matches the manifest the WebView uses)

- Push Notifications (only if you wire FCM/APNs later)
- Associated Domains (only if you ship Universal Links for `useskaap.com`)
- Camera & Photo Library are already in `Info.plist`; confirm the usage
  strings read like:
  - `NSCameraUsageDescription` → "SKAAP uses the camera to scan barcodes on
    food and beauty products."
  - `NSLocationWhenInUseUsageDescription` → "SKAAP uses your location to show
    food trends in your city. We never share or sell location data."

### 3.4 Archive & upload

In Xcode: **Product ▸ Destination ▸ Any iOS Device (arm64)** → **Product ▸
Archive**. When Organizer opens, click **Distribute App ▸ App Store Connect ▸
Upload**.

### 3.5 App Store Connect listing

Go to https://appstoreconnect.apple.com → **My Apps ▸ +**:

| Field | Value |
|---|---|
| Platform | iOS |
| Name | SKAAP |
| Primary language | English (U.S.) |
| Bundle ID | `com.skaap.app` |
| SKU | `skaap-ios-1` |
| User Access | Full Access |

In the new app, fill **App Information**:

- **Category**: Health & Fitness (Primary), Food & Drink (Secondary)
- **Content rights**: You own all content
- **Age rating**: 4+

In **Privacy**, set the privacy policy URL to
`https://useskaap.com/privacy` and complete the privacy questionnaire — the
app collects: Identifiers (anonymous user ID), Diagnostics (crash data),
Usage Data (scan counts). No tracking, no ads.

In **Pricing**: Free, all territories.

In **App Review Information**:

- **Demo account**: provide a test email/password to a seeded account
- **Notes**: "SKAAP scans product barcodes via the device camera. Open the
  app, allow camera permission, point at any food barcode. No purchase
  required to demo core scan functionality. SKAAP Plus subscription is
  $1.99/mo via in-app upgrade."

Once the build finishes processing in TestFlight (~15 min), add internal
testers and submit for App Review.

---

## 4 · Android — Play Console pipeline

### 4.1 Generate a signed App Bundle

```bash
cd android
# Create a keystore ONCE and keep it safe + backed up
keytool -genkeypair -v \
  -keystore ~/.keystores/skaap-release.jks \
  -alias skaap \
  -keyalg RSA -keysize 2048 -validity 10000
```

Add to `~/.gradle/gradle.properties` (NOT committed):

```properties
SKAAP_KEYSTORE=/Users/you/.keystores/skaap-release.jks
SKAAP_KEYSTORE_PASSWORD=...
SKAAP_KEY_ALIAS=skaap
SKAAP_KEY_PASSWORD=...
```

Add a `signingConfigs` + `release` config to `android/app/build.gradle`
(Gradle plugin docs: https://developer.android.com/studio/publish/app-signing).
Then:

```bash
cd android
./gradlew bundleRelease
# Output:
#   android/app/build/outputs/bundle/release/app-release.aab
```

### 4.2 Play Console listing

https://play.google.com/console → **Create app**:

| Field | Value |
|---|---|
| App name | SKAAP |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | Both checked (Play policies + US export laws) |

Then **Set up your app** checklist:

1. **App access** — provide a test login if features are gated
2. **Ads** — No ads
3. **Content rating** — fill the IARC questionnaire (likely PEGI 3 / ESRB E)
4. **Target audience** — 13+
5. **Data safety** — declare: anonymous identifiers, crash data, scan
   history (stored on device + optionally backed up to user account). No
   data sold. No data shared with third parties.
6. **News app** — No
7. **COVID-19 contact tracing** — No
8. **Government app** — No

**Main store listing** — paste this metadata:

- **Short description (80 chars)**: "Scan any food. Get an instant health
  score, additive breakdown & swaps."
- **Full description**: see `/mnt/documents/store-assets/android/listing.md`
  (template below).
- **App icon**: `store-assets/android/ic_launcher-512.png`
- **Feature graphic**: `store-assets/android/feature-graphic-1024x500.png`
- **Phone screenshots**: at least 2 (8 max), 1080x1920 portrait — capture
  with `npx cap run android` running and use the emulator's screenshot tool

### 4.3 Upload + roll out

**Production ▸ Create new release** → upload the `.aab` from step 4.1 →
**Save ▸ Review release ▸ Start rollout to Production**. First review
usually takes 1–3 days.

Use **Internal testing** track first for faster reviews while iterating.

---

## 5 · Marketing screenshots (do this before submission)

Both stores require real device screenshots. Easiest path:

```bash
# iOS — capture from the iPhone 15 Pro simulator (6.5" required)
npx cap run ios
# Then: Simulator ▸ File ▸ Save Screen → 1290x2796 PNGs

# Android — capture from a Pixel 7 emulator (1080x2400)
npx cap run android
# Then: emulator ▸ side panel ▸ camera icon → saves to ~/Desktop
```

Capture at minimum:

1. Home / Scan landing
2. Live scanner (with overlay)
3. Result screen showing the health score
4. Healthier alternatives screen
5. Community / Insights tab

Drop the PNGs in `store-assets/screenshots/` and upload them in App Store
Connect → **Media** and Play Console → **Main store listing ▸ Phone**.

---

## 6 · Offline behavior (already shipped in this build)

The web build registers a Workbox service worker that caches:

- App shell (HTML/JS/CSS, hashed assets) — `CacheFirst`
- Open Food Facts / Beauty Facts / USDA product JSON — `StaleWhileRevalidate`
- Product images — `CacheFirst`, 60-day max age
- Supabase REST (`scan_history`, `stores`, `nearby_stores`, `deals`,
  `community_scans`) — `NetworkFirst` with a 4s timeout, 7-day fallback
- Google Fonts — `CacheFirst`

In addition, scan history, last-product, and nearby-city state are persisted
to `localStorage` via `src/lib/offlineCache.ts`, so the History tab and the
last result render instantly even on a cold launch with no signal. An
`OfflineBanner` appears under the status bar when `navigator.onLine` is
false.

When packaged inside the Capacitor WebView, all of the above keeps working
— `cap sync` ships the same SW and the manifest into the native bundle.

---

## 7 · Release checklist (copy into your launch ticket)

- [ ] `capacitor.config.ts` `server` block removed
- [ ] `package.json` `version` bumped (also iOS `MARKETING_VERSION` and
      Android `versionCode` / `versionName` in `android/app/build.gradle`)
- [ ] `bun run build && npx cap sync`
- [ ] iOS archive uploaded to App Store Connect, build visible in TestFlight
- [ ] Android `.aab` uploaded to Play Console internal track
- [ ] Privacy policy live at `https://useskaap.com/privacy`
- [ ] Camera + Location usage strings reviewed for accuracy
- [ ] 5+ device screenshots uploaded per store
- [ ] App Review notes include a demo account
- [ ] Internal smoke test on a physical iPhone + Android phone
