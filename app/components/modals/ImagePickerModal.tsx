import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

interface ImagePickerModalProps {
    visible: boolean;
    onCamera: () => void;
    onGallery: () => void;
    onClose: () => void;
}

export function ImagePickerModal({ visible, onCamera, onGallery, onClose }: ImagePickerModalProps) {
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

    function handleCamera() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onCamera());
    }

    function handleGallery() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onGallery());
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 8 }]}>
                            <View style={styles.handle} />
                            <TouchableOpacity style={styles.option} onPress={handleCamera} activeOpacity={0.7}>
                                <MaterialIcons name="camera-alt" size={22} color={Colors.textHeadline} />
                                <Text style={styles.optionText}>Kamera</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.option} onPress={handleGallery} activeOpacity={0.7}>
                                <MaterialIcons name="photo-library" size={22} color={Colors.textHeadline} />
                                <Text style={styles.optionText}>Fotomediathek</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.option, styles.cancel]} onPress={handleClose} activeOpacity={0.7}>
                                <Text style={styles.cancelText}>Abbrechen</Text>
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
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backdropPressable: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    optionText: {
        fontFamily: Fonts.sans,
        fontSize: 16,
        color: Colors.textHeadline,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.borderDivider,
        marginHorizontal: 4,
    },
    cancel: {
        justifyContent: 'center',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.borderDivider,
    },
    cancelText: {
        fontFamily: Fonts.sansMedium,
        fontSize: 16,
        color: Colors.textMuted,
    },
});
