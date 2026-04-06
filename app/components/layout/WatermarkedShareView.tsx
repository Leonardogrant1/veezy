import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Fonts, Gold } from '@/constants/theme';

type Props = {
    imageUri: string;
};

export const WatermarkedShareView = forwardRef<View, Props>(({ imageUri }, ref) => {
    return (
        <View ref={ref} style={styles.container} collapsable={false}>
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.watermark}>
                <Image
                    source={require('@/assets/images/watermark.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.text}>veezy.app</Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 1080,
        height: 1920,
        backgroundColor: '#0A0A0F',
    },
    watermark: {
        position: 'absolute',
        bottom: 80,
        right: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 50,
    },
    logo: {
        width: 50,
        height: 50,
    },
    text: {
        color: Gold[300],
        fontFamily: Fonts.sansSemiBold,
        fontSize: 50,
        letterSpacing: 0.5,
    },
});
