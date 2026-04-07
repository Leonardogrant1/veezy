import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { GlowPulse } from '@/components/layout/GlowPulse';
import { Fonts, Neutrals } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';

const MESSAGES = [
    'Deine Vision wird erschaffen...',
    'KI analysiert deine Zukunft...',
    'Das Universum arbeitet für dich...',
    'Dein Bild nimmt Form an...',
    'Visualisiere. Manifestiere. Lebe.',
    'Deine Zukunft existiert bereits...',
];

const SIZE = 320;

export default function VisionLoading() {
    const [messageIndex, setMessageIndex] = useState(0);
    const textOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => {
            Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
                setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
                Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            });
        }, 2800);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.glowContainer}>
                <GlowPulse size={SIZE} />
            </View>

            <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
                {MESSAGES[messageIndex]}
            </Animated.Text>

            <Text style={styles.subtext}>Das kann einige Sekunden dauern</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0F',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    glowContainer: {
        marginBottom: 16,
    },
    message: {
        fontFamily: Fonts.serifBold,
        fontSize: 20,
        color: Neutrals[3],
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 16,
    },
    subtext: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Neutrals[7],
        textAlign: 'center',
        letterSpacing: 0.3,
    },
});
