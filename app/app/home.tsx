import { Colors, Fonts } from '@/constants/theme';
import { MediaHandler } from '@/lib/media-handler';
import { useVisionStore } from '@/stores/VisionStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const visions = useVisionStore((s) => s.visions);

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>
                <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7} onPress={() => router.push('/settings')}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Vision Board Grid */}
            <FlatList
                data={visions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.grid,
                    { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/vision/${item.id}`)}>
                        <Image
                          source={{ uri: MediaHandler.toUri(item.imagePath) }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={[StyleSheet.absoluteFill, { top: '35%' }]}
                        />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardCategory}>{item.title.toUpperCase()}</Text>
                            <Text style={styles.cardPhrase} numberOfLines={3}>
                                {item.phrase}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 24 }]}
                activeOpacity={0.85}
                onPress={() => router.push('/vision/add')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: Colors.background,
    },
    logo: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 24,
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 4,
    },
    settingsIcon: {
        fontSize: 20,
    },
    grid: {
        paddingHorizontal: 16,
        gap: 12,
    },
    card: {
        aspectRatio: 4 / 3,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
    },
    cardContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 28,
    },
    cardCategory: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 9,
        letterSpacing: 1.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    cardPhrase: {
        color: 'white',
        fontFamily: Fonts.serifBoldItalic,
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        color: 'white',
        fontSize: 28,
        fontFamily: Fonts.sansBold,
        lineHeight: 32,
    },
});
