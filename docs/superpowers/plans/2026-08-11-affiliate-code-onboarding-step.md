# Affiliate-Code-Onboarding-Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optionaler Affiliate-Code-Step im veezy-Onboarding, der denselben northbyte.studio-Endpoint wie jemp callt und den Code als Superwall-`promocode`-Attribut setzt.

**Architecture:** Neuer Step-Component nach dem Muster von `name-step.tsx`, Netzwerk-Logik isoliert in einem Service (`app/services/affiliate-tracking.ts`), Persistenz im bestehenden `UserDataStore` (MMKV), Superwall-Weitergabe in `finishOnboarding()` via `update({ promocode })` — exakt wie jemp (`jemp/components/onboarding/onboarding-progress-wrapper.tsx:100-102`).

**Tech Stack:** Expo / React Native, TypeScript, zustand + MMKV, react-i18next, react-native-purchases, Superwall.

**Spec:** `docs/superpowers/specs/2026-08-11-affiliate-code-onboarding-step-design.md`

## Global Constraints

- Branch: `feat/affiliate-code-onboarding` (existiert bereits, Spec ist dort committet).
- Endpoint exakt: `POST https://www.northbyte.studio/api/affiliate/track`, Header nur `Content-Type: application/json`, **kein** Auth-Header.
- Request-Body exakt: `{ appSlug: 'veezy', affiliateCode, appUserId, revenueCatUserId, environment }` — `appUserId` und `revenueCatUserId` sind **beide** `Purchases.getAppUserID()`; `environment` ist `'SANDBOX' | 'PRODUCTION'`.
- Response-Mapping: `201` → success, `404` → not found, alles andere / Exception → network error.
- i18n: flache Keys im Stil `'onboarding.referral.<key>'` in `app/i18n/locales/en.ts` **und** `de.ts` (beide Dateien, sonst bricht der `TranslationKeys`-Typ nicht, aber die DE-App zeigt Key-Strings).
- Der Step ist optional: Registrierung mit `initialCanContinue: true`; das Onboarding darf durch Fehler nie blockiert werden.
- Das Repo hat **keine Test-Infrastruktur** (`"test": "jest"` existiert, aber keine Jest-Config und keine Tests). Kein TDD; stattdessen pro Task Typecheck + Lint, am Ende manuelle Verifikation im Dev-Build (Task 7).
- Alle npm-/tsc-Kommandos laufen in `/Users/leonardogranetto/Projects/veezy/app`, git-Kommandos in `/Users/leonardogranetto/Projects/veezy`.
- Verifikation pro Task: `npx tsc --noEmit` und `npm run lint` müssen sauber durchlaufen (bzw. keine **neuen** Fehler gegenüber dem Stand vor dem Task).

---

### Task 1: Build-Environment-Helper (Port aus jemp)

**Files:**
- Create: `app/utils/build-environment.ts`
- Modify: `app/package.json` (Dependency `expo-testflight`)

**Interfaces:**
- Produces: `getBuildEnvironment(): 'SANDBOX' | 'PRODUCTION'` und `isBetaBuild(): boolean` aus `@/utils/build-environment` (synchron, keine Promises).

- [ ] **Step 1: Dependency installieren**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx expo install expo-testflight
```

Expected: `expo-testflight` erscheint in `app/package.json` unter dependencies.

- [ ] **Step 2: Helper anlegen** — `app/utils/build-environment.ts` (1:1-Port aus `jemp/utils/build-environment.ts`):

```ts
import { isTestFlight } from 'expo-testflight';
import { Platform } from 'react-native';

export function isBetaBuild(): boolean {
    if (__DEV__) return true; // Im Dev wie Beta behandeln
    if (Platform.OS !== 'ios') return false;
    return isTestFlight;
}

