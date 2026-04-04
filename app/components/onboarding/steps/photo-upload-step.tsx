import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PhotoUploadStep() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Deine Fotos</Text>
            <Text style={styles.subtitle}>
                Wir brauchen ein Gesichts- und Körperfoto um dich in deiner Zukunft zu zeigen.
            </Text>
            <View style={styles.boxes}>
                <TouchableOpacity style={styles.box} activeOpacity={0.7}>
                    <Text style={styles.boxIcon}>📷</Text>
                    <Text style={styles.boxLabel}>Gesicht</Text>
                    <Text style={styles.boxSub}>Frontal, gute Beleuchtung</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.box} activeOpacity={0.7}>
                    <Text style={styles.boxIcon}>🧍</Text>
                    <Text style={styles.boxLabel}>Körper</Text>
                    <Text style={styles.boxSub}>Ganzkörper, stehend</Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 36,
    },
    boxes: {
        flexDirection: 'row',
        gap: 14,
    },
    box: {
        flex: 1,
        aspectRatio: 0.75,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    boxIcon: {
        fontSize: 36,
    },
    boxLabel: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    boxSub: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        textAlign: 'center',
    },
});
