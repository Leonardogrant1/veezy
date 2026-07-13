import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORE_URL } from '@/constants/store-urls';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
    storeVersion: string;
    releaseNotes: string | null;
    onDismiss: () => void;
};

export function UpdateSheet({ storeVersion, releaseNotes, onDismiss }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
        ]).start();
    }, []);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
        ]).start(() => onDismiss());
    }

    function handleUpdate() {
        Linking.openURL(STORE_URL);
        handleClose();
    }

    return (
        <Modal visible animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>{t('version.update_available_title')}</Text>
                            <Text style={styles.version}>Version {storeVersion}</Text>

                            {releaseNotes ? (
                                <View style={styles.notesCard}>
                                    <Text style={styles.notesLabel}>{t('version.whats_new')}</Text>
                                    <Text style={styles.notesText}>{releaseNotes}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity style={styles.button} onPress={handleUpdate} activeOpacity={0.85}>
                                <Text style={styles.buttonText}>{t('version.update_now')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.laterButton} onPress={handleClose} activeOpacity={0.7}>
                                <Text style={styles.laterText}>{t('version.update_later')}</Text>
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
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        color: Colors.textHeadline,
    },
    version: {
        fontFamily: Fonts.sansMedium,
        fontSize: 13,
        color: Colors.textMuted,
    },
    notesCard: {
        backgroundColor: Colors.cardElevated,
        borderColor: Colors.borderCard,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        gap: 6,
    },
    notesLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        color: Colors.text,
    },
    notesText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textMuted,
    },
    button: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: '#ffffff',
    },
    laterButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    laterText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        color: Colors.textMuted,
    },
});
