# Async Vision Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bildgenerierung läuft im Hintergrund (Self-Call-Worker auf Cloud Run); der User bekommt die Phrase sofort, einen Pending-Platzhalter im Feed und eine Push-Notification, wenn das Bild fertig ist.

**Architecture:** `/vision/generate` generiert die Phrase synchron, schreibt einen Status-Key nach R2 und feuert einen nicht-awaiteten HTTP-Call auf `/vision/worker` (gleicher Service, Shared Secret). Der Worker generiert das Bild in seinem eigenen Request, setzt den Status und sendet die Push über die Expo Push API. Die App zeigt Pending-Visions als Platzhalter, pollt `/vision/status` alle 10s (plus sofort bei App-Start/Foreground/Push) und lädt das fertige Bild über den bestehenden Signed-URL-Mechanismus.

**Tech Stack:** Hono + R2 auf Cloud Run (Backend, ESM mit `@/`-Alias und `.js`-Suffixen), Expo/React Native + zustand/persist + expo-notifications (App).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-async-vision-generation-design.md`
- Onboarding bleibt synchron: `vision-generation-step.tsx` nutzt den Body-Flag `sync: true` — der komplette bisherige Sync-Flow in `/vision/generate` muss erhalten bleiben.
- Kein Test-Framework. Verifikation: `npx tsc --noEmit` in `backend/` bzw. `app/` — KEINE neuen Fehler. Vorbestehend: `backend/test-scripts/test-phrase.ts` (3 Fehler); `app/`: `components/parallax-scroll-view.tsx`, `components/ui/*`, `hooks/use-theme-color.ts`.
- Branch `feat/async-vision-generation` (existiert). Zwei Commit-Einheiten: Backend (nach Task 3), App (nach Task 10). WICHTIG: Nur die im Commit-Step genannten Dateien stagen — NIEMALS `git add -A`/`git add .` (der Working Tree enthält unabhängige uncommittete Änderungen: home.tsx, start.tsx, package-Dateien, Prompt-Dateien in backend/src/lib).
- Neue Env-Var `INTERNAL_WORKER_SECRET` (Backend). Ohne sie wirft der Async-Pfad — im Sync-Pfad (`sync: true`) darf sie NICHT benötigt werden.
- R2-Keys exakt: `vision-status/<userId>/<visionId>` (JSON `{"status":"pending"|"done"|"failed"}`), `user-data/<userId>/push-token` (Plaintext), Bild weiterhin `vision-images/<userId>/<visionId>`.
- Push-Texte verbatim: Erfolg de „Deine Vision ist fertig ✨" / en "Your vision is ready ✨" (Body de „Schau sie dir jetzt an." / en "Take a look now."); Fehler de „Deine Vision konnte nicht erstellt werden — versuch es nochmal" / en "Your vision couldn't be created — please try again". Push-`data` enthält immer `{ visionId }`.
- Client-Timeout für Pending: 5 Minuten; Poll-Intervall: 10 Sekunden.

---

### Task 1: Backend — Expo-Push-Sender

**Files:**
- Create: `backend/src/lib/expo/push.ts`

**Interfaces:**
- Produces: `sendPushNotification(token: string, message: { title: string; body: string; data?: Record<string, string> }): Promise<void>` — wirft NIE (best-effort, Fehler werden geloggt). Task 3 ruft sie im Worker auf.

- [ ] **Step 1: Datei anlegen**

```ts
import { logger } from '@/utils/logger.js';

export interface PushMessage {
    title: string;
    body: string;
    data?: Record<string, string>;
}

export async function sendPushNotification(token: string, message: PushMessage): Promise<void> {
    try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: token,
                sound: 'default',
                title: message.title,
                body: message.body,
                data: message.data ?? {},
            }),
        });
        if (!res.ok) {
            logger.warn({ status: res.status, body: await res.text() }, 'Expo push send failed');
        }
    } catch (err: any) {
        logger.warn({ err: err.message }, 'Expo push send error');
    }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit 2>&1 | grep -v test-phrase`
Expected: keine Ausgabe. Commit erst am Ende von Task 3.

### Task 2: Backend — Push-Token-Endpoint

**Files:**
- Modify: `backend/src/routes/user-data-route.ts` (neuer Handler vor `export default`)

**Interfaces:**
- Consumes: `R2Storage.uploadBuffer(key, buffer, contentType)` (bestehend), `revenuecatAuth` (bestehend).
- Produces: `PUT /user-data/push-token`, Body `{ token: string }` → 200 `{ ok: true }`; fehlender/leerer Token → 400. Speichert unter `user-data/<userId>/push-token`. App-Task 9 ruft das auf; Task 3 (Worker) liest den Key.

- [ ] **Step 1: Handler einfügen**

In `backend/src/routes/user-data-route.ts` direkt vor `export default userDataRoute;` einfügen:

```ts
userDataRoute.put('/push-token', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const body = await c.req.json<{ token?: unknown }>().catch(() => ({ token: undefined }));
    const token = body.token;
    if (!token || typeof token !== 'string') {
        return c.json({ error: 'token is required' }, 400);
    }
    await R2Storage.uploadBuffer(
        `user-data/${userId}/push-token`,
        Buffer.from(token, 'utf8'),
        'text/plain',
    );
    return c.json({ ok: true });
});
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit 2>&1 | grep -v test-phrase`
Expected: keine Ausgabe.

### Task 3: Backend — vision-route: async generate/regenerate, Worker, Status

**Files:**
- Modify: `backend/src/routes/vision-route.ts` (kompletter Ersatz)

**Interfaces:**
- Consumes: `sendPushNotification` aus Task 1; Push-Token-Key aus Task 2; bestehend: `generateImage`, `generatePhraseAndAffirmations`, `generateSceneDescription`, `describePersonFromImages`, `R2Storage`, `ensureGenerationCount`, `deductGeneration`, `getSelfReferenceKey`.
- Produces (App-Tasks 5–7 verlassen sich exakt hierauf):
  - `POST /vision/generate` Body `{ visionDescription, existingPhrases?, motivationStyle?, language?, sync?: boolean }`. `sync: true` → Response wie bisher (`{ phrase, category, affirmationsAffirmation, affirmationsFuel, signedUrl, imageKey, visionId }`). Sonst → `{ visionId, phrase, category, affirmationsAffirmation, affirmationsFuel, status: 'pending' }`.
  - `POST /vision/regenerate` → `{ visionId, status: 'pending' }`.
  - `GET /vision/status?visionId=` → `{ status: 'pending' | 'failed' }` bzw. `{ status: 'done', signedUrl, imageKey }`; unbekannte ID → 404.
  - `POST /vision/worker` (intern): Header `x-internal-secret` muss `INTERNAL_WORKER_SECRET` entsprechen, sonst 401.

- [ ] **Step 1: Datei komplett ersetzen**

Kompletter neuer Inhalt von `backend/src/routes/vision-route.ts`:

```ts
import { sendPushNotification } from '@/lib/expo/push.js';
import { generateImage } from '@/lib/images/generate-image.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { deductGeneration, ensureGenerationCount } from '@/lib/revenuecat/generations.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { describePersonFromImages } from '@/prompts/describe-person.js';
import { generateSceneDescription } from '@/prompts/generate-scene.js';
import { generatePhraseAndAffirmations } from '@/prompts/phrase.js';
import { getSelfReferenceKey } from '@/utils/get-self-reference-key.js';
import { logger } from '@/utils/logger.js';
import { Hono } from 'hono';

const visionRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

type VisionStatus = 'pending' | 'done' | 'failed';

interface WorkerPayload {
    userId: string;
    visionId: string;
    visionDescription: string;
    existingPhrases?: string[];
    language: 'de' | 'en';
}

const statusKey = (userId: string, visionId: string) => `vision-status/${userId}/${visionId}`;
const imageKeyFor = (userId: string, visionId: string) => `vision-images/${userId}/${visionId}`;

async function writeStatus(userId: string, visionId: string, status: VisionStatus): Promise<void> {
    await R2Storage.uploadBuffer(
        statusKey(userId, visionId),
        Buffer.from(JSON.stringify({ status }), 'utf8'),
        'application/json',
    );
}

async function readStatus(userId: string, visionId: string): Promise<VisionStatus | null> {
    const buf = await R2Storage.downloadBuffer(statusKey(userId, visionId));
    if (!buf) return null;
    try {
        return (JSON.parse(buf.toString('utf8')) as { status: VisionStatus }).status;
    } catch {
        return null;
    }
}

function getWorkerSecret(): string {
    const secret = process.env.INTERNAL_WORKER_SECRET;
    if (!secret) throw new Error('INTERNAL_WORKER_SECRET not set');
    return secret;
}

function fireWorker(origin: string, payload: WorkerPayload): void {
    fetch(`${origin}/vision/worker`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': getWorkerSecret(),
        },
        body: JSON.stringify(payload),
    }).catch((err) => {
        logger.error({ err: err?.message, visionId: payload.visionId }, 'Worker self-call failed');
        writeStatus(payload.userId, payload.visionId, 'failed').catch(() => { });
    });
}

async function getPushToken(userId: string): Promise<string | null> {
    const buf = await R2Storage.downloadBuffer(`user-data/${userId}/push-token`);
    return buf?.toString('utf8') ?? null;
}

visionRoute.post('/generate', revenuecatAuth, async (c) => {
    const { visionDescription, existingPhrases, motivationStyle, language, sync } = await c.req.json();
    const lang: 'de' | 'en' = language === 'de' ? 'de' : 'en';

    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    logger.info({ existingPhrasesCount: Array.isArray(existingPhrases) ? existingPhrases.length : 0, sync: !!sync }, 'Vision generate request received');

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    // Load composite from R2 (existence check for async; input for sync)
    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    // Synchronous path — used by onboarding only (transition flag)
    if (sync === true) {
        try {
            const compositeBase64 = composite.toString('base64');

            const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
            const cachedPersonDesc = cachedDescBuffer?.toString('utf8') ?? null;

            const phrasePromise = generatePhraseAndAffirmations(visionDescription, lang);

            const imagePipeline = (async () => {
                let personDesc = cachedPersonDesc;
                if (!personDesc) {
                    personDesc = await describePersonFromImages([compositeBase64]);
                    R2Storage.uploadBuffer(
                        getSelfReferenceKey(userId, 'description'),
                        Buffer.from(personDesc, 'utf8'),
                        'text/plain',
                    ).catch(() => { });
                }
                const sceneDesc = await generateSceneDescription(personDesc, visionDescription, Array.isArray(existingPhrases) ? existingPhrases : undefined, lang);
                return generateImage(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);
            })();

            const [phraseResult, resultB64] = await Promise.all([phrasePromise, imagePipeline]);

            const visionId = crypto.randomUUID();
            const imageKey = imageKeyFor(userId, visionId);
            await R2Storage.uploadBuffer(imageKey, Buffer.from(resultB64, 'base64'));
            const signedUrl = await R2Storage.getSignedUrl(imageKey);

            deductGeneration(userId, count); // fire-and-forget

            return c.json({ phrase: phraseResult.phrase, category: phraseResult.category, affirmationsAffirmation: phraseResult.affirmationsAffirmation, affirmationsFuel: phraseResult.affirmationsFuel, signedUrl, imageKey, visionId });
        } catch (error: any) {
            logger.error({ error: error.message }, 'Vision generate (sync) failed');
            return c.json({ error: 'Vision generation failed' }, 500);
        }
    }

    // Async path (default): phrase now, image in the worker
    try {
        const phraseResult = await generatePhraseAndAffirmations(visionDescription, lang);

        const visionId = crypto.randomUUID();
        await writeStatus(userId, visionId, 'pending');

        fireWorker(new URL(c.req.url).origin, {
            userId,
            visionId,
            visionDescription,
            existingPhrases: Array.isArray(existingPhrases) ? existingPhrases : undefined,
            language: lang,
        });

        return c.json({
            visionId,
            phrase: phraseResult.phrase,
            category: phraseResult.category,
            affirmationsAffirmation: phraseResult.affirmationsAffirmation,
            affirmationsFuel: phraseResult.affirmationsFuel,
            status: 'pending' as const,
        });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision generate (async dispatch) failed');
        return c.json({ error: 'Vision generation failed' }, 500);
    }
});

visionRoute.post('/regenerate', revenuecatAuth, async (c) => {
    const { visionId, visionDescription, existingPhrases, language } = await c.req.json();
    const lang: 'de' | 'en' = language === 'de' ? 'de' : 'en';

    if (!visionId || typeof visionId !== 'string') {
        return c.json({ error: 'visionId is required' }, 400);
    }
    if (!visionDescription || typeof visionDescription !== 'string') {
        return c.json({ error: 'visionDescription is required' }, 400);
    }

    const userId = c.var.rcUserId;
    const count = await ensureGenerationCount(userId);
    if (count <= 0) {
        return c.json({ error: 'No generations remaining', count: 0 }, 403);
    }

    const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
    if (!composite) {
        return c.json({ error: 'No composite image found. Upload reference images first.' }, 400);
    }

    try {
        await writeStatus(userId, visionId, 'pending');

        fireWorker(new URL(c.req.url).origin, {
            userId,
            visionId,
            visionDescription,
            existingPhrases: Array.isArray(existingPhrases) ? existingPhrases : undefined,
            language: lang,
        });

        return c.json({ visionId, status: 'pending' as const });
    } catch (error: any) {
        logger.error({ error: error.message }, 'Vision regenerate (async dispatch) failed');
        return c.json({ error: 'Vision regeneration failed' }, 500);
    }
});

visionRoute.post('/worker', async (c) => {
    if (c.req.header('x-internal-secret') !== getWorkerSecret()) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const payload = await c.req.json<WorkerPayload>().catch(() => null);
    if (!payload?.userId || !payload?.visionId || !payload?.visionDescription) {
        return c.json({ error: 'Invalid payload' }, 400);
    }
    const { userId, visionId, visionDescription, existingPhrases } = payload;
    const lang: 'de' | 'en' = payload.language === 'de' ? 'de' : 'en';

    const pushToken = await getPushToken(userId).catch(() => null);

    try {
        const composite = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'composite'));
        if (!composite) throw new Error('No composite image found');
        const compositeBase64 = composite.toString('base64');

        const cachedDescBuffer = await R2Storage.downloadBuffer(getSelfReferenceKey(userId, 'description'));
        let personDesc = cachedDescBuffer?.toString('utf8') ?? null;
        if (!personDesc) {
            personDesc = await describePersonFromImages([compositeBase64]);
            R2Storage.uploadBuffer(
                getSelfReferenceKey(userId, 'description'),
                Buffer.from(personDesc, 'utf8'),
                'text/plain',
            ).catch(() => { });
        }

        const sceneDesc = await generateSceneDescription(personDesc, visionDescription, existingPhrases, lang);
        const resultB64 = await generateImage(sceneDesc, personDesc, [{ base64: compositeBase64, mimeType: 'image/jpeg' }]);

        await R2Storage.uploadBuffer(imageKeyFor(userId, visionId), Buffer.from(resultB64, 'base64'));
        await writeStatus(userId, visionId, 'done');

        const count = await ensureGenerationCount(userId);
        deductGeneration(userId, count); // fire-and-forget, wie bisher

        if (pushToken) {
            await sendPushNotification(pushToken, {
                title: lang === 'de' ? 'Deine Vision ist fertig ✨' : 'Your vision is ready ✨',
                body: lang === 'de' ? 'Schau sie dir jetzt an.' : 'Take a look now.',
                data: { visionId },
            });
        }

        logger.info({ userId, visionId }, 'Vision worker completed');
        return c.json({ ok: true });
    } catch (error: any) {
        logger.error({ error: error.message, userId, visionId }, 'Vision worker failed');
        await writeStatus(userId, visionId, 'failed').catch(() => { });
        if (pushToken) {
            await sendPushNotification(pushToken, {
                title: lang === 'de' ? 'Deine Vision konnte nicht erstellt werden — versuch es nochmal' : "Your vision couldn't be created — please try again",
                body: lang === 'de' ? 'Öffne die App und starte einen neuen Versuch.' : 'Open the app and try again.',
                data: { visionId },
            });
        }
        return c.json({ ok: false });
    }
});

visionRoute.get('/status', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const visionId = c.req.query('visionId');
    if (!visionId) return c.json({ error: 'visionId query param required' }, 400);

    const status = await readStatus(userId, visionId);
    if (!status) return c.json({ error: 'Not found' }, 404);

    if (status === 'done') {
        const imageKey = imageKeyFor(userId, visionId);
        const signedUrl = await R2Storage.getSignedUrl(imageKey);
        return c.json({ status, signedUrl, imageKey });
    }
    return c.json({ status });
});

export default visionRoute;
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npx tsc --noEmit 2>&1 | grep -v test-phrase`
Expected: keine Ausgabe.

- [ ] **Step 3: Env-Var lokal setzen**

In der lokalen Env-Datei des Backends (dort, wo `OPENAI_API_KEY` etc. stehen — `.env` im `backend/`-Ordner, falls vorhanden; sonst nur dokumentieren): `INTERNAL_WORKER_SECRET=<beliebiger langer random string>`. NICHT committen.

- [ ] **Step 4: Commit (Tasks 1–3)**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add backend/src/lib/expo/push.ts backend/src/routes/user-data-route.ts backend/src/routes/vision-route.ts
git commit -m "feat(backend): async vision generation via self-call worker with push notifications

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: App — Vision-Typ, VisionStore, WidgetBridge-Guard

**Files:**
- Modify: `app/types/vision.ts`
- Modify: `app/stores/VisionStore.ts`
- Modify: `app/services/widgets/widget-bridge.ts`

**Interfaces:**
- Produces: `Vision.imagePath: string | null`; `Vision.status?: 'pending' | 'ready' | 'failed'`; `Vision.pendingSince?: number`; Store-Actions `setVisionStatus(id: string, status: VisionStatus): void` (setzt bei `'pending'` auch `pendingSince: Date.now()`, sonst `pendingSince: undefined`) und `focusVisionId: string | null` + `setFocusVisionId(id: string | null): void` (NICHT persistiert). `updateImage` setzt zusätzlich `status: 'ready'` und löscht `pendingSince`. Tasks 6–9 nutzen genau diese Namen.

- [ ] **Step 1: `app/types/vision.ts` anpassen**

```ts
export type VisionCategory =
    | 'wealth'
    | 'body'
    | 'lifestyle'
    | 'relationships'
    | 'mindset'
    | 'purpose';

export type VisionStatus = 'pending' | 'ready' | 'failed';

export type Vision = {
    id: string
    title: string
    phrase: string
    category: VisionCategory
    imagePath: string | null
    createdAt: string
    imageVersion: number
    status?: VisionStatus
    pendingSince?: number
    affirmationsAffirmation?: string[]
    affirmationsFuel?: string[]
}
```

- [ ] **Step 2: `app/stores/VisionStore.ts` anpassen**

Kompletter neuer Inhalt:

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage, StorageKeys } from '@/lib/storage';
import { Vision, VisionStatus } from '@/types/vision';

const mmkvStorage = createJSONStorage(() => ({
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.remove(name),
}));

type VisionStore = {
    visions: Vision[];
    focusVisionId: string | null;
    addVision: (vision: Omit<Vision, 'createdAt'> & { id?: string }) => void;
    updatePhrase: (id: string, phrase: string) => void;
    updateImage: (id: string, imagePath: string) => void;
    setVisionStatus: (id: string, status: VisionStatus) => void;
    setFocusVisionId: (id: string | null) => void;
    deleteVision: (id: string) => void;
};

export const useVisionStore = create<VisionStore>()(
    persist(
        (set) => ({
            visions: [],
            focusVisionId: null,
            addVision: (vision) => set((s) => ({
                visions: [...s.visions, { ...vision, id: vision.id ?? Date.now().toString(), createdAt: new Date().toISOString(), imageVersion: 1 }],
            })),
            updatePhrase: (id, phrase) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, phrase } : v),
            })),
            updateImage: (id, imagePath) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, imagePath, imageVersion: (v.imageVersion ?? 1) + 1, status: 'ready' as const, pendingSince: undefined } : v),
            })),
            setVisionStatus: (id, status) => set((s) => ({
                visions: s.visions.map((v) => v.id === id ? { ...v, status, pendingSince: status === 'pending' ? Date.now() : undefined } : v),
            })),
            setFocusVisionId: (id) => set({ focusVisionId: id }),
            deleteVision: (id) => set((s) => ({
                visions: s.visions.filter((v) => v.id !== id),
            })),
        }),
        {
            name: StorageKeys.VISIONS,
            storage: mmkvStorage,
            partialize: (s) => ({ visions: s.visions }) as Pick<VisionStore, 'visions'>,
        }
    )
);
```

- [ ] **Step 3: `widget-bridge.ts` gegen `imagePath: null` absichern**

In `app/services/widgets/widget-bridge.ts`, am Anfang des Bodys von `static async sync(visions: Vision[])` (Zeile ~23) einfügen:

```ts
        visions = visions.filter((v) => !!v.imagePath && v.status !== 'pending');
```

Danach kompilieren die nachfolgenden Verwendungen weiter gegen gefilterte Visions. Falls tsc innerhalb der Methode weitere `vision.imagePath`-Nullability-Fehler meldet (z.B. in der `visions.map`-Schleife Zeile ~44), dort `vision.imagePath!` verwenden — durch den Filter ist das sicher.

- [ ] **Step 4: Typecheck (Fehler erwartet)**

Run: `cd app && npx tsc --noEmit 2>&1 | grep -vE "parallax-scroll-view|components/ui/|use-theme-color"`
Expected: Fehler in `vision/add.tsx`, `VisionActionsModal.tsx`, `vision-generation-step.tsx`, `VisionSlide.tsx`, ggf. `home.tsx` (Konsumenten von `imagePath: string`). Tasks 5–9 beheben sie; Commit erst in Task 10.

### Task 5: App — generateVision-Utils + UserDataStore-Tokenfeld

**Files:**
- Modify: `app/utils/generateVision.ts` (kompletter Ersatz)
- Modify: `app/stores/UserDataStore.ts`

**Interfaces:**
- Consumes: Backend-Kontrakte aus Task 3.
- Produces:
  - `generateVision(description, userId, existingPhrases?, motivationStyle?, language?) → Promise<GenerateVisionResult>` mit `{ visionId, phrase, category, affirmationsAffirmation, affirmationsFuel }` (KEIN Bild).
  - `generateVisionSync(...gleiche Parameter) → Promise<GenerateVisionSyncResult>` mit `{ phrase, category, imageUrl, imageKey, visionId, affirmationsAffirmation, affirmationsFuel }` (bisheriges Verhalten, Body-Flag `sync: true`).
  - `regenerateVision(visionId, description, userId, existingPhrases?, language?) → Promise<void>`.
  - `fetchVisionStatus(visionId, userId) → Promise<VisionStatusResult>` mit `{ status: 'pending' | 'done' | 'failed', signedUrl?, imageKey? }`.
  - UserDataStore: `lastSentPushToken: string | null` + `setLastSentPushToken(token: string | null): void`.

- [ ] **Step 1: `app/utils/generateVision.ts` ersetzen**

```ts
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type GenerateVisionResult = {
    visionId: string;
    phrase: string;
    category: string;
    affirmationsAffirmation: string[];
    affirmationsFuel: string[];
};

export type GenerateVisionSyncResult = GenerateVisionResult & {
    imageUrl: string;   // signed URL for preview
    imageKey: string;
};

export type VisionStatusResult = {
    status: 'pending' | 'done' | 'failed';
    signedUrl?: string;
    imageKey?: string;
};

export async function generateVision(description: string, userId: string, existingPhrases?: string[], motivationStyle?: string, language: 'de' | 'en' = 'en'): Promise<GenerateVisionResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionDescription: description, existingPhrases, motivationStyle, language }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return {
        visionId: data.visionId,
        phrase: data.phrase,
        category: data.category,
        affirmationsAffirmation: data.affirmationsAffirmation ?? [],
        affirmationsFuel: data.affirmationsFuel ?? [],
    };
}

// Synchronous variant — onboarding only (transition until onboarding goes async)
export async function generateVisionSync(description: string, userId: string, existingPhrases?: string[], motivationStyle?: string, language: 'de' | 'en' = 'en'): Promise<GenerateVisionSyncResult> {
    const response = await fetch(`${BACKEND_URL}/vision/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionDescription: description, existingPhrases, motivationStyle, language, sync: true }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return {
        visionId: data.visionId,
        phrase: data.phrase,
        category: data.category,
        imageUrl: data.signedUrl,
        imageKey: data.imageKey,
        affirmationsAffirmation: data.affirmationsAffirmation ?? [],
        affirmationsFuel: data.affirmationsFuel ?? [],
    };
}

export async function regenerateVision(visionId: string, description: string, userId: string, existingPhrases?: string[], language: 'de' | 'en' = 'en'): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/vision/regenerate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ visionId, visionDescription: description, existingPhrases, language }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Regeneration failed (${response.status})`);
    }
}

export async function fetchVisionStatus(visionId: string, userId: string): Promise<VisionStatusResult> {
    const response = await fetch(`${BACKEND_URL}/vision/status?visionId=${encodeURIComponent(visionId)}`, {
        headers: { 'x-rc-user-id': userId },
    });

    if (!response.ok) {
        throw new Error(`Status fetch failed (${response.status})`);
    }

    return await response.json() as VisionStatusResult;
}
```

- [ ] **Step 2: `app/stores/UserDataStore.ts` erweitern**

Im Typ `UserDataStore` ergänzen:

```ts
    lastSentPushToken: string | null;
    setLastSentPushToken: (token: string | null) => void;
```

In den Defaults (bei den anderen Feldern) ergänzen:

```ts
            lastSentPushToken: null,
```

Bei den Actions ergänzen:

```ts
            setLastSentPushToken: (token) => set({ lastSentPushToken: token }),
```

- [ ] **Step 3: Typecheck-Zwischenstand**

Run: `cd app && npx tsc --noEmit 2>&1 | grep -E "generateVision|UserDataStore"`
Expected: keine Treffer.

### Task 6: App — Pending-Vision-Watcher

**Files:**
- Create: `app/services/pending-vision-watcher.ts`

**Interfaces:**
- Consumes: `fetchVisionStatus` (Task 5), `setVisionStatus`/`updateImage` (Task 4), `MediaHandler.saveFromRemote`, `WidgetBridge.sync`.
- Produces: `PendingVisionWatcher.start(): void` (idempotent; startet 10s-Intervall + AppState-Listener + Sofort-Check), `PendingVisionWatcher.checkNow(): Promise<void>`, `PendingVisionWatcher.setOnCompleted(cb: () => void): void` (wird nach jedem erfolgreich geladenen Bild aufgerufen; Task 9 hängt dort `refreshGenerationCount` ein).

- [ ] **Step 1: Datei anlegen**

```ts
import { AppState } from 'react-native';

import { MediaHandler } from '@/lib/media-handler';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { devLog } from '@/utils/dev-log';
import { fetchVisionStatus } from '@/utils/generateVision';

const POLL_INTERVAL_MS = 10_000;
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

let started = false;
let checking = false;
let onCompleted: (() => void) | null = null;

async function checkNow(): Promise<void> {
    if (checking) return;
    checking = true;
    try {
        const { visions, updateImage, setVisionStatus } = useVisionStore.getState();
        const pending = visions.filter((v) => v.status === 'pending');
        if (pending.length === 0) return;

        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        await Promise.all(pending.map(async (v) => {
            if (v.pendingSince && Date.now() - v.pendingSince > PENDING_TIMEOUT_MS) {
                devLog('Pending vision timed out:', v.id);
                setVisionStatus(v.id, 'failed');
                return;
            }
            try {
                const res = await fetchVisionStatus(v.id, userId);
                if (res.status === 'done' && res.signedUrl && res.imageKey) {
                    const path = await MediaHandler.saveFromRemote(res.signedUrl, res.imageKey);
                    updateImage(v.id, path);
                    WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
                    onCompleted?.();
                } else if (res.status === 'failed') {
                    setVisionStatus(v.id, 'failed');
                }
            } catch {
                // transient error — try again next tick
            }
        }));
    } finally {
        checking = false;
    }
}

export const PendingVisionWatcher = {
    start(): void {
        if (started) return;
        started = true;
        setInterval(() => { void checkNow(); }, POLL_INTERVAL_MS);
        AppState.addEventListener('change', (state) => {
            if (state === 'active') void checkNow();
        });
        void checkNow();
    },
    checkNow,
    setOnCompleted(cb: () => void): void {
        onCompleted = cb;
    },
};
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npx tsc --noEmit 2>&1 | grep pending-vision-watcher`
Expected: keine Treffer.

### Task 7: App — add.tsx, VisionActionsModal, Onboarding-Step umstellen

**Files:**
- Modify: `app/app/vision/add.tsx`
- Modify: `app/components/modals/VisionActionsModal.tsx`
- Modify: `app/components/onboarding/steps/vision-generation-step.tsx`

**Interfaces:**
- Consumes: `generateVision`/`regenerateVision`/`generateVisionSync` (Task 5), `setVisionStatus` (Task 4).
- Produces: nichts Neues (UI-Flows).

**Hinweis für den Implementer:** `add.tsx` hat eine State-Maschine `input → loading → preview` mit Share-UI. Durch den Async-Flow wird `preview` im Generate-Flow unerreichbar — die Preview-/Share-/Regenerate-Teile von `add.tsx` werden ENTFERNT (State-Werte, Handler `handleRegenerate`/`handleShare`, zugehörige JSX-Blöcke und Styles). Lies die Datei vollständig, bevor du schneidest.

- [ ] **Step 1: `add.tsx` — handleGenerate ersetzen, Preview-Flow entfernen**

`handleGenerate` wird zu (Animations-Teile 1–2 unverändert lassen):

```ts
    const handleGenerate = async () => {
        if (!description.trim()) return;
        setError(null);

        // 1. Keyboard schließen + Input wegfaden (unverändert)
        Keyboard.dismiss();
        await animate(Animated.parallel([
            Animated.timing(inputOpacity, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(inputTranslate, { toValue: -12, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]));

        // 2. Loading einblenden (unverändert) — überbrückt die Phrase-Generierung (~2-5s)
        loadingOpacity.setValue(0);
        setState('loading');
        await animate(Animated.timing(loadingOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }));

        try {
            const existingPhrases = useVisionStore.getState().visions.map((v) => v.phrase).filter(Boolean);
            const generated = await generateVision(description.trim(), userId, existingPhrases, motivationStyle, language);
            addVision({
                id: generated.visionId,
                title: '',
                phrase: generated.phrase,
                category: generated.category as VisionCategory,
                imagePath: null,
                imageVersion: 1,
                status: 'pending',
                pendingSince: Date.now(),
                affirmationsAffirmation: generated.affirmationsAffirmation,
                affirmationsFuel: generated.affirmationsFuel,
            });
            trackerManager.track('vision_created', { category: generated.category, motivation_style: motivationStyle });
            if (useUserDataStore.getState().haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch {
            trackerManager.track('vision_creation_failed');
            await animate(Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }));
            inputOpacity.setValue(1);
            inputTranslate.setValue(0);
            setError(t('vision.add.error'));
            setState('input');
        }
    };
```

Entfernen: `handleRegenerate`, `handleShare` (und Share-Varianten), der `preview`-State-Zweig im JSX, `animatePreviewIn`, `setResult`/`setSavedPath`/`setSavedVisionId`-States (sofern nur vom Preview-Flow genutzt), zugehörige ungenutzte Imports (`MediaHandler`, `WidgetBridge`, `captureRef`, `Share`, `regenerateVision`, `refreshGenerationCount` — nur falls danach wirklich ungenutzt) und verwaiste Styles. `router` importieren, falls nicht vorhanden.

- [ ] **Step 2: `VisionActionsModal.tsx` — handleRegenerate umstellen**

```ts
    const handleRegenerate = async (prompt: string) => {
        if (!vision) return;
        setIsGenerating(true);
        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== vision.id)
                .map((v) => v.phrase)
                .filter(Boolean);
            await regenerateVision(vision.id, prompt.trim() || vision.phrase, userId, existingPhrases, language);
            useVisionStore.getState().setVisionStatus(vision.id, 'pending');
            trackerManager.track('vision_regenerated');
        } catch (error) {
            trackerManager.track('vision_regeneration_failed');
            Alert.alert(t('vision.actions.regen_error'));
        } finally {
            setIsGenerating(false);
        }
    };
```

Nach erfolgreichem Dispatch das Modal über den bestehenden Schließen-Mechanismus schließen (so wie andere Aktionen im Modal es tun — Datei lesen). Ungenutzte Imports (`MediaHandler`, ggf. `WidgetBridge.updateImage`-Nutzung, `refreshGenerationCount`) nur entfernen, wenn sie in der Datei sonst nirgends gebraucht werden. Beim Delete-Handler (nutzt `vision.imagePath`): Null-Guard ergänzen (`if (imagePath) MediaHandler.delete(imagePath)` bzw. analog zur bestehenden Struktur).

- [ ] **Step 3: `vision-generation-step.tsx` auf Sync-Variante umstellen**

Import `generateVision` → `generateVisionSync` und den Aufruf in `runGeneration()` entsprechend umbenennen. Sonst NICHTS ändern (Onboarding bleibt synchron; Response-Shape ist identisch zum alten `generateVision`).

- [ ] **Step 4: Typecheck**

Run: `cd app && npx tsc --noEmit 2>&1 | grep -E "add.tsx|VisionActionsModal|vision-generation-step"`
Expected: keine Treffer.

### Task 8: App — VisionSlide Pending/Failed-UI + i18n

**Files:**
- Modify: `app/components/layout/VisionSlide.tsx`
- Modify: `app/i18n/locales/de.ts`, `app/i18n/locales/en.ts`

**Interfaces:**
- Consumes: `Vision.status`/`imagePath: string | null` (Task 4), `GlowPulse` (bestehend, `@/components/layout/GlowPulse`).
- Produces: i18n-Keys `vision.slide.generating`, `vision.slide.generating_update`, `vision.slide.failed`.

- [ ] **Step 1: i18n-Keys ergänzen**

In `de.ts` bei den anderen `vision.slide.*`-Keys:

```ts
  'vision.slide.generating': 'Dein Bild wird erstellt…',
  'vision.slide.generating_update': 'Neues Bild wird erstellt…',
  'vision.slide.failed': 'Bild konnte nicht erstellt werden. Versuch es über das Menü erneut.',
```

In `en.ts`:

```ts
  'vision.slide.generating': 'Your image is being created…',
  'vision.slide.generating_update': 'Creating a new image…',
  'vision.slide.failed': "Image couldn't be created. Try again from the menu.",
```

- [ ] **Step 2: `VisionSlide.tsx` ersetzen**

```tsx
import { GlowPulse } from '@/components/layout/GlowPulse';
import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { Vision } from '@/types/vision';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export function VisionSlide({ item, width, height, locked }: { item: Vision; width: number; height: number; locked?: boolean }) {
    const { t } = useTranslation();
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        if (!item.imagePath) {
            setUri(null);
            return;
        }
        MediaHandler.resolveUri(item.imagePath).then((u) => setUri(`${u}?v=${item.imageVersion ?? 1}`));
    }, [item.imagePath, item.imageVersion]);

    const isPending = item.status === 'pending';
    const isFailed = item.status === 'failed' && !uri;

    return (
        <View style={{ width, height }}>
            {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
            )}

            {isPending && !uri && (
                <View style={styles.stateOverlay}>
                    <GlowPulse size={180} />
                    <Text style={styles.stateText}>{t('vision.slide.generating')}</Text>
                </View>
            )}

            {isPending && uri && (
                <View style={[StyleSheet.absoluteFill, styles.regenOverlay]}>
                    <ActivityIndicator color="white" size="large" />
                    <Text style={styles.stateText}>{t('vision.slide.generating_update')}</Text>
                </View>
            )}

            {isFailed && (
                <View style={styles.stateOverlay}>
                    <MaterialCommunityIcons name="image-off-outline" size={40} color={Colors.textMuted} />
                    <Text style={styles.stateText}>{t('vision.slide.failed')}</Text>
                </View>
            )}

            {locked && (
                <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.lockOverlay}>
                        <View style={styles.lockBadge}>
                            <MaterialCommunityIcons name="crown" size={28} color={Colors.accent} />
                        </View>
                        <Text style={styles.lockText}>{t('vision.slide.premium_unlock')}</Text>
                    </View>
                </BlurView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    stateOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingHorizontal: 40,
    },
    regenOverlay: {
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    stateText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        textAlign: 'center',
    },
    lockOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    lockBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
    },
});
```

Hinweis: `stateText` auf dem hellen `Colors.surface`-Hintergrund — prüfe die Lesbarkeit; falls `Colors.surface` hell ist, für `stateOverlay`-Text stattdessen `color: Colors.textMuted` verwenden (Datei `constants/theme.ts` kurz prüfen und die lesbare Variante wählen).

- [ ] **Step 3: Typecheck**

Run: `cd app && npx tsc --noEmit 2>&1 | grep VisionSlide`
Expected: keine Treffer.

### Task 9: App — Push-Registrierung, Token-Sync, Notification-Routing

**Files:**
- Modify: `app/utils/register-push-notifications.ts` (kompletter Ersatz)
- Create: `app/services/push-token-sync.ts`
- Modify: `app/app/onboarding.tsx` (handleRequestNotifications)
- Modify: `app/app/_layout.tsx` (Listener + Watcher-Start)
- Modify: `app/app/home.tsx` (focusVisionId konsumieren, onCompleted-Hook)

**Interfaces:**
- Consumes: `PUT /user-data/push-token` (Task 2), `lastSentPushToken`/`setLastSentPushToken` (Task 5), `PendingVisionWatcher` (Task 6), `focusVisionId`/`setFocusVisionId` (Task 4).
- Produces: `syncPushToken(): Promise<void>` (holt Token nur bei granted Permission, lädt nur bei Änderung hoch).

- [ ] **Step 1: `register-push-notifications.ts` ersetzen** (projectId nach Referenz-Code, Rückgabe-Shape unverändert)

```ts
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { devLog } from "./dev-log";

export async function registerPushNotifications() {
    if (Platform.OS == "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500]
        })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        devLog("Notifications permission not granted");
        return {
            status: finalStatus,
            pushTokenString: null
        }
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    try {
        const token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        })).data;

        devLog("Expo push token:", token);
        return {
            status: finalStatus,
            pushTokenString: token
        }
    } catch (err) {
        devLog("Failed to get push token:", err);
        return {
            status: finalStatus,
            pushTokenString: null
        }
    }
}
```

- [ ] **Step 2: `app/services/push-token-sync.ts` anlegen**

```ts
import * as Notifications from 'expo-notifications';
import { fetch } from 'expo/fetch';

import { useUserDataStore } from '@/stores/UserDataStore';
import { devLog } from '@/utils/dev-log';
import { registerPushNotifications } from '@/utils/register-push-notifications';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// Uploads the Expo push token to the backend — only when permission is
// granted and the token differs from the last one we sent.
export async function syncPushToken(): Promise<void> {
    const { userId, lastSentPushToken, setLastSentPushToken } = useUserDataStore.getState();
    if (!userId) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const { pushTokenString } = await registerPushNotifications();
    if (!pushTokenString || pushTokenString === lastSentPushToken) return;

    const res = await fetch(`${BACKEND_URL}/user-data/push-token`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-rc-user-id': userId,
        },
        body: JSON.stringify({ token: pushTokenString }),
    });
    if (res.ok) {
        devLog('Push token synced');
        setLastSentPushToken(pushTokenString);
    }
}
```

- [ ] **Step 3: `onboarding.tsx` — Token nach Grant hochladen**

In `handleRequestNotifications` nach `updateSettings({ notifications: true })` ergänzen:

```ts
            syncPushToken().catch(() => { });
```

Import ergänzen: `import { syncPushToken } from '@/services/push-token-sync';`

- [ ] **Step 4: `_layout.tsx` — Listener + Watcher**

Im bestehenden `useEffect` von `RootLayout`:

a) Den bestehenden Response-Listener erweitern:

```ts
    const notificationSub = Notifications.addNotificationResponseReceivedListener((response) => {
      trackerManager.track('notification_opened');
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.visionId) {
        useVisionStore.getState().setFocusVisionId(data.visionId);
        PendingVisionWatcher.checkNow().catch(() => { });
        router.push('/home');
      }
    });
```

b) Direkt darunter neu:

```ts
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      PendingVisionWatcher.checkNow().catch(() => { });
    });

    PendingVisionWatcher.start();
    if (useUserDataStore.getState().hasOnboarded) {
      syncPushToken().catch(() => { });
    }
```

c) Im Cleanup des useEffect `receivedSub.remove();` ergänzen (analog zum bestehenden `notificationSub`-Cleanup). Imports ergänzen: `PendingVisionWatcher`, `syncPushToken`, `router` (aus expo-router, falls nicht importiert), `useVisionStore` ist bereits importiert (WidgetBridge-Sync nutzt ihn).

- [ ] **Step 5: `home.tsx` — focusVisionId konsumieren + Count-Refresh**

In `HomeScreen` ergänzen (FlatList bekommt eine Ref):

```ts
    const listRef = useRef<FlatList<Vision>>(null);
    const focusVisionId = useVisionStore((s) => s.focusVisionId);

    useEffect(() => {
        PendingVisionWatcher.setOnCompleted(() => { refreshGenerationCount().catch(() => { }); });
    }, []);

    useEffect(() => {
        if (!focusVisionId) return;
        const index = filtered.findIndex((v) => v.id === focusVisionId);
        if (index >= 0) {
            listRef.current?.scrollToIndex({ index, animated: true });
        }
        useVisionStore.getState().setFocusVisionId(null);
    }, [focusVisionId, filtered]);
```

An der `<FlatList`: `ref={listRef}` ergänzen, außerdem `onScrollToIndexFailed={() => { }}` (Guard für noch nicht gemessene Items). `refreshGenerationCount` aus dem bestehenden `useRevenueCat()`-Destructuring mitnehmen; Imports: `PendingVisionWatcher`, ggf. `FlatList`-Typ ist schon importiert.

- [ ] **Step 6: Typecheck**

Run: `cd app && npx tsc --noEmit 2>&1 | grep -E "_layout|home.tsx|onboarding.tsx|push-token-sync|register-push"`
Expected: keine Treffer.

### Task 10: App — Gesamt-Verifikation + Commit

- [ ] **Step 1: Voller Typecheck**

Run: `cd app && npx tsc --noEmit 2>&1 | grep -vE "parallax-scroll-view|components/ui/|use-theme-color"`
Expected: keine Ausgabe.
Run: `cd backend && npx tsc --noEmit 2>&1 | grep -v test-phrase`
Expected: keine Ausgabe.

- [ ] **Step 2: Konsistenz-Greps**

Run: `grep -rn "generated.imageUrl\|generated.imageKey" app/app/vision/add.tsx app/components/modals/VisionActionsModal.tsx`
Expected: keine Treffer (Async-Aufrufer erwarten kein Bild mehr).
Run: `grep -rn "generateVisionSync" app --include="*.tsx" | grep -v node_modules`
Expected: genau 1 Treffer in `vision-generation-step.tsx`.

- [ ] **Step 3: Commit (Tasks 4–10)**

```bash
cd /Users/leonardogranetto/Projects/veezy
git add app/types/vision.ts app/stores/VisionStore.ts app/stores/UserDataStore.ts app/services/widgets/widget-bridge.ts app/utils/generateVision.ts app/services/pending-vision-watcher.ts app/app/vision/add.tsx app/components/modals/VisionActionsModal.tsx app/components/onboarding/steps/vision-generation-step.tsx app/components/layout/VisionSlide.tsx app/i18n/locales/de.ts app/i18n/locales/en.ts app/utils/register-push-notifications.ts app/services/push-token-sync.ts app/app/onboarding.tsx app/app/_layout.tsx app/app/home.tsx
git commit -m "feat(app): async vision generation with pending placeholders, polling and push routing

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 11: Manuelle Verifikation (User) + Deploy-Hinweise

- [ ] `INTERNAL_WORKER_SECRET` beim Cloud-Run-Deploy als Env-Var setzen (deploy.sh nutzt `gcloud run deploy` — Env-Vars analog zu den bestehenden ergänzen) und lokal in der Backend-Env.
- [ ] Lokal: Backend starten, Vision in der App erstellen → Response kommt nach wenigen Sekunden mit Phrase; Backend-Log zeigt Worker-Request; nach 30–90s Status `done`; App lädt Bild per Polling.
- [ ] Push-Test auf echtem Gerät (Dev-Build): Permission erteilen, Vision erstellen, App in den Hintergrund → Push kommt an, Tap scrollt im Feed zur Vision.
- [ ] Regenerate aus dem VisionActionsModal → altes Bild + Spinner-Overlay → neues Bild erscheint.
- [ ] Fehlerfall: `INTERNAL_WORKER_SECRET` absichtlich falsch am Worker testen (`curl -X POST .../vision/worker -H "x-internal-secret: wrong"`) → 401.
- [ ] Onboarding einmal komplett durchspielen → verhält sich exakt wie bisher (synchron, mit Preview).
