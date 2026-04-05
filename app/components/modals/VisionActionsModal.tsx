import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { Vision } from '@/types/vision';
import { regenerateVision } from '@/utils/generateVision';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';

type ModalView = 'menu' | 'edit' | 'regen';

interface VisionActionsModalProps {
    vision: Vision | null;
    onClose: () => void;
}

export function VisionActionsModal({ vision, onClose }: VisionActionsModalProps) {
    const insets = useSafeAreaInsets();
    const visible = vision !== null;

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(400)).current;

    const updatePhrase = useVisionStore((s) => s.updatePhrase);
    const updateImage = useVisionStore((s) => s.updateImage);
    const deleteVision = useVisionStore((s) => s.deleteVision);
    const userId = useUserDataStore((s) => s.userId);

    const [view, setView] = useState<ModalView>('menu');
    const [editValue, setEditValue] = useState('');
    const [regenPrompt, setRegenPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInstagram, setHasInstagram] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            Linking.canOpenURL('instagram://').then(setHasInstagram);
        } else {
            Share.isPackageInstalled('com.instagram.android').then(
                ({ isInstalled }) => setHasInstagram(isInstalled)
            );
        }
    }, []);

    useEffect(() => {
        if (visible) {
            setView('menu');
            setEditValue(vision?.phrase ?? '');
            setRegenPrompt('');
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    function handleClose() {
        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
    }

    const handleShare = async () => {
        if (!vision) return;
        const localUri = MediaHandler.toUri(vision.imagePath);
        if (hasInstagram) {
            await Share.shareSingle({
                appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
                stickerImage: localUri,
                social: Share.Social.INSTAGRAM_STORIES,
                backgroundBottomColor: '#0a0a0a',
                backgroundTopColor: '#0a0a0a',
            });
        } else {
            await Share.open({ url: localUri });
        }
    };

    const handleSavePhrase = () => {
        if (!vision) return;
        updatePhrase(vision.id, editValue.trim() || vision.phrase);
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
        setView('menu');
        Keyboard.dismiss();
    };

    const handleRegenerate = async () => {
        if (!vision) return;
        setIsGenerating(true);
        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== vision.id)
                .map((v) => v.phrase)
                .filter(Boolean);
            const generated = await regenerateVision(vision.id, regenPrompt.trim() || vision.phrase, userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            updateImage(vision.id, relativePath);
            WidgetBridge.updateImage(relativePath, vision.id).catch(() => { });
            setRegenPrompt('');
            setView('menu');
        } catch (error) {
            console.error(error);
            Alert.alert('Fehler', 'Generierung fehlgeschlagen. Bitte versuche es erneut.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = () => {
        if (!vision) return;
        Alert.alert(
            'Vision löschen?',
            'Diese Aktion kann nicht rückgängig gemacht werden.',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: () => {
                        const imagePath = vision.imagePath;
                        deleteVision(vision.id);
                        MediaHandler.delete(imagePath);
                        UserCloudSync.deleteVisionImage(vision.id).catch(() => { });
                        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
                        handleClose();
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                    <Pressable style={styles.backdropPressable} onPress={handleClose}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                                <View style={styles.handle} />

                                {view === 'menu' && (
                                    <>
                                        <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleShare}>
                                            <Text style={styles.optionText}>
                                                {hasInstagram ? 'In Instagram Story teilen' : 'Teilen'}
                                            </Text>
                                        </TouchableOpacity>

                                        <View style={styles.divider} />

                                        <TouchableOpacity
                                            style={styles.option}
                                            activeOpacity={0.7}
                                            onPress={() => { setEditValue(vision?.phrase ?? ''); setView('edit'); }}
                                        >
                                            <Text style={styles.optionText}>Phrase bearbeiten</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={() => setView('regen')}>
                                            <Text style={styles.optionText}>Neu generieren</Text>
                                        </TouchableOpacity>

                                        <View style={styles.divider} />

                                        <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleDelete}>
                                            <Text style={[styles.optionText, styles.destructiveText]}>Löschen</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {view === 'edit' && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.option}
                                            activeOpacity={0.7}
                                            onPress={() => { setView('menu'); Keyboard.dismiss(); }}
                                        >
                                            <Text style={styles.backText}>← Zurück</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.subTitle}>Phrase bearbeiten</Text>

                                        <TextInput
                                            style={styles.textInput}
                                            value={editValue}
                                            onChangeText={setEditValue}
                                            multiline
                                            autoFocus
                                            placeholderTextColor={Colors.textPlaceholder}
                                        />

                                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleSavePhrase}>
                                            <Text style={styles.primaryButtonText}>Speichern</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {view === 'regen' && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.option}
                                            activeOpacity={0.7}
                                            onPress={() => { if (!isGenerating) { setView('menu'); Keyboard.dismiss(); } }}
                                        >
                                            <Text style={styles.backText}>← Zurück</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.subTitle}>Bild neu generieren</Text>

                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Beschreibe dein Wunschbild…"
                                            placeholderTextColor={Colors.textPlaceholder}
                                            value={regenPrompt}
                                            onChangeText={setRegenPrompt}
                                            multiline
                                            editable={!isGenerating}
                                        />

                                        <TouchableOpacity
                                            style={[styles.primaryButton, isGenerating && styles.primaryButtonDisabled]}
                                            activeOpacity={0.8}
                                            onPress={handleRegenerate}
                                            disabled={isGenerating}
                                        >
                                            <Text style={styles.primaryButtonText}>
                                                {isGenerating ? 'Generiert…' : 'Generieren'}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </Animated.View>
                        </Pressable>
                    </Pressable>
                </Animated.View>
            </KeyboardAvoidingView>
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
    divider: {
        height: 1,
        backgroundColor: Colors.borderDivider,
        marginVertical: 4,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    optionText: {
        color: Colors.text,
        fontFamily: Fonts.sansMedium,
        fontSize: 16,
    },
    destructiveText: {
        color: '#FF453A',
    },
    backText: {
        color: Colors.accent,
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
    },
    subTitle: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    textInput: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontFamily: Fonts.sans,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    primaryButton: {
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
    },
});
