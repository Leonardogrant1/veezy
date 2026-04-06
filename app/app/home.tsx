import PlusIcon from '@/assets/icons/plus.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import { VisionSlide } from '@/components/layout/VisionSlide';
import { CATEGORIES, CategoryFilter, CategoryModal } from '@/components/modals/CategoryModal';
import { VisionActionsModal } from '@/components/modals/VisionActionsModal';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { Vision } from '@/types/vision';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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

    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [actionsVision, setActionsVision] = useState<Vision | null>(null);

    const phraseOpacity = useRef(new Animated.Value(1)).current;

    const filtered = useMemo(() =>
        selectedCategory === 'all'
            ? visions
            : visions.filter((v) => v.category === selectedCategory),
        [visions, selectedCategory]
    );

    const activeVision: Vision | undefined = filtered[activeIndex];

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
    };

    const categoryLabel = CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? 'Alle';


    return (
        <View style={styles.container}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <VisionSlide item={item} width={width} height={height} />
                )}
            />

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

            {/* Fixed topbar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/settings')}>
                    <ProfileIcon width={34} height={34} />
                </TouchableOpacity>
            </View>

            {/* Phrase */}
            <Animated.View style={[styles.phraseContainer, { bottom: insets.bottom + 90, opacity: phraseOpacity }]}>
                <View style={styles.phraseCard}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => activeVision && setActionsVision(activeVision)}
                        style={styles.chevronButton}
                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                    >
                        <Feather name="chevron-up" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    <Text style={styles.category}>
                        {(activeVision.category ?? 'Lifestyle').toUpperCase()}
                    </Text>

                    <Text style={styles.phrase}>
                        {activeVision?.phrase ?? ''}
                    </Text>
                </View>
            </Animated.View>

            {/* Bottom bar: category selector + FAB */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
                <TouchableOpacity
                    style={styles.categorySelector}
                    activeOpacity={0.8}
                    onPress={() => setCategoryModalVisible(true)}
                >
                    <Text style={styles.categoryText}>{categoryLabel.toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.85}
                    onPress={() => router.push('/vision/add')}
                >
                    <PlusIcon width={34} height={34} />
                </TouchableOpacity>
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
        alignItems: 'center',
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
});
