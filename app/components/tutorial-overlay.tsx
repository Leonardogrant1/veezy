import { Colors, Fonts } from '@/constants/theme';
import { useTutorial } from '@/contexts/TutorialContext';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEP_DATA = [
    {
        title: 'Willkommen bei veezy',
        body: 'Dein persönliches Vision Board. Lass uns kurz zeigen, wie alles funktioniert.',
        cta: "Los geht's",
    },
    {
        title: 'Deine Vision',
        body: 'KI-generierte Bilder mit einer persönlichen Phrase — täglich daran erinnern, was du erreichen willst.',
        cta: 'Weiter',
    },
    {
        title: 'Vision-Aktionen',
        body: 'Tippe auf den Pfeil ↑ um deine Vision zu teilen, neu zu generieren oder zu löschen.',
        cta: 'Weiter',
    },
    {
        title: 'Wischen',
        body: 'Wische nach oben um zwischen deinen Visions zu wechseln.',
        cta: 'Weiter',
    },
    {
        title: 'Neue Vision erstellen',
        body: 'Tippe auf das +, beschreibe dein Ziel und die KI generiert dein persönliches Bild.',
        cta: 'Weiter',
    },
    {
        title: 'Nach Kategorie filtern',
        body: 'Filtere deine Visions nach Kategorie — Wealth, Body, Mindset und mehr.',
        cta: 'Weiter',
    },
    {
        title: 'Einstellungen',
        body: 'Verwalte dein Profil, dein Abo und weitere Einstellungen.',
        cta: 'Weiter',
    },
    {
        title: 'Du bist bereit!',
        body: 'Erstelle jetzt deine erste Vision und starte durch.',
        cta: 'Erste Vision erstellen',
    },
];

export function TutorialOverlay() {
    const { step, nextStep } = useTutorial();
    const insets = useSafeAreaInsets();
    const data = STEP_DATA[step];
    if (!data) return null;

    const isWelcome = step === 0;

    return (
        <>
            {/* Dark backdrop — always shown, highlighted elements appear above via zIndex: 20 */}
            <View style={styles.backdrop} pointerEvents="none" />

            {/* Tooltip card — zIndex: 25, above everything */}
            <View
                style={[
                    styles.cardContainer,
                    isWelcome
                        ? styles.cardContainerCentered
                        : { top: insets.top + 68, left: 16, right: 16 },
                ]}
                pointerEvents="box-none"
            >
                <View style={styles.card}>
                    <View style={styles.dotsRow}>
                        {STEP_DATA.map((_, i) => (
                            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
                        ))}
                    </View>
                    <Text style={styles.title}>{data.title}</Text>
                    <Text style={styles.body}>{data.body}</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={nextStep} activeOpacity={0.85}>
                        <Text style={styles.ctaText}>{data.cta}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 10,
    },
    cardContainer: {
        position: 'absolute',
        zIndex: 25,
    },
    cardContainerCentered: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 2,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.borderDivider,
    },
    dotActive: {
        backgroundColor: Colors.accent,
        width: 14,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        color: Colors.textHeadline,
    },
    body: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.text,
        lineHeight: 21,
    },
    ctaButton: {
        backgroundColor: Colors.accent,
        borderRadius: 999,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 4,
    },
    ctaText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
    },
});
