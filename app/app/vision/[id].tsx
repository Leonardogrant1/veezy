import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useVisionStore } from '@/stores/VisionStore';
import { regenerateVision } from '@/utils/generateVision';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';


export default function VisionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    const vision = useVisionStore((s) => s.visions.find((v) => v.id === id));
    const updatePhrase = useVisionStore((s) => s.updatePhrase);
    const updateImage = useVisionStore((s) => s.updateImage);
    const deleteVision = useVisionStore((s) => s.deleteVision);
    const userId = useUserDataStore((s) => s.userId);

    // Enter animation
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.93)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (!vision) return;
        MediaHandler.resolveUri(vision.imagePath).then((u) => setResolvedImageUri(`${u}?v=${vision.imageVersion ?? 1}`));
    }, [vision?.imagePath, vision?.imageVersion]);

    // Phrase editing
    const [resolvedImageUri, setResolvedImageUri] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const startEditing = () => {
        setEditValue(vision?.phrase ?? '');
        setIsEditing(true);
    };

    const savePhrase = () => {
        if (id) updatePhrase(id, editValue.trim() || (vision?.phrase ?? ''));
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
        setIsEditing(false);
    };

    // Regenerate image
    const [regenModalVisible, setRegenModalVisible] = useState(false);
    const [regenPrompt, setRegenPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRegenerate = async () => {
        if (!id) return;
        setIsGenerating(true);
        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== id)
                .map((v) => v.phrase)
                .filter(Boolean);
            const generated = await regenerateVision(id, regenPrompt.trim() || vision.phrase, userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            updateImage(id, relativePath);
            WidgetBridge.updateImage(relativePath, id).catch(() => { });
            setRegenModalVisible(false);
            setRegenPrompt('');
        } catch (error) {
            console.error(error);
            Alert.alert('Fehler', 'Generierung fehlgeschlagen. Bitte versuche es erneut.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Instagram sharing
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

    // Delete
    const handleDelete = () => {
        Alert.alert(
            'Vision löschen?',
            'Diese Aktion kann nicht rückgängig gemacht werden.',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: () => {
                        if (id) {
                            const imagePath = vision.imagePath;
                            deleteVision(id);
                            MediaHandler.delete(imagePath);
                            UserCloudSync.deleteVisionImage(id).catch(() => { });
                            WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
                        }
                        router.back();
                    },
                },
            ]
        );
    };

    if (!vision) return null;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>
                {/* Fullscreen image */}
                {resolvedImageUri && (
                    <Image
                        source={{ uri: resolvedImageUri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                )}

                {/* Top gradient for close btn legibility */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.35)', 'transparent']}
                    style={[StyleSheet.absoluteFill, { bottom: undefined, height: 180 }]}
                    pointerEvents="none"
                />

                {/* Bottom gradient for text legibility */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={[StyleSheet.absoluteFill, { top: undefined, height: 300 }]}
                    pointerEvents="none"
                />

                {/* Top bar */}
                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.iconText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={handleDelete} activeOpacity={0.7}>
                        <Text style={styles.iconText}>⋯</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom content */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.keyboardAvoiding}
                    pointerEvents="box-none"
                >
                    <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 32 }]}>
                        <Text style={styles.categoryBadge}>{vision.title.toUpperCase()}</Text>

                        {isEditing ? (
                            <TextInput
                                style={styles.phraseInput}
                                value={editValue}
                                onChangeText={setEditValue}
                                multiline
                                autoFocus
                                selectionColor="white"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                            />
                        ) : (
                            <TouchableOpacity onPress={startEditing} activeOpacity={0.8}>
                                <Text style={styles.phrase}>{vision.phrase}</Text>
                            </TouchableOpacity>
                        )}

                        {!isEditing && (
                            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                                <Text style={styles.shareText}>
                                    {hasInstagram ? '📲  In Instagram Story teilen' : '📤  Teilen'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.actions}>
                            {isEditing ? (
                                <TouchableOpacity style={styles.actionButton} onPress={savePhrase} activeOpacity={0.7}>
                                    <Text style={styles.actionText}>Speichern</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.actionButton} onPress={startEditing} activeOpacity={0.7}>
                                        <Text style={styles.actionText}>✏️  Phrase</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={() => setRegenModalVisible(true)} activeOpacity={0.7}>
                                        <Text style={styles.actionText}>🖼  Neu generieren</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Regenerate modal */}
                <Modal
                    visible={regenModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setRegenModalVisible(false)}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { Keyboard.dismiss(); if (!isGenerating) setRegenModalVisible(false); }}>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={styles.modalSheet}>
                                    <Text style={styles.modalTitle}>Bild neu generieren</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Beschreibe dein Wunschbild…"
                                        placeholderTextColor={Colors.textPlaceholder}
                                        value={regenPrompt}
                                        onChangeText={setRegenPrompt}
                                        multiline
                                        editable={!isGenerating}
                                    />
                                    <TouchableOpacity
                                        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                                        onPress={handleRegenerate}
                                        disabled={isGenerating}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.generateButtonText}>
                                            {isGenerating ? 'Generiert…' : 'Generieren'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </Modal>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 8,
        zIndex: 10,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.sansMedium,
    },
    keyboardAvoiding: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    bottomContent: {
        alignItems: 'center',
        paddingHorizontal: 28,
        gap: 16,
    },
    categoryBadge: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 10,
        letterSpacing: 2,
    },
    phrase: {
        color: 'white',
        fontFamily: Fonts.serifBoldItalic,
        fontSize: 26,
        lineHeight: 36,
        textAlign: 'center',
    },
    phraseInput: {
        color: 'white',
        fontFamily: Fonts.serifBoldItalic,
        fontSize: 26,
        lineHeight: 36,
        textAlign: 'center',
        minWidth: '100%',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    shareButton: {
        width: '100%',
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 16,
        alignItems: 'center',
    },
    shareText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    actionText: {
        color: 'white',
        fontFamily: Fonts.sansMedium,
        fontSize: 14,
    },
    // Regenerate modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 28,
        gap: 16,
    },
    modalTitle: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        color: Colors.text,
        fontFamily: Fonts.sans,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    generateButton: {
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: 'center',
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
    },
});
