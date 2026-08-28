import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOnboardingControl } from '@/components/onboarding/onboarding-control-context';
import { Colors, Fonts } from '@/constants/theme';
import { trackAffiliateCode } from '@/services/affiliate-tracking';
import { useUserDataStore } from '@/stores/UserDataStore';
import { parseReferralClipboard } from '@/utils/referral-clipboard';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error_not_found' | 'error_network';

export function ReferralCodeStep() {
    const { t } = useTranslation();
    const { nextStep } = useOnboardingControl();
    const updateSettings = useUserDataStore((s) => s.updateSettings);
    const existingCode = useUserDataStore((s) => s.referralCode);

    const alreadyRedeemed = !!existingCode;
    const [code, setCode] = useState(existingCode ?? '');
    const [status, setStatus] = useState<SubmitStatus>(alreadyRedeemed ? 'success' : 'idle');
    const [clipboardMiss, setClipboardMiss] = useState(false);
    const clipboardChecked = useRef(false);

    const focusOffset = useRef(new Animated.Value(0)).current;

    function handleFocus() {
        Animated.timing(focusOffset, {
            toValue: -130,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }

    function handleBlur() {
        Animated.timing(focusOffset, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }

    const canSubmit = code.trim().length > 0 && status === 'idle' && !alreadyRedeemed;

    function handleChange(value: string) {
        setCode(value.toUpperCase());
        setClipboardMiss(false);
        if (status === 'error_not_found' || status === 'error_network') {
            setStatus('idle');
        }
    }

    async function submitCode(trimmedCode: string) {
        setStatus('loading');
        const result = await trackAffiliateCode(trimmedCode);
        if (result === 'success') {
            updateSettings({ referralCode: trimmedCode });
            setStatus('success');
            Keyboard.dismiss();
            setTimeout(() => nextStep(), 600);
        } else if (result === 'not_found') {
            setStatus('error_not_found');
        } else {
            setStatus('error_network');
        }
    }

    async function handleSubmit() {
        if (!canSubmit) return;
        await submitCode(code.trim());
    }

    // Clipboard lesen und bei "VEEZY:<CODE>"-Payload direkt einlösen. Auf iOS
    // erst nach dem Primer-Dialog aufrufen — der native Paste-Prompt wirkt
    // dann angefordert statt aufgedrängt.
    async function redeemFromClipboard(userInitiated: boolean) {
        try {
            const text = await Clipboard.getStringAsync();
            const clipboardCode = parseReferralClipboard(text);
            if (!clipboardCode) {
                // Hinweis nur, wenn der User den Read angestoßen hat — beim
                // stillen Android-Read wäre "Kein Code gefunden" kontextlos
                if (userInitiated) setClipboardMiss(true);
                return;
            }
            setCode(clipboardCode);
            await submitCode(clipboardCode);
        } catch {
            // Clipboard verweigert (iOS-Paste-Prompt abgelehnt) — User tippt manuell
        }
    }

    // Auto-Redeem: iOS zeigt vor dem Clipboard-Read einen Primer, weil der
    // native Paste-Prompt sonst abschreckt. Android liest still.
    useEffect(() => {
        if (alreadyRedeemed || clipboardChecked.current) return;
        clipboardChecked.current = true;
        (async () => {
            if (Platform.OS === 'ios') {
                // hasStringAsync triggert den Paste-Prompt nicht — sagt aber nur
                // "irgendein Text liegt da", deshalb die konditionale Primer-Copy
                const hasString = await Clipboard.hasStringAsync().catch(() => false);
                if (!hasString) return;
                Alert.alert(
                    t('onboarding.referral.clipboard_title'),
                    t('onboarding.referral.clipboard_message'),
                    [
                        { text: t('onboarding.referral.clipboard_cancel'), style: 'cancel' },
                        { text: t('onboarding.referral.clipboard_confirm'), onPress: () => redeemFromClipboard(true) },
                    ],
                );
                return;
            }
            await redeemFromClipboard(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showClipboardMiss = clipboardMiss && status === 'idle';
    const showFeedback = showClipboardMiss || status === 'success' || status === 'error_not_found' || status === 'error_network';
    const feedbackText =
        showClipboardMiss
            ? t('onboarding.referral.clipboard_not_found')
            : status === 'success'
                ? t('onboarding.referral.success')
                : status === 'error_not_found'
                    ? t('onboarding.referral.error_not_found')
                    : t('onboarding.referral.error_network');

    return (
        <Pressable style={styles.container} onPress={Keyboard.dismiss}>
            <View style={styles.inner} pointerEvents="box-none">
                <Animated.View style={[styles.content, { transform: [{ translateY: focusOffset }] }]}>
                    <Text style={styles.headline}>{t('onboarding.referral.headline')}</Text>
                    <Text style={styles.subtitle}>{t('onboarding.referral.subtitle')}</Text>
                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, alreadyRedeemed && styles.inputLocked]}
                                value={code}
                                onChangeText={handleChange}
                                placeholder={t('onboarding.referral.placeholder')}
                                placeholderTextColor={Colors.textPlaceholder}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="done"
                                editable={!alreadyRedeemed}
                                onSubmitEditing={handleSubmit}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                selectionColor={Colors.accent}
                                textAlign="center"
                            />
                            <View style={styles.underline} />
                        </View>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!canSubmit}
                            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
                        >
                            {status === 'loading' ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.submitText}>{t('onboarding.referral.submit')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {showFeedback && (
                        <Text style={[styles.feedback, { color: status === 'success' ? '#2E7D32' : showClipboardMiss ? Colors.textMuted : '#C62828' }]}>
                            {feedbackText}
                        </Text>
                    )}
                </Animated.View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
        gap: 8,
    },
    headline: {
        fontFamily: Fonts.serifBold,
        fontSize: 38,
        lineHeight: 50,
        color: Colors.textHeadline,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: Fonts.sans,
        fontSize: 15,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 28,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        fontFamily: Fonts.serifBold,
        fontSize: 26,
        color: Colors.textHeadline,
        paddingVertical: 8,
        width: '100%',
        textAlign: 'center',
    },
    inputLocked: {
        opacity: 0.5,
    },
    underline: {
        width: '100%',
        height: 2,
        backgroundColor: Colors.textHeadline,
        borderRadius: 1,
    },
    submitButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitDisabled: {
        opacity: 0.35,
    },
    submitText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    feedback: {
        marginTop: 12,
        fontFamily: Fonts.sans,
        fontSize: 14,
        textAlign: 'center',
    },
});
