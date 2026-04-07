import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import { PrimaryCategory } from '@/types/user-data';

const CATEGORIES: { id: PrimaryCategory; emoji: string; label: string; tagline: string }[] = [
    { id: 'wealth',    emoji: '💰', label: 'Wealth',    tagline: 'Finanzielle Freiheit & Erfolg' },
    { id: 'lifestyle', emoji: '✨', label: 'Lifestyle',  tagline: 'Dein Traumleben führen' },
    { id: 'body',      emoji: '💪', label: 'Body',       tagline: 'Körper & Gesundheit' },
    { id: 'mindset',   emoji: '🧠', label: 'Mindset',    tagline: 'Innere Stärke & Klarheit' },
];

export function CategoryStep() {
    const { nextStep } = useOnboardingControl();
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const selecting = useRef(false);

    function select(id: PrimaryCategory) {
        if (selecting.current) return;
        selecting.current = true;
        updateSettings({ primaryCategory: id });
        setTimeout(() => {
            nextStep();
        }, 150);
    }

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.title}>Jeder hat eine andere Vision.{'\n'}Was ist deine?</Text>

                <View style={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.card}
                            onPress={() => select(cat.id)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.emoji}>{cat.emoji}</Text>
                            <Text style={styles.label}>{cat.label}</Text>
                            <Text style={styles.tagline}>{cat.tagline}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
        paddingHorizontal: 24,
        gap: 28,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 30,
        lineHeight: 40,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    grid: {
        gap: 14,
    },
    card: {
        backgroundColor: 'rgba(180,150,80,0.12)',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(180,150,80,0.2)',
    },
    emoji: {
        fontSize: 26,
        marginBottom: 8,
    },
    label: {
        fontFamily: Fonts.sansBold,
        fontSize: 18,
        color: Colors.textHeadline,
        marginBottom: 2,
    },
    tagline: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Colors.textMuted,
    },
});
