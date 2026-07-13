# Update-Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Veezy checks app version on start/foreground and shows a branded force-update screen (blocking) or a dismissable update bottom sheet, backed by three new public backend endpoints.

**Architecture:** Port of jemp's proven update-check system adapted to Veezy's stack. Backend (Hono): `/version-check` compares the client version against a configured minimum; `/store-info/ios|android` fetches the live store version (iTunes Lookup / google-play-scraper) with a 2h in-memory cache. Frontend: a `VersionCheckProvider` mounted as outermost provider runs both checks in parallel (fail open), decides force-screen vs. sheet vs. nothing, and persists a 2-day dismissal cooldown in MMKV.

**Tech Stack:** Backend: Hono 4, Node 20+, TypeScript strict, ESM (`"type": "module"` — relative imports need `.js` extension), Pino logger, node:test via tsx. Frontend: Expo 55, expo-router, react-i18next, react-native-mmkv, expo-application, RN Animated.

**Spec:** `docs/superpowers/specs/2026-07-13-update-check-design.md`

## Global Constraints

- `MIN_SUPPORTED_VERSION` initial value: `'1.0.0'`
- Bundle ID / package name (both platforms): `studio.northbyte.veezy`
- iOS store URL: `https://apps.apple.com/app/id6761725569`; Android store URL: `https://play.google.com/store/apps/details?id=studio.northbyte.veezy`
- Store-info cache TTL: 2 hours; dialog cooldown: 2 days; foreground re-check threshold: 60 seconds
- New backend endpoints are PUBLIC — do NOT add `revenuecatAuth` middleware
- Fail open everywhere: unparseable versions → supported; failed fetches → no UI shown
- Backend imports are relative with `.js` extension (NodeNext resolution), e.g. `'../config/version-config.js'`
- Frontend imports use the `@/` alias (maps to app root)
- All user-facing copy via i18n keys under `version.*` (flat key map in `app/i18n/locales/de.ts` + `en.ts`); NO hardcoded strings in components
- Design tokens only from `app/constants/theme.ts` (`Colors`, `Fonts`, `Gold`); no new hex values in components
- Commit after every task; frontend tasks are verified with `npx tsc --noEmit` in `app/` (no jest infra exists — do not install any)

---

### Task 1: Backend `/version-check` endpoint

**Files:**
- Create: `backend/src/config/version-config.ts`
- Create: `backend/src/routes/version-check-route.ts`
- Create: `backend/src/routes/version-check-route.test.ts`
- Modify: `backend/src/index.ts` (add route registration)
- Modify: `backend/package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `GET /version-check?version=<semver>` → `200 {"updateRequired": boolean}` | `400 {"error": string}`. Exports from `version-config.ts`: `MIN_SUPPORTED_VERSION: string`, `IOS_BUNDLE_ID: string`, `ANDROID_PACKAGE_NAME: string` (the latter two are used by Task 2).

- [ ] **Step 1: Write the failing test**

Create `backend/src/routes/version-check-route.test.ts`:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';
import versionCheckRoute from './version-check-route.js';

test('supported version → updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=1.1.0');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('version equal to minimum → updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=1.0.0');
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('version below minimum → updateRequired true', async () => {
    const res = await versionCheckRoute.request('/?version=0.9.9');
    assert.deepEqual(await res.json(), { updateRequired: true });
});

test('unparseable version → fail open, updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=banana');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('missing version param → 400', async () => {
    const res = await versionCheckRoute.request('/');
    assert.equal(res.status, 400);
});
```

Note: these tests assume `MIN_SUPPORTED_VERSION === '1.0.0'`. If the constant is ever raised, adjust the test fixtures.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npx tsx --test src/routes/version-check-route.test.ts`
Expected: FAIL — Cannot find module `version-check-route.js`

- [ ] **Step 3: Write the implementation**

Create `backend/src/config/version-config.ts`:

```typescript
/**
 * Minimum App-Version die dieses Backend noch unterstützt.
 * Erhöhen bei Breaking API Changes → alle älteren Apps werden gesperrt.
 */
export const MIN_SUPPORTED_VERSION = '1.0.0';

export const IOS_BUNDLE_ID = 'studio.northbyte.veezy';
export const ANDROID_PACKAGE_NAME = 'studio.northbyte.veezy';
```

Create `backend/src/routes/version-check-route.ts`:

```typescript
import { Hono } from 'hono';
import { MIN_SUPPORTED_VERSION } from '../config/version-config.js';

