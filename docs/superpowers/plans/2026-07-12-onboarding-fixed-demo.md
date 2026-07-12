# Onboarding Fixed-Demo-Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove live AI generation from onboarding and replace it with a fixed, fully local demo (simulated generation: photos → figure → vision image), keeping the notification setup step with fixed content and ending in the existing Superwall placement.

**Architecture:** One new step component (`DemoGenerationStep`) with a three-phase local animation replaces five removed steps (`VisionStep`, `PhotoBridgeStep`, `PhotoUploadStep`, `VisionGenerationStep`, `VisionReactionStep`). The step flow in `app/app/onboarding.tsx` shrinks from 16 to 12 steps. No network calls remain in onboarding. The five removed step files get deleted (verified: only referenced by `onboarding.tsx`; in-app equivalents exist at `app/edit-self-reference.tsx` and `app/vision/add.tsx`). `visionDescription` is removed from the onboarding control context.

**Tech Stack:** React Native / Expo, `Animated` from react-native (codebase standard — no reanimated in onboarding), react-i18next with flat string keys in `app/i18n/locales/de.ts` + `en.ts`, SVG icons via react-native-svg-transformer.

**Spec:** `docs/superpowers/specs/2026-07-12-onboarding-fixed-demo-design.md`

## Global Constraints

- All user-facing copy in German AND English (flat keys in `app/i18n/locales/de.ts` and `en.ts`, pattern: `'onboarding.demo.xyz': '...'`).
- Demo must be framed as an EXAMPLE (badge "Beispiel"), never as the user's own generation.
- No network calls in the demo step. Deterministic animation.
- No project test infrastructure exists (jest configured, zero project tests). Verification cycle per task: `npx tsc --noEmit` + `npm run lint` (both run from `app/`), plus manual verification in Task 6. Do NOT set up jest/RTL — out of scope.
- **Git:** Per user preference, do NOT commit unless the user explicitly asks. Commit steps below are checkpoints to OFFER to the user, not to execute unprompted.
- All paths below are relative to the repo root `/Users/leonardogranetto/Projects/veezy/`.

---

### Task 1: Demo assets + i18n keys

**Files:**
- Create: `app/assets/onboarding-demo/demo-figure.jpg` (placeholder copy)
- Create: `app/assets/onboarding-demo/demo-vision.jpg` (placeholder copy)
- Modify: `app/i18n/locales/de.ts` (append to onboarding block, after the `'onboarding.notifications.*'` keys)
- Modify: `app/i18n/locales/en.ts` (same keys, English)

**Interfaces:**
- Produces: asset paths `@/assets/onboarding-demo/demo-figure.jpg`, `@/assets/onboarding-demo/demo-vision.jpg` (required by Task 2 via `require()`), i18n keys `onboarding.demo.*` (exact list below, consumed by Task 2 via `t()`).

- [ ] **Step 1: Create placeholder assets**

Both placeholders are copies of the existing dummy vision image; final assets get swapped in later without code changes.

```bash
mkdir -p app/assets/onboarding-demo
cp app/assets/images/dummy-vision-image.jpg app/assets/onboarding-demo/demo-figure.jpg
cp app/assets/images/dummy-vision-image.jpg app/assets/onboarding-demo/demo-vision.jpg
```

Expected: `ls app/assets/onboarding-demo` shows `demo-figure.jpg demo-vision.jpg`.

- [ ] **Step 2: Add German i18n keys**

In `app/i18n/locales/de.ts`, directly after the line `'onboarding.notifications.fallback_fuel': ...` (line ~100), insert:

```ts
  'onboarding.demo.badge': 'So funktioniert Veezy',
  'onboarding.demo.photos_title': 'Du lädst 5 Fotos von dir hoch',
  'onboarding.demo.photos_subtext': 'Daraus entsteht deine persönliche Figur – zum Beispiel so:',
  'onboarding.demo.figure_loading': 'Die Figur entsteht…',
  'onboarding.demo.figure_title': 'Deine persönliche Figur',
  'onboarding.demo.figure_caption': 'Beispiel-Figur',
  'onboarding.demo.vision_text': '„Ich lebe in meinem Traumhaus am Meer und bin vollkommen frei."',
  'onboarding.demo.vision_loading': 'Das Visionsbild entsteht…',
  'onboarding.demo.example_badge': 'BEISPIEL',
  'onboarding.demo.phrase': 'Ich lebe meinen Traum am Meer.',
  'onboarding.demo.category': 'Lifestyle',
  'onboarding.demo.continue': 'Weiter',
```

- [ ] **Step 3: Add English i18n keys**

In `app/i18n/locales/en.ts`, at the same position (after `'onboarding.notifications.fallback_fuel'`, line ~100), insert:

```ts
  'onboarding.demo.badge': 'How Veezy works',
  'onboarding.demo.photos_title': 'You upload 5 photos of yourself',
  'onboarding.demo.photos_subtext': 'They become your personal figure – for example:',
  'onboarding.demo.figure_loading': 'Creating the figure…',
  'onboarding.demo.figure_title': 'Your personal figure',
  'onboarding.demo.figure_caption': 'Example figure',
  'onboarding.demo.vision_text': '"I live in my dream home by the sea and am completely free."',
  'onboarding.demo.vision_loading': 'Creating the vision image…',
  'onboarding.demo.example_badge': 'EXAMPLE',
  'onboarding.demo.phrase': 'I am living my dream by the sea.',
  'onboarding.demo.category': 'Lifestyle',
  'onboarding.demo.continue': 'Continue',
```

- [ ] **Step 4: Verify**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Expected: both pass (i18n files are plain objects; a syntax slip shows up here).

- [ ] **Step 5: Checkpoint**

Offer commit to user (do not commit unprompted): `feat: add onboarding demo assets and i18n keys`

---

### Task 2: DemoGenerationStep component

**Files:**
- Create: `app/components/onboarding/steps/demo-generation-step.tsx`

**Interfaces:**
- Consumes: Task 1 assets + i18n keys; `useOnboardingControl().nextStep` (existing); SVG icons from `@/assets/face-photo-icons/*.svg` (existing, same import style as `photo-upload-step.tsx`).
- Produces: `export function DemoGenerationStep()` — a self-advancing, three-phase animated step with its own continue button (used by Task 3 with `showContinueButton: false, showProgressIndicator: false`, dark theme by omitting `theme`).

- [ ] **Step 1: Write the component**

Full file content:

