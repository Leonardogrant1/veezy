# User Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backup all user data (visions + profile) to Cloudflare R2 on app background, restore it on reinstall with lazy image re-download.

**Architecture:** MMKV stays as source of truth. R2 is a backup layer only. A single `user-data/<userId>.json` holds all state. Images are already in R2 (written by the backend at generation time) and are lazily re-downloaded by `MediaHandler.resolveUri` on first display if the local file is missing. Sync triggers: restore once on startup (if visions empty), upload every time the app goes to background.

**Tech Stack:** Hono (backend), expo-file-system, Zustand, RevenueCat auth (`x-rc-user-id` header), Cloudflare R2 via `@aws-sdk/client-s3`

---

## File Map

**Backend — create/modify:**
- Modify: `backend/src/routes/vision-route.ts` — fix imageKey from `visions/` to `vision-images/`
- Create: `backend/src/routes/user-data-route.ts` — GET/PUT backup + presigned image URL
- Modify: `backend/src/index.ts` — register `/user-data` route

**Client — create/modify:**
- Modify: `app/app/vision/add.tsx` — fix imageKey path (remove `vision-images/` prefix since imageKey already contains it)
- Modify: `app/app/edit-self-reference.tsx` — fix self-reference local path to include userId
- Modify: `app/lib/media-handler/index.ts` — add `resolveUri` async method
- Create: `app/services/user-cloud-sync.ts` — `upload()` and `restore()`
- Modify: `app/services/purchases/revenuecat/providers/RevenueCatProvider.tsx` — call `restore()` after userId set
- Modify: `app/app/_layout.tsx` — AppState listener calling `upload()` on background
- Modify: `app/app/vision/[id].tsx` — use `resolveUri` for vision image display
- Modify: `app/app/edit-self-reference.tsx` — use `resolveUri` when loading stored images

---

## Task 1: Backend — Fix vision imageKey path

**Files:**
- Modify: `backend/src/routes/vision-route.ts`

The backend currently stores vision images under `visions/<userId>/<visionId>`. Change to `vision-images/<userId>/<visionId>` so the R2 key matches the client's local path exactly.

- [ ] **Update imageKey in vision-route.ts**

In `backend/src/routes/vision-route.ts`, find line 63 and change:

```typescript
// before
const imageKey = `visions/${userId}/${visionId}`;

// after
const imageKey = `vision-images/${userId}/${visionId}`;
```

- [ ] **Verify the route still compiles**

```bash
cd /Users/leonardogranetto/Projects/veezy/backend && npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Backend — Create user-data-route.ts

**Files:**
- Create: `backend/src/routes/user-data-route.ts`

Three endpoints, all protected by `revenuecatAuth`:
- `GET /user-data/backup` — fetch `user-data/<userId>.json` from R2, return as JSON
- `PUT /user-data/backup` — store request body as `user-data/<userId>.json` in R2
- `GET /user-data/signed-url?key=<path>` — return presigned 1h download URL, validates that `key` belongs to this user

- [ ] **Create the file**

```typescript
// backend/src/routes/user-data-route.ts
import { Hono } from 'hono';
import { revenuecatAuth } from '@/middleware/revenuecat-auth.js';
import { R2Storage } from '@/lib/r2/storage.js';
import { RCCustomer } from '@/lib/revenuecat/types.js';

const userDataRoute = new Hono<{
    Variables: { rcUserId: string; rcCustomer: RCCustomer };
}>();

userDataRoute.get('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const buffer = await R2Storage.downloadBuffer(`user-data/${userId}.json`);
    if (!buffer) return c.json({ error: 'Not found' }, 404);
    return c.json(JSON.parse(buffer.toString('utf8')));
});

userDataRoute.put('/backup', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const body = await c.req.text();
    await R2Storage.uploadBuffer(
        `user-data/${userId}.json`,
        Buffer.from(body, 'utf8'),
        'application/json',
    );
    return c.json({ ok: true });
});

userDataRoute.get('/signed-url', revenuecatAuth, async (c) => {
    const userId = c.var.rcUserId;
    const key = c.req.query('key');
    if (!key) return c.json({ error: 'key query param required' }, 400);

    const allowed =
        key.startsWith(`vision-images/${userId}/`) ||
        key.startsWith(`self-reference/${userId}/`);
    if (!allowed) return c.json({ error: 'Forbidden' }, 403);

    const url = await R2Storage.getSignedUrl(key);
    return c.json({ url });
});

export default userDataRoute;
```

- [ ] **Verify the route compiles**

```bash
cd /Users/leonardogranetto/Projects/veezy/backend && npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Backend — Register user-data route

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Add import and route registration**

```typescript
// add to existing imports
import userDataRoute from './routes/user-data-route.js';

// add after existing app.route calls
app.route('/user-data', userDataRoute);
```

The file should now look like:

