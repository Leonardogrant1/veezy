# Affiliate-Code-Step im Onboarding — Design

**Datum:** 2026-08-11
**Status:** Approved

## Ziel

Der Onboarding-Flow von veezy bekommt einen optionalen Affiliate-Code-Step, funktional identisch zum `ReferralCodeStep` in jemp. Der Step callt denselben Endpoint (`https://www.northbyte.studio/api/affiliate/track`) und gibt den eingelösten Code am Paywall als Superwall-`promocode` weiter.

## Kontext

- jemp-Referenz: `jemp/components/onboarding/steps/referral-code-step.tsx`, Registrierung in `jemp/app/onboarding.tsx`, Superwall-Weitergabe in `jemp/components/onboarding/onboarding-progress-wrapper.tsx`.
- veezy hat kein Supabase und kein Convex im Client. Einzige User-Identität ist die RevenueCat-User-ID.
- veezy-Onboarding: geordnetes `ONBOARDING_STEPS`-Array in `app/app/onboarding.tsx`, gerendert von `OnboardingProgressWrapper`, Step-Steuerung über `useOnboardingControl()`.

## Komponenten

### 1. Step-Komponente `app/components/onboarding/steps/referral-code-step.tsx` (neu)

- UI nach dem Muster von `name-step.tsx`: zentrierter TextInput mit Keyboard-Avoid-Offset, Theme-Tokens aus `app/constants/theme.ts`.
- Verhalten wie jemp:
  - Input wird auto-uppercased; Tippen im Fehlerzustand setzt Status auf `idle` zurück.
  - Status-Maschine: `idle | loading | success | error_not_found | error_network`.
  - Eigener „Einlösen"-Button im Step (getrennt vom Continue-Button des Wrappers).
  - Bei Erfolg: Haken anzeigen, Keyboard dismiss, nach 600 ms automatisch `nextStep()`.
  - Bereits eingelöster Code (aus Store): Input nicht editierbar, Status fest auf `success`.
- Der Step ist optional: Registrierung mit `initialCanContinue: true`, Subtitle weist auf „Optional" hin.

### 2. Endpoint-Call

```ts
POST https://www.northbyte.studio/api/affiliate/track
Content-Type: application/json

{
  "appSlug": "veezy",
  "affiliateCode": "<code, getrimmt>",
  "appUserId": "<RevenueCat-User-ID>",
  "revenueCatUserId": "<RevenueCat-User-ID>",
  "environment": "SANDBOX" | "PRODUCTION"
}
```

- URL hardcoded (wie in jemp), kein Auth-Header.
- `appUserId` und `revenueCatUserId` sind beide `Purchases.getAppUserID()` (veezy hat keine separate App-User-ID).
- Response-Mapping: `201` → success; `404` → `error_not_found` („Code nicht gefunden"); alles andere sowie Netzwerk-Exceptions → `error_network`.

### 3. Build-Environment-Helper `app/utils/build-environment.ts` (neu, Port aus jemp)

`getBuildEnvironment()` liefert `'SANDBOX'` in Dev/TestFlight, sonst `'PRODUCTION'` — portiert aus `jemp/utils/build-environment.ts`, an veezys vorhandene Dependencies angepasst.

### 4. Persistenz

- Neues Feld `referralCode?: string` in `app/types/user-data.ts` und im `UserDataStore` (zustand + persist über MMKV).
- Bei Erfolg: `updateSettings({ referralCode: code })`. Kein Supabase-Write (anders als jemp — veezy hat kein Supabase).

### 5. Registrierung & Superwall-Weitergabe

- Neuer Eintrag im `ONBOARDING_STEPS`-Array in `app/app/onboarding.tsx` zwischen `Personalization` und `TrialOffer`, mit `initialCanContinue: true`.
- In `finishOnboarding()` (`app/components/onboarding/onboarding-progress-wrapper.tsx`): falls `referralCode` im `UserDataStore` gesetzt ist, wird er dem Superwall-Placement als `promocode`-Param mitgegeben (analog jemp `onboarding-progress-wrapper.tsx:100-102`).

### 6. i18n

Neue Keys unter `onboarding.referral_*` in `app/i18n/locales/en.ts` und `de.ts`: Titel, Subtitle („Optional — du kannst diesen Schritt überspringen"), Placeholder, Einlösen-Button, Erfolgs- und Fehlertexte (`code_not_found`, `network_error`).

## Fehlerbehandlung

- Kein Netz / Endpoint down: `error_network`, User kann erneut versuchen oder skippen — das Onboarding wird nie blockiert.
- Ungültiger Code: `error_not_found` mit klarer Meldung, Input bleibt editierbar.
- RevenueCat-ID nicht verfügbar (sollte nicht vorkommen): wie `error_network` behandeln.

## Testing

- Manuell im Dev-Build: gültiger Code (→ 201, Auto-Advance, Code im Store, promocode am Superwall-Placement), ungültiger Code (→ 404-Meldung), Flugmodus (→ Netzwerkfehler), Skip ohne Code, erneuter Besuch des Steps nach Einlösung (gesperrtes Input).
- `environment` muss im Dev-Build `SANDBOX` sein.

## Out of Scope

- Backend-Änderungen (der northbyte.studio-Endpoint existiert bereits und wird von jemp produktiv genutzt).
- Web-/Deep-Link-Attribution wie jemps `web/app/c/[code]`.
- Anzeige des Codes in den App-Settings.
