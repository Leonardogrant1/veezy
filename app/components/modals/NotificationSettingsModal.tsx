import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';
import { MotivationStyle } from '@/types/user-data';

const MIN = 1;
const MAX = 10;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const MOTIVATION_OPTIONS: { value: MotivationStyle; label: string; description: string }[] = [
    { value: 'affirmation', label: 'Affirmation', description: 'Positive Bestätigung & ruhige Stärke' },
    { value: 'fuel', label: 'Fuel', description: 'Dringlichkeit & knallharter Antrieb' },
];

export function formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
}

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
                <View style={styles.handle} />
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

type Props = {
    visible: boolean;
    onClose: () => void;
};

export function NotificationSettingsModal({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const notificationsPerDay = useUserDataStore((s) => s.notificationsPerDay);
    const notificationStartHour = useUserDataStore((s) => s.notificationStartHour);
    const notificationEndHour = useUserDataStore((s) => s.notificationEndHour);
    const motivationStyle = useUserDataStore((s) => s.motivationStyle);
    const updateSettings = useUserDataStore((s) => s.updateSettings);

    const [count, setCount] = useState(notificationsPerDay);
    const [startHour, setStartHour] = useState(notificationStartHour);
    const [endHour, setEndHour] = useState(notificationEndHour);
    const [picker, setPicker] = useState<'start' | 'end' | null>(null);

    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            setCount(notificationsPerDay);
            setStartHour(notificationStartHour);
            setEndHour(notificationEndHour);
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    function handleClose() {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
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

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                <Pressable style={styles.backdropPressable} onPress={handleClose}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 24 }]}>
                            <View style={styles.handle} />
                            <Text style={styles.title}>Benachrichtigungen</Text>

                            {/* Frequency & Time */}
                            <View style={styles.card}>
                                <View style={styles.row}>
                                    <Text style={styles.rowLabel}>Pro Tag</Text>
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
                                    <Text style={styles.rowLabel}>Startzeit</Text>
                                    <View style={styles.timeChip}>
                                        <Text style={styles.timeChipText}>{formatHour(startHour)}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.row} onPress={() => setPicker('end')}>
                                    <Text style={styles.rowLabel}>Endzeit</Text>
                                    <View style={styles.timeChip}>
                                        <Text style={styles.timeChipText}>{formatHour(endHour)}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.summary}>
                                {count}x täglich zwischen {formatHour(startHour)} und {formatHour(endHour)}
                            </Text>

                            {/* Motivation Style */}
                            <Text style={styles.sectionLabel}>Motivationsstil</Text>
                            <View style={styles.card}>
                                {MOTIVATION_OPTIONS.map((opt, i) => (
                                    <View key={opt.value}>
                                        {i > 0 && <View style={styles.divider} />}
                                        <TouchableOpacity
                                            style={styles.row}
                                            onPress={() => updateSettings({ motivationStyle: opt.value })}
                                            activeOpacity={0.7}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.rowLabel, motivationStyle === opt.value && styles.rowLabelActive]}>
                                                    {opt.label}
                                                </Text>
                                                <Text style={styles.rowSub}>{opt.description}</Text>
                                            </View>
                                            {motivationStyle === opt.value && (
                                                <MaterialIcons name="check" size={18} color={Colors.accent} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </Animated.View>
                    </Pressable>
                </Pressable>
            </Animated.View>

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
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropPressable: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 20,
        gap: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.borderDivider,
        alignSelf: 'center',
        marginBottom: 4,
    },
    title: {
        color: Colors.textHeadline,
        fontFamily: Fonts.serifBold,
        fontSize: 18,
        marginBottom: 4,
    },
    sectionLabel: {
        color: Colors.textMuted,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 12,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    card: {
        backgroundColor: Colors.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowLabel: {
        color: Colors.text,
        fontFamily: Fonts.sans,
        fontSize: 15,
    },
    rowLabelActive: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
    },
    rowSub: {
        color: Colors.textMuted,
        fontFamily: Fonts.sans,
        fontSize: 12,
        marginTop: 2,
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
        color: Colors.textHeadline,
        fontFamily: Fonts.sansBold,
        fontSize: 16,
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
        color: Colors.text,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 14,
    },
    summary: {
        color: Colors.textMuted,
        fontFamily: Fonts.sans,
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // HourPicker
    hourBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
        color: Colors.textMuted,
        fontFamily: Fonts.sans,
        fontSize: 16,
    },
    hourTextSelected: {
        color: Colors.accent,
        fontFamily: Fonts.sansSemiBold,
    },
});
