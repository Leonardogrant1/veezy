import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SlideToStart } from '@/components/slide-to-start';

export default function StartScreen() {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    const player = useVideoPlayer(require('@/assets/videos/start_screen.mp4'), (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                delay: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Video placeholder */}
            <View style={styles.videoPlaceholder}>
                <VideoView
                    player={player}
                    style={styles.absoluteFill}
                    contentFit="cover"
                    nativeControls={false}
                />
            </View>

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(13,13,13,0.6)', '#0d0d0d']}
                locations={[0, 0.5, 0.85]}
                style={styles.gradient}
            />

            {/* Animated content */}
            <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
                <Text style={styles.title}>Your daily dose{'\n'}of motivation</Text>
                <Text style={styles.subtitle}>Affirmations & quotes built{'\n'}for athletes who want more</Text>

                <SlideToStart onComplete={() => router.replace('/onboarding')} />
            </Animated.View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    videoPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoPlaceholderText: {
        color: 'rgba(255,255,255,0.1)',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 3,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    title: {
        color: 'white',
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 44,
        marginBottom: 12,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 36,
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
});
