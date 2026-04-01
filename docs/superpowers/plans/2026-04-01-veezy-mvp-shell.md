# Veezy MVP Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Discipl app shell with a clickable Veezy MVP — updated start screen, 10-step dummy onboarding, and a Vision Board Grid home screen.

**Architecture:** Reuse the existing `OnboardingProgressWrapper` / `OnboardingControlContext` / `types.ts` infrastructure. Delete all Discipl-specific step components and replace them with new Veezy step components. Replace `home.tsx` with a 2-column FlatList grid. No data persistence in this phase — Zustand in-memory only.

**Tech Stack:** Expo / React Native, expo-router, expo-linear-gradient, react-native-safe-area-context, Zustand (existing), TypeScript

---

## File Map

| Action | Path |
|---|---|
| Modify | `app/start.tsx` — update title + subtitle text |
| Modify | `app/onboarding.tsx` — replace all step imports + ONBOARDING_STEPS array |
| Replace | `app/home.tsx` — full rewrite as Vision Board Grid |
| Create | `components/onboarding/steps/welcome-step.tsx` |
| Create | `components/onboarding/steps/vision-input-step.tsx` |
| Create | `components/onboarding/steps/goals-step.tsx` |
| Create | `components/onboarding/steps/name-step.tsx` |
| Create | `components/onboarding/steps/age-step.tsx` |
| Create | `components/onboarding/steps/gender-step.tsx` |
| Create | `components/onboarding/steps/photo-upload-step.tsx` |
| Create | `components/onboarding/steps/manifestation-pitch-step.tsx` |
| Create | `components/onboarding/steps/generate-image-step.tsx` |
| Create | `components/onboarding/steps/paywall-step.tsx` |
| Delete | All Discipl step files listed in Task 1 |

**Unchanged:** `app/index.tsx`, `app/tutorial.tsx`, `app/_layout.tsx`, `components/onboarding/onboarding-progress-wrapper.tsx`, `components/onboarding/onboarding-control-context.tsx`, `components/onboarding/types.ts`

---

## Task 1: Delete Discipl step components

**Files:**
- Delete: `components/onboarding/steps/activity-step.tsx`
- Delete: `components/onboarding/steps/add-widget-step.tsx`
- Delete: `components/onboarding/steps/affirmations-familiarity-step.tsx`
- Delete: `components/onboarding/steps/age-step.tsx`
- Delete: `components/onboarding/steps/champions-step.tsx`
- Delete: `components/onboarding/steps/commitment-step.tsx`
- Delete: `components/onboarding/steps/gender-step.tsx`
- Delete: `components/onboarding/steps/goal-step.tsx`
- Delete: `components/onboarding/steps/habit-step.tsx`
- Delete: `components/onboarding/steps/name-step.tsx`
- Delete: `components/onboarding/steps/notification-schedule-step.tsx`
- Delete: `components/onboarding/steps/notifications-step.tsx`
- Delete: `components/onboarding/steps/rating-step.tsx`
- Delete: `components/onboarding/steps/referral-step.tsx`
- Delete: `components/onboarding/steps/tracking-step.tsx`
- Delete: `components/onboarding/steps/trial-offer-step.tsx`
- Delete: `components/onboarding/steps/trial-reminder-step.tsx`
- Delete: `components/onboarding/steps/welcome-step.tsx`
- Delete: `components/onboarding/steps/what-you-will-get-step.tsx`

- [ ] **Step 1: Delete all Discipl step files**

```bash
rm components/onboarding/steps/activity-step.tsx \
   components/onboarding/steps/add-widget-step.tsx \
   components/onboarding/steps/affirmations-familiarity-step.tsx \
   components/onboarding/steps/age-step.tsx \
   components/onboarding/steps/champions-step.tsx \
   components/onboarding/steps/commitment-step.tsx \
   components/onboarding/steps/gender-step.tsx \
   components/onboarding/steps/goal-step.tsx \
   components/onboarding/steps/habit-step.tsx \
   components/onboarding/steps/name-step.tsx \
   components/onboarding/steps/notification-schedule-step.tsx \
   components/onboarding/steps/notifications-step.tsx \
   components/onboarding/steps/rating-step.tsx \
   components/onboarding/steps/referral-step.tsx \
   components/onboarding/steps/tracking-step.tsx \
   components/onboarding/steps/trial-offer-step.tsx \
   components/onboarding/steps/trial-reminder-step.tsx \
   components/onboarding/steps/welcome-step.tsx \
   components/onboarding/steps/what-you-will-get-step.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove Discipl onboarding step components"
```

