import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Fonts } from '@/constants/theme';

// Matthews (2015), Dominican University of California: Zielerreichung
// ~43% (Ziele nur im Kopf) vs. ~76% (festgehalten + regelmäßig überprüft)
const WITHOUT_PCT = 43;
const WITH_PCT = 76;
const CHART_HEIGHT = 170;

export function ScienceStep() {
    const { t } = useTranslation();

    const growAnim = useRef(new Animated.Value(0)).current;
    const labelOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(650),
            // Höhen-Animation läuft nicht über den Native-Driver
            Animated.timing(growAnim, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(labelOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function barHeight(pct: number) {
        return growAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, (pct / 100) * CHART_HEIGHT],
        });
    }

    return (
        <View style={styles.container}>
            <Reanimated.View entering={FadeInDown.delay(150).duration(500).springify()}>
                <Text style={styles.title}>{t('onboarding.science.title')}</Text>
            </Reanimated.View>
            <Reanimated.View entering={FadeInDown.delay(300).duration(500).springify()}>
                <Text style={styles.body}>{t('onboarding.science.body')}</Text>
            </Reanimated.View>

            <Reanimated.View entering={FadeInDown.delay(450).duration(500).springify()} style={styles.card}>
                <View style={styles.chart}>
                    <View style={styles.barColumn}>
                        <Animated.Text style={[styles.barValue, styles.barValueMuted, { opacity: labelOpacity }]}>
                            {WITHOUT_PCT}%
                        </Animated.Text>
                        <Animated.View style={[styles.bar, styles.barWithout, { height: barHeight(WITHOUT_PCT) }]} />
                    </View>
                    <View style={styles.barColumn}>
                        <Animated.Text style={[styles.barValue, { opacity: labelOpacity }]}>
                            {WITH_PCT}%
                        </Animated.Text>
                        <Animated.View style={[styles.bar, styles.barWith, { height: barHeight(WITH_PCT) }]} />
                    </View>
                </View>
                <View style={styles.baseline} />
                <View style={styles.legendRow}>
                    <Text style={styles.legendLabel}>{t('onboarding.science.bar_without')}</Text>
                    <Text style={styles.legendLabel}>{t('onboarding.science.bar_with')}</Text>
                </View>
                <Text style={styles.source}>{t('onboarding.science.source')}</Text>
            </Reanimated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 28,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 30,
        color: Colors.textHeadline,
        marginBottom: 10,
    },
    body: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 21,
        marginBottom: 24,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        padding: 20,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
        height: CHART_HEIGHT + 30,
    },
    barColumn: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    barValue: {
        fontFamily: Fonts.sansBold,
        fontSize: 20,
        color: Colors.textHeadline,
    },
    barValueMuted: {
        color: Colors.textMuted,
    },
    bar: {
        width: 72,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    barWithout: {
        backgroundColor: Colors.borderDivider,
    },
    barWith: {
        backgroundColor: Colors.accent,
    },
    baseline: {
        height: 1.5,
        backgroundColor: Colors.borderDivider,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 10,
    },
    legendLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        color: Colors.textMuted,
        textAlign: 'center',
        width: 130,
        lineHeight: 15,
    },
    source: {
        fontFamily: Fonts.serifItalic,
        fontSize: 11,
        color: Colors.textMuted,
        lineHeight: 16,
        marginTop: 16,
    },
});
