# i18n + TrackingStep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add German/English i18n using i18next, auto-detect language from device locale, add manual override in start.tsx and settings.tsx, create a TrackingStep for onboarding, and pass the user's language to the backend so AI output matches the user's language.

**Architecture:** i18next + react-i18next with in-memory resources (en.ts as source of truth). Language stored in UserDataStore, initialized once at module level before React tree renders. All hardcoded strings replaced with `t('key')` calls.

**Tech Stack:** `i18next`, `react-i18next`, `expo-localization` (already installed), TypeScript

---

## File Map

**Create:**
- `app/i18n/index.ts` — init, language detection, exports
- `app/i18n/locales/en.ts` — English strings (source of truth)
- `app/i18n/locales/de.ts` — German strings
- `app/components/onboarding/steps/tracking-step.tsx` — new onboarding step

**Modify (app):**
- `app/types/user-data.ts` — add `language` field
- `app/stores/UserDataStore.ts` — add `language` state + updateSettings
- `app/app/_layout.tsx` — call `initI18n()` at module level
- `app/app/start.tsx` — flag picker + translated strings
- `app/app/onboarding.tsx` — use `t()`, move slides inside useMemo, add TrackingStep
- `app/components/onboarding/steps/name-step.tsx`
- `app/components/onboarding/steps/vision-step.tsx`
- `app/components/onboarding/steps/photo-bridge-step.tsx`
- `app/components/onboarding/steps/photo-upload-step.tsx`
- `app/components/onboarding/steps/vision-generation-step.tsx`
- `app/components/onboarding/steps/vision-reaction-step.tsx`
- `app/components/onboarding/steps/notification-setup-step.tsx`
- `app/components/onboarding/steps/add-widget-step.tsx`
- `app/components/onboarding/steps/trial-offer-step.tsx`
- `app/components/onboarding/steps/trial-reminder-step.tsx`
- `app/components/onboarding/steps/what-you-will-get-step.tsx`
- `app/app/home.tsx`
- `app/app/tutorial.tsx`
- `app/app/settings.tsx`
- `app/app/vision/add.tsx`
- `app/components/modals/VisionActionsModal.tsx`
- `app/utils/generateVision.ts`

**Modify (backend):**
- `backend/src/prompts/phrase.ts` — language param in prompts
- `backend/src/prompts/generate-scene.ts` — language param in prompt
- `backend/src/routes/vision-route.ts` — read + pass language

---

## Task 1: Install i18next

**Files:** `app/package.json`

- [ ] **Step 1: Install**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && npx expo install i18next react-i18next
```

Expected: packages added to package.json without errors.

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy/app && git add package.json package-lock.json yarn.lock
git commit -m "chore: install i18next + react-i18next"
```

---

## Task 2: Create Translation Files

**Files:**
- Create: `app/i18n/locales/en.ts`
- Create: `app/i18n/locales/de.ts`
- Create: `app/i18n/index.ts`

- [ ] **Step 1: Create `app/i18n/locales/en.ts`**

```ts
const en = {
  // Common
  'common.continue': 'Continue',
  'common.error_generic': 'Something went wrong. Please try again.',

  // Start screen
  'start.title': "Manifest your\nFuture",
  'start.subtitle': "See yourself where\nyou want to be.",
  'start.cta': 'Get Started',

  // Onboarding — emotion slides
  'onboarding.hook.label': 'PHASE 1',
  'onboarding.hook.headline': 'Imagine you could see your future life.',
  'onboarding.hook.subtext': "Don't dream it. See it.",

  'onboarding.identity_shift.label': 'PHASE 2',
  'onboarding.identity_shift.headline': "Imagine… you made it.",
  'onboarding.identity_shift.subtext': 'How does that feel?',

  'onboarding.micro_logic.label': 'PHASE 3',
  'onboarding.micro_logic.headline': 'Your brain believes what it sees repeatedly.',
  'onboarding.micro_logic.subtext': 'Repetition creates reality.',

  'onboarding.companion.label': 'YOUR PATH',
  'onboarding.companion.headline': "We'll walk this path with you.",
  'onboarding.companion.subtext': "Every day we'll remind you of your goal so you never forget where you're going.",

  // Name step
  'onboarding.name.headline': "What should\nwe call you?",
  'onboarding.name.placeholder': 'Your name',

  // Vision step
  'onboarding.vision.headline_with_name': "{{name}}, what's your vision?",
  'onboarding.vision.headline': "What's your vision?",
  'onboarding.vision.subtitle': 'Briefly describe where you see yourself in a few years.',
  'onboarding.vision.placeholder': 'A house by the sea, financial freedom…',

  // Photo bridge step
  'onboarding.photo_bridge.teaser': 'Imagine…',
  'onboarding.photo_bridge.headline': "you see yourself\nright there.",
  'onboarding.photo_bridge.subtext': "Not just any image.\nYou.",
  'onboarding.photo_bridge.continue': 'Show me',

  // Photo upload step
  'onboarding.photo_upload.title': 'Your Photos',
  'onboarding.photo_upload.subtitle': 'These photos are used to place you in your vision. Upload photos from different angles.',
  'onboarding.photo_upload.slot_front': 'Front',
  'onboarding.photo_upload.slot_front_hint': 'Looking straight at camera',
  'onboarding.photo_upload.slot_smile': 'Smiling',
  'onboarding.photo_upload.slot_smile_hint': 'Natural smile',
  'onboarding.photo_upload.slot_left': 'Left',
  'onboarding.photo_upload.slot_left_hint': 'Head slightly left',
  'onboarding.photo_upload.slot_right': 'Right',
  'onboarding.photo_upload.slot_right_hint': 'Head slightly right',
  'onboarding.photo_upload.slot_body': 'Full Body',
  'onboarding.photo_upload.slot_body_hint': 'Full body visible',
  'onboarding.photo_upload.continue': 'Create my Vision!',

  // Tracking step
  'onboarding.tracking.headline': "Built for your future.\nHonest about your data.",
  'onboarding.tracking.subtitle': 'To build the best experience for you, we collect anonymous usage data.',
  'onboarding.tracking.badge_no_data': 'No personal data',
  'onboarding.tracking.badge_no_selling': 'No selling. Ever.',
  'onboarding.tracking.badge_insights': 'Just insights to improve veezy',

  // Vision generation step
  'onboarding.vision_generation.error_title': 'Something went wrong',
  'onboarding.vision_generation.error_sub': 'Your vision will be generated later.',
  'onboarding.vision_generation.continue': 'Continue',

  // Vision reaction step
  'onboarding.reaction.headline': "How does\nthis feel?",
  'onboarding.reaction.want_it': 'I want that',
  'onboarding.reaction.wild': 'Wild to see',
  'onboarding.reaction.good': 'Feels good',
  'onboarding.reaction.not_yet': "Not quite mine yet",

  // Notification setup step
  'onboarding.notifications.title': 'Your Reminder Plan',
  'onboarding.notifications.subtitle': "Set when and how often veezy should remind you of your goals.",
  'onboarding.notifications.section_frequency': 'Frequency & Time',
  'onboarding.notifications.per_day': 'Per Day',
  'onboarding.notifications.start_time': 'Start Time',
  'onboarding.notifications.end_time': 'End Time',
  'onboarding.notifications.summary': '{{count}}x daily between {{start}} and {{end}}',
  'onboarding.notifications.section_style': 'Motivation Style',
  'onboarding.notifications.style_affirmation_label': 'Affirmation',
  'onboarding.notifications.style_affirmation_desc': 'Positive affirmation & calm strength',
  'onboarding.notifications.style_fuel_label': 'Fuel',
  'onboarding.notifications.style_fuel_desc': 'Urgency & hard-hitting drive',
  'onboarding.notifications.test_button': 'Send test notification',
  'onboarding.notifications.test_sent': "Sent — check it out!",
  'onboarding.notifications.fallback_affirmation': '"I live in my dream home by the sea and am completely free."',
  'onboarding.notifications.fallback_fuel': '"Give it everything now — or dream about it forever."',

  // Add widget step
  'onboarding.widget.title': 'Your Visions. Every Day.',
  'onboarding.widget.subtitle': 'Add veezy to your home screen to keep your goals in sight at all times.',

  // Trial offer step
  'onboarding.trial_offer.label': 'EXCLUSIVELY FOR YOU',
  'onboarding.trial_offer.title': "3 days free.\nNo risk.",
  'onboarding.trial_offer.subtitle': "We give you full access to veezy Premium — so you can feel for yourself what's possible.",

  // Trial reminder step
  'onboarding.trial_reminder.label': 'HOW IT WORKS',
  'onboarding.trial_reminder.title': 'No hidden costs.',
  'onboarding.trial_reminder.day_today': 'Today',
  'onboarding.trial_reminder.day_today_desc': 'Your free access begins.',
  'onboarding.trial_reminder.day_2': 'Day 2',
  'onboarding.trial_reminder.day_2_desc': 'Reminder: your trial ends tomorrow.',
  'onboarding.trial_reminder.day_3': 'Day 3',
  'onboarding.trial_reminder.day_3_desc': 'Subscription starts — cancel anytime.',
  'onboarding.trial_reminder.cancel_note': 'Cancel anytime in iPhone Settings.',

  // What you will get step
  'onboarding.what_you_get.title': 'What awaits you',
  'onboarding.what_you_get.benefit_1': 'Your vision in front of you every day',
  'onboarding.what_you_get.benefit_2': 'Personalized affirmations',
  'onboarding.what_you_get.benefit_3': 'Home & Lock Screen Widget',
  'onboarding.what_you_get.benefit_4': 'Motivation style of your choice',
  'onboarding.what_you_get.benefit_5': '3-day free trial',
  'onboarding.what_you_get.cta': "Let's go!",

  // Home screen
  'home.empty_title': 'Create your first Vision',
  'home.empty_subtitle_pre': 'Tap the',
  'home.empty_subtitle_post': 'to create your first vision',

  // Vision add screen
  'vision.add.headline': 'Describe your vision',
  'vision.add.placeholder': 'A house by the sea, freedom, success…',
  'vision.add.error': 'Something went wrong. Please try again.',
  'vision.add.share_instagram': 'Share to Instagram Story',
  'vision.add.share': 'Share',
  'vision.add.regenerate': 'Regenerate',

  // Vision actions modal
  'vision.actions.title': 'Vision Options',
  'vision.actions.share_instagram': 'Share to Instagram Story',
  'vision.actions.share': 'Share',
  'vision.actions.edit_phrase': 'Edit phrase',
  'vision.actions.regenerate': 'Regenerate image',
  'vision.actions.delete': 'Delete vision',
  'vision.actions.delete_confirm_title': 'Delete Vision?',
  'vision.actions.delete_confirm_message': 'This action cannot be undone.',
  'vision.actions.delete_confirm_cancel': 'Cancel',
  'vision.actions.delete_confirm_ok': 'Delete',
  'vision.actions.regen_confirm_title': 'Regenerate image?',
  'vision.actions.regen_confirm_message': 'A new image will be created for this vision.',
  'vision.actions.regen_confirm_cancel': 'Cancel',
  'vision.actions.regen_confirm_ok': 'Generate',
  'vision.actions.regen_error': 'Generation failed. Please try again.',

  // Settings screen
  'settings.section_settings': 'Settings',
  'settings.section_legal': 'Legal',
  'settings.self_reference_title': 'Reference Photos',
  'settings.self_reference_subtitle': 'Photos for personalized visions',
  'settings.premium_title': 'Veezy Premium',
  'settings.premium_subtitle': 'Unlock all features',
  'settings.row_name': 'Name',
  'settings.row_birthday': 'Birthday',
  'settings.row_notifications': 'Notifications',
  'settings.row_subscription': 'Manage Subscription',
  'settings.row_tutorial': 'Repeat Tutorial',
  'settings.row_request_feature': 'Request Feature',
  'settings.row_report_bug': 'Report Bug',
  'settings.row_haptics': 'Haptics',
  'settings.row_language': 'Language',
  'settings.legal_terms': 'Terms of Use',
  'settings.legal_privacy': 'Privacy Policy',
  'settings.edit_name_title': 'Name',
  'settings.edit_name_placeholder': 'Your name',
} as const;

export type TranslationKeys = keyof typeof en;
export default en;
```