---

## Task 2: Update start screen copy

**Files:**
- Modify: `app/start.tsx`

- [ ] **Step 1: Update title and subtitle**

In `app/start.tsx`, find and replace these two lines:

```tsx
// Before:
<Text style={styles.title}>Your daily dose{'\n'}of motivation</Text>
<Text style={styles.subtitle}>Affirmations & quotes built{'\n'}for athletes who want more</Text>

// After:
<Text style={styles.title}>Manifest your{'\n'}future</Text>
<Text style={styles.subtitle}>See yourself living{'\n'}your dream life</Text>
```

- [ ] **Step 2: Verify — run the app and navigate to `/start`**

```bash
npx expo start --ios
```

Expected: Start screen shows "Manifest your future" title and updated subtitle. SlideToStart still works.

- [ ] **Step 3: Commit**

```bash
git add app/start.tsx
git commit -m "feat: update start screen copy for Veezy"
```

---

## Task 3: Create WelcomeStep

**Files:**
- Create: `components/onboarding/steps/welcome-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, Text, View } from 'react-native';

export function WelcomeStep() {
    return (
        <View style={styles.container}>
            <Text style={styles.eyebrow}>WILLKOMMEN BEI</Text>
            <Text style={styles.title}>veezy</Text>
            <Text style={styles.subtitle}>
                Visualisiere deine Zukunft.{'\n'}
                Manifestiere dein Traumleben.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2.5,
        marginBottom: 12,
    },
    title: {
        color: 'white',
        fontSize: 56,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 20,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 18,
        lineHeight: 28,
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/steps/welcome-step.tsx
git commit -m "feat: add WelcomeStep for Veezy onboarding"
```

---

## Task 4: Create VisionInputStep

**Files:**
- Create: `components/onboarding/steps/vision-input-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function VisionInputStep() {
    const { setCanContinue } = useOnboardingControl();
    const [text, setText] = useState('');

    function handleChange(value: string) {
        setText(value);
        setCanContinue(value.trim().length >= 10);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wo siehst du dich{'\n'}in 5 Jahren?</Text>
            <Text style={styles.subtitle}>Beschreibe deine Vision so konkret wie möglich.</Text>
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={handleChange}
                placeholder="Ich lebe in..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                textAlignVertical="top"
                maxLength={500}
            />
            <Text style={styles.counter}>{text.length}/500</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 28,
    },
    input: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 16,
        height: 180,
    },
    counter: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 8,
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/steps/vision-input-step.tsx
git commit -m "feat: add VisionInputStep for Veezy onboarding"
```

---

## Task 5: Create GoalsStep

**Files:**
- Create: `components/onboarding/steps/goals-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

const DUMMY_GOALS = [
    { id: '1', label: 'Karriere', emoji: '💼', description: 'Beförderung und finanzielle Freiheit' },
    { id: '2', label: 'Gesundheit', emoji: '💪', description: 'Fit, stark und voller Energie' },
    { id: '3', label: 'Beziehungen', emoji: '❤️', description: 'Tiefe und bedeutungsvolle Verbindungen' },
    { id: '4', label: 'Reisen', emoji: '✈️', description: 'Die Welt erleben und entdecken' },
    { id: '5', label: 'Persönlichkeit', emoji: '🌱', description: 'Wachstum und Selbstverwirklichung' },
];

export function GoalsStep() {
    const { setCanContinue } = useOnboardingControl();
    const [selected, setSelected] = useState<string[]>(['1', '2', '3']);

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((s) => s !== id)
            : [...selected, id];
        setSelected(next);
        setCanContinue(next.length > 0);
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Deine Ziele</Text>
            <Text style={styles.subtitle}>
                Basierend auf deiner Vision haben wir diese Bereiche identifiziert. Passe sie an.
            </Text>
            {DUMMY_GOALS.map((goal) => (
                <TouchableOpacity
                    key={goal.id}
                    style={[styles.card, selected.includes(goal.id) && styles.cardSelected]}
                    onPress={() => toggle(goal.id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.emoji}>{goal.emoji}</Text>
                    <View style={styles.cardText}>
                        <Text style={styles.cardLabel}>{goal.label}</Text>
                        <Text style={styles.cardDesc}>{goal.description}</Text>
                    </View>
                    <View style={[styles.check, selected.includes(goal.id) && styles.checkActive]}>
                        {selected.includes(goal.id) && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    emoji: {
        fontSize: 24,
        marginRight: 14,
    },
    cardText: {
        flex: 1,
    },
    cardLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    cardDesc: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        marginTop: 2,
    },
    check: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkActive: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    checkMark: {
        color: '#0d0d0d',
        fontSize: 12,
        fontWeight: '700',
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/steps/goals-step.tsx
git commit -m "feat: add GoalsStep for Veezy onboarding"
```

