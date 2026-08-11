import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { SelectableRow } from '@/components/onboarding/selectable-row';
import { Colors, Fonts } from '@/constants/theme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';
import { AgeGroup } from '@/types/user-data';

const AGE_GROUPS: { value: AgeGroup; label?: string; labelKey?: string }[] = [
    { value: 'under_18', labelKey: 'onboarding.age.under_18' },
    { value: '18_24', label: '18–24' },
    { value: '25_34', label: '25–34' },
    { value: '35_44', label: '35–44' },
    { value: '45_54', label: '45–54' },
    { value: '55_plus', label: '55+' },
];

export function AgeStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const storedGroup = useUserDataStore((s) => s.ageGroup);
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const [selected, setSelected] = useState<AgeGroup | null>(storedGroup);

    useEffect(() => {
        if (storedGroup) setCanContinue(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function select(value: AgeGroup) {
        setSelected(value);
        updateSettings({ ageGroup: value });
        setCanContinue(true);
        trackerManager.track('onboarding_age_selected', {
            age_group: value,
            $set: { age_group: value },
        });
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('onboarding.age.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.age.subtitle')}</Text>

            <View style={styles.options}>
                {AGE_GROUPS.map((group, i) => (
                    <Animated.View
                        key={group.value}
                        entering={FadeInDown.delay(Math.min(360 + i * 80, 760)).duration(500).springify()}
                    >
                        <SelectableRow
                            label={group.label ?? t(group.labelKey!)}
                            selected={selected === group.value}
                            onPress={() => select(group.value)}
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
