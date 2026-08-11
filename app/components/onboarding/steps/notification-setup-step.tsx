import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRef, useState } from 'react';
import { Animated, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { formatHour } from '@/components/modals/NotificationSettingsModal';
import { Colors, Fonts } from '@/constants/theme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useUserDataStore } from '@/stores/UserDataStore';
import { MotivationStyle } from '@/types/user-data';

const MIN = 1;
const MAX = 10;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type HourPickerProps = {
    visible: boolean;
    value: number;
    onSelect: (hour: number) => void;
    onClose: () => void;
};

function HourPicker({ visible, value, onSelect, onClose }: HourPickerProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.hourBackdrop} activeOpacity={1} onPress={onClose} />
            <View style={styles.hourSheet}>
                <View style={styles.hourHandle} />
                <FlatList
                    data={HOURS}
                    keyExtractor={(h) => String(h)}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.hourRow, item === value && styles.hourRowSelected]}
                            onPress={() => { onSelect(item); onClose(); }}
                        >
                            <Text style={[styles.hourText, item === value && styles.hourTextSelected]}>
                                {formatHour(item)}
                            </Text>
                            {item === value && (
                                <MaterialIcons name="check" size={18} color={Colors.accent} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </Modal>
    );
}

export function NotificationSetupStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();

    const EXAMPLES: Record<MotivationStyle, string> = {
        affirmation: t('onboarding.notifications.fallback_affirmation'),
        fuel: t('onboarding.notifications.fallback_fuel'),
    };

    const STYLE_OPTIONS: { value: MotivationStyle; label: string; description: string }[] = [
        { value: 'affirmation', label: t('onboarding.notifications.style_affirmation_label'), description: t('onboarding.notifications.style_affirmation_desc') },
        { value: 'fuel', label: t('onboarding.notifications.style_fuel_label'), description: t('onboarding.notifications.style_fuel_desc') },
    ];
    const { notificationsPerDay, notificationStartHour, notificationEndHour, motivationStyle, updateSettings } =
        useUserDataStore();

    const [count, setCount] = useState(notificationsPerDay);
    const [startHour, setStartHour] = useState(notificationStartHour);
    const [endHour, setEndHour] = useState(notificationEndHour);
    const [style, setStyle] = useState<MotivationStyle>(motivationStyle);
    const [picker, setPicker] = useState<'start' | 'end' | null>(null);
    const [testSent, setTestSent] = useState(false);
    // false = footer button sends the test notification, true = footer button continues
    const [testDone, setTestDone] = useState(false);
    const [sending, setSending] = useState(false);

    const footerOpacity = useRef(new Animated.Value(1)).current;

    const examples = EXAMPLES;

    function swapToContinue() {
        Animated.timing(footerOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
            setTestDone(true);
            Animated.timing(footerOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        });
    }

    function updateCount(next: number) {
        const clamped = Math.max(MIN, Math.min(MAX, next));
        setCount(clamped);
        updateSettings({ notificationsPerDay: clamped });
    }

    function handleStartSelect(hour: number) {
        setStartHour(hour);
        updateSettings({ notificationStartHour: hour });
    }

    function handleEndSelect(hour: number) {
        setEndHour(hour);
        updateSettings({ notificationEndHour: hour });
    }

    function handleStyleSelect(value: MotivationStyle) {
        setStyle(value);
        updateSettings({ motivationStyle: value });
    }

    async function handleTestNotification() {
        if (sending) return;
        setSending(true);
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            trackerManager.track('notification_permission', { status: status === 'granted' ? 'authorized' : 'declined' });
            if (status !== 'granted') {
                swapToContinue(); // denied → still let them continue
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: { title: '✨ veezy', body: examples[style] },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTestSent(true);
            swapToContinue();
        } finally {
            setSending(false);
        }
    }

    return (
        <View style={styles.wrapper}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('onboarding.notifications.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.notifications.subtitle')}</Text>

            <Text style={styles.sectionLabel}>{t('onboarding.notifications.section_frequency')}</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>{t('onboarding.notifications.per_day')}</Text>
                    <View style={styles.counter}>
                        <TouchableOpacity style={styles.counterButton} onPress={() => updateCount(count - 1)}>
                            <MaterialIcons name="remove" size={18} color={Colors.textHeadline} />
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{count}x</Text>
                        <TouchableOpacity style={styles.counterButton} onPress={() => updateCount(count + 1)}>
                            <MaterialIcons name="add" size={18} color={Colors.textHeadline} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={() => setPicker('start')}>
                    <Text style={styles.rowLabel}>{t('onboarding.notifications.start_time')}</Text>
                    <View style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{formatHour(startHour)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={() => setPicker('end')}>
                    <Text style={styles.rowLabel}>{t('onboarding.notifications.end_time')}</Text>
                    <View style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{formatHour(endHour)}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.summary}>
                {t('onboarding.notifications.summary', { count, start: formatHour(startHour), end: formatHour(endHour) })}
            </Text>

            <Text style={styles.sectionLabel}>{t('onboarding.notifications.section_style')}</Text>
            <View style={styles.styleOptions}>
                {STYLE_OPTIONS.map((opt) => {
                    const isSelected = style === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                            onPress={() => handleStyleSelect(opt.value)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.styleHeader}>
                                <Text style={[styles.styleLabel, isSelected && styles.styleLabelSelected]}>
                                    {opt.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkBadge}>
                                        <MaterialIcons name="check" size={13} color="white" />
                                    </View>
                                )}
                            </View>
                            <Text style={styles.styleDescription}>{opt.description}</Text>
                            <View style={[styles.exampleBox, isSelected && styles.exampleBoxSelected]}>
                                <Text style={styles.exampleText}>{examples[opt.value]}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

        </ScrollView>

        <View style={styles.footer}>
            {testSent && <Text style={styles.sentHint}>{t('onboarding.notifications.test_sent')}</Text>}
            <Animated.View style={{ opacity: footerOpacity }}>
                <TouchableOpacity
                    style={[styles.footerButton, sending && styles.footerButtonDisabled]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (testDone) nextStep();
                        else handleTestNotification();
                    }}
                    activeOpacity={0.85}
                    disabled={sending}
                >
                    <Text style={styles.footerButtonText}>
                        {testDone ? t('common.continue') : t('onboarding.notifications.test_button')}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>

        <HourPicker
            visible={picker === 'start'}
            value={startHour}
            onSelect={handleStartSelect}
            onClose={() => setPicker(null)}
        />
        <HourPicker
            visible={picker === 'end'}
            value={endHour}
            onSelect={handleEndSelect}
            onClose={() => setPicker(null)}
        />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 48,
        gap: 10,
    },
    sentHint: {
        fontFamily: Fonts.serifItalic,
        fontSize: 13,
        color: Colors.accent,
        textAlign: 'center',
    },
    footerButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    footerButtonDisabled: {
        opacity: 0.6,
    },
    footerButtonText: {
        color: 'white',
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        fontWeight: '700',
    },
    container: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 32,
        color: Colors.textHeadline,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 21,
        marginBottom: 28,
    },
    sectionLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: Colors.textMuted,
        marginBottom: 10,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        overflow: 'hidden',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowLabel: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.text,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.borderDivider,
        marginHorizontal: 16,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    counterButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.borderDivider,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterValue: {
        fontFamily: Fonts.sansBold,
        fontSize: 16,
        color: Colors.textHeadline,
        minWidth: 26,
        textAlign: 'center',
    },
    timeChip: {
        backgroundColor: Colors.borderDivider,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeChipText: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
        color: Colors.text,
    },
    summary: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 28,
    },
    styleOptions: {
        gap: 10,
        marginBottom: 28,
    },
    styleCard: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.borderCard,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    styleCardSelected: {
        borderColor: Colors.textHeadline,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    styleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    styleLabel: {
        fontFamily: Fonts.sansSemiBold,
        fontSize: 16,
        color: Colors.textMuted,
    },
    styleLabelSelected: {
        color: Colors.textHeadline,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.textHeadline,
        alignItems: 'center',
        justifyContent: 'center',
    },
    styleDescription: {
        fontFamily: Fonts.sans,
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 12,
    },
    exampleBox: {
        backgroundColor: Colors.borderDivider,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    exampleBoxSelected: {
        backgroundColor: Colors.borderCard,
    },
    exampleText: {
        fontFamily: Fonts.serifItalic,
        fontSize: 13,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    // HourPicker
    hourBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    hourSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '55%',
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    hourHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    hourRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    hourRowSelected: {
        backgroundColor: Colors.accentSubtle + '33',
    },
    hourText: {
        fontFamily: Fonts.sans,
        fontSize: 16,
        color: Colors.textMuted,
    },
    hourTextSelected: {
        fontFamily: Fonts.sansSemiBold,
        color: Colors.accent,
    },
});
