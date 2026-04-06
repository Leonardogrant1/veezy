import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

type Props = {
    visible: boolean;
    value: string | null;
    onSave: (iso: string) => void;
    onClose: () => void;
};

function defaultDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
}

export function BirthdayPickerModal({ visible, value, onSave, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const [date, setDate] = useState<Date>(value ? new Date(value) : defaultDate());

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            setDate(value ? new Date(value) : defaultDate());
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
    }, [visible, value]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
    }

    function handleSave() {
        const iso = date.toISOString().split('T')[0];
        onSave(iso);
        handleClose();
    }

    // Android: DateTimePicker renders as a native dialog, not inline.
    // We show it immediately when visible and call onSave on change.
    if (Platform.OS === 'android') {
        if (!visible) return null;
        return (
            <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, selected) => {
                    if (selected) {
                        onSave(selected.toISOString().split('T')[0]);
                    }
                    onClose();
                }}
            />
        );
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Geburtstag</Text>
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="spinner"
                                maximumDate={new Date()}
                                onChange={(_, selected) => {
                                    if (selected) setDate(selected);
                                }}
                                locale="de-DE"
                                style={styles.picker}
                                textColor={Colors.text}
                            />
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
                                <Text style={styles.saveButtonText}>Speichern</Text>
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
        marginBottom: 4,
    },
    picker: {
        width: '100%',
    },
    saveButton: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
});
