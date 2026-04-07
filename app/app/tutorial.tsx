import PlusIcon from '@/assets/icons/plus.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import { TutorialOverlay } from '@/components/tutorial-overlay';
import { Colors, Fonts } from '@/constants/theme';
import { TutorialProvider, useTutorial } from '@/contexts/TutorialContext';
import { MediaHandler } from '@/lib/media-handler';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DUMMY_IMAGE = require('@/assets/images/dummy-vision-image.jpg');
const DUMMY_PHRASE = 'Ich lebe in meinem Traumhaus direkt am Strand in Bali und genieße jeden Tag die Schönheit der Natur und des Meeres.';
const DUMMY_CATEGORY = 'LIFESTYLE';

function PulseWrapper({ active, children }: { active: boolean; children: React.ReactNode }) {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (active) {
            pulse.setValue(1);
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
                ])
            );
            anim.start();
            return () => anim.stop();
        } else {
            pulse.setValue(1);
        }
    }, [active]);

    return (
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
            {children}
        </Animated.View>
    );
}

function TutorialContent() {
    const { step } = useTutorial();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const visions = useVisionStore((s) => s.visions);
    const firstVision = visions[0];
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        if (firstVision?.imagePath) {
            MediaHandler.resolveUri(firstVision.imagePath)
                .then(setImageUri)
                .catch(() => setImageUri(null));
        }
    }, [firstVision?.imagePath]);

    const phrase = firstVision?.phrase ?? DUMMY_PHRASE;
    const category = ((firstVision?.category as string) ?? DUMMY_CATEGORY).toUpperCase();

    return (
        <View style={styles.container}>
            {/* Background image */}
            <Image
                source={imageUri ? { uri: imageUri } : DUMMY_IMAGE}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            />

            {/* Gradients */}
            <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent']}
                style={[styles.topGradient, { height: insets.top + 80 }]}
                pointerEvents="none"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.95)']}
                style={styles.bottomGradient}
                pointerEvents="none"
            />

            {/* Top bar */}
            <View
                style={[styles.topBar, { paddingTop: insets.top + 12 }, step === 6 && styles.elevated]}
                pointerEvents="box-none"
            >
                <Text style={styles.logo}>veezy</Text>
                <PulseWrapper active={step === 6}>
                    <ProfileIcon width={34} height={34} />
                </PulseWrapper>
            </View>

            {/* Phrase card */}
            <View
                style={[styles.phraseContainer, { bottom: insets.bottom + 90 }, (step === 1 || step === 2) && styles.elevated]}
                pointerEvents="none"
            >
                <PulseWrapper active={step === 2}>
                    <View style={styles.phraseCard}>
                        <View style={styles.chevronButton}>
                            <Feather name="chevron-up" size={20} color="rgba(255,255,255,0.6)" />
                        </View>
                        <Text style={styles.category}>{category}</Text>
                        <Text style={styles.phrase}>{phrase}</Text>
                    </View>
                </PulseWrapper>
            </View>


            {/* Bottom bar */}
            <View
                style={[
                    styles.bottomBar,
                    { paddingBottom: insets.bottom + 24 },
                    (step === 4 || step === 5) && styles.elevated,
                ]}
                pointerEvents="none"
            >
                <PulseWrapper active={step === 5}>
                    <View style={styles.categorySelector}>
                        <Text style={styles.categoryText}>ALL</Text>
                    </View>
                </PulseWrapper>

                <PulseWrapper active={step === 4}>
                    <View style={styles.fab}>
                        <PlusIcon width={34} height={34} />
                    </View>
                </PulseWrapper>
            </View>

            {/* Tutorial overlay — rendered last, sits on top */}
            <TutorialOverlay />
        </View>
    );
}

export default function TutorialScreen() {
    const completeTutorial = useUserDataStore((s) => s.completeTutorial);

    function handleComplete() {
        completeTutorial();
        router.replace('/home');
    }

    return (
        <TutorialProvider onComplete={handleComplete}>
            <TutorialContent />
        </TutorialProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 500,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 12,
        zIndex: 1,
    },
    logo: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 24,
        letterSpacing: -0.5,
    },
    phraseContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 1,
    },
    phraseCard: {
        borderRadius: 18,
        overflow: 'hidden',
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 5,
    },
    chevronButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    category: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2.5,
    },
    phrase: {
        color: 'rgba(255,255,255,0.92)',
        fontFamily: Fonts.serifBold,
        fontSize: 22,
        lineHeight: 30,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        zIndex: 1,
    },
    categorySelector: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.accent,
    },
    categoryText: {
        color: 'white',
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        letterSpacing: 1,
    },
    fab: {
        width: 55,
        height: 55,
        borderRadius: 20,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    elevated: {
        zIndex: 20,
    },
});
