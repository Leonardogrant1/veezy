import VisionLoading from '@/components/layout/VisionLoading';
import { WatermarkedShareView } from '@/components/layout/WatermarkedShareView';
import { EditFieldModal } from '@/components/modals/EditFieldModal';
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
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';


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

    const [editField, setEditField] = useState<'phrase' | 'regen' | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInstagram, setHasInstagram] = useState(false);
    const loadingOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(loadingOpacity, {
            toValue: isGenerating ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [isGenerating]);
    const shareViewRef = useRef<View>(null);

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
            setEditField(null);
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
        if (!vision || !shareViewRef.current) return;
        const watermarkedUri = await captureRef(shareViewRef, { format: 'png', quality: 1 });
        if (hasInstagram) {
            await Share.shareSingle({
                appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '',
                stickerImage: watermarkedUri,
                //@ts-ignore
                social: Share.Social.INSTAGRAM_STORIES,
                backgroundBottomColor: '#0a0a0a',
                backgroundTopColor: '#0a0a0a',
            });
        } else {
            await Share.open({
                url: watermarkedUri,
                subject: 'Teile deine Vision',
                filename: 'vision.png',
                title: 'Teile deine Vision',
                message: 'Ich habe meine Vision mit Veezy visualisiert! ✨ #Veezy #VisionBoard #Manifestation',
            });
        }
    };

    const handleSavePhrase = (value: string) => {
        if (!vision) return;
        updatePhrase(vision.id, value.trim() || vision.phrase);
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
    };

    const handleRegenerate = async (prompt: string) => {
        if (!vision) return;
        setIsGenerating(true);
        try {
            const existingPhrases = useVisionStore.getState().visions
                .filter((v) => v.id !== vision.id)
                .map((v) => v.phrase)
                .filter(Boolean);
            const generated = await regenerateVision(vision.id, prompt.trim() || vision.phrase, userId, existingPhrases);
            const relativePath = await MediaHandler.saveFromRemote(generated.imageUrl, generated.imageKey);
            updateImage(vision.id, relativePath);
            WidgetBridge.updateImage(relativePath, vision.id).catch(() => { });
        } catch (error) {
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
        <>
            <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>

                <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                    {vision && (
                        <View style={styles.offScreen}>
                            <WatermarkedShareView ref={shareViewRef} imageUri={MediaHandler.toUri(vision.imagePath)} />
                        </View>
                    )}
                    <Pressable style={styles.backdropPressable} onPress={handleClose}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                                <View style={styles.handle} />

                                <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleShare}>
                                    <Text style={styles.optionText}>
                                        {hasInstagram ? 'In Instagram Story teilen' : 'Teilen'}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={() => setEditField('phrase')}>
                                    <Text style={styles.optionText}>Phrase bearbeiten</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={() => {
                                    Alert.alert(
                                        'Bild neu generieren?',
                                        'Ein neues Bild wird für diese Vision erstellt.',
                                        [
                                            { text: 'Abbrechen', style: 'cancel' },
                                            { text: 'Generieren', onPress: () => handleRegenerate(vision?.phrase ?? '') },
                                        ]
                                    );
                                }}>
                                    <Text style={styles.optionText}>Bild neu generieren</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.option} activeOpacity={0.7} onPress={handleDelete}>
                                    <Text style={[styles.optionText, styles.destructiveText]}>Löschen</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </Pressable>
                    </Pressable>
                </Animated.View>

                {isGenerating && (
                    <Animated.View style={[styles.loadingOverlay, { opacity: loadingOpacity }]} pointerEvents="none">
                        <VisionLoading />
                    </Animated.View>
                )}
                <EditFieldModal
                    visible={editField === 'phrase'}
                    title="Phrase bearbeiten"
                    type="text"
                    value={vision?.phrase}
                    onSave={handleSavePhrase}
                    onClose={() => setEditField(null)}
                />
            </Modal>

        </>
    );
}

const styles = StyleSheet.create({
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    offScreen: {
        position: 'absolute',
        top: -9999,
        left: -9999,
        opacity: 0,
    },
    backdrop: {
        flex: 1,
        position: "relative",
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
