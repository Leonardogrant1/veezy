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
