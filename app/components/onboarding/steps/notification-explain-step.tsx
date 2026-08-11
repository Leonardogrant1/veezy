import { Fonts } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEMO_VISION = require('@/assets/onboarding-demo/demo-vision.png');
const APP_ICON = require('@/assets/images/icon.png');

export function NotificationExplainStep() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const bannerTranslate = useRef(new Animated.Value(-90)).current;
    const bannerOpacity = useRef(new Animated.Value(0)).current;
    const bannerScale = useRef(new Animated.Value(1)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(bannerScale, { toValue: 1.03, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(bannerScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        Animated.sequence([
            Animated.delay(500),
            Animated.parallel([
                Animated.timing(bannerOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.spring(bannerTranslate, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
            ]),
            Animated.timing(textOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start(() => pulse.start());
        return () => pulse.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.container}>
            <Image source={DEMO_VISION} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={25} />
            <View style={styles.dim} />
            <LinearGradient colors={['transparent', 'rgba(13,13,13,0.92)']} style={styles.bottomFade} />

            <View style={[styles.lockContent, { paddingTop: insets.top + 36 }]}>
                <Text style={styles.clock}>9:41</Text>
                <Animated.View
                    style={[
                        styles.banner,
                        { opacity: bannerOpacity, transform: [{ translateY: bannerTranslate }, { scale: bannerScale }] },
                    ]}
                >
                    <Image source={APP_ICON} style={styles.bannerIcon} />
                    <View style={styles.bannerTextWrap}>
                        <View style={styles.bannerHeader}>
                            <Text style={styles.bannerApp}>Veezy</Text>
                            <Text style={styles.bannerTime}>{t('onboarding.notification_explain.banner_time')}</Text>
                        </View>
                        <Text style={styles.bannerBody} numberOfLines={2}>
                            {t('onboarding.demo.phrase')}
                        </Text>
                    </View>
                </Animated.View>
            </View>

            <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
                <Text style={styles.title}>{t('onboarding.notification_explain.title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.notification_explain.subtitle')}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    dim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 260,
    },
    lockContent: {
        alignItems: 'stretch',
        paddingHorizontal: 20,
        gap: 28,
    },
    clock: {
        color: 'rgba(255,255,255,0.95)',
        fontFamily: Fonts.sans,
        fontSize: 56,
        textAlign: 'center',
        letterSpacing: 1,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(40,40,40,0.85)',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    bannerIcon: {
        width: 38,
        height: 38,
        borderRadius: 9,
    },
    bannerTextWrap: {
        flex: 1,
        gap: 2,
    },
    bannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerApp: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
    },
    bannerTime: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Fonts.sans,
        fontSize: 12,
    },
    bannerBody: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sans,
        fontSize: 13,
        lineHeight: 18,
    },
    textBlock: {
        position: 'absolute',
        left: 28,
        right: 28,
        bottom: 24,
        gap: 10,
    },
    title: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
});
