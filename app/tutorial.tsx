import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BallIcon from '@/assets/icons/ball.svg';
import UserIcon from '@/assets/icons/user.svg';
import { getRandomSportImage } from '@/assets/sports-images';
import { TutorialOverlay } from '@/components/tutorial-overlay';
import { Fonts } from '@/constants/theme';
import { TutorialProvider, useTutorial } from '@/contexts/TutorialContext';
import { useUserDataStore } from '@/stores/UserDataStore';


const DUMMY_QUOTES = [
    { id: '1', text: '"Disziplin ist die Brücke zwischen Zielen und Leistung."', category: 'discipline' },
    { id: '2', text: '"Erfolg ist die Summe kleiner Anstrengungen, Tag für Tag wiederholt."', category: 'mindset' },
];

function PulseWrapper({ active, children }: { active: boolean; children: React.ReactNode }) {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (active) {
            pulse.setValue(1);
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
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
    const { step, nextStep } = useTutorial();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);

    const images = useMemo(() => {
        const recent: number[] = [];
        return DUMMY_QUOTES.map(() => {
            const img = getRandomSportImage([], recent);
            recent.push(img);
            return img;
        });
    }, []);

    const scrollY = useRef(new Animated.Value(0)).current;
    const quoteOpacity = useRef(new Animated.Value(1)).current;

    const swipeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(swipeAnim, { toValue: -8, duration: 600, useNativeDriver: true }),
                Animated.timing(swipeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0]) setCurrentIndex(viewableItems[0].index ?? 0);
    });

    // Trigger nextStep when user swiped to second quote
    useEffect(() => {
        if (currentIndex === 1 && step === 4) {
            nextStep();
        }
    }, [currentIndex]);

    const currentQuote = DUMMY_QUOTES[currentIndex];

    return (
        <View style={styles.container}>
            {/* Scrolling background — identical to home.tsx */}
            <Animated.FlatList
                data={DUMMY_QUOTES}
                keyExtractor={(item) => item.id}
                pagingEnabled
                scrollEnabled={step === 4}
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                decelerationRate="fast"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onScrollBeginDrag={() =>
                    Animated.timing(quoteOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start()
                }
                onMomentumScrollEnd={() =>
                    Animated.timing(quoteOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start()
                }
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={({ index }) => (
                    <View style={[styles.card, { height }]}>
                        <Animated.Image
                            source={images[index]}
                            style={[
                                styles.bgImage,
                                {
                                    top: -insets.top,
                                    height: height + insets.top + insets.bottom,
                                    transform: [{ translateY: Animated.subtract(scrollY, index * height) }],
                                    opacity: scrollY.interpolate({
                                        inputRange: [(index - 1) * height, index * height, (index + 1) * height],
                                        outputRange: [0, 1, 0],
                                        extrapolate: 'clamp',
                                    }),
                                },
                            ]}
                            resizeMode="cover"
                        />
                    </View>
                )}
            />

            {/* Fixed overlay + quote — identical to home.tsx */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[StyleSheet.absoluteFill, styles.overlay]} />
            </View>
            <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity }]} pointerEvents="none">
                <Text style={[styles.quoteText, { fontFamily: Fonts?.serif }]}>{currentQuote.text}</Text>
            </Animated.View>

            {/* Fixed UI — same structure as home.tsx fixedOverlay */}
            <View style={styles.fixedOverlay} pointerEvents="box-none">
                {/* Top bar */}
                <View style={styles.topBar} pointerEvents="box-none">
                    {/* Sports button — highlighted at step 3 */}
                    <TouchableOpacity
                        style={[styles.iconButton, { zIndex: step === 3 ? 20 : 1 }]}
                        onPress={step === 3 ? nextStep : undefined}
                        activeOpacity={step === 3 ? 0.7 : 1}
                    >
                        <PulseWrapper active={step === 3}>
                            <BallIcon width={22} height={22} color="white" />
                        </PulseWrapper>
                    </TouchableOpacity>

                    <View style={styles.heartsRowSpacer} />

                    {/* Settings button — highlighted at step 2 */}
                    <TouchableOpacity
                        style={[styles.iconButton, { zIndex: step === 2 ? 20 : 1 }]}
                        onPress={step === 2 ? nextStep : undefined}
                        activeOpacity={step === 2 ? 0.7 : 1}
                    >
                        <PulseWrapper active={step === 2}>
                            <UserIcon width={22} height={22} color="white" />
                        </PulseWrapper>
                    </TouchableOpacity>
                </View>

                {/* Swipe hint — highlighted at step 4 */}
                <Animated.View
                    style={[styles.swipeHint, { zIndex: step === 4 ? 20 : 1, transform: [{ translateY: swipeAnim }] }]}
                    pointerEvents="none"
                >
                    <PulseWrapper active={step === 4}>
                        <View style={styles.swipeHintInner}>
                            <MaterialIcons name="keyboard-arrow-up" size={20} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.swipeText}>SWIPE UP FOR NEXT QUOTE</Text>
                        </View>
                    </PulseWrapper>
                </Animated.View>

                {/* Category badge — highlighted at step 1 */}
                <TouchableOpacity
                    style={[styles.categoryBadge, { zIndex: step === 1 ? 20 : 1 }]}
                    onPress={step === 1 ? nextStep : undefined}
                    activeOpacity={step === 1 ? 0.7 : 1}
                >
                    <PulseWrapper active={step === 1}>
                        <Text style={styles.categoryText}>{currentQuote.category.toUpperCase()}</Text>
                    </PulseWrapper>
                </TouchableOpacity>
            </View>

            {/* Tutorial overlay — backdrop zIndex 10, tooltips zIndex 30 */}
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
    card: {
        backgroundColor: 'transparent',
    },
    bgImage: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    quoteContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    quoteText: {
        color: 'white',
        fontSize: 30,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 40,
    },
    fixedOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    topBar: {
        position: 'absolute',
        top: 56,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 15,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartsRowSpacer: {
        flex: 1,
    },
    swipeHint: {
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    swipeHintInner: {
        alignItems: 'center',
        gap: 2,
    },
    swipeText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        letterSpacing: 1.2,
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 36,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    categoryText: {
        backgroundColor: 'rgba(20,20,20,0.85)',
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 2,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        overflow: 'hidden',
    },
});