---

## Task 6: Create NameStep, AgeStep, GenderStep

**Files:**
- Create: `components/onboarding/steps/name-step.tsx`
- Create: `components/onboarding/steps/age-step.tsx`
- Create: `components/onboarding/steps/gender-step.tsx`

- [ ] **Step 1: Create name-step.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function NameStep() {
    const { setCanContinue } = useOnboardingControl();
    const [name, setName] = useState('');

    function handleChange(value: string) {
        setName(value);
        setCanContinue(value.trim().length >= 2);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wie heißt du?</Text>
            <Text style={styles.subtitle}>Wir personalisieren deine Erfahrung für dich.</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={handleChange}
                placeholder="Dein Name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
                autoFocus
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 40,
    },
    input: {
        color: 'white',
        fontSize: 28,
        fontWeight: '600',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.25)',
        paddingVertical: 12,
    },
});
```

- [ ] **Step 2: Create age-step.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function AgeStep() {
    const { setCanContinue } = useOnboardingControl();
    const [age, setAge] = useState('');

    function handleChange(value: string) {
        const numeric = value.replace(/[^0-9]/g, '');
        setAge(numeric);
        const n = parseInt(numeric, 10);
        setCanContinue(!isNaN(n) && n >= 13 && n <= 99);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wie alt bist du?</Text>
            <Text style={styles.subtitle}>Dein Alter hilft uns, passende Visionen zu erstellen.</Text>
            <TextInput
                style={styles.input}
                value={age}
                onChangeText={handleChange}
                placeholder="25"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                textAlign="center"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 40,
    },
    input: {
        color: 'white',
        fontSize: 64,
        fontWeight: '700',
        paddingVertical: 12,
    },
});
```

- [ ] **Step 3: Create gender-step.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

const OPTIONS = [
    { value: 'Male', label: 'Mann' },
    { value: 'Female', label: 'Frau' },
    { value: 'Other', label: 'Divers' },
    { value: 'Prefer not to say', label: 'Keine Angabe' },
] as const;

export function GenderStep() {
    const { setCanContinue } = useOnboardingControl();
    const [selected, setSelected] = useState<string | null>(null);

    function select(value: string) {
        setSelected(value);
        setCanContinue(true);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dein Geschlecht</Text>
            <Text style={styles.subtitle}>Wir passen das generierte Bild an dich an.</Text>
            <View style={styles.options}>
                {OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.option, selected === opt.value && styles.optionSelected]}
                        onPress={() => select(opt.value)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 36,
    },
    options: {
        gap: 12,
    },
    option: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionSelected: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'white',
    },
    optionText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 17,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: 'white',
    },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/onboarding/steps/name-step.tsx \
        components/onboarding/steps/age-step.tsx \
        components/onboarding/steps/gender-step.tsx