function parseSemver(v: string): [number, number, number] | null {
    const parts = v.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
    return [parts[0], parts[1], parts[2]];
}

function isVersionSupported(version: string): boolean {
    const app = parseSemver(version);
    const min = parseSemver(MIN_SUPPORTED_VERSION);
    // Bei Parse-Fehler: fail open — App nicht sperren
    if (!app || !min) return true;
    if (app[0] !== min[0]) return app[0] > min[0];
    if (app[1] !== min[1]) return app[1] > min[1];
    return app[2] >= min[2];
}

const versionCheckRoute = new Hono();

versionCheckRoute.get('/', (c) => {
    const version = c.req.query('version');
    if (!version) return c.json({ error: 'version query param required' }, 400);
    return c.json({ updateRequired: !isVersionSupported(version) });
});

export default versionCheckRoute;
```

- [ ] **Step 4: Register the route and add the test script**

In `backend/src/index.ts`, add the import next to the other route imports:

```typescript
import versionCheckRoute from './routes/version-check-route.js';
```

and the registration next to the other `app.route(...)` calls:

```typescript
app.route('/version-check', versionCheckRoute);
```

In `backend/package.json` `scripts`, add:

```json
"test": "tsx --test src/routes/version-check-route.test.ts"
```

(Task 2 extends this script with its own test file.)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npx tsx --test src/routes/version-check-route.test.ts`
Expected: PASS — 5 tests pass

- [ ] **Step 6: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add backend/src/config/version-config.ts backend/src/routes/version-check-route.ts backend/src/routes/version-check-route.test.ts backend/src/index.ts backend/package.json
git commit -m "feat(backend): add /version-check endpoint"
```

---

### Task 2: Backend `/store-info/ios` + `/store-info/android` endpoints

**Files:**
- Create: `backend/src/utils/ttl-cache.ts`
- Create: `backend/src/utils/ttl-cache.test.ts`
- Create: `backend/src/routes/store-info-helpers.ts`
- Create: `backend/src/routes/store-info-route.ts`
- Create: `backend/src/types/google-play-scraper.d.ts`
- Modify: `backend/src/index.ts` (add route registration)
- Modify: `backend/package.json` (dependency via npm install)

**Interfaces:**
- Consumes: `IOS_BUNDLE_ID`, `ANDROID_PACKAGE_NAME` from `../config/version-config.js` (Task 1); `logger` from `../utils/logger.js` (exists)
- Produces: `GET /store-info/ios` and `GET /store-info/android` → `200 {"version": string, "releaseNotes": string}` | `502 {"error": string}`. Exports from `ttl-cache.ts`: `getCached<T>(key: string): T | null`, `getStale<T>(key: string): T | null`, `setCached<T>(key: string, data: T, ttlMs: number): void`.

- [ ] **Step 1: Install dependency**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npm install google-play-scraper`
Expected: added to `dependencies` in `package.json`

- [ ] **Step 2: Write the failing cache test**

Create `backend/src/utils/ttl-cache.test.ts`:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCached, getStale, setCached } from './ttl-cache.js';

test('returns cached value within TTL', () => {
    setCached('a', { v: 1 }, 10_000);
    assert.deepEqual(getCached('a'), { v: 1 });
});

test('returns null after TTL expiry', () => {
    setCached('b', { v: 2 }, -1);
    assert.equal(getCached('b'), null);
});

test('getStale returns expired entries', () => {
    setCached('c', { v: 3 }, -1);
    assert.deepEqual(getStale('c'), { v: 3 });
});

