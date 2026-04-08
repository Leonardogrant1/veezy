import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OPTIONS = [
    { id: 'want_it', label: 'Ich will das' },
    { id: 'wild', label: 'Krass zu sehen' },
    { id: 'good', label: 'Fühlt sich gut an' },
    { id: 'not_yet', label: 'Noch nicht ganz meins' },
] as const;

type OptionId = typeof OPTIONS[number]['id'];

export function VisionReactionStep() {
    const { setCanContinue } = useOnboardingControl();
    const [selected, setSelected] = useState<OptionId | null>(null);

    function handleSelect(id: OptionId) {
        setSelected(id);
        setCanContinue(true);
    }

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <Text style={styles.headline}>Wie fühlt sich{'\n'}das an?</Text>
                <View style={styles.options}>
                    {OPTIONS.map((opt) => {
                        const isSelected = selected === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.option, isSelected && styles.optionSelected]}
                                onPress={() => handleSelect(opt.id)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
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
        paddingHorizontal: 28,
        gap: 32,
    },
    headline: {
        fontFamily: Fonts.serifBold,
        fontSize: 40,
        lineHeight: 50,
        color: Colors.textHeadline,
    },
    options: {
        gap: 12,
    },
    option: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(26,26,26,0.15)',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    optionSelected: {
        borderColor: '#1a1a1a',
        backgroundColor: '#1a1a1a',
    },
    optionText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: Colors.textHeadline,
    },
    optionTextSelected: {
        color: 'white',
    },
});
