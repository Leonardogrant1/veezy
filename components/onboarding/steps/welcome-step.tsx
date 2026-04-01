import { StyleSheet, Text, View } from 'react-native';

export function WelcomeStep() {
    return (
        <View style={styles.container}>
            <Text style={styles.eyebrow}>WILLKOMMEN BEI</Text>
            <Text style={styles.title}>veezy</Text>
            <Text style={styles.subtitle}>
                Visualisiere deine Zukunft.{'\n'}
                Manifestiere dein Traumleben.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    eyebrow: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2.5,
        marginBottom: 12,
    },
    title: {
        color: 'white',
        fontSize: 56,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 20,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 18,
        lineHeight: 28,
    },
});
