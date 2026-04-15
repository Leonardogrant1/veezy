import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Gold } from '@/constants/theme';

export const showPremiumWelcomeRef = { current: () => {} };

export function PremiumWelcomeModal() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        showPremiumWelcomeRef.current = () => setVisible(true);
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
            ]).start();
        }
    }, [visible]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 32 }]}>
                            <View style={styles.handle} />

                            <View style={styles.iconWrapper}>
                                <MaterialIcons name="auto-awesome" size={32} color={Gold[500]} />
                            </View>

                            <Text style={styles.title}>{t('premium_welcome.title')}</Text>
                            <Text style={styles.subtitle}>{t('premium_welcome.subtitle')}</Text>

                            <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
                                <Text style={styles.buttonText}>{t('premium_welcome.cta')}</Text>
                            </TouchableOpacity>
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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 24,
        gap: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 8,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Gold[50],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        color: Colors.textHeadline,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.textMuted,
        lineHeight: 23,
        marginBottom: 8,
    },
    button: {
        backgroundColor: Colors.textHeadline,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: Colors.surface,
    },
});