```typescript
import { serve } from '@hono/node-server';
import 'dotenv/config';
import { Hono } from 'hono';
import { networkInterfaces } from 'os';
import selfReferenceRoute from './routes/self-reference-route.js';
import userDataRoute from './routes/user-data-route.js';
import visionRoute from './routes/vision-route.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/vision', visionRoute);
app.route('/self-reference', selfReferenceRoute);
app.route('/user-data', userDataRoute);

const port = parseInt(process.env.PORT ?? '8080');

serve({ fetch: app.fetch, port }, () => {
    const nets = networkInterfaces();
    const localIp = Object.values(nets)
        .flat()
        .find((n) => n && n.family === 'IPv4' && !n.internal)?.address ?? 'localhost';

    console.log(`Server running on:`);
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://${localIp}:${port}`);
});
```

- [ ] **Final backend compile check**

```bash
cd /Users/leonardogranetto/Projects/veezy/backend && npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Client — Fix image paths

**Files:**
- Modify: `app/app/vision/add.tsx`
- Modify: `app/app/edit-self-reference.tsx`

### add.tsx — imageKey path

The backend now returns `imageKey = "vision-images/<userId>/<visionId>"`. The client was prepending `vision-images/` to it, producing a double prefix. Remove the prefix.

- [ ] **Fix handleGenerate in add.tsx**

Find the `handleGenerate` function. Change both `saveFromRemote` calls (one in `handleGenerate`, one in `handleRegenerate`) from:

```typescript
const relativePath = await MediaHandler.saveFromRemote(
    generated.imageUrl,
    `vision-images/${generated.imageKey}`
);
```

to:

```typescript
const relativePath = await MediaHandler.saveFromRemote(
    generated.imageUrl,
    generated.imageKey
);
```

There are two identical blocks — one in `handleGenerate` (around line 77) and one in `handleRegenerate` (around line 101). Fix both.

### edit-self-reference.tsx — self-reference path

Self-reference images are currently saved as `self-reference/<type>.jpg` (no userId). Change to `self-reference/<userId>/<type>` to match the R2 key.

- [ ] **Fix saveFromLocal call in edit-self-reference.tsx**

In `handleSave`, find:

```typescript
const relativePath = MediaHandler.saveFromLocal(uri, `self-reference/${s.key}.jpg`);
```

Replace with:

```typescript
const relativePath = MediaHandler.saveFromLocal(uri, `self-reference/${userId}/${s.key}`);
```

---

## Task 5: Client — Add `resolveUri` to MediaHandler

**Files:**
- Modify: `app/lib/media-handler/index.ts`

`resolveUri` checks if the file exists locally. If not, fetches a presigned URL from the backend and downloads the file. Falls back silently to `toUri()` on any error (broken image is better than a crash).

- [ ] **Add import and method**

Add `import { useUserDataStore } from '@/stores/UserDataStore';` at the top of `app/lib/media-handler/index.ts`.

Add the following method to the `MediaHandler` class:

```typescript
static async resolveUri(relativePath: string): Promise<string> {
    if (MediaHandler.exists(relativePath)) {
        return MediaHandler.toUri(relativePath);
    }
    try {
        const userId = useUserDataStore.getState().userId;
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
        const res = await fetch(
            `${BACKEND_URL}/user-data/signed-url?key=${encodeURIComponent(relativePath)}`,
            { headers: { 'x-rc-user-id': userId } },
        );
        if (!res.ok) return MediaHandler.toUri(relativePath);
        const { url } = await res.json() as { url: string };
        await MediaHandler.saveFromRemote(url, relativePath);
    } catch {
        // silently fall back — image will appear broken
    }
    return MediaHandler.toUri(relativePath);
}
```

---

## Task 6: Client — Create UserCloudSync service

**Files:**
- Create: `app/services/user-cloud-sync.ts`

Reads directly from Zustand stores (via `getState()`, no React context needed). `restore()` is a no-op if local visions already exist (i.e. not a fresh install).

- [ ] **Create the file**

```typescript
// app/services/user-cloud-sync.ts
import { fetch } from 'expo/fetch';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export class UserCloudSync {
    static async upload(): Promise<void> {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        const s = useUserDataStore.getState();
        const backup = {
            visions: useVisionStore.getState().visions,
            hasOnboarded: s.hasOnboarded,
            hasSeenTutorial: s.hasSeenTutorial,
            name: s.name,
            age: s.age,
            gender: s.gender,
            notifications: s.notifications,
            imagesUsed: s.imagesUsed,
            selfReferenceImages: s.selfReferenceImages,
        };

        await fetch(`${BACKEND_URL}/user-data/backup`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-rc-user-id': userId,
            },
            body: JSON.stringify(backup),
        });
    }

    static async restore(): Promise<void> {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return;

        // Skip restore if this is not a fresh install
        if (useVisionStore.getState().visions.length > 0) return;

        const res = await fetch(`${BACKEND_URL}/user-data/backup`, {
            headers: { 'x-rc-user-id': userId },
        });
        if (!res.ok) return; // 404 = no backup exists yet

        const backup = await res.json() as {
            visions: any[];
            hasOnboarded: boolean;
            hasSeenTutorial: boolean;
            name: string;
            age: number;
            gender: 'male' | 'female' | 'other';
            notifications: boolean;
            imagesUsed: number;
            selfReferenceImages: {
                face_front: string | null;
                face_left: string | null;
                face_right: string | null;
                body: string | null;
            };
        };

        const { visions, ...userData } = backup;
        useVisionStore.setState({ visions });
        useUserDataStore.setState({
            hasOnboarded: userData.hasOnboarded,
            hasSeenTutorial: userData.hasSeenTutorial,
            name: userData.name,
            age: userData.age,
            gender: userData.gender,
            notifications: userData.notifications,
            imagesUsed: userData.imagesUsed,
            selfReferenceImages: userData.selfReferenceImages,
        });
    }
}
```