```tsx
import body from '@/assets/face-photo-icons/body.svg';
import face_front from '@/assets/face-photo-icons/face_front.svg';
import face_left from '@/assets/face-photo-icons/face_left.svg';
import face_right from '@/assets/face-photo-icons/face_right.svg';
import face_smile from '@/assets/face-photo-icons/face_smile.svg';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const DEMO_FIGURE = require('@/assets/onboarding-demo/demo-figure.jpg');
const DEMO_VISION = require('@/assets/onboarding-demo/demo-vision.jpg');

const PHOTO_ICONS = [face_front, face_smile, face_left, face_right, body];

// Timing (ms)
const TILE_STAGGER = 260;
const HOLD_PHOTOS = 1100;
const FIGURE_LOADING = 1800;
const HOLD_FIGURE = 1600;
const VISION_LOADING = 1800;

type Phase = 'photos' | 'figure' | 'vision';

export function DemoGenerationStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const insets = useSafeAreaInsets();

    const [phase, setPhase] = useState<Phase>('photos');
    const [figureRevealed, setFigureRevealed] = useState(false);
    const [visionRevealed, setVisionRevealed] = useState(false);

    const tileAnims = useRef(PHOTO_ICONS.map(() => new Animated.Value(0))).current;
    const figureOpacity = useRef(new Animated.Value(0)).current;
    const visionOpacity = useRef(new Animated.Value(0)).current;
    const phraseOpacity = useRef(new Animated.Value(0)).current;
    const phraseTranslate = useRef(new Animated.Value(20)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

    function later(fn: () => void, ms: number) {
        timeouts.current.push(setTimeout(fn, ms));
    }

    useEffect(() => {
        Animated.stagger(
            TILE_STAGGER,
            tileAnims.map((a) =>
                Animated.timing(a, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true })
            )
        ).start(() => later(() => setPhase('figure'), HOLD_PHOTOS));
        return () => timeouts.current.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (phase === 'figure') {
            later(() => {
                setFigureRevealed(true);
                Animated.timing(figureOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true })
                    .start(() => later(() => setPhase('vision'), HOLD_FIGURE));
            }, FIGURE_LOADING);
        } else if (phase === 'vision') {
            later(() => {
                setVisionRevealed(true);
                Animated.sequence([
                    Animated.timing(visionOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    Animated.parallel([
                        Animated.timing(phraseOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                        Animated.timing(phraseTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    ]),
                    Animated.timing(buttonOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                ]).start();
            }, VISION_LOADING);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (phase === 'vision' && visionRevealed) {
        return (
            <View style={styles.container}>
                <Animated.Image source={DEMO_VISION} style={[StyleSheet.absoluteFill, { opacity: visionOpacity }]} resizeMode="cover" />
                <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} style={[StyleSheet.absoluteFill, { bottom: undefined, height: 180 }]} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.80)']} style={[StyleSheet.absoluteFill, { top: undefined, height: 500 }]} />

                <View style={[styles.exampleBadge, { top: insets.top + 16 }]}>
                    <Text style={styles.exampleBadgeText}>{t('onboarding.demo.example_badge')}</Text>
                </View>

                <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
                    <Animated.View style={[styles.phraseCard, { opacity: phraseOpacity, transform: [{ translateY: phraseTranslate }] }]}>
                        <Text style={styles.category}>{t('onboarding.demo.category').toUpperCase()}</Text>
                        <Text style={styles.phrase}>{t('onboarding.demo.phrase')}</Text>
                    </Animated.View>
                    <Animated.View style={{ opacity: buttonOpacity }}>
                        <TouchableOpacity style={styles.continueButton} onPress={nextStep} activeOpacity={0.85}>
                            <Text style={styles.continueText}>{t('onboarding.demo.continue')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.centerContent, { paddingTop: insets.top + 24 }]}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('onboarding.demo.badge')}</Text>
                </View>

                {phase === 'photos' && (
                    <>
                        <Text style={styles.title}>{t('onboarding.demo.photos_title')}</Text>
                        <Text style={styles.subtext}>{t('onboarding.demo.photos_subtext')}</Text>
                        <View style={styles.tileRow}>
                            {PHOTO_ICONS.map((Icon, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.tile,
                                        {
                                            opacity: tileAnims[i],
                                            transform: [{ translateY: tileAnims[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                                        },
                                    ]}
                                >
                                    <Icon width={34} height={34} />
                                </Animated.View>
                            ))}
                        </View>
                    </>
                )}

                {phase === 'figure' && !figureRevealed && (
                    <View style={styles.loadingBlock}>
                        <ActivityIndicator color="white" size="large" />
                        <Text style={styles.loadingText}>{t('onboarding.demo.figure_loading')}</Text>
                    </View>
                )}

                {phase === 'figure' && figureRevealed && (
                    <>
                        <Text style={styles.title}>{t('onboarding.demo.figure_title')}</Text>
                        <Animated.Image source={DEMO_FIGURE} style={[styles.figureImage, { opacity: figureOpacity }]} resizeMode="cover" />
                        <Text style={styles.caption}>{t('onboarding.demo.figure_caption')}</Text>
                    </>
                )}

                {phase === 'vision' && !visionRevealed && (
                    <View style={styles.loadingBlock}>
                        <View style={styles.visionTextCard}>
                            <Text style={styles.visionText}>{t('onboarding.demo.vision_text')}</Text>
                        </View>
                        <ActivityIndicator color="white" size="large" />
                        <Text style={styles.loadingText}>{t('onboarding.demo.vision_loading')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 14,
    },
    badge: {
        position: 'absolute',
        top: 70,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        textAlign: 'center',
    },
    subtext: {
        color: 'rgba(255,255,255,0.55)',
        fontFamily: Fonts.sans,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },
    tileRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    tile: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingBlock: {
        alignItems: 'center',
        gap: 18,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sans,
        fontSize: 14,
    },
    figureImage: {
        width: 220,
        height: 300,
        borderRadius: 18,
    },
    caption: {
        color: 'rgba(255,255,255,0.45)',
        fontFamily: Fonts.sans,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    visionTextCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginBottom: 8,
    },
    visionText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.serifItalic,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    exampleBadge: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    exampleBadgeText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2,
    },
    previewBottom: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        gap: 16,
    },
    phraseCard: {
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 5,
    },
    category: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2.5,
    },
    phrase: {
        color: 'rgba(255,255,255,0.92)',
        fontFamily: Fonts.serifBold,
        fontSize: 22,
        lineHeight: 30,
    },
    continueButton: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueText: {
        color: '#0d0d0d',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        fontWeight: '700',
    },
});
```

