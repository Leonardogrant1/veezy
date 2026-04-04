import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
                    <View style={styles.handle} />
                    <TouchableOpacity
                        style={styles.option}
                        onPress={onCamera}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="camera-alt" size={22} color={Colors.textHeadline} />
                        <Text style={styles.optionText}>Kamera</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.option}
                        onPress={onGallery}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="photo-library" size={22} color={Colors.textHeadline} />
                        <Text style={styles.optionText}>Fotomediathek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.option, styles.cancel]}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelText}>Abbrechen</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
