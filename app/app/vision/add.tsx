import ShareIcon from '@/assets/icons/share.svg';
import VisionLoading from '@/components/layout/VisionLoading';
import { WatermarkedShareView } from '@/components/layout/WatermarkedShareView';
import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { VisionCategory } from '@/types/vision';
import { generateVision, regenerateVision } from '@/utils/generateVision';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

type ScreenState = 'input' | 'loading' | 'preview';

type GeneratedResult = {
    phrase: string;
    imageUrl: string;
    imageKey: string;
    visionId: string;
    category: string;
    affirmations: string[];
};

export default function AddVisionScreen() {
    const insets = useSafeAreaInsets();
    const addVision = useVisionStore((s) => s.addVision);
    const updateImage = useVisionStore((s) => s.updateImage);
    const userId = useUserDataStore((s) => s.userId);
    const motivationStyle = useUserDataStore((s) => s.motivationStyle);
    const { refreshGenerationCount } = useRevenueCat();

    const [state, setState] = useState<ScreenState>('input');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<GeneratedResult | null>(null);
    const [savedPath, setSavedPath] = useState<string | null>(null);
    const [savedVisionId, setSavedVisionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasInstagram, setHasInstagram] = useState(false);
    const shareViewRef = useRef<View>(null);

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

    useEffect(() => {
        if (Platform.OS === 'ios') {
            Linking.canOpenURL('instagram://').then(setHasInstagram);
        } else {
            Share.isPackageInstalled('com.instagram.android').then(
                ({ isInstalled }) => setHasInstagram(isInstalled)
            );
        }
    }, []);

    // Preview animations
    // Input animations
    const inputOpacity = useRef(new Animated.Value(1)).current;
    const inputTranslate = useRef(new Animated.Value(0)).current;

    // Loading animations
    const loadingOpacity = useRef(new Animated.Value(0)).current;

    // Preview animations
    const imageOpacity = useRef(new Animated.Value(0)).current;
    const phraseOpacity = useRef(new Animated.Value(0)).current;
    const phraseTranslate = useRef(new Animated.Value(20)).current;
    const buttonsOpacity = useRef(new Animated.Value(0)).current;
    const buttonsTranslate = useRef(new Animated.Value(16)).current;

    const animate = (anim: Animated.CompositeAnimation) =>
        new Promise<void>((resolve) => anim.start(() => resolve()));

    const animatePreviewIn = () => {
        imageOpacity.setValue(0);
        phraseOpacity.setValue(0);
        phraseTranslate.setValue(20);
        buttonsOpacity.setValue(0);
        buttonsTranslate.setValue(16);
        Animated.sequence([
            Animated.timing(imageOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(phraseOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(phraseTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(buttonsOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(buttonsTranslate, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();
    };

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setError(null);

        // 1. Keyboard schließen + Input wegfaden
        Keyboard.dismiss();
        await animate(Animated.parallel([
            Animated.timing(inputOpacity, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
            Animated.timing(inputTranslate, { toValue: -12, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]));

        // 2. Loading einblenden
        loadingOpacity.setValue(0);
        setState('loading');
        await animate(Animated.timing(loadingOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }));

        try {
            const existingPhrases = useVisionStore.getState().visions.map((v) => v.phrase).filter(Boolean);
            const generated = await generateVision(description.trim(), userId, existingPhrases, motivationStyle);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            addVision({ id: generated.visionId, title: '', phrase: generated.phrase, category: generated.category as VisionCategory, imagePath: relativePath, imageVersion: 1, affirmationsAffirmation: generated.affirmationsAffirmation, affirmationsFuel: generated.affirmationsFuel });
            WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
            refreshGenerationCount().catch(() => { });
            setResult(generated);
            setSavedPath(relativePath);
            setSavedVisionId(generated.visionId);

            // 3. Loading ausblenden → Preview
            await animate(Animated.timing(loadingOpacity, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }));
            if (useUserDataStore.getState().haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setState('preview');
            animatePreviewIn();
        } catch {
            await animate(Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }));
            inputOpacity.setValue(1);
            inputTranslate.setValue(0);
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('input');
        }
    };

    const handleRegenerate = async () => {
        if (!savedVisionId) return;
        setError(null);

        // Loading einblenden
        loadingOpacity.setValue(0);
        setState('loading');
        await animate(Animated.timing(loadingOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }));

        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== savedVisionId)
                .map((v) => v.phrase)
                .filter(Boolean);
            const generated = await regenerateVision(savedVisionId, description.trim(), userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            updateImage(savedVisionId, relativePath);
            WidgetBridge.updateImage(relativePath, savedVisionId).catch(() => { });
            refreshGenerationCount().catch(() => { });
            setSavedPath(relativePath);

            // Loading ausblenden → Preview
            await animate(Animated.timing(loadingOpacity, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }));
            setState('preview');
            animatePreviewIn();
        } catch {
            await animate(Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }));
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('preview');
        }
    };

    const handleShare = async () => {
        if (!savedPath || !shareViewRef.current) return;
        const watermarkedUri = await captureRef(shareViewRef, { format: 'png', quality: 1 });
        if (hasInstagram) {
            await Share.shareSingle({
                appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
                stickerImage: watermarkedUri,
                social: Share.Social.INSTAGRAM_STORIES as any,
                backgroundBottomColor: '#0a0a0a',
                backgroundTopColor: '#0a0a0a',
            });
        } else {
            await Share.open({ url: watermarkedUri });
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
                        <Text style={styles.headline}>Beschreibe deine Vision</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ein Haus am Meer, Freiheit, Erfolg…"
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
    if (state === 'loading') {
        return (
            <Animated.View style={[styles.darkContainer, { opacity: loadingOpacity }]}>
                <VisionLoading />
            </Animated.View>
        );
    }

    // ─── Preview state ─────────────────────────────────────────────
    return (
        <View style={styles.darkContainer}>
            {/* Off-screen watermarked view for capture */}
            {savedPath && (
                <View style={styles.offScreen}>
                    <WatermarkedShareView ref={shareViewRef} imageUri={MediaHandler.toUri(savedPath)} />
                </View>
            )}
            {savedPath && (
                <Animated.Image
                    source={{ uri: MediaHandler.toUri(savedPath) }}
                    style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}
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
                style={[StyleSheet.absoluteFill, { top: undefined, height: 500 }]}
            />

            <TouchableOpacity
                style={[styles.closeButton, { top: insets.top + 12 }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
                <Animated.View style={[styles.phraseCard, { opacity: phraseOpacity, transform: [{ translateY: phraseTranslate }] }]}>
                    <Text style={styles.category}>{(result?.category ?? '').toUpperCase()}</Text>
                    <Text style={styles.phrase}>{result?.phrase}</Text>
                </Animated.View>
                <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslate }] }]}>
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                        {hasInstagram ? (
                            <LottieView
                                source={require('@/assets/animations/instagram.json')}
                                autoPlay
                                loop={false}
                                style={styles.shareIcon}
                            />
                        ) : (
                            <View style={{ width: 22, height: 22, backgroundColor: 'white', borderRadius: 11, justifyContent: 'center', alignItems: 'center' }}>
                                <ShareIcon width={14} height={14} />
                            </View>
                        )}
                        <Text style={styles.shareText}>
                            {hasInstagram ? 'In Instagram Story teilen' : 'Teilen'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRegenerate} activeOpacity={0.7}>
                        <Text style={styles.regenText}>Neu generieren</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    darkContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    offScreen: {
        position: 'absolute',
        top: -9999,
        left: -9999,
        opacity: 0,
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
    // Preview
    previewBottom: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        alignItems: 'center',
        gap: 16,
    },
    phraseCard: {
        width: '100%',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 5,
    },
    category: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2.5,
    },
    phrase: {
        color: 'rgba(255,255,255,0.92)',
        fontFamily: Fonts.serifBold,
        fontSize: 22,
        lineHeight: 30,
    },
    buttonsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    shareButton: {
        width: '100%',
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    shareIcon: {
        width: 22,
        height: 22,
    },
    shareText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    regenText: {
        color: 'rgba(255,255,255,0.55)',
        fontFamily: Fonts.sansMedium,
        fontSize: 14,
    },
});
