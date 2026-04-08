import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Logo from '@/assets/logo.svg';
import { Cream, Colors, Fonts, Gold } from '@/constants/theme';
import { changeLanguage } from '@/i18n';
import { useUserDataStore } from '@/stores/UserDataStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');
const BUTTON_W = 200;


function useShimmerAnim() {
    const x = useRef(new Animated.Value(-BUTTON_W)).current;
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(2800),
                Animated.parallel([
                    Animated.timing(x, {
                        toValue: BUTTON_W,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(scale, { toValue: 1.06, duration: 200, useNativeDriver: true }),
                        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
                    ]),
                ]),
                Animated.timing(x, { toValue: -BUTTON_W, duration: 0, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { x, scale };
}

function useFloatAnim(config: { distance: number; duration: number; delay?: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: config.distance,
                    duration: config.duration,
                    delay: config.delay ?? 0,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: -config.distance,
                    duration: config.duration,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: config.duration,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return anim;
}

export default function StartScreen() {
    const { t, i18n } = useTranslation();
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    // Blob float animations
    const blob1Y = useFloatAnim({ distance: 18, duration: 3200 });
    const blob1X = useFloatAnim({ distance: 12, duration: 4100, delay: 300 });
    const blob2Y = useFloatAnim({ distance: 22, duration: 3800, delay: 600 });
    const blob2X = useFloatAnim({ distance: 14, duration: 3500, delay: 100 });
    const blob3Y = useFloatAnim({ distance: 14, duration: 4400, delay: 800 });

    const { x: shimmerX, scale: buttonScale } = useShimmerAnim();

    // Content stagger
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleY = useRef(new Animated.Value(20)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const buttonY = useRef(new Animated.Value(20)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(subtitleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(subtitleY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(buttonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(buttonY, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
        ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLanguageToggle(lang: 'de' | 'en') {
        changeLanguage(lang);
        updateSettings({ language: lang });
    }

    const currentLang = i18n.language as 'de' | 'en';

    return (
        <View style={styles.container}>
            {/* Background image */}
            <Image source={require('@/assets/images/dummy-vision-image.jpg')} style={styles.bgImage} resizeMode="cover" />

            {/* Animated blobs */}
            <Animated.View style={[styles.blob, styles.blobTop, { transform: [{ translateY: blob1Y }, { translateX: blob1X }] }]} />
            <Animated.View style={[styles.blob, styles.blobBottom, { transform: [{ translateY: blob2Y }, { translateX: blob2X }] }]} />
            <Animated.View style={[styles.blob, styles.blobCenter, { transform: [{ translateY: blob3Y }] }]} />

            {/* Language picker — top right corner */}
            <View style={styles.languagePicker}>
                <TouchableOpacity
                    style={[styles.langButton, currentLang === 'de' && styles.langButtonActive]}
                    onPress={() => handleLanguageToggle('de')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.langFlag}>🇩🇪</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.langButton, currentLang === 'en' && styles.langButtonActive]}
                    onPress={() => handleLanguageToggle('en')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.langFlag}>🇬🇧</Text>
                </TouchableOpacity>
            </View>

            {__DEV__ && (
                <TouchableOpacity
                    style={styles.debugButton}
                    onPress={() => {
                        useUserDataStore.setState({ hasOnboarded: true });
                        router.replace('/home');
                    }}
                >
                    <Text style={styles.debugButtonText}>⚙ Skip to Home</Text>
                </TouchableOpacity>
            )}

            {/* Centered content */}
            <View style={styles.content}>
                <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity }]}>
                    <Logo width={64} height={64} />
                </Animated.View>

                <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                    {t('start.title')}
                </Animated.Text>
                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }]}>
                    {t('start.subtitle')}
                </Animated.Text>
                <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonY }, { scale: buttonScale }] }}>
                    <TouchableOpacity style={styles.button} onPress={() => router.replace('/onboarding')} activeOpacity={0.85}>
                        <Text style={styles.buttonText}>{t('start.cta')}</Text>
                        {/* Shimmer sweep */}
                        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] }]}>
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shimmerGradient}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Cream[400],
    },
    bgImage: {
        position: 'absolute',
        width: SCREEN_W,
        height: SCREEN_H,
        opacity: 0.13,
        top: 0,
        left: 0,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blobTop: {
        width: 380,
        height: 380,
        backgroundColor: Gold[400],
        top: -120,
        right: -100,
        opacity: 0.35,
    },
    blobBottom: {
        width: 320,
        height: 320,
        backgroundColor: Gold[300],
        bottom: -80,
        left: -80,
        opacity: 0.35,
    },
    blobCenter: {
        width: 200,
        height: 200,
        backgroundColor: Gold[500],
        top: '35%',
        left: '20%',
        opacity: 0.15,
    },
    languagePicker: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    langButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    langButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderColor: Colors.accent,
    },
    langFlag: { fontSize: 18 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoWrapper: {
        marginBottom: 32,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 42,
        lineHeight: 52,
        color: Colors.textHeadline,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 16,
        lineHeight: 24,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 48,
    },
    button: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 999,
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
    },
    shimmerGradient: {
        flex: 1,
        width: 60,
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    debugButton: {
        position: 'absolute',
        top: 60,
        left: 16,
        backgroundColor: 'rgba(255,59,48,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        zIndex: 10,
    },
    debugButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
