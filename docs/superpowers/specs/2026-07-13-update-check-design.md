# Update-Check Design

**Date:** 2026-07-13
**Status:** Approved

## Goal

Veezy checks on app start (and on returning to foreground) whether a newer app version exists or the installed version is no longer supported, and shows either a dismissable update sheet or a blocking force-update screen. The system is a port of the proven jemp implementation (`jemp/services/version-check`, `jemp/providers/version-check-provider.tsx`, `jemp/externals/jemp-api/src/routes/version-check-route.ts`, `store-info-route/`), adapted to Veezy's stack (Hono backend, MMKV, Veezy design system).

## Backend (Hono, `backend/src/`)

Three new **public** endpoints — no `revenuecatAuth`, because the check must work before/without login:

### `GET /version-check?version=<semver>`

Response: `{ "updateRequired": boolean }`

- Compares the client version against `MIN_SUPPORTED_VERSION` from a new `src/config/version-config.ts` (initial value: `"1.0.0"`).
- Semver comparison major → minor → patch. `updateRequired` is `true` when the client version is below the minimum.
- **Fail open:** if either version fails to parse, respond `{ "updateRequired": false }`.
- Missing/empty `version` query param → `400`.

### `GET /store-info/ios` and `GET /store-info/android`

Response: `{ "version": string, "releaseNotes": string }`

- **iOS:** iTunes Lookup API (`https://itunes.apple.com/lookup?bundleId=studio.northbyte.veezy`), reading `version` and `releaseNotes` from the first result. Zero results (app not yet indexed) are treated like any other upstream failure (→ `502`, see below) — the client fails open either way.
- **Android:** `google-play-scraper` (new backend dependency) for package `studio.northbyte.veezy`; `recentChanges` maps to `releaseNotes` (empty string if absent).
- **Cache:** in-memory, per-platform key, TTL 2 hours. Upstream errors with a stale cache entry present → serve stale; without cache → `502`.

### Files

- `src/routes/version-check-route.ts`
- `src/routes/store-info-route.ts` (+ `helpers/fetch-ios-version-info.ts`, `helpers/fetch-android-version-info.ts`, `cache.ts` — same layout as jemp)
- `src/config/version-config.ts` (`MIN_SUPPORTED_VERSION`)
- Registered in `src/index.ts` via `app.route('/version-check', …)` and `app.route('/store-info', …)`.
- Logging through the existing Pino logger (`src/utils/logger.ts`).

## Frontend service (`app/services/version-check.ts`)

Port of `jemp/services/version-check/index.ts`:

- `fetchStoreVersion(): Promise<{ version: string; releaseNotes: string }>` — platform-dependent `/store-info/ios|android`.
- `fetchVersionCheck(localVersion): Promise<{ updateRequired: boolean }>` — `/version-check?version=…`.
- `compareVersions(local, store): 'major' | 'minor' | 'patch' | 'equal'` — pure semver function. Conservative for dev builds: local newer than store → `'equal'`. Parse failure → `'equal'`.
- Base URL: `process.env.EXPO_PUBLIC_BACKEND_URL` (existing pattern, e.g. `app/utils/generateVision.ts`).
- Local version: `Application.nativeApplicationVersion` (expo-application, already installed) with fallback `Constants.expoConfig?.version`.

## Provider (`app/providers/VersionCheckProvider.tsx`)

Port of `jemp/providers/version-check-provider.tsx`, decision tree identical:

1. Backend `/version-check` says `updateRequired: true` → **force-update screen** (blocks the app).
2. Store comparison says `'major'` → **force-update screen**.
3. `'minor'` → **update sheet** (dismissable), unless the 2-day cooldown is active.
4. `'patch'` / `'equal'` → nothing.

- Both fetches run in parallel via `Promise.allSettled`; any network/server error on a check silently skips it (**fail open** — the app never blocks because of a failed check).
- **Triggers:** on mount (app start) and on AppState transition back to `active` after ≥ 60 s in `background`/`inactive`.
- **Cooldown:** timestamp of the last dismissal in **MMKV** (Veezy standard — deviation from jemp's AsyncStorage), key `version_check_last_dialog`, duration 2 days. Set when the user taps "Later" or dismisses the sheet.
- Mounted as the outermost provider in `app/app/_layout.tsx` so the force-update screen overrides every navigation state.

## UI (Veezy brand, tokens from `app/constants/theme.ts`)

### `app/components/version/ForceUpdateScreen.tsx` (full screen, blocking)

- Background `Colors.background` (`#fdfcfc`), content centered.
- Headline in Playfair Display Bold (`textHeadline`), body copy in Inter Regular (`textMuted`).
- Release notes (when present) in a card on `Colors.surface` with `borderCard` border.
- Single CTA: gold button (`accent` `#c9a84c`, pressed `accentPressed`, border radius 14), label "Jetzt aktualisieren" / "Update now" → `Linking.openURL(STORE_URL)`.
- No dismiss affordance — the screen is intentionally inescapable.

### `app/components/version/UpdateSheet.tsx` (optional update)

Bottom sheet following the existing Veezy modal pattern (see `PremiumWelcomeModal`): transparent `Modal`, animated backdrop (250 ms in / 200 ms out), slide-up sheet with top border radius 28, handle bar 36×4, safe-area bottom padding, backdrop press dismisses.

- Title (Playfair SemiBold), store version number, optional release notes.
- Primary button: gold, "Jetzt aktualisieren" → opens store and dismisses.
- Secondary: text button "Später" → dismisses and sets the cooldown. Backdrop dismiss counts as "Später".

### Store URLs — `app/constants/store-urls.ts`

- iOS: `https://apps.apple.com/app/id6761725569`
- Android: `https://play.google.com/store/apps/details?id=studio.northbyte.veezy`
- Exported as platform-resolved `STORE_URL`.

### i18n

Keys under `version.*` in `languages/de.json` and `languages/en.json`: `force_update_title`, `force_update_body`, `update_available_title`, `update_now`, `update_later`, `whats_new`.

## Out of scope

- jemp's maintenance screen (unused there) is not ported.
- No admin UI for `MIN_SUPPORTED_VERSION` — raising it means editing the config and redeploying the backend (rare, deliberate action).
- OTA/EAS updates remain untouched; this feature only covers store-release updates.

## Testing & verification

- **Unit:** `compareVersions` and the backend `isVersionSupported` are pure functions; unit tests if the respective test setup runs (app: `jest` script exists; backend: no test runner — verified via curl instead).
- **Backend:** start locally (`npm run dev`), curl all three endpoints; force case verified by temporarily raising `MIN_SUPPORTED_VERSION` above the current app version.
- **Frontend:** in the simulator with an artificially lowered local version (temporary override in the service) verify all three paths: force screen, update sheet incl. "Later" cooldown, and the silent path.
