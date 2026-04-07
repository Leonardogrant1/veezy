import { Gold } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';

const GOLD_COLOR = Gold[500];

interface GlowPulseProps {
    size?: number;
}

export function GlowPulse({ size = 320 }: GlowPulseProps) {
    const pulse = useRef(new Animated.Value(0)).current;

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
    }, []);

    return (
        <Animated.View style={{ transform: [{ scale: glowScale }], opacity: glowOpacity }}>
            <Svg width={size} height={size}>
                <Defs>
                    <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%"   stopColor={GOLD_COLOR} stopOpacity="1" />
                        <Stop offset="25%"  stopColor={GOLD_COLOR} stopOpacity="0.6" />
                        <Stop offset="55%"  stopColor={GOLD_COLOR} stopOpacity="0.18" />
                        <Stop offset="78%"  stopColor={GOLD_COLOR} stopOpacity="0.05" />
                        <Stop offset="100%" stopColor={GOLD_COLOR} stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width={size} height={size} fill="url(#glow)" />
            </Svg>
        </Animated.View>
    );
}
