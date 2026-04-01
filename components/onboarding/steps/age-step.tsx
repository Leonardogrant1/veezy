import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function AgeStep() {
    const { setCanContinue } = useOnboardingControl();
    const [age, setAge] = useState('');

    function handleChange(value: string) {
        const numeric = value.replace(/[^0-9]/g, '');
        setAge(numeric);
        const n = parseInt(numeric, 10);
        setCanContinue(!isNaN(n) && n >= 13 && n <= 99);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wie alt bist du?</Text>
            <Text style={styles.subtitle}>Dein Alter hilft uns, passende Visionen zu erstellen.</Text>
            <TextInput
                style={styles.input}
                value={age}
                onChangeText={handleChange}
                placeholder="25"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                textAlign="center"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 32,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 40,
    },
    input: {
        color: 'white',
        fontSize: 64,
        fontWeight: '700',
        paddingVertical: 12,
    },
});
