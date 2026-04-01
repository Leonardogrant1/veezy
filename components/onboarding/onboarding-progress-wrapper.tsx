import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { trackerManager } from '@/lib/tracking/tracker-manager';
import { useSuperwallFunctions } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { router } from 'expo-router';
import { OnboardingControlContext } from './onboarding-control-context';
import { OnboardingStep } from './types';

type Props = {
    steps: OnboardingStep[];
};

export function OnboardingProgressWrapper({ steps }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [canContinue, setCanContinue] = useState(steps[0].initialCanContinue ?? true);
    const [isLoading, setIsLoading] = useState(false);
    const inFlightRef = useRef(false);
    const { openWithPlacement } = useSuperwallFunctions()

    const opacity = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    const step = steps[currentIndex];
    const StepComponent = step.component;

    const showProgress = step.showProgressIndicator ?? true;
    const showContinue = step.showContinueButton ?? true;
    const continueText = step.continueButtonText ?? 'Continue';
    const isLight = step.theme === 'light';

    function animateIn() {
        opacity.setValue(0);
        translateX.setValue(20);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }

    async function finishOnboarding() {
        trackerManager.track('onboarding_completed');
        useUserDataStore.getState().completeOnboarding();
        await openWithPlacement('onboarding_completed', () => {
            router.replace('/home');
        })
    }

    function advance() {
        if (currentIndex < steps.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setCanContinue(steps[nextIndex].initialCanContinue ?? true);
        } else {
            finishOnboarding()
        }
    }

    function nextStep() {
        if (inFlightRef.current) return;

        if (step.preContinue) {
            inFlightRef.current = true;
            setIsLoading(true);
            step.preContinue().finally(() => {
                inFlightRef.current = false;
                setIsLoading(false);
                advance();
            });
        } else {
            advance();
        }
    }

    useEffect(() => {
        animateIn();
        trackerManager.track('onboarding_step', { step: step.component.name });
    }, [currentIndex]);

    return (
        <OnboardingControlContext.Provider value={{ currentIndex, canContinue, finishOnboarding, setCanContinue, nextStep }}>
            <View style={[styles.container, isLight && styles.containerLight]}>
                {showProgress && (
                    <View style={styles.progressBar}>
                        {steps.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressSegment,
                                    i <= currentIndex && styles.progressSegmentActive,
                                ]}
                            />
                        ))}
                    </View>
                )}

                <Animated.View style={[styles.stepContainer, { opacity, transform: [{ translateX }] }]}>
                    <StepComponent />
                </Animated.View>

                {showContinue && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                isLight && styles.continueButtonLight,
                                (!canContinue || isLoading) && styles.continueButtonDisabled,
                            ]}
                            onPress={nextStep}
                            disabled={!canContinue || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isLight ? 'white' : '#0d0d0d'} />
                            ) : (
                                <Text style={[styles.continueButtonText, isLight && styles.continueButtonTextLight]}>{continueText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </OnboardingControlContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    containerLight: {
        backgroundColor: '#f5f0e6',
    },
    progressBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 60,
        gap: 6,
    },
    progressSegment: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressSegmentActive: {
        backgroundColor: 'white',
    },
    stepContainer: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 48,
    },
    continueButton: {
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueButtonLight: {
        backgroundColor: '#1a1a1a',
    },
    continueButtonDisabled: {
        opacity: 0.35,
    },
    continueButtonText: {
        color: '#0d0d0d',
        fontSize: 16,
        fontWeight: '700',
    },
    continueButtonTextLight: {
        color: 'white',
    },
});