git commit -m "feat: add NameStep, AgeStep, GenderStep for Veezy onboarding"
```

---

## Task 7: Create PhotoUploadStep and ManifestationPitchStep

**Files:**
- Create: `components/onboarding/steps/photo-upload-step.tsx`
- Create: `components/onboarding/steps/manifestation-pitch-step.tsx`

- [ ] **Step 1: Create photo-upload-step.tsx**

```tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PhotoUploadStep() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Deine Fotos</Text>
            <Text style={styles.subtitle}>
                Wir brauchen ein Gesichts- und Körperfoto um dich in deiner Zukunft zu zeigen.
            </Text>
            <View style={styles.boxes}>
                <TouchableOpacity style={styles.box} activeOpacity={0.7}>
                    <Text style={styles.boxIcon}>📷</Text>
                    <Text style={styles.boxLabel}>Gesicht</Text>
                    <Text style={styles.boxSub}>Frontal, gute Beleuchtung</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.box} activeOpacity={0.7}>
                    <Text style={styles.boxIcon}>🧍</Text>
                    <Text style={styles.boxLabel}>Körper</Text>
                    <Text style={styles.boxSub}>Ganzkörper, stehend</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 36,
    },
    boxes: {
        flexDirection: 'row',
        gap: 14,
    },
    box: {
        flex: 1,
        aspectRatio: 0.75,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    boxIcon: {
        fontSize: 36,
    },
    boxLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    boxSub: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        textAlign: 'center',
    },
});
```

- [ ] **Step 2: Create manifestation-pitch-step.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function ManifestationPitchStep() {
    const { setCanContinue } = useOnboardingControl();
    const [text, setText] = useState('');

    function handleChange(value: string) {
        setText(value);
        setCanContinue(value.trim().length >= 20);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dein Traumalltag</Text>
            <Text style={styles.subtitle}>
                Beschreibe wie dein perfekter Tag in 5 Jahren aussieht. Je konkreter, desto besser.
            </Text>
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={handleChange}
                placeholder="Ich wache auf und..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                textAlignVertical="top"
                maxLength={300}
            />
            <Text style={styles.counter}>{text.length}/300</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    input: {
        color: 'white',
        fontSize: 16,
        lineHeight: 24,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: 16,
        height: 180,
    },
    counter: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 8,
    },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/steps/photo-upload-step.tsx \
        components/onboarding/steps/manifestation-pitch-step.tsx
git commit -m "feat: add PhotoUploadStep and ManifestationPitchStep for Veezy onboarding"
```

---

## Task 8: Create GenerateImageStep

**Files:**
- Create: `components/onboarding/steps/generate-image-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

const PLACEHOLDER_IMAGE = require('@/assets/category-images/endurance.jpeg');

const LOADING_MESSAGES = [
    'Vision wird analysiert...',
    'Deine Zukunft wird visualisiert...',
    'Bild wird generiert...',
    'Fast fertig...',
];

export function GenerateImageStep() {
    const { setCanContinue } = useOnboardingControl();
    const [messageIndex, setMessageIndex] = useState(0);
    const [done, setDone] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setCanContinue(false);
        let index = 0;
        const interval = setInterval(() => {
            index += 1;
            if (index >= LOADING_MESSAGES.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setDone(true);
                    setCanContinue(true);
                    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                }, 800);
            } else {
                setMessageIndex(index);
            }
        }, 900);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            {!done ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingTitle}>KI generiert{'\n'}dein Bild...</Text>
                    <Text style={styles.loadingMessage}>{LOADING_MESSAGES[messageIndex]}</Text>
                </View>
            ) : (
                <Animated.View style={[styles.resultContainer, { opacity }]}>
                    <Text style={styles.resultTitle}>Deine Vision ✨</Text>
                    <Image source={PLACEHOLDER_IMAGE} style={styles.image} resizeMode="cover" />
                    <Text style={styles.resultSub}>So könnte deine Zukunft aussehen</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
        justifyContent: 'center',
    },
    loadingContainer: {
        gap: 16,
    },
    loadingTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
    },
    loadingMessage: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
    },
    resultContainer: {
        alignItems: 'center',
        gap: 16,
    },
    resultTitle: {
        color: 'white',
        fontSize: 26,
        fontWeight: '700',
    },
    image: {
        width: '100%',
        height: 340,
        borderRadius: 20,
    },
    resultSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/steps/generate-image-step.tsx
git commit -m "feat: add GenerateImageStep with animated loading for Veezy onboarding"
```

---

## Task 9: Create PaywallStep