- [ ] **Step 2: Create `app/i18n/locales/de.ts`**

```ts
const de: Record<string, string> = {
  // Common
  'common.continue': 'Weiter',
  'common.error_generic': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',

  // Start screen
  'start.title': "Manifest deine\nZukunft",
  'start.subtitle': "Sieh dich selbst dort,\nwo du hinwillst.",
  'start.cta': 'Loslegen',

  // Onboarding — emotion slides
  'onboarding.hook.label': 'PHASE 1',
  'onboarding.hook.headline': 'Stell dir vor, du könntest dein zukünftiges Leben sehen.',
  'onboarding.hook.subtext': 'Nicht träumen. Sehen.',

  'onboarding.identity_shift.label': 'PHASE 2',
  'onboarding.identity_shift.headline': 'Stell dir vor… du hast es geschafft.',
  'onboarding.identity_shift.subtext': 'Wie fühlt sich das an?',

  'onboarding.micro_logic.label': 'PHASE 3',
  'onboarding.micro_logic.headline': 'Dein Gehirn glaubt, was es regelmäßig sieht.',
  'onboarding.micro_logic.subtext': 'Wiederholung schafft Realität.',

  'onboarding.companion.label': 'DEIN WEG',
  'onboarding.companion.headline': 'Wir begleiten dich auf deinem Weg.',
  'onboarding.companion.subtext': 'Jeden Tag erinnern wir dich an dein Ziel, damit du nicht vergisst, wohin du willst.',

  // Name step
  'onboarding.name.headline': "Wie sollen wir\ndich nennen?",
  'onboarding.name.placeholder': 'Dein Name',

  // Vision step
  'onboarding.vision.headline_with_name': "{{name}}, was ist deine Vision?",
  'onboarding.vision.headline': "Was ist deine Vision?",
  'onboarding.vision.subtitle': 'Beschreibe kurz, wo du in ein paar Jahren stehst.',
  'onboarding.vision.placeholder': 'Ein Haus am Meer, finanzielle Freiheit…',

  // Photo bridge step
  'onboarding.photo_bridge.teaser': 'Stell dir vor…',
  'onboarding.photo_bridge.headline': "du siehst dich selbst\ngenau dort.",
  'onboarding.photo_bridge.subtext': "Nicht irgendein Bild.\nSondern dich.",
  'onboarding.photo_bridge.continue': 'Zeig es mir',

  // Photo upload step
  'onboarding.photo_upload.title': 'Deine Fotos',
  'onboarding.photo_upload.subtitle': 'Diese Bilder werden genutzt, um dich in deiner Vision darzustellen. Lade Fotos aus verschiedenen Perspektiven hoch.',
  'onboarding.photo_upload.slot_front': 'Frontal',
  'onboarding.photo_upload.slot_front_hint': 'Gerade in die Kamera',
  'onboarding.photo_upload.slot_smile': 'Lächelnd',
  'onboarding.photo_upload.slot_smile_hint': 'Natürliches Lächeln',
  'onboarding.photo_upload.slot_left': 'Links',
  'onboarding.photo_upload.slot_left_hint': 'Kopf leicht links',
  'onboarding.photo_upload.slot_right': 'Rechts',
  'onboarding.photo_upload.slot_right_hint': 'Kopf leicht rechts',
  'onboarding.photo_upload.slot_body': 'Körper',
  'onboarding.photo_upload.slot_body_hint': 'Ganzkörper sichtbar',
  'onboarding.photo_upload.continue': 'Kreiere meine Vision!',

  // Tracking step
  'onboarding.tracking.headline': "Gebaut für deine Zukunft.\nEhrlich mit deinen Daten.",
  'onboarding.tracking.subtitle': 'Um die beste Erfahrung für dich zu schaffen, sammeln wir anonyme Nutzungsdaten.',
  'onboarding.tracking.badge_no_data': 'Keine persönlichen Daten',
  'onboarding.tracking.badge_no_selling': 'Kein Verkauf. Niemals.',
  'onboarding.tracking.badge_insights': 'Nur Insights um veezy zu verbessern',

  // Vision generation step
  'onboarding.vision_generation.error_title': 'Etwas ist schiefgelaufen',
  'onboarding.vision_generation.error_sub': 'Deine Vision wird später generiert.',
  'onboarding.vision_generation.continue': 'Weiter',

  // Vision reaction step
  'onboarding.reaction.headline': "Wie fühlt sich\ndas an?",
  'onboarding.reaction.want_it': 'Ich will das',
  'onboarding.reaction.wild': 'Krass zu sehen',
  'onboarding.reaction.good': 'Fühlt sich gut an',
  'onboarding.reaction.not_yet': "Noch nicht ganz meins",

  // Notification setup step
  'onboarding.notifications.title': 'Dein Reminder-Plan',
  'onboarding.notifications.subtitle': 'Stell ein, wann und wie oft veezy dich an deine Ziele erinnern soll.',
  'onboarding.notifications.section_frequency': 'Häufigkeit & Zeitraum',
  'onboarding.notifications.per_day': 'Pro Tag',
  'onboarding.notifications.start_time': 'Startzeit',
  'onboarding.notifications.end_time': 'Endzeit',
  'onboarding.notifications.summary': '{{count}}x täglich zwischen {{start}} und {{end}}',
  'onboarding.notifications.section_style': 'Motivationsstil',
  'onboarding.notifications.style_affirmation_label': 'Affirmation',
  'onboarding.notifications.style_affirmation_desc': 'Positive Bestätigung & ruhige Stärke',
  'onboarding.notifications.style_fuel_label': 'Fuel',
  'onboarding.notifications.style_fuel_desc': 'Dringlichkeit & knallharter Antrieb',
  'onboarding.notifications.test_button': 'Test-Benachrichtigung senden',
  'onboarding.notifications.test_sent': 'Gesendet — schau gleich rein!',
  'onboarding.notifications.fallback_affirmation': '"Ich lebe in meinem Traumhaus am Meer und bin vollkommen frei."',
  'onboarding.notifications.fallback_fuel': '"Jetzt alles geben – oder für immer davon träumen."',

  // Add widget step
  'onboarding.widget.title': 'Deine Visionen. Jeden Tag vor Augen.',
  'onboarding.widget.subtitle': 'Füge veezy zu deinem Home-Screen hinzu, um deine Ziele immer im Blick zu haben.',

  // Trial offer step
  'onboarding.trial_offer.label': 'EXKLUSIV FÜR DICH',
  'onboarding.trial_offer.title': "3 Tage kostenlos.\nKein Risiko.",
  'onboarding.trial_offer.subtitle': 'Wir geben dir vollen Zugang zu veezy Premium — damit du selbst spürst, was möglich ist.',

  // Trial reminder step
  'onboarding.trial_reminder.label': 'SO FUNKTIONIERT ES',
  'onboarding.trial_reminder.title': 'Keine versteckten Kosten.',
  'onboarding.trial_reminder.day_today': 'Heute',
  'onboarding.trial_reminder.day_today_desc': 'Dein kostenloser Zugang beginnt.',
  'onboarding.trial_reminder.day_2': 'Tag 2',
  'onboarding.trial_reminder.day_2_desc': 'Erinnerung: Dein Test endet morgen.',
  'onboarding.trial_reminder.day_3': 'Tag 3',
  'onboarding.trial_reminder.day_3_desc': 'Abo beginnt — jederzeit kündbar.',
  'onboarding.trial_reminder.cancel_note': 'Jederzeit in den iPhone-Einstellungen kündbar.',

  // What you will get step
  'onboarding.what_you_get.title': 'Was dich erwartet',
  'onboarding.what_you_get.benefit_1': 'Deine Vision täglich vor Augen',
  'onboarding.what_you_get.benefit_2': 'Personalisierte Affirmationen',
  'onboarding.what_you_get.benefit_3': 'Home- & Lock-Screen Widget',
  'onboarding.what_you_get.benefit_4': 'Motivationsstil nach deiner Wahl',
  'onboarding.what_you_get.benefit_5': '3 Tage kostenlos testen',
  'onboarding.what_you_get.cta': "Los geht's!",

  // Home screen
  'home.empty_title': 'Erstelle deine erste Vision',
  'home.empty_subtitle_pre': 'Tippe auf das',
  'home.empty_subtitle_post': 'um deine erste Vision zu erstellen',

  // Vision add screen
  'vision.add.headline': 'Beschreibe deine Vision',
  'vision.add.placeholder': 'Ein Haus am Meer, Freiheit, Erfolg…',
  'vision.add.error': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  'vision.add.share_instagram': 'In Instagram Story teilen',
  'vision.add.share': 'Teilen',
  'vision.add.regenerate': 'Neu generieren',

  // Vision actions modal
  'vision.actions.title': 'Vision Optionen',
  'vision.actions.share_instagram': 'In Instagram Story teilen',
  'vision.actions.share': 'Teilen',
  'vision.actions.edit_phrase': 'Phrase bearbeiten',
  'vision.actions.regenerate': 'Bild neu generieren',
  'vision.actions.delete': 'Vision löschen',
  'vision.actions.delete_confirm_title': 'Vision löschen?',
  'vision.actions.delete_confirm_message': 'Diese Aktion kann nicht rückgängig gemacht werden.',
  'vision.actions.delete_confirm_cancel': 'Abbrechen',
  'vision.actions.delete_confirm_ok': 'Löschen',
  'vision.actions.regen_confirm_title': 'Bild neu generieren?',
  'vision.actions.regen_confirm_message': 'Ein neues Bild wird für diese Vision erstellt.',
  'vision.actions.regen_confirm_cancel': 'Abbrechen',
  'vision.actions.regen_confirm_ok': 'Generieren',
  'vision.actions.regen_error': 'Generierung fehlgeschlagen. Bitte versuche es erneut.',

  // Settings screen
  'settings.section_settings': 'Einstellungen',
  'settings.section_legal': 'Rechtliches',
  'settings.self_reference_title': 'Referenzbilder',
  'settings.self_reference_subtitle': 'Fotos für personalisierte Visionen',
  'settings.premium_title': 'Veezy Premium',
  'settings.premium_subtitle': 'Alle Features freischalten',
  'settings.row_name': 'Name',
  'settings.row_birthday': 'Geburtstag',
  'settings.row_notifications': 'Benachrichtigungen',
  'settings.row_subscription': 'Abo verwalten',
  'settings.row_tutorial': 'Tutorial wiederholen',
  'settings.row_request_feature': 'Feature anfragen',
  'settings.row_report_bug': 'Bug melden',
  'settings.row_haptics': 'Haptik',
  'settings.row_language': 'Sprache',
  'settings.legal_terms': 'Nutzungsbedingungen',
  'settings.legal_privacy': 'Datenschutz',
  'settings.edit_name_title': 'Name',
  'settings.edit_name_placeholder': 'Dein Name',
};

export default de;
```

