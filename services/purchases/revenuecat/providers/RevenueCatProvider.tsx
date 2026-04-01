


import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, { PurchasesEntitlementInfos, PurchasesPackage } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { REVENUECAT_API_KEYS } from "../constants";



interface RevenueCatContextType {
    packages: PurchasesPackage[];
    presentPaywall: () => Promise<PAYWALL_RESULT>;
    getUserEntitlements: () => Promise<PurchasesEntitlementInfos>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);



interface RevenueCatProviderProps {
    children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);

    useEffect(() => {
        const init = async () => {
            const apiKey = Platform.OS === "ios"
                ? REVENUECAT_API_KEYS.ios
                : REVENUECAT_API_KEYS.android;

            Purchases.configure({ apiKey });
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            loadOfferings();
        };
        init();
    }, []);

    const loadOfferings = async () => {
        const offerings = await Purchases.getOfferings();
        setPackages(offerings.current?.availablePackages ?? []);
    };

    const getUserEntitlements = async () => {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements;
    };


    const presentPaywall = async () => {

        // Present paywall for current offering:
        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: "Discipl Premium"
        });

        return paywallResult;
    }

    return (
        <RevenueCatContext.Provider value={{ packages, presentPaywall, getUserEntitlements }}>
            {children}
        </RevenueCatContext.Provider>
    );
}

export const useRevenueCat = () => {
    const ctx = useContext(RevenueCatContext);
    if (!ctx) throw new Error("useRevenueCat must be used within RevenueCatProvider");
    return ctx;
}

