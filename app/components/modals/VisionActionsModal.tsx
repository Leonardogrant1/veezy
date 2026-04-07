import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import VisionLoading from '@/components/layout/VisionLoading';
import { WatermarkedShareView } from '@/components/layout/WatermarkedShareView';
import { EditFieldModal } from '@/components/modals/EditFieldModal';
import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
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
    const { refreshGenerationCount } = useRevenueCat();

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
            refreshGenerationCount().catch(() => { });
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
                                <Text style={styles.title}>Vision Optionen</Text>

                                {/* Main actions */}
                                <View style={styles.card}>
                                    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleShare}>
                                        <View style={[styles.iconBadge, { backgroundColor: Colors.accentSubtle + '55' }]}>
                                            {hasInstagram ? (
                                                <LottieView
                                                    source={require('@/assets/animations/instagram.json')}
                                                    autoPlay
                                                    loop={false}
                                                    style={styles.lottieIcon}
                                                />
                                            ) : (
                                                <MaterialIcons name="ios-share" size={18} color={Colors.accent} />
                                            )}
                                        </View>
                                        <Text style={styles.rowLabel}>
                                            {hasInstagram ? 'In Instagram Story teilen' : 'Teilen'}
                                        </Text>
                                        <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setEditField('phrase')}>
                                        <View style={[styles.iconBadge, { backgroundColor: Colors.borderDivider }]}>
                                            <MaterialIcons name="drive-file-rename-outline" size={18} color={Colors.textMuted} />
                                        </View>
                                        <Text style={styles.rowLabel}>Phrase bearbeiten</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => {
                                        Alert.alert(
                                            'Bild neu generieren?',
                                            'Ein neues Bild wird für diese Vision erstellt.',
                                            [
                                                { text: 'Abbrechen', style: 'cancel' },
                                                { text: 'Generieren', onPress: () => handleRegenerate(vision?.phrase ?? '') },
                                            ]
                                        );
                                    }}>
                                        <View style={[styles.iconBadge, { backgroundColor: Colors.borderDivider }]}>
                                            <MaterialIcons name="autorenew" size={18} color={Colors.textMuted} />
                                        </View>
                                        <Text style={styles.rowLabel}>Bild neu generieren</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                                    </TouchableOpacity>
                                </View>

                                {/* Destructive */}
                                <View style={styles.card}>
                                    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleDelete}>
                                        <View style={[styles.iconBadge, { backgroundColor: '#FF453A22' }]}>
                                            <MaterialIcons name="delete-outline" size={18} color="#FF453A" />
                                        </View>
                                        <Text style={[styles.rowLabel, styles.destructiveText]}>Vision löschen</Text>
                                        <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                                    </TouchableOpacity>
                                </View>
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
        position: 'relative',
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
        gap: 10,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 4,
    },
    title: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        marginBottom: 4,
    },
    card: {
        backgroundColor: Colors.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 12,
    },
    iconBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottieIcon: {
        width: 22,
        height: 22,
    },
    rowLabel: {
        flex: 1,
        color: Colors.text,
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.borderDivider,
        marginHorizontal: 14,
    },
    destructiveText: {
        color: '#FF453A',
    },
});
