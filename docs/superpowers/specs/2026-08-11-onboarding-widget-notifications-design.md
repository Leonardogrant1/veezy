# Onboarding-Rework: Demo → Widget → Notifications

**Datum:** 2026-08-11
**Branch:** feature/update-check (Arbeitsstand; kein Commit ohne explizite Anweisung)
**Status:** Vom User freigegeben („mach das erstmal")

## Ziel

Der Onboarding-Flow ist nach der Demo zu schwach. Die Demo (Selfies → Vision → Loading → Beispielbild) bleibt erhalten und wird direkt um eine Widget-Erklärung erweitert (mit dem Demo-Bild im Widget-Mock), danach folgt eine Notification-Erklärung nach demselben Prinzip, dann das bestehende Notification-Setup.

## Neuer Step-Ablauf (`app/app/onboarding.tsx`)

1. HookSlide
2. TrackingStep (ATT)
3. NameStep
4. IdentityShiftSlide
5. MicroLogicSlide
6. **DemoGenerationStep** — erweitert um Phase `widget`
7. **NotificationExplainStep** — NEU
8. NotificationSetupStep (bestehend, unverändert)
9. TrialOfferStep
10. TrialReminderStep
11. WhatYouWillGetStep

Entfernt werden:
- **CompanionSlide** („We'll walk this path with you") — nur aus dem `ONBOARDING_STEPS`-Array (er wird via `makeEmotionSlide` inline erzeugt).
- **AddWidgetStep** — Eintrag aus dem Array und Datei `app/components/onboarding/steps/add-widget-step.tsx` löschen. Vorher prüfen, ob `assets/animations/widget.json` noch vom Tutorial oder anderswo referenziert wird; das Asset nur löschen, wenn keine Referenzen mehr existieren.

Progress-Bar: Segmentanzahl sinkt von 12 auf 11 (ergibt sich automatisch aus dem Array).

## Demo-Step: neue Phase `widget`

Datei: `app/components/onboarding/steps/demo-generation-step.tsx`

- `type Phase` wird um `'widget'` erweitert: `photos → typing → loading → result → widget`.
- Der Continue-Button der `result`-Phase wechselt zu Phase `widget` statt `nextStep()` aufzurufen.
- **Morph-Animation** (Reanimated, ~600 ms, ease-out): Das Vollbild-Visionbild (`assets/onboarding-demo/demo-vision.png`) schrumpft in einen Medium-Widget-Rahmen, der auf einem angedeuteten Homescreen sitzt.
- **Homescreen-Andeutung:** abgedunkelter/geblurrter Hintergrund, generische App-Icon-Platzhalter (graue Rounded Squares, keine echten App-Logos), Uhr/Statusleisten-Andeutung oben. Genug, um „Homescreen" zu lesen, ohne iOS-Assets nachzubauen.
- **Widget-Mock repliziert `VisionWidgetView`** (aus `app/targets/widget/widgets.swift`): Bild als Hintergrund, Gradient unten, goldenes Kategorie-Label (`onboarding.demo.category`), Serif-Phrase (`onboarding.demo.phrase`). Der User sieht exakt das, was er später bekommt.
- Text: Badge + Titel + Subline im Stil der anderen Demo-Phasen (`onboarding.demo.widget_badge`, `onboarding.demo.widget_title` „Deine Vision — direkt auf deinem Homescreen", `onboarding.demo.widget_subtitle` „Jeden Tag, bei jedem Blick aufs Handy").
- Continue → `nextStep()` (verlässt den Demo-Step).

## Neu: NotificationExplainStep

Datei: `app/components/onboarding/steps/notification-explain-step.tsx`

- Dunkles Theme (wie Demo-Step) für visuelle Kontinuität.
- **Lockscreen-Mock:** abgedunkeltes Demo-Visionbild als Wallpaper, darauf eine nachgebaute iOS-Notification-Banner-Karte (App-Icon, „Veezy", Demo-Phrase als Text), die von oben hereinslidet und danach dezent pulsiert.
- Texte: `onboarding.notification_explain.title` „Wir erinnern dich an deine Vision", `onboarding.notification_explain.subtitle` „Kleine Impulse über den Tag verteilt, wann es dir passt." (+ Banner-Mock-Texte).
- **Kein Permission-Request** auf diesem Screen — nur Wert zeigen. Continue → NotificationSetupStep (dort wie bisher Frequenz/Zeitfenster/Stil + Test-Notification, die die Permission triggert).

## i18n

- Neue Keys in `app/i18n/locales/en.ts` und `de.ts` (flache Dot-Keys):
  - `onboarding.demo.widget_badge`, `onboarding.demo.widget_title`, `onboarding.demo.widget_subtitle`
  - `onboarding.notification_explain.title`, `onboarding.notification_explain.subtitle`
  - Der Banner-Mock braucht keine neuen Keys: App-Name „Veezy" ist statisch, der Text ist die bestehende `onboarding.demo.phrase`.
- Alte Keys von CompanionSlide (`onboarding.companion.*`) und AddWidgetStep (`onboarding.widget.*`) werden entfernt (eindeutig ersetzt). Achtung: `tutorial.widget.*` gehört zum Tutorial und bleibt.

## Analytics & Verhalten

- `onboarding_step`-Events laufen über den Wrapper automatisch weiter.
- Innerhalb des Demo-Steps: Widget-Phase als Event tracken, falls die bestehenden Phase-Wechsel bereits getrackt werden — sonst weglassen (kein neues Tracking-Muster einführen).
- Keine Änderung an Persistenz (`hasOnboarded`), Superwall-Placement `onboarding_completed` oder Tutorial.

## Testen

Manuell im iOS-Simulator: kompletter Onboarding-Durchlauf in DE und EN, Morph-Animation, Notification-Mock-Animation, danach echter Setup-Step inkl. Test-Notification. Dev-Panel „Skip to Home" bleibt als Fallback.
