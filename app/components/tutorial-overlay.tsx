import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/assets/logo.svg';
import { Colors, Fonts } from '@/constants/theme';
import { useTutorial } from '@/contexts/TutorialContext';

// Steps 1–6: tooltip card content
const CARD_STEPS: Record<number, { title: string; body: string; cta: string }> = {
    1: {
        title: 'Deine Vision',
        body: 'Sieh dein zukünftiges Leben — nicht als Idee, sondern als Realität. Deine Vision, jeden Tag vor deinen Augen.',
        cta: 'Weiter',
    },
    2: {
        title: 'Bearbeite deine Vision',
        body: 'Tippe auf deine Vision, um sie zu bearbeiten, zu teilen oder eine neue Version deines Lebens zu erschaffen.',
        cta: 'Weiter',
    },
    3: {
        title: 'Wische durch deine Visionen',
        body: 'Ein Swipe nach oben und du tauchst in dein nächstes Zukunftsbild ein — Schritt für Schritt näher an dein Ziel.',
        cta: 'Weiter',
    },
    4: {
        title: 'Bringe deine Vision zum Leben',
        body: 'Beschreibe, was du willst — und sieh dich selbst genau dort. Deine Zukunft beginnt hier.',
        cta: 'Weiter',
    },
    5: {
        title: 'Wähle eine Kategorie',
        body: 'Wähle, worauf du dich konzentrierst — Erfolg, Körper, Mindset. Dein Fokus bestimmt dein Leben.',
        cta: 'Weiter',
    },
    6: {
        title: 'Dein System',
        body: 'Gestalte deine Umgebung so, dass sie dich jeden Tag daran erinnert, wer du werden willst.',
        cta: 'Weiter',
    },
};

// Reusable stagger animation
function useStaggerAnims(count: number) {
    const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

    function play() {
        anims.forEach((a) => a.setValue(0));
        Animated.stagger(
            110,
            anims.map((a) => Animated.timing(a, { toValue: 1, duration: 450, useNativeDriver: true }))
        ).start();
    }

    return { anims, play };
}

function animStyle(anim: Animated.Value, offset = 20) {
    return {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
    };
}

// ─── Full-screen overlay steps ────────────────────────────────────────────────

