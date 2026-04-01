import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DUMMY_VISIONS = [
    {
        id: '1',
        category: 'Karriere',
        affirmation: 'Ich bin ein erfolgreicher Unternehmer.',
        image: require('@/assets/category-images/strength.jpg'),
    },
    {
        id: '2',
        category: 'Gesundheit',
        affirmation: 'Mein Körper ist stark und voller Energie.',
        image: require('@/assets/category-images/endurance.jpeg'),
    },
    {
        id: '3',
        category: 'Liebe',
        affirmation: 'Ich lebe in einer tiefen, liebevollen Beziehung.',
        image: require('@/assets/category-images/team.jpeg'),
    },
    {
        id: '4',
        category: 'Finanzen',
        affirmation: 'Ich habe finanzielle Freiheit erreicht.',
        image: require('@/assets/category-images/athletics.jpg'),
    },
    {
        id: '5',
        category: 'Reisen',
        affirmation: 'Ich entdecke die Welt auf meinen eigenen Bedingungen.',
        image: require('@/assets/category-images/water.jpeg'),
    },
    {
        id: '6',
        category: 'Lifestyle',
        affirmation: 'Ich lebe das Leben meiner Träume jeden Tag.',
        image: require('@/assets/category-images/combat.jpg'),
    },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.logo}>veezy</Text>
                <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Vision Board Grid */}
            <FlatList
                data={DUMMY_VISIONS}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={[
                    styles.grid,
                    { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 20 },
                ]}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
                        <Image source={item.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={[StyleSheet.absoluteFill, { top: '35%' }]}
                        />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                            <Text style={styles.cardAffirmation} numberOfLines={3}>
                                {item.affirmation}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
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
        backgroundColor: '#0d0d0d',
    },
    logo: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 4,
    },
    settingsIcon: {
        fontSize: 20,
    },
    grid: {
        paddingHorizontal: 12,
    },
    row: {
        gap: 10,
        marginBottom: 10,
    },
    card: {
        flex: 1,
        aspectRatio: 0.72,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    cardContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 12,
    },
    cardCategory: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    cardAffirmation: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        fontStyle: 'italic',
    },
});
