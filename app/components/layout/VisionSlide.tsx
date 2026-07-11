import { GlowPulse } from '@/components/layout/GlowPulse';
import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { Vision } from '@/types/vision';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export function VisionSlide({ item, width, height, locked }: { item: Vision; width: number; height: number; locked?: boolean }) {
    const { t } = useTranslation();
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        if (!item.imagePath) {
            setUri(null);
            return;
        }
        MediaHandler.resolveUri(item.imagePath).then((u) => setUri(`${u}?v=${item.imageVersion ?? 1}`));
    }, [item.imagePath, item.imageVersion]);

    const isPending = item.status === 'pending';
    const isFailed = item.status === 'failed' && !uri;

    return (
        <View style={{ width, height }}>
            {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
            )}

            {isPending && !uri && (
                <View style={styles.stateOverlay}>
                    <GlowPulse size={180} />
                    <Text style={styles.stateTextDark}>{t('vision.slide.generating')}</Text>
                </View>
            )}

            {isPending && uri && (
                <View style={[StyleSheet.absoluteFill, styles.regenOverlay]}>
                    <ActivityIndicator color="white" size="large" />
                    <Text style={styles.stateText}>{t('vision.slide.generating_update')}</Text>
                </View>
            )}

            {isFailed && (
                <View style={styles.stateOverlay}>
                    <MaterialCommunityIcons name="image-off-outline" size={40} color={Colors.textMuted} />
                    <Text style={styles.stateTextDark}>{t('vision.slide.failed')}</Text>
                </View>
            )}

            {locked && (
                <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.lockOverlay}>
                        <View style={styles.lockBadge}>
                            <MaterialCommunityIcons name="crown" size={28} color={Colors.accent} />
                        </View>
                        <Text style={styles.lockText}>{t('vision.slide.premium_unlock')}</Text>
                    </View>
                </BlurView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    stateOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingHorizontal: 40,
    },
    regenOverlay: {
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    stateText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        textAlign: 'center',
    },
    stateTextDark: {
        color: Colors.textMuted,
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
        textAlign: 'center',
    },
    lockOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    lockBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Fonts.sansMedium,
        fontSize: 15,
    },
});