- [ ] **Step 3: Create `app/i18n/index.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en';
import de from './locales/de';

const DE_REGIONS = ['DE', 'AT', 'CH'];

export type AppLanguage = 'de' | 'en';

export function detectLanguage(): AppLanguage {
    const region = getLocales()[0]?.regionCode ?? '';
    return DE_REGIONS.includes(region) ? 'de' : 'en';
}

export function initI18n(language?: AppLanguage) {
    if (i18n.isInitialized) {
        if (language) i18n.changeLanguage(language);
        return i18n;
    }

    i18n.use(initReactI18next).init({
        resources: {
            en: { translation: en },
            de: { translation: de },
        },
        lng: language ?? detectLanguage(),
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

    return i18n;
}

export function changeLanguage(lang: AppLanguage) {
    i18n.changeLanguage(lang);
}

export default i18n;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/i18n/
git commit -m "feat: add i18n infrastructure with en/de translations"
```

---

## Task 3: Add `language` to UserData and UserDataStore

**Files:**
- Modify: `app/types/user-data.ts`
- Modify: `app/stores/UserDataStore.ts`

- [ ] **Step 1: Add `language` to `UserData` type in `app/types/user-data.ts`**

Add to the `UserData` type (after `visionDescription`):

```ts
language: 'de' | 'en'
```

