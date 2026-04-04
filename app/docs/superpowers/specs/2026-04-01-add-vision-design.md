# Add Vision — Design Spec

**Date:** 2026-04-01

## Overview

Tapping a FAB (Floating Action Button) on the home screen opens a fullscreen modal where the user describes their vision in free text. The AI generates both an image and a phrase from that description. The user sees a preview and either confirms (adds to board) or regenerates.

---

## Screen

`app/vision/add.tsx` — registered as `fullScreenModal` with `fade` animation in `_layout.tsx`.

No categories. The vision model (`Vision` in `VisionStore`) drops the `category` field for newly added visions — existing dummy visions keep their category for now (treated as optional/empty string).

---

## State Machine

```
input → loading → preview
                ↓ (error)
              input (with error message)

preview → (Hinzufügen) → VisionStore.addVision() → router.back()
preview → (Neu generieren) → loading
preview → (✕) → router.back()
input   → (✕) → router.back()
```

---

## Data Flow

### VisionStore change
Add `addVision(vision: Omit<Vision, 'id'>)` to the store.
ID generated with `Date.now().toString()`.

### API utility — `utils/generateVision.ts`
```ts
type GenerateVisionResult = {
  phrase: string;
  imageUrl: string;
};

export async function generateVision(description: string): Promise<GenerateVisionResult>
```

- Sends `POST /api/generate-vision` with `{ description }`.
- Until the endpoint exists, returns a **mock** after a 2s delay (hardcoded phrase + one of the existing local assets as a placeholder URL).
- Caller replaces the mock with real fetch when ready — no other code changes needed.

**Image handling in preview:** Since the real endpoint will return a URL (not a `require()` asset), the `Vision` type's `image` field needs to support both `number` (local asset) and `string` (remote URL). Update `Vision.image` to `number | string` and update `Image` source handling across `home.tsx` and `vision/[id].tsx` accordingly.

---

## UI

### FAB — `home.tsx`
- Bottom-right, above `insets.bottom + 24`
- Circle, 56×56, `Colors.accent` background
- `+` icon, white, 28px
- Navigates to `/vision/add`

### `input` state
- Dark background (`#0a0a0a`)
- Close button (✕) top-left
- Centered: headline "Beschreibe deine Vision", large multiline `TextInput` (placeholder: "Ein Haus am Meer, Freiheit, Erfolg…")
- Gold CTA button bottom: "Generieren"

### `loading` state
- Same dark background
- Centered white `ActivityIndicator` (size `large`)

### `preview` state
- Fullscreen image (`resizeMode="cover"`)
- Same top/bottom gradient overlays as `vision/[id].tsx`
- Close (✕) top-left
- Bottom: phrase (Playfair Bold Italic, 26px, white, centered)
- Two action buttons: "Hinzufügen" (Gold pill) + "Neu generieren" (transparent pill)

---

## Error Handling

- If `generateVision` throws, return to `input` state with a brief error message below the input ("Etwas ist schiefgelaufen. Bitte versuche es erneut.")
- No retry limit.

---

## Out of Scope

- Prompt history / suggestions
- Category selection
- Image cropping / editing before save
- Persistence (visions are still in-memory Zustand store)
