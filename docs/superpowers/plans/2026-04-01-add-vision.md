# Add Vision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users describe a vision in free text, generate an image + phrase via AI, preview the result, and add it to the vision board.

**Architecture:** FAB on home opens `app/vision/add.tsx` as a fullscreen modal. That screen cycles through three states: `input → loading → preview`. A utility function `generateVision` handles the API call (mocked until the endpoint exists). `VisionStore` gains an `addVision` action. The `Vision.image` type widens from `number` to `number | string` to support remote URLs.

**Tech Stack:** React Native (Animated, ActivityIndicator), expo-router, Zustand, TypeScript

---

## Files

| Action   | Path                          | Responsibility                                      |
|----------|-------------------------------|-----------------------------------------------------|
| Modify   | `stores/VisionStore.ts`       | Widen `image` type, add `addVision` action          |
| Create   | `utils/generateVision.ts`     | API call (mocked) → returns `{ phrase, imageUrl }`  |
| Modify   | `app/_layout.tsx`             | Register `vision/add` as fullScreenModal            |
| Create   | `app/vision/add.tsx`          | Add Vision screen (input / loading / preview)       |
| Modify   | `app/home.tsx`                | Add FAB, fix `Image` source for `number | string`   |
| Modify   | `app/vision/[id].tsx`         | Fix `Image` source for `number | string`            |

---

## Task 1 — Widen Vision type and add `addVision`

**Files:**
- Modify: `stores/VisionStore.ts`

- [ ] **Step 1: Update `Vision` type and store**

Replace the entire file with:

```ts
import { create } from 'zustand';

export type Vision = {
  id: string;
  category: string;
  phrase: string;
  image: number | string; // require() asset OR remote URL
};

type VisionStore = {
  visions: Vision[];
  addVision: (vision: Omit<Vision, 'id'>) => void;
  updatePhrase: (id: string, phrase: string) => void;
  updateImage: (id: string, image: number | string) => void;
  deleteVision: (id: string) => void;
};

const DUMMY_VISIONS: Vision[] = [
  { id: '1', category: 'Karriere',   phrase: 'Ich bin ein erfolgreicher Unternehmer.',            image: require('@/assets/category-images/strength.jpg') },
  { id: '2', category: 'Gesundheit', phrase: 'Mein Körper ist stark und voller Energie.',         image: require('@/assets/category-images/endurance.jpeg') },
  { id: '3', category: 'Liebe',      phrase: 'Ich lebe in einer tiefen, liebevollen Beziehung.', image: require('@/assets/category-images/team.jpeg') },
  { id: '4', category: 'Finanzen',   phrase: 'Ich habe finanzielle Freiheit erreicht.',           image: require('@/assets/category-images/athletics.jpg') },
  { id: '5', category: 'Reisen',     phrase: 'Ich entdecke die Welt auf meinen eigenen Bedingungen.', image: require('@/assets/category-images/water.jpeg') },
  { id: '6', category: 'Lifestyle',  phrase: 'Ich lebe das Leben meiner Träume jeden Tag.',       image: require('@/assets/category-images/combat.jpg') },
];

export const useVisionStore = create<VisionStore>((set) => ({
  visions: DUMMY_VISIONS,
  addVision: (vision) => set((s) => ({
    visions: [...s.visions, { ...vision, id: Date.now().toString() }],
  })),
  updatePhrase: (id, phrase) => set((s) => ({ visions: s.visions.map((v) => v.id === id ? { ...v, phrase } : v) })),
  updateImage:  (id, image)  => set((s) => ({ visions: s.visions.map((v) => v.id === id ? { ...v, image }  : v) })),
  deleteVision: (id)         => set((s) => ({ visions: s.visions.filter((v) => v.id !== id) })),
}));
```

- [ ] **Step 2: Commit**

```bash
git add stores/VisionStore.ts
git commit -m "feat: widen Vision.image type and add addVision action"
```

---

## Task 2 — `generateVision` utility (mocked)

**Files:**
- Create: `utils/generateVision.ts`

- [ ] **Step 1: Create the file**

```ts
// utils/generateVision.ts
//
// Swap the mock body for a real fetch once the endpoint is ready.
// The call signature and return type stay the same.

export type GenerateVisionResult = {
  phrase: string;
  imageUrl: string;
};

export async function generateVision(description: string): Promise<GenerateVisionResult> {
  // --- MOCK (replace with real API call) ---
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    phrase: `Ich lebe ${description}.`,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  };
  // --- END MOCK ---

  // Real implementation (uncomment and fill in):
  // const response = await fetch('/api/generate-vision', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ description }),
  // });
  // if (!response.ok) throw new Error('Generation failed');
  // return response.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add utils/generateVision.ts
git commit -m "feat: add generateVision utility with mock"
```

---

## Task 3 — Register route + fix Image sources

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `app/home.tsx`
- Modify: `app/vision/[id].tsx`

- [ ] **Step 1: Register `vision/add` in `_layout.tsx`**

Inside `<Stack>`, after the `vision/[id]` entry, add:

```tsx
<Stack.Screen name="vision/add" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
```

- [ ] **Step 2: Fix `Image` source in `home.tsx`**

The `FlatList` render item uses `<Image source={item.image} .../>`. Since `item.image` is now `number | string`, fix the source prop:

```tsx
<Image
  source={typeof item.image === 'string' ? { uri: item.image } : item.image}
  style={StyleSheet.absoluteFill}
  resizeMode="cover"
/>
```

- [ ] **Step 3: Fix `Image` source in `vision/[id].tsx`**

Same fix for the fullscreen image at the top of the render:

```tsx
<Image
  source={typeof vision.image === 'string' ? { uri: vision.image } : vision.image}
  style={StyleSheet.absoluteFill}
  resizeMode="cover"
/>
```

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/home.tsx app/vision/[id].tsx
git commit -m "feat: register vision/add route, handle remote image URLs"
```

---

## Task 4 — `app/vision/add.tsx` screen

**Files:**
- Create: `app/vision/add.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Colors, Fonts } from '@/constants/theme';
import { useVisionStore } from '@/stores/VisionStore';
import { generateVision } from '@/utils/generateVision';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenState = 'input' | 'loading' | 'preview';

type GeneratedResult = {
    phrase: string;
    imageUrl: string;
};

export default function AddVisionScreen() {
    const insets = useSafeAreaInsets();
    const addVision = useVisionStore((s) => s.addVision);

    const [state, setState] = useState<ScreenState>('input');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<GeneratedResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fade-in animation for preview
    const previewOpacity = useRef(new Animated.Value(0)).current;
    const previewScale = useRef(new Animated.Value(0.95)).current;

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setError(null);
        setState('loading');
        try {
            const generated = await generateVision(description.trim());
            setResult(generated);
            setState('preview');
            Animated.parallel([
                Animated.timing(previewOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.timing(previewScale, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        } catch {
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('input');
        }
    };

    const handleRegenerate = async () => {
        previewOpacity.setValue(0);
        previewScale.setValue(0.95);
        setState('loading');
        setError(null);
        try {
            const generated = await generateVision(description.trim());
            setResult(generated);
            setState('preview');
            Animated.parallel([
                Animated.timing(previewOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.timing(previewScale, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        } catch {
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('preview');
        }
    };

    const handleAdd = () => {
        if (!result) return;
        addVision({ category: '', phrase: result.phrase, image: result.imageUrl });
        router.back();
    };

    // ─── Input state ───────────────────────────────────────────────
    if (state === 'input') {
        return (
            <View style={[styles.darkContainer]}>
                <TouchableOpacity
                    style={[styles.closeButton, { top: insets.top + 12 }]}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.inputContent}>
                    <Text style={styles.headline}>Beschreibe deine Vision</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ein Haus am Meer, Freiheit, Erfolg…"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        autoFocus
                        selectionColor={Colors.accent}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <TouchableOpacity
                    style={[styles.ctaButton, { marginBottom: insets.bottom + 32 }, !description.trim() && styles.ctaDisabled]}
                    onPress={handleGenerate}
                    disabled={!description.trim()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaText}>Generieren</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Loading state ─────────────────────────────────────────────
    if (state === 'loading') {
        return (
            <View style={styles.darkContainer}>
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }

    // ─── Preview state ─────────────────────────────────────────────
    return (
        <Animated.View style={[styles.darkContainer, { opacity: previewOpacity, transform: [{ scale: previewScale }] }]}>
            {result && (
                <Image
                    source={{ uri: result.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            )}

            {/* Top gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent']}
                style={[StyleSheet.absoluteFill, { bottom: undefined, height: 180 }]}
            />
            {/* Bottom gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={[StyleSheet.absoluteFill, { top: undefined, height: 300 }]}
            />

            <TouchableOpacity
                style={[styles.closeButton, { top: insets.top + 12 }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
                <Text style={styles.phrase}>{result?.phrase}</Text>
                <View style={styles.previewActions}>
                    <TouchableOpacity style={styles.regenButton} onPress={handleRegenerate} activeOpacity={0.7}>
                        <Text style={styles.regenText}>Neu generieren</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.85}>
                        <Text style={styles.addText}>Hinzufügen</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    darkContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        left: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    closeText: {
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.sansMedium,
    },
    inputContent: {
        width: '100%',
        paddingHorizontal: 28,
        gap: 20,
        alignItems: 'center',
    },
    headline: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 22,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        color: 'white',
        fontFamily: Fonts.sans,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        minHeight: 80,
    },
    errorText: {
        color: 'rgba(255,100,100,0.9)',
        fontFamily: Fonts.sans,
        fontSize: 13,
        textAlign: 'center',
    },
    ctaButton: {
        position: 'absolute',
        bottom: 0,
        left: 28,
        right: 28,
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 16,
        alignItems: 'center',
    },
    ctaDisabled: {
        opacity: 0.45,
    },
    ctaText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    // Preview
    previewBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 28,
        gap: 20,
    },
    phrase: {
        color: 'white',
        fontFamily: Fonts.serifBoldItalic,
        fontSize: 26,
        lineHeight: 36,
        textAlign: 'center',
    },
    previewActions: {
        flexDirection: 'row',
        gap: 12,
    },
    regenButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    regenText: {
        color: 'white',
        fontFamily: Fonts.sansMedium,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingHorizontal: 28,
        paddingVertical: 12,
    },
    addText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/vision/add.tsx
git commit -m "feat: add AddVisionScreen with input/loading/preview states"
```

---

## Task 5 — FAB on home screen

**Files:**
- Modify: `app/home.tsx`

- [ ] **Step 1: Add FAB**

Inside `HomeScreen`, after the `<FlatList>` and before the closing `</View>`, add:

```tsx
{/* FAB */}
<TouchableOpacity
    style={[styles.fab, { bottom: insets.bottom + 24 }]}
    activeOpacity={0.85}
    onPress={() => router.push('/vision/add')}
>
    <Text style={styles.fabIcon}>+</Text>
</TouchableOpacity>
```

Add to `StyleSheet.create`:

```ts
fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
},
fabIcon: {
    color: 'white',
    fontSize: 28,
    fontFamily: Fonts.sansBold,
    lineHeight: 32,
},
```

- [ ] **Step 2: Commit**

```bash
git add app/home.tsx
git commit -m "feat: add FAB to home screen for adding new visions"
```
