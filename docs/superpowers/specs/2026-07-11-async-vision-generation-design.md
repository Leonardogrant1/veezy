# Async Vision Generation mit Push-Notification — Design

**Datum:** 2026-07-11
**Status:** Vom User freigegeben

## Ziel

Die Bildgenerierung (gpt-image-2, `quality: high`, 30–90s) blockiert aktuell den Request und damit den User. Künftig läuft sie im Hintergrund: Der User bekommt sofort die Phrase und einen Pending-Platzhalter im Feed, das fertige Bild kommt per Push-Notification und/oder Polling. Gilt für **neue Visions und Regenerate** (add-Screen + VisionActionsModal). **Das Onboarding bleibt synchron** (wird in naher Zukunft separat umgestellt).

## Architektur-Entscheidung: Self-Call-Worker

Das Backend läuft auf Cloud Run (`min-instances: 0`, CPU nur während Requests). Hintergrundarbeit nach der Response wird gedrosselt — deshalb feuert der Endpoint einen **nicht-awaiteten HTTP-Request auf den eigenen Service** (`/vision/worker`). Der Worker arbeitet in seinem eigenen Request mit voller CPU; das 300s-Timeout reicht. Kein Cloud-Tasks-Setup, keine Config-Änderung. Bewusst akzeptiert: kein automatischer Retry bei Worker-Absturz (Abfangnetz: client-seitiger Timeout, s. Fehlerfälle).

- Worker-URL: Origin aus dem eingehenden Request (`new URL(c.req.url).origin`).
- Absicherung: Header `x-internal-secret` gegen Env `INTERNAL_WORKER_SECRET` (neu, muss beim Deploy gesetzt werden). Ohne/mit falschem Secret: 401.

## Backend (`backend/src/`)

### R2-Keys (neu)
- `vision-status/<userId>/<visionId>` — JSON `{ "status": "pending" | "done" | "failed" }`
- `user-data/<userId>/push-token` — Expo-Push-Token als Plaintext

### `POST /vision/generate` (umgebaut)
1. Validierung, Generation-Count-Check, Composite-Check (wie bisher, alles vor der Response).
2. Body-Flag `sync?: boolean`: Wenn `true` (nur Onboarding), läuft der komplette bisherige synchrone Flow unverändert ab — Response wie heute inkl. `signedUrl`.
3. Async-Fall (Default): Phrase + Affirmationen **synchron** generieren, `visionId` erzeugen, Status `pending` nach R2 schreiben, Worker-Call feuern (fire-and-forget, `.catch` → Status `failed`).
4. Response: `{ visionId, phrase, category, affirmationsAffirmation, affirmationsFuel, status: 'pending' }` — kein `signedUrl`.
5. Generation-Abzug erfolgt beim Dispatch (verhindert, dass parallele Dispatches das Kontingent überziehen); alle Fehlerpfade (Worker-Fehler, Self-Call-Fehler) erstatten den Credit über `refundGeneration`.

### `POST /vision/regenerate` (umgebaut)
Wie generate, aber ohne Phrase-Schritt: Validierung + Checks, Status `pending`, Worker-Call, Response `{ visionId, status: 'pending' }`. Kein `sync`-Flag nötig (Onboarding regeneriert nicht).