- [ ] **Step 2: Verify**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Expected: both pass. The component is not yet wired into the flow — that's Task 3.

- [ ] **Step 3: Checkpoint**

Offer commit to user: `feat: add DemoGenerationStep with simulated generation animation`

---

### Task 3: Rewire the onboarding flow

**Files:**
- Modify: `app/app/onboarding.tsx` (full rewrite, content below)

**Interfaces:**
- Consumes: `DemoGenerationStep` from Task 2.
- Produces: 12-step flow. Removes the only call sites of `handleUploadAndComposite`, `VisionStep`, `PhotoBridgeStep`, `PhotoUploadStep`, `VisionGenerationStep`, `VisionReactionStep` (files deleted in Task 4).

- [ ] **Step 1: Replace `app/app/onboarding.tsx` with**

```tsx
import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { DemoGenerationStep } from '@/components/onboarding/steps/demo-generation-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
import { TrialReminderStep } from '@/components/onboarding/steps/trial-reminder-step';
import { WhatYouWillGetStep } from '@/components/onboarding/steps/what-you-will-get-step';
import { OnboardingStep } from '@/components/onboarding/types';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';
import { syncPushToken } from '@/services/push-token-sync';
import { registerPushNotifications } from '@/utils/register-push-notifications';
import * as TrackingTransparency from "expo-tracking-transparency";
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function OnboardingScreen() {
    const { t } = useTranslation();

    const handleRequestNotifications = useCallback(async () => {
        const { status } = await registerPushNotifications();
        if (status === 'granted') {
            useUserDataStore.getState().updateSettings({ notifications: true });
            syncPushToken().catch(() => { });
        }
    }, []);

    const handleRequestTracking = useCallback(async () => {

        const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
        trackerManager.track('tracking_permission', {
            status: status === 'granted' ? 'authorized' : 'declined',
        });
    }, [])

    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => {
        const HookSlide = makeEmotionSlide({
            label: t('onboarding.hook.label'),
            headline: t('onboarding.hook.headline'),
            subtext: t('onboarding.hook.subtext'),
        });

        const IdentityShiftSlide = makeEmotionSlide({
            label: t('onboarding.identity_shift.label'),
            headline: t('onboarding.identity_shift.headline'),
            subtext: t('onboarding.identity_shift.subtext'),
        });

        const MicroLogicSlide = makeEmotionSlide({
            label: t('onboarding.micro_logic.label'),
            headline: t('onboarding.micro_logic.headline'),
            subtext: t('onboarding.micro_logic.subtext'),
        });

        const CompanionSlide = makeEmotionSlide({
            label: t('onboarding.companion.label'),
            headline: t('onboarding.companion.headline'),
            subtext: t('onboarding.companion.subtext'),
        });

        return [
            { component: HookSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: TrackingStep, showProgressIndicator: false, continueButtonText: t('common.continue'), theme: 'light', preContinue: handleRequestTracking },
            { component: NameStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: MicroLogicSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: DemoGenerationStep, showProgressIndicator: false, showContinueButton: false },
            { component: CompanionSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: NotificationSetupStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false, preContinue: handleRequestNotifications },
            { component: AddWidgetStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialReminderStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: WhatYouWillGetStep, theme: 'light', continueButtonText: t('onboarding.what_you_get.cta') },
        ];
    }, [handleRequestNotifications, handleRequestTracking, t]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}
```

