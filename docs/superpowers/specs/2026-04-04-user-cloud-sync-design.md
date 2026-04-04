# User Cloud Sync — Design Spec
**Date:** 2026-04-04

## Problem

Visions and user data are stored exclusively in MMKV (local app sandbox). On uninstall, all data is lost. Images are also lost since they live in the app sandbox. The app needs a transparent backup/restore layer that is fully offline-first.

---

## Goals

- Persist all user data (visions + profile) across reinstalls
- Restore images lazily on first display (not blocking startup)
- Offline-first: MMKV remains the source of truth, R2 is the backup layer
- No extra authentication — RevenueCat userId is already the identity

## Non-Goals

- Real-time cross-device sync
- Conflict resolution (last write wins)
- Storing `composite` or `description` locally (R2-only)

---

## Path Consistency Fix

All image paths are unified: **R2 key == local relative path**. No mapping needed.

| Asset | R2 Key | Local Path |
|---|---|---|
| Vision image | `vision-images/<userId>/<visionId>` | `vision-images/<userId>/<visionId>` |
| Self-reference | `self-reference/<userId>/<type>` | `self-reference/<userId>/<type>` |
| Composite | `self-reference/<userId>/composite` | — (R2 only) |
| Description | `self-reference/<userId>/description` | — (R2 only) |
| User backup | `user-data/<userId>.json` | — (R2 only) |

---

## Architecture

### `user-data/<userId>.json` — Backup Format

```json
{
  "visions": [...],
  "hasOnboarded": true,
  "hasSeenTutorial": true,
  "name": "Leo",
  "age": 25,
  "gender": "male",
  "notifications": false,
  "imagesUsed": 3,
  "selfReferenceImages": {
    "face_front": "self-reference/<userId>/face_front",
    "face_left": "self-reference/<userId>/face_left",
    "face_right": "self-reference/<userId>/face_right",
    "body": null
  }
}
```

`selfReferenceImages` paths are included in the backup — they act as signals that the images exist in R2 and should be lazily restored.

---

## Backend Changes

### `vision-route.ts` — Path fix

```
// before
const imageKey = `visions/${userId}/${visionId}`;

// after
const imageKey = `vision-images/${userId}/${visionId}`;
```

### New route: `user-data-route.ts`

All endpoints protected by `revenuecatAuth`. `userId` always comes from middleware, never from the client.

```
GET  /user-data/backup
  → R2Storage.downloadBuffer(`user-data/${userId}.json`)
  → 200 with JSON body, or 404

PUT  /user-data/backup
  → body: JSON (Vision[] + UserData fields)
  → R2Storage.uploadBuffer(`user-data/${userId}.json`, body, 'application/json')
  → 200

GET  /user-data/signed-url?key=<r2key>
  → validates: key must start with `vision-images/${userId}/` OR `self-reference/${userId}/`
  → returns: { url: string } (1h presigned GET URL)
  → 403 if key doesn't belong to user
```

Register in `index.ts`: `app.route('/user-data', userDataRoute)`

---

## Client Changes

### 1. `MediaHandler.resolveUri(path, userId)` — lazy image fallback

New method alongside `toUri()`:

1. Check if file exists locally (expo-file-system)
2. If yes → return `toUri(path)`
3. If no → `GET /user-data/signed-url?key=<path>` → download file → save locally at `path` → return local URI

Used everywhere images are displayed, replacing bare `toUri()` calls for vision images and self-reference images.

### 2. `UserCloudSync` — new service (`services/user-cloud-sync.ts`)

```typescript
UserCloudSync.upload()
// Merges VisionStore.visions + UserDataStore state into backup JSON
// PUT /user-data/backup — fire-and-forget

UserCloudSync.restore()
// GET /user-data/backup
// If 404: no-op (fresh install, no prior data)
// If 200: write visions to VisionStore, write user fields to UserDataStore
// Does NOT overwrite userId (that comes from RevenueCat)
```

### 3. `edit-self-reference.tsx` — path fix

```typescript
// before
MediaHandler.saveFromLocal(uri, `self-reference/${s.key}.jpg`)

// after
MediaHandler.saveFromLocal(uri, `self-reference/${userId}/${s.key}`)
```

### 4. `_layout.tsx` — sync triggers

**Restore** (once on startup, after userId is set in RevenueCatProvider):
```typescript
useUserDataStore.setState({ userId });
UserCloudSync.restore(); // fire-and-forget
```

**Upload** (on AppState → background):
```typescript
AppState.addEventListener('change', (state) => {
  if (state === 'background') UserCloudSync.upload();
});
```

---

## Data Flow

### First Install / Fresh Device
```
App start → RevenueCat login → userId set
  → UserCloudSync.restore()
       → GET /user-data/backup → 404
       → no-op, app starts empty
```

### Reinstall (existing user)
```
App start → RevenueCat login → userId set (same anonymous ID from Keychain)
  → UserCloudSync.restore()
       → GET /user-data/backup → 200
       → VisionStore + UserDataStore populated from JSON

User opens a vision → image missing locally
  → MediaHandler.resolveUri("vision-images/<userId>/<visionId>")
       → file not found
       → GET /user-data/signed-url?key=vision-images/<userId>/<visionId>
       → download → save locally → display
```

### Normal Usage
```
User adds/edits/deletes vision → MMKV updated immediately
App goes to background → UserCloudSync.upload() → PUT /user-data/backup
```

---

## Error Handling

- All sync operations are fire-and-forget with `.catch(() => {})` — never block the user
- `restore()` failure: app starts normally from empty state
- `upload()` failure: silently ignored, next background event will retry
- `resolveUri()` failure: fall back to `toUri()` (image will show as broken/placeholder)

---

## Out of Scope

- Conflict resolution (last-write-wins is acceptable)
- Progress indicators for image restore
- Manual "backup now" button
