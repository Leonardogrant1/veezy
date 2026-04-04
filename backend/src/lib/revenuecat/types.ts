
export interface RCActiveEntitlement {
    object: 'customer.active_entitlement';
    entitlement_id: string;
    expires_at: number | null;
}

export interface RCAttribute {
    object: 'customer.attribute';
    name: string;
    value: string;
    updated_at: number;
}

export interface RCCustomer {
    object: 'customer';
    id: string;
    project_id: string;
    first_seen_at: number;
    last_seen_at: number;
    last_seen_app_version: string | null;
    last_seen_country: string | null;
    last_seen_platform: string | null;
    last_seen_platform_version: string | null;
    active_entitlements: {
        object: 'list';
        items: RCActiveEntitlement[];
    };
    attributes: {
        object: 'list';
        items: RCAttribute[];
    };
}