import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = {
    onComplete: () => void;
};

export function SlideToStart({ onComplete }: Props) {
    return (
        <TouchableOpacity style={styles.button} onPress={onComplete} activeOpacity={0.85}>
            <Text style={styles.text}>Loslegen →</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    text: {
        color: '#0d0d0d',
        fontSize: 16,
        fontWeight: '700',
    },
});
