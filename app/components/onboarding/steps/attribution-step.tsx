import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { SelectableRow } from '@/components/onboarding/selectable-row';
import { Colors, Fonts } from '@/constants/theme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';

// Kanäle mit Marken-Icons; labelKey nur wo übersetzt werden muss
const SOURCES: { value: string; icon: keyof typeof Ionicons.glyphMap; label?: string; labelKey?: string }[] = [
    { value: 'tiktok', icon: 'logo-tiktok', label: 'TikTok' },
    { value: 'instagram', icon: 'logo-instagram', label: 'Instagram' },
    { value: 'youtube', icon: 'logo-youtube', label: 'YouTube' },
    Platform.OS === 'android'
        ? { value: 'play_store', icon: 'logo-google-playstore', label: 'Play Store' }
        : { value: 'app_store', icon: 'logo-apple-appstore', label: 'App Store' },
    { value: 'friends', icon: 'people-outline', labelKey: 'onboarding.attribution.friends' },
    { value: 'x', icon: 'logo-x', label: 'X' },
    { value: 'other', icon: 'ellipsis-horizontal', labelKey: 'onboarding.attribution.other' },
];

export function AttributionStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const storedSource = useUserDataStore((s) => s.attributionSource);
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const [selected, setSelected] = useState<string | null>(storedSource);

    useEffect(() => {
        if (storedSource) setCanContinue(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function select(value: string) {
        setSelected(value);
        updateSettings({ attributionSource: value });
        setCanContinue(true);
        // $set schreibt die Quelle zusätzlich als PostHog-Person-Property —
        // bei mehrfachem Umwählen zählt so automatisch die letzte Auswahl
        trackerManager.track('onboarding_attribution_selected', {
            source: value,
            $set: { attribution_source: value },
        });
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('onboarding.attribution.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.attribution.subtitle')}</Text>

            <View style={styles.options}>
                {SOURCES.map((source, i) => (
                    <Animated.View
                        key={source.value}
                        entering={FadeInDown.delay(Math.min(360 + i * 80, 760)).duration(500).springify()}
                    >
                        <SelectableRow
                            label={source.label ?? t(source.labelKey!)}
                            icon={source.icon}
                            selected={selected === source.value}
                            onPress={() => select(source.value)}
                        />
                    </Animated.View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 30,
        color: Colors.textHeadline,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 21,
        marginBottom: 24,
    },
    options: {
        gap: 10,
    },
});
