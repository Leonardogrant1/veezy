import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Logo from '@/assets/logo.svg';
import { Colors, Fonts } from '@/constants/theme';
import { changeLanguage } from '@/i18n';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useUserDataStore } from '@/stores/UserDataStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');
const BUTTON_W = SCREEN_W - 64;


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

// Langsamer Ken-Burns-Zoom auf dem Hintergrundbild
function useKenBurnsAnim() {
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.08, duration: 14000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return scale;
}

function SubscriptionStatus() {
    const { hasEntitlement, customerInfo } = useRevenueCat();
    const [copied, setCopied] = useState(false);
    const userId = customerInfo?.originalAppUserId;

    const copyUserId = async () => {
        if (!userId) return;
        await Clipboard.setStringAsync(userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <Text style={styles.debugStatusText}>
                💳 {hasEntitlement(PREMIUM_IDENTIFIER) ? 'Premium ✅' : 'Free ❌'}
            </Text>
            <TouchableOpacity onPress={copyUserId}>
                <Text style={styles.debugStatusText}>
                    🆔 {copied ? '✓ kopiert' : userId ?? '–'}
                </Text>
            </TouchableOpacity>
        </>
    );
}

export default function StartScreen() {
    const { t, i18n } = useTranslation();
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const showDevButtons = useUserDataStore((s) => s.showDevButtons);

    const bgScale = useKenBurnsAnim();
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
            {/* Full-bleed vision background with slow zoom */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
                <Image source={require('@/assets/onboarding-demo/demo-vision.png')} style={styles.bgImage} resizeMode="cover" />
            </Animated.View>
            {/* Scrim nimmt das Bild zurück, damit Text/CTA führen */}
            <View style={styles.scrim} />
            <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={[StyleSheet.absoluteFill, { bottom: undefined, height: 220 }]}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={[StyleSheet.absoluteFill, { top: undefined, height: SCREEN_H * 0.65 }]}
            />

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

            {__DEV__ && showDevButtons && (
                <View style={styles.debugContainer}>
                    <SubscriptionStatus />
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => {
                            useUserDataStore.setState({ hasOnboarded: true });
                            router.replace('/home');
                        }}
                    >
                        <Text style={styles.debugButtonText}>⚙ Skip to Home</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom-anchored content */}
            <View style={styles.content}>
                <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity }]}>
                    <Logo width={56} height={56} />
                </Animated.View>

                <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                    {t('start.title')}
                </Animated.Text>
                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }]}>
                    {t('start.subtitle')}
                </Animated.Text>
                <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity, transform: [{ translateY: buttonY }, { scale: buttonScale }] }]}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.replace('/onboarding');
                        }}
                        activeOpacity={0.85}
                    >
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
        backgroundColor: '#0a0a0a',
    },
    bgImage: {
        width: '100%',
        height: '100%',
    },
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
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
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    langButtonActive: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderColor: 'rgba(255,255,255,0.8)',
    },
    langFlag: { fontSize: 18 },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 64,
    },
    logoWrapper: {
        marginBottom: 24,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 42,
        lineHeight: 52,
        color: 'white',
        textAlign: 'center',
        marginBottom: 14,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 16,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        marginBottom: 40,
    },
    buttonWrapper: {
        alignSelf: 'stretch',
    },
    button: {
        backgroundColor: Colors.accent,
        paddingVertical: 17,
        borderRadius: 999,
        overflow: 'hidden',
        alignItems: 'center',
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
    debugContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        gap: 8,
        alignItems: 'flex-start',
        zIndex: 10,
    },
    debugButton: {
        backgroundColor: 'rgba(255,59,48,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    debugButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    debugStatusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
});