Notes on what changed vs. the old file:
- Removed imports: `PhotoBridgeStep`, `PhotoUploadStep`, `VisionGenerationStep`, `VisionReactionStep`, `VisionStep`, `MediaHandler`, `SelfReferenceImages`, `File` (expo-file-system), `fetch` (expo/fetch).
- Removed: `BACKEND_URL`, `SELF_REF_KEYS`, `handleUploadAndComposite` (the only self-reference upload path in onboarding).
- Added: `DemoGenerationStep` import + step entry (dark theme via omitted `theme`, own continue button via `showContinueButton: false`).
- `useMemo` deps corrected to the handlers actually used.

- [ ] **Step 2: Verify**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Expected: both pass.

- [ ] **Step 3: Checkpoint**

Offer commit to user: `feat: replace generation steps with fixed demo in onboarding flow`

---

### Task 4: Delete removed step files + context cleanup

**Files:**
- Delete: `app/components/onboarding/steps/vision-step.tsx`
- Delete: `app/components/onboarding/steps/photo-bridge-step.tsx`
- Delete: `app/components/onboarding/steps/photo-upload-step.tsx`
- Delete: `app/components/onboarding/steps/vision-generation-step.tsx`
- Delete: `app/components/onboarding/steps/vision-reaction-step.tsx`
- Modify: `app/components/onboarding/onboarding-control-context.tsx`
- Modify: `app/components/onboarding/onboarding-progress-wrapper.tsx:45` and `:115`

**Interfaces:**
- Consumes: Task 3 (no remaining imports of the five files — pre-verified: they are only imported by `onboarding.tsx`).
- Produces: `OnboardingControlContextValue` WITHOUT `visionDescription`/`setVisionDescription`. Remaining consumers of the context (`demo-generation-step`, `notification-setup-step`, `name-step`, etc.) only use `nextStep`/`setCanContinue`/`setOnDisabledPress` and are unaffected.

- [ ] **Step 1: Delete the five step files**

```bash
rm app/components/onboarding/steps/vision-step.tsx \
   app/components/onboarding/steps/photo-bridge-step.tsx \
   app/components/onboarding/steps/photo-upload-step.tsx \
   app/components/onboarding/steps/vision-generation-step.tsx \
   app/components/onboarding/steps/vision-reaction-step.tsx
```

- [ ] **Step 2: Remove visionDescription from the context type**

In `app/components/onboarding/onboarding-control-context.tsx`, delete these two lines from `OnboardingControlContextValue`:

```ts
    visionDescription: string;
    setVisionDescription: (value: string) => void;
```

- [ ] **Step 3: Remove visionDescription state from the wrapper**

In `app/components/onboarding/onboarding-progress-wrapper.tsx`:

Delete line 45:
```ts
    const [visionDescription, setVisionDescription] = useState('');
```

Change line 115 from:
```tsx
        <OnboardingControlContext.Provider value={{ currentIndex, canContinue, finishOnboarding, setCanContinue, setOnDisabledPress, nextStep, visionDescription, setVisionDescription }}>
```
to:
```tsx
        <OnboardingControlContext.Provider value={{ currentIndex, canContinue, finishOnboarding, setCanContinue, setOnDisabledPress, nextStep }}>
```

- [ ] **Step 4: Verify (this catches any missed reference)**

```bash
cd app && npx tsc --noEmit && npm run lint
grep -rn "visionDescription" components/ app/ --include="*.tsx" --include="*.ts" | grep -v node_modules || echo "no onboarding refs left"
```

