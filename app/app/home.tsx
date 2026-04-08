import PlusIcon from '@/assets/icons/plus.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import { GlowPulse } from '@/components/layout/GlowPulse';
import { VisionSlide } from '@/components/layout/VisionSlide';
import { CATEGORIES, CategoryFilter, CategoryModal } from '@/components/modals/CategoryModal';
import { VisionActionsModal } from '@/components/modals/VisionActionsModal';
import { Colors, Fonts } from '@/constants/theme';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { Vision } from '@/types/vision';
import { devLog } from '@/utils/dev-log';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const visions = useVisionStore((s) => s.visions);
    const { generationCount, hasEntitlement } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();

    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [actionsVision, setActionsVision] = useState<Vision | null>(null);

    const phraseOpacity = useRef(new Animated.Value(1)).current;

    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    const filtered = useMemo(() => {
        const list = selectedCategory === 'all'
            ? visions
            : visions.filter((v) => v.category === selectedCategory);
        return isPremium ? list : list.slice(0, 4);
    }, [visions, selectedCategory, isPremium]);

    const activeVision: Vision | undefined = filtered[activeIndex];

    const lockedIndex = isPremium ? -1 : filtered.length - 1;
    useEffect(() => {
        if (activeIndex !== lockedIndex) return;
        const timer = setTimeout(() => openWithPlacement('feed_end_reached'), 800);
        return () => clearTimeout(timer);
    }, [activeIndex, lockedIndex]);

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

    const categoryLabel = CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? 'Alle';


    const isEmpty = (filtered.length === 0);

    return (
        <View style={styles.container}>
            {isEmpty ? (
                <View style={[styles.emptyState, { paddingBottom: insets.bottom + 120 }]}>
                    <GlowPulse size={220} />
                    <Text style={styles.emptyTitle}>Erstelle deine erste Vision</Text>
                    <Text style={styles.emptySubtitle}>Tippe auf das{' '}
                        <Text style={styles.emptyAccent}>+</Text>
                        {' '}um deine erste Vision zu erstellen
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
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

            {/* Fixed topbar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>
                <View style={styles.topBarRight}>
                    {!hasEntitlement(PREMIUM_IDENTIFIER) && (
                        <TouchableOpacity style={styles.crownButton} activeOpacity={0.8} onPress={() => openWithPlacement('add_premium_top')}>
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
                        {(activeVision.category ?? 'Lifestyle').toUpperCase()}
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
                    {generationCount !== null && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{generationCount}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.fab}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (generationCount !== null && generationCount <= 0) {
                                openWithPlacement('generate_vision');
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


});
