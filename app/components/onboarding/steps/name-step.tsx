import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';

export function NameStep() {
    const { setCanContinue } = useOnboardingControl();
    const [name, setName] = useState('');

    function handleChange(value: string) {
        setName(value);
        setCanContinue(value.trim().length >= 2);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wie heißt du?</Text>
            <Text style={styles.subtitle}>Wir personalisieren deine Erfahrung für dich.</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={handleChange}
                placeholder="Dein Name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
                autoFocus
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
        fontSize: 28,
        fontWeight: '600',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.25)',
        paddingVertical: 12,
    },
});
