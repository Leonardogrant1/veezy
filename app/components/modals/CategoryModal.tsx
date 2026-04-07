import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { VisionCategory } from '@/types/vision';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type CategoryFilter = 'all' | VisionCategory;

export const CATEGORIES: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'wealth', label: 'Wealth' },
    { key: 'body', label: 'Body' },
    { key: 'lifestyle', label: 'Lifestyle' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'mindset', label: 'Mindset' },
    { key: 'purpose', label: 'Purpose' },
];

interface CategoryModalProps {
    visible: boolean;
    onClose: () => void;
    selectedCategory: CategoryFilter;
    onSelectCategory: (category: CategoryFilter) => void;
}

export function CategoryModal({ visible, onClose, selectedCategory, onSelectCategory }: CategoryModalProps) {
    const insets = useSafeAreaInsets();
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;
    const { hasEntitlement } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();
    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Kategorie</Text>
                            {CATEGORIES.map((cat) => {
                                const locked = !isPremium && cat.key !== 'all';
                                return (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[styles.option, selectedCategory === cat.key && styles.optionActive, locked && styles.optionLocked]}
                                        activeOpacity={0.7}
                                        onPress={() => locked ? openWithPlacement('select_category') : onSelectCategory(cat.key)}
                                    >
                                        <Text style={[styles.optionText, selectedCategory === cat.key && styles.optionTextActive, locked && styles.optionTextLocked]}>
                                            {cat.label}
                                        </Text>
                                        {locked && (
                                            <MaterialCommunityIcons name="crown" size={14} color={Colors.accent} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                    </Pressable>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropPressable: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        marginBottom: 8,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionActive: {
        backgroundColor: Colors.accent + '22',
    },
    optionLocked: {
        opacity: 0.45,
    },
    optionText: {
        color: Colors.text,
        fontFamily: Fonts.sansMedium,
        fontSize: 16,
    },
    optionTextActive: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
    },
    optionTextLocked: {
        color: Colors.text,
    },
});
