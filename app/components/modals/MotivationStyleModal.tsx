import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { MotivationStyle } from '@/types/user-data';

const OPTIONS: { value: MotivationStyle; label: string; description: string }[] = [
    { value: 'affirmation', label: 'Affirmation', description: 'Positive Bestätigung & ruhige Stärke' },
    { value: 'fuel', label: 'Fuel', description: 'Dringlichkeit & knallharter Antrieb' },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    selected: MotivationStyle;
    onSelect: (style: MotivationStyle) => void;
}

export function MotivationStyleModal({ visible, onClose, selected, onSelect }: Props) {
    const insets = useSafeAreaInsets();
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

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

    function handleSelect(style: MotivationStyle) {
        onSelect(style);
        handleClose();
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Motivationsstil</Text>
                            {OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.option, selected === opt.value && styles.optionActive]}
                                    activeOpacity={0.7}
                                    onPress={() => handleSelect(opt.value)}
                                >
                                    <View>
                                        <Text style={[styles.optionLabel, selected === opt.value && styles.optionLabelActive]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={styles.optionDescription}>{opt.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
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
    },
    optionActive: {
        backgroundColor: Colors.accent + '22',
    },
    optionLabel: {
        color: Colors.text,
        fontFamily: Fonts.sansMedium,
        fontSize: 16,
    },
    optionLabelActive: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
    },
    optionDescription: {
        color: Colors.textMuted,
        fontFamily: Fonts.sans,
        fontSize: 13,
        marginTop: 2,
    },
});