The full updated type block:
```ts
export type UserData = {
    userId: string
    hasOnboarded: boolean
    hasSeenTutorial: boolean
    name: string
    birthday: string | null
    gender: 'male' | 'female' | 'other'
    notifications: boolean
    notificationsPerDay: number
    notificationStartHour: number
    notificationEndHour: number
    haptics: boolean
    imagesUsed: number
    isPremium: boolean
    selfReferenceImages: SelfReferenceImages
    motivationStyle: MotivationStyle
    primaryCategory: PrimaryCategory | null
    visionDescription: string
    language: 'de' | 'en'
}
```

- [ ] **Step 2: Add `language` to the `updateSettings` patch type and initial state in `app/stores/UserDataStore.ts`**

In `updateSettings` type parameter, add `'language'` to the Pick:
```ts
updateSettings: (patch: Partial<Pick<UserData, 'name' | 'birthday' | 'gender' | 'notifications' | 'notificationsPerDay' | 'notificationStartHour' | 'notificationEndHour' | 'haptics' | 'motivationStyle' | 'primaryCategory' | 'visionDescription' | 'language'>>) => void;
```

In the initial state object, add (after `visionDescription: ''`):
```ts
language: 'en' as const,
```

Note: The actual language will be set during init in `_layout.tsx` before the first render.

- [ ] **Step 3: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/types/user-data.ts app/stores/UserDataStore.ts
git commit -m "feat: add language field to UserData and UserDataStore"
```

---

## Task 4: Initialize i18n in _layout.tsx

**Files:** Modify: `app/app/_layout.tsx`

- [ ] **Step 1: Update the module-level init block in `app/app/_layout.tsx`**

The file already imports `initPosthog` at the top. Add the i18n import alongside it. Then, in the module-level block (where `trackerManager.register(...)` already exists), detect language from the store and init i18n:

Add import:
```ts
import { detectLanguage, initI18n, type AppLanguage } from '@/i18n';
```

Add after the existing `trackerManager.init();` line (still at module level, outside the component):
```ts
// Init i18n — read persisted language or detect from device locale
const storedLanguage = (() => {
    try {
        const { useUserDataStore } = require('@/stores/UserDataStore');
        const lang = useUserDataStore.getState().language as AppLanguage | undefined;
        return lang || undefined;
    } catch {
        return undefined;
    }
})();
initI18n(storedLanguage ?? detectLanguage());
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/_layout.tsx
git commit -m "feat: initialize i18n at app startup with persisted or detected language"
```

---

## Task 5: Create TrackingStep Component

**Files:** Create: `app/components/onboarding/steps/tracking-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import ChartIcon from '@/assets/icons/chart.svg';
import KeyIcon from '@/assets/icons/key.svg';
import LockIcon from '@/assets/icons/lock_check.svg';
import { Colors, Fonts } from '@/constants/theme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function TrackingStep() {
    const { t } = useTranslation();

    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(16)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleY = useRef(new Animated.Value(16)).current;
    const badgesOpacity = useRef(new Animated.Value(0)).current;
    const badgesY = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        trackerManager.track('onboarding_tracking_step_viewed');

        Animated.parallel([
            Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(titleY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
        ]).start();

        setTimeout(() => {
            Animated.parallel([
                Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(subtitleY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
            ]).start();
        }, 300);

        setTimeout(() => {
            Animated.parallel([
                Animated.timing(badgesOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(badgesY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
            ]).start();
        }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.titleContainer, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                <Text style={styles.title}>{t('onboarding.tracking.headline')}</Text>
                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }]}>
                    {t('onboarding.tracking.subtitle')}
                </Animated.Text>
            </Animated.View>

            <Animated.View style={[styles.badges, { opacity: badgesOpacity, transform: [{ translateY: badgesY }] }]}>
                <View style={styles.badge}>
                    <LockIcon width={22} height={22} color={Colors.accent} />
                    <Text style={styles.badgeText}>{t('onboarding.tracking.badge_no_data')}</Text>
                </View>
                <View style={styles.badge}>
                    <KeyIcon width={22} height={22} color={Colors.accent} />
                    <Text style={styles.badgeText}>{t('onboarding.tracking.badge_no_selling')}</Text>
                </View>
                <View style={styles.badge}>
                    <ChartIcon width={22} height={22} color={Colors.accent} />
                    <Text style={styles.badgeText}>{t('onboarding.tracking.badge_insights')}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
        gap: 40,
    },
    titleContainer: {
        gap: 14,
    },
    title: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 32,
        lineHeight: 42,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sans,
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
    },
    badges: {
        gap: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: Fonts.sansMedium,
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/components/onboarding/steps/tracking-step.tsx
git commit -m "feat: add TrackingStep onboarding component"
```

---

## Task 6: Translate start.tsx + Add Language Picker

**Files:** Modify: `app/app/start.tsx`

- [ ] **Step 1: Replace `app/app/start.tsx` with translated version**

```tsx
import Logo from '@/assets/logo.svg';
import { Cream, Colors, Fonts, Gold } from '@/constants/theme';
import { changeLanguage } from '@/i18n';
import { useUserDataStore } from '@/stores/UserDataStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');
const BUTTON_W = 200;

function useShimmerAnim() {
    const x = useRef(new Animated.Value(-BUTTON_W)).current;
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(2800),
                Animated.parallel([
                    Animated.timing(x, { toValue: BUTTON_W, duration: 600, useNativeDriver: true }),
                    Animated.sequence([
                        Animated.timing(scale, { toValue: 1.06, duration: 200, useNativeDriver: true }),
                        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
                    ]),
                ]),
                Animated.timing(x, { toValue: -BUTTON_W, duration: 0, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { x, scale };
}

function useFloatAnim(config: { distance: number; duration: number; delay?: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: config.distance, duration: config.duration, delay: config.delay ?? 0, useNativeDriver: true }),
                Animated.timing(anim, { toValue: -config.distance, duration: config.duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: config.duration, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return anim;
}

export default function StartScreen() {
    const { t, i18n } = useTranslation();
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    const blob1Y = useFloatAnim({ distance: 18, duration: 3200 });
    const blob1X = useFloatAnim({ distance: 12, duration: 4100, delay: 300 });
    const blob2Y = useFloatAnim({ distance: 22, duration: 3800, delay: 600 });
    const blob2X = useFloatAnim({ distance: 14, duration: 3500, delay: 100 });
    const blob3Y = useFloatAnim({ distance: 14, duration: 4400, delay: 800 });

    const { x: shimmerX, scale: buttonScale } = useShimmerAnim();

    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleY = useRef(new Animated.Value(20)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const buttonY = useRef(new Animated.Value(20)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(subtitleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(subtitleY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(buttonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(buttonY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
        ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLanguageToggle(lang: 'de' | 'en') {
        changeLanguage(lang);
        updateSettings({ language: lang });
    }

    const currentLang = i18n.language as 'de' | 'en';

    return (
        <View style={styles.container}>
            <Image source={require('@/assets/images/dummy-vision-image.jpg')} style={styles.bgImage} resizeMode="cover" />

            <Animated.View style={[styles.blob, styles.blobTop, { transform: [{ translateY: blob1Y }, { translateX: blob1X }] }]} />
            <Animated.View style={[styles.blob, styles.blobBottom, { transform: [{ translateY: blob2Y }, { translateX: blob2X }] }]} />
            <Animated.View style={[styles.blob, styles.blobCenter, { transform: [{ translateY: blob3Y }] }]} />

            {/* Language picker — top right corner */}
            <View style={styles.languagePicker}>
                <TouchableOpacity
                    style={[styles.langButton, currentLang === 'de' && styles.langButtonActive]}
                    onPress={() => handleLanguageToggle('de')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.langFlag}>🇩🇪</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.langButton, currentLang === 'en' && styles.langButtonActive]}
                    onPress={() => handleLanguageToggle('en')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.langFlag}>🇬🇧</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity }]}>
                    <Logo width={64} height={64} />
                </Animated.View>

                <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                    {t('start.title')}
                </Animated.Text>
                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }]}>
                    {t('start.subtitle')}
                </Animated.Text>
                <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonY }, { scale: buttonScale }] }}>
                    <TouchableOpacity style={styles.button} onPress={() => router.replace('/onboarding')} activeOpacity={0.85}>
                        <Text style={styles.buttonText}>{t('start.cta')}</Text>
                        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] }]}>
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shimmerGradient}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Cream[400] },
    bgImage: { position: 'absolute', width: SCREEN_W, height: SCREEN_H, opacity: 0.13, top: 0, left: 0 },
    blob: { position: 'absolute', borderRadius: 999 },
    blobTop: { width: 380, height: 380, backgroundColor: Gold[400], top: -120, right: -100, opacity: 0.35 },
    blobBottom: { width: 320, height: 320, backgroundColor: Gold[300], bottom: -80, left: -80, opacity: 0.35 },
    blobCenter: { width: 200, height: 200, backgroundColor: Gold[500], top: '35%', left: '20%', opacity: 0.15 },
    languagePicker: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    langButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    langButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderColor: Colors.accent,
    },
    langFlag: { fontSize: 18 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    logoWrapper: { marginBottom: 32 },
    title: { fontFamily: Fonts.serifBold, fontSize: 42, lineHeight: 52, color: Colors.textHeadline, textAlign: 'center', marginBottom: 16 },
    subtitle: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, color: Colors.textMuted, textAlign: 'center', marginBottom: 48 },
    button: { backgroundColor: Colors.accent, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 999, overflow: 'hidden' },
    shimmer: { position: 'absolute', top: 0, bottom: 0, width: 60 },
    shimmerGradient: { flex: 1, width: 60 },
    buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: '#ffffff', letterSpacing: 0.3 },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/start.tsx