Expected: tsc + lint pass. The grep may still show hits in `stores/UserDataStore.ts`, `types/user-data.ts`, `utils/generateVision.ts` (the in-app generation path — those stay), but none under `components/onboarding/`.

- [ ] **Step 5: Checkpoint**

Offer commit to user: `chore: delete unused generation onboarding steps and clean up context`

---

### Task 5: Fixed notification examples

**Files:**
- Modify: `app/components/onboarding/steps/notification-setup-step.tsx`

**Interfaces:**
- Consumes: existing i18n keys `onboarding.notifications.fallback_affirmation` / `fallback_fuel` (already present in de+en, they ARE the fixed content).
- Produces: no API change; step no longer reads `useVisionStore`.

- [ ] **Step 1: Remove the dynamic example sourcing**

In `app/components/onboarding/steps/notification-setup-step.tsx`:

1. Delete the import (line 13):
```ts
import { useVisionStore } from '@/stores/VisionStore';
```

2. Delete the `pickRandom` helper (lines 20-23):
```ts
function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}
```

3. Rename the constant (line 65) from `FALLBACK_EXAMPLES` to `EXAMPLES`:
```ts
    const EXAMPLES: Record<MotivationStyle, string> = {
        affirmation: t('onboarding.notifications.fallback_affirmation'),
        fuel: t('onboarding.notifications.fallback_fuel'),
    };
```

4. Delete the store read (line 76):
```ts
    const visions = useVisionStore((s) => s.visions);
```

5. Replace the `examples` memo (lines 105-110):
```ts
    // Stable examples — picked once on mount, don't change when style switches
    const examples = useMemo<Record<MotivationStyle, string>>(() => ({
        affirmation: pickRandom(visions.flatMap((v) => v.affirmationsAffirmation ?? [])) ?? FALLBACK_EXAMPLES.affirmation,
        fuel: pickRandom(visions.flatMap((v) => v.affirmationsFuel ?? [])) ?? FALLBACK_EXAMPLES.fuel,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);
```
with a direct alias (fixed content, no memo needed):
```ts
    const examples = EXAMPLES;
```

6. Remove `useMemo` from the react import (line 4) if it is now unused:
```ts
import { useEffect, useRef, useState } from 'react';
```

Everything else (frequency counter, hour pickers, style toggle, permission request, test notification, unlock gating) stays untouched — `examples[style]` keeps feeding the test notification body and the style-card example boxes.

- [ ] **Step 2: Verify**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Expected: both pass.

- [ ] **Step 3: Checkpoint**

Offer commit to user: `feat: use fixed notification examples in onboarding`

---

### Task 6: End-to-end manual verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Reset onboarding state and run the app**

Start the app (`cd app && npx expo run:ios` or via dev build) and reset onboarding (dev menu / clear `hasOnboarded`, or fresh install on simulator).

- [ ] **Step 2: Walk the full flow and confirm**

1. Steps appear in order: Hook → Tracking → Name → Identity-Shift → Micro-Logic → **Demo** → Companion → Notifications → Widget → Trial-Offer → Trial-Reminder → What-you-get (12 steps).
2. Demo step: 5 photo tiles stagger in → loading → figure placeholder reveals → loading with fixed vision text → full-bleed vision image with "BEISPIEL" badge, category, phrase → continue button fades in. No spinner hangs, no network activity.
3. Notification step: examples show the fixed i18n texts; test notification arrives with the fixed body; continue unlocks after test (or after permission denial).
4. After the last step: Superwall placement `onboarding_completed` opens, then redirect to home.
5. Home shows a sane empty state with `hasOnboarded=true` and zero visions, leading the user toward figure/vision creation (`app/edit-self-reference.tsx` / `app/vision/add.tsx` paths reachable). **If the empty state is broken or missing, report back to the user before changing anything — that is a separate decision.**

- [ ] **Step 3: Report results**

Report the outcome of every check above (pass/fail with details) to the user. Per the verification-before-completion skill: no success claims without having actually run the flow.