test('getStale returns null for unknown keys', () => {
    assert.equal(getStale('unknown'), null);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npx tsx --test src/utils/ttl-cache.test.ts`
Expected: FAIL — Cannot find module `ttl-cache.js`

- [ ] **Step 4: Implement the cache**

Create `backend/src/utils/ttl-cache.ts`:

```typescript
type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return entry.data as T;
}

// Liefert auch abgelaufene Einträge — Fallback wenn der Upstream-Fetch fehlschlägt
export function getStale<T>(key: string): T | null {
    const entry = cache.get(key);
    return entry ? (entry.data as T) : null;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npx tsx --test src/utils/ttl-cache.test.ts`
Expected: PASS — 4 tests pass

- [ ] **Step 6: Implement helpers and route**

Create `backend/src/types/google-play-scraper.d.ts` (the package ships no types):

```typescript
declare module 'google-play-scraper' {
    type GplayAppResult = { version: string; recentChanges?: string };
    const gplay: { app(opts: { appId: string }): Promise<GplayAppResult> };
    export default gplay;
}
```

Create `backend/src/routes/store-info-helpers.ts`:

```typescript
import gplay from 'google-play-scraper';

export type StoreInfo = { version: string; releaseNotes: string };

type AppStoreLookupResponse = {
    results?: { version: string; releaseNotes?: string }[];
};

export async function fetchIosVersionInfo(bundleId: string): Promise<StoreInfo> {
    const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${bundleId}`);
    if (!res.ok) throw new Error(`iTunes lookup failed: ${res.status}`);
    const json = (await res.json()) as AppStoreLookupResponse;
    const result = json.results?.[0];
    if (!result) throw new Error('App not found in App Store');
    return { version: result.version, releaseNotes: result.releaseNotes ?? '' };
}

export async function fetchAndroidVersionInfo(appId: string): Promise<StoreInfo> {
    const appInfo = await gplay.app({ appId });
    return { version: appInfo.version, releaseNotes: appInfo.recentChanges ?? '' };
}
```

Create `backend/src/routes/store-info-route.ts`:

```typescript
import { Hono } from 'hono';
import { ANDROID_PACKAGE_NAME, IOS_BUNDLE_ID } from '../config/version-config.js';
import { logger } from '../utils/logger.js';
import { getCached, getStale, setCached } from '../utils/ttl-cache.js';
import { fetchAndroidVersionInfo, fetchIosVersionInfo, type StoreInfo } from './store-info-helpers.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const storeInfoRoute = new Hono();

async function handleStoreInfo(
    cacheKey: string,
    fetchInfo: () => Promise<StoreInfo>,
): Promise<{ body: StoreInfo | { error: string }; status: 200 | 502 }> {
    const cached = getCached<StoreInfo>(cacheKey);
    if (cached) return { body: cached, status: 200 };

    try {
        const info = await fetchInfo();
        setCached(cacheKey, info, TWO_HOURS_MS);
        return { body: info, status: 200 };
    } catch (error) {
        logger.error({ error, cacheKey }, 'store info fetch failed');
        // Abgelaufener Cache ist besser als gar keine Antwort
        const stale = getStale<StoreInfo>(cacheKey);
        if (stale) return { body: stale, status: 200 };
        return { body: { error: 'store info unavailable' }, status: 502 };
    }
}

storeInfoRoute.get('/ios', async (c) => {
    const { body, status } = await handleStoreInfo('store-info-ios', () => fetchIosVersionInfo(IOS_BUNDLE_ID));
    return c.json(body, status);
});

storeInfoRoute.get('/android', async (c) => {
    const { body, status } = await handleStoreInfo('store-info-android', () => fetchAndroidVersionInfo(ANDROID_PACKAGE_NAME));
    return c.json(body, status);
});

export default storeInfoRoute;
```

- [ ] **Step 7: Register the route and extend the test script**

In `backend/src/index.ts`, add the import:

```typescript
import storeInfoRoute from './routes/store-info-route.js';
```

and the registration:

```typescript
app.route('/store-info', storeInfoRoute);
```

In `backend/package.json`, extend the `test` script:

```json
"test": "tsx --test src/routes/version-check-route.test.ts src/utils/ttl-cache.test.ts"
```

- [ ] **Step 8: Verify with curl against the live stores**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npm run dev` (leave running), then in a second shell:

```bash
curl -s http://localhost:8080/store-info/ios
curl -s http://localhost:8080/store-info/android
curl -s "http://localhost:8080/version-check?version=0.0.1"
```

Expected:
- ios: `{"version":"1.1.0", "releaseNotes":"..."}` (real App Store data for id 6761725569)
- android: same shape — OR `{"error":"store info unavailable"}` with 502 if the Play listing is not live yet; that is acceptable, the client fails open
- version-check: `{"updateRequired":true}`

Also run the full suite: `npm test` → all tests pass. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add backend/src/utils/ttl-cache.ts backend/src/utils/ttl-cache.test.ts backend/src/routes/store-info-helpers.ts backend/src/routes/store-info-route.ts backend/src/types/google-play-scraper.d.ts backend/src/index.ts backend/package.json backend/package-lock.json
git commit -m "feat(backend): add /store-info endpoints with 2h cache"
```

---

### Task 3: Frontend service, store URLs, storage key, i18n strings

**Files:**
- Create: `app/services/version-check.ts`
- Create: `app/constants/store-urls.ts`
- Modify: `app/lib/storage.ts` (add StorageKeys entry)
- Modify: `app/i18n/locales/de.ts` and `app/i18n/locales/en.ts` (add `version.*` keys)

**Interfaces:**
- Consumes: `EXPO_PUBLIC_BACKEND_URL` env var (existing pattern, see `app/utils/generateVision.ts`)
- Produces (used by Tasks 4+5):
  - `compareVersions(local: string, store: string): 'major' | 'minor' | 'patch' | 'equal'`
  - `fetchStoreVersion(): Promise<{ version: string; releaseNotes: string }>`
  - `fetchVersionCheck(localVersion: string): Promise<{ updateRequired: boolean }>`
  - `COOLDOWN_MS: number` (2 days)
  - `STORE_URL: string` from `@/constants/store-urls`
  - `StorageKeys.VERSION_DIALOG_DISMISSED_AT` = `'version.dialogDismissedAt'`
  - i18n keys: `version.force_update_title`, `version.force_update_body`, `version.update_available_title`, `version.whats_new`, `version.update_now`, `version.update_later`

- [ ] **Step 1: Create the service**

Create `app/services/version-check.ts`:

```typescript
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 Tage

function parseSemver(v: string): [number, number, number] | null {
    const parts = v.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
    return [parts[0], parts[1], parts[2]];
}

// Konservativ: lokale Version neuer als Store (Dev-Build) oder Parse-Fehler → 'equal'
export function compareVersions(
    local: string,
    store: string,
): 'major' | 'minor' | 'patch' | 'equal' {
    const l = parseSemver(local);
    const s = parseSemver(store);
    if (!l || !s) return 'equal';
    if (s[0] > l[0]) return 'major';
    if (s[0] < l[0]) return 'equal';
    if (s[1] > l[1]) return 'minor';
    if (s[1] < l[1]) return 'equal';
    if (s[2] > l[2]) return 'patch';
    return 'equal';
}

export async function fetchStoreVersion(): Promise<{ version: string; releaseNotes: string }> {
    const endpoint = Platform.OS === 'ios' ? '/store-info/ios' : '/store-info/android';
    const res = await fetch(`${BACKEND_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Store info fetch failed: ${res.status}`);
    return res.json() as Promise<{ version: string; releaseNotes: string }>;
}

export async function fetchVersionCheck(
    localVersion: string,
): Promise<{ updateRequired: boolean }> {
    const res = await fetch(`${BACKEND_URL}/version-check?version=${localVersion}`);
    if (!res.ok) throw new Error(`Version check failed: ${res.status}`);
    return res.json() as Promise<{ updateRequired: boolean }>;
}
```

- [ ] **Step 2: Create the store URLs constant**

Create `app/constants/store-urls.ts`:

```typescript
import { Platform } from 'react-native';

const IOS_STORE_URL = 'https://apps.apple.com/app/id6761725569';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=studio.northbyte.veezy';

export const STORE_URL = Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
```

- [ ] **Step 3: Add the storage key**

In `app/lib/storage.ts`, extend `StorageKeys`:

```typescript
export const StorageKeys = {
    USER_DATA:   'user.data',
    VISIONS:     'visions',
    WIDGET_DATA: 'widget.data',
    VERSION_DIALOG_DISMISSED_AT: 'version.dialogDismissedAt',
} as const;
```

- [ ] **Step 4: Add i18n strings**

In `app/i18n/locales/de.ts`, add before the closing `};`:

```typescript
  // Version / Updates
  'version.force_update_title': 'Update erforderlich',
  'version.force_update_body': 'Diese Version von Veezy wird nicht mehr unterstützt. Bitte aktualisiere die App, um fortzufahren.',
  'version.update_available_title': 'Update verfügbar',
  'version.whats_new': 'Was ist neu',
  'version.update_now': 'Jetzt aktualisieren',
  'version.update_later': 'Später',
```

In `app/i18n/locales/en.ts`, add before the closing `};`:

```typescript
  // Version / updates
  'version.force_update_title': 'Update required',
  'version.force_update_body': 'This version of Veezy is no longer supported. Please update to continue.',
  'version.update_available_title': 'Update available',
  'version.whats_new': "What's new",
  'version.update_now': 'Update now',
  'version.update_later': 'Later',
```

- [ ] **Step 5: Verify with TypeScript**

Run: `cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit`
Expected: no errors (or only pre-existing errors — run `git stash && npx tsc --noEmit` to compare if unsure, then `git stash pop`)

- [ ] **Step 6: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add app/services/version-check.ts app/constants/store-urls.ts app/lib/storage.ts app/i18n/locales/de.ts app/i18n/locales/en.ts
git commit -m "feat(app): add version-check service, store URLs and i18n strings"
```

---

### Task 4: UI components — ForceUpdateScreen and UpdateSheet

**Files:**
- Create: `app/components/version/ForceUpdateScreen.tsx`
- Create: `app/components/version/UpdateSheet.tsx`

**Interfaces:**
- Consumes: `STORE_URL` from `@/constants/store-urls` (Task 3), i18n keys (Task 3), `Colors`/`Fonts` from `@/constants/theme`, `@/assets/logo.svg` (svg transformer is configured — see `app/app/start.tsx:8`)
- Produces:
  - `ForceUpdateScreen({ releaseNotes }: { releaseNotes: string | null })`
  - `UpdateSheet({ storeVersion, releaseNotes, onDismiss }: { storeVersion: string; releaseNotes: string | null; onDismiss: () => void })` — `onDismiss` fires after the close animation for BOTH paths (update tap and "Later"/backdrop)

- [ ] **Step 1: Create ForceUpdateScreen**

Create `app/components/version/ForceUpdateScreen.tsx` — full-screen blocker, no dismiss affordance. Visual language: cream background, Playfair headline, Inter body, gold CTA (pattern from `EditFieldModal.tsx:203` / `start.tsx`):

```tsx
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/assets/logo.svg';
import { STORE_URL } from '@/constants/store-urls';
import { Colors, Fonts } from '@/constants/theme';

type Props = { releaseNotes: string | null };

export function ForceUpdateScreen({ releaseNotes }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.content}>
                <View style={styles.logoWrapper}>
                    <Logo width={64} height={64} />
                </View>

                <Text style={styles.title}>{t('version.force_update_title')}</Text>
                <Text style={styles.body}>{t('version.force_update_body')}</Text>

                {releaseNotes ? (
                    <View style={styles.notesCard}>
                        <Text style={styles.notesLabel}>{t('version.whats_new')}</Text>
                        <Text style={styles.notesText}>{releaseNotes}</Text>
                    </View>
                ) : null}
            </View>

            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(STORE_URL)} activeOpacity={0.85}>
                <Text style={styles.buttonText}>{t('version.update_now')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    logoWrapper: {
        marginBottom: 16,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 28,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    body: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textMuted,
        textAlign: 'center',
        maxWidth: 300,
    },
    notesCard: {
        backgroundColor: Colors.surface,
        borderColor: Colors.borderCard,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        width: '100%',
        marginTop: 8,
        gap: 6,
    },
    notesLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        color: Colors.text,
    },
    notesText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textMuted,
    },
    button: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: '#ffffff',
    },
});
```

- [ ] **Step 2: Create UpdateSheet**

Create `app/components/version/UpdateSheet.tsx` — bottom sheet following the `PremiumWelcomeModal.tsx` pattern (animated backdrop + spring slide-up, handle bar, radius 28). Rendered conditionally by the provider, so it animates in on mount:

```tsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORE_URL } from '@/constants/store-urls';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
    storeVersion: string;
    releaseNotes: string | null;
    onDismiss: () => void;
};