function WelcomeStep({ nextStep }: { nextStep: () => void }) {
    const { anims, play } = useStaggerAnims(4);
    useEffect(() => { play(); }, []);

    return (
        <View style={styles.fullScreen}>
            <Animated.View style={animStyle(anims[0])}>
                <Logo width={80} height={80} />
            </Animated.View>
            <Animated.Text style={[styles.fullTitle, animStyle(anims[1])]}>
                Willkommen bei veezy
            </Animated.Text>
            <Animated.Text style={[styles.fullBody, animStyle(anims[2])]}>
                Dein persönliches Vision Board. KI-generierte Bilder, die dich täglich an deine Ziele erinnern.
            </Animated.Text>
            <Animated.View style={animStyle(anims[3])}>
                <TouchableOpacity style={styles.ctaButton} onPress={nextStep} activeOpacity={0.85}>
                    <Text style={styles.ctaText}>Los geht's</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function NotificationsStep({ nextStep }: { nextStep: () => void }) {
    const { anims, play } = useStaggerAnims(4);
    useEffect(() => { play(); }, []);

    return (
        <View style={styles.fullScreen}>
            <Animated.View style={animStyle(anims[0])}>
                <LottieView
                    source={require('@/assets/animations/notifications.json')}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                />
            </Animated.View>
            <Animated.Text style={[styles.fullTitle, animStyle(anims[1])]}>
                Tägliche Erinnerungen
            </Animated.Text>
            <Animated.Text style={[styles.fullBody, animStyle(anims[2])]}>
                Wir halten dich auf Kurs mit täglichen Erinnerungen an deine Visionen.
            </Animated.Text>
            <Animated.View style={animStyle(anims[3])}>
                <TouchableOpacity style={styles.ctaButton} onPress={nextStep} activeOpacity={0.85}>
                    <Text style={styles.ctaText}>Weiter</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function WidgetStep({ nextStep }: { nextStep: () => void }) {
    const { anims, play } = useStaggerAnims(4);
    useEffect(() => { play(); }, []);

    return (
        <View style={styles.fullScreen}>
            <Animated.View style={animStyle(anims[0])}>
                <LottieView
                    source={require('@/assets/animations/widget.json')}
                    autoPlay
                    loop={false}
                    style={styles.lottieWide}
                />
            </Animated.View>
            <Animated.Text style={[styles.fullTitle, animStyle(anims[1])]}>
                Dein veezy Widget
            </Animated.Text>
            <Animated.Text style={[styles.fullBody, animStyle(anims[2])]}>
                Füge das Widget deinem Homescreen hinzu — so hast du deine Vision immer im Blick, auch ohne die App zu öffnen.
            </Animated.Text>
            <Animated.View style={animStyle(anims[3])}>
                <TouchableOpacity style={styles.ctaButton} onPress={nextStep} activeOpacity={0.85}>
                    <Text style={styles.ctaText}>Weiter</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function ReadyStep({ nextStep }: { nextStep: () => void }) {
    const { anims, play } = useStaggerAnims(3);
    useEffect(() => { play(); }, []);

    return (
        <View style={styles.fullScreen}>
            <Animated.Text style={[styles.readyTitle, animStyle(anims[0])]}>
                Du bist bereit.
            </Animated.Text>
            <Animated.Text style={[styles.fullBody, animStyle(anims[1])]}>
                Erstelle jetzt deine erste Vision und starte durch.
            </Animated.Text>
            <Animated.View style={animStyle(anims[2])}>
                <TouchableOpacity style={styles.ctaButtonLarge} onPress={nextStep} activeOpacity={0.85}>
                    <Text style={styles.ctaTextLarge}>Erste Vision erstellen</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ─── Animated tooltip card (steps 1–6) ────────────────────────────────────────

function TooltipCard({ step, nextStep }: { step: number; nextStep: () => void }) {
    const insets = useSafeAreaInsets();
    const data = CARD_STEPS[step];

    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        cardAnim.setValue(0);
        Animated.timing(cardAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }, [step]);

    if (!data) return null;

    const totalSteps = 9;
    return (
        <Animated.View
            style={[
                styles.cardContainer,
                { top: insets.top + 60, left: 16, right: 16 },
                {
                    opacity: cardAnim,
                    transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                },
            ]}
            pointerEvents="box-none"
        >
            <View style={styles.card}>
                <View style={styles.dotsRow}>
                    {Array.from({ length: totalSteps - 1 }, (_, i) => (
                        <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive]} />
                    ))}
                </View>
                <Text style={styles.cardTitle}>{data.title}</Text>
                <Text style={styles.cardBody}>{data.body}</Text>
                <TouchableOpacity style={styles.ctaButton} onPress={nextStep} activeOpacity={0.85}>
                    <Text style={styles.ctaText}>{data.cta}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function TutorialOverlay() {
    const { step, nextStep } = useTutorial();

    const isFullScreen = [0, 7, 8, 9].includes(step);
    const backdropOpacity = isFullScreen ? 0.92 : 0.72;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={[styles.backdrop, { backgroundColor: `rgba(0,0,0,${backdropOpacity})` }]} pointerEvents="none" />

            {step === 0 && <WelcomeStep nextStep={nextStep} />}
            {step >= 1 && step <= 6 && <TooltipCard step={step} nextStep={nextStep} />}
            {step === 7 && <NotificationsStep nextStep={nextStep} />}
            {step === 8 && <WidgetStep nextStep={nextStep} />}
            {step === 9 && <ReadyStep nextStep={nextStep} />}
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    // Full-screen steps
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        gap: 18,
    },
    fullTitle: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        textAlign: 'center',
    },
    readyTitle: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 36,
        textAlign: 'center',
    },
    fullBody: {
        color: 'rgba(255,255,255,0.75)',
        fontFamily: Fonts.sans,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    lottie: {
        width: 280,
        height: 160,
    },
    lottieWide: {
        width: 340,
        height: 220,
    },
    // CTA buttons
    ctaButton: {
        backgroundColor: 'white',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 999,
        marginTop: 4,
    },
    ctaText: {
        color: '#111',
        fontFamily: Fonts.sansBold,
        fontSize: 16,
    },
    ctaButtonLarge: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 999,
        marginTop: 4,
    },
    ctaTextLarge: {
        color: 'white',
        fontFamily: Fonts.sansBold,
        fontSize: 17,
    },
    // Tooltip card
    cardContainer: {
        position: 'absolute',
        zIndex: 25,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 2,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.borderDivider,
    },
    dotActive: {
        backgroundColor: Colors.accent,
        width: 14,
    },
    cardTitle: {
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        color: Colors.textHeadline,
    },
    cardBody: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.text,
        lineHeight: 21,
    },
});
