import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { File } from 'expo-file-system';

import { router } from 'expo-router';
import { fetch } from 'expo/fetch';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePickerModal } from '@/components/modals/ImagePickerModal';

import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { useUserDataStore } from '@/stores/UserDataStore';
import { SelfReferenceImages } from '@/types/user-data';
import { pickFromCamera, pickFromGallery } from '@/utils/image-picker';

type Slot = keyof SelfReferenceImages;

const SLOTS: { key: Slot; label: string; hint: string }[] = [
    { key: 'face_front', label: 'Frontal', hint: 'Gerade in die Kamera' },
    { key: 'face_left', label: 'Links', hint: 'Kopf leicht links' },
    { key: 'face_right', label: 'Rechts', hint: 'Kopf leicht rechts' },
    { key: 'body', label: 'Körper', hint: 'Ganzkörper sichtbar' },
];

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

export default function EditSelfReferenceScreen() {
    const insets = useSafeAreaInsets();
    const storedImages = useUserDataStore((s) => s.selfReferenceImages);

    console.log("storedImages", storedImages);
    const updateSelfReferenceImages = useUserDataStore((s) => s.updateSelfReferenceImages);
    const userId = useUserDataStore((s) => s.userId);

    const [uris, setUris] = useState<SelfReferenceImages>({
        face_front: null,
        face_left: null,
        face_right: null,
        body: null,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pickerTarget, setPickerTarget] = useState<Slot | null>(null);

    useEffect(() => {
        setUris({
            face_front: storedImages.face_front ? MediaHandler.toUri(storedImages.face_front) : null,
            face_left: storedImages.face_left ? MediaHandler.toUri(storedImages.face_left) : null,
            face_right: storedImages.face_right ? MediaHandler.toUri(storedImages.face_right) : null,
            body: storedImages.body ? MediaHandler.toUri(storedImages.body) : null,
        });
    }, []);

    async function handlePickFromGallery(slot: Slot) {
        setPickerTarget(null);
        const uri = await pickFromGallery();
        if (uri) setUris((prev) => ({ ...prev, [slot]: uri }));
    }

    async function handlePickFromCamera(slot: Slot) {
        setPickerTarget(null);
        const uri = await pickFromCamera();
        if (uri) setUris((prev) => ({ ...prev, [slot]: uri }));
    }

    function removeSlot(slot: Slot) {
        setUris((prev) => ({ ...prev, [slot]: null }));
    }

    const hasAny = useMemo(() => SLOTS.some((s) => uris[s.key] !== null), [uris]);

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const filledSlots = SLOTS.filter((s) => uris[s.key] !== null);
            const types = filledSlots.map((s) => s.key);

            const res = await fetch(`${BACKEND_URL}/self-reference/presign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rc-user-id': userId,
                },
                body: JSON.stringify({ types }),
            });

            if (!res.ok) throw new Error('Presign failed');
            const { urls } = await res.json() as { urls: Record<string, string> };

            const newPaths: Partial<SelfReferenceImages> = {};

            await Promise.all(
                filledSlots.map(async (s) => {
                    const uri = uris[s.key]!;
                    const sourceFile = new File(uri);

                    const arrayBuffer = await sourceFile.arrayBuffer();

                    // Upload to presigned URL
                    const uploadRes = await fetch(urls[s.key], {
                        method: 'PUT',
                        body: arrayBuffer,
                        headers: { 'Content-Type': 'image/jpeg' },
                    });

                    if (!uploadRes.ok) {
                        throw new Error(`Upload failed for ${s.key}`);
                    }

                    const relativePath = MediaHandler.saveFromLocal(uri, `self-reference/${s.key}.jpg`);
                    newPaths[s.key] = relativePath;
                })
            );

            updateSelfReferenceImages(newPaths);

            // Trigger composite generation (fire-and-forget, non-blocking)
            fetch(`${BACKEND_URL}/self-reference/composite`, {
                method: 'POST',
                headers: { 'x-rc-user-id': userId },
            }).catch(() => { }); // best-effort, doesn't block the user

            router.back();
        } catch (e: any) {
            setError(e.message ?? 'Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.title}>Referenzbilder</Text>
                <Text style={styles.subtitle}>
                    Diese Bilder werden genutzt, um dich in deinen Visionen darzustellen. Lade ein Foto aus vier Perspektiven hoch.
                </Text>

                <View style={styles.slots}>
                    {SLOTS.map((slot) => {
                        const uri = uris[slot.key];
                        return (
                            <TouchableOpacity
                                key={slot.key}
                                style={styles.slot}
                                onPress={() => setPickerTarget(slot.key)}
                                activeOpacity={0.8}
                            >
                                {uri ? (
                                    <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.slotEmpty}>
                                        <MaterialIcons name="add-a-photo" size={28} color={Colors.textPlaceholder} />
                                    </View>
                                )}
                                <View style={styles.slotFooter}>
                                    <Text style={styles.slotLabel}>{slot.label}</Text>
                                    <Text style={styles.slotHint}>{slot.hint}</Text>
                                </View>
                                {uri && (
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeSlot(slot.key)}
                                        hitSlop={8}
                                    >
                                        <MaterialIcons name="close" size={14} color="white" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
            </ScrollView>

            <ImagePickerModal
                visible={pickerTarget !== null}
                onCamera={() => handlePickFromCamera(pickerTarget!)}
                onGallery={() => handlePickFromGallery(pickerTarget!)}
                onClose={() => setPickerTarget(null)}
            />

            <View style={[styles.saveContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.saveButton, (!hasAny || saving) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!hasAny || saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Speichern</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        paddingHorizontal: 20,
    },
    closeButton: {
        marginBottom: 24,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderDivider,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 28,
        color: Colors.textHeadline,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 21,
        marginBottom: 32,
    },
    slots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slot: {
        width: '47%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    slotImage: {
        width: '100%',
        aspectRatio: 3 / 4,
    },
    slotEmpty: {
        width: '100%',
        aspectRatio: 3 / 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    slotFooter: {
        padding: 10,
        gap: 2,
    },
    slotLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        color: Colors.textHeadline,
    },
    slotHint: {
        fontFamily: Fonts.sans,
        fontSize: 11,
        color: Colors.textMuted,
        lineHeight: 15,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: '#e53935',
        marginTop: 16,
        textAlign: 'center',
    },
    saveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: Colors.background,
    },
    saveButton: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.4,
    },
    saveButtonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: 'white',
    },
});
