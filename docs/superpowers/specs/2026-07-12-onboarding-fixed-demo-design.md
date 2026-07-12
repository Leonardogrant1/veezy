# Onboarding ohne Live-Generierung (Fixed-Demo-Flow)

**Datum:** 2026-07-12
**Status:** Approved (Design)

## Ziel

Die Live-AI-Generierung wird aus dem Onboarding entfernt. Stattdessen zeigt das Onboarding einen komplett vorgegebenen Demo-Flow (fixe Figur, fixe Vision, fixes Visionsbild, fixe Notification-Inhalte), damit der User das Produktprinzip versteht — und mündet wie bisher in die Paywall (Superwall-Placement). Der User startet nach dem Onboarding leer und erstellt Figur + echte Vision über den bestehenden In-App-Flow (async Generierung).

## Neuer Step-Flow (12 statt 16 Steps)

| # | Step | Änderung |
|---|------|----------|
| 1 | Hook (Emotion-Slide) | unverändert |
| 2 | Tracking-Consent (`tracking-step.tsx`) | unverändert |
| 3 | Name (`name-step.tsx`) | unverändert |
| 4 | Identity-Shift-Slide | unverändert |
| 5 | Micro-Logic-Slide | unverändert |
| 6 | **NEU: Demo-Generierung** (`demo-generation-step.tsx`) | ersetzt die 5 entfernten Steps |
| 7 | Companion-Slide | unverändert |
| 8 | Notification-Setup (`notification-setup-step.tsx`) | UI/Logik unverändert, Inhalte fix |
| 9 | Widget (`add-widget-step.tsx`) | unverändert |
| 10 | Trial-Offer (`trial-offer-step.tsx`) | unverändert |
| 11 | Trial-Reminder (`trial-reminder-step.tsx`) | unverändert |
| 12 | What-you-will-get (`what-you-will-get-step.tsx`) | unverändert |
| Ende | Superwall-Placement `onboarding_completed` | unverändert |

### Entfernte Steps

- `vision-step.tsx` (Vision-Texteingabe)
- `photo-bridge-step.tsx`
- `photo-upload-step.tsx` (5 Selfie-Slots)
- `vision-generation-step.tsx` (sync `/vision/generate`-Call)
- `vision-reaction-step.tsx` (inkl. App-Store-Review-Trigger — fällt bewusst aus dem Onboarding raus)

Damit entfallen alle Netzwerk-Calls im Onboarding: kein `/vision/generate` (sync), kein `/self-reference/presign` / `/self-reference/composite`. Die zugehörigen Handler in `app/app/onboarding.tsx` (Foto-Upload, Composite, handleGenerate) werden entfernt.

## Neuer Demo-Step: Simulierte Generierung

Ein Step (`demo-generation-step.tsx`), drei animierte Phasen, rein lokal — keine Netzwerk-Calls, deterministisch:

1. **Fotos:** 5 Beispiel-Foto-Kacheln erscheinen nacheinander („So entsteht deine Figur aus deinen Fotos")
2. **Figur:** Kacheln ziehen sich zusammen, kurze Lade-Animation, Placeholder-Figurbild wird enthüllt
3. **Vision:** Fixer Visionstext blendet ein, Lade-Puls, dann Reveal des Placeholder-Visionsbilds mit fixer Phrase

**Copy-Framing:** Klar als Beispiel kennzeichnen („So funktioniert's" / Beispiel-Persona), nicht als „deine" Generierung — es darf nicht der Eindruck entstehen, dass gerade etwas Echtes generiert wurde. Der Continue-Button erscheint erst nach der Reveal-Phase.

**Assets:** Neuer Ordner `app/assets/onboarding-demo/` mit Placeholder-Bildern (Figur, Vision, 5 Foto-Kacheln). Fürs Visionsbild initial `app/assets/images/dummy-vision-image.jpg` wiederverwenden. Struktur so, dass finale Assets später nur ausgetauscht werden.

**Sprache:** Deutsch, konsistent mit den bestehenden Steps.

## Notification-Step

UI und Logik bleiben identisch: Frequenz 1–10, Zeitfenster (Start-/Endstunde), Affirmation/Fuel-Toggle, Permission-Anfrage und Test-Notification (Continue weiterhin bis zum Senden gesperrt). Einzige Änderung: Beispiel-/Test-Notification-Inhalte kommen aus fixen Konstanten (passend zur Demo-Vision, je Motivationsstil ein Set) statt aus generierten Affirmationen.

## Daten & Folgezustand

- `visionDescription` und `selfReferenceImages` (UserDataStore) werden im Onboarding nicht mehr gesetzt — der User startet leer.
- Notification-Einstellungen (`notificationsPerDay`, `notificationStartHour`, `notificationEndHour`, `motivationStyle`) werden weiterhin im Setup-Step gesetzt.
- `hasOnboarded` / `completeOnboarding()` und der Abschluss-Flow (Tracking-Event, Superwall-Placement, Redirect auf Home) bleiben unverändert.
- **Bei der Umsetzung zu verifizieren:** Home zeigt mit `hasOnboarded=true` und null Visionen einen sauberen Empty-State, der zur Figur-/Vision-Erstellung führt.
- Backend bleibt unangetastet; der Sync-Pfad von `/vision/generate` wird lediglich nicht mehr aus dem Onboarding aufgerufen.

## Nachtrag (2026-07-12, user-approved)

Das Final-Review fand eine Post-Onboarding-Sackgasse: Ohne Figur schlug `/vision/add` immer mit Backend-400 fehl. Fix: `/vision/add` zeigt ohne `selfReferenceImages` ein Figur-Gate (Erklärung + Button), das per `router.push` zu `edit-self-reference` führt; nach dem Speichern kehrt der User automatisch zurück und das Gate weicht reaktiv dem Eingabefeld.

## Fehlerbehandlung

Der Demo-Step hat keine Netzwerk-Calls und damit keine Fehlerpfade. Permission-Verweigerung im Notification-Step verhält sich wie bisher.

## Testing

Kein Netzwerk im neuen Step → manuell gut testbar. Verifikation: Onboarding komplett durchlaufen — Demo-Animation (alle 3 Phasen), Notification-Test mit fixem Inhalt, Paywall-Placement am Ende, Empty-State auf Home.
