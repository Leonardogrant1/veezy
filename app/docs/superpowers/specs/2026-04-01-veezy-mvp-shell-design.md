# Veezy MVP Shell — Design Spec
**Date:** 2026-04-01
**Scope:** Navigation structure, dummy onboarding flow, dummy home screen (Vision Board Grid). No real AI, no real image generation, no database layer.

---

## Overview

Veezy is a manifestation and vision board app. The MVP shell establishes the full clickable flow so stakeholders can experience the UX before real logic is implemented. This spec covers the structural changes from the existing Discipl codebase to the Veezy shell.

---

## Approach

**Option C — Selective Cleanup:**
- Keep: `OnboardingProgressWrapper`, `OnboardingControlContext`, `types.ts`, `start.tsx` infrastructure, `tutorial.tsx` (untouched for now)
- Delete: All Discipl-specific step components, `home.tsx` (replaced)
- Create: New Veezy-specific step components, new `home.tsx`

---

## Navigation / Routing

| Route | File | Description |
|---|---|---|
| `/` | `app/index.tsx` | Redirect logic — unchanged |
| `/start` | `app/start.tsx` | Landing screen — keep video + slide, update copy only |
| `/onboarding` | `app/onboarding.tsx` | New Veezy steps via OnboardingProgressWrapper |
| `/home` | `app/home.tsx` | New Vision Board Grid — full replacement |
| `/tutorial` | `app/tutorial.tsx` | **Untouched for now** — will be rebuilt for Veezy later |

`index.tsx` stays unchanged: `hasCompletedOnboarding` → `/home`, `hasSeenTutorial` check → `/tutorial`, else → `/start`. Tutorial will be rebuilt for Veezy later.

---

## Start Screen (`start.tsx`)

Minimal changes only:
- Title: `"Manifest your future"`
- Subtitle: `"See yourself living your dream life"`
- Everything else (video background, LinearGradient, SlideToStart, animations) stays unchanged.

---

## Onboarding

### Infrastructure (unchanged)
- `OnboardingProgressWrapper` — handles step rendering, progress bar, continue button
- `OnboardingControlContext` — `canContinue`, `setContinue`, `preContinue` hooks
- `types.ts` — `OnboardingStep` type

### New Steps (all in `components/onboarding/steps/`)

All old Discipl steps are **deleted**. New steps:

| # | Component | Description |
|---|---|---|
| 1 | `WelcomeStep` | Veezy title, tagline, no input |
| 2 | `VisionInputStep` | TextArea: "Wo siehst du dich in 5 Jahren?" — `initialCanContinue: false` |
| 3 | `GoalsStep` | 3 dummy goal cards (Karriere, Gesundheit, Beziehungen) to confirm — `initialCanContinue: false` |
| 4 | `NameStep` | Text input for name — `initialCanContinue: false` |
| 5 | `AgeStep` | Number input or picker for age — `initialCanContinue: false` |
| 6 | `GenderStep` | 3 selection options (Mann, Frau, Divers) — `initialCanContinue: false` |
| 7 | `PhotoUploadStep` | Two placeholder upload boxes: "Gesicht" + "Körper" |
| 8 | `ManifestationPitchStep` | TextArea: "Beschreibe deinen Traumalltag in 5 Jahren" — `initialCanContinue: false` |
| 9 | `GenerateImageStep` | Placeholder loading screen with dummy image — `showProgressIndicator: false` |
| 10 | `PaywallStep` | 3 pricing cards (4,99€/W, 9,99€/M, 39,99€/J), 3-day trial CTA — `showProgressIndicator: false`, `showContinueButton: false` |

### State Management (MVP Shell)
- Zustand in-memory only — no MMKV persist
- `hasCompletedOnboarding` set to `true` on final step to redirect to `/home`
- No data stored permanently during this phase

---

## Home Screen (`home.tsx`)

Full replacement of the Discipl swipe-feed.

### Layout
- Background: `#0d0d0d`
- Top bar: Veezy logo (text) left, settings icon right
- **2-column grid** (`FlatList` with `numColumns={2}`) of vision cards
- Bottom padding for safe area

### Vision Card
- Fixed aspect ratio (approximately 3:4)
- Background: placeholder image from `assets/category-images/`
- Dark gradient overlay (bottom 60%)
- Affirmation text centered/bottom-aligned, white, italic
- Rounded corners (`borderRadius: 16`)

### Dummy Data
Hardcoded array of 6 placeholder cards with:
- A category label (Karriere, Gesundheit, Liebe, Finanzen, Reisen, Lifestyle)
- A short affirmation string
- A placeholder image reference

### Interactions (Dummy)
- Tap on card → no-op (wires up later)
- Settings icon → no-op

---

## Files to Delete

```
app/tutorial.tsx
components/onboarding/steps/activity-step.tsx
components/onboarding/steps/add-widget-step.tsx
components/onboarding/steps/affirmations-familiarity-step.tsx
components/onboarding/steps/age-step.tsx          ← replaced by new version
components/onboarding/steps/champions-step.tsx
components/onboarding/steps/commitment-step.tsx
components/onboarding/steps/gender-step.tsx       ← replaced by new version
components/onboarding/steps/goal-step.tsx         ← replaced by GoalsStep
components/onboarding/steps/habit-step.tsx
components/onboarding/steps/name-step.tsx         ← replaced by new version
components/onboarding/steps/notification-schedule-step.tsx
components/onboarding/steps/notifications-step.tsx
components/onboarding/steps/rating-step.tsx
components/onboarding/steps/referral-step.tsx
components/onboarding/steps/tracking-step.tsx
components/onboarding/steps/trial-offer-step.tsx  ← replaced by PaywallStep
components/onboarding/steps/trial-reminder-step.tsx
components/onboarding/steps/welcome-step.tsx      ← replaced by new version
components/onboarding/steps/what-you-will-get-step.tsx
```

Any components imported only by deleted steps (e.g. sports-specific modals) are also removed.

---

## Out of Scope

- WatermelonDB setup (comes with real Vision CRUD)
- MMKV persist for onboarding state (comes with real data layer)
- Real image generation (Gemini)
- Real paywall integration (RevenueCat)
- Tracking events for new Veezy flow
- Push notifications
- iOS Widget / Android Widget