export function getBuildEnvironment(): 'SANDBOX' | 'PRODUCTION' {
    return isBetaBuild() ? 'SANDBOX' : 'PRODUCTION';
}
```

- [ ] **Step 3: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

Expected: keine neuen Fehler.

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/utils/build-environment.ts app/package.json app/yarn.lock && git commit -m "feat: add build environment helper (SANDBOX/PRODUCTION)"
```

(Falls kein `yarn.lock` geändert wurde, sondern `package-lock.json`: diese Datei stagen.)

---

### Task 2: Affiliate-Tracking-Service

**Files:**
- Create: `app/services/affiliate-tracking.ts`

**Interfaces:**
- Consumes: `getBuildEnvironment()` aus Task 1.
- Produces: `trackAffiliateCode(affiliateCode: string): Promise<AffiliateTrackResult>` mit `type AffiliateTrackResult = 'success' | 'not_found' | 'network_error'` aus `@/services/affiliate-tracking`. Wirft **nie** — jede Exception wird zu `'network_error'`.

- [ ] **Step 1: Service anlegen** — `app/services/affiliate-tracking.ts`:

```ts
import Purchases from 'react-native-purchases';
import { getBuildEnvironment } from '@/utils/build-environment';

export type AffiliateTrackResult = 'success' | 'not_found' | 'network_error';

const AFFILIATE_TRACK_URL = 'https://www.northbyte.studio/api/affiliate/track';

export async function trackAffiliateCode(affiliateCode: string): Promise<AffiliateTrackResult> {
    try {
        const revenueCatUserId = await Purchases.getAppUserID();
        if (!revenueCatUserId) return 'network_error';
        const response = await fetch(AFFILIATE_TRACK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appSlug: 'veezy',
                affiliateCode,
                // veezy hat keine separate App-User-ID — RevenueCat ist die Identität
                appUserId: revenueCatUserId,
                revenueCatUserId,
                environment: getBuildEnvironment(),
            }),
        });
        if (response.status === 201) return 'success';
        if (response.status === 404) return 'not_found';
        return 'network_error';
    } catch {
        return 'network_error';
    }
}
```

- [ ] **Step 2: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/services/affiliate-tracking.ts && git commit -m "feat: add affiliate code tracking service (northbyte.studio endpoint)"
```

---

### Task 3: `referralCode` in UserData-Typ und Store

**Files:**
- Modify: `app/types/user-data.ts` (im `UserData`-Typ, bei `attributionSource`)
- Modify: `app/stores/UserDataStore.ts` (Default-State + `updateSettings`-Pick-Liste)

**Interfaces:**
- Produces: `UserData.referralCode: string | null`; Default `null`; setzbar via `updateSettings({ referralCode: '...' })`; lesbar via `useUserDataStore((s) => s.referralCode)` bzw. `useUserDataStore.getState().referralCode`.

- [ ] **Step 1: Typ erweitern** — in `app/types/user-data.ts` im `UserData`-Typ direkt unter `attributionSource: string | null` ergänzen:

```ts
    referralCode: string | null
```

- [ ] **Step 2: Store erweitern** — in `app/stores/UserDataStore.ts`:

Im Default-State (bei den anderen Defaults, z. B. unter `attributionSource: null,`):

```ts
            referralCode: null,
```

In der `updateSettings`-Signatur (Zeile 20) den Pick um `'referralCode'` erweitern — aus

```ts
updateSettings: (patch: Partial<Pick<UserData, 'name' | 'birthday' | 'gender' | 'notifications' | 'notificationsPerDay' | 'notificationStartHour' | 'notificationEndHour' | 'haptics' | 'motivationStyle' | 'primaryCategory' | 'attributionSource' | 'ageGroup' | 'visionDescription' | 'language' | 'showDevButtons'>>) => void;
```

wird

```ts
updateSettings: (patch: Partial<Pick<UserData, 'name' | 'birthday' | 'gender' | 'notifications' | 'notificationsPerDay' | 'notificationStartHour' | 'notificationEndHour' | 'haptics' | 'motivationStyle' | 'primaryCategory' | 'attributionSource' | 'ageGroup' | 'visionDescription' | 'language' | 'showDevButtons' | 'referralCode'>>) => void;
```

Hinweis: Bestandsnutzer hydratisieren ohne den Key → `referralCode` ist `undefined`; das ist ok, alle Konsumenten prüfen nur falsy.

- [ ] **Step 3: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/types/user-data.ts app/stores/UserDataStore.ts && git commit -m "feat: add referralCode field to user data store"
```