git commit -m "feat: translate start.tsx and add language picker"
```

---

## Task 7: Translate onboarding.tsx + Add TrackingStep

**Files:** Modify: `app/app/onboarding.tsx`

- [ ] **Step 1: Replace `app/app/onboarding.tsx`**

Key changes: import `TrackingStep`, import `useTranslation`, move `makeEmotionSlide` calls inside `useMemo`, add `t` to `useMemo` deps, translate `continueButtonText` values, insert TrackingStep as step 2.

```tsx
import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AddWidgetStep } from '@/components/onboarding/steps/add-widget-step';
import { makeEmotionSlide } from '@/components/onboarding/steps/emotion-slide-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { NotificationSetupStep } from '@/components/onboarding/steps/notification-setup-step';
import { PhotoBridgeStep } from '@/components/onboarding/steps/photo-bridge-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { TrackingStep } from '@/components/onboarding/steps/tracking-step';
import { TrialOfferStep } from '@/components/onboarding/steps/trial-offer-step';
import { TrialReminderStep } from '@/components/onboarding/steps/trial-reminder-step';
import { VisionGenerationStep } from '@/components/onboarding/steps/vision-generation-step';
import { VisionReactionStep } from '@/components/onboarding/steps/vision-reaction-step';
import { VisionStep } from '@/components/onboarding/steps/vision-step';
import { WhatYouWillGetStep } from '@/components/onboarding/steps/what-you-will-get-step';
import { OnboardingStep } from '@/components/onboarding/types';
import { MediaHandler } from '@/lib/media-handler';
import { useUserDataStore } from '@/stores/UserDataStore';
import { SelfReferenceImages } from '@/types/user-data';
import { registerPushNotifications } from '@/utils/register-push-notifications';
import { File } from 'expo-file-system';
import * as StoreReview from 'expo-store-review';
import { fetch } from 'expo/fetch';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

const SELF_REF_KEYS: (keyof SelfReferenceImages)[] = ['face_front', 'face_smile', 'face_left', 'face_right', 'body'];

