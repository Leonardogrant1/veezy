import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

type OptionPickerProps = {
    type: 'options';
    options: string[];
};

type TextFieldProps = {
    type: 'text';
    placeholder?: string;
};

type NumberFieldProps = {
    type: 'number';
    placeholder?: string;
};

type BaseProps = {
    visible: boolean;
    title: string;
    value: string | number | null | undefined;
    onSave: (value: string) => void;
    onClose: () => void;
};

type Props = BaseProps & (OptionPickerProps | TextFieldProps | NumberFieldProps);

export function EditFieldModal(props: Props) {
    const { visible, title, value, onSave, onClose } = props;
    const [draft, setDraft] = useState(value !== null && value !== undefined ? String(value) : '');
    const inputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

    const keyboardSpacerStyle = useAnimatedStyle(() => {
        const kbHeight = -keyboardHeight.value;
        return {
            height: kbHeight > 0 ? kbHeight : insets.bottom + 24,
        };
    });

    useEffect(() => {
        if (visible) {
            setDraft(value !== null && value !== undefined ? String(value) : '');
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                if (props.type === 'text' || props.type === 'number') {
                    setTimeout(() => inputRef.current?.focus(), 50);
                }
            });
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, value, props.type]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
    }

    function handleSave() {
        if (!draft) return;
        onSave(draft);
        handleClose();
    }

    function handleOptionSelect(option: string) {
        onSave(option);
        handleClose();
    }

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>{title}</Text>

                            {(props.type === 'text' || props.type === 'number') && (
                                <>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={draft}
                                        onChangeText={setDraft}
                                        placeholder={props.placeholder ?? ''}
                                        placeholderTextColor={Colors.textPlaceholder}
                                        returnKeyType="done"
                                        keyboardType={props.type === 'number' ? 'number-pad' : 'default'}
                                        maxLength={props.type === 'number' ? 4 : undefined}
                                        onSubmitEditing={handleSave}
                                    />
                                    <TouchableOpacity
                                        style={[styles.saveButton, !draft && styles.saveButtonDisabled]}
                                        onPress={handleSave}
                                        disabled={!draft}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.saveButtonText}>Speichern</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {props.type === 'options' && (
                                <View>
                                    {props.options.map((option) => {
                                        const isActive = String(value) === option;
                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                style={[styles.option, isActive && styles.optionActive]}
                                                onPress={() => handleOptionSelect(option)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
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
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: Colors.text,
        fontFamily: Fonts.sansMedium,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    saveButton: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.4,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    optionActive: {
        backgroundColor: Colors.accent + '22',
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
});
