import PlusIcon from '@/assets/icons/plus.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import { GlowPulse } from '@/components/layout/GlowPulse';
import { VisionSlide } from '@/components/layout/VisionSlide';
import { CategoryFilter, CategoryModal } from '@/components/modals/CategoryModal';
import { VisionActionsModal } from '@/components/modals/VisionActionsModal';
import { Colors, Fonts } from '@/constants/theme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { PendingVisionWatcher } from '@/services/pending-vision-watcher';
import { syncPushToken } from '@/services/push-token-sync';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { Vision } from '@/types/vision';
import { devLog } from '@/utils/dev-log';
import { openPlacementWithImage } from '@/utils/openPlacementWithImage';
import { showPremiumWelcomeRef } from '@/components/modals/PremiumWelcomeModal';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

export default function HomeScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const visions = useVisionStore((s) => s.visions);
    const { generationCount, hasEntitlement, customerInfo, refreshGenerationCount } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();

    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [actionsVision, setActionsVision] = useState<Vision | null>(null);
    const [userIdCopied, setUserIdCopied] = useState(false);

    const phraseOpacity = useRef(new Animated.Value(1)).current;
    const listRef = useRef<FlatList<Vision>>(null);
    const focusVisionId = useVisionStore((s) => s.focusVisionId);

    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    const filtered = useMemo(() => {
        const list = selectedCategory === 'all'
            ? visions
            : visions.filter((v) => v.category === selectedCategory);
        return isPremium ? list : list.slice(0, 4);
    }, [visions, selectedCategory, isPremium]);

    const activeVision: Vision | undefined = filtered[activeIndex];

    // Keep activeIndex in bounds when the list shrinks (deletion, category filter)
    useEffect(() => {
        if (filtered.length > 0 && activeIndex >= filtered.length) {
            setActiveIndex(filtered.length - 1);
        }
    }, [filtered.length, activeIndex]);

    useEffect(() => {
        PendingVisionWatcher.setOnCompleted(() => { refreshGenerationCount().catch(() => { }); });
    }, []);

    // Scroll to a focused vision (new pending vision or push-notification tap).
    // A one-shot scroll races the back-navigation and list update, so we keep the
    // target in a ref and (re)try whenever the list reports new content — that is
    // the moment the FlatList is guaranteed to know the added item.
    const pendingFocusId = useRef<string | null>(null);

    const scrollToPendingFocus = useCallback(() => {
        const id = pendingFocusId.current;
        if (!id) return;
        const index = filtered.findIndex((v) => v.id === id);
        if (index < 0) return;
        listRef.current?.scrollToIndex({ index, animated: true });
    }, [filtered]);

    useEffect(() => {
        if (!focusVisionId) return;
        pendingFocusId.current = focusVisionId;
        useVisionStore.getState().setFocusVisionId(null);
        // Direct attempt covers the case where the item is already laid out (push tap)
        requestAnimationFrame(scrollToPendingFocus);
        // Stop retrying after the scroll window has clearly passed
        const clear = setTimeout(() => { pendingFocusId.current = null; }, 5000);
        return () => clearTimeout(clear);
    }, [focusVisionId, scrollToPendingFocus]);

    // Route listener: when home regains focus (add/generate screen closed),
    // execute the pending scroll — this is the moment the feed is visible again.
    useFocusEffect(
        useCallback(() => {
            requestAnimationFrame(scrollToPendingFocus);
        }, [scrollToPendingFocus])
    );

    useEffect(() => {
        if (isPremium) return;
        if (activeIndex !== 3) return;
        if (filtered.length <= 3) return; // index 3 exists but is not the locked slot
        const timer = setTimeout(() => openPlacementWithImage(openWithPlacement, 'feed_end_reached'), 800);
        return () => clearTimeout(timer);
    }, [activeIndex, isPremium, filtered.length]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const first = viewableItems[0];
        if (first?.index != null) {
            if (useUserDataStore.getState().haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.timing(phraseOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
                setActiveIndex(first.index!);
                Animated.timing(phraseOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            });
        }
    }, []);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const handleSelectCategory = (key: CategoryFilter) => {
        setSelectedCategory(key);
        setActiveIndex(0);
        setCategoryModalVisible(false);
        trackerManager.track('category_selected', { category: key });
    };

    const categoryLabel = t(`category.${selectedCategory}`);


    const isEmpty = (filtered.length === 0);

    return (
        <View style={styles.container}>
            {isEmpty ? (
                <View style={[styles.emptyState, { paddingBottom: insets.bottom + 120 }]}>
                    <GlowPulse size={220} />
                    <Text style={styles.emptyTitle}>{t('home.empty_title')}</Text>
                    <Text style={styles.emptySubtitle}>{t('home.empty_subtitle_pre')}{' '}
                        <Text style={styles.emptyAccent}>+</Text>
                        {' '}{t('home.empty_subtitle_post')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
                    onContentSizeChange={scrollToPendingFocus}
                    onScrollToIndexFailed={() => { }}
                    renderItem={({ item, index }) => (
                        <VisionSlide item={item} width={width} height={height} locked={!isPremium && index === 3} />
                    )}
                />
            )}

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

            {__DEV__ && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugStatusText}>
                        💳 {hasEntitlement(PREMIUM_IDENTIFIER) ? 'Premium ✅' : 'Free ❌'}
                    </Text>
                    <TouchableOpacity
                        onPress={async () => {
                            const userId = customerInfo?.originalAppUserId;
                            if (!userId) return;
                            await Clipboard.setStringAsync(userId);
                            setUserIdCopied(true);
                            setTimeout(() => setUserIdCopied(false), 1500);
                        }}
                    >
                        <Text style={styles.debugStatusText}>
                            🆔 {userIdCopied ? '✓ kopiert' : customerInfo?.originalAppUserId ?? '–'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => {
                            useUserDataStore.setState({ hasOnboarded: false });
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
                        onPress={() => showPremiumWelcomeRef.current()}
                    >
                        <Text style={styles.debugButtonText}>⭐ Premium Welcome</Text>
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
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={async () => {
                            try {
                                // Ensure the token is registered + uploaded, then test the full remote chain
                                await syncPushToken();
                                const res = await fetch(`${BACKEND_URL}/user-data/test-push`, {
                                    method: 'POST',
                                    headers: { 'x-rc-user-id': useUserDataStore.getState().userId },
                                });
                                devLog('Test remote push response:', res.status);
                            } catch (e) {
                                devLog('Test remote push failed:', e);
                            }
                        }}
                    >
                        <Text style={styles.debugButtonText}>📡 Test Remote Push</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => {
                            // Simulates the REAL post-generate flow without the backend:
                            // open the add screen, then after 800ms act exactly like a
                            // finished generation (addVision -> setFocus -> back).
                            // Tap again (with a fake present) to remove it.
                            const store = useVisionStore.getState();
                            const existing = store.visions.filter((v) => v.id.startsWith('dev-fake-'));
                            if (existing.length > 0) {
                                existing.forEach((v) => store.deleteVision(v.id));
                                return;
                            }
                            router.push('/vision/add');
                            setTimeout(() => {
                                const id = `dev-fake-${Date.now()}`;
                                useVisionStore.getState().addVision({
                                    id,
                                    title: '',
                                    phrase: 'DEV: Simulierte Vision für Ladeansicht & Scroll',
                                    category: 'lifestyle',
                                    imagePath: null,
                                    imageVersion: 1,
                                    status: 'pending',
                                    pendingSince: Date.now(),
                                });
                                useVisionStore.getState().setFocusVisionId(id);
                                router.back();
                            }, 800);
                        }}
                    >
                        <Text style={styles.debugButtonText}>🧪 Fake Pending Vision</Text>
                    </TouchableOpacity>
                </View>
            )}


            {/* Fixed topbar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>

                <View style={styles.topBarRight}>
                    {!hasEntitlement(PREMIUM_IDENTIFIER) && (
                        <TouchableOpacity style={styles.crownButton} activeOpacity={0.8} onPress={() => openPlacementWithImage(openWithPlacement, 'add_premium_top')}>
                            <MaterialCommunityIcons name="crown" size={18} color={Colors.accent} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/settings')}>
                        <ProfileIcon width={34} height={34} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Phrase */}
            {!isEmpty && <Animated.View style={[styles.phraseContainer, { bottom: insets.bottom + 90, opacity: phraseOpacity }]}>
                <TouchableOpacity
                    style={styles.phraseCard}
                    activeOpacity={0.7}
                    onPress={() => activeVision && setActionsVision(activeVision)}
                >
                    <Feather name="chevron-up" size={20} color="rgba(255,255,255,0.6)" style={styles.chevronButton} />

                    <Text style={styles.category}>
                        {t(`category.${activeVision?.category ?? 'lifestyle'}`).toUpperCase()}
                    </Text>

                    <Text style={styles.phrase}>
                        {activeVision?.phrase ?? ''}
                    </Text>
                </TouchableOpacity>
            </Animated.View>}

            {/* Bottom bar: category selector + FAB */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
                <TouchableOpacity
                    style={styles.categorySelector}
                    activeOpacity={0.8}
                    onPress={() => setCategoryModalVisible(true)}
                >
                    <Text style={styles.categoryText}>{categoryLabel.toUpperCase()}</Text>
                </TouchableOpacity>

                <View style={styles.fabWrapper}>
                    {generationCount !== null && generationCount <= 5 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{generationCount}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.fab}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (generationCount !== null && generationCount <= 0) {
                                openPlacementWithImage(openWithPlacement, 'generate_vision');
                            } else {
                                router.push('/vision/add');
                            }
                        }}
                    >
                        <PlusIcon width={34} height={34} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category modal */}
            <CategoryModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />

            {/* Vision actions modal */}
            <VisionActionsModal
                vision={actionsVision}
                onClose={() => setActionsVision(null)}
            />
        </View>
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
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    logo: {
        color: 'white',
        fontFamily: Fonts.serifBold,
        fontSize: 24,
        letterSpacing: -0.5,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    crownButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 40,
    },


    emptyTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Fonts.serifBold,
        fontSize: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: 'rgba(255,255,255,0.3)',
        fontFamily: Fonts.sans,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyAccent: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
    },
    phraseContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    phraseCard: {
        borderRadius: 18,
        overflow: 'hidden',
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 5,
    },
    chevronButton: {
        alignSelf: 'center',
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
    },
    categorySelector: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.accent,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    categoryText: {
        color: 'white',
        fontSize: 13,
        fontFamily: Fonts.sansSemiBold,
        letterSpacing: 1,
    },
    fabWrapper: {
        alignItems: 'center',
        gap: 6,
    },
    countBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    countText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: Fonts.sansMedium,
        fontSize: 12,
    },
    fab: {
        width: 55,
        height: 55,
        borderRadius: 20,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    debugContainer: {
        position: 'absolute',
        top: 130,
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
    debugStatusText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },


});
