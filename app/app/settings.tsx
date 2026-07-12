import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import UserPhotoIcon from '@/assets/icons/user_square.svg';
import { BirthdayPickerModal } from '@/components/modals/BirthdayPickerModal';
import { SupportTicketModal } from '@/components/modals/SupportTicketModal';
import { EditFieldModal } from '@/components/modals/EditFieldModal';
import { NotificationSettingsModal } from '@/components/modals/NotificationSettingsModal';
import { Colors, Fonts } from '@/constants/theme';
import { changeLanguage } from '@/i18n';
import { PREMIUM_IDENTIFIER } from '@/services/purchases/revenuecat/constants';
import { useRevenueCat } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { openPlacementWithImage } from '@/utils/openPlacementWithImage';
import { useUserDataStore } from '@/stores/UserDataStore';
import { calculateAge } from '@/types/user-data';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const name = useUserDataStore((s) => s.name);
    const birthday = useUserDataStore((s) => s.birthday);
    const haptics = useUserDataStore((s) => s.haptics);
    const language = useUserDataStore((s) => s.language);
    const showDevButtons = useUserDataStore((s) => s.showDevButtons);
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    const { hasEntitlement } = useRevenueCat();
    const { openWithPlacement } = useSuperwallFunctions();
    const isPremium = hasEntitlement(PREMIUM_IDENTIFIER);

    const [editField, setEditField] = useState<'name' | 'birthday' | null>(null);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

    const ageDisplay = birthday
        ? (() => {
            const [y, m, d] = birthday.split('-');
            return `${d}.${m}.${y} (${calculateAge(birthday)})`;
        })()
        : '—';

    const settingsRows = [
        { label: t('settings.row_name'), value: name || '—', onPress: () => setEditField('name') },
        { label: t('settings.row_birthday'), value: ageDisplay, onPress: () => setEditField('birthday') },
        { label: t('settings.row_notifications'), value: undefined, onPress: () => setShowNotificationModal(true) },
        { label: t('settings.row_subscription'), value: undefined, onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') },
        { label: t('settings.row_tutorial'), value: undefined, onPress: () => router.replace('/tutorial') },
        { label: t('settings.row_request_feature'), value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/features/veezy') },
        { label: t('settings.row_report_bug'), value: undefined, onPress: () => WebBrowser.openBrowserAsync('https://northbyte.studio/bugs/veezy') },
    ];

    const LEGAL_ROWS = [
        { label: t('settings.legal_terms'), url: 'https://northbyte.studio/terms-of-use/veezy' },
        { label: t('settings.legal_privacy'), url: 'https://northbyte.studio/privacy-policy/veezy' },
    ];

    const currentLang = i18n.language as 'de' | 'en';

    function handleLanguageToggle(lang: 'de' | 'en') {
        changeLanguage(lang);
        updateSettings({ language: lang });
    }

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
                            <Text style={styles.selfReferenceTitle}>{t('settings.self_reference_title')}</Text>
                            <Text style={styles.selfReferenceSubtitle}>{t('settings.self_reference_subtitle')}</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                </TouchableOpacity>

                {/* Premium card */}
                {!isPremium && (
                    <TouchableOpacity style={styles.premiumCard} activeOpacity={0.85} onPress={() => openPlacementWithImage(openWithPlacement, 'add_premium_settings')}>
                        <View style={styles.premiumLeft}>
                            <View style={styles.premiumIconBadge}>
                                <MaterialCommunityIcons name="crown" size={20} color={Colors.accent} />
                            </View>
                            <View>
                                <Text style={styles.premiumTitle}>{t('settings.premium_title')}</Text>
                                <Text style={styles.premiumSubtitle}>{t('settings.premium_subtitle')}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                )}

                {/* Settings */}
                <Text style={styles.sectionLabel}>{t('settings.section_settings')}</Text>
                <View style={styles.rowGroup}>
                    {settingsRows.map((row) => (
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
                    {/* Haptics row */}
                    <View style={[styles.row, styles.rowBorder]}>
                        <Text style={styles.rowLabel}>{t('settings.row_haptics')}</Text>
                        <Switch
                            value={haptics}
                            onValueChange={(v) => updateSettings({ haptics: v })}
                            trackColor={{ false: Colors.borderDivider, true: Colors.accent }}
                            thumbColor="white"
                        />
                    </View>
                    {/* Language row */}
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>{t('settings.row_language')}</Text>
                        <View style={styles.languagePicker}>
                            <TouchableOpacity
                                style={[styles.langButton, currentLang === 'de' && styles.langButtonActive]}
                                onPress={() => handleLanguageToggle('de')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.langFlag}>🇩🇪</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.langButton, currentLang === 'en' && styles.langButtonActive]}
                                onPress={() => handleLanguageToggle('en')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.langFlag}>🇬🇧</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Support */}
                <Text style={styles.sectionLabel}>{t('support.section_label')}</Text>
                <View style={styles.rowGroup}>
                    <TouchableOpacity style={styles.row} onPress={() => setShowSupportModal(true)} activeOpacity={0.6}>
                        <Text style={styles.rowLabel}>{t('support.row_create_ticket')}</Text>
                        <MaterialIcons name="chevron-right" size={20} color={Colors.textPlaceholder} />
                    </TouchableOpacity>
                </View>

                {/* Legal */}
                <Text style={styles.sectionLabel}>{t('settings.section_legal')}</Text>
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

                {/* DEV – only in __DEV__ builds */}
                {__DEV__ && (
                    <>
                        <Text style={[styles.sectionLabel, { color: '#f97316' }]}>🛠 Developer</Text>
                        <View style={styles.rowGroup}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>DEV Buttons anzeigen</Text>
                                <Switch
                                    value={showDevButtons}
                                    onValueChange={(v) => updateSettings({ showDevButtons: v })}
                                    trackColor={{ false: Colors.borderDivider, true: '#f97316' }}
                                    thumbColor="white"
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <EditFieldModal
                visible={editField === 'name'}
                title={t('settings.edit_name_title')}
                type="text"
                placeholder={t('settings.edit_name_placeholder')}
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

            <SupportTicketModal
                visible={showSupportModal}
                onClose={() => setShowSupportModal(false)}
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
    languagePicker: {
        flexDirection: 'row',
        gap: 6,
    },
    langButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.borderDivider,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    langButtonActive: {
        backgroundColor: Colors.surface,
        borderColor: Colors.accent,
    },
    langFlag: { fontSize: 16 },
});