---

### Task 4: i18n-Keys (EN + DE)

**Files:**
- Modify: `app/i18n/locales/en.ts`
- Modify: `app/i18n/locales/de.ts`

**Interfaces:**
- Produces: die Keys `onboarding.referral.headline`, `.subtitle`, `.placeholder`, `.submit`, `.success`, `.error_not_found`, `.error_network` in beiden Locales.

- [ ] **Step 1: EN-Keys** — in `app/i18n/locales/en.ts` bei den anderen `onboarding.*`-Keys einfügen:

```ts
  'onboarding.referral.headline': 'Got a creator code?',
  'onboarding.referral.subtitle': 'Optional — you can skip this step.',
  'onboarding.referral.placeholder': 'CODE',
  'onboarding.referral.submit': 'Redeem',
  'onboarding.referral.success': 'Code redeemed!',
  'onboarding.referral.error_not_found': 'Code not found',
  'onboarding.referral.error_network': 'Something went wrong. Please try again.',
```

- [ ] **Step 2: DE-Keys** — in `app/i18n/locales/de.ts` an derselben Stelle einfügen:

```ts
  'onboarding.referral.headline': 'Hast du einen Creator-Code?',
  'onboarding.referral.subtitle': 'Optional — du kannst diesen Schritt überspringen.',
  'onboarding.referral.placeholder': 'CODE',
  'onboarding.referral.submit': 'Einlösen',
  'onboarding.referral.success': 'Code eingelöst!',
  'onboarding.referral.error_not_found': 'Code nicht gefunden',
  'onboarding.referral.error_network': 'Etwas ist schiefgelaufen. Versuch es noch mal.',
```

- [ ] **Step 3: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/i18n/locales/en.ts app/i18n/locales/de.ts && git commit -m "feat: add referral step i18n strings (en/de)"
```

---

### Task 5: ReferralCodeStep-Komponente

**Files:**
- Create: `app/components/onboarding/steps/referral-code-step.tsx`

**Interfaces:**
- Consumes: `trackAffiliateCode` (Task 2), `referralCode`/`updateSettings` (Task 3), i18n-Keys (Task 4), `useOnboardingControl()` (`nextStep`) aus `@/components/onboarding/onboarding-control-context`, `Colors`/`Fonts` aus `@/constants/theme`.
- Produces: `export function ReferralCodeStep()` — light-theme Step im Stil von `name-step.tsx`.

Verhalten (wie jemp `referral-code-step.tsx`):
- Input auto-uppercased; Tippen im Fehlerzustand → Status zurück auf `idle`.
- Status-Maschine `idle | loading | success | error_not_found | error_network`.
- Erfolg: Code in Store, Keyboard dismiss, nach 600 ms `nextStep()`.
- Bereits eingelöst (Store-Wert vorhanden): Input gesperrt (`editable=false`, halbtransparent), Status `success`.
- Kein `setCanContinue`-Aufruf — der Step wird mit `initialCanContinue: true` registriert und ist damit immer skippable.

- [ ] **Step 1: Komponente anlegen** — `app/components/onboarding/steps/referral-code-step.tsx`:

```tsx
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { trackAffiliateCode } from '@/services/affiliate-tracking';
import { useUserDataStore } from '@/stores/UserDataStore';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error_not_found' | 'error_network';