export default function OnboardingScreen() {
    const { t } = useTranslation();

    const handleUploadAndComposite = useCallback(async () => {
        const { selfReferenceImages, userId, updateSelfReferenceImages } = useUserDataStore.getState();
        const filledKeys = SELF_REF_KEYS.filter((k) => selfReferenceImages[k]);
        if (filledKeys.length === 0) return;

        const { urls } = await fetch(`${BACKEND_URL}/self-reference/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-rc-user-id': userId },
            body: JSON.stringify({ types: filledKeys }),
        }).then((r) => r.json() as Promise<{ urls: Record<string, string> }>);

        const newPaths: Partial<SelfReferenceImages> = {};
        await Promise.all(
            filledKeys.map(async (key) => {
                const uri = selfReferenceImages[key]!;
                const arrayBuffer = await new File(uri).arrayBuffer();
                await fetch(urls[key], { method: 'PUT', body: arrayBuffer, headers: { 'Content-Type': 'image/jpeg' } });
                newPaths[key] = MediaHandler.saveFromLocal(uri, `self-reference/${userId}/${key}`);
            })
        );
        updateSelfReferenceImages(newPaths);

        await fetch(`${BACKEND_URL}/self-reference/composite`, {
            method: 'POST',
            headers: { 'x-rc-user-id': userId },
        });
    }, []);

    const handleRequestNotifications = useCallback(async () => {
        const { status } = await registerPushNotifications();
        if (status === 'granted') {
            useUserDataStore.getState().updateSettings({ notifications: true });
        }
    }, []);

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
            { component: TrackingStep, showProgressIndicator: false, continueButtonText: t('common.continue') },
            { component: NameStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: VisionStep, showProgressIndicator: false, continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: IdentityShiftSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: MicroLogicSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: PhotoBridgeStep, showProgressIndicator: false, continueButtonText: t('onboarding.photo_bridge.continue'), theme: 'light' },
            { component: PhotoUploadStep, continueButtonText: t('onboarding.photo_upload.continue'), theme: 'light', initialCanContinue: false, preContinue: handleUploadAndComposite },
            {
                component: VisionGenerationStep, showProgressIndicator: false, showContinueButton: false, preContinue: async () => {
                    try {
                        const isAvailable = await StoreReview.isAvailableAsync();
                        if (isAvailable) await StoreReview.requestReview();
                    } catch { /* silently continue */ }
                }
            },
            { component: VisionReactionStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false },
            { component: CompanionSlide, showProgressIndicator: false, showContinueButton: false, theme: 'light' },
            { component: NotificationSetupStep, theme: 'light', continueButtonText: t('common.continue'), initialCanContinue: false, preContinue: handleRequestNotifications },
            { component: AddWidgetStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialOfferStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: TrialReminderStep, theme: 'light', continueButtonText: t('common.continue') },
            { component: WhatYouWillGetStep, theme: 'light', continueButtonText: t('onboarding.what_you_get.cta') },
        ];
    }, [handleUploadAndComposite, t]);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/onboarding.tsx
git commit -m "feat: translate onboarding.tsx, add TrackingStep, move slides inside useMemo"
```

---

## Task 8: Translate Onboarding Step Components

**Files:** Modify 11 step files.

- [ ] **Step 1: Update `app/components/onboarding/steps/name-step.tsx`**

Add `useTranslation` import and replace hardcoded strings:

```tsx
import { useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';

export function NameStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const [name, setName] = useState('');
    const focusOffset = useRef(new Animated.Value(0)).current;

    function handleFocus() {
        Animated.timing(focusOffset, { toValue: -130, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    function handleBlur() {
        Animated.timing(focusOffset, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    function handleChange(value: string) {
        setName(value);
        setCanContinue(value.trim().length >= 2);
        if (value.trim().length >= 2) updateSettings({ name: value.trim() });
    }

    return (
        <Pressable style={styles.container} onPress={Keyboard.dismiss}>
            <View style={styles.inner} pointerEvents="box-none">
                <Animated.View style={[styles.content, { transform: [{ translateY: focusOffset }] }]}>
                    <Text style={styles.headline}>{t('onboarding.name.headline')}</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={handleChange}
                        placeholder={t('onboarding.name.placeholder')}
                        placeholderTextColor={Colors.textPlaceholder}
                        autoCapitalize="words"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        selectionColor={Colors.accent}
                        textAlign="center"
                    />
                    <View style={styles.underline} />
                </Animated.View>
            </View>
        </Pressable>
    );
}

// styles unchanged — copy from original
```

Keep all existing styles unchanged.

- [ ] **Step 2: Update `app/components/onboarding/steps/vision-step.tsx`**

Add `useTranslation`, replace 3 strings:

```tsx
// Add at top:
import { useTranslation } from 'react-i18next';

// Inside VisionStep():
const { t } = useTranslation();

// Replace strings:
// headline: name ? `${name}, was ist deine Vision?` : 'Was ist deine Vision?'
// → name ? t('onboarding.vision.headline_with_name', { name }) : t('onboarding.vision.headline')

// subtext: 'Beschreibe kurz...'
// → t('onboarding.vision.subtitle')

// placeholder: 'Ein Haus am Meer...'
// → t('onboarding.vision.placeholder')
```

Full updated JSX section (keep all styles unchanged):
```tsx
<Text style={styles.headline}>
    {name ? t('onboarding.vision.headline_with_name', { name }) : t('onboarding.vision.headline')}
</Text>
<Text style={styles.subtext}>{t('onboarding.vision.subtitle')}</Text>
<TextInput
    // ...
    placeholder={t('onboarding.vision.placeholder')}
    // ...
/>
```

- [ ] **Step 3: Update `app/components/onboarding/steps/photo-bridge-step.tsx`**

Add `useTranslation`, replace 3 strings. Keep animations unchanged.

```tsx
import { useTranslation } from 'react-i18next';
// Inside PhotoBridgeStep():
const { t } = useTranslation();
// Replace:
// 'Stell dir vor…'  → t('onboarding.photo_bridge.teaser')
// 'du siehst dich selbst\ngenau dort.'  → t('onboarding.photo_bridge.headline')
// 'Nicht irgendein Bild.\nSondern dich.'  → t('onboarding.photo_bridge.subtext')
```

- [ ] **Step 4: Update `app/components/onboarding/steps/photo-upload-step.tsx`**

Move `SLOTS` array inside component (so `t()` is available), replace all German strings.

```tsx
import { useTranslation } from 'react-i18next';

export function PhotoUploadStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const updateSelfReferenceImages = useUserDataStore((s) => s.updateSelfReferenceImages);

    const SLOTS = [
        { key: 'face_front' as Slot, label: t('onboarding.photo_upload.slot_front'), hint: t('onboarding.photo_upload.slot_front_hint'), icon: face_front },
        { key: 'face_smile' as Slot, label: t('onboarding.photo_upload.slot_smile'), hint: t('onboarding.photo_upload.slot_smile_hint'), icon: face_smile },
        { key: 'face_left' as Slot, label: t('onboarding.photo_upload.slot_left'), hint: t('onboarding.photo_upload.slot_left_hint'), icon: face_left },
        { key: 'face_right' as Slot, label: t('onboarding.photo_upload.slot_right'), hint: t('onboarding.photo_upload.slot_right_hint'), icon: face_right },
        { key: 'body' as Slot, label: t('onboarding.photo_upload.slot_body'), hint: t('onboarding.photo_upload.slot_body_hint'), wide: true, icon: body },
    ];
    // ... rest of component unchanged, title and subtitle updated:
    // 'Deine Fotos' → t('onboarding.photo_upload.title')
    // 'Diese Bilder...' → t('onboarding.photo_upload.subtitle')
```

- [ ] **Step 5: Update `app/components/onboarding/steps/vision-generation-step.tsx`**

Add `useTranslation`, replace 3 strings inside error state:

```tsx
import { useTranslation } from 'react-i18next';
// Inside VisionGenerationStep():
const { t } = useTranslation();
// Replace:
// 'Etwas ist schiefgelaufen' → t('onboarding.vision_generation.error_title')
// 'Deine Vision wird später generiert.' → t('onboarding.vision_generation.error_sub')
// 'Weiter' (both occurrences) → t('onboarding.vision_generation.continue')
```

- [ ] **Step 6: Update `app/components/onboarding/steps/vision-reaction-step.tsx`**

Add `useTranslation`, replace headline and 4 option labels.

Replace the module-level `OPTIONS` const with a function inside the component:

```tsx
import { useTranslation } from 'react-i18next';

export function VisionReactionStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const [selected, setSelected] = useState<string | null>(null);

    const OPTIONS = [
        { id: 'want_it', label: t('onboarding.reaction.want_it') },
        { id: 'wild', label: t('onboarding.reaction.wild') },
        { id: 'good', label: t('onboarding.reaction.good') },
        { id: 'not_yet', label: t('onboarding.reaction.not_yet') },
    ];

    // headline: 'Wie fühlt sich\ndas an?' → t('onboarding.reaction.headline')
```

Note: `OptionId` type can be removed or changed to `string` since we're no longer using the const array's type.

- [ ] **Step 7: Update `app/components/onboarding/steps/notification-setup-step.tsx`**

Add `useTranslation`, move `FALLBACK_EXAMPLES` and `STYLE_OPTIONS` inside the component, replace all strings.

```tsx
import { useTranslation } from 'react-i18next';

export function NotificationSetupStep() {
    const { t } = useTranslation();
    // ... existing hooks ...

    const FALLBACK_EXAMPLES: Record<MotivationStyle, string> = {
        affirmation: t('onboarding.notifications.fallback_affirmation'),
        fuel: t('onboarding.notifications.fallback_fuel'),
    };

    const STYLE_OPTIONS = [
        { value: 'affirmation' as MotivationStyle, label: t('onboarding.notifications.style_affirmation_label'), description: t('onboarding.notifications.style_affirmation_desc') },
        { value: 'fuel' as MotivationStyle, label: t('onboarding.notifications.style_fuel_label'), description: t('onboarding.notifications.style_fuel_desc') },
    ];

    // Replace all German strings:
    // title: t('onboarding.notifications.title')
    // subtitle: t('onboarding.notifications.subtitle')
    // section labels, per_day, start_time, end_time
    // summary: t('onboarding.notifications.summary', { count, start: formatHour(startHour), end: formatHour(endHour) })
    // test button: t('onboarding.notifications.test_button') / t('onboarding.notifications.test_sent')
```

- [ ] **Step 8: Update `app/components/onboarding/steps/add-widget-step.tsx`**

Add `useTranslation`, replace 2 strings:

```tsx
import { useTranslation } from 'react-i18next';
// Inside AddWidgetStep():
const { t } = useTranslation();
// 'Deine Visionen. Jeden Tag vor Augen.' → t('onboarding.widget.title')
// 'Füge veezy...' → t('onboarding.widget.subtitle')
```

- [ ] **Step 9: Update `app/components/onboarding/steps/trial-offer-step.tsx`**

Add `useTranslation`, replace 3 strings:

```tsx
import { useTranslation } from 'react-i18next';
// Inside TrialOfferStep():
const { t } = useTranslation();
// 'EXKLUSIV FÜR DICH' → t('onboarding.trial_offer.label')
// '3 Tage kostenlos.\nKein Risiko.' → t('onboarding.trial_offer.title')
// 'Wir geben dir...' → t('onboarding.trial_offer.subtitle')
```

- [ ] **Step 10: Update `app/components/onboarding/steps/trial-reminder-step.tsx`**

Move `STEPS` inside the component, add `useTranslation`:

```tsx
import { useTranslation } from 'react-i18next';

export function TrialReminderStep() {
    const { t } = useTranslation();

    const STEPS = [
        { day: t('onboarding.trial_reminder.day_today'), text: t('onboarding.trial_reminder.day_today_desc') },
        { day: t('onboarding.trial_reminder.day_2'), text: t('onboarding.trial_reminder.day_2_desc') },
        { day: t('onboarding.trial_reminder.day_3'), text: t('onboarding.trial_reminder.day_3_desc') },
    ];

    // label: 'SO FUNKTIONIERT ES' → t('onboarding.trial_reminder.label')
    // title: 'Keine versteckten Kosten.' → t('onboarding.trial_reminder.title')
    // note: 'Jederzeit...' → t('onboarding.trial_reminder.cancel_note')
```

- [ ] **Step 11: Update `app/components/onboarding/steps/what-you-will-get-step.tsx`**

Move `BENEFITS` inside the component, add `useTranslation`:

```tsx
import { useTranslation } from 'react-i18next';

export function WhatYouWillGetStep() {
    const { t } = useTranslation();

    const BENEFITS = [
        t('onboarding.what_you_get.benefit_1'),
        t('onboarding.what_you_get.benefit_2'),
        t('onboarding.what_you_get.benefit_3'),
        t('onboarding.what_you_get.benefit_4'),
        t('onboarding.what_you_get.benefit_5'),
    ];

    // title: 'Was dich erwartet' → t('onboarding.what_you_get.title')
```

- [ ] **Step 12: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/components/onboarding/steps/
git commit -m "feat: translate all onboarding step components"
```

---

## Task 9: Translate home.tsx and tutorial.tsx

**Files:**
- Modify: `app/app/home.tsx`
- Modify: `app/app/tutorial.tsx`

- [ ] **Step 1: Update `app/app/home.tsx`**

Add `useTranslation` import, replace 3 strings in the empty state:

```tsx
import { useTranslation } from 'react-i18next';

// Inside HomeScreen():
const { t } = useTranslation();

// Replace empty state:
<Text style={styles.emptyTitle}>{t('home.empty_title')}</Text>
<Text style={styles.emptySubtitle}>{t('home.empty_subtitle_pre')}{' '}
    <Text style={styles.emptyAccent}>+</Text>
    {' '}{t('home.empty_subtitle_post')}
</Text>
```

- [ ] **Step 2: Update `app/app/tutorial.tsx`**

No user-visible strings in tutorial.tsx itself — it uses mock data constants (`DUMMY_PHRASE`, `DUMMY_CATEGORY`). These are placeholder data for the tutorial, not UI strings. Leave as-is.

- [ ] **Step 3: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/home.tsx app/app/tutorial.tsx
git commit -m "feat: translate home screen"
```

---

## Task 10: Translate settings.tsx + Language Picker Row

**Files:** Modify: `app/app/settings.tsx`

- [ ] **Step 1: Replace `app/app/settings.tsx`**

Add `useTranslation`, `changeLanguage` import. Replace all German strings. Add a language row to settings. The language row shows the current language with flag and opens an `Alert` to switch.

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserPhotoIcon from '@/assets/icons/user_square.svg';
import { BirthdayPickerModal } from '@/components/modals/BirthdayPickerModal';
import { EditFieldModal } from '@/components/modals/EditFieldModal';
import { NotificationSettingsModal } from '@/components/modals/NotificationSettingsModal';
import { Colors, Fonts } from '@/constants/theme';
import { changeLanguage } from '@/i18n';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { calculateAge } from '@/types/user-data';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const name = useUserDataStore((s) => s.name);
    const birthday = useUserDataStore((s) => s.birthday);
    const haptics = useUserDataStore((s) => s.haptics);
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    const { hasEntitlement } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();
    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    const [editField, setEditField] = useState<'name' | 'birthday' | null>(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    const ageDisplay = birthday
        ? (() => {
            const [y, m, d] = birthday.split('-');
            return `${d}.${m}.${y} (${calculateAge(birthday)})`;
        })()
        : '—';

    const currentLang = i18n.language as 'de' | 'en';
    const langDisplay = currentLang === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English';

    function handleLanguagePicker() {
        Alert.alert(
            t('settings.row_language'),
            undefined,
            [
                { text: '🇩🇪 Deutsch', onPress: () => { changeLanguage('de'); updateSettings({ language: 'de' }); } },
                { text: '🇬🇧 English', onPress: () => { changeLanguage('en'); updateSettings({ language: 'en' }); } },
                { text: currentLang === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
            ]
        );
    }

    const LEGAL_ROWS = [
        { label: t('settings.legal_terms'), url: 'https://northbyte.studio/terms-of-use/veezy' },
        { label: t('settings.legal_privacy'), url: 'https://northbyte.studio/privacy-policy/veezy' },
    ];

    const settingsRows = [
        { label: t('settings.row_name'), value: name || '—', onPress: () => setEditField('name') },
        { label: t('settings.row_birthday'), value: ageDisplay, onPress: () => setEditField('birthday') },
        { label: t('settings.row_notifications'), value: undefined, onPress: () => setShowNotificationModal(true) },
        { label: t('settings.row_subscription'), value: undefined, onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') },
        { label: t('settings.row_tutorial'), value: undefined, onPress: () => router.replace('/tutorial') },
        { label: t('settings.row_request_feature'), value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/features/veezy') },
        { label: t('settings.row_report_bug'), value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/bugs/veezy') },
        { label: t('settings.row_language'), value: langDisplay, onPress: handleLanguagePicker },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.appTitle}>veezy</Text>

                <TouchableOpacity style={styles.selfReferenceCard} onPress={() => router.push('/edit-self-reference')} activeOpacity={0.75}>
                    <View style={styles.selfReferenceLeft}>
                        <UserPhotoIcon width={24} height={24} color={Colors.textHeadline} />
                        <View style={styles.selfReferenceText}>
                            <Text style={styles.selfReferenceTitle}>{t('settings.self_reference_title')}</Text>
                            <Text style={styles.selfReferenceSubtitle}>{t('settings.self_reference_subtitle')}</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                </TouchableOpacity>

                {!isPremium && (
                    <TouchableOpacity style={styles.premiumCard} activeOpacity={0.85} onPress={() => openWithPlacement('add_premium_settings')}>
                        <View style={styles.premiumLeft}>
                            <View style={styles.premiumIconBadge}>
                                <MaterialCommunityIcons name="crown" size={20} color={Colors.accent} />
                            </View>
                            <View>
                                <Text style={styles.premiumTitle}>{t('settings.premium_title')}</Text>
                                <Text style={styles.premiumSubtitle}>{t('settings.premium_subtitle')}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                )}

                <Text style={styles.sectionLabel}>{t('settings.section_settings')}</Text>
                <View style={styles.rowGroup}>
                    {settingsRows.map((row, i) => (
                        <TouchableOpacity
                            key={row.label}
                            style={[styles.row, styles.rowBorder]}
                            onPress={row.onPress}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <View style={styles.rowRight}>
                                {row.value !== undefined && (
                                    <Text style={styles.rowValue}>{row.value}</Text>
                                )}
                                <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                            </View>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>{t('settings.row_haptics')}</Text>
                        <Switch
                            value={haptics}
                            onValueChange={(v) => updateSettings({ haptics: v })}
                            trackColor={{ false: Colors.borderDivider, true: Colors.accent }}
                            thumbColor="white"
                        />
                    </View>
                </View>

                <Text style={styles.sectionLabel}>{t('settings.section_legal')}</Text>
                <View style={styles.rowGroup}>
                    {LEGAL_ROWS.map((row, i) => (
                        <TouchableOpacity
                            key={row.label}
                            style={[styles.row, i < LEGAL_ROWS.length - 1 && styles.rowBorder]}
                            onPress={() => WebBrowser.openBrowserAsync(row.url)}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <EditFieldModal
                visible={editField === 'name'}
                title={t('settings.edit_name_title')}
                type="text"
                placeholder={t('settings.edit_name_placeholder')}
                value={name}
                onSave={(v) => updateSettings({ name: v })}
                onClose={() => setEditField(null)}
            />
            <BirthdayPickerModal
                visible={editField === 'birthday'}
                value={birthday}
                onSave={(iso) => updateSettings({ birthday: iso })}
                onClose={() => setEditField(null)}
            />
            <NotificationSettingsModal
                visible={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
            />
        </View>
    );
}

// All styles unchanged from original
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/settings.tsx
git commit -m "feat: translate settings.tsx and add language picker row"
```

---

## Task 11: Translate vision/add.tsx and VisionActionsModal

**Files:**
- Modify: `app/app/vision/add.tsx`
- Modify: `app/components/modals/VisionActionsModal.tsx`

- [ ] **Step 1: Update `app/app/vision/add.tsx`**

Add `useTranslation` import and replace strings:

```tsx
import { useTranslation } from 'react-i18next';

// Inside AddVisionScreen():
const { t } = useTranslation();

// Replace:
// 'Beschreibe deine Vision' → t('vision.add.headline')
// 'Ein Haus am Meer...' → t('vision.add.placeholder')
// 'Etwas ist schiefgelaufen...' → t('vision.add.error')
// 'In Instagram Story teilen' → t('vision.add.share_instagram')
// 'Teilen' → t('vision.add.share')
// 'Neu generieren' → t('vision.add.regenerate')
```

- [ ] **Step 2: Update `app/components/modals/VisionActionsModal.tsx`**

Add `useTranslation` import and replace all German strings in the modal:

```tsx
import { useTranslation } from 'react-i18next';

// Inside VisionActionsModal():
const { t } = useTranslation();

// Replace all German strings using vision.actions.* keys
// Modal title: t('vision.actions.title')
// Share labels: t('vision.actions.share_instagram') / t('vision.actions.share')
// Edit phrase: t('vision.actions.edit_phrase')
// Regenerate: t('vision.actions.regenerate')
// Delete: t('vision.actions.delete')
// Alert texts for delete and regenerate confirmation: use the vision.actions.*_confirm_* keys
// Error alert: t('vision.actions.regen_error')
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/app/vision/add.tsx app/components/modals/VisionActionsModal.tsx
git commit -m "feat: translate vision add screen and actions modal"
```

---

## Task 12: Backend — Pass Language to Generate/Regenerate

**Files:**
- Modify: `app/utils/generateVision.ts`
- Modify: `backend/src/routes/vision-route.ts`
- Modify: `backend/src/prompts/phrase.ts`
- Modify: `backend/src/prompts/generate-scene.ts`

- [ ] **Step 1: Update `app/utils/generateVision.ts`**

Add `language` param to both functions, pass to body:

```ts
export async function generateVision(
    description: string,
    userId: string,
    existingPhrases?: string[],
    motivationStyle?: string,
    language: 'de' | 'en' = 'en',
): Promise<GenerateVisionResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-rc-user-id': userId },
        body: JSON.stringify({ visionDescription: description, existingPhrases, motivationStyle, language }),
    });
    // ... rest unchanged
}

export async function regenerateVision(
    visionId: string,
    description: string,
    userId: string,
    existingPhrases?: string[],
    language: 'de' | 'en' = 'en',
): Promise<RegenerateVisionResult> {
    const response = await fetch(`${BACKEND_URL}/vision/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-rc-user-id': userId },
        body: JSON.stringify({ visionId, visionDescription: description, existingPhrases, language }),
    });
    // ... rest unchanged
}
```

- [ ] **Step 2: Pass language when calling `generateVision` in `app/app/vision/add.tsx` and `app/components/onboarding/steps/vision-generation-step.tsx`**

In `add.tsx`:
```ts
const language = useUserDataStore((s) => s.language);
// ...
const generated = await generateVision(description.trim(), userId, existingPhrases, motivationStyle, language);
// regenerate:
const generated = await regenerateVision(savedVisionId, description.trim(), userId, existingPhrases, language);
```

In `vision-generation-step.tsx`:
```ts
const { userId, motivationStyle, language } = useUserDataStore.getState();
const generated = await generateVision(visionDescription, userId, existingPhrases, motivationStyle, language);
```

In `VisionActionsModal.tsx`:
```ts
const language = useUserDataStore((s) => s.language);
// ...
const generated = await regenerateVision(vision.id, prompt.trim() || vision.phrase, userId, existingPhrases, language);
```

- [ ] **Step 3: Update `backend/src/routes/vision-route.ts`**

Read `language` from body, pass to `generatePhraseAndAffirmations` and `generateSceneDescription`. Both `/generate` and `/regenerate` routes.

In `/generate`:
```ts
const { visionDescription, existingPhrases, motivationStyle, language } = await c.req.json();
const lang = language === 'de' ? 'de' : 'en';

const phrasePromise = generatePhraseAndAffirmations(visionDescription, lang);
// in imagePipeline:
const sceneDesc = await generateSceneDescription(personDesc, visionDescription, existingPhrases, lang);
```

In `/regenerate`:
```ts
const { visionId, visionDescription, existingPhrases, language } = await c.req.json();
const lang = language === 'de' ? 'de' : 'en';
const sceneDesc = await generateSceneDescription(personDesc, visionDescription, existingPhrases, lang);
```

- [ ] **Step 4: Update `backend/src/prompts/phrase.ts`**

Add `language: 'de' | 'en'` param to `generatePhraseAndAffirmations`, `generatePhraseAndCategory`, `generateAffirmationsForStyle`. Append language instruction to each system prompt string at call time:

```ts
async function generatePhraseAndCategory(description: string, language: 'de' | 'en'): Promise<{ phrase: string; category: Category }> {
    const systemPrompt = SYSTEM_PROMPT_PHRASE + `\n\nRespond in ${language === 'de' ? 'German' : 'English'}.`;
    // ... rest unchanged
}

async function generateAffirmationsForStyle(description: string, style: 'affirmation' | 'fuel', language: 'de' | 'en'): Promise<string[]> {
    const base = style === 'fuel' ? SYSTEM_PROMPT_FUEL : SYSTEM_PROMPT_AFFIRMATION;
    const systemPrompt = base + `\n\nRespond in ${language === 'de' ? 'German' : 'English'}.`;
    // ... rest unchanged
}

export async function generatePhraseAndAffirmations(description: string, language: 'de' | 'en' = 'en'): Promise<BothPhrasesResult> {
    const [phraseAndCat, affirmationResult, fuelResult] = await Promise.all([
        generatePhraseAndCategory(description, language),
        generateAffirmationsForStyle(description, 'affirmation', language),
        generateAffirmationsForStyle(description, 'fuel', language),
    ]);
    // ... return unchanged
}
```

- [ ] **Step 5: Update `backend/src/prompts/generate-scene.ts`**

Add `language` param and append to system prompt:

```ts
export async function generateSceneDescription(
    personDescription: string,
    goal: string,
    existingPhrases?: string[],
    language: 'de' | 'en' = 'en',
): Promise<string> {
    const systemPromptWithLang = SYSTEM_PROMPT + `\n\nWrite the scene description in ${language === 'de' ? 'German' : 'English'}.`;
    // ... use systemPromptWithLang instead of SYSTEM_PROMPT in the messages array
```

- [ ] **Step 6: Commit**

```bash
cd /Users/leonardogranetto/Projects/veezy && git add app/utils/generateVision.ts app/app/vision/add.tsx app/components/onboarding/steps/vision-generation-step.tsx app/components/modals/VisionActionsModal.tsx backend/src/routes/vision-route.ts backend/src/prompts/phrase.ts backend/src/prompts/generate-scene.ts
git commit -m "feat: pass user language to backend for localized AI output"
```

---

## Self-Review

**Spec coverage check:**
- ✅ i18next + react-i18next installed (Task 1)
- ✅ en.ts + de.ts created with all strings (Task 2)
- ✅ `language` in UserData + UserDataStore (Task 3)
- ✅ i18n initialized at app start with persisted/detected language (Task 4)
- ✅ TrackingStep component (Task 5)
- ✅ start.tsx flag picker (Task 6)
- ✅ onboarding.tsx updated (Task 7)
- ✅ All 11 step components translated (Task 8)
- ✅ home.tsx translated (Task 9)
- ✅ settings.tsx + language picker row (Task 10)
- ✅ vision/add.tsx + VisionActionsModal (Task 11)
- ✅ Backend language propagation (Task 12)

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `generatePhraseAndAffirmations(description, lang)` — signature matches all call sites
- `generateSceneDescription(personDesc, goal, existingPhrases, lang)` — matches both route usages
- `generateVision(..., language)` — matches all call sites in add.tsx, vision-generation-step.tsx
- `regenerateVision(..., language)` — matches call sites in add.tsx, VisionActionsModal.tsx
- `AppLanguage = 'de' | 'en'` — used consistently across i18n/index.ts, UserData, UserDataStore
