import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Logo from '@/assets/logo.svg';
import { STORE_URL } from '@/constants/store-urls';
import { Colors, Fonts } from '@/constants/theme';

type Props = { releaseNotes: string | null };

export function ForceUpdateScreen({ releaseNotes }: Props) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.content}>
                <View style={styles.logoWrapper}>
                    <Logo width={64} height={64} />
                </View>

                <Text style={styles.title}>{t('version.force_update_title')}</Text>
                <Text style={styles.body}>{t('version.force_update_body')}</Text>

                {releaseNotes ? (
                    <View style={styles.notesCard}>
                        <Text style={styles.notesLabel}>{t('version.whats_new')}</Text>
                        <Text style={styles.notesText}>{releaseNotes}</Text>
                    </View>
                ) : null}
            </View>

            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(STORE_URL)} activeOpacity={0.85}>
                <Text style={styles.buttonText}>{t('version.update_now')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    logoWrapper: {
        marginBottom: 16,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 28,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    body: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        lineHeight: 23,
        color: Colors.textMuted,
        textAlign: 'center',
        maxWidth: 300,
    },
    notesCard: {
        backgroundColor: Colors.surface,
        borderColor: Colors.borderCard,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        width: '100%',
        marginTop: 8,
        gap: 6,
    },
    notesLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 13,
        color: Colors.text,
    },
    notesText: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.textMuted,
    },
    button: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: '#ffffff',
    },
});