export function ReferralCodeStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const existingCode = useUserDataStore((s) => s.referralCode);

    const alreadyRedeemed = !!existingCode;
    const [code, setCode] = useState(existingCode ?? '');
    const [status, setStatus] = useState<SubmitStatus>(alreadyRedeemed ? 'success' : 'idle');

    const focusOffset = useRef(new Animated.Value(0)).current;

    function handleFocus() {
        Animated.timing(focusOffset, {
            toValue: -130,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }

    function handleBlur() {
        Animated.timing(focusOffset, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }

    const canSubmit = code.trim().length > 0 && status === 'idle' && !alreadyRedeemed;

    function handleChange(value: string) {
        setCode(value.toUpperCase());
        if (status === 'error_not_found' || status === 'error_network') {
            setStatus('idle');
        }
    }

    async function handleSubmit() {
        if (!canSubmit) return;
        setStatus('loading');
        const result = await trackAffiliateCode(code.trim());
        if (result === 'success') {
            updateSettings({ referralCode: code.trim() });
            setStatus('success');
            Keyboard.dismiss();
            setTimeout(() => nextStep(), 600);
        } else if (result === 'not_found') {
            setStatus('error_not_found');
        } else {
            setStatus('error_network');
        }
    }

    const showFeedback = status === 'success' || status === 'error_not_found' || status === 'error_network';
    const feedbackText =
        status === 'success'
            ? t('onboarding.referral.success')
            : status === 'error_not_found'
                ? t('onboarding.referral.error_not_found')
                : t('onboarding.referral.error_network');

    return (
        <Pressable style={styles.container} onPress={Keyboard.dismiss}>
            <View style={styles.inner} pointerEvents="box-none">
                <Animated.View style={[styles.content, { transform: [{ translateY: focusOffset }] }]}>
                    <Text style={styles.headline}>{t('onboarding.referral.headline')}</Text>
                    <Text style={styles.subtitle}>{t('onboarding.referral.subtitle')}</Text>
                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, alreadyRedeemed && styles.inputLocked]}
                                value={code}
                                onChangeText={handleChange}
                                placeholder={t('onboarding.referral.placeholder')}
                                placeholderTextColor={Colors.textPlaceholder}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="done"
                                editable={!alreadyRedeemed}
                                onSubmitEditing={handleSubmit}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                selectionColor={Colors.accent}
                                textAlign="center"
                            />
                            <View style={styles.underline} />
                        </View>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
                        >
                            {status === 'loading' ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.submitText}>{t('onboarding.referral.submit')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {showFeedback && (
                        <Text style={[styles.feedback, { color: status === 'success' ? '#2E7D32' : '#C62828' }]}>
                            {feedbackText}
                        </Text>
                    )}
                </Animated.View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
        gap: 8,
    },
    headline: {
        fontFamily: Fonts.serifBold,
        fontSize: 38,
        lineHeight: 50,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 28,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        color: Colors.textHeadline,
        paddingVertical: 8,
        width: '100%',
        textAlign: 'center',
    },
    inputLocked: {
        opacity: 0.5,
    },
    underline: {
        width: '100%',
        height: 2,
        backgroundColor: Colors.textHeadline,
        borderRadius: 1,
    },
    submitButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitDisabled: {
        opacity: 0.35,
    },
    submitText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    feedback: {
        marginTop: 12,
        fontFamily: Fonts.sans,
        fontSize: 14,
        textAlign: 'center',
    },
});
```

Alle verwendeten Theme-Tokens (`Fonts.serifBold`, `Fonts.sans`, `Colors.textHeadline`, `Colors.textMuted`, `Colors.textPlaceholder`, `Colors.accent`) existieren bereits in `app/constants/theme.ts` — keine neuen Tokens anlegen.

- [ ] **Step 2: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/components/onboarding/steps/referral-code-step.tsx && git commit -m "feat: add referral code onboarding step"
```

---

### Task 6: Step registrieren + Superwall-`promocode`

**Files:**
- Modify: `app/app/onboarding.tsx` (Import + `ONBOARDING_STEPS`-Eintrag)
- Modify: `app/components/onboarding/onboarding-progress-wrapper.tsx` (`finishOnboarding()`)

