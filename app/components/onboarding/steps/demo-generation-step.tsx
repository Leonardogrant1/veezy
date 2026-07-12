import VisionLoading from '@/components/layout/VisionLoading';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEMO_VISION = require('@/assets/onboarding-demo/demo-vision.png');

// Beispiel-Selfies der Demo-Figur — Platzhalter, werden später durch echte Assets ersetzt
const DEMO_SELFIES = [
    require('@/assets/onboarding-demo/selfies/front.png'),
    require('@/assets/onboarding-demo/selfies/right.png'),
    require('@/assets/onboarding-demo/selfies/left.png'),
    require('@/assets/onboarding-demo/selfies/smile.png')
];

// Timing (ms)
const TILE_STAGGER = 260;
const TYPE_INTERVAL = 45;
const VISION_LOADING = 3500;

type Phase = 'photos' | 'typing' | 'loading' | 'result';

export function DemoGenerationStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const insets = useSafeAreaInsets();

    const [phase, setPhase] = useState<Phase>('photos');
    const [typed, setTyped] = useState('');
    const [ctaVisible, setCtaVisible] = useState(false);

    const visionText = t('onboarding.demo.vision_text');

    const tileAnims = useRef(DEMO_SELFIES.map(() => new Animated.Value(0))).current;
    const visionOpacity = useRef(new Animated.Value(0)).current;
    const phraseOpacity = useRef(new Animated.Value(0)).current;
    const phraseTranslate = useRef(new Animated.Value(20)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const ctaOpacity = useRef(new Animated.Value(0)).current;
    const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

    function later(fn: () => void, ms: number) {
        timeouts.current.push(setTimeout(fn, ms));
    }

    function showCta() {
        setCtaVisible(true);
        Animated.timing(ctaOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }

    function advanceTo(next: Phase) {
        setCtaVisible(false);
        ctaOpacity.setValue(0);
        setPhase(next);
    }

    useEffect(() => {
        Animated.stagger(
            TILE_STAGGER,
            tileAnims.map((a) =>
                Animated.timing(a, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true })
            )
        ).start(() => showCta());
        const pending = timeouts.current;
        return () => pending.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Simuliertes Eintippen der Vision
    useEffect(() => {
        if (phase !== 'typing') return;
        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setTyped(visionText.slice(0, i));
            if (i >= visionText.length) {
                clearInterval(id);
                showCta();
            }
        }, TYPE_INTERVAL);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    useEffect(() => {
        if (phase === 'loading') {
            later(() => setPhase('result'), VISION_LOADING);
        } else if (phase === 'result') {
            Animated.sequence([
                Animated.timing(visionOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(phraseOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    Animated.timing(phraseTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                ]),
                Animated.timing(buttonOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        }
        const pending = timeouts.current;
        return () => pending.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (phase === 'loading') {
        return (
            <View style={styles.container}>
                <VisionLoading />
            </View>
        );
    }

    if (phase === 'result') {
        return (
            <View style={styles.container}>
                <Animated.Image source={DEMO_VISION} style={[styles.visionImage, { opacity: visionOpacity }]} />
                <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} style={[StyleSheet.absoluteFill, { bottom: undefined, height: 180 }]} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.80)']} style={[StyleSheet.absoluteFill, { top: undefined, height: 500 }]} />

                <View style={[styles.exampleBadge, { top: insets.top + 16 }]}>
                    <Text style={styles.exampleBadgeText}>{t('onboarding.demo.example_badge')}</Text>
                </View>

                <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
                    <Animated.View style={[styles.phraseCard, { opacity: phraseOpacity, transform: [{ translateY: phraseTranslate }] }]}>
                        <Text style={styles.category}>{t('onboarding.demo.category').toUpperCase()}</Text>
                        <Text style={styles.phrase}>{t('onboarding.demo.phrase')}</Text>
                    </Animated.View>
                    <Animated.View style={{ opacity: buttonOpacity }}>
                        <TouchableOpacity style={styles.continueButton} onPress={nextStep} activeOpacity={0.85}>
                            <Text style={styles.continueText}>{t('onboarding.demo.continue')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.centerContent, { paddingTop: insets.top + 24 }]}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('onboarding.demo.badge')}</Text>
                </View>

                {phase === 'photos' && (
                    <>
                        <Text style={styles.title}>{t('onboarding.demo.photos_title')}</Text>
                        <Text style={styles.subtext}>{t('onboarding.demo.photos_subtext')}</Text>
                        <View style={styles.tileRow}>
                            {DEMO_SELFIES.map((source, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.tile,
                                        {
                                            opacity: tileAnims[i],
                                            transform: [{ translateY: tileAnims[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                                        },
                                    ]}
                                >
                                    <Image source={source} style={styles.tileImage} resizeMode="cover" />
                                </Animated.View>
                            ))}
                        </View>
                    </>
                )}

                {phase === 'typing' && (
                    <>
                        <Text style={styles.title}>{t('onboarding.demo.typing_title')}</Text>
                        <View style={styles.visionTextCard}>
                            <Text style={styles.visionText}>
                                {typed}
                                {typed.length < visionText.length && <Text style={styles.cursor}>▍</Text>}
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {ctaVisible && (
                <Animated.View style={[styles.ctaFooter, { paddingBottom: insets.bottom + 32, opacity: ctaOpacity }]}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => advanceTo(phase === 'photos' ? 'typing' : 'loading')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueText}>
                            {t(phase === 'photos' ? 'onboarding.demo.photos_cta' : 'onboarding.demo.figure_cta')}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
    },
    visionImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 14,
    },
    badge: {
        position: 'absolute',
        top: 70,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        textAlign: 'center',
    },
    subtext: {
        color: 'rgba(255,255,255,0.55)',
        fontFamily: Fonts.sans,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },
    tileRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 14,
        alignSelf: 'stretch',
    },
    tile: {
        width: '46%',
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    tileImage: {
        width: '100%',
        height: '100%',
    },
    visionTextCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginTop: 8,
        minHeight: 80,
        alignSelf: 'stretch',
    },
    visionText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.serifItalic,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    cursor: {
        color: Colors.accent,
    },
    exampleBadge: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    exampleBadgeText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2,
    },
    previewBottom: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        gap: 16,
    },
    ctaFooter: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
    },
    phraseCard: {
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
    continueButton: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueText: {
        color: '#0d0d0d',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        fontWeight: '700',
    },
});
