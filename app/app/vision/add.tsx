import VisionLoading from '@/components/layout/VisionLoading';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { VisionCategory } from '@/types/vision';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { generateVision } from '@/utils/generateVision';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type ScreenState = 'input' | 'loading';

export default function AddVisionScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const addVision = useVisionStore((s) => s.addVision);
    const userId = useUserDataStore((s) => s.userId);
    const motivationStyle = useUserDataStore((s) => s.motivationStyle);
    const language = useUserDataStore((s) => s.language);

    const [state, setState] = useState<ScreenState>('input');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const focusOffset = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        Animated.timing(focusOffset, {
            toValue: -130,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const handleBlur = () => {
        Animated.timing(focusOffset, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    // Input animations
    const inputOpacity = useRef(new Animated.Value(1)).current;
    const inputTranslate = useRef(new Animated.Value(0)).current;

    // Loading animations
    const loadingOpacity = useRef(new Animated.Value(0)).current;

    const animate = (anim: Animated.CompositeAnimation) =>
        new Promise<void>((resolve) => anim.start(() => resolve()));

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
            // Scroll the feed to the new pending vision so the user sees it being created
            useVisionStore.getState().setFocusVisionId(generated.visionId);
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

    // ─── Input state ───────────────────────────────────────────────
    if (state === 'input') {
        return (
            <View style={styles.darkContainer}>
                <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />

                <TouchableOpacity
                    style={[styles.closeButton, { top: insets.top + 12 }]}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.innerContainer} pointerEvents="box-none">
                    <Animated.View style={[styles.inputContent, { opacity: inputOpacity, transform: [{ translateY: inputTranslate }, { translateY: focusOffset }] }]}>
                        <Text style={styles.headline}>{t('vision.add.headline')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('vision.add.placeholder')}
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            autoFocus
                            submitBehavior='blurAndSubmit'
                            returnKeyType="done"
                            onSubmitEditing={() => { if (description.trim()) handleGenerate(); }}
                            selectionColor={Colors.accent}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </Animated.View>
                </View>
            </View>
        );
    }

    // ─── Loading state ─────────────────────────────────────────────
    return (
        <Animated.View style={[styles.darkContainer, { opacity: loadingOpacity }]}>
            <VisionLoading />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    darkContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    innerContainer: {
        flex: 1,
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
});
