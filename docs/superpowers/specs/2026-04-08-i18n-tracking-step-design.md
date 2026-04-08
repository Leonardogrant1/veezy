# Design: Internationalization (i18n) + TrackingStep

**Date:** 2026-04-08
**Status:** Approved

---

## Overview

Add German/English internationalization to the veezy app using i18next + react-i18next, with automatic locale detection and manual override. Add a TrackingStep to the onboarding flow. Pass the user's language preference to the backend so AI-generated output matches the user's language.

---

## i18n Library

**i18next + react-i18next** — chosen over a custom solution to allow easy addition of future languages without migration. `expo-localization` (already installed) handles device locale detection.

Install: `i18next react-i18next`

---

## File Structure

```
app/
  i18n/
    index.ts          ← i18next init, language init logic, exports
    locales/
      de.ts           ← all German strings
      en.ts           ← all English strings (source of truth)
```

**Key naming:** flat with dot-separated prefixes, e.g.:
- `common.continue`, `common.back`, `common.error`
- `onboarding.welcome.title`, `onboarding.tracking.badge_no_data`
- `settings.title`, `home.empty_title`

---

## Language Detection & Storage

### Auto-detection (on first launch)
1. Read `expo-localization` → `Localization.region` (country code)
2. If region is `DE`, `AT`, or `CH` → set `language = 'de'`
3. Otherwise → `language = 'en'`
4. Store in `UserDataStore` as `language: 'de' | 'en'`

### Manual override
Two entry points:
1. **start.tsx** — small flag picker in a corner (🇩🇪 / 🇬🇧), visible before onboarding begins
2. **settings.tsx** — language row in settings list, same flag-based picker

### i18next initialization
- Called once at app start in `i18n/index.ts`
- Language read from `UserDataStore` (or auto-detected if not yet set)
- When user changes language: `i18n.changeLanguage(lang)` + update `UserDataStore`

---

## Translation Scope

All user-facing strings in:
- All onboarding steps (17 steps + new TrackingStep)
- `OnboardingProgressWrapper` (continue button, progress)
- `home.tsx`, `tutorial.tsx`, `start.tsx`, `settings.tsx`
- `vision/add.tsx`
- All modals: `VisionActionsModal`, `CategoryModal`, `NotificationSettingsModal`, `EditFieldModal`
- `notification-setup-step.tsx` fallback affirmation examples

**Not translated:** internal log messages, error tracking strings, backend API strings.

---

## TrackingStep Component

**Location:** `app/components/onboarding/steps/tracking-step.tsx`
**Position in onboarding:** Step 2, immediately after HookSlide (the intro).

**Design (veezy dark theme):**
- Dark background (`#0d0d0d`) — matches other dark onboarding steps
- Serif bold headline (Playfair Display), white
- Subtitle in `rgba(255,255,255,0.6)`
- Three badges: `LockIcon` / `KeyIcon` / `ChartIcon` from existing assets
  - Background: `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.1)`, borderRadius 12
  - Badge text in `rgba(255,255,255,0.6)`
- Staggered entrance animation (title → subtitle → badges), same spring config as reference component
- `showProgressIndicator: false` (it's a full-screen info step)

**Content (translated via i18n):**
- Title: `"Gebaut für deine Zukunft.\nEhrlich mit deinen Daten."` / `"Built for your future.\nHonest about your data."`
- Subtitle: about anonymous usage data to improve the experience
- Badge 1 (LockIcon): `"Keine persönlichen Daten"` / `"No personal data"`
- Badge 2 (KeyIcon): `"Kein Verkauf. Niemals."` / `"No selling. Ever."`
- Badge 3 (ChartIcon): `"Nur Insights um veezy zu verbessern"` / `"Just insights to improve veezy"`

**Tracking:** `trackerManager.track('tracking_permission')` fired on mount (user saw the screen).

---

## Backend: Output Language

The user's language preference is passed to both generation endpoints so AI output (phrase, affirmations, scene) matches the user's language.

### `/generate` and `/regenerate` endpoints
Add `language: 'de' | 'en'` to request body.

### `vision-route.ts`
Read `language` from request body, pass to `generatePhraseAndAffirmations` and `generateSceneDescription`.

### `phrase.ts`
- `SYSTEM_PROMPT_PHRASE`: append `"Respond in ${language === 'de' ? 'German' : 'English'}."`
- `SYSTEM_PROMPT_AFFIRMATION`: same
- `SYSTEM_PROMPT_FUEL`: same
- All three internal functions accept `language` param

### `generate-scene.ts`
- Append to system prompt: `"Write the scene description in ${language === 'de' ? 'German' : 'English'}."`

### App side (`generateVision` util)
Pass `language` from `useUserDataStore.getState().language` to the API calls.

---

## Settings Screen

Add a **Language** row to the settings list:
- Shows current language with flag emoji (🇩🇪 Deutsch / 🇬🇧 English)
- Tapping opens an `ActionSheet` or inline toggle between the two options
- On change: `i18n.changeLanguage(lang)` + `useUserDataStore.setState({ language: lang })`

---

## UserDataStore Changes

Add to store:
```ts
language: 'de' | 'en'  // default: auto-detected on first launch
```

---

## Self-Review

- No TBDs or placeholders
- Architecture is consistent: single source of truth in UserDataStore, i18next as rendering layer
- Scope is focused: translation + TrackingStep + backend language param
- `continueButtonText` in onboarding steps uses `t()` — needs to be called inside component (hook), not at step definition level → steps define a translation key, wrapper resolves it
- `expo-localization` region can be `null` on simulators → fallback to `en` if null and not set
