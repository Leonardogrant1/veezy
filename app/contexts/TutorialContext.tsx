import { createContext, useContext, useState } from 'react';

import { trackerManager } from '@/lib/tracking/tracker-manager';

type TutorialContextType = {
    step: number;
    nextStep: () => void;
};

const TutorialContext = createContext<TutorialContextType | null>(null);

export function TutorialProvider({ children, onComplete }: { children: React.ReactNode; onComplete: () => void }) {
    const [step, setStep] = useState(0);

    function nextStep() {
        if (step < 7) {
            setStep((s) => s + 1);
        } else {
            trackerManager.track('tutorial_completed');
            onComplete();
        }
    }

    return (
        <TutorialContext.Provider value={{ step, nextStep }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
    return ctx;
}
