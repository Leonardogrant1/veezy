import { trackerManager } from '@/lib/tracking/tracker-manager';
import { devError, devLog } from "@/utils/dev-log";
import { type PaywallState, type SubscriptionStatus, type UserAttributes, usePlacement, useUser } from "expo-superwall";
import { createContext, useContext } from "react";


const SuperwallFunctionsContext = createContext<{
    openWithPlacement: (placement: string, onFeature?: () => void) => Promise<void>;
    placementState: PaywallState;
    identify: (userId: string) => Promise<void>;
    signOut: () => Promise<void>;
    subscriptionStatus: SubscriptionStatus;
    user: UserAttributes | null | undefined;
    update: (attributes: Record<string, any> | ((old: Record<string, any>) => Record<string, any>)) => Promise<void>;
    refresh: () => Promise<Record<string, any>>;
    getEntitlements: () => Promise<any>;
    setSubscriptionStatus: (status: SubscriptionStatus) => Promise<void>;
}>({
    openWithPlacement: async () => { },
    placementState: {
        status: "idle"
    },
    identify: async () => { },
    signOut: async () => { },
    subscriptionStatus: { status: "UNKNOWN" },
    user: null,
    update: async () => { },
    refresh: async () => ({}),
    getEntitlements: async () => ({ active: [], inactive: [] }),
    setSubscriptionStatus: async () => { },
});

export const useSuperwallFunctions = () => {
    const context = useContext(SuperwallFunctionsContext);
    if (!context) {
        throw new Error("useSuperwallFunctions must be used within a SuperwallFunctionsProvider");
    }
    return context;
};

export const SuperwallFunctionsProvider = ({ children }: { children: React.ReactNode }) => {


    const { registerPlacement, state: placementState } = usePlacement({
        onError: (err) => devError("Placement Error:", err),
        onPresent: (info) => {
            devLog("Paywall Presented:", info);
            trackerManager.track('paywall_presented', { paywall_name: info?.name ?? 'unknown' });
        },
        onDismiss: (info, result) => {
            devLog("Paywall Dismissed:", info, "Result:", result);
            const eventName = result?.type === 'purchased' ? 'paywall_purchased'
                : result?.type === 'restored' ? 'paywall_restored'
                    : 'paywall_declined';
            trackerManager.track(eventName, { paywall_name: info?.name ?? 'unknown', result: result?.type });
        },
    });
    const openWithPlacement = async (placement: string, onFeature?: () => void) => {
        trackerManager.track('paywall_opened', { placement });
        await registerPlacement({
            placement: placement,
            feature: onFeature
        });
    };


    const {
        identify: superwallIdentify,
        signOut: superwallSignOut,
        subscriptionStatus,
        user,
        update: superwallUpdate,
        refresh: superwallRefresh,
        getEntitlements: superwallGetEntitlements,
        setSubscriptionStatus: superwallSetSubscriptionStatus
    } = useUser();

    const identify = async (userId: string) => {
        await superwallIdentify(userId);
    };

    const signOut = async () => {
        await superwallSignOut();
    };

    const update = async (attributes: Record<string, any> | ((old: Record<string, any>) => Record<string, any>)) => {
        await superwallUpdate(attributes);
    };

    const refresh = async () => {
        return await superwallRefresh();
    };

    const getEntitlements = async () => {
        return await superwallGetEntitlements();
    };

    const setSubscriptionStatus = async (status: SubscriptionStatus) => {
        await superwallSetSubscriptionStatus(status);
    };




    return (
        <SuperwallFunctionsContext.Provider value={{
            openWithPlacement,
            placementState,
            identify,
            signOut,
            subscriptionStatus,
            user,
            update,
            refresh,
            getEntitlements,
            setSubscriptionStatus,
        }}>
            {children}
        </SuperwallFunctionsContext.Provider>
    );
};