---

## Task 7: Client — Wire restore in RevenueCatProvider

**Files:**
- Modify: `app/services/purchases/revenuecat/providers/RevenueCatProvider.tsx`

After the userId is set in the store, trigger a restore. Fire-and-forget.

- [ ] **Add import and restore call**

Add import at the top:
```typescript
import { UserCloudSync } from '@/services/user-cloud-sync';
```

In the `init` function, add the `restore()` call immediately after `useUserDataStore.setState({ userId })`:

```typescript
useUserDataStore.setState({ userId });
UserCloudSync.restore().catch(() => {}); // fire-and-forget
loadOfferings();
```

---

## Task 8: Client — Wire upload on app background

**Files:**
- Modify: `app/app/_layout.tsx`

Add an `AppState` listener in the root layout. When the app goes to background, upload the current state to R2.

- [ ] **Add imports**

Add to the existing imports in `_layout.tsx`:

```typescript
import { AppState } from 'react-native';
import { useEffect } from 'react';
import { UserCloudSync } from '@/services/user-cloud-sync';
```

(`useEffect` is likely already imported — only add if missing.)

- [ ] **Add useEffect in RootLayout**

Inside `RootLayout`, before the `return`, add:

```typescript
useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'background') {
            UserCloudSync.upload().catch(() => {});
        }
    });
    return () => sub.remove();
}, []);
```

---

## Task 9: Client — Use resolveUri for image display

**Files:**
- Modify: `app/app/vision/[id].tsx`
- Modify: `app/app/edit-self-reference.tsx`

### vision/[id].tsx

The detail screen shows the vision image. After reinstall the local file won't exist — resolve it lazily.

- [ ] **Add resolvedUri state and effect**

Add these imports to `[id].tsx` (if not already present):
```typescript
import { useEffect, useState } from 'react'; // already imported
```

Add state variable after the existing `useState` declarations:
```typescript
const [resolvedImageUri, setResolvedImageUri] = useState<string | null>(null);
```

Add a `useEffect` after the existing effects:
```typescript
useEffect(() => {
    if (!vision) return;
    MediaHandler.resolveUri(vision.imagePath)
        .then(setResolvedImageUri)
        .catch(() => setResolvedImageUri(MediaHandler.toUri(vision.imagePath)));
}, [vision?.imagePath]);
```

- [ ] **Use resolvedImageUri in the Image component**

Find the fullscreen Image (around line 125):
```typescript
<Image
  source={{ uri: MediaHandler.toUri(vision.imagePath) }}
  style={StyleSheet.absoluteFill}
  resizeMode="cover"
/>
```

Replace with:
```typescript
{resolvedImageUri && (
    <Image
        source={{ uri: resolvedImageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
    />
)}
```

### edit-self-reference.tsx

The existing `useEffect` that populates `uris` uses `MediaHandler.toUri`. Change it to use `resolveUri` so that missing local files are re-downloaded from R2.

- [ ] **Update useEffect in edit-self-reference.tsx**

Find the `useEffect` that sets `uris` (around line 47):

```typescript
useEffect(() => {
    setUris({
        face_front: storedImages.face_front ? MediaHandler.toUri(storedImages.face_front) : null,
        face_left: storedImages.face_left ? MediaHandler.toUri(storedImages.face_left) : null,
        face_right: storedImages.face_right ? MediaHandler.toUri(storedImages.face_right) : null,
        body: storedImages.body ? MediaHandler.toUri(storedImages.body) : null,
    });
}, []);
```

Replace with:

```typescript
useEffect(() => {
    const resolve = async () => {
        setUris({
            face_front: storedImages.face_front
                ? await MediaHandler.resolveUri(storedImages.face_front)
                : null,
            face_left: storedImages.face_left
                ? await MediaHandler.resolveUri(storedImages.face_left)
                : null,
            face_right: storedImages.face_right
                ? await MediaHandler.resolveUri(storedImages.face_right)
                : null,
            body: storedImages.body
                ? await MediaHandler.resolveUri(storedImages.body)
                : null,
        });
    };
    resolve().catch(() => {});
}, []);
```