export function UpdateSheet({ storeVersion, releaseNotes, onDismiss }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
        ]).start();
    }, []);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
        ]).start(() => onDismiss());
    }

    function handleUpdate() {
        Linking.openURL(STORE_URL);
        handleClose();
    }

    return (
        <Modal visible animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>{t('version.update_available_title')}</Text>
                            <Text style={styles.version}>Version {storeVersion}</Text>

                            {releaseNotes ? (
                                <View style={styles.notesCard}>
                                    <Text style={styles.notesLabel}>{t('version.whats_new')}</Text>
                                    <Text style={styles.notesText}>{releaseNotes}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.85}>
                                <Text style={styles.buttonText}>{t('version.update_now')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.laterButton} onPress={handleClose} activeOpacity={0.7}>
                                <Text style={styles.laterText}>{t('version.update_later')}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Pressable>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropPressable: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
        gap: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 8,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        color: Colors.textHeadline,
    },
    version: {
        fontFamily: Fonts.sansMedium,
        fontSize: 13,
        color: Colors.textMuted,
    },
    notesCard: {
        backgroundColor: Colors.cardElevated,
        borderColor: Colors.borderCard,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        gap: 6,
    },
    notesLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        color: Colors.text,
    },
    notesText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textMuted,
    },
    button: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: '#ffffff',
    },
    laterButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    laterText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        color: Colors.textMuted,
    },
});
```

- [ ] **Step 3: Verify with TypeScript**

Run: `cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add app/components/version/
git commit -m "feat(app): add ForceUpdateScreen and UpdateSheet components"
```

---

### Task 5: VersionCheckProvider and mounting

**Files:**
- Create: `app/providers/VersionCheckProvider.tsx`
- Modify: `app/app/_layout.tsx` (wrap the tree)

**Interfaces:**
- Consumes: everything from Tasks 3+4; `Application.nativeApplicationVersion` (expo-application, installed); `storage`, `StorageKeys` from `@/lib/storage`
- Produces: `VersionCheckProvider({ children })` — renders `ForceUpdateScreen` INSTEAD of children on force update, otherwise children plus (optionally) the `UpdateSheet`

- [ ] **Step 1: Create the provider**

Create `app/providers/VersionCheckProvider.tsx`:

```tsx
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { ForceUpdateScreen } from '@/components/version/ForceUpdateScreen';
import { UpdateSheet } from '@/components/version/UpdateSheet';
import { storage, StorageKeys } from '@/lib/storage';
import { COOLDOWN_MS, compareVersions, fetchStoreVersion, fetchVersionCheck } from '@/services/version-check';

