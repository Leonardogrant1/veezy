import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { File } from 'expo-file-system';

import body_icon from '@/assets/face-photo-icons/body.svg';
import face_front_icon from '@/assets/face-photo-icons/face_front.svg';
import face_left_icon from '@/assets/face-photo-icons/face_left.svg';
import face_right_icon from '@/assets/face-photo-icons/face_right.svg';
import face_smile_icon from '@/assets/face-photo-icons/face_smile.svg';

import { router } from 'expo-router';
import { fetch } from 'expo/fetch';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePickerModal } from '@/components/modals/ImagePickerModal';

import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { useUserDataStore } from '@/stores/UserDataStore';
import { SelfReferenceImages } from '@/types/user-data';
import { pickFromCamera, pickFromGallery } from '@/utils/image-picker';

type Slot = keyof SelfReferenceImages;

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';

export default function EditSelfReferenceScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const SLOTS: { key: Slot; label: string; hint: string; wide?: boolean; icon: any }[] = [
        { key: 'face_front', label: t('onboarding.photo_upload.slot_front'), hint: t('onboarding.photo_upload.slot_front_hint'), icon: face_front_icon },
        { key: 'face_smile', label: t('onboarding.photo_upload.slot_smile'), hint: t('onboarding.photo_upload.slot_smile_hint'), icon: face_smile_icon },
        { key: 'face_left', label: t('onboarding.photo_upload.slot_left'), hint: t('onboarding.photo_upload.slot_left_hint'), icon: face_left_icon },
        { key: 'face_right', label: t('onboarding.photo_upload.slot_right'), hint: t('onboarding.photo_upload.slot_right_hint'), icon: face_right_icon },
        { key: 'body', label: t('onboarding.photo_upload.slot_body'), hint: t('onboarding.photo_upload.slot_body_hint'), wide: true, icon: body_icon },
    ];
    const storedImages = useUserDataStore((s) => s.selfReferenceImages);

    const updateSelfReferenceImages = useUserDataStore((s) => s.updateSelfReferenceImages);
    const userId = useUserDataStore((s) => s.userId);

    const [uris, setUris] = useState<SelfReferenceImages>({
        face_front: null,
        face_smile: null,
        face_left: null,
        face_right: null,
        body: null,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pickerTarget, setPickerTarget] = useState<Slot | null>(null);

    useEffect(() => {
        const resolve = async () => {
            setUris({
                face_front: storedImages.face_front ? await MediaHandler.resolveUri(storedImages.face_front) : null,
                face_smile: storedImages.face_smile ? await MediaHandler.resolveUri(storedImages.face_smile) : null,
                face_left: storedImages.face_left ? await MediaHandler.resolveUri(storedImages.face_left) : null,
                face_right: storedImages.face_right ? await MediaHandler.resolveUri(storedImages.face_right) : null,
                body: storedImages.body ? await MediaHandler.resolveUri(storedImages.body) : null,
            });
        };
        resolve().catch(() => { });
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

                    const relativePath = MediaHandler.saveFromLocal(uri, `self-reference/${userId}/${s.key}`);
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
            setError(e.message ?? t('edit_self_reference.save_error'));
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

                <Text style={styles.title}>{t('settings.self_reference_title')}</Text>
                <Text style={styles.subtitle}>{t('edit_self_reference.subtitle')}</Text>

                <View style={styles.slots}>
                    {SLOTS.map((slot) => {
                        const uri = uris[slot.key];
                        return (
                            <TouchableOpacity
                                key={slot.key}
                                style={[styles.slot, slot.wide && styles.slotWide]}
                                onPress={() => setPickerTarget(slot.key)}
                                activeOpacity={0.8}
                            >
                                {uri ? (
                                    <Image source={{ uri }} style={[styles.slotImage, slot.wide && styles.slotImageWide]} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.slotEmpty, slot.wide && styles.slotEmptyWide]}>
                                        <slot.icon width={slot.key === 'body' ? 100 : 70} height={slot.key === 'body' ? 100 : 70} />
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
                        <Text style={styles.saveButtonText}>{t('edit_self_reference.save')}</Text>
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
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    slotWide: {
        width: '100%',
    },
    slotImage: {
        width: '100%',
        aspectRatio: 3 / 4,
    },
    slotImageWide: {
        aspectRatio: 16 / 9,
    },
    slotEmpty: {
        width: '100%',
        aspectRatio: 3 / 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    slotEmptyWide: {
        aspectRatio: 16 / 9,
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