**Files:**
- Create: `components/onboarding/steps/paywall-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

const PLANS = [
    { id: 'weekly', label: 'Wöchentlich', price: '4,99€', period: '/ Woche', highlight: false, badge: null },
    { id: 'monthly', label: 'Monatlich', price: '9,99€', period: '/ Monat', highlight: true, badge: null },
    { id: 'yearly', label: 'Jährlich', price: '39,99€', period: '/ Jahr', highlight: false, badge: 'Bestes Angebot' },
] as const;

export function PaywallStep() {
    const { nextStep } = useOnboardingControl();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Starte deine{'\n'}Transformation</Text>
            <Text style={styles.subtitle}>3 Tage kostenlos. Jederzeit kündbar.</Text>
            <View style={styles.plans}>
                {PLANS.map((plan) => (
                    <TouchableOpacity
                        key={plan.id}
                        style={[styles.plan, plan.highlight && styles.planHighlight]}
                        activeOpacity={0.7}
                        onPress={nextStep}
                    >
                        {plan.badge && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{plan.badge}</Text>
                            </View>
                        )}
                        <Text style={[styles.planLabel, plan.highlight && styles.planLabelHighlight]}>
                            {plan.label}
                        </Text>
                        <Text style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                            {plan.price}
                        </Text>
                        <Text style={[styles.planPeriod, plan.highlight && styles.planPeriodHighlight]}>
                            {plan.period}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.trialButton} onPress={nextStep} activeOpacity={0.85}>
                <Text style={styles.trialButtonText}>3 Tage kostenlos starten</Text>
            </TouchableOpacity>
            <Text style={styles.legal}>Danach 9,99€/Monat. Jederzeit kündbar.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginBottom: 28,
    },
    plans: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    plan: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: 'transparent',
        minHeight: 110,
        justifyContent: 'center',
    },
    planHighlight: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'white',
    },
    badge: {
        backgroundColor: 'white',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
    },
    badgeText: {
        color: '#0d0d0d',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    planLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '600',
    },
    planLabelHighlight: {
        color: 'white',
    },
    planPrice: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    planPriceHighlight: {
        color: 'white',
    },
    planPeriod: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
    },
    planPeriodHighlight: {
        color: 'rgba(255,255,255,0.7)',
    },
    trialButton: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    trialButtonText: {
        color: '#0d0d0d',
        fontSize: 16,
        fontWeight: '700',
    },
    legal: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 12,
    },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/steps/paywall-step.tsx
git commit -m "feat: add PaywallStep for Veezy onboarding"
```

---

## Task 10: Wire up onboarding.tsx

**Files:**
- Modify: `app/onboarding.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { useMemo } from 'react';
import { OnboardingProgressWrapper } from '@/components/onboarding/onboarding-progress-wrapper';
import { AgeStep } from '@/components/onboarding/steps/age-step';
import { GenerateImageStep } from '@/components/onboarding/steps/generate-image-step';
import { GenderStep } from '@/components/onboarding/steps/gender-step';
import { GoalsStep } from '@/components/onboarding/steps/goals-step';
import { ManifestationPitchStep } from '@/components/onboarding/steps/manifestation-pitch-step';
import { NameStep } from '@/components/onboarding/steps/name-step';
import { PaywallStep } from '@/components/onboarding/steps/paywall-step';
import { PhotoUploadStep } from '@/components/onboarding/steps/photo-upload-step';
import { VisionInputStep } from '@/components/onboarding/steps/vision-input-step';
import { WelcomeStep } from '@/components/onboarding/steps/welcome-step';
import { OnboardingStep } from '@/components/onboarding/types';

export default function OnboardingScreen() {
    const ONBOARDING_STEPS = useMemo<OnboardingStep[]>(() => [
        {
            component: WelcomeStep,
            showProgressIndicator: false,
        },
        {
            component: VisionInputStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: GoalsStep,
            continueButtonText: 'Bestätigen',
            initialCanContinue: false,
        },
        {
            component: NameStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: AgeStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: GenderStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: PhotoUploadStep,
            continueButtonText: 'Weiter',
        },
        {
            component: ManifestationPitchStep,
            continueButtonText: 'Weiter',
            initialCanContinue: false,
        },
        {
            component: GenerateImageStep,
            continueButtonText: 'Wow, weiter!',
            initialCanContinue: false,
            showProgressIndicator: false,
        },
        {
            component: PaywallStep,
            showProgressIndicator: false,
            showContinueButton: false,
        },
    ], []);

    return <OnboardingProgressWrapper steps={ONBOARDING_STEPS} />;
}
```

- [ ] **Step 2: Verify — run app and start onboarding**

```bash
npx expo start --ios
```

