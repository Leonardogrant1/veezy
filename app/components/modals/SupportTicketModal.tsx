import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function SupportTicketModal({ visible, onClose }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const userId = useUserDataStore((s) => s.userId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('idle');

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(600)).current;

    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const keyboardSpacerStyle = useAnimatedStyle(() => {
        const kbHeight = -keyboardHeight.value;
        return { height: kbHeight > 0 ? kbHeight : insets.bottom + 24 };
    });

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            onClose();
            setTimeout(() => {
                setTitle('');
                setDescription('');
                setStatus('idle');
            }, 100);
        });
    }

    async function handleSubmit() {
        if (!title.trim() || !description.trim()) return;
        setStatus('loading');
        try {
            const res = await fetch('https://northbyte.studio/api/tickets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    userId,
                    appSlug: 'veezy',
                }),
            });
            setStatus(res.ok ? 'success' : 'error');
        } catch {
            setStatus('error');
        }
    }

    const canSubmit = title.trim().length > 0 && description.trim().length > 0 && status === 'idle';

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

                            <View style={styles.handle} />

                            <View style={styles.header}>
                                <Text style={styles.sheetTitle}>{t('support.modal_title')}</Text>
                                <TouchableOpacity onPress={handleClose} hitSlop={8}>
                                    <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            {status === 'success' ? (
                                <View style={styles.successState}>
                                    <MaterialIcons name="check-circle" size={48} color={Colors.accent} />
                                    <Text style={styles.successTitle}>{t('support.success_title')}</Text>
                                    <Text style={styles.successSubtitle}>{t('support.success_subtitle')}</Text>
                                    <TouchableOpacity style={styles.submitButton} onPress={handleClose} activeOpacity={0.8}>
                                        <Text style={styles.submitButtonText}>{t('support.close')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.field}>
                                        <Text style={styles.fieldLabel}>{t('support.field_title')}</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={title}
                                            onChangeText={setTitle}
                                            placeholder={t('support.field_title_placeholder')}
                                            placeholderTextColor={Colors.textPlaceholder}
                                            editable={status === 'idle'}
                                        />
                                    </View>

                                    <View style={styles.field}>
                                        <Text style={styles.fieldLabel}>{t('support.field_description')}</Text>
                                        <TextInput
                                            style={[styles.input, styles.inputMultiline]}
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder={t('support.field_description_placeholder')}
                                            placeholderTextColor={Colors.textPlaceholder}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                            editable={status === 'idle'}
                                        />
                                    </View>

                                    {status === 'error' && (
                                        <Text style={styles.errorText}>{t('support.error')}</Text>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={!canSubmit}
                                        activeOpacity={0.8}
                                    >
                                        {status === 'loading' ? (
                                            <ActivityIndicator color={Colors.surface} />
                                        ) : (
                                            <Text style={styles.submitButtonText}>{t('support.submit')}</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            <Reanimated.View style={keyboardSpacerStyle} />
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
        gap: 16,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sheetTitle: {
        fontFamily: Fonts.serifBold,
        fontSize: 20,
        color: Colors.textHeadline,
    },
    field: {
        gap: 6,
    },
    fieldLabel: {
        fontFamily: Fonts.sansMedium,
        fontSize: 13,
        color: Colors.textMuted,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderDivider,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.text,
    },
    inputMultiline: {
        height: 110,
        paddingTop: 12,
    },
    errorText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: '#c0392b',
        marginTop: -8,
    },
    submitButton: {
        backgroundColor: Colors.textHeadline,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        width: '100%',
    },
    submitButtonDisabled: {
        opacity: 0.35,
    },
    submitButtonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
        color: Colors.surface,
    },
    successState: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    successTitle: {
        fontFamily: Fonts.serifBold,
        fontSize: 22,
        color: Colors.textHeadline,
    },
    successSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 21,
    },
    close: {
        marginTop: 8,
    },
});
