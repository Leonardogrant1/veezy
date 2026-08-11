import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Fonts, Gold } from '@/constants/theme';

const TIMELINE: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; bodyKey: string }[] = [
    { icon: 'lock-open', titleKey: 'onboarding.trial.timeline_0_title', bodyKey: 'onboarding.trial.timeline_0_body' },
    { icon: 'notifications', titleKey: 'onboarding.trial.timeline_1_title', bodyKey: 'onboarding.trial.timeline_1_body' },
    { icon: 'star', titleKey: 'onboarding.trial.timeline_2_title', bodyKey: 'onboarding.trial.timeline_2_body' },
];

/**
 * Trial-Timeline vor der Paywall: nimmt die Angst vor dem Abo, indem sie
 * zeigt, was wann passiert — inklusive Erinnerung vor Trial-Ende.
 */
export function TrialOfferStep() {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
                <Text style={styles.title}>{t('onboarding.trial.title')}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(240).duration(500).springify()}>
                <Text style={styles.subtitle}>{t('onboarding.trial.subtitle')}</Text>
            </Animated.View>

            {/* ── Timeline: Heute → Tag 2 → Tag 3 ── */}
            <View style={styles.timeline}>
                {TIMELINE.map((item, i) => {
                    const isFirst = i === 0;
                    const isLast = i === TIMELINE.length - 1;
                    return (
                        <Animated.View
                            key={item.titleKey}
                            entering={FadeInDown.delay(360 + i * 150).duration(500).springify()}
                            style={styles.tlRow}
                        >
                            <View style={styles.tlLeft}>
                                {isFirst ? (
                                    <LinearGradient
                                        colors={[Gold[400], Gold[600]]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.tlCircle}
                                    >
                                        <Ionicons name={item.icon} size={17} color="#fff" />
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.tlCircle, styles.tlCircleMuted]}>
                                        <Ionicons name={item.icon} size={17} color={Colors.accent} />
                                    </View>
                                )}
                                {!isLast && (
                                    <LinearGradient
                                        colors={[Colors.accent, `${Colors.accent}30`]}
                                        style={styles.tlLine}
                                    />
                                )}
                            </View>
                            <View style={[styles.tlBody, !isLast && styles.tlBodySpacing]}>
                                <Text style={styles.tlTitle}>{t(item.titleKey)}</Text>
                                <Text style={styles.tlText}>{t(item.bodyKey)}</Text>
                            </View>
                        </Animated.View>
                    );
                })}
            </View>

            <Animated.View entering={FadeInDown.delay(860).duration(500).springify()} style={styles.badge}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent} />
                <Text style={styles.badgeText}>{t('onboarding.trial.badge')}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingBottom: 24,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 36,
        lineHeight: 46,
        color: Colors.textHeadline,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textMuted,
        marginBottom: 36,
    },
    timeline: {
        marginBottom: 32,
    },
    tlRow: {
        flexDirection: 'row',
        gap: 16,
    },
    tlLeft: {
        alignItems: 'center',
        width: 38,
    },
    tlCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tlCircleMuted: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    tlLine: {
        width: 3,
        flex: 1,
        borderRadius: 2,
        marginVertical: 4,
    },
    tlBody: {
        flex: 1,
        gap: 3,
        paddingTop: 2,
    },
    tlBodySpacing: {
        paddingBottom: 28,
    },
    tlTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: Colors.textHeadline,
    },
    tlText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textMuted,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    badgeText: {
        flex: 1,
        fontFamily: Fonts.sans,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textMuted,
    },
});
