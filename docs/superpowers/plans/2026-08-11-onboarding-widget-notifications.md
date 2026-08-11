# Onboarding-Rework „Demo → Widget → Notifications" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the onboarding demo with a widget phase (demo image morphs into a home-screen widget mock), add a new NotificationExplainStep (lock-screen mock), reposition the existing NotificationSetupStep behind it, and remove CompanionSlide + AddWidgetStep.

**Architecture:** All flow changes happen in the `ONBOARDING_STEPS` array in `app/app/onboarding.tsx`. The widget explanation is a fifth `Phase` inside the existing `DemoGenerationStep` (RN `Animated`, matching the file's existing pattern — NOT Reanimated). The notification explanation is a new self-contained step component rendered by `OnboardingProgressWrapper` (dark theme, wrapper-provided Continue button).

**Tech Stack:** Expo SDK 55 / React Native 0.83, expo-router, RN `Animated`, `expo-image`, `expo-linear-gradient`, i18next (flat dot-keys, en+de), zustand/MMKV (untouched).

**Spec:** `docs/superpowers/specs/2026-08-11-onboarding-widget-notifications-design.md`

## Global Constraints

- **NO git commands of any kind** (no add/commit/branch). The user explicitly forbids touching git unless they ask. Skip every "Commit" convention from the executing skill.
- No test infrastructure exists (the `test: jest` script has no config and no tests). Do NOT add jest/RNTL. Verification = `npx tsc --noEmit` + `npm run lint` (run from `/Users/leonardogranetto/Projects/veezy/app`) + manual simulator checklist in the final task.
- i18n keys are FLAT string keys (`'onboarding.demo.widget_title': '...'`), not nested objects. Every new key must exist in BOTH `app/i18n/locales/en.ts` and `app/i18n/locales/de.ts`.
- Use RN `Animated` (like the existing demo step), `useNativeDriver: true` everywhere. No Reanimated.
- No real iOS assets/logos in the mocks — generic placeholder icon squares, static clock text `9:41`.
- The asset `assets/animations/widget.json` MUST NOT be deleted — `app/components/tutorial-overlay.tsx:109` still uses it.
- Working directory for all commands: `/Users/leonardogranetto/Projects/veezy/app`.

---

### Task 1: i18n keys (add new, remove replaced)

**Files:**
- Modify: `app/i18n/locales/en.ts`
- Modify: `app/i18n/locales/de.ts`

**Interfaces:**
- Produces (used by Tasks 2-3): keys `onboarding.demo.widget_badge`, `onboarding.demo.widget_title`, `onboarding.demo.widget_subtitle`, `onboarding.notification_explain.title`, `onboarding.notification_explain.subtitle`, `onboarding.notification_explain.banner_time`
- Removes (Task 4 removes their consumers): `onboarding.companion.label/headline/subtext`, `onboarding.widget.title/subtitle`

- [ ] **Step 1: en.ts — add new keys, remove old**

In `app/i18n/locales/en.ts`, directly after the line `'onboarding.demo.continue': 'Continue',` (line ~112) insert:

```ts
  'onboarding.demo.widget_badge': 'On your home screen',
  'onboarding.demo.widget_title': 'Your vision. Right on your home screen.',
  'onboarding.demo.widget_subtitle': 'Every day, with every glance at your phone.',
  'onboarding.notification_explain.title': "We'll remind you of your vision",
  'onboarding.notification_explain.subtitle': 'Small nudges throughout your day — whenever it suits you.',
  'onboarding.notification_explain.banner_time': 'now',
```

Delete these lines from `en.ts`:

```ts
  'onboarding.companion.label': 'YOUR PATH',
  'onboarding.companion.headline': "We'll walk this path with you.",
  'onboarding.companion.subtext': "Every day we'll remind you of your goal so you never forget where you're going.",
  'onboarding.widget.title': 'Your Visions. Every Day.',
  'onboarding.widget.subtitle': 'Add veezy to your home screen to keep your goals in sight at all times.',
```

- [ ] **Step 2: de.ts — add new keys, remove old**

In `app/i18n/locales/de.ts`, directly after the line `'onboarding.demo.continue': 'Weiter',` (line ~112) insert:

```ts
  'onboarding.demo.widget_badge': 'Auf deinem Homescreen',
  'onboarding.demo.widget_title': 'Deine Vision. Direkt auf deinem Homescreen.',
  'onboarding.demo.widget_subtitle': 'Jeden Tag, bei jedem Blick aufs Handy.',
  'onboarding.notification_explain.title': 'Wir erinnern dich an deine Vision',
  'onboarding.notification_explain.subtitle': 'Kleine Impulse über den Tag verteilt – wann es dir passt.',
  'onboarding.notification_explain.banner_time': 'jetzt',
```

Delete these lines from `de.ts`:

```ts
  'onboarding.companion.label': 'DEIN WEG',
  'onboarding.companion.headline': 'Wir begleiten dich auf deinem Weg.',
  'onboarding.companion.subtext': 'Jeden Tag erinnern wir dich an dein Ziel, damit du nicht vergisst, wohin du willst.',
  'onboarding.widget.title': 'Deine Visionen. Jeden Tag vor Augen.',
  'onboarding.widget.subtitle': 'Füge veezy zu deinem Home-Screen hinzu, um deine Ziele immer im Blick zu haben.',
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expect no NEW errors (note any pre-existing baseline).
Run: `grep -rn "onboarding.companion\.\|'onboarding.widget\." app/ components/ --include="*.ts*"` (from `app/` use paths `i18n app components`) — the only remaining consumers must be `onboarding.tsx` (CompanionSlide) and `add-widget-step.tsx`, both removed in Task 4. NOTE: keys are gone before consumers — i18next falls back to the raw key string at runtime; that is fine because Task 4 lands in the same session. Do not reorder tasks to "fix" this.

---

### Task 2: Widget phase inside DemoGenerationStep

**Files:**
- Modify: `app/components/onboarding/steps/demo-generation-step.tsx`

**Interfaces:**
- Consumes: i18n keys from Task 1 (`onboarding.demo.widget_*`)
- Produces: nothing new externally — the step still calls `nextStep()` from `useOnboardingControl()` when the user leaves the (now last) widget phase. Step config in `onboarding.tsx` stays `{ component: DemoGenerationStep, showProgressIndicator: false, showContinueButton: false }`.

- [ ] **Step 1: Extend the Phase type and add animation values**

Change line 26:

```ts
type Phase = 'photos' | 'typing' | 'loading' | 'result' | 'widget';
```

Below `const VISION_LOADING = 3500;` add:

```ts
const WIDGET_MORPH = 600;
```

Next to the existing refs (after `ctaOpacity`, line ~44) add:

```ts
    const widgetScale = useRef(new Animated.Value(2.4)).current;
    const widgetTranslate = useRef(new Animated.Value(-40)).current;
    const chromeOpacity = useRef(new Animated.Value(0)).current;
    const widgetTextOpacity = useRef(new Animated.Value(0)).current;
```

- [ ] **Step 2: Drive the morph from the phase effect**

In the `useEffect` that handles `loading`/`result` (line ~90), extend the chain with a `widget` branch:

```ts
        } else if (phase === 'widget') {
            Animated.parallel([
                Animated.timing(widgetScale, { toValue: 1, duration: WIDGET_MORPH, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(widgetTranslate, { toValue: 0, duration: WIDGET_MORPH, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(chromeOpacity, { toValue: 1, duration: WIDGET_MORPH, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start(() => {
                Animated.timing(widgetTextOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => showCta());
            });
        }
```

- [ ] **Step 3: Route the result-phase Continue into the widget phase**

In the `result` render block (line ~133), change the button handler from `onPress={nextStep}` to:

```tsx
<TouchableOpacity style={styles.continueButton} onPress={() => advanceTo('widget')} activeOpacity={0.85}>
```

(`advanceTo` resets `ctaVisible`/`ctaOpacity`, which the widget phase reuses for its own CTA.)

Also reset the result-phase button state so re-entry can't leave stale values: no change needed — `buttonOpacity` is only used by `result` and phases only move forward.

- [ ] **Step 4: Render the widget phase**

Insert a new early-return block AFTER the `result` block (after line ~140) and BEFORE the default return:

```tsx
    if (phase === 'widget') {
        return (
            <View style={styles.container}>
                <Image source={DEMO_VISION} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} />
                <View style={styles.wallpaperDim} />

                <View style={[styles.widgetPhaseContent, { paddingTop: insets.top + 24 }]}>
                    <Animated.View style={[styles.widgetHeader, { opacity: widgetTextOpacity }]}>
                        <View style={styles.badgeInline}>
                            <Text style={styles.badgeText}>{t('onboarding.demo.widget_badge')}</Text>
                        </View>
                        <Text style={styles.title}>{t('onboarding.demo.widget_title')}</Text>
                        <Text style={styles.subtext}>{t('onboarding.demo.widget_subtitle')}</Text>
                    </Animated.View>

                    <View style={styles.homescreen}>
                        <Animated.Text style={[styles.clock, { opacity: chromeOpacity }]}>9:41</Animated.Text>
                        <Animated.View style={[styles.widgetCard, { transform: [{ scale: widgetScale }, { translateY: widgetTranslate }] }]}>
                            <Image source={DEMO_VISION} style={styles.widgetImage} contentFit="cover" />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.widgetGradient} />
                            <View style={styles.widgetTextBlock}>
                                <Text style={styles.widgetCategory}>{t('onboarding.demo.category').toUpperCase()}</Text>
                                <Text style={styles.widgetPhrase} numberOfLines={2}>{t('onboarding.demo.phrase')}</Text>
                            </View>
                        </Animated.View>
                        <Animated.View style={[styles.iconGrid, { opacity: chromeOpacity }]}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <View key={i} style={styles.iconPlaceholder} />
                            ))}
                        </Animated.View>
                    </View>
                </View>

                {ctaVisible && (
                    <Animated.View style={[styles.ctaFooter, { paddingBottom: insets.bottom + 32, opacity: ctaOpacity }]}>
                        <TouchableOpacity style={styles.continueButton} onPress={nextStep} activeOpacity={0.85}>
                            <Text style={styles.continueText}>{t('onboarding.demo.continue')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        );
    }
```

- [ ] **Step 5: Add the new styles**

Append to the `StyleSheet.create` block:

```ts
    wallpaperDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    widgetPhaseContent: {
        flex: 1,
        paddingHorizontal: 28,
    },
    widgetHeader: {
        alignItems: 'center',
        gap: 10,
    },
    badgeInline: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    homescreen: {
        flex: 1,
        justifyContent: 'center',
        gap: 24,
    },
    clock: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Fonts.sans,
        fontSize: 15,
        textAlign: 'center',
        letterSpacing: 1,
    },
    widgetCard: {
        alignSelf: 'stretch',
        aspectRatio: 2.1,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    widgetImage: {
        ...StyleSheet.absoluteFillObject,
    },
    widgetGradient: {
        ...StyleSheet.absoluteFillObject,
        top: '35%',
    },
    widgetTextBlock: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 12,
        gap: 3,
    },
    widgetCategory: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 9,
        letterSpacing: 2,
    },
    widgetPhrase: {
        color: 'rgba(255,255,255,0.95)',
        fontFamily: Fonts.serifBold,
        fontSize: 14,
        lineHeight: 19,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 18,
    },
    iconPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` — no new errors.
Run: `npm run lint` — no new warnings in this file (the file pre-existing `eslint-disable` comments stay).

---

### Task 3: New NotificationExplainStep

**Files:**
- Create: `app/components/onboarding/steps/notification-explain-step.tsx`

**Interfaces:**
- Consumes: i18n keys from Task 1 (`onboarding.notification_explain.*`, plus existing `onboarding.demo.phrase`), assets `@/assets/onboarding-demo/demo-vision.png` and `@/assets/images/icon.png`.
- Produces: named export `NotificationExplainStep` (a `ComponentType` with no props). It does NOT call `nextStep` itself — the wrapper's Continue button advances (step config in Task 4 sets `continueButtonText`). Step uses the dark theme (no `theme` prop → wrapper bg `#0d0d0d`, white Continue button).

- [ ] **Step 1: Create the component file**

Full contents of `app/components/onboarding/steps/notification-explain-step.tsx`:

```tsx
import { Fonts } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEMO_VISION = require('@/assets/onboarding-demo/demo-vision.png');
const APP_ICON = require('@/assets/images/icon.png');

export function NotificationExplainStep() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const bannerTranslate = useRef(new Animated.Value(-90)).current;
    const bannerOpacity = useRef(new Animated.Value(0)).current;
    const bannerScale = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(bannerScale, { toValue: 1.03, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(bannerScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(bannerOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.spring(bannerTranslate, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
            ]),
            Animated.timing(textOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start(() => pulse.start());
        return () => pulse.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.container}>
            <Image source={DEMO_VISION} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={25} />
            <View style={styles.dim} />
            <LinearGradient colors={['transparent', 'rgba(13,13,13,0.92)']} style={styles.bottomFade} />

            <View style={[styles.lockContent, { paddingTop: insets.top + 36 }]}>
                <Text style={styles.clock}>9:41</Text>
                <Animated.View
                    style={[
                        styles.banner,
                        { opacity: bannerOpacity, transform: [{ translateY: bannerTranslate }, { scale: bannerScale }] },
                    ]}
                >
                    <Image source={APP_ICON} style={styles.bannerIcon} />
                    <View style={styles.bannerTextWrap}>
                        <View style={styles.bannerHeader}>
                            <Text style={styles.bannerApp}>Veezy</Text>
                            <Text style={styles.bannerTime}>{t('onboarding.notification_explain.banner_time')}</Text>
                        </View>
                        <Text style={styles.bannerBody} numberOfLines={2}>
                            {t('onboarding.demo.phrase')}
                        </Text>
                    </View>
                </Animated.View>
            </View>

            <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
                <Text style={styles.title}>{t('onboarding.notification_explain.title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.notification_explain.subtitle')}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    dim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 260,
    },
    lockContent: {
        alignItems: 'stretch',
        paddingHorizontal: 20,
        gap: 28,
    },
    clock: {
        color: 'rgba(255,255,255,0.95)',
        fontFamily: Fonts.sans,
        fontSize: 56,
        textAlign: 'center',
        letterSpacing: 1,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(40,40,40,0.85)',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    bannerIcon: {
        width: 38,
        height: 38,
        borderRadius: 9,
    },
    bannerTextWrap: {
        flex: 1,
        gap: 2,
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerApp: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    bannerTime: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Fonts.sans,
        fontSize: 12,
    },
    bannerBody: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sans,
        fontSize: 13,
        lineHeight: 18,
    },
    textBlock: {
        position: 'absolute',
        left: 28,
        right: 28,
        bottom: 24,
        gap: 10,
    },
    title: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
});
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — no new errors.
Run: `npm run lint` — no unused-import warnings for the new file.

---

### Task 4: Wire the new flow in onboarding.tsx, delete AddWidgetStep

**Files:**
- Modify: `app/app/onboarding.tsx`
- Delete: `app/components/onboarding/steps/add-widget-step.tsx`

**Interfaces:**
- Consumes: `NotificationExplainStep` from Task 3.
- Produces: final `ONBOARDING_STEPS` order (11 steps): Hook, Tracking, Name, IdentityShift, MicroLogic, Demo, NotificationExplain, NotificationSetup, TrialOffer, TrialReminder, WhatYouWillGet.

- [ ] **Step 1: Update imports**

In `app/app/onboarding.tsx`: remove line 2 (`import { AddWidgetStep } ...`) and add:

```ts
import { NotificationExplainStep } from '@/components/onboarding/steps/notification-explain-step';
```

- [ ] **Step 2: Remove the CompanionSlide factory**

Delete the block (lines ~58-62):

```ts
        const CompanionSlide = makeEmotionSlide({
            label: t('onboarding.companion.label'),
            headline: t('onboarding.companion.headline'),
            subtext: t('onboarding.companion.subtext'),
        });
```

- [ ] **Step 3: Update the steps array**

Replace the three entries between `DemoGenerationStep` and `TrialOfferStep` (old CompanionSlide, NotificationSetupStep, AddWidgetStep lines 71-73) so the array reads:

```ts
            { component: DemoGenerationStep, showProgressIndicator: false, showContinueButton: false },
            { component: NotificationExplainStep, showProgressIndicator: false, continueButtonText: t('common.continue') },
            { component: NotificationSetupStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false, preContinue: handleRequestNotifications },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('common.continue') },
```

(NotificationExplainStep: no `theme` → dark background + white wrapper Continue button; progress bar hidden for the immersive mock, matching the demo step.)

- [ ] **Step 4: Delete the old step file**

Delete `app/components/onboarding/steps/add-widget-step.tsx` (plain file deletion, e.g. `rm` — NOT `git rm`).

- [ ] **Step 5: Verify no dangling references**

Run: `grep -rn "AddWidgetStep\|add-widget-step\|onboarding.companion\.\|'onboarding.widget\." /Users/leonardogranetto/Projects/veezy/app --include="*.ts*" | grep -v node_modules`
Expected: no matches.
Run: `npx tsc --noEmit` and `npm run lint` — clean.

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

From `/Users/leonardogranetto/Projects/veezy/app`:
- `npx tsc --noEmit` — no errors.
- `npm run lint` — no new warnings.

- [ ] **Step 2: Manual simulator checklist (iOS)**

Start with `npm run ios` (or ask the user to run it) and walk the full onboarding with a reset state (dev panel or fresh install). Verify in BOTH languages (language picker on the start screen):

1. Demo: photos → typing → loading → result unchanged.
2. Result-phase „Continue" leads to the widget phase (NOT to the next step): vision image shrinks (~600 ms) into the widget card; clock/icon placeholders fade in; badge/title/subtitle fade in; CTA appears last.
3. Widget card shows the demo image + gold category + serif phrase (like the real widget).
4. Widget-phase Continue → NotificationExplainStep: blurred vision wallpaper, big clock, banner slides in from top and gently pulses, title/subtitle fade in at the bottom, wrapper Continue button visible (white on dark).
5. Continue → NotificationSetupStep works as before (frequency/hours/style, test notification unlocks Continue, permission prompt fires there).
6. Progress bar shows 11 segments on steps that display it; no CompanionSlide, no Lottie widget step anywhere.
7. Rest of flow (TrialOffer → TrialReminder → WhatYouWillGet → Superwall placement) unchanged.
8. Tutorial afterwards still shows its widget Lottie (`tutorial-overlay`).

- [ ] **Step 3: Report results to the user** — list what passed/failed with actual output; no success claims without having run the checks.
