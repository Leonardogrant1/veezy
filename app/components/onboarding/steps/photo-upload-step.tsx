import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import body from '@/assets/face-photo-icons/body.svg';
import face_front from '@/assets/face-photo-icons/face_front.svg';
import face_left from '@/assets/face-photo-icons/face_left.svg';
import face_right from '@/assets/face-photo-icons/face_right.svg';
import face_smile from '@/assets/face-photo-icons/face_smile.svg';
import { ImagePickerModal } from '@/components/modals/ImagePickerModal';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import { SelfReferenceImages } from '@/types/user-data';
import { pickFromCamera, pickFromGallery } from '@/utils/image-picker';

type Slot = keyof SelfReferenceImages;

export function PhotoUploadStep() {
    const { t } = useTranslation();
    const { setCanContinue } = useOnboardingControl();
    const updateSelfReferenceImages = useUserDataStore((s) => s.updateSelfReferenceImages);

    const SLOTS: { key: Slot; label: string; hint: string; wide?: boolean; icon: any }[] = [
        { key: 'face_front', label: t('onboarding.photo_upload.slot_front'), hint: t('onboarding.photo_upload.slot_front_hint'), icon: face_front },
        { key: 'face_smile', label: t('onboarding.photo_upload.slot_smile'), hint: t('onboarding.photo_upload.slot_smile_hint'), icon: face_smile },
        { key: 'face_left', label: t('onboarding.photo_upload.slot_left'), hint: t('onboarding.photo_upload.slot_left_hint'), icon: face_left },
        { key: 'face_right', label: t('onboarding.photo_upload.slot_right'), hint: t('onboarding.photo_upload.slot_right_hint'), icon: face_right },
        { key: 'body', label: t('onboarding.photo_upload.slot_body'), hint: t('onboarding.photo_upload.slot_body_hint'), wide: true, icon: body },
    ];

    const [uris, setUris] = useState<SelfReferenceImages>({
        face_front: null, face_smile: null, face_left: null, face_right: null, body: null,
    });
    const [pickerTarget, setPickerTarget] = useState<Slot | null>(null);

    function applyUri(slot: Slot, uri: string) {
        const updated = { ...uris, [slot]: uri };
        setUris(updated);
        updateSelfReferenceImages({ [slot]: uri });
        setCanContinue(Object.values(updated).some(Boolean));
    }

    async function handleCamera(slot: Slot) {
        setPickerTarget(null);
        const uri = await pickFromCamera();
        if (uri) applyUri(slot, uri);
    }

    async function handleGallery(slot: Slot) {
        setPickerTarget(null);
        const uri = await pickFromGallery();
        if (uri) applyUri(slot, uri);
    }

    function removeSlot(slot: Slot) {
        const updated = { ...uris, [slot]: null };
        setUris(updated);
        updateSelfReferenceImages({ [slot]: null });
        setCanContinue(Object.values(updated).some(Boolean));
    }

    return (
        <>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{t('onboarding.photo_upload.title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.photo_upload.subtitle')}</Text>

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
                                    <Image
                                        source={{ uri }}
                                        style={[styles.slotImage, slot.wide && styles.slotImageWide]}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.slotEmpty, slot.wide && styles.slotEmptyWide]}>
                                        <slot.icon width={slot.key == "body" ? 100 : 70} height={slot.key == "body" ? 100 : 70} />
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
            </ScrollView>

            <ImagePickerModal
                visible={pickerTarget !== null}
                onCamera={() => handleCamera(pickerTarget!)}
                onGallery={() => handleGallery(pickerTarget!)}
                onClose={() => setPickerTarget(null)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 24,
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
        borderWidth: 1,
        borderColor: Colors.text,
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
});