**Interfaces:**
- Consumes: `ReferralCodeStep` (Task 5), `referralCode` im Store (Task 3), `update` aus `useSuperwallFunctions()` (existiert bereits: `update(attributes: Record<string, any>) => Promise<void>` in `app/services/purchases/superwall/useSuperwall.tsx`).

- [ ] **Step 1: Step registrieren** — in `app/app/onboarding.tsx`:

Import ergänzen (alphabetisch bei den anderen Step-Imports):

```ts
import { ReferralCodeStep } from '@/components/onboarding/steps/referral-code-step';
```

Im `ONBOARDING_STEPS`-Array zwischen `PersonalizationStep` und `TrialOfferStep` einfügen:

```ts
            { component: PersonalizationStep, theme: 'light', showContinueButton: false, showProgressIndicator: false },
            { component: ReferralCodeStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: true },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('onboarding.trial.cta') },
```

- [ ] **Step 2: Superwall-Attribut setzen** — in `app/components/onboarding/onboarding-progress-wrapper.tsx`:

Destrukturierung erweitern (aktuell Zeile 47):

```ts
    const { openWithPlacement, update } = useSuperwallFunctions();
```

`finishOnboarding()` (aktuell Zeilen 76–81) erweitern — vor dem Placement-Open das Attribut setzen, wie jemp:

```ts
    async function finishOnboarding() {
        trackerManager.track('onboarding_completed');
        useUserDataStore.getState().completeOnboarding();
        const referralCode = useUserDataStore.getState().referralCode;
        if (referralCode) {
            try {
                await update({ promocode: referralCode });
            } catch {
                // Attribut-Sync darf das Onboarding-Ende nie blockieren
            }
        }
        const navigate = () => router.replace('/');
        await openPlacementWithImage(openWithPlacement, 'onboarding_completed', navigate, undefined, navigate);
    }
```

- [ ] **Step 3: Typecheck + Lint**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/onboarding.tsx app/components/onboarding/onboarding-progress-wrapper.tsx && git commit -m "feat: register referral step and pass promocode to Superwall"
```

---

### Task 7: Manuelle Verifikation (Dev-Build)

**Files:** keine Änderungen — reine Verifikation. Erfordert Simulator/Gerät mit Dev-Build (`npm run ios` in `app/`) und Onboarding-Reset (MMKV `hasOnboarded` zurücksetzen bzw. App-Neuinstallation).

- [ ] **Step 1: Gültiger Code** — bekannten Affiliate-Code eingeben → „Einlösen": Erfolgs-Feedback erscheint, Step advanced nach ~600 ms automatisch. Im Netzwerk-Log (Metro/Proxy): `POST .../api/affiliate/track` mit `appSlug: 'veezy'`, beide IDs identisch (RC-ID), `environment: 'SANDBOX'` → Response `201`.
- [ ] **Step 2: Ungültiger Code** — Fantasie-Code → Meldung „Code nicht gefunden", Input bleibt editierbar, erneutes Tippen setzt den Fehler zurück.
- [ ] **Step 3: Netzwerkfehler** — Flugmodus an, Code absenden → Netzwerkfehler-Meldung; Continue-Button funktioniert weiterhin (Skip).
- [ ] **Step 4: Skip** — ohne Code auf Continue → Step wird übersprungen, kein Request.
- [ ] **Step 5: Superwall** — nach Einlösung Onboarding abschließen → im Superwall-Debug/-Dashboard prüfen, dass das User-Attribut `promocode` gesetzt ist.
- [ ] **Step 6: Persistenz** — App killen, Onboarding erneut öffnen (Dev-Reset ohne Datenlöschung): Step zeigt gesperrtes Input mit eingelöstem Code.
- [ ] **Step 7: Backend-Gegenprobe** — im northbyte.studio-Affiliate-Dashboard prüfen, dass der Track-Event mit `appSlug 'veezy'` angekommen ist.