### `POST /vision/worker` (neu, intern)
Auth: nur `x-internal-secret`. Body: `{ userId, visionId, visionDescription, existingPhrases?, language }`.
1. Composite + gecachte Personenbeschreibung laden (lazy-describe-Fallback wie bisher).
2. Szenenbeschreibung → `generateImage()` → Upload nach `vision-images/<userId>/<visionId>`.
3. Status → `done`, Push senden: Titel/Body lokalisiert nach `language` (de: „Deine Vision ist fertig ✨" / en: "Your vision is ready ✨"), `data: { visionId }`. (Abzug ist bereits beim Dispatch erfolgt.)
4. Bei Fehler: Status → `failed`, Credit-Rückerstattung via `refundGeneration`, Push (de: „Deine Vision konnte nicht erstellt werden — versuch es nochmal" / en: "Your vision couldn't be created — please try again").
5. Kein Push-Token vorhanden → Schritte laufen normal, Push wird einfach übersprungen.

### `GET /vision/status?visionId=` (neu)
Auth: `revenuecatAuth`. Liest den Status-Key. Response: `{ status }`; bei `done` zusätzlich `{ signedUrl, imageKey }`. Unbekannte visionId → 404.

### `PUT /user-data/push-token` (neu)
Auth: `revenuecatAuth`. Body `{ token: string }` → speichert unter `user-data/<userId>/push-token`. Leerer/fehlender Token → 400.

### `lib/expo/push.ts` (neu)
`sendPushNotification(token: string, message: { title: string; body: string; data?: Record<string, string> })` → POST `https://exp.host/--/api/v2/push/send`. Fehler werden geloggt, nie geworfen (Push ist best-effort).

## App (`app/`)

### Datenmodell
- `types/vision.ts`: `Vision` bekommt `status?: 'pending' | 'ready' | 'failed'` und `pendingSince?: number` (Timestamp für Client-Timeout). Fehlendes Feld = `ready` (Bestandsdaten).
- `stores/UserDataStore.ts`: neues Feld `lastSentPushToken: string | null` + Setter (verhindert redundante Token-Uploads).

### `utils/generateVision.ts`
- `generateVision(...)`: Response ohne Bild — Rückgabe `{ visionId, phrase, category, affirmations… }`.
- `regenerateVision(...)`: Rückgabe `{ visionId }`.
- Neu: `fetchVisionStatus(visionId, userId)` → `{ status, signedUrl?, imageKey? }`.
- Neu (nur Onboarding): `generateVisionSync(...)` — wie bisher, setzt `sync: true` im Body; `vision-generation-step.tsx` wird auf diese Funktion umgestellt, sonst unverändert.

### `app/vision/add.tsx`
- `handleGenerate`: nach der Response `addVision({ …, imagePath: null, status: 'pending', pendingSince: Date.now() })`, Tracking wie bisher, dann `router.back()` — Loading-/Preview-Stufe entfällt in diesem Flow.
- `handleRegenerate` (und `VisionActionsModal`): Vision im Store auf `status: 'pending'` setzen (altes Bild bleibt), Modal/Screen schließen.

### `components/layout/VisionSlide.tsx`
- `pending` ohne `imagePath`: Platzhalter mit `GlowPulse` + Text „Dein Bild wird erstellt…" (i18n).
- `pending` mit `imagePath` (Regenerate): altes Bild + halbtransparentes Spinner-Overlay.
- `failed`: Platzhalter mit Retry-Hinweis; Tap öffnet das VisionActionsModal (Regenerate).

### `services/pending-vision-watcher.ts` (neu)
- Läuft, solange mindestens eine Vision `pending` ist: alle 10s `fetchVisionStatus` pro pending Vision.
- `done` → `MediaHandler.saveFromRemote(signedUrl, imageKey)`, `updateImage`, `status: 'ready'`, `WidgetBridge` aktualisieren, `refreshGenerationCount`.
- `failed` → `status: 'failed'`.
- Client-Timeout: `pending` älter als 5 Minuten → lokal `failed` (fängt Worker-Abstürze ohne Status-Update ab).
- Trigger: App-Start, `AppState`-Wechsel auf `active` (Foreground-Fetch), Foreground-Push-Empfang — jeweils sofortiger Poll außerhalb des 10s-Takts.

### Push-Integration
- `utils/register-push-notifications.ts`: `getExpoPushTokenAsync({ projectId })` mit `projectId` aus `Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId` (wie im Referenz-Code; nötig für Dev-Builds), inkl. try/catch-Fallback.
- Token-Upload: nach erteilter Permission (Onboarding-`NotificationSetupStep` und App-Start, falls Permission schon granted): Token holen, mit `lastSentPushToken` vergleichen, bei Änderung `PUT /user-data/push-token`.
- `app/_layout.tsx`: Response-Listener liest `data.visionId` → `router.push('/home')` + Feed scrollt zur Vision (`VisionStore`: neues Feld `focusVisionId`, das `home.tsx` konsumiert und zurücksetzt). Received-Listener (Foreground) → sofortiger Watcher-Poll.

## Fehlerfälle (Zusammenfassung)
- Worker-Fehler → Status `failed` + Fehler-Push, kein Generation-Abzug, VisionSlide zeigt Retry.
- Worker-Absturz ohne Status → Client-Timeout nach 5 min → `failed`.
- Push abgelehnt/kein Token → Polling + Foreground-Fetch decken alles ab.
- Status-Endpoint-Fehler beim Polling → still ignorieren, nächster Tick.

## Nicht im Scope
- Onboarding-Umstellung auf async (explizit später; `sync: true`-Flag ist die Übergangslösung).
- Retry-Queue/Cloud Tasks.
- Mehrere gleichzeitige Pending-Visions sind erlaubt, aber es gibt keine Priorisierung/Begrenzung.

## Verifikation
- `npx tsc --noEmit` in `backend/` und `app/` ohne neue Fehler.
- Manuell: Vision erstellen → Feed zeigt Pending-Platzhalter → Push kommt → Tap scrollt zur Vision; App im Foreground → Bild erscheint über Polling; Regenerate → altes Bild + Spinner → neues Bild; Worker-Secret falsch → 401.
