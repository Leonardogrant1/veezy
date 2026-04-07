import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserPhotoIcon from '@/assets/icons/user_square.svg';
import { BirthdayPickerModal } from '@/components/modals/BirthdayPickerModal';
import { EditFieldModal } from '@/components/modals/EditFieldModal';
import { NotificationSettingsModal } from '@/components/modals/NotificationSettingsModal';
import { Colors, Fonts } from '@/constants/theme';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { calculateAge } from '@/types/user-data';

const LEGAL_ROWS = [
    { label: 'Nutzungsbedingungen', url: 'https://northbyte.studio/terms-of-use/veezy' },
    { label: 'Datenschutz', url: 'https://northbyte.studio/privacy-policy/veezy' },
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const name = useUserDataStore((s) => s.name);
    const birthday = useUserDataStore((s) => s.birthday);
    const haptics = useUserDataStore((s) => s.haptics);
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    const { hasEntitlement } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();
    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    const [editField, setEditField] = useState<'name' | 'birthday' | null>(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    const ageDisplay = birthday
        ? (() => {
            const [y, m, d] = birthday.split('-');
            return `${d}.${m}.${y} (${calculateAge(birthday)})`;
        })()
        : '—';

    const settingsRows = [
        { label: 'Name', value: name || '—', onPress: () => setEditField('name') },
        { label: 'Geburtstag', value: ageDisplay, onPress: () => setEditField('birthday') },
        { label: 'Benachrichtigungen', value: undefined, onPress: () => setShowNotificationModal(true) },
        { label: 'Abo verwalten', value: undefined, onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') },
        { label: 'Tutorial wiederholen', value: undefined, onPress: () => router.replace('/tutorial') },
        { label: 'Feature anfragen', value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/features/veezy') },
        { label: 'Bug melden', value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/bugs/veezy') },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
                {/* Close */}
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={22} color={Colors.textMuted} />
                </TouchableOpacity>

                {/* App title */}
                <Text style={styles.appTitle}>veezy</Text>

                {/* Self-Reference */}
                <TouchableOpacity style={styles.selfReferenceCard} onPress={() => router.push('/edit-self-reference')} activeOpacity={0.75}>
                    <View style={styles.selfReferenceLeft}>
                        <UserPhotoIcon width={24} height={24} color={Colors.textHeadline} />
                        <View style={styles.selfReferenceText}>
                            <Text style={styles.selfReferenceTitle}>Referenzbilder</Text>
                            <Text style={styles.selfReferenceSubtitle}>Fotos für personalisierte Visionen</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                </TouchableOpacity>

                {/* Premium card */}
                {!isPremium && (
                    <TouchableOpacity style={styles.premiumCard} activeOpacity={0.85} onPress={() => openWithPlacement('add_premium_settings')}>
                        <View style={styles.premiumLeft}>
                            <View style={styles.premiumIconBadge}>
                                <MaterialCommunityIcons name="crown" size={20} color={Colors.accent} />
                            </View>
                            <View>
                                <Text style={styles.premiumTitle}>Veezy Premium</Text>
                                <Text style={styles.premiumSubtitle}>Alle Features freischalten</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                )}

                {/* Settings */}
                <Text style={styles.sectionLabel}>Einstellungen</Text>
                <View style={styles.rowGroup}>
                    {settingsRows.map((row, i) => (
                        <TouchableOpacity
                            key={row.label}
                            style={[styles.row, styles.rowBorder]}
                            onPress={row.onPress}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <View style={styles.rowRight}>
                                {row.value !== undefined && (
                                    <Text style={styles.rowValue}>{row.value}</Text>
                                )}
                                <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                            </View>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Haptik</Text>
                        <Switch
                            value={haptics}
                            onValueChange={(v) => updateSettings({ haptics: v })}
                            trackColor={{ false: Colors.borderDivider, true: Colors.accent }}
                            thumbColor="white"
                        />
                    </View>
                </View>

                {/* Legal */}
                <Text style={styles.sectionLabel}>Rechtliches</Text>
                <View style={styles.rowGroup}>
                    {LEGAL_ROWS.map((row, i) => (
                        <TouchableOpacity
                            key={row.label}
                            style={[styles.row, i < LEGAL_ROWS.length - 1 && styles.rowBorder]}
                            onPress={() => WebBrowser.openBrowserAsync(row.url)}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <EditFieldModal
                visible={editField === 'name'}
                title="Name"
                type="text"
                placeholder="Dein Name"
                value={name}
                onSave={(v) => updateSettings({ name: v })}
                onClose={() => setEditField(null)}
            />

            <BirthdayPickerModal
                visible={editField === 'birthday'}
                value={birthday}
                onSave={(iso) => updateSettings({ birthday: iso })}
                onClose={() => setEditField(null)}
            />

            <NotificationSettingsModal
                visible={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
            />
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
    appTitle: {
        fontFamily: Fonts.serifBold,
        fontSize: 36,
        color: Colors.textHeadline,
        textAlign: 'center',
        marginBottom: 32,
    },
    selfReferenceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 28,
    },
    selfReferenceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selfReferenceText: {
        gap: 2,
    },
    selfReferenceTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
        color: Colors.textHeadline,
    },
    selfReferenceSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Colors.textMuted,
    },
    premiumCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1400',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 28,
    },
    premiumLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    premiumIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumTitle: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
        color: Colors.accent,
    },
    premiumSubtitle: {
        fontFamily: Fonts.sans,
        fontSize: 13,
        color: Colors.accent,
        marginTop: 2,
    },
    sectionLabel: {
        fontFamily: Fonts.serifBold,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 10,
        marginTop: 4,
    },
    rowGroup: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        marginBottom: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.borderDivider,
    },
    rowLabel: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.text,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rowValue: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.textMuted,
    },
});