Navigate to `/start`, slide to start, confirm all 10 steps render with correct progress bar. Tapping "Continue" on the last step (PaywallStep calls `nextStep()` directly) should redirect to `/home`.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: wire up Veezy onboarding flow with 10 steps"
```

---

## Task 11: Replace home.tsx with Vision Board Grid

**Files:**
- Modify: `app/home.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DUMMY_VISIONS = [
    {
        id: '1',
        category: 'Karriere',
        affirmation: 'Ich bin ein erfolgreicher Unternehmer.',
        image: require('@/assets/category-images/strength.jpg'),
    },
    {
        id: '2',
        category: 'Gesundheit',
        affirmation: 'Mein Körper ist stark und voller Energie.',
        image: require('@/assets/category-images/endurance.jpeg'),
    },
    {
        id: '3',
        category: 'Liebe',
        affirmation: 'Ich lebe in einer tiefen, liebevollen Beziehung.',
        image: require('@/assets/category-images/team.jpeg'),
    },
    {
        id: '4',
        category: 'Finanzen',
        affirmation: 'Ich habe finanzielle Freiheit erreicht.',
        image: require('@/assets/category-images/athletics.jpg'),
    },
    {
        id: '5',
        category: 'Reisen',
        affirmation: 'Ich entdecke die Welt auf meinen eigenen Bedingungen.',
        image: require('@/assets/category-images/water.jpeg'),
    },
    {
        id: '6',
        category: 'Lifestyle',
        affirmation: 'Ich lebe das Leben meiner Träume jeden Tag.',
        image: require('@/assets/category-images/combat.jpg'),
    },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>
                <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Vision Board Grid */}
            <FlatList
                data={DUMMY_VISIONS}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={[
                    styles.grid,
                    { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 20 },
                ]}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
                        <Image source={item.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={[StyleSheet.absoluteFill, { top: '35%' }]}
                        />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                            <Text style={styles.cardAffirmation} numberOfLines={3}>
                                {item.affirmation}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#0d0d0d',
    },
    logo: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 4,
    },
    settingsIcon: {
        fontSize: 20,
    },
    grid: {
        paddingHorizontal: 12,
    },
    row: {
        gap: 10,
        marginBottom: 10,
    },
    card: {
        flex: 1,
        aspectRatio: 0.72,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    cardContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 12,
    },
    cardCategory: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    cardAffirmation: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        fontStyle: 'italic',
    },
});
```

- [ ] **Step 2: Verify — navigate to home**

```bash
npx expo start --ios
```

Expected: Home screen shows 2-column grid with 6 vision cards. Each card has a background image, gradient overlay, category label, and affirmation text. Logo and settings icon visible in top bar.

- [ ] **Step 3: Commit**

```bash
git add app/home.tsx
git commit -m "feat: replace home screen with Veezy Vision Board Grid"
```

---

## Task 12: Full flow verification

- [ ] **Step 1: Reset onboarding state and run full flow**

In the running app, if `hasCompletedOnboarding` is already `true` in Zustand (from previous testing), use the dev tools or restart the app in a fresh simulator to force the `/start` → `/onboarding` → `/home` path.

Alternatively, temporarily add a debug button in `home.tsx` footer:
```tsx
// Add below the FlatList, for dev only:
{__DEV__ && (
    <TouchableOpacity
        style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(255,59,48,0.85)', padding: 10, borderRadius: 8 }}
        onPress={() => {
            useUserDataStore.getState().completeOnboarding(); // resets if method exists
            // or: useUserDataStore.setState({ hasCompletedOnboarding: false });
            router.replace('/start');
        }}
    >
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>⚙ Reset</Text>
    </TouchableOpacity>
)}
```

Import `router` from `expo-router` and `useUserDataStore` from `@/stores/UserDataStore` for the dev button.

- [ ] **Step 2: Walk through each screen**

Verify in order:
1. `/start` — "Manifest your future" title, slide-to-start works
2. Step 1 WelcomeStep — "veezy" title, Continue enabled immediately
3. Step 2 VisionInputStep — Continue disabled until 10+ chars typed
4. Step 3 GoalsStep — 3 goals pre-selected, toggle works, Continue enabled
5. Step 4 NameStep — Continue disabled until 2+ chars
6. Step 5 AgeStep — Continue disabled until valid age (13–99)
7. Step 6 GenderStep — Continue disabled until option selected
8. Step 7 PhotoUploadStep — Two placeholder boxes visible, Continue enabled
9. Step 8 ManifestationPitchStep — Continue disabled until 20+ chars
10. Step 9 GenerateImageStep — Loading messages cycle, image fades in, Continue unlocks
11. Step 10 PaywallStep — 3 pricing cards, "3 Tage kostenlos starten" navigates to `/home`
12. `/home` — Vision Board Grid with 6 cards visible

- [ ] **Step 3: Commit dev button if added**

```bash
git add app/home.tsx
git commit -m "chore: add dev reset button to home screen"
```
