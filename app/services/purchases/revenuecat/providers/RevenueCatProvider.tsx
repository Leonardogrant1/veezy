import { MediaHandler } from '@/lib/media-handler';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useUserDataStore } from "@/stores/UserDataStore";
import { useVisionStore } from "@/stores/VisionStore";
import { getOrCreateAnonymousId } from "@/utils/anonymous-id";
import { devLog } from '@/utils/dev-log';
import { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import Purchases, { type CustomerInfo, PurchasesPackage } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { PREMIUM_IDENTIFIER, REVENUECAT_API_KEYS } from "../constants";

interface RevenueCatContextType {
    packages: PurchasesPackage[];
    customerInfo: CustomerInfo | null;
    generationCount: number | null;
    presentPaywall: () => Promise<PAYWALL_RESULT>;
    refreshUserInfo: () => Promise<void>;
    refreshGenerationCount: () => Promise<void>;
    hasEntitlement: (entitlement: string) => boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

interface RevenueCatProviderProps {
    children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [generationCount, setGenerationCount] = useState<number | null>(null);

    const fetchGenerationCount = async () => {
        const userId = useUserDataStore.getState().userId;
        if (!userId) return;
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/user-data/generations`, {
                headers: { 'x-rc-user-id': userId },
            });
            if (!res.ok) return;
            const { count } = await res.json();
            setGenerationCount(count);
        } catch {
            // silent fail — count stays null
            devLog("Failed to fetch generation count")
        }
    };

    useEffect(() => {
        const init = async () => {
            const apiKey = Platform.OS === "ios"
                ? REVENUECAT_API_KEYS.ios
                : REVENUECAT_API_KEYS.android;

            const userId = await getOrCreateAnonymousId();

            Purchases.configure({ apiKey });
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            await Purchases.logIn(userId);

            useUserDataStore.setState({ userId });

            const [info] = await Promise.all([
                Purchases.getCustomerInfo(),
                UserCloudSync.restore().catch((e) => { console.log(e); return false; }),
            ]);
            setCustomerInfo(info);
            useUserDataStore.setState({ isPremium: info.entitlements.active[PREMIUM_IDENTIFIER] !== undefined });

            fetchGenerationCount();

            const visions = useVisionStore.getState().visions;
            await Promise.all(visions.map((v) => MediaHandler.resolveUri(v.imagePath).catch(() => { })));
            WidgetBridge.sync(visions).catch(() => { });

            loadOfferings();
        };
        init();

        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') refreshUserInfo();
        });
        return () => sub.remove();
    }, []);

    const loadOfferings = async () => {
        const offerings = await Purchases.getOfferings();
        setPackages(offerings.current?.availablePackages ?? []);
    };

    const hasEntitlement = (entitlement: string) => {
        return customerInfo?.entitlements.active[entitlement] !== undefined;
    };

    const refreshUserInfo = async () => {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        useUserDataStore.setState({ isPremium: info.entitlements.active[PREMIUM_IDENTIFIER] !== undefined });
        await fetchGenerationCount();
    };

    const presentPaywall = async () => {
        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: PREMIUM_IDENTIFIER
        });
        return paywallResult;
    };

    return (
        <RevenueCatContext.Provider value={{ packages, customerInfo, generationCount, presentPaywall, refreshUserInfo, refreshGenerationCount: fetchGenerationCount, hasEntitlement }}>
            {children}
        </RevenueCatContext.Provider>
    );
}

export const useRevenueCat = () => {
    const ctx = useContext(RevenueCatContext);
    if (!ctx) throw new Error("useRevenueCat must be used within RevenueCatProvider");
    return ctx;
};
