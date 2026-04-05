import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { generateVision, regenerateVision } from '@/utils/generateVision';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    Keyboard,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';

type ScreenState = 'input' | 'loading' | 'preview';

type GeneratedResult = {
    phrase: string;
    imageUrl: string;
    imageKey: string;
    visionId: string;
};

export default function AddVisionScreen() {
    const insets = useSafeAreaInsets();
    const addVision = useVisionStore((s) => s.addVision);
    const updateImage = useVisionStore((s) => s.updateImage);
    const userId = useUserDataStore((s) => s.userId);

    const [state, setState] = useState<ScreenState>('input');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<GeneratedResult | null>(null);
    const [savedPath, setSavedPath] = useState<string | null>(null);
    const [savedVisionId, setSavedVisionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasInstagram, setHasInstagram] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            Linking.canOpenURL('instagram://').then(setHasInstagram);
        } else {
            Share.isPackageInstalled('com.instagram.android').then(
                ({ isInstalled }) => setHasInstagram(isInstalled)
            );
        }
    }, []);

    // Fade-in animation for preview
    const previewOpacity = useRef(new Animated.Value(0)).current;
    const previewScale = useRef(new Animated.Value(0.95)).current;

    const animatePreviewIn = () => {
        Animated.parallel([
            Animated.timing(previewOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(previewScale, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setError(null);
        setState('loading');
        try {
            const existingPhrases = useVisionStore.getState().visions.map((v) => v.phrase).filter(Boolean);
            const generated = await generateVision(description.trim(), userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(
                generated.imageUrl,
                generated.imageKey
            );
            addVision({ id: generated.visionId, title: '', phrase: generated.phrase, category: generated.category as any, imagePath: relativePath, imageVersion: 1 });
            WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
            setResult(generated);
            setSavedPath(relativePath);
            setSavedVisionId(generated.visionId);
            setState('preview');
            animatePreviewIn();
        } catch {
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('input');
        }
    };

    const handleRegenerate = async () => {
        if (!savedVisionId) return;
        previewOpacity.setValue(0);
        previewScale.setValue(0.95);
        setState('loading');
        setError(null);
        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== savedVisionId)
                .map((v) => v.phrase)
                .filter(Boolean);
            const generated = await regenerateVision(savedVisionId, description.trim(), userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            updateImage(savedVisionId, relativePath);
            WidgetBridge.updateImage(relativePath, savedVisionId).catch(() => { });
            setSavedPath(relativePath);
            setState('preview');
            animatePreviewIn();
        } catch {
            setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
            setState('preview');
        }
    };

    const handleShare = async () => {
        if (!savedPath) return;
        const localUri = MediaHandler.toUri(savedPath);
        if (hasInstagram) {
            await Share.shareSingle({
                appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
                stickerImage: localUri,
                social: Share.Social.INSTAGRAM_STORIES as any,
                backgroundBottomColor: '#0a0a0a',
                backgroundTopColor: '#0a0a0a',
            });
        } else {
            await Share.open({ url: localUri });
        }
    };

    // ─── Input state ───────────────────────────────────────────────
    if (state === 'input') {
        return (
            <Pressable style={[styles.darkContainer]} onPress={Keyboard.dismiss}>
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
            </Pressable>
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
            {savedPath && (
                <Image
                    source={{ uri: MediaHandler.toUri(savedPath) }}
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
                <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                    <Text style={styles.shareText}>
                        {hasInstagram ? '📲  In Instagram Story teilen' : '📤  Teilen'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRegenerate} activeOpacity={0.7}>
                    <Text style={styles.regenText}>Neu generieren</Text>
                </TouchableOpacity>
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
    shareButton: {
        width: '100%',
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 16,
        alignItems: 'center',
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