type UpdateStatus = 'ok' | 'update_available' | 'force_update';

type State = {
    status: UpdateStatus;
    storeVersion: string | null;
    releaseNotes: string | null;
};

const BACKGROUND_THRESHOLD_MS = 60 * 1000;

function isCooldownActive(): boolean {
    const raw = storage.getString(StorageKeys.VERSION_DIALOG_DISMISSED_AT);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < COOLDOWN_MS;
}

function setCooldown(): void {
    storage.set(StorageKeys.VERSION_DIALOG_DISMISSED_AT, String(Date.now()));
}

export function VersionCheckProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>({ status: 'ok', storeVersion: null, releaseNotes: null });
    const backgroundedAt = useRef<number | null>(null);

    async function runChecks() {
        const localVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null;
        if (!localVersion) return;

        const [storeResult, checkResult] = await Promise.allSettled([
            fetchStoreVersion(),
            fetchVersionCheck(localVersion),
        ]);

        // DEBUG: Force-Update erzwingen zum Testen
        // const checkResult = { status: 'fulfilled' as const, value: { updateRequired: true } };

        // Backend-Kompatibilitäts-Check hat höchste Priorität
        if (checkResult.status === 'fulfilled' && checkResult.value.updateRequired) {
            setState({ status: 'force_update', storeVersion: null, releaseNotes: null });
            return;
        }

        if (storeResult.status === 'fulfilled') {
            const { version: storeVersion, releaseNotes } = storeResult.value;
            const diff = compareVersions(localVersion, storeVersion);
            if (diff === 'major') {
                setState({ status: 'force_update', storeVersion, releaseNotes });
                return;
            }
            if (diff === 'minor') {
                setState({
                    status: isCooldownActive() ? 'ok' : 'update_available',
                    storeVersion,
                    releaseNotes,
                });
                return;
            }
        }

        // patch, equal oder fehlgeschlagene Checks → ok (fail open)
        setState({ status: 'ok', storeVersion: null, releaseNotes: null });
    }

    useEffect(() => {
        runChecks();

        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'background' || nextState === 'inactive') {
                backgroundedAt.current = Date.now();
            } else if (nextState === 'active' && backgroundedAt.current !== null) {
                const elapsed = Date.now() - backgroundedAt.current;
                backgroundedAt.current = null;
                if (elapsed >= BACKGROUND_THRESHOLD_MS) {
                    runChecks();
                }
            }
        });

        return () => sub.remove();
    }, []);

    function handleDismiss() {
        setCooldown();
        setState((prev) => ({ ...prev, status: 'ok' }));
    }

    if (state.status === 'force_update') {
        return <ForceUpdateScreen releaseNotes={state.releaseNotes} />;
    }

    return (
        <>
            {children}
            {state.status === 'update_available' && state.storeVersion ? (
                <UpdateSheet
                    storeVersion={state.storeVersion}
                    releaseNotes={state.releaseNotes}
                    onDismiss={handleDismiss}
                />
            ) : null}
        </>
    );
}
```

- [ ] **Step 2: Mount in the root layout**

In `app/app/_layout.tsx`:

Add the import next to the other `@/` imports:

```tsx
import { VersionCheckProvider } from '@/providers/VersionCheckProvider';
```

Wrap the entire returned JSX of `RootLayout` (currently starting with `<PostHogProvider client={posthog}>`) so `VersionCheckProvider` is the outermost element:

```tsx
return (
    <VersionCheckProvider>
        <PostHogProvider client={posthog}>
            {/* ... existing tree unchanged ... */}
        </PostHogProvider>
    </VersionCheckProvider>
);
```

(SafeArea insets and i18n are available: expo-router mounts `SafeAreaProvider` above the root layout, and `initI18n` runs at module scope of `_layout.tsx`.)

- [ ] **Step 3: Verify with TypeScript**

Run: `cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add app/providers/VersionCheckProvider.tsx app/app/_layout.tsx
git commit -m "feat(app): mount VersionCheckProvider with update flow"
```

---

### Task 6: End-to-end verification

**Files:**
- Temporary edits only (reverted before finishing): `backend/src/config/version-config.ts`, `app/providers/VersionCheckProvider.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1-5
- Produces: verified feature; no code changes remain

