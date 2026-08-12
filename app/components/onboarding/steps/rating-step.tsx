import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { useTranslation } from 'react-i18next';

import { Colors, Fonts, Gold } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';

function useFadeSlide(delay: number) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(16)).current;
    useEffect(() => {
        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
            ]).start();
        }, delay);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { opacity, transform: [{ translateY }] } as const;
}

export function RatingStep() {
    const { t } = useTranslation();
    const name = useUserDataStore((s) => s.name);
    const trimmedName = name.trim();

    const titleAnim = useFadeSlide(150);
    const badgeAnim = useFadeSlide(700);

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                if (await StoreReview.isAvailableAsync()) {
                    await StoreReview.requestReview();
                }
            } catch (e) {
                // silently ignore errors requesting review
            }
        }, 900);
        return () => clearTimeout(timer);
    }, []);

    const titleText = trimmedName
        ? t('onboarding.rating.title', { name: trimmedName })
        : t('onboarding.rating.title_no_name');

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <Animated.View style={titleAnim}>
                    <Text style={styles.title}>{titleText}</Text>
                    <Text style={styles.subtitle}>
                        {t('onboarding.rating.subtitle')}
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.badge, badgeAnim]}>
                    <Text style={styles.badgeIcon}>⭐</Text>
                    <Text style={styles.badgeText}>{t('onboarding.rating.badge')}</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 32,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 36,
        lineHeight: 46,
        color: Colors.textHeadline,
        marginBottom: 24,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        lineHeight: 24,
        color: Colors.textMuted,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(201,168,76,0.08)',
        borderWidth: 1,
        borderColor: Gold[300],
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    badgeIcon: {
        fontSize: 22,
    },
    badgeText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textMuted,
        flex: 1,
    },
});
