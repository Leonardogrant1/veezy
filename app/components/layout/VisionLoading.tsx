import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';

import { Fonts, Gold, Neutrals } from '@/constants/theme';
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
const GOLD_COLOR = Gold[500];

export default function VisionLoading() {
    const [messageIndex, setMessageIndex] = useState(0);
    const pulse = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(1)).current;

    const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] });
    const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

    useEffect(() => {
        const runPulse = () => {
            Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
                .start(({ finished }) => {
                    if (!finished) return;
                    if (useUserDataStore.getState().haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
                        .start(({ finished }) => { if (finished) runPulse(); });
                });
        };
        runPulse();

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
            <Animated.View style={[styles.glowContainer, { transform: [{ scale: glowScale }], opacity: glowOpacity }]}>
                <Svg width={SIZE} height={SIZE}>
                    <Defs>
                        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <Stop offset="0%"   stopColor={GOLD_COLOR} stopOpacity="1" />
                            <Stop offset="25%"  stopColor={GOLD_COLOR} stopOpacity="0.6" />
                            <Stop offset="55%"  stopColor={GOLD_COLOR} stopOpacity="0.18" />
                            <Stop offset="78%"  stopColor={GOLD_COLOR} stopOpacity="0.05" />
                            <Stop offset="100%" stopColor={GOLD_COLOR} stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width={SIZE} height={SIZE} fill="url(#glow)" />
                </Svg>
            </Animated.View>

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
