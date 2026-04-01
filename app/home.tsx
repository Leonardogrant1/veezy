import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BallIcon from '@/assets/icons/ball.svg';
import HeartIcon from '@/assets/icons/heart.svg';
import ShareIcon from '@/assets/icons/share.svg';
import UserIcon from '@/assets/icons/user.svg';
import { getRandomSportImage } from '@/assets/sports-images';
import { CategoriesModal } from '@/components/categories-modal';
import { SettingsModal } from '@/components/settings-modal';
import { SportsModal } from '@/components/sports-modal';
import { Fonts } from '@/constants/theme';
import { buildFeed, Category, FeedQuote } from '@/data/quotes';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { syncWidgetData } from '@/services/widgets/storage';
import { useUserDataStore } from '@/stores/UserDataStore';
import { devLog } from '@/utils/dev-log';


export default function HomeScreen() {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [categoriesVisible, setCategoriesVisible] = useState(false);
    const [sportsVisible, setSportsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const selectedCategories = useUserDataStore((s) => s.settings.selectedCategories) as Category[];
    const selectedSports = useUserDataStore((s) => s.settings.selectedSports);
    const likedQuoteIds = useUserDataStore((s) => s.likedQuoteIds);
    const toggleLikedQuote = useUserDataStore((s) => s.toggleLikedQuote);
    const checkAndUpdateStreak = useUserDataStore((s) => s.checkAndUpdateStreak);
    const { getUserEntitlements } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();
    const settings = useUserDataStore((s) => s.settings);


    useEffect(() => {
        async function checkEntitlements() {
            const entitlements = await getUserEntitlements();
            if (!entitlements.active['premium']) {
                await Notifications.cancelAllScheduledNotificationsAsync();
                await openWithPlacement("home_screen");
            }
        }
        checkEntitlements();
    }, []);

    useEffect(() => {
        checkAndUpdateStreak();
        const { currentStreak, longestStreak } = useUserDataStore.getState().streak;
        trackerManager.track('streak_updated', { currentStreak, longestStreak });
    }, []);

    const feed = useMemo(() => buildFeed(selectedCategories), [selectedCategories]);


    useEffect(() => {
        syncWidgetData(settings)
    }, [settings])

    const feedImages = useMemo(() => {
        const recent: number[] = [];
        return feed.map(() => {
            const img = getRandomSportImage(selectedSports, recent);
            recent.push(img);
            if (recent.length > 3) recent.shift();
            return img;
        });
    }, [feed, selectedSports]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0]) setCurrentIndex(viewableItems[0].index ?? 0);
    });

    const currentQuote: FeedQuote | undefined = feed[currentIndex];

    function shareQuote(quote: FeedQuote) {
        const author = quote.author ? `\n— ${quote.author}` : '';
        trackerManager.track('quote_shared', { quoteId: quote.id, category: quote.category });
        Share.share({
            message: `"${quote.text}"${author}\n\n📲 Discipl – Daily quotes & affirmations for athletes\nhttps://apps.apple.com/app/discipl`,
        });
    }

    const likeCount = Math.min(likedQuoteIds.length, 5);
    const likeProgress = likeCount / 5;

    const heartsOpacity = useRef(new Animated.Value(likedQuoteIds.length >= 5 ? 0 : 1)).current;
    const heartsScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (likedQuoteIds.length === 5) {
            trackerManager.track('five_likes_reached');
            Animated.sequence([
                Animated.spring(heartsScale, { toValue: 1.3, useNativeDriver: true }),
                Animated.spring(heartsScale, { toValue: 1, useNativeDriver: true }),
                Animated.delay(400),
                Animated.timing(heartsOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start();
        }
    }, [likedQuoteIds.length]);

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





    return (
        <View style={styles.container}>
            {/* Scrolling quote feed */}
            <Animated.FlatList
                data={feed}
                keyExtractor={(item) => item.id}
                pagingEnabled
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
                            source={feedImages[index]}
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

            {/* Fixed overlay + quote text */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[StyleSheet.absoluteFill, styles.overlay]} />
            </View>
            <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity }]} pointerEvents="none">
                <Text style={[styles.quoteText, { fontFamily: Fonts?.serif }]}>{currentQuote?.text}</Text>
            </Animated.View>



            {/* Fixed UI overlay */}
            <View style={styles.fixedOverlay} pointerEvents="box-none">
                {/* Top bar */}
                <View style={styles.topBar} pointerEvents="box-none">
                    <TouchableOpacity style={styles.iconButton} onPress={() => setSportsVisible(true)}>
                        <BallIcon width={22} height={22} color="white" />
                    </TouchableOpacity>
                    <Animated.View style={[styles.heartsRow, { opacity: heartsOpacity, transform: [{ scale: heartsScale }] }]}>
                        <HeartIcon width={15} height={15} color="white" />
                        <Text style={styles.heartsText}>{likeCount}/5</Text>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${likeProgress * 100}%` }]} />
                        </View>
                    </Animated.View>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setSettingsVisible(true)}>
                        <UserIcon width={22} height={22} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Action icons */}
                <View style={styles.actionsRow} pointerEvents="box-none">
                    <TouchableOpacity style={styles.actionButton} onPress={() => currentQuote && shareQuote(currentQuote)}>
                        <View style={[styles.iconButton, {
                            backgroundColor: 'rgba(20,20,20,0.85)',
                        }]}>
                            <ShareIcon width={26} height={26} color="white" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => {
                        if (!currentQuote) return;
                        const isLiked = likedQuoteIds.includes(currentQuote.id);
                        trackerManager.track(isLiked ? 'quote_unliked' : 'quote_liked', { quoteId: currentQuote.id, category: currentQuote.category });
                        toggleLikedQuote(currentQuote.id);
                    }}>
                        <View style={[styles.iconButton, { backgroundColor: currentQuote && likedQuoteIds.includes(currentQuote.id) ? '#f92f2c57' : 'rgba(20,20,20,0.85)' }]}>
                            <HeartIcon width={26} height={26} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Swipe hint */}
                <Animated.View style={[styles.swipeHint, { transform: [{ translateY: swipeAnim }] }]} pointerEvents="none">
                    <MaterialIcons name="keyboard-arrow-up" size={20} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.swipeText}>SWIPE UP FOR NEXT QUOTE</Text>
                </Animated.View>

                {/* Category badge */}
                <TouchableOpacity style={styles.categoryBadge} onPress={() => setCategoriesVisible(true)}>
                    <Text style={styles.categoryText}>{currentQuote?.category.toUpperCase()}</Text>
                </TouchableOpacity>
            </View>

            {__DEV__ && (
                <View style={styles.debugContainer}>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => {
                            useUserDataStore.setState({ hasCompletedOnboarding: false });
                            router.replace('/start');
                        }}
                    >
                        <Text style={styles.debugButtonText}>⚙ Onboarding</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => {
                            useUserDataStore.setState({ hasSeenTutorial: false });
                            router.replace('/tutorial');
                        }}
                    >
                        <Text style={styles.debugButtonText}>🎓 Tutorial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={async () => {
                            const scheduleId = await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: "DEV: Test Push 🚀",
                                    body: "Diese Benachrichtigung wurde vor 5 Sekunden geplant.",
                                    sound: true,
                                },
                                trigger: { seconds: 5, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
                            });
                            devLog('Scheduled ID:', scheduleId)


                            const all = await Notifications.getAllScheduledNotificationsAsync()
                            devLog('All scheduled:', all.length)
                        }}
                    >
                        <Text style={styles.debugButtonText}>🔔 Test Push (5s)</Text>
                    </TouchableOpacity>
                </View>
            )}

            <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
            <CategoriesModal visible={categoriesVisible} onClose={() => setCategoriesVisible(false)} />
            <SportsModal visible={sportsVisible} onClose={() => setSportsVisible(false)} />
        </View>
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
    heartsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    heartsText: {
        color: 'white',
        fontSize: 13,
    },
    progressTrack: {
        width: 80,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 1,
    },
    progressFill: {
        width: '0%',
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 1,
    },
    actionsRow: {
        position: 'absolute',
        bottom: 230,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 36,
    },
    actionButton: {
        padding: 8,
    },
    swipeHint: {
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
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
    debugContainer: {
        position: 'absolute',
        bottom: 100,
        right: 16,
        gap: 8,
        alignItems: 'flex-end',
    },
    debugButton: {
        backgroundColor: 'rgba(255,59,48,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    debugButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