- [ ] **Step 1: Backend suite + endpoints**

Run: `cd /Users/leonardogranetto/Projects/veezy/backend && npm test`
Expected: all tests pass

Run `npm run dev`, then:

```bash
curl -s "http://localhost:8080/version-check?version=1.1.0"   # → {"updateRequired":false}
curl -s "http://localhost:8080/version-check?version=0.9.0"   # → {"updateRequired":true}
curl -s http://localhost:8080/store-info/ios                   # → {"version":"...","releaseNotes":"..."}
curl -s http://localhost:8080/store-info/ios                   # second call → same, served from cache (instant)
```

- [ ] **Step 2: Simulator — silent path**

With `EXPO_PUBLIC_BACKEND_URL` pointing at the local backend (`app/.env`), start the app (`cd app && npx expo start`, iOS simulator). Local version (1.1.0) matches the store version → no dialog, app behaves normally. Check the Metro console for absence of unhandled promise warnings.

- [ ] **Step 3: Simulator — force update via backend**

Temporarily set `MIN_SUPPORTED_VERSION = '9.9.9'` in `backend/src/config/version-config.ts` (dev server hot-reloads). Background+foreground the app for 60+ seconds or restart it.
Expected: full-screen ForceUpdateScreen (logo, "Update erforderlich"/"Update required", gold button). Tapping the button opens the App Store page. No way to dismiss.
Revert to `'1.0.0'` afterwards.

- [ ] **Step 4: Simulator — optional update sheet + cooldown**

In `app/providers/VersionCheckProvider.tsx`, temporarily hardcode `const localVersion = '1.0.0';` (assuming store version 1.1.0 → minor diff). Restart the app.
Expected: bottom sheet slides up with title, "Version 1.1.0", release notes, gold "Jetzt aktualisieren" and "Später".
- Tap "Später" → sheet animates out; restart the app → NO sheet (cooldown active).
- Delete the app from the simulator (clears MMKV), reinstall, verify the sheet appears again.
Revert the hardcoded version.

- [ ] **Step 5: Confirm clean tree and finish**

Run: `git status --short` in the repo root.
Expected: empty (all temporary edits reverted, all work committed).
