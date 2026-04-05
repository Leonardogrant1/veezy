import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { Vision } from '@/types/vision';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
    item: Vision;
    cardHeight: number;
};

export function VisionCard({ item, cardHeight }: Props) {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        MediaHandler.resolveUri(item.imagePath).then((u) => setUri(`${u}?v=${item.imageVersion ?? 1}`));
    }, [item.imagePath, item.imageVersion]);

    return (
        <TouchableOpacity
            style={[styles.card, { height: cardHeight }]}
            activeOpacity={0.92}
            onPress={() => router.push(`/vision/${item.id}`)}
        >
            {uri && (
                <Image
                    source={{ uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            )}
            <View style={styles.glassWrapper}>
                {item.title ? (
                    <Text style={styles.cardCategory}>{item.title.toUpperCase()}</Text>
                ) : null}
                <Text style={styles.cardPhrase} numberOfLines={2}>
                    {item.phrase}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
    },
    glassWrapper: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 14,
        borderRadius: 14,
        overflow: 'hidden',
        padding: 14,
    },

    cardCategory: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 9,
        letterSpacing: 2,
        marginBottom: 5,
    },
    cardPhrase: {
        color: 'rgba(255,255,255,0.93)',
        fontFamily: Fonts.serifBoldItalic,
        fontSize: 19,
        lineHeight: 25,
    },
});
