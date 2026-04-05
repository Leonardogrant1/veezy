import { Colors } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { Vision } from '@/types/vision';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function VisionSlide({ item, width, height }: { item: Vision; width: number; height: number }) {
    const [uri, setUri] = useState<string | null>(null);

    useEffect(() => {
        MediaHandler.resolveUri(item.imagePath).then((u) => setUri(`${u}?v=${item.imageVersion ?? 1}`));
    }, [item.imagePath, item.imageVersion]);

    return (
        <View style={{ width, height }}>
            {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
            )}
        </View>
    );
}