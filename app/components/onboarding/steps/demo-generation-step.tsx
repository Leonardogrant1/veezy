import body from '@/assets/face-photo-icons/body.svg';
import face_front from '@/assets/face-photo-icons/face_front.svg';
import face_left from '@/assets/face-photo-icons/face_left.svg';
import face_right from '@/assets/face-photo-icons/face_right.svg';
import face_smile from '@/assets/face-photo-icons/face_smile.svg';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const DEMO_FIGURE = require('@/assets/onboarding-demo/demo-figure.jpg');
const DEMO_VISION = require('@/assets/onboarding-demo/demo-vision.jpg');

const PHOTO_ICONS = [face_front, face_smile, face_left, face_right, body];

// Timing (ms)
const TILE_STAGGER = 260;
const HOLD_PHOTOS = 1100;
const FIGURE_LOADING = 1800;
const HOLD_FIGURE = 1600;
const VISION_LOADING = 1800;

type Phase = 'photos' | 'figure' | 'vision';

export function DemoGenerationStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const insets = useSafeAreaInsets();

    const [phase, setPhase] = useState<Phase>('photos');
    const [figureRevealed, setFigureRevealed] = useState(false);
    const [visionRevealed, setVisionRevealed] = useState(false);

    const tileAnims = useRef(PHOTO_ICONS.map(() => new Animated.Value(0))).current;
    const figureOpacity = useRef(new Animated.Value(0)).current;
    const visionOpacity = useRef(new Animated.Value(0)).current;
    const phraseOpacity = useRef(new Animated.Value(0)).current;
    const phraseTranslate = useRef(new Animated.Value(20)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

    function later(fn: () => void, ms: number) {
        timeouts.current.push(setTimeout(fn, ms));
    }

    useEffect(() => {
        Animated.stagger(
            TILE_STAGGER,
            tileAnims.map((a) =>
                Animated.timing(a, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true })
            )
        ).start(() => later(() => setPhase('figure'), HOLD_PHOTOS));
        return () => timeouts.current.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (phase === 'figure') {
            later(() => {
                setFigureRevealed(true);
                Animated.timing(figureOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true })
                    .start(() => later(() => setPhase('vision'), HOLD_FIGURE));
            }, FIGURE_LOADING);
        } else if (phase === 'vision') {
            later(() => {
                setVisionRevealed(true);
                Animated.sequence([
                    Animated.timing(visionOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    Animated.parallel([
                        Animated.timing(phraseOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                        Animated.timing(phraseTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    ]),
                    Animated.timing(buttonOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                ]).start();
            }, VISION_LOADING);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (phase === 'vision' && visionRevealed) {
        return (
            <View style={styles.container}>
                <Animated.Image source={DEMO_VISION} style={[StyleSheet.absoluteFill, { opacity: visionOpacity }]} resizeMode="cover" />
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
                            {PHOTO_ICONS.map((Icon, i) => (
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
                                    <Icon width={34} height={34} />
                                </Animated.View>
                            ))}
                        </View>
                    </>
                )}

                {phase === 'figure' && !figureRevealed && (
                    <View style={styles.loadingBlock}>
                        <ActivityIndicator color="white" size="large" />
                        <Text style={styles.loadingText}>{t('onboarding.demo.figure_loading')}</Text>
                    </View>
                )}

                {phase === 'figure' && figureRevealed && (
                    <>
                        <Text style={styles.title}>{t('onboarding.demo.figure_title')}</Text>
                        <Animated.Image source={DEMO_FIGURE} style={[styles.figureImage, { opacity: figureOpacity }]} resizeMode="cover" />
                        <Text style={styles.caption}>{t('onboarding.demo.figure_caption')}</Text>
                    </>
                )}

                {phase === 'vision' && !visionRevealed && (
                    <View style={styles.loadingBlock}>
                        <View style={styles.visionTextCard}>
                            <Text style={styles.visionText}>{t('onboarding.demo.vision_text')}</Text>
                        </View>
                        <ActivityIndicator color="white" size="large" />
                        <Text style={styles.loadingText}>{t('onboarding.demo.vision_loading')}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
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
        gap: 10,
        marginTop: 14,
    },
    tile: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingBlock: {
        alignItems: 'center',
        gap: 18,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sans,
        fontSize: 14,
    },
    figureImage: {
        width: 220,
        height: 300,
        borderRadius: 18,
    },
    caption: {
        color: 'rgba(255,255,255,0.45)',
        fontFamily: Fonts.sans,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    visionTextCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 18,
        paddingVertical: 14,
        marginBottom: 8,
    },
    visionText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.serifItalic,
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
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
