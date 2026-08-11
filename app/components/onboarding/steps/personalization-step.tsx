import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';

import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { useUserDataStore } from '@/stores/UserDataStore';

// Checklisten-Phasen — Fortschritt läuft rein zeitgesteuert; die Einstellungen
// liegen längst im Store, der Step inszeniert das Zuschneiden der App
const PHASES = [
    { threshold: 0, labelKey: 'onboarding.personalization.stage_profile' },
    { threshold: 30, labelKey: 'onboarding.personalization.stage_visions' },
    { threshold: 55, labelKey: 'onboarding.personalization.stage_reminders' },
    { threshold: 80, labelKey: 'onboarding.personalization.stage_widget' },
] as const;

const MIN_DURATION_MS = 7000;
const COMPLETED_HOLD_MS = 1400;

export function PersonalizationStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const name = useUserDataStore((s) => s.name);
    const notificationsPerDay = useUserDataStore((s) => s.notificationsPerDay);

    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef(Date.now());

    // Progress tick — crawls to 90% over ~7s so the screen stays up
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return Math.min(90, prev + 1.4);
            });
        }, 100);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    // Sprint to 100% — but only after MIN_DURATION_MS from mount
    useEffect(() => {
        const elapsed = Date.now() - startedAt.current;
        const delay = Math.max(0, MIN_DURATION_MS - elapsed);
        const timeout = setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            const sprint = setInterval(() => {
                setProgress(prev => Math.min(100, prev + 5));
            }, 16);
            intervalRef.current = sprint;
        }, delay);
        return () => clearTimeout(timeout);
    }, []);

    const isCompleted = progress >= 100;
    // Letzte Phase, deren Schwelle erreicht ist; completed hakt alles ab
    const activeIndex = isCompleted
        ? PHASES.length
        : PHASES.reduce((acc, p, i) => (progress >= p.threshold ? i : acc), 0);

    // Haptik rastet mit der Checkliste ein: Tick pro Phase, Success am Ende
    const prevIndexRef = useRef(0);
    useEffect(() => {
        const prev = prevIndexRef.current;
        prevIndexRef.current = activeIndex;
        if (activeIndex <= prev) return;
        if (isCompleted) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [activeIndex, isCompleted]);

    // Check-Moment kurz stehen lassen, dann weiter
    useEffect(() => {
        if (!isCompleted) return;
        const timer = setTimeout(nextStep, COMPLETED_HOLD_MS);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompleted]);

    const title = name
        ? t('onboarding.personalization.title_with_name', { name })
        : t('onboarding.personalization.title');

    return (
        <View style={styles.root}>
            {/* ── Completed-Overlay: Rest fadet weg, Check fadet rein ── */}
            {isCompleted && (
                <Animated.View entering={FadeIn.delay(150).duration(350)} style={[StyleSheet.absoluteFill, styles.content]}>
                    <Animated.View entering={ZoomIn.delay(200).duration(350)} style={styles.doneBadge}>
                        <MaterialIcons name="check" size={44} color="white" />
                    </Animated.View>
                    <Text style={styles.title}>{t('onboarding.personalization.stage_done')}</Text>
                </Animated.View>
            )}

            {!isCompleted && (
                <Animated.View exiting={FadeOut.duration(250)} style={[StyleSheet.absoluteFill, styles.content]}>
                    <Text style={styles.title}>{title}</Text>

                    {/* ── Phasen-Checkliste: ✓ erledigt, Spinner aktiv, offen muted ── */}
                    <View style={styles.phases}>
                        {PHASES.map((phase, i) => {
                            const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
                            return (
                                <Animated.View
                                    key={phase.labelKey}
                                    entering={FadeInDown.delay(i * 120 + 200).duration(400)}
                                    style={styles.phaseRow}
                                >
                                    <View style={styles.phaseIcon}>
                                        {/* key remountet beim Zustandswechsel → Icon poppt weich rein */}
                                        <Animated.View key={state} entering={ZoomIn.duration(250)}>
                                            {state === 'done' && (
                                                <View style={styles.checkBadge}>
                                                    <MaterialIcons name="check" size={16} color="white" />
                                                </View>
                                            )}
                                            {state === 'active' && (
                                                <ActivityIndicator size="small" color={Colors.accent} />
                                            )}
                                            {state === 'pending' && (
                                                <Ionicons name="ellipse-outline" size={22} color={Colors.borderDivider} />
                                            )}
                                        </Animated.View>
                                    </View>
                                    <Animated.View key={`label-${state}`} entering={FadeIn.duration(300)}>
                                        <Text
                                            style={[
                                                styles.phaseLabel,
                                                state === 'active' && styles.phaseActive,
                                                state === 'done' && styles.phaseDone,
                                            ]}
                                        >
                                            {t(phase.labelKey, { perDay: notificationsPerDay })}
                                        </Text>
                                    </Animated.View>
                                </Animated.View>
                            );
                        })}
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 28,
    },
    title: {
        fontFamily: Fonts.serifBold,
        fontSize: 28,
        lineHeight: 36,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    phases: {
        gap: 22,
        alignSelf: 'center',
    },
    phaseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    phaseIcon: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBadge: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    phaseLabel: {
        fontFamily: Fonts.sans,
        fontSize: 16,
        lineHeight: 24,
        color: Colors.textMuted,
    },
    phaseActive: {
        fontFamily: Fonts.sansSemiBold,
        color: Colors.textHeadline,
    },
    phaseDone: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
});